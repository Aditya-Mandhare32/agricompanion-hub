
-- Create crops database table for real crop data
CREATE TABLE public.crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_hi TEXT,
  name_mr TEXT,
  category TEXT NOT NULL,
  season TEXT NOT NULL,
  duration_days INTEGER,
  min_ph NUMERIC,
  max_ph NUMERIC,
  min_nitrogen NUMERIC,
  max_nitrogen NUMERIC,
  min_phosphorus NUMERIC,
  max_phosphorus NUMERIC,
  min_potassium NUMERIC,
  max_potassium NUMERIC,
  ideal_temperature_min NUMERIC,
  ideal_temperature_max NUMERIC,
  water_needs TEXT,
  soil_types TEXT[],
  cost_per_acre NUMERIC,
  expected_yield_per_acre TEXT,
  market_price_range TEXT,
  profit_potential TEXT,
  growing_guide JSONB,
  expert_tips TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Public read access for crops (reference data)
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crops are viewable by everyone" ON public.crops FOR SELECT USING (true);
