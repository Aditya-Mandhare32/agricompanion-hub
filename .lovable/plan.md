Plan: Notification Filters + Geo Weather + Admin System

This is a large build. I'll deliver it in 3 parts. Confirm the scope (especially Part 3) before I begin.

---

## Part 1 — Notification History filters (small, frontend only)

In `NotificationHistory.tsx` (Profile/Settings):

- Add two filter rows above the list:
  - **Read state**: All / Unread / Read (segmented buttons)
  - **Type**: All / Calendar / Weather / Pest / Soil / Market / Community / Other (chips, multi-select)
- Filters apply client-side over the already-loaded last-50 notifications.
- Localised labels (en/hi/mr).
- Empty state when filters match nothing.

---

## Part 2 — Geolocation-based weather on dashboard

- **Landing page (`Index.tsx`)**: remove the `WeatherWidget` (and any weather hero text) so logged-out visitors don't see it.
- **Dashboard (`Dashboard.tsx` / `WeatherWidget.tsx`)**:
  - On first mount after login, call `navigator.geolocation.getCurrentPosition`.
  - If granted → use lat/lon for Open-Meteo + OpenWeatherMap calls.
  - If denied/unsupported → fall back to profile `location` (current behaviour).
  - Cache permission state + last coords in `localStorage` so we don't re-prompt every visit.
  - Show a small inline banner if denied: "Enable location for accurate local weather" with a retry button.

---

## Part 3 — Admin system + community moderation (large)

### 3a. Database (one migration)

New tables, all with GRANTs + RLS:

- `post_reports` (id, reporter_id, reported_post_id, reported_user_id, reason, status [pending|resolved|dismissed], admin_action, created_at, resolved_at)
- `blocked_users` (id, blocker_id, blocked_user_id, blocked_by_admin bool, reason, created_at) — unique(blocker_id, blocked_user_id)
- `user_status` (user_id PK, status [active|warned|restricted|blocked], reason, restricted_until, updated_by_admin, updated_at)
- `admin_notifications` (id, sent_by, sent_to nullable, target_group nullable, title, message, created_at) — broadcast history
- `admin_activity_logs` (id, admin_id, action_type, target_user_id, target_user_email, reason, metadata jsonb, created_at)

Profile change:

- Add `profiles.is_admin boolean default false`
- Set `is_admin = true` where email = `adityamandhare28@gmail.com` (joined via `auth.users`).

Helpers:

- `public.is_admin(uid uuid)` SECURITY DEFINER function (avoids RLS recursion) — used by every admin-only policy.
- `public.is_user_blocked_by(viewer uuid, author uuid)` SECURITY DEFINER — used to hide posts in feed.

RLS highlights:

- `post_reports`, `user_status`, `admin_notifications`, `admin_activity_logs`: SELECT/INSERT/UPDATE/DELETE restricted to `is_admin(auth.uid())`. Exception: any authenticated user can INSERT into `post_reports` as the reporter; can SELECT their own broadcast notifications via `sent_to`.
- `blocked_users`: user manages their own rows (blocker_id = auth.uid()); admins see/manage all.
- `posts` INSERT policy tightened: only allowed if `user_status.status` is not `blocked` and (restricted_until is null OR < now()).
- `posts` SELECT policy adds: hide rows where the author is in the viewer's `blocked_users` OR globally blocked.

### 3b. Email pipeline

Use Lovable Emails (the project's existing email service). I'll:

1. Check email-domain status; if no domain configured, surface the setup dialog.
2. Once a domain exists, scaffold a transactional template `agri360-account-notice` with vars `{action, reason, restricted_until, support_email}`.
3. Create an edge function `send-admin-email` (service-role) that admin actions call.

If you'd rather skip email for now and just create in-app `smart_notifications` for the user, say so — I can swap email for an in-app alert and ship faster.

### 3c. Frontend — moderation on posts

- `PostMenu` component (3-dot) added to every post card in `CommunityFeed`, `MyPosts`, `SavedPosts`:
  - Own post → Edit / Delete
  - Other → Report (reason dialog), Block User, Restrict User (admin only)
- After blocking, local feed filters that author immediately.
- Report dialog: 4 preset reasons → inserts into `post_reports`, toast confirmation.
- Block toast: "You will no longer see posts from this user."

### 3d. Frontend — `/admin` route

- `<AdminRoute>` guard (checks `profile.is_admin`, else redirects to `/dashboard`).
- "Admin Panel" link added to header profile dropdown (admin-only).
- `Admin.tsx` shell with left sidebar / tabs for 9 sections:
  1. Overview stats (cards, computed via parallel `select count` queries)
  2. Reported Posts (table + action buttons; each action writes activity log + sends email + updates `post_reports.status`)
  3. User Management (search, filter, sort; detail drawer with posts/crops/soil/activity)
  4. All Posts (filters: All/Reported/Today/Flagged/Has Media; delete w/ confirm)
  5. Broadcast Notifications (compose + send-to-all / single-email / status-group; history table)
  6. Blocked / Restricted (two tabs, unblock/unrestrict buttons)
  7. Activity Logs (filter by action type + date range)
  8. App Analytics (DAU 30d, new regs/week — computed from `auth.users.created_at`; needs `service_role` edge function since `auth.users` isn't directly queryable from RLS — I'll add `get-admin-analytics` function)
  9. Moderation Queue (posts with >1 report, media posts; quick approve/remove)

All tables: shadcn `Table`, status badges, search inputs, confirm dialogs (`AlertDialog`) before destructive actions.

### 3e. Activity logging

Every admin mutation writes one row to `admin_activity_logs` with `action_type`, `target_user_id`, `target_user_email`, `reason`.

---

## Open questions before I start

1. **Email vs in-app for admin actions** — set up Lovable Emails domain now (requires you to complete a DNS setup dialog), or use in-app `smart_notifications` for v1 and add email later?
2. **Restrict User from post menu (non-admin path)** — your spec says "Restrict User: Only visible to admin account". Confirming: regular users never see Restrict; admins see it on every other-user post. Correct?
3. **Phone number** — User Management table lists a `Phone` column, but `profiles` has no phone field. OK to leave blank, or add `phone` to profiles? Ask phone number while login/signup time to use
4. **Last Active** — there's no presence tracking today. OK to show "—" or derive from latest post/comment timestamp? Yes leave it empty

Once you answer those (especially #1), I'll execute Parts 1, 2, 3a, 3c, 3d, 3e in one pass, with the email function stub ready to enable.