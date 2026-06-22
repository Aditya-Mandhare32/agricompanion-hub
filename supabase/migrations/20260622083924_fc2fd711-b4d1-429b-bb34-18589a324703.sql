ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS original_date date,
  ADD COLUMN IF NOT EXISTS rescheduled_reason text,
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz;