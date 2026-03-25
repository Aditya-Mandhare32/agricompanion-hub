// Crop activities data loaded from the ICAR-verified dataset
export interface CropActivity {
  en: string;
  hi: string;
  mr: string;
  times: number | string;
  freq: string;
  notes: string;
}

export interface CropActivityData {
  name: string;
  name_hi: string;
  name_mr: string;
  category: string;
  duration: number;
  sowing_season: string;
  harvest_season: string;
  activities: CropActivity[];
  tips_en: string;
  tips_hi: string;
  tips_mr: string;
}

let cachedData: Record<string, CropActivityData> | null = null;

export async function getCropActivities(): Promise<Record<string, CropActivityData>> {
  if (cachedData) return cachedData;
  try {
    const resp = await fetch('/data/crop_activities.json');
    cachedData = await resp.json();
    return cachedData!;
  } catch (err) {
    console.error('Failed to load crop activities:', err);
    return {};
  }
}

export function getActivityDayOffsets(activities: CropActivity[], duration: number): { activity: CropActivity; dayOffset: number }[] {
  const result: { activity: CropActivity; dayOffset: number }[] = [];
  const total = activities.length;
  
  activities.forEach((act, i) => {
    const actName = act.en.toLowerCase();
    let dayOffset: number;
    
    if (actName.includes('land preparation')) dayOffset = 0;
    else if (actName.includes('sowing') || actName.includes('transplant')) dayOffset = Math.floor(duration * 0.02);
    else if (actName.includes('irrigation') || actName.includes('watering')) dayOffset = Math.floor(duration * 0.1);
    else if (actName.includes('weeding')) dayOffset = Math.floor(duration * 0.2);
    else if (actName.includes('fertilizer') || actName.includes('manure')) dayOffset = Math.floor(duration * 0.25);
    else if (actName.includes('pesticide') || actName.includes('spray') || actName.includes('fungicide')) dayOffset = Math.floor(duration * 0.4);
    else if (actName.includes('top dressing') || actName.includes('intercult')) dayOffset = Math.floor(duration * 0.5);
    else if (actName.includes('thinning') || actName.includes('pruning') || actName.includes('training')) dayOffset = Math.floor(duration * 0.3);
    else if (actName.includes('earthing') || actName.includes('staking') || actName.includes('mulch')) dayOffset = Math.floor(duration * 0.35);
    else if (actName.includes('harvest')) dayOffset = duration;
    else if (actName.includes('post-harvest') || actName.includes('thresh') || actName.includes('curing') || actName.includes('drying')) dayOffset = duration + 5;
    else dayOffset = Math.floor(duration * ((i + 1) / (total + 1)));
    
    result.push({ activity: act, dayOffset });
  });
  
  return result;
}

export function getTipForActivity(cropData: CropActivityData, language: string): string {
  if (language === 'hi') return cropData.tips_hi || cropData.tips_en || '';
  if (language === 'mr') return cropData.tips_mr || cropData.tips_en || '';
  return cropData.tips_en || '';
}

export function getActivityName(activity: CropActivity, language: string): string {
  if (language === 'hi') return activity.hi || activity.en;
  if (language === 'mr') return activity.mr || activity.en;
  return activity.en;
}
