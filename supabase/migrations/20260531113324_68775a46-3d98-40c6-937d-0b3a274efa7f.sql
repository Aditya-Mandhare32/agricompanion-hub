
-- ===== Profiles: add admin & phone =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone text;

UPDATE public.profiles p
SET is_admin = true
FROM auth.users u
WHERE p.user_id = u.id
  AND lower(u.email) = 'adityamandhare28@gmail.com';

-- ===== Tables first =====
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_post_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_action text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  blocked_by_admin boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_user_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT ALL ON public.blocked_users TO service_role;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_status (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  reason text,
  restricted_until timestamptz,
  updated_by_admin uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_status TO authenticated;
GRANT ALL ON public.user_status TO service_role;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by uuid NOT NULL,
  sent_to uuid,
  target_group text,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  target_user_email text,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;
GRANT ALL ON public.admin_activity_logs TO service_role;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- ===== Helper functions =====
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = uid AND is_admin = true); $$;

CREATE OR REPLACE FUNCTION public.is_post_author_visible(viewer uuid, author uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE blocked_user_id = author
      AND (blocked_by_admin = true OR blocker_id = viewer)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_user_post(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_status
    WHERE user_id = uid
      AND (status = 'blocked' OR (status = 'restricted' AND restricted_until IS NOT NULL AND restricted_until > now()))
  );
$$;

-- ===== Policies =====
CREATE POLICY "Users can file reports" ON public.post_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reports visible to admins or reporter" ON public.post_reports
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR reporter_id = auth.uid());
CREATE POLICY "Admins update reports" ON public.post_reports
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Blocks visible to owner or admin" ON public.blocked_users
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users or admins can block" ON public.blocked_users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users or admins can unblock" ON public.blocked_users
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id OR public.is_admin(auth.uid()));

CREATE POLICY "Status visible to self or admin" ON public.user_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage user status" ON public.user_status
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Broadcasts admin or recipient" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR sent_to = auth.uid());
CREATE POLICY "Only admins send broadcasts" ON public.admin_notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND sent_by = auth.uid());

CREATE POLICY "Only admins view logs" ON public.admin_activity_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Only admins write logs" ON public.admin_activity_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reports_reported_user ON public.post_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_activity_logs(created_at DESC);

-- ===== Tighten posts policies =====
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Active users can create posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_user_post(auth.uid()));

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts visible unless author blocked" ON public.posts
  FOR SELECT
  USING (
    public.is_admin(coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid))
    OR public.is_post_author_visible(coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), user_id)
  );

-- ===== Update handle_new_user to capture phone =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, avatar_url, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;
