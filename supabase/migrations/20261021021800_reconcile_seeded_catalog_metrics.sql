UPDATE public.categories AS category
SET track_count = (
  SELECT COUNT(*)::integer
  FROM public.tracks AS track
  WHERE track.category_id = category.id
);

UPDATE public.tracks
SET plays_count = 0,
    likes_count = 0
WHERE id IN (
  'orc-204', 'orc-218', 'orc-109', 'orc-305', 'orc-201', 'orc-256',
  'orc-402', 'orc-405', 'orc-278', 'orc-311', 'orc-501', 'orc-222'
);

UPDATE public.artists AS artist
SET total_streams = 0,
    tracks_count = (
      SELECT COUNT(*)::integer
      FROM public.tracks AS track
      WHERE COALESCE(NULLIF(track.artist, ''), track.vocalist) = artist.name
    );

UPDATE public.artists
SET bio = 'صوت رخيم يتميز بالفخامة والأداء الهادئ الراقي الذي يمنح مسيرة العروس هيبة وسكينة ساحرة.'
WHERE id = 'artist-mohammed-otaibi'
  AND bio LIKE '%1,500 زفة حصرية%';
