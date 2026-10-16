import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  const { dispatch } = await import("@/orchest/server/handlers");
  return dispatch(request);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle },
  },
});
