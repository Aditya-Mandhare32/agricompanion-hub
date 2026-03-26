import React from 'react';
import {
  format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths,
  isToday, startOfWeek, endOfWeek, addDays, isSameMonth, isWithinInterval,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sprout, Droplets,
  FlaskConical, Scissors, MapPin, Edit, Leaf, Bug, Wheat,
} from 'lucide-react';
import { CropEvent } from '@/lib/types';

interface CropCycle {
  id: string; cropId: string; cropName: string;
  startDate: Date; endDate: Date; region: string; color: string; notes?: string;
}

const eventIcons: Record<string, any> = {
  'Sowing': Sprout, 'sowing': Sprout,
  'Fertilizing': FlaskConical, 'fertilizing': FlaskConical,
  'Irrigation': Droplets, 'irrigation': Droplets,
  'Harvest': Scissors, 'harvest': Scissors, 'Harvesting': Scissors,
  'Weeding': Leaf, 'Spraying': Bug, 'Land Preparation': Wheat,
};

const eventColors: Record<string, string> = {
  'Sowing': 'bg-emerald-500', 'sowing': 'bg-emerald-500',
  'Fertilizing': 'bg-amber-500', 'fertilizing': 'bg-amber-500',
  'Irrigation': 'bg-sky-500', 'irrigation': 'bg-sky-500',
  'Harvest': 'bg-rose-500', 'harvest': 'bg-rose-500', 'Harvesting': 'bg-rose-500',
  'Weeding': 'bg-green-600', 'Spraying': 'bg-red-500', 'Land Preparation': 'bg-orange-500',
};

function getIcon(type: string) { return eventIcons[type] || CalendarIcon; }
function getColor(type: string) { return eventColors[type] || 'bg-primary'; }

interface MonthGridViewProps {
  currentMonth: Date; selectedDate: Date; events: CropEvent[];
  cropCycles: CropCycle[];
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onCycleClick: (cycle: CropCycle) => void;
}

export function MonthGridView({ currentMonth, selectedDate, events, cropCycles, onMonthChange, onDateSelect, onCycleClick }: MonthGridViewProps) {
  const getCropCyclesForDate = (date: Date) => cropCycles.filter(c => isWithinInterval(date, { start: c.startDate, end: c.endDate }));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    const currentDay = day;
    const dayEvents = events.filter(e => isSameDay(new Date(e.date), currentDay));
    const dayCycles = getCropCyclesForDate(currentDay);
    const isCurrentMonth = isSameMonth(currentDay, currentMonth);
    const isSelected = isSameDay(currentDay, selectedDate);
    const isTodayDate = isToday(currentDay);

    days.push(
      <HoverCard key={currentDay.toISOString()} openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button onClick={() => onDateSelect(currentDay)} className={`
            relative min-h-[90px] p-1.5 rounded-lg border transition-all duration-200 hover:shadow-md text-left
            ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
            ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border/50'}
            ${isTodayDate ? 'bg-primary/5' : ''} hover:border-primary/50
          `}>
            <div className={`text-sm font-medium mb-1
              ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
              ${isSelected ? 'text-primary' : ''}
              ${isTodayDate ? 'text-primary font-bold' : ''}
            `}>
              {format(currentDay, 'd')}
              {isTodayDate && <span className="ml-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">Today</span>}
            </div>

            {/* Crop cycle blocks */}
            {dayCycles.length > 0 && (
              <div className="space-y-0.5 mb-1">
                {dayCycles.slice(0, 2).map((cycle, idx) => {
                  const isStart = isSameDay(cycle.startDate, currentDay);
                  const isEnd = isSameDay(cycle.endDate, currentDay);
                  return (
                    <div key={idx} onClick={(e) => { e.stopPropagation(); onCycleClick(cycle); }}
                      className={`text-[10px] px-1.5 py-0.5 font-medium text-white cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1
                        ${isStart ? 'rounded-l' : ''} ${isEnd ? 'rounded-r' : ''} ${!isStart && !isEnd ? '' : 'rounded'}
                      `} style={{ backgroundColor: cycle.color }}>
                      {isStart && <span>▶</span>}<span className="truncate">{cycle.cropName}</span>{isEnd && <span>◀</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Event icons - show activity icons on calendar dates */}
            {dayEvents.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {dayEvents.slice(0, 4).map((event, idx) => {
                  const Icon = getIcon(event.eventType);
                  const color = getColor(event.eventType);
                  return (
                    <div key={idx} className={`${color} rounded-sm p-0.5`} title={`${event.cropName} - ${event.eventType}`}>
                      <Icon className="h-2.5 w-2.5 text-white" />
                    </div>
                  );
                })}
                {dayEvents.length > 4 && <span className="text-[9px] text-muted-foreground font-medium">+{dayEvents.length - 4}</span>}
              </div>
            )}
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4" side="right" align="start">
          <div className="space-y-3">
            <div className="font-semibold text-base">{format(currentDay, 'EEEE, MMMM d, yyyy')}</div>
            {dayCycles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Active Crop Cycles</p>
                {dayCycles.map((cycle, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm mb-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer" onClick={() => onCycleClick(cycle)}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cycle.color }} />
                    <span className="font-medium">{cycle.cropName}</span>
                  </div>
                ))}
              </div>
            )}
            {dayEvents.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Events</p>
                {dayEvents.map((event, idx) => {
                  const Icon = getIcon(event.eventType);
                  const color = getColor(event.eventType);
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm mb-1.5">
                      <div className={`p-1 rounded ${color}`}><Icon className="h-3 w-3 text-white" /></div>
                      <span className="font-medium">{event.cropName}</span>
                      <span className="text-xs text-muted-foreground">- {event.eventType}</span>
                      {event.completed && <span className="text-xs text-emerald-500">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
            {dayCycles.length === 0 && dayEvents.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No activities scheduled</p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
    day = addDays(day, 1);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-primary" />{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          {[
            { type: 'Sowing', icon: Sprout, color: 'bg-emerald-500' },
            { type: 'Irrigation', icon: Droplets, color: 'bg-sky-500' },
            { type: 'Fertilizing', icon: FlaskConical, color: 'bg-amber-500' },
            { type: 'Harvest', icon: Scissors, color: 'bg-rose-500' },
            { type: 'Weeding', icon: Leaf, color: 'bg-green-600' },
            { type: 'Spraying', icon: Bug, color: 'bg-red-500' },
          ].map(({ type, icon: Icon, color }) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <div className={`p-1 rounded ${color}`}><Icon className="h-3 w-3 text-white" /></div>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
