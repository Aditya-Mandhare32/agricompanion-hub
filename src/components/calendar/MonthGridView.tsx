import React from 'react';
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isWithinInterval,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Droplets,
  FlaskConical,
  Scissors,
  MapPin,
  Edit,
} from 'lucide-react';
import { CropEvent } from '@/lib/types';

interface CropCycle {
  id: string;
  cropId: string;
  cropName: string;
  startDate: Date;
  endDate: Date;
  region: string;
  color: string;
  notes?: string;
}

const eventTypeConfig = {
  sowing: {
    icon: Sprout,
    color: 'bg-emerald-500',
    label: 'Sowing',
    textColor: 'text-emerald-700',
  },
  fertilizing: {
    icon: FlaskConical,
    color: 'bg-amber-500',
    label: 'Fertilizing',
    textColor: 'text-amber-700',
  },
  irrigation: {
    icon: Droplets,
    color: 'bg-sky-500',
    label: 'Irrigation',
    textColor: 'text-sky-700',
  },
  harvest: {
    icon: Scissors,
    color: 'bg-rose-500',
    label: 'Harvest',
    textColor: 'text-rose-700',
  },
};

interface MonthGridViewProps {
  currentMonth: Date;
  selectedDate: Date;
  events: CropEvent[];
  cropCycles: CropCycle[];
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onCycleClick: (cycle: CropCycle) => void;
}

export function MonthGridView({
  currentMonth,
  selectedDate,
  events,
  cropCycles,
  onMonthChange,
  onDateSelect,
  onCycleClick,
}: MonthGridViewProps) {
  const getCropCyclesForDate = (date: Date) => {
    return cropCycles.filter((cycle) =>
      isWithinInterval(date, { start: cycle.startDate, end: cycle.endDate })
    );
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    const currentDay = day;
    const dayEvents = events.filter((e) =>
      isSameDay(new Date(e.date), currentDay)
    );
    const dayCycles = getCropCyclesForDate(currentDay);
    const isCurrentMonth = isSameMonth(currentDay, currentMonth);
    const isSelected = isSameDay(currentDay, selectedDate);
    const isTodayDate = isToday(currentDay);

    days.push(
      <HoverCard key={currentDay.toISOString()} openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            onClick={() => onDateSelect(currentDay)}
            className={`
              relative min-h-[90px] p-1.5 rounded-lg border transition-all duration-200 hover:shadow-md text-left
              ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
              ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border/50'}
              ${isTodayDate ? 'bg-primary/5' : ''}
              hover:border-primary/50
            `}
          >
            <div
              className={`
              text-sm font-medium mb-1
              ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
              ${isSelected ? 'text-primary' : ''}
              ${isTodayDate ? 'text-primary font-bold' : ''}
            `}
            >
              {format(currentDay, 'd')}
              {isTodayDate && (
                <span className="ml-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">
                  Today
                </span>
              )}
            </div>

            {/* Crop cycle blocks with color bars */}
            {dayCycles.length > 0 && (
              <div className="space-y-0.5 mb-1">
                {dayCycles.slice(0, 2).map((cycle, idx) => {
                  const isStart = isSameDay(cycle.startDate, currentDay);
                  const isEnd = isSameDay(cycle.endDate, currentDay);
                  return (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCycleClick(cycle);
                      }}
                      className={`
                        text-[10px] px-1.5 py-0.5 font-medium text-white cursor-pointer
                        hover:opacity-80 transition-opacity flex items-center gap-1
                        ${isStart ? 'rounded-l' : ''}
                        ${isEnd ? 'rounded-r' : ''}
                        ${!isStart && !isEnd ? '' : 'rounded'}
                      `}
                      style={{ backgroundColor: cycle.color }}
                    >
                      {isStart && <span>▶</span>}
                      <span className="truncate">{cycle.cropName}</span>
                      {isEnd && <span>◀</span>}
                    </div>
                  );
                })}
                {dayCycles.length > 2 && (
                  <span className="text-[9px] text-muted-foreground font-medium px-1">
                    +{dayCycles.length - 2} more
                  </span>
                )}
              </div>
            )}

            {/* Event icons */}
            {dayEvents.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {[...new Set(dayEvents.map((e) => e.eventType))]
                  .slice(0, 4)
                  .map((type, idx) => {
                    const config = eventTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={idx}
                        className={`${config.color} rounded-sm p-0.5`}
                        title={config.label}
                      >
                        <Icon className="h-2.5 w-2.5 text-white" />
                      </div>
                    );
                  })}
                {dayEvents.length > 4 && (
                  <span className="text-[9px] text-muted-foreground font-medium">
                    +{dayEvents.length - 4}
                  </span>
                )}
              </div>
            )}
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4" side="right" align="start">
          <div className="space-y-3">
            <div className="font-semibold text-base">
              {format(currentDay, 'EEEE, MMMM d, yyyy')}
            </div>

            {dayCycles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Active Crop Cycles
                </p>
                {dayCycles.map((cycle, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 text-sm mb-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                    onClick={() => onCycleClick(cycle)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cycle.color }}
                      />
                      <div>
                        <span className="font-medium">{cycle.cropName}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {cycle.region}
                        </div>
                      </div>
                    </div>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}

            {dayEvents.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Events
                </p>
                {dayEvents.map((event, idx) => {
                  const config = eventTypeConfig[event.eventType];
                  const Icon = config.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm mb-1.5"
                    >
                      <div className={`p-1 rounded ${config.color}`}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium">{event.cropName}</span>
                      <span className={`text-xs ${config.textColor}`}>
                        - {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {dayCycles.length === 0 && dayEvents.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No activities scheduled
              </p>
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
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          {Object.entries(eventTypeConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div className={`p-1 rounded ${config.color}`}>
                <config.icon className="h-3 w-3 text-white" />
              </div>
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
