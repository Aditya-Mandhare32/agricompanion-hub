import { supabase } from '@/integrations/supabase/client';

export type NotifType =
  | 'task_today' | 'upcoming_activity' | 'overdue' | 'harvest_coming' | 'schedule_generated'
  | 'pest_alert' | 'weather_warning' | 'activity_conflict' | 'health_drop'
  | 'soil_ready' | 'market_price' | 'weekly_summary'
  | 'community_reply' | 'nearby_farmer'
  | 'crop_harvest_complete'
  | 'gov_scheme';

export type NotifPriority = 'high' | 'normal' | 'low';

export interface CreateNotifInput {
  userId: string;
  title: string;
  message: string;
  type: NotifType;
  priority?: NotifPriority;
  action_type?: string | null;
  action_data?: Record<string, unknown> | null;
  /** dedupe key — won't insert if a non-dismissed notif with same key exists today */
  dedupeKey?: string;
}

/** Insert a smart notification (RLS-safe; user must own user_id). */
export async function createNotification(input: CreateNotifInput): Promise<void> {
  try {
    if (input.dedupeKey) {
      const since = new Date(Date.now() - 18 * 3600 * 1000).toISOString();
      const { data: existing } = await supabase
        .from('smart_notifications')
        .select('id')
        .eq('user_id', input.userId)
        .eq('type', input.type)
        .eq('dismissed', false)
        .gte('created_at', since)
        .ilike('action_data->>dedupeKey', input.dedupeKey)
        .limit(1);
      if (existing && existing.length > 0) return;
    }
    await supabase.from('smart_notifications').insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      priority: input.priority ?? 'normal',
      action_type: input.action_type ?? null,
      action_data: { ...(input.action_data ?? {}), dedupeKey: input.dedupeKey ?? null },
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
  } catch (err) {
    console.warn('createNotification failed', err);
  }
}
