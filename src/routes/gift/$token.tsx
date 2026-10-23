import { createFileRoute } from "@tanstack/react-router";
import { GiftCardPage } from "@/orchest/components/GiftCardPage";

export const Route = createFileRoute("/gift/$token")({
  head: () => {
    const publicSiteUrl = import.meta.env["VITE_PUBLIC_SITE_URL"]?.replace(/\/$/, "");
    const previewImage = publicSiteUrl ? `${publicSiteUrl}/icon-512.png` : undefined;
    return {
      meta: [
        { title: "بطاقة إهداء صوتية خاصة | Orchest Studio" },
        {
          name: "description",
          content: "بطاقة إهداء صوتية خاصة من Orchest Studio، افتحها واستمع إلى الرسالة المخصصة.",
        },
        { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
        { name: "googlebot", content: "noindex, nofollow, noarchive, nosnippet" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Orchest Studio" },
        { property: "og:title", content: "بطاقة إهداء صوتية خاصة | Orchest Studio" },
        {
          property: "og:description",
          content: "بطاقة إهداء صوتية خاصة من Orchest Studio، افتحها واستمع إلى الرسالة المخصصة.",
        },
        ...(previewImage ? [{ property: "og:image", content: previewImage }] : []),
        { name: "twitter:card", content: previewImage ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: "بطاقة إهداء صوتية خاصة | Orchest Studio" },
        {
          name: "twitter:description",
          content: "بطاقة إهداء صوتية خاصة من Orchest Studio، افتحها واستمع إلى الرسالة المخصصة.",
        },
        ...(previewImage ? [{ name: "twitter:image", content: previewImage }] : []),
      ],
    };
  },
  component: GiftTokenRoute,
});

function GiftTokenRoute() {
  const { token } = Route.useParams();
  return <GiftCardPage token={token} />;
}
