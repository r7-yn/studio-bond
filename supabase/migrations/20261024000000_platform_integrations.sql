-- Optional platform integrations for Orchest.
-- Review and apply explicitly: this project is shared by development and production.

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS source_provider text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_video_id text,
  ADD COLUMN IF NOT EXISTS source_url text;

CREATE UNIQUE INDEX IF NOT EXISTS tracks_source_video_unique_idx
  ON public.tracks (source_provider, source_video_id)
  WHERE source_provider <> '' AND source_video_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.admin_youtube_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE CASCADE,
  channel_id text NOT NULL UNIQUE CHECK (length(channel_id) BETWEEN 1 AND 80),
  channel_title text NOT NULL CHECK (length(channel_title) BETWEEN 1 AND 200),
  uploads_playlist_id text NOT NULL CHECK (length(uploads_playlist_id) BETWEEN 1 AND 100),
  access_token_ciphertext text NOT NULL,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'needs_reauth', 'error', 'disconnected')),
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_youtube_connections_admin_idx
  ON public.admin_youtube_connections (admin_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS admin_youtube_connections_admin_unique_idx
  ON public.admin_youtube_connections (admin_user_id);
ALTER TABLE public.admin_youtube_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_youtube_connections FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_youtube_connections TO service_role;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (length(endpoint) BETWEEN 20 AND 2048),
  p256dh text NOT NULL CHECK (length(p256dh) BETWEEN 20 AND 500),
  auth text NOT NULL CHECK (length(auth) BETWEEN 10 AND 500),
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_admin_active_idx
  ON public.push_subscriptions (admin_user_id, is_active);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.push_subscriptions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;

CREATE TABLE IF NOT EXISTS public.admin_ai_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE CASCADE,
  question_hash text NOT NULL CHECK (question_hash ~ '^[0-9a-f]{64}$'),
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_status text NOT NULL DEFAULT 'fallback',
  needs_review boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_ai_audit_logs_admin_created_idx
  ON public.admin_ai_audit_logs (admin_user_id, created_at DESC);
ALTER TABLE public.admin_ai_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_ai_audit_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_ai_audit_logs TO service_role;
