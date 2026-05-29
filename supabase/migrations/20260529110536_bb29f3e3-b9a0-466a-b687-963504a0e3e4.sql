
-- Enable cron + http extensions for scheduled notification generation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trim trigger: keep last 20 notifications per user
CREATE OR REPLACE FUNCTION public.trim_smart_notifications_per_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.smart_notifications
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
      FROM public.smart_notifications
      WHERE user_id = NEW.user_id
    ) ranked
    WHERE rn > 20
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trim_smart_notifications ON public.smart_notifications;
CREATE TRIGGER trg_trim_smart_notifications
AFTER INSERT ON public.smart_notifications
FOR EACH ROW EXECUTE FUNCTION public.trim_smart_notifications_per_user();

-- Realtime: ensure smart_notifications + post_comments emit changes
ALTER TABLE public.smart_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
