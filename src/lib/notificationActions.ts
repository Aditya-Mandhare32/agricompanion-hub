// Centralized notification routing, translation, and detail-modal logic.
import type { Language } from '@/lib/translations';

export interface NotifLike {
  id: string;
  title: string;
  message: string;
  type: string;
  action_type?: string | null;
  action_data?: any;
}

export type NavTarget = { path: string };

/** Types that should open a detail popup BEFORE navigating. */
export const MODAL_TYPES = new Set(['weather_warning', 'weather_alert', 'activity_conflict']);

export function needsDetailModal(type: string): boolean {
  return MODAL_TYPES.has(type);
}

/** Map a notification → destination route (with query hints). */
export function routeForNotification(n: NotifLike): NavTarget {
  const d = n.action_data || {};
  const date = d.event_date || d.date || '';
  const crop = encodeURIComponent(d.crop_name || '');
  const eventId = d.event_id || '';

  switch (n.type) {
    case 'task_today':
      return { path: `/calendar?date=${new Date().toISOString().split('T')[0]}&highlight=today` };
    case 'overdue':
      return { path: `/calendar?highlight=overdue${eventId ? `&eventId=${eventId}` : ''}` };
    case 'upcoming_activity':
      return { path: `/calendar?date=${date}&highlight=upcoming${eventId ? `&eventId=${eventId}` : ''}` };
    case 'harvest_coming':
      return { path: `/calendar?date=${date}&highlight=harvest` };
    case 'schedule_generated':
      return { path: `/calendar?highlight=new${crop ? `&crop=${crop}` : ''}` };
    case 'task_reminder':
      return { path: `/calendar${date ? `?date=${date}` : ''}` };

    case 'health_drop':
      return { path: `/dashboard?highlight=crop${crop ? `&crop=${crop}` : ''}` };
    case 'pest_alert':
      return { path: `/dashboard?highlight=pest${crop ? `&crop=${crop}` : ''}` };
    case 'crop_risk':
      return { path: `/dashboard?highlight=crop${crop ? `&crop=${crop}` : ''}` };
    case 'weekly_summary':
      return { path: '/dashboard?view=summary' };

    case 'soil_ready':
    case 'nutrient_alert':
      return { path: '/soil-report' };

    case 'market_price':
      return { path: `/news?tab=market${crop ? `&crop=${crop}` : ''}` };
    case 'gov_scheme':
      return { path: '/news?tab=schemes' };

    case 'community_reply':
    case 'message_alert':
      return { path: `/community${d.post_id ? `?post=${d.post_id}` : '?tab=messages'}` };
    case 'nearby_farmer':
      return { path: `/community${d.post_id ? `?post=${d.post_id}` : ''}` };

    // weather/conflict reach here only AFTER the modal redirect button
    case 'weather_warning':
    case 'weather_alert':
      return { path: '/dashboard?section=alerts' };
    case 'activity_conflict':
      return { path: '/calendar' };

    default:
      // legacy action_type fallback
      switch (n.action_type) {
        case 'view_calendar': return { path: '/calendar' };
        case 'view_soil':     return { path: '/soil-report' };
        case 'view_messages': return { path: '/community?tab=messages' };
        case 'view_community':return { path: '/community' };
        case 'view_market':   return { path: '/news?tab=market' };
        default:              return { path: '/dashboard' };
      }
  }
}

/* ───────────────── Translation: keep notification text in sync with app language ─────────────── */

const T = (lang: Language, en: string, hi: string, mr: string) =>
  lang === 'hi' ? hi : lang === 'mr' ? mr : en;

const TITLE: Record<string, (l: Language) => string> = {
  task_today: (l) => T(l, 'Tasks Today', 'आज के काम', 'आजची कामे'),
  overdue: (l) => T(l, 'Overdue Task', 'बकाया कार्य', 'रखडलेले काम'),
  upcoming_activity: (l) => T(l, 'Upcoming Activity', 'आगामी गतिविधि', 'आगामी क्रियाकलाप'),
  harvest_coming: (l) => T(l, 'Harvest Coming', 'कटाई आ रही है', 'कापणी जवळ आली'),
  schedule_generated: (l) => T(l, 'Crop Schedule Generated', 'फसल अनुसूची तैयार', 'पीक वेळापत्रक तयार'),
  task_reminder: (l) => T(l, 'Task Reminder', 'कार्य अनुस्मारक', 'कामाची आठवण'),
  health_drop: (l) => T(l, 'Crop Health Drop', 'फसल स्वास्थ्य गिरा', 'पीक आरोग्य घटले'),
  pest_alert: (l) => T(l, 'Pest Alert', 'कीट चेतावनी', 'कीड सूचना'),
  crop_risk: (l) => T(l, 'Crop Risk', 'फसल जोखिम', 'पीक धोका'),
  soil_ready: (l) => T(l, 'Soil Report Ready', 'मिट्टी रिपोर्ट तैयार', 'माती अहवाल तयार'),
  nutrient_alert: (l) => T(l, 'Nutrient Alert', 'पोषक तत्व अलर्ट', 'पोषक सूचना'),
  weather_warning: (l) => T(l, 'Weather Warning', 'मौसम चेतावनी', 'हवामान इशारा'),
  weather_alert: (l) => T(l, 'Weather Alert', 'मौसम अलर्ट', 'हवामान सूचना'),
  activity_conflict: (l) => T(l, 'Activity Conflict', 'गतिविधि टकराव', 'क्रियाकलाप संघर्ष'),
  market_price: (l) => T(l, 'Market Price Alert', 'बाजार मूल्य अलर्ट', 'बाजारभाव सूचना'),
  weekly_summary: (l) => T(l, 'Weekly Farm Summary', 'साप्ताहिक खेत सारांश', 'साप्ताहिक शेत सारांश'),
  community_reply: (l) => T(l, 'New Reply', 'नया जवाब', 'नवीन उत्तर'),
  nearby_farmer: (l) => T(l, 'Nearby Farmer Alert', 'पास के किसान की सूचना', 'जवळच्या शेतकऱ्याची सूचना'),
  message_alert: (l) => T(l, 'New Messages', 'नए संदेश', 'नवीन संदेश'),
  gov_scheme: (l) => T(l, 'Government Scheme', 'सरकारी योजना', 'शासकीय योजना'),
};

function tplMessage(type: string, lang: Language, p: Record<string, any>): string | null {
  const crop = p.crop_name || '';
  const ev = p.event_type || '';
  const date = p.event_date || p.date || '';
  const count = p.count;
  const list = p.list || '';
  switch (type) {
    case 'task_today':
      return T(lang,
        `${count ?? ''} task(s) scheduled${list ? `: ${list}` : ''}`.trim(),
        `${count ?? ''} कार्य निर्धारित${list ? `: ${list}` : ''}`.trim(),
        `${count ?? ''} कामे नियोजित${list ? `: ${list}` : ''}`.trim());
    case 'overdue':
      return T(lang, `${ev} – ${crop} (${date})`, `${ev} – ${crop} (${date})`, `${ev} – ${crop} (${date})`);
    case 'upcoming_activity':
      return T(lang,
        `Tomorrow: ${ev} for ${crop}`,
        `कल: ${crop} के लिए ${ev}`,
        `उद्या: ${crop} साठी ${ev}`);
    case 'harvest_coming':
      return T(lang,
        `${crop} harvest on ${date}`,
        `${crop} कटाई ${date} को`,
        `${crop} कापणी ${date} रोजी`);
    case 'schedule_generated':
      return T(lang,
        `Activities added for ${crop}.`,
        `${crop} के लिए गतिविधियां जोड़ी गईं।`,
        `${crop} साठी क्रियाकलाप जोडले.`);
    case 'weekly_summary':
      return T(lang,
        `Completed: ${p.completed ?? 0} • Pending: ${p.pending ?? 0}`,
        `पूर्ण: ${p.completed ?? 0} • बाकी: ${p.pending ?? 0}`,
        `पूर्ण: ${p.completed ?? 0} • प्रलंबित: ${p.pending ?? 0}`);
    default:
      return null;
  }
}

/** Return localized {title, message} for a notification, given current language. */
export function translateNotification(n: NotifLike, language: Language): { title: string; message: string } {
  const params = (n.action_data && (n.action_data.params || n.action_data)) || {};
  const titleFn = TITLE[n.type];
  const localizedTitle = titleFn ? titleFn(language) : n.title;
  const localizedMsg = tplMessage(n.type, language, params);
  return {
    title: localizedTitle || n.title,
    message: localizedMsg ?? n.message,
  };
}
