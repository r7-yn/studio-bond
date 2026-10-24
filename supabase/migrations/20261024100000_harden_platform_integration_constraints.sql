-- Harden integration tables created by earlier migrations.
-- Safe for shared environments: constraints are added only when the table/constraint is missing.
-- NOT VALID preserves existing rows while enforcing checks on new and updated rows.

DO $$
BEGIN
  IF to_regclass('public.admin_youtube_connections') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'admin_youtube_connections_channel_id_length_check'
         AND conrelid = 'public.admin_youtube_connections'::regclass
     ) THEN
    ALTER TABLE public.admin_youtube_connections
      ADD CONSTRAINT admin_youtube_connections_channel_id_length_check
      CHECK (length(channel_id) BETWEEN 1 AND 80) NOT VALID;
  END IF;

  IF to_regclass('public.admin_youtube_connections') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'admin_youtube_connections_channel_title_length_check'
         AND conrelid = 'public.admin_youtube_connections'::regclass
     ) THEN
    ALTER TABLE public.admin_youtube_connections
      ADD CONSTRAINT admin_youtube_connections_channel_title_length_check
      CHECK (length(channel_title) BETWEEN 1 AND 200) NOT VALID;
  END IF;

  IF to_regclass('public.admin_youtube_connections') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'admin_youtube_connections_uploads_playlist_id_length_check'
         AND conrelid = 'public.admin_youtube_connections'::regclass
     ) THEN
    ALTER TABLE public.admin_youtube_connections
      ADD CONSTRAINT admin_youtube_connections_uploads_playlist_id_length_check
      CHECK (length(uploads_playlist_id) BETWEEN 1 AND 100) NOT VALID;
  END IF;

  IF to_regclass('public.admin_youtube_connections') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'admin_youtube_connections_status_check'
         AND conrelid = 'public.admin_youtube_connections'::regclass
     ) THEN
    ALTER TABLE public.admin_youtube_connections
      ADD CONSTRAINT admin_youtube_connections_status_check
      CHECK (status IN ('connected', 'needs_reauth', 'error', 'disconnected')) NOT VALID;
  END IF;

  IF to_regclass('public.push_subscriptions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'push_subscriptions_endpoint_length_check'
         AND conrelid = 'public.push_subscriptions'::regclass
     ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_endpoint_length_check
      CHECK (length(endpoint) BETWEEN 20 AND 2048) NOT VALID;
  END IF;

  IF to_regclass('public.push_subscriptions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'push_subscriptions_p256dh_length_check'
         AND conrelid = 'public.push_subscriptions'::regclass
     ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_p256dh_length_check
      CHECK (length(p256dh) BETWEEN 20 AND 500) NOT VALID;
  END IF;

  IF to_regclass('public.push_subscriptions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'push_subscriptions_auth_length_check'
         AND conrelid = 'public.push_subscriptions'::regclass
     ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_auth_length_check
      CHECK (length(auth) BETWEEN 10 AND 500) NOT VALID;
  END IF;

  IF to_regclass('public.admin_ai_audit_logs') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'admin_ai_audit_logs_question_hash_check'
         AND conrelid = 'public.admin_ai_audit_logs'::regclass
     ) THEN
    ALTER TABLE public.admin_ai_audit_logs
      ADD CONSTRAINT admin_ai_audit_logs_question_hash_check
      CHECK (question_hash ~ '^[0-9a-f]{64}$') NOT VALID;
  END IF;
END $$;
