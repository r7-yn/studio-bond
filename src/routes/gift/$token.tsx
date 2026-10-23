import { createFileRoute } from "@tanstack/react-router";
import { GiftCardPage } from "@/orchest/components/GiftCardPage";

export const Route = createFileRoute("/gift/$token")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { title: "بطاقة إهداء خاصة | Orchest Studio" },
      { name: "description", content: "إهداء صوتي خاص من استوديو أوركست، استمع إليه الآن." },
      { property: "og:title", content: "بطاقة إهداء صوتية خاصة | أوركست" },
      { property: "og:description", content: "وصلك إهداء صوتي خاص من استوديو أوركست." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GiftTokenRoute,
});

function GiftTokenRoute() {
  const { token } = Route.useParams();
  return <GiftCardPage token={token} />;
}
