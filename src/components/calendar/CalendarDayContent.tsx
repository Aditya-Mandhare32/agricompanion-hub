import React from 'react';
import { Sprout, Droplets, FlaskConical, Scissors } from 'lucide-react';
import { CropEvent } from '@/lib/types';
import { isSameDay } from 'date-fns';

const eventTypeIcons = {
  sowing: { icon: Sprout, color: 'text-emerald-500' },
  fertilizing: { icon: FlaskConical, color: 'text-amber-500' },
  irrigation: { icon: Droplets, color: 'text-sky-500' },
  harvest: { icon: Scissors, color: 'text-rose-500' },
};

interface CalendarDayContentProps {
  date: Date;
  events: CropEvent[];
}

export function CalendarDayContent({ date, events }: CalendarDayContentProps) {
  const dayEvents = events.filter(event => isSameDay(new Date(event.date), date));
  
  // Get unique event types for this day
  const uniqueTypes = [...new Set(dayEvents.map(e => e.eventType))];
  
  if (uniqueTypes.length === 0) {
    return <span>{date.getDate()}</span>;
  }

  return (
    <div className="relative flex flex-col items-center">
      <span className="font-semibold">{date.getDate()}</span>
      <div className="flex gap-0.5 mt-0.5">
        {uniqueTypes.slice(0, 3).map((type) => {
          const config = eventTypeIcons[type];
          const Icon = config.icon;
          return (
            <Icon 
              key={type} 
              className={`h-2.5 w-2.5 ${config.color}`} 
            />
          );
        })}
        {uniqueTypes.length > 3 && (
          <span className="text-[8px] text-muted-foreground">+{uniqueTypes.length - 3}</span>
        )}
      </div>
    </div>
  );
}
