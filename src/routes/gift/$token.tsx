import { createFileRoute } from "@tanstack/react-router";
import { GiftCardPage } from "@/orchest/components/GiftCardPage";

export const Route = createFileRoute("/gift/$token")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { title: "بطاقة إهداء خاصة | Orchest Studio" },
    ],
  }),
  component: GiftTokenRoute,
});

function GiftTokenRoute() {
  const { token } = Route.useParams();
  return <GiftCardPage token={token} />;
}
