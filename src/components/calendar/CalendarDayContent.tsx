import React from 'react';
import { Sprout, Droplets, FlaskConical, Scissors, Calendar as CalendarIcon } from 'lucide-react';
import { CropEvent } from '@/lib/types';
import { isSameDay } from 'date-fns';

const eventTypeIcons = {
  sowing: { icon: Sprout, color: 'text-emerald-500' },
  fertilizing: { icon: FlaskConical, color: 'text-amber-500' },
  irrigation: { icon: Droplets, color: 'text-sky-500' },
  harvest: { icon: Scissors, color: 'text-rose-500' },
} as const;

const DEFAULT_ICON = { icon: CalendarIcon, color: 'text-muted-foreground' };

interface CalendarDayContentProps {
  date: Date;
  events: CropEvent[];
  debug?: boolean;
}

const warned = new Set<string>();
function warnUnknown(type: string, payload: unknown) {
  if (warned.has(type)) return;
  warned.add(type);
  console.warn('[CalendarDayContent] Unknown event type:', type, payload);
}

function CalendarDayContentInner({ date, events, debug }: CalendarDayContentProps) {
  const dayEvents = (events ?? []).filter(event => {
    try {
      return event && event.date && isSameDay(new Date(event.date), date);
    } catch {
      return false;
    }
  });

  const uniqueTypes = [...new Set(dayEvents.map(e => e?.eventType).filter(Boolean))];

  if (uniqueTypes.length === 0) {
    return <span>{date.getDate()}</span>;
  }

  return (
    <div className="relative flex flex-col items-center">
      <span className="font-semibold">{date.getDate()}</span>
      <div className="flex gap-0.5 mt-0.5">
        {uniqueTypes.slice(0, 3).map((type) => {
          const key = String(type ?? '').toLowerCase();
          const config = eventTypeIcons[key as keyof typeof eventTypeIcons];
          if (!config) {
            warnUnknown(String(type), dayEvents.find(e => e.eventType === type));
            const Fallback = DEFAULT_ICON.icon;
            return (
              <Fallback
                key={String(type)}
                className={`h-2.5 w-2.5 ${DEFAULT_ICON.color}`}
                aria-label={debug ? `unknown:${type}` : 'event'}
              />
            );
          }
          const Icon = config.icon;
          return (
            <Icon
              key={String(type)}
              className={`h-2.5 w-2.5 ${config.color}`}
            />
          );
        })}
        {uniqueTypes.length > 3 && (
          <span className="text-[8px] text-muted-foreground">+{uniqueTypes.length - 3}</span>
        )}
      </div>
      {debug && uniqueTypes.some(t => !eventTypeIcons[String(t).toLowerCase() as keyof typeof eventTypeIcons]) && (
        <span className="absolute -bottom-3 text-[7px] text-destructive">?</span>
      )}
    </div>
  );
}

interface State { hasError: boolean; }
class DayErrorBoundary extends React.Component<{ date: Date; children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown, info: unknown) {
    console.error('[CalendarDayContent] render error', error, info);
  }
  render() {
    if (this.state.hasError) return <span>{this.props.date.getDate()}</span>;
    return this.props.children;
  }
}

export function CalendarDayContent(props: CalendarDayContentProps) {
  try {
    return (
      <DayErrorBoundary date={props.date}>
        <CalendarDayContentInner {...props} />
      </DayErrorBoundary>
    );
  } catch (err) {
    console.error('[CalendarDayContent] outer error', err);
    return <span>{props.date.getDate()}</span>;
  }
}
