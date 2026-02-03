-- Create storage bucket for community images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('community-images', 'community-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for community images
CREATE POLICY "Anyone can view community images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'community-images');

CREATE POLICY "Authenticated users can upload community images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'community-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own community images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add estimated soil data table for storing farmer soil estimations
CREATE TABLE IF NOT EXISTS public.estimated_soil_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  soil_color TEXT,
  soil_texture TEXT,
  water_retention TEXT,
  previous_crop TEXT,
  irrigation_available BOOLEAN DEFAULT false,
  fertilizer_usage TEXT,
  estimated_ph NUMERIC(3,1),
  estimated_nitrogen NUMERIC(6,2),
  estimated_phosphorus NUMERIC(6,2),
  estimated_potassium NUMERIC(6,2),
  estimated_organic_carbon NUMERIC(4,2),
  estimated_soil_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimated_soil_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimated soil profiles
CREATE POLICY "Users can view their own estimated soil profiles"
ON public.estimated_soil_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own estimated soil profiles"
ON public.estimated_soil_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estimated soil profiles"
ON public.estimated_soil_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estimated soil profiles"
ON public.estimated_soil_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create crop history table for storing farmer's selected crops
CREATE TABLE IF NOT EXISTS public.crop_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  crop_category TEXT,
  sowing_date DATE,
  expected_harvest_date DATE,
  field_name TEXT,
  soil_profile_id UUID,
  source TEXT DEFAULT 'recommendation', -- 'recommendation', 'manual', 'estimation'
  suitability_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crop_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for crop history
CREATE POLICY "Users can view their own crop history"
ON public.crop_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crop history"
ON public.crop_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crop history"
ON public.crop_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crop history"
ON public.crop_history
FOR DELETE
USING (auth.uid() = user_id);