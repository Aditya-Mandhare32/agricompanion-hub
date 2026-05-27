import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, format, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  getCropActivities,
  getActivityDayOffsets,
  getActivityName,
  type CropActivityData,
} from '@/lib/cropActivities';

/**
 * Auto-heal hook: scans the user's crop_history and, for every active crop
 * that has zero calendar_events rows, generates the full activity schedule
 * using the ICAR dataset (public/data/crop_activities.json). Runs at most
 * once per session per user.
 */
export function useBackfillCropEvents(language: string = 'en') {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!user?.id || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const { data: crops } = await supabase
          .from('crop_history')
          .select('id, crop_name, sowing_date, expected_harvest_date, field_name, created_at')
          .eq('user_id', user.id);
        if (!crops?.length) return;

        const { data: existingEvents } = await supabase
          .from('calendar_events')
          .select('crop_name')
          .eq('user_id', user.id);
        const cropsWithEvents = new Set((existingEvents || []).map((e) => e.crop_name));

        const missing = crops.filter((c) => !cropsWithEvents.has(c.crop_name));
        if (!missing.length) return;

        const activityData: Record<string, CropActivityData> = await getCropActivities();
        const inserts: any[] = [];

        for (const crop of missing) {
          const sowDate = new Date(crop.sowing_date || crop.created_at);
          const duration = crop.expected_harvest_date
            ? Math.max(30, differenceInDays(new Date(crop.expected_harvest_date), sowDate))
            : 90;
          const acres = crop.field_name || '';
          const data = activityData[crop.crop_name];

          if (data && data.activities.length > 0) {
            const offsets = getActivityDayOffsets(data.activities, duration);
            for (const { activity, dayOffset } of offsets) {
              inserts.push({
                user_id: user.id,
                crop_name: crop.crop_name,
                event_type: activity.en,
                event_date: format(addDays(sowDate, dayOffset), 'yyyy-MM-dd'),
                notes: `${crop.crop_name} - ${getActivityName(activity, language)}${acres ? ' (' + acres + ')' : ''}${activity.notes ? ' | ' + activity.notes : ''}`,
              });
            }
          } else {
            // Fallback generic schedule
            const events = [
              { type: 'Sowing', dayOffset: 0 },
              { type: 'Irrigation', dayOffset: Math.floor(duration * 0.1) },
              { type: 'Weeding', dayOffset: Math.floor(duration * 0.2) },
              { type: 'Fertilizing', dayOffset: Math.floor(duration * 0.3) },
              { type: 'Irrigation', dayOffset: Math.floor(duration * 0.5) },
              { type: 'Fertilizing', dayOffset: Math.floor(duration * 0.65) },
              { type: 'Harvesting', dayOffset: duration },
            ];
            for (const e of events) {
              inserts.push({
                user_id: user.id,
                crop_name: crop.crop_name,
                event_type: e.type,
                event_date: format(addDays(sowDate, e.dayOffset), 'yyyy-MM-dd'),
                notes: `${crop.crop_name} - ${e.type}${acres ? ' (' + acres + ')' : ''}`,
              });
            }
          }
        }

        if (inserts.length) {
          const { error } = await supabase.from('calendar_events').insert(inserts);
          if (error) {
            console.error('[backfill] insert error:', error);
            return;
          }
          console.log(`[backfill] Generated ${inserts.length} events for ${missing.length} crops`);
          qc.invalidateQueries({ queryKey: ['calendarEvents'] });
          qc.invalidateQueries({ queryKey: ['todayTasks'] });
          qc.invalidateQueries({ queryKey: ['upcomingEvents'] });
        }
      } catch (err) {
        console.error('[backfill] failed:', err);
      }
    })();
  }, [user?.id, language, qc]);
}
