import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// The studio app relies on localStorage and the Web Audio API, so it renders in the browser only.
const OrchestApp = lazy(() => import("@/orchest/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أوركست | Orchest Studio - زفات خليجية وشيلات فاخرة" },
      {
        name: "description",
        content: "منصة أوركست لإنتاج الزفات الخليجية والشيلات الملكية المخصصة بالأسماء وبأعلى جودة صوتية.",
      },
      { property: "og:title", content: "أوركست | Orchest Studio" },
      {
        property: "og:description",
        content: "اصنع مناسبتك ببصمة صوتية ملكية. زفات وشيلات ومقطوعات خاصة حسب الطلب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-o-bg">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-o-border border-t-o-primary" />
    </div>
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
