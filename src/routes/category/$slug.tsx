import { createFileRoute, notFound } from "@tanstack/react-router";
import { loadPublicCategoryPage } from "@/orchest/services/seoCatalog";

const publicSiteUrl = import.meta.env["VITE_PUBLIC_SITE_URL"]?.replace(/\/$/, "");

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const page = await loadPublicCategoryPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData, params }) => {
    const category = loaderData?.category;
    const url = publicSiteUrl
      ? `${publicSiteUrl}/category/${encodeURIComponent(params.slug)}`
      : undefined;
    const description =
      category?.description || `تصفح أعمال ${category?.name ?? "أوركست"} الصوتية.`;
    return {
      meta: [
        { title: category ? `${category.name} | زفات وشيلات أوركست` : "تصنيف أوركست" },
        { name: "description", content: description.slice(0, 300) },
        { property: "og:type", content: "website" },
        { property: "og:title", content: category?.name ?? "تصنيفات أوركست" },
        { property: "og:description", content: description.slice(0, 300) },
        ...(category?.image ? [{ property: "og:image", content: category.image }] : []),
        ...(url ? [{ property: "og:url", content: url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: url ? [{ rel: "canonical", href: url }] : [],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category, tracks } = Route.useLoaderData();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    ...(publicSiteUrl
      ? { url: `${publicSiteUrl}/category/${encodeURIComponent(category.slug || category.id)}` }
      : {}),
  };

  return (
    <main dir="rtl" className="min-h-screen bg-o-bg px-4 py-8 text-o-text sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-o-primary hover:underline"
        >
          العودة إلى كتالوج أوركست
        </a>
        <header className="mt-6 overflow-hidden rounded-3xl border border-o-border bg-o-surface">
          <div className="grid md:grid-cols-[1fr_1.4fr]">
            <img
              src={category.image}
              alt={category.name}
              className="aspect-[16/9] h-full w-full object-cover md:aspect-auto"
            />
            <div className="p-6 sm:p-9">
              <p className="text-sm font-bold text-o-primary">تصفح حسب المناسبة</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{category.name}</h1>
              <p className="mt-4 max-w-2xl leading-8 text-o-muted">{category.description}</p>
              <p className="mt-4 text-sm font-semibold">
                {category.count.toLocaleString("ar-SA")} عملاً منشوراً
              </p>
            </div>
          </div>
        </header>

        <section className="mt-10" aria-labelledby="category-tracks-heading">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 id="category-tracks-heading" className="text-2xl font-black">
              أعمال هذا التصنيف
            </h2>
            <span className="text-sm text-o-muted">
              {tracks.length} من أصل {category.count}
            </span>
          </div>
          {tracks.length === 0 ? (
            <p className="rounded-2xl border border-o-border bg-o-surface p-6 text-o-muted">
              لا توجد أعمال منشورة في هذا التصنيف حالياً.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track) => {
                const code = track.code.replace(/^#/, "");
                return (
                  <article
                    key={track.id}
                    className="overflow-hidden rounded-2xl border border-o-border bg-o-surface"
                  >
                    <a href={`/tracks/${encodeURIComponent(code)}`} className="block">
                      <img
                        src={track.coverUrl}
                        alt={`غلاف ${track.title}`}
                        loading="lazy"
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold">{track.title}</h3>
                        <p className="mt-1 text-sm text-o-muted">المنشد: {track.artist}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-o-muted">
                          <span>{track.rhythm}</span>
                          <span>•</span>
                          <span>{track.durationFormatted}</span>
                        </div>
                      </div>
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </div>
    </main>
  );
}
