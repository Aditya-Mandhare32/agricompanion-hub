# Plan: Dynamic Notifications + Calendar Cleanup

## 1. Remove "Add Crop Cycle" Button
- Locate the button in `src/pages/CalendarPage.tsx` (or related calendar components) and remove it. Keep "Add Other" intact.

## 2. Notifications Table
The project already has a `smart_notifications` table that closely matches the requested schema (id, user_id, title, message, type, read, created_at, priority, action_type, action_data, expires_at, dismissed). Rather than creating a duplicate `notifications` table, **reuse `smart_notifications`** — it already has RLS, realtime is straightforward, and the existing `SmartNotifications` UI uses it.

(A separate, older `notifications` table also exists but isn't wired to the UI. We'll consolidate on `smart_notifications`.)

Add cleanup trigger: after insert, keep only the 20 most recent rows per user (delete older).

## 3. Auto-Insert Notification Logic
Extend the existing `generate-smart-notifications` edge function (and the client-side `SmartNotifications` generator) to cover the new triggers:

**Calendar-based** (run on app load + scheduled cron at 6 AM):
- Today's tasks → one "Tasks Today" notification listing today's `calendar_events`
- Overdue: `event_date < today AND completed = false` → "Overdue Tasks"
- 1-day-away events → "Upcoming Activity"
- Crops with `expected_harvest_date` within 7 days → "Harvest Coming"
- On crop insert (in `useCrops` after generating schedule) → "Crop Schedule Generated"

**Crop health / soil** (client-triggered where data is produced):
- On crop health score change in `CropHealthPopup`/`useCrops`: compare to previous → "Crop Health Drop"
- After AI pest photo analysis returns high/critical → "Pest Alert"
- After `analyze-soil` finishes → "Soil Report Ready" with key findings

**Weather** (in `get-weather` consumer / WeatherWidget):
- Rain > 20mm, temp > 40 or < 5 → "Weather Warning"
- Forecast conflict with same-day spray/fertilizer event → "Activity Conflict"

**Market** (in `MarketPrices` / `get-market-prices`):
- Add optional `target_price` per crop (stored in `crop_history.notes` JSON or new column) — for now, trigger when current price ≥ user-set target stored locally → "Market Price Alert"

**Community**:
- Realtime listener on `post_comments` where parent post's `user_id = me` → "Community Reply"
- Realtime listener on new `posts` from same district (match `profiles.location`) containing pest/disease keywords → "Nearby Farmer Alert"

**Government** — skipped (no schemes data source in project). Will leave a placeholder code path commented for later.

**Weekly summary** (Sunday 8 PM cron): aggregate completed/pending counts + avg health → "Weekly Farm Summary".

## 4. Cron Jobs (pg_cron + pg_net)
Enable `pg_cron` and `pg_net`. Schedule:
- `0 6 * * *` daily → invoke `generate-smart-notifications` with `{ mode: 'daily' }`
- `0 20 * * 0` Sunday → invoke with `{ mode: 'weekly' }`
- `*/30 * * * *` half-hourly → check overdue/upcoming/harvest

The function branches on `mode`.

## 5. Realtime Bell Icon
Update `src/components/layout/Header.tsx` to subscribe to `smart_notifications` inserts for `user_id = me`, show unread count badge (red), list latest 20, add "Mark all read" button, click → mark read + navigate via `action_type`.

(The existing `AppContext` notifications array is local/mock — repoint it to `smart_notifications` so Header + dashboard `SmartNotifications` panel share one source of truth.)

## 6. Icon Mapping
Add to Header dropdown + `SmartNotifications`:
- Calendar blue: `task_today`, `upcoming_activity`, `overdue`, `harvest_coming`, `schedule_generated`
- Warning yellow: `pest_alert`, `weather_warning`, `activity_conflict`, `health_drop`
- Green: `soil_ready`, `market_price`, `weekly_summary`
- Person: `community_reply`, `nearby_farmer`
- Government: `gov_scheme`

## 7. Local Push Notifications
For each new in-app `smart_notifications` insert received via realtime, also fire a local browser notification via existing `showLocalNotification` from `src/lib/pushNotifications.ts` (already implemented). This piggybacks on the PWA work from prior turns — works in installed/standalone, no-ops in iframe.

## 8. Auto-Trim to 20
Postgres trigger after insert on `smart_notifications`: delete rows beyond rank 20 per user.

---

## Technical details

### Migration
- Enable extensions, add trigger function `trim_smart_notifications_per_user()`, schedule cron jobs.
- (No new table — reuse `smart_notifications`.)

### Files to edit
- `src/pages/CalendarPage.tsx` — remove Add Crop Cycle button
- `src/components/layout/Header.tsx` — wire bell to `smart_notifications` + realtime + Mark all read
- `src/context/AppContext.tsx` — replace local notifications with Supabase-backed
- `src/components/notifications/SmartNotifications.tsx` — add new types + icons
- `src/hooks/useCrops.ts` — emit Crop Schedule Generated + health drop
- `src/components/soil/AIAnalysisSection.tsx` — emit Soil Report Ready
- `src/components/weather/WeatherWidget.tsx` — emit Weather Warning + Activity Conflict
- `src/components/dashboard/MarketPrices.tsx` — emit Market Price Alert (target stored in localStorage per crop)
- `supabase/functions/generate-smart-notifications/index.ts` — extend with daily/weekly modes + all calendar branches
- New: realtime listeners for `post_comments` and `posts` in `AppContext` to emit Community Reply & Nearby Farmer Alert

### Out of scope (will note in response)
- Government scheme notifications (no data source)
- Per-crop market target price UI — minimal localStorage version only
