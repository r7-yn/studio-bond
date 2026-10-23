import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin = (process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
if (!origin || !/^https:\/\//i.test(origin)) {
  console.warn("[SEO] PUBLIC_SITE_URL is not configured; skipping absolute sitemap generation.");
  process.exit(0);
}

const outputDir = join(process.cwd(), ".output", "public");
await mkdir(outputDir, { recursive: true });
const urls = [origin + "/"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(join(outputDir, "sitemap.xml"), sitemap, "utf8");

const baseRobots = await readFile(join(process.cwd(), "public", "robots.txt"), "utf8");
const robots = `${baseRobots.trimEnd()}\nSitemap: ${origin}/sitemap.xml\n`;
await writeFile(join(outputDir, "robots.txt"), robots, "utf8");
console.log(`[SEO] Generated sitemap and robots for ${origin}`);
