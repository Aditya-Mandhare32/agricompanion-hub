import { supabase } from '@/integrations/supabase/client';

interface ContextOpts { userId: string; language?: string; }

function level(value: number | null | undefined, low: number, high: number): string {
  if (value == null) return 'unknown';
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'medium';
}

export async function buildFarmerContext({ userId, language = 'en' }: ContextOpts): Promise<string> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [profileRes, cropsRes, completedRes, soilRes, upcomingRes, overdueRes, postsRes] = await Promise.all([
      supabase.from('profiles')
        .select('username, location, land_owned, account_type, farm_location_label')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('crop_history')
        .select('crop_name, field_name, sowing_date, expected_harvest_date, suitability_score')
        .eq('user_id', userId).or('status.is.null,status.eq.active')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('completed_crops')
        .select('crop_name, yield_amount, yield_unit, total_income, season_rating, harvest_date')
        .eq('user_id', userId).order('harvest_date', { ascending: false }).limit(1),
      supabase.from('saved_soil_analyses')
        .select('soil_params, field_name, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
      supabase.from('calendar_events')
        .select('crop_name, event_type, event_date')
        .eq('user_id', userId).eq('completed', false)
        .gte('event_date', today).order('event_date', { ascending: true }).limit(5),
      supabase.from('calendar_events')
        .select('crop_name, event_type, event_date')
        .eq('user_id', userId).eq('completed', false)
        .lt('event_date', today).order('event_date', { ascending: false }).limit(5),
      supabase.from('posts')
        .select('content, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    ]);

    const profile = profileRes.data;
    const crops = cropsRes.data ?? [];
    const lastDone = completedRes.data?.[0];
    const soil = soilRes.data?.[0];
    const soilParams = (soil?.soil_params as any) || {};
    const upcoming = upcomingRes.data ?? [];
    const overdue = overdueRes.data ?? [];
    const posts = postsRes.data ?? [];

    const cropsLine = crops.length
      ? crops.map(c => {
          const dayNum = c.sowing_date
            ? Math.max(1, Math.floor((Date.now() - new Date(c.sowing_date).getTime()) / 86400000))
            : null;
          return `${c.crop_name}${c.field_name ? ` (${c.field_name})` : ''}${dayNum ? ` — day ${dayNum}` : ''}`;
        }).join('; ')
      : 'no active crops';

    const lastLine = lastDone
      ? `${lastDone.crop_name} — ${lastDone.yield_amount ?? '?'} ${lastDone.yield_unit ?? 'kg'}, income ₹${lastDone.total_income ?? '?'}, rating ${lastDone.season_rating ?? '?'}/5`
      : 'none';

    const soilLine = soil
      ? `pH ${soilParams.ph ?? '?'}, N ${soilParams.nitrogen ?? '?'} (${level(soilParams.nitrogen, 240, 480)}), P ${soilParams.phosphorus ?? '?'} (${level(soilParams.phosphorus, 11, 22)}), K ${soilParams.potassium ?? '?'} (${level(soilParams.potassium, 110, 280)}), OC ${soilParams.organicCarbon ?? '?'}`
      : 'no soil report on file';

    const fmtEvents = (rows: typeof upcoming) =>
      rows.length ? rows.map(r => `${r.event_type} for ${r.crop_name} on ${r.event_date}`).join('; ') : 'none';

    const postsLine = posts.length
      ? posts.map(p => `"${(p.content || '').slice(0, 80)}"`).join(' | ')
      : 'none';

    return [
      `Farmer: ${profile?.username ?? 'Unknown'}${profile?.location ? ` from ${profile.location}` : ''}${profile?.farm_location_label ? ` (farm: ${profile.farm_location_label})` : ''}`,
      profile?.land_owned ? `Farm size: ${profile.land_owned}` : null,
      profile?.account_type ? `Account: ${profile.account_type}` : null,
      `Active crops: ${cropsLine}`,
      `Last completed crop: ${lastLine}`,
      `Latest soil report: ${soilLine}`,
      `Upcoming activities: ${fmtEvents(upcoming)}`,
      `Overdue activities: ${fmtEvents(overdue)}`,
      `Recent community posts by this farmer: ${postsLine}`,
      `Preferred language: ${language}`,
    ].filter(Boolean).join('\n');
  } catch (err) {
    console.warn('buildFarmerContext failed', err);
    return '';
  }
}
