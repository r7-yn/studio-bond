DROP POLICY IF EXISTS "Public Insert Orders" ON public.order_logs;
DROP POLICY IF EXISTS "Public Insert Analytics" ON public.analytics_events;

ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_logs, public.analytics_events, public.site_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
REVOKE ALL ON SEQUENCE public.analytics_events_id_seq FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;
CREATE POLICY "Public Read WhatsApp Setting"
  ON public.site_settings
  FOR SELECT
  USING (key = 'whatsapp_number');

ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_event_type_valid;
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_type_valid
  CHECK (event_type IN ('visit', 'play'));

CREATE TABLE IF NOT EXISTS public.public_request_limits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_kind text NOT NULL CHECK (request_kind IN ('order', 'event')),
  ip_fingerprint text NOT NULL CHECK (ip_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS public_request_limits_created_at_idx
  ON public.public_request_limits (created_at);
CREATE INDEX IF NOT EXISTS public_request_limits_bucket_idx
  ON public.public_request_limits (request_kind, ip_fingerprint, created_at DESC);
ALTER TABLE public.public_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_request_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.public_request_limits TO service_role;
REVOKE ALL ON SEQUENCE public.public_request_limits_id_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.public_request_limits_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.consume_public_request_slot(
  p_request_kind text,
  p_ip_fingerprint text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  request_count integer;
BEGIN
  IF p_request_kind IS NULL
    OR p_ip_fingerprint IS NULL
    OR p_limit IS NULL
    OR p_window_seconds IS NULL
    OR p_request_kind NOT IN ('order', 'event')
    OR p_ip_fingerprint !~ '^[0-9a-f]{64}$'
    OR p_limit < 1 OR p_limit > 1000
    OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid public request limit arguments';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_request_kind || ':' || p_ip_fingerprint, 0)
  );

  DELETE FROM public.public_request_limits
  WHERE created_at < now() - interval '24 hours';

  SELECT COUNT(*)::integer
  INTO request_count
  FROM public.public_request_limits
  WHERE request_kind = p_request_kind
    AND ip_fingerprint = p_ip_fingerprint
    AND created_at >= now() - (p_window_seconds * interval '1 second');

  IF request_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.public_request_limits (request_kind, ip_fingerprint)
  VALUES (p_request_kind, p_ip_fingerprint);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_request_slot(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_request_slot(text, text, integer, integer)
  TO service_role;
