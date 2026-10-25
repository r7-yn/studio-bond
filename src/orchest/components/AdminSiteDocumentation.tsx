import { useMemo, useState } from "react";
import { BookOpen, Download, Search, ShieldCheck } from "lucide-react";
import type { ThemeMode } from "../types/index";
import guideSource from "../data/orchestSiteGuide.ar.json?raw";

interface GuideFeature {
  title: string;
  description: string;
  details: string[];
}

interface GuideSection {
  id: string;
  title: string;
  summary: string;
  features: GuideFeature[];
}

interface GuideDocument {
  title: string;
  subtitle: string;
  status: string;
  asOf: string;
  sections: GuideSection[];
}

const guide = JSON.parse(guideSource) as GuideDocument;

function toMarkdown(document: GuideDocument) {
  const lines = [
    `# ${document.title}`,
    "",
    `> ${document.status} · آخر مراجعة: ${document.asOf}`,
    "",
    document.subtitle,
    "",
  ];

  for (const section of document.sections) {
    lines.push(`## ${section.title}`, "", section.summary, "");
    for (const feature of section.features) {
      lines.push(`### ${feature.title}`, "", feature.description, "");
      for (const detail of feature.details) lines.push(`- ${detail}`);
      if (feature.details.length) lines.push("");
    }
  }

  return lines.join("\n");
}

export function AdminSiteDocumentation({ theme }: { theme: ThemeMode }) {
  const [query, setQuery] = useState("");
  const isDark = theme === "dark";
  const panelClass = isDark
    ? "border-white/10 bg-[#16161C] text-white"
    : "border-black/10 bg-white text-gray-900 shadow-sm";
  const mutedClass = isDark ? "text-gray-400" : "text-gray-600";

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");
    if (!normalized) return guide.sections;
    return guide.sections.filter((section) => {
      const text = [
        section.title,
        section.summary,
        ...section.features.flatMap((feature) => [
          feature.title,
          feature.description,
          ...feature.details,
        ]),
      ]
        .join(" ")
        .toLocaleLowerCase("ar");
      return text.includes(normalized);
    });
  }, [query]);

  const downloadCopy = () => {
    const blob = new Blob(["\uFEFF", toMarkdown(guide)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ORCHEST_SITE_GUIDE_AR_REVIEW.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section dir="rtl" className="space-y-5" aria-labelledby="orchest-guide-title">
      <header className={`rounded-2xl border p-5 sm:p-7 ${panelClass}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 id="orchest-guide-title" className="text-lg font-extrabold sm:text-xl">
                  {guide.title}
                </h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-500">
                  {guide.status}
                </span>
              </div>
              <p className={`max-w-3xl text-sm leading-7 ${mutedClass}`}>{guide.subtitle}</p>
              <p className={`mt-2 text-xs ${mutedClass}`}>آخر مراجعة للمحتوى: {guide.asOf}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadCopy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#efcf62]"
          >
            <Download className="h-4 w-4" />
            تنزيل نسخة مراجعة
          </button>
        </div>
        <div
          className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-xs leading-6 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-gray-50"}`}
        >
          <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#D4AF37]" />
          <p className={mutedClass}>
            يفرّق هذا الدليل بين الوظائف الموجودة في الشيفرة والخدمات التي تحتاج إعداداً أو بيانات.
            لا يتضمن مفاتيح أو كلمات مرور. هذه نسخة للمراجعة، ولم تُرفع بعد إلى المستودع أو Google
            Drive.
          </p>
        </div>
      </header>

      <div className={`rounded-2xl border p-3 sm:p-4 ${panelClass}`}>
        <label htmlFor="orchest-guide-search" className="sr-only">
          البحث داخل التوثيق
        </label>
        <div className="relative">
          <Search className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} />
          <input
            id="orchest-guide-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث عن ميزة، إعداد، تكامل أو مسار…"
            className={`w-full rounded-xl border py-3 pl-4 pr-10 text-sm outline-none focus:border-[#D4AF37] ${isDark ? "border-white/10 bg-black/20 text-white placeholder:text-gray-500" : "border-black/10 bg-gray-50 text-gray-900 placeholder:text-gray-500"}`}
          />
        </div>
        <p className={`mt-2 px-1 text-xs ${mutedClass}`}>
          {query.trim()
            ? `نتائج البحث: ${filteredSections.length} من ${guide.sections.length} أقسام`
            : `${guide.sections.length} قسماً يشرح تجربة الزائر والإدارة والتكاملات والحدود الحالية`}
        </p>
      </div>

      {filteredSections.length === 0 ? (
        <div className={`rounded-2xl border p-8 text-center text-sm ${panelClass} ${mutedClass}`}>
          لا توجد نتائج مطابقة. جرّب كلمة أقصر أو ابحث باسم الميزة.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section, index) => (
            <article key={section.id} className={`rounded-2xl border p-5 sm:p-6 ${panelClass}`}>
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-xs font-black text-[#D4AF37]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-extrabold">{section.title}</h3>
                  <p className={`mt-1 text-sm leading-6 ${mutedClass}`}>{section.summary}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {section.features.map((feature) => (
                  <div
                    key={feature.title}
                    className={`rounded-xl border p-4 ${isDark ? "border-white/[0.08] bg-black/15" : "border-black/[0.08] bg-gray-50/80"}`}
                  >
                    <h4 className="text-sm font-bold text-[#D4AF37]">{feature.title}</h4>
                    <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>{feature.description}</p>
                    {feature.details.length > 0 && (
                      <ul
                        className={`mt-3 list-inside list-disc space-y-1.5 text-xs leading-6 ${mutedClass}`}
                      >
                        {feature.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
