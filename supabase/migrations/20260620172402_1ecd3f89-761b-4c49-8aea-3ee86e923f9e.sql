
-- Phase 3: farm location coordinates
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS farm_latitude double precision,
  ADD COLUMN IF NOT EXISTS farm_longitude double precision,
  ADD COLUMN IF NOT EXISTS farm_location_label text;

-- Crop completion lifecycle: completed_crops table
CREATE TABLE IF NOT EXISTS public.completed_crops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  crop_schedule_id uuid,
  crop_name text NOT NULL,
  field_name text,
  area text,
  sowing_date date,
  harvest_date date NOT NULL DEFAULT (now()::date),
  total_days integer,
  yield_amount numeric,
  yield_unit text DEFAULT 'kg',
  selling_price numeric,
  total_income numeric,
  issues_faced text[],
  season_rating integer CHECK (season_rating IS NULL OR (season_rating BETWEEN 1 AND 5)),
  notes text,
  health_score_average numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_crops TO authenticated;
GRANT ALL ON public.completed_crops TO service_role;

ALTER TABLE public.completed_crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own completed crops"
  ON public.completed_crops FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_completed_crops_updated_at
  BEFORE UPDATE ON public.completed_crops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track harvest status on crop_history (active vs completed)
ALTER TABLE public.crop_history
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS harvested_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_completed_crops_user ON public.completed_crops(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crop_history_status ON public.crop_history(user_id, status);
