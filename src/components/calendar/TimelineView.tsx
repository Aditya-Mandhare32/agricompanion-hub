import React from 'react';
import {
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isWithinInterval,
  isSameDay,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  LayoutList,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Sprout,
  Scissors,
  Edit,
  Trash2,
  Droplets,
  FlaskConical,
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

interface TimelineViewProps {
  events: CropEvent[];
  cropCycles: CropCycle[];
  onCycleClick: (cycle: CropCycle) => void;
  onCycleDelete: (id: string) => void;
  onEventEdit: (event: CropEvent) => void;
  onEventDelete: (id: string) => void;
}

export function TimelineView({
  events,
  cropCycles,
  onCycleClick,
  onCycleDelete,
  onEventEdit,
  onEventDelete,
}: TimelineViewProps) {
  const [viewMonth, setViewMonth] = React.useState(new Date());

  // Get 3 months for the Gantt view
  const monthsToShow = 3;
  const startMonth = startOfMonth(viewMonth);
  const endMonth = endOfMonth(addMonths(viewMonth, monthsToShow - 1));
  const totalDays = differenceInDays(endMonth, startMonth) + 1;
  const dayWidth = 28; // px per day

  const allDays = eachDayOfInterval({ start: startMonth, end: endMonth });

  // Group days by month for headers
  const months = [];
  for (let i = 0; i < monthsToShow; i++) {
    const month = addMonths(viewMonth, i);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    months.push({ date: month, days: daysInMonth });
  }

  const getCyclePosition = (cycle: CropCycle) => {
    const cycleStart = new Date(cycle.startDate);
    const cycleEnd = new Date(cycle.endDate);

    // Clamp to visible range
    const visibleStart = cycleStart < startMonth ? startMonth : cycleStart;
    const visibleEnd = cycleEnd > endMonth ? endMonth : cycleEnd;

    const startOffset = differenceInDays(visibleStart, startMonth);
    const duration = differenceInDays(visibleEnd, visibleStart) + 1;

    // Check if cycle is within visible range
    if (cycleEnd < startMonth || cycleStart > endMonth) {
      return null;
    }

    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth,
      isStartVisible: cycleStart >= startMonth,
      isEndVisible: cycleEnd <= endMonth,
    };
  };

  const getEventPosition = (event: CropEvent) => {
    const eventDate = new Date(event.date);
    if (eventDate < startMonth || eventDate > endMonth) return null;
    const offset = differenceInDays(eventDate, startMonth);
    return { left: offset * dayWidth + dayWidth / 2 };
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" />
            Timeline View (Gantt)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div style={{ minWidth: totalDays * dayWidth + 200 }}>
            {/* Month headers */}
            <div className="flex border-b sticky top-0 bg-background z-10">
              <div className="w-[200px] flex-shrink-0 p-3 font-semibold border-r bg-muted/30">
                Crop Cycles
              </div>
              <div className="flex">
                {months.map((m, idx) => (
                  <div
                    key={idx}
                    className="text-center font-semibold p-2 border-r bg-muted/30"
                    style={{ width: m.days * dayWidth }}
                  >
                    {format(m.date, 'MMMM yyyy')}
                  </div>
                ))}
              </div>
            </div>

            {/* Day headers */}
            <div className="flex border-b bg-muted/10">
              <div className="w-[200px] flex-shrink-0 border-r" />
              <div className="flex">
                {allDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`text-center text-xs py-1 border-r ${
                      isSameDay(day, new Date())
                        ? 'bg-primary/20 font-bold text-primary'
                        : ''
                    }`}
                    style={{ width: dayWidth }}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>
            </div>

            {/* Crop cycle rows */}
            {cropCycles.length === 0 ? (
              <div className="flex">
                <div className="w-[200px] flex-shrink-0 p-4 border-r" />
                <div className="flex-1 p-8 text-center text-muted-foreground">
                  No crop cycles added yet. Add your first crop cycle to see it
                  on the timeline.
                </div>
              </div>
            ) : (
              cropCycles.map((cycle) => {
                const position = getCyclePosition(cycle);
                const progress = Math.min(
                  100,
                  Math.max(
                    0,
                    (differenceInDays(new Date(), cycle.startDate) /
                      differenceInDays(cycle.endDate, cycle.startDate)) *
                      100
                  )
                );

                return (
                  <div key={cycle.id} className="flex border-b hover:bg-muted/30">
                    <div className="w-[200px] flex-shrink-0 p-3 border-r flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cycle.color }}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {cycle.cropName}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {cycle.region}
                        </div>
                      </div>
                      <div className="ml-auto flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onCycleClick(cycle)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => onCycleDelete(cycle.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div
                      className="relative"
                      style={{ width: totalDays * dayWidth }}
                    >
                      {/* Today line */}
                      {(() => {
                        const todayPos = getEventPosition({
                          date: new Date(),
                        } as CropEvent);
                        if (todayPos) {
                          return (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10"
                              style={{ left: todayPos.left }}
                            />
                          );
                        }
                        return null;
                      })()}

                      {position && (
                        <HoverCard openDelay={200}>
                          <HoverCardTrigger asChild>
                            <div
                              className={`absolute top-2 h-8 rounded cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md flex items-center px-2 text-white text-xs font-medium overflow-hidden ${
                                position.isStartVisible ? 'rounded-l-full' : ''
                              } ${position.isEndVisible ? 'rounded-r-full' : ''}`}
                              style={{
                                left: position.left,
                                width: position.width,
                                backgroundColor: cycle.color,
                              }}
                              onClick={() => onCycleClick(cycle)}
                            >
                              <div className="truncate">
                                {cycle.cropName}
                                <span className="opacity-70 ml-1">
                                  ({Math.round(progress)}%)
                                </span>
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: cycle.color }}
                                />
                                <span className="font-semibold">
                                  {cycle.cropName}
                                </span>
                              </div>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {cycle.region}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Sprout className="h-3 w-3 text-emerald-500" />
                                  Start: {format(cycle.startDate, 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Scissors className="h-3 w-3 text-rose-500" />
                                  Harvest: {format(cycle.endDate, 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {differenceInDays(cycle.endDate, cycle.startDate)}{' '}
                                  days total
                                </div>
                              </div>
                              <div className="pt-2">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${progress}%`,
                                      backgroundColor: cycle.color,
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 text-right">
                                  {Math.round(progress)}% complete
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Events section */}
            <div className="border-t mt-4">
              <div className="flex border-b bg-muted/30">
                <div className="w-[200px] flex-shrink-0 p-3 font-semibold border-r">
                  Events
                </div>
                <div className="flex-1 p-3 text-sm text-muted-foreground">
                  {events.length} events scheduled
                </div>
              </div>

              {events
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .slice(0, 10)
                .map((event) => {
                  const config = eventTypeConfig[event.eventType];
                  const Icon = config.icon;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center border-b hover:bg-muted/30 py-2"
                    >
                      <div className="w-[200px] flex-shrink-0 px-3 flex items-center gap-2">
                        <div className={`p-1.5 rounded ${config.color}`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {event.cropName}
                          </div>
                          <Badge variant="outline" className={`text-xs ${config.textColor}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="ml-auto flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onEventEdit(event)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => onEventDelete(event.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="relative h-8"
                        style={{ width: totalDays * dayWidth }}
                      >
                        {(() => {
                          const pos = getEventPosition(event);
                          if (pos) {
                            return (
                              <div
                                className={`absolute top-1 w-6 h-6 rounded-full ${config.color} flex items-center justify-center shadow-md`}
                                style={{ left: pos.left - 12 }}
                                title={`${event.cropName} - ${config.label}`}
                              >
                                <Icon className="h-3 w-3 text-white" />
                              </div>
                            );
                          }
                          return (
                            <div className="text-xs text-muted-foreground px-2">
                              {format(new Date(event.date), 'MMM d, yyyy')}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
