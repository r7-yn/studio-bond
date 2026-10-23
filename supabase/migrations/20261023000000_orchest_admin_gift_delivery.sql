-- Orchest admin authorization and private QR gift deliveries.
-- This migration is intentionally not applied automatically: development and
-- production share this Supabase project, so review/approval is required.

CREATE TABLE IF NOT EXISTS public.orchest_admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orchest_admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.orchest_admin_users FROM anon, authenticated;
GRANT ALL ON TABLE public.orchest_admin_users TO service_role;

CREATE TABLE IF NOT EXISTS public.gift_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  storage_path text NOT NULL UNIQUE CHECK (
    storage_path ~ '^deliveries/[0-9a-f-]{36}/[0-9a-f]{32}\.(mp3|m4a|aac|wav|ogg|webm)$'
  ),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  occasion_type text NOT NULL CHECK (occasion_type IN ('wedding', 'sheila', 'newborn', 'welcome', 'other')),
  recipient_name text CHECK (recipient_name IS NULL OR length(recipient_name) <= 120),
  recipient_phone text NOT NULL CHECK (recipient_phone ~ '^[0-9]{8,15}$'),
  greeting text NOT NULL CHECK (length(greeting) BETWEEN 1 AND 700),
  created_by uuid NOT NULL REFERENCES public.orchest_admin_users (user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS gift_deliveries_created_at_idx
  ON public.gift_deliveries (created_at DESC);
CREATE INDEX IF NOT EXISTS gift_deliveries_created_by_idx
  ON public.gift_deliveries (created_by);
ALTER TABLE public.gift_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gift_deliveries FROM anon, authenticated;
GRANT ALL ON TABLE public.gift_deliveries TO service_role;

-- Covers the existing order_logs -> tracks foreign key used by admin filters
-- and avoids sequential scans as the order log grows.
CREATE INDEX IF NOT EXISTS order_logs_track_id_idx
  ON public.order_logs (track_id);

-- This bucket name is reserved for gift files and must remain private.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'orchest-gifts' AND public = true
  ) THEN
    RAISE EXCEPTION 'orchest-gifts bucket already exists as public; review it before migration';
  END IF;
END
$$;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'orchest-gifts',
  'orchest-gifts',
  false,
  31457280,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Counts shown publicly must reflect actual published database rows rather
-- than the inflated demo counters included in the original seed migration.
UPDATE public.categories AS category
SET track_count = (
  SELECT COUNT(*)::integer
  FROM public.tracks AS track
  WHERE track.category_id = category.id AND track.is_published = true
);
UPDATE public.artists AS artist
SET tracks_count = (
  SELECT COUNT(*)::integer
  FROM public.tracks AS track
  WHERE track.is_published = true
    AND lower(COALESCE(NULLIF(track.artist, ''), track.vocalist)) = lower(artist.name)
);

CREATE OR REPLACE FUNCTION public.refresh_orchest_catalog_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.categories AS category
  SET track_count = (
    SELECT COUNT(*)::integer
    FROM public.tracks AS track
    WHERE track.category_id = category.id AND track.is_published = true
  );
  UPDATE public.artists AS artist
  SET tracks_count = (
    SELECT COUNT(*)::integer
    FROM public.tracks AS track
    WHERE track.is_published = true
      AND lower(COALESCE(NULLIF(track.artist, ''), track.vocalist)) = lower(artist.name)
  );
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_orchest_catalog_counts() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS refresh_orchest_catalog_counts_after_track_change ON public.tracks;
CREATE TRIGGER refresh_orchest_catalog_counts_after_track_change
AFTER INSERT OR UPDATE OR DELETE ON public.tracks
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_orchest_catalog_counts();
