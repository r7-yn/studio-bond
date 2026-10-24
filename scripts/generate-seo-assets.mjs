import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin = (process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || "")
  .trim()
  .replace(/\/$/, "");
if (!origin || !/^https:\/\//i.test(origin)) {
  console.warn("[SEO] PUBLIC_SITE_URL is not configured; skipping absolute sitemap generation.");
  process.exit(0);
}

const outputDir = join(process.cwd(), ".output", "public");
await mkdir(outputDir, { recursive: true });
const urls = new Set([`${origin}/`]);
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(
  /\/$/,
  "",
);
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (supabaseUrl && publicKey) {
  try {
    const headers = { apikey: publicKey, Accept: "application/json" };
    const [tracksResponse, categoriesResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/tracks?select=code&is_published=eq.true&limit=10000`, {
        headers,
      }),
      fetch(
        `${supabaseUrl}/rest/v1/categories?select=slug,track_count&track_count=gt.0&limit=1000`,
        { headers },
      ),
    ]);
    if (!tracksResponse.ok || !categoriesResponse.ok) {
      throw new Error(
        `Supabase REST returned ${tracksResponse.status}/${categoriesResponse.status}`,
      );
    }
    const [tracks, categories] = await Promise.all([
      tracksResponse.json(),
      categoriesResponse.json(),
    ]);
    for (const row of tracks) {
      if (typeof row.code !== "string") continue;
      const code = row.code.replace(/^#/, "").trim();
      if (/^[A-Za-z0-9-]{1,80}$/.test(code))
        urls.add(`${origin}/tracks/${encodeURIComponent(code)}`);
    }
    for (const row of categories) {
      if (typeof row.slug === "string" && /^[\p{L}\p{N}-]{1,120}$/u.test(row.slug)) {
        urls.add(`${origin}/category/${encodeURIComponent(row.slug)}`);
      }
    }
  } catch (error) {
    console.warn(
      "[SEO] Could not enumerate Supabase routes for sitemap; publishing the home route only.",
      error instanceof Error ? error.message : "unknown error",
    );
  }
} else {
  console.warn(
    "[SEO] Supabase public credentials are not configured; sitemap contains the home route only.",
  );
}

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
  ...urls,
]
  .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
  .join("\n")}\n</urlset>\n`;
await writeFile(join(outputDir, "sitemap.xml"), sitemap, "utf8");

const baseRobots = await readFile(join(process.cwd(), "public", "robots.txt"), "utf8");
const robots = `${baseRobots.trimEnd()}\nSitemap: ${origin}/sitemap.xml\n`;
await writeFile(join(outputDir, "robots.txt"), robots, "utf8");
console.log(`[SEO] Generated sitemap with ${urls.size} public URLs and robots for ${origin}`);
