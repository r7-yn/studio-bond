import { createFileRoute, notFound } from "@tanstack/react-router";
import { loadPublicTrackPage } from "@/orchest/services/seoCatalog";

const publicSiteUrl = import.meta.env["VITE_PUBLIC_SITE_URL"]?.replace(/\/$/, "");

export const Route = createFileRoute("/tracks/$code")({
  loader: async ({ params }) => {
    const track = await loadPublicTrackPage({ data: { code: params.code } });
    if (!track) throw notFound();
    return { track };
  },
  head: ({ loaderData, params }) => {
    const track = loaderData?.track;
    const code = params.code.replace(/^#/, "");
    const url = publicSiteUrl ? `${publicSiteUrl}/tracks/${encodeURIComponent(code)}` : undefined;
    const description =
      track?.description || `استمع إلى ${track?.title ?? "عمل صوتي"} من كتالوج أوركست.`;
    return {
      meta: [
        { title: track ? `${track.title} | ${track.artist} - أوركست` : "عمل صوتي | أوركست" },
        { name: "description", content: description.slice(0, 300) },
        { property: "og:type", content: "music.song" },
        { property: "og:title", content: track?.title ?? "أعمال أوركست الصوتية" },
        { property: "og:description", content: description.slice(0, 300) },
        ...(track?.coverUrl ? [{ property: "og:image", content: track.coverUrl }] : []),
        ...(url ? [{ property: "og:url", content: url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: url ? [{ rel: "canonical", href: url }] : [],
    };
  },
  component: TrackPage,
});

function TrackPage() {
  const { track } = Route.useLoaderData();
  const code = track.code.replace(/^#/, "");
  const orderUrl = `/?order=${encodeURIComponent(code)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: track.title,
    byArtist: { "@type": "MusicGroup", name: track.artist },
    image: track.coverUrl,
    ...(publicSiteUrl ? { url: `${publicSiteUrl}/tracks/${encodeURIComponent(code)}` } : {}),
    inAlbum: { "@type": "MusicAlbum", name: track.categoryLabel || "كتالوج أوركست" },
  };

  return (
    <main dir="rtl" className="min-h-screen bg-o-bg px-4 py-8 text-o-text sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-o-primary hover:underline"
        >
          العودة إلى كتالوج أوركست
        </a>
        <article className="mt-6 grid gap-7 rounded-3xl border border-o-border bg-o-surface p-5 shadow-xl sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:p-8">
          <img
            src={track.coverUrl}
            alt={`غلاف ${track.title}`}
            className="aspect-square w-full rounded-2xl object-cover"
          />
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-o-primary">
              {track.categoryLabel || "أعمال أوركست"}
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{track.title}</h1>
            <p className="mt-3 text-base text-o-muted">المنشد: {track.artist}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-o-border px-3 py-1.5">
                {track.rhythm}
              </span>
              <span className="rounded-full border border-o-border px-3 py-1.5">
                المدة {track.durationFormatted}
              </span>
              <span dir="ltr" className="rounded-full border border-o-border px-3 py-1.5 font-mono">
                {track.code}
              </span>
            </div>
            {track.description && (
              <p className="mt-5 leading-8 text-o-muted">{track.description}</p>
            )}
            {track.audioUrl && (
              <audio
                className="mt-6 w-full"
                controls
                preload="none"
                src={track.audioUrl}
                aria-label={`استمع إلى ${track.title}`}
              >
                متصفحك لا يدعم تشغيل الصوت.
              </audio>
            )}
            <a
              href={orderUrl}
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-o-primary px-5 py-3 text-center font-bold text-o-on-primary hover:bg-o-primary-hover"
            >
              اطلب هذا العمل باسمك
            </a>
          </div>
        </article>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </div>
    </main>
  );
}
