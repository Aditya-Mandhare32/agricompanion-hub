-- Create saved_soil_analyses table for persisting AI analysis results
CREATE TABLE public.saved_soil_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  field_name TEXT,
  analysis_data JSONB NOT NULL,
  soil_params JSONB NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  is_estimated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_soil_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own analyses" ON public.saved_soil_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses" ON public.saved_soil_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON public.saved_soil_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Create smart_notifications table for AI-driven alerts
CREATE TABLE public.smart_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'weather', 'crop_risk', 'task_reminder', 'pest_alert', 'daily_summary'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  action_type VARCHAR(50), -- 'mark_complete', 'view_crop', 'reschedule'
  action_data JSONB,
  read BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" ON public.smart_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON public.smart_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.smart_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.smart_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_saved_soil_analyses_user_id ON public.saved_soil_analyses(user_id);
CREATE INDEX idx_smart_notifications_user_id ON public.smart_notifications(user_id);
CREATE INDEX idx_smart_notifications_type ON public.smart_notifications(type);
CREATE INDEX idx_smart_notifications_read ON public.smart_notifications(read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_notifications;