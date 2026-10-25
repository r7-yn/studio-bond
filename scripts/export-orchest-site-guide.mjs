import { readFile, writeFile } from "node:fs/promises";

const dataUrl = new URL("../src/orchest/data/orchestSiteGuide.ar.json", import.meta.url);
const outputUrl = new URL("../docs/ORCHEST_SITE_GUIDE_AR.md", import.meta.url);
const guide = JSON.parse(await readFile(dataUrl, "utf8"));

const lines = [
  `# ${guide.title}`,
  "",
  `> ${guide.status} · آخر مراجعة: ${guide.asOf}`,
  "",
  guide.subtitle,
  "",
];

for (const section of guide.sections) {
  lines.push(`## ${section.title}`, "", section.summary, "");
  for (const feature of section.features) {
    lines.push(`### ${feature.title}`, "", feature.description, "");
    for (const detail of feature.details ?? []) lines.push(`- ${detail}`);
    if (feature.details?.length) lines.push("");
  }
}

await writeFile(outputUrl, lines.join("\n"), "utf8");
console.log(`Wrote ${outputUrl.pathname}`);
