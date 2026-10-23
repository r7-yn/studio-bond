CREATE TABLE IF NOT EXISTS public.orchest_admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.orchest_admin_users TO service_role;
ALTER TABLE public.orchest_admin_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tracks_category_id_idx ON public.tracks(category_id);
CREATE INDEX IF NOT EXISTS tracks_created_at_idx ON public.tracks(created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_logs_created_at_idx ON public.order_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS order_logs_status_idx ON public.order_logs(status);
CREATE INDEX IF NOT EXISTS order_logs_track_id_idx ON public.order_logs(track_id);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS artists_sort_order_idx ON public.artists(sort_order);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events(created_at DESC);