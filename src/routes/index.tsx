import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// The studio app relies on localStorage and the Web Audio API, so it renders in the browser only.
const OrchestApp = lazy(() => import("@/orchest/App"));
const publicSiteUrl = import.meta.env["VITE_PUBLIC_SITE_URL"]?.replace(/\/$/, "");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أوركست | Orchest Studio - زفات خليجية وشيلات فاخرة" },
      {
        name: "description",
        content:
          "منصة أوركست لإنتاج الزفات الخليجية والشيلات الملكية المخصصة بالأسماء وبأعلى جودة صوتية.",
      },
      { property: "og:title", content: "أوركست | Orchest Studio" },
      {
        property: "og:description",
        content: "اصنع مناسبتك ببصمة صوتية ملكية. زفات وشيلات ومقطوعات خاصة حسب الطلب.",
      },
      { property: "og:type", content: "website" },
      ...(publicSiteUrl ? [{ property: "og:url", content: publicSiteUrl }] : []),
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: publicSiteUrl ? [{ rel: "canonical", href: publicSiteUrl }] : [],
  }),
  component: Index,
});

function Loading() {
  return (
    <main className="min-h-screen bg-o-bg px-5 py-16 text-right text-o-text" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm font-bold tracking-[0.18em] text-o-primary">ORCHEST STUDIO</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
          زفات خليجية وشيلات ملكية بصوت يحمل اسم مناسبتك
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-loose text-o-muted">
          اكتشف كتالوج أوركست الصوتي، استمع إلى الأعمال المنشورة، واطلب تنفيذك المخصص بالأسماء من
          استوديو عربي يهتم بالتفاصيل.
        </p>
        <nav className="mt-8 flex flex-wrap gap-3" aria-label="روابط أساسية">
          <a className="rounded-xl bg-o-primary px-5 py-3 font-bold text-black" href="#catalog">
            استكشف الكتالوج
          </a>
          <a className="rounded-xl border border-o-border px-5 py-3 font-bold" href="#contact">
            اطلب عملك الخاص
          </a>
        </nav>
        <section id="catalog" className="mt-20 grid gap-4 sm:grid-cols-3" aria-label="خدمات أوركست">
          <article className="rounded-2xl border border-o-border bg-white/70 p-5">
            <h2 className="text-lg font-black">زفات مخصصة</h2>
            <p className="mt-2 text-sm leading-7 text-o-muted">
              أسماء ومقدمات وصياغة تناسب لحظة الدخول والاحتفال.
            </p>
          </article>
          <article className="rounded-2xl border border-o-border bg-white/70 p-5">
            <h2 className="text-lg font-black">شيلات وترحيب</h2>
            <p className="mt-2 text-sm leading-7 text-o-muted">
              اختيارات صوتية للأعراس والاستقبالات والمناسبات الخليجية.
            </p>
          </article>
          <article className="rounded-2xl border border-o-border bg-white/70 p-5">
            <h2 className="text-lg font-black">تسليم خاص</h2>
            <p className="mt-2 text-sm leading-7 text-o-muted">
              بطاقة صوتية خاصة برابط وQR يمكن مشاركته مع المستلم.
            </p>
          </article>
        </section>
        <section id="contact" className="sr-only" aria-label="التواصل">
          <h2>اطلب تنفيذك الصوتي من أوركست</h2>
          <p>تواصل مع الاستوديو عبر واتساب بعد تحميل الكتالوج التفاعلي.</p>
        </section>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "أوركست | Orchest Studio",
            description: "منصة عربية للزفات الخليجية والشيلات الملكية المخصصة بالأسماء.",
            ...(publicSiteUrl ? { url: publicSiteUrl, logo: `${publicSiteUrl}/icon-512.png` } : {}),
          })}
        </script>
      </div>
    </main>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <OrchestApp />
      </Suspense>
    </ClientOnly>
  );
}
