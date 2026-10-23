-- Publication flag
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS tracks_published_created_at_idx ON public.tracks (is_published, created_at DESC);
DROP POLICY IF EXISTS "Public Only Published Tracks" ON public.tracks;
CREATE POLICY "Public Only Published Tracks" ON public.tracks AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (is_published = true);

-- Secure public submissions (orders/events go through the server)
DROP POLICY IF EXISTS "Public Insert Orders" ON public.order_logs;
DROP POLICY IF EXISTS "Public Insert Analytics" ON public.analytics_events;
REVOKE ALL ON TABLE public.order_logs, public.analytics_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.order_logs, public.analytics_events, public.site_settings TO service_role;
REVOKE ALL ON SEQUENCE public.analytics_events_id_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO service_role;
DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public Read WhatsApp Setting" ON public.site_settings;
CREATE POLICY "Public Read WhatsApp Setting" ON public.site_settings FOR SELECT USING (key = 'whatsapp_number');

CREATE TABLE IF NOT EXISTS public.public_request_limits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_kind text NOT NULL CHECK (request_kind IN ('order', 'event')),
  ip_fingerprint text NOT NULL CHECK (ip_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE public.public_request_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.public_request_limits TO service_role;
ALTER TABLE public.public_request_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS public_request_limits_bucket_idx ON public.public_request_limits (request_kind, ip_fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS public_request_limits_created_at_idx ON public.public_request_limits (created_at);

CREATE OR REPLACE FUNCTION public.consume_public_request_slot(p_request_kind text, p_ip_fingerprint text, p_limit integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE request_count integer;
BEGIN
  IF p_request_kind IS NULL OR p_ip_fingerprint IS NULL OR p_limit IS NULL OR p_window_seconds IS NULL
    OR p_request_kind NOT IN ('order','event') OR p_ip_fingerprint !~ '^[0-9a-f]{64}$'
    OR p_limit < 1 OR p_limit > 1000 OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid public request limit arguments';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_kind || ':' || p_ip_fingerprint, 0));
  DELETE FROM public.public_request_limits WHERE created_at < now() - interval '24 hours';
  SELECT COUNT(*)::integer INTO request_count FROM public.public_request_limits
  WHERE request_kind = p_request_kind AND ip_fingerprint = p_ip_fingerprint
    AND created_at >= now() - (p_window_seconds * interval '1 second');
  IF request_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.public_request_limits (request_kind, ip_fingerprint) VALUES (p_request_kind, p_ip_fingerprint);
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.consume_public_request_slot(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_request_slot(text, text, integer, integer) TO service_role;

-- Admin & gifts
REVOKE ALL ON TABLE public.orchest_admin_users FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public.gift_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  storage_path text NOT NULL UNIQUE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  occasion_type text NOT NULL CHECK (occasion_type IN ('wedding','sheila','newborn','welcome','other')),
  recipient_name text,
  recipient_phone text NOT NULL CHECK (recipient_phone ~ '^[0-9]{8,15}$'),
  greeting text NOT NULL CHECK (length(greeting) BETWEEN 1 AND 700),
  created_by uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);
REVOKE ALL ON TABLE public.gift_deliveries FROM anon, authenticated;
GRANT ALL ON TABLE public.gift_deliveries TO service_role;
ALTER TABLE public.gift_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS gift_deliveries_created_at_idx ON public.gift_deliveries (created_at DESC);
CREATE INDEX IF NOT EXISTS gift_deliveries_created_by_idx ON public.gift_deliveries (created_by);

-- Real counts
CREATE OR REPLACE FUNCTION public.refresh_orchest_catalog_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.categories c SET track_count = (SELECT COUNT(*)::integer FROM public.tracks t WHERE t.category_id = c.id AND t.is_published);
  UPDATE public.artists a SET tracks_count = (SELECT COUNT(*)::integer FROM public.tracks t WHERE t.is_published AND lower(COALESCE(NULLIF(t.artist,''), t.vocalist)) = lower(a.name));
  RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.refresh_orchest_catalog_counts() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS refresh_orchest_catalog_counts_after_track_change ON public.tracks;
CREATE TRIGGER refresh_orchest_catalog_counts_after_track_change AFTER INSERT OR UPDATE OR DELETE ON public.tracks FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_orchest_catalog_counts();
UPDATE public.categories c SET track_count = (SELECT COUNT(*)::integer FROM public.tracks t WHERE t.category_id = c.id AND t.is_published);
UPDATE public.artists a SET tracks_count = (SELECT COUNT(*)::integer FROM public.tracks t WHERE t.is_published AND lower(COALESCE(NULLIF(t.artist,''), t.vocalist)) = lower(a.name));

-- Integrations
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS source_provider text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_video_id text,
  ADD COLUMN IF NOT EXISTS source_url text;
CREATE UNIQUE INDEX IF NOT EXISTS tracks_source_video_unique_idx ON public.tracks (source_provider, source_video_id) WHERE source_provider <> '' AND source_video_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.admin_youtube_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE CASCADE,
  channel_id text NOT NULL UNIQUE,
  channel_title text NOT NULL,
  uploads_playlist_id text NOT NULL,
  access_token_ciphertext text NOT NULL,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'connected',
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE public.admin_youtube_connections FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_youtube_connections TO service_role;
ALTER TABLE public.admin_youtube_connections ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS admin_youtube_connections_admin_unique_idx ON public.admin_youtube_connections (admin_user_id);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE public.push_subscriptions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS push_subscriptions_admin_active_idx ON public.push_subscriptions (admin_user_id, is_active);

CREATE TABLE IF NOT EXISTS public.admin_ai_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE CASCADE,
  question_hash text NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_status text NOT NULL DEFAULT 'fallback',
  needs_review boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE public.admin_ai_audit_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_ai_audit_logs TO service_role;
ALTER TABLE public.admin_ai_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS admin_ai_audit_logs_admin_created_idx ON public.admin_ai_audit_logs (admin_user_id, created_at DESC);