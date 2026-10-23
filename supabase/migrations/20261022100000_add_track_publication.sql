ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS tracks_published_created_at_idx
  ON public.tracks (is_published, created_at DESC);

-- Restrictive policies are combined with every permissive SELECT policy, so
-- older broad catalog policies cannot expose unpublished rows to visitors.
DROP POLICY IF EXISTS "Public Only Published Tracks" ON public.tracks;
CREATE POLICY "Public Only Published Tracks"
  ON public.tracks
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
