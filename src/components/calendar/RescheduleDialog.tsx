import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarClock, Wand2, CalendarDays, AlertTriangle } from 'lucide-react';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { CropEvent } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { createNotification } from '@/lib/notify';

interface ForecastDay { date: string; maxTemp: number; precipitation: number; description?: string; }
interface Suggestion { date: Date; reason: string; }

const RESCHEDULE_REASONS = [
  'Personal Event', 'Bad Weather', 'Labor Unavailable',
  'Equipment Issue', 'Market Price Low', 'Other',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CropEvent | null;
  allEvents: CropEvent[];
}

export function RescheduleDialog({ open, onOpenChange, event, allEvents }: Props) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'choose' | 'suggest' | 'pick'>('choose');
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reason, setReason] = useState<string>('Bad Weather');
  const [shiftRest, setShiftRest] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && event) {
      setMode('choose');
      setSelectedDate(format(new Date(event.date), 'yyyy-MM-dd'));
      setReason('Bad Weather');
      setShiftRest(true);
    }
  }, [open, event]);

  const loadForecast = async () => {
    if (forecast.length || loadingForecast) return;
    setLoadingForecast(true);
    try {
      const lat = profile?.farm_latitude ?? null;
      const lon = profile?.farm_longitude ?? null;
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { lat, lon, language: 'en' },
      });
      if (error) throw error;
      setForecast(data?.forecast ?? []);
    } catch (e) {
      console.warn('forecast failed', e);
      toast.error('Could not fetch weather forecast');
    } finally {
      setLoadingForecast(false);
    }
  };

  const suggestions: Suggestion[] = useMemo(() => {
    if (!forecast.length) return [];
    const dayCounts = new Map<string, number>();
    allEvents.forEach(e => {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    });
    const candidates = forecast
      .map(f => {
        const d = parseISO(f.date);
        const others = (dayCounts.get(f.date) ?? 0) - (event && format(new Date(event.date), 'yyyy-MM-dd') === f.date ? 1 : 0);
        const noRain = (f.precipitation ?? 0) < 1;
        const cool = (f.maxTemp ?? 0) < 35;
        const score = (noRain ? 2 : 0) + (cool ? 2 : 0) + (others < 2 ? 1 : 0);
        const reasons: string[] = [];
        if (noRain) reasons.push('clear weather');
        else reasons.push(`${f.precipitation.toFixed(1)}mm rain`);
        if (cool) reasons.push(`${Math.round(f.maxTemp)}°C max`);
        else reasons.push(`hot ${Math.round(f.maxTemp)}°C`);
        reasons.push(`${others} other task${others === 1 ? '' : 's'}`);
        return { date: d, score, reason: reasons.join(' • ') };
      })
      .filter(c => c.date >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => b.score - a.score || a.date.getTime() - b.date.getTime())
      .slice(0, 3);
    return candidates;
  }, [forecast, allEvents, event]);

  const pickedWarning = useMemo(() => {
    if (!selectedDate) return null;
    const f = forecast.find(x => x.date === selectedDate);
    const otherCount = allEvents.filter(e =>
      format(new Date(e.date), 'yyyy-MM-dd') === selectedDate && e.id !== event?.id
    ).length;
    const msgs: string[] = [];
    if (f) {
      if ((f.precipitation ?? 0) >= 5) msgs.push(`${f.precipitation.toFixed(1)}mm rain expected`);
      if ((f.maxTemp ?? 0) >= 35) msgs.push(`hot day (${Math.round(f.maxTemp)}°C)`);
    }
    if (otherCount >= 3) msgs.push(`${otherCount} other tasks already on this day`);
    return msgs.length ? msgs.join(' • ') : null;
  }, [selectedDate, forecast, allEvents, event]);

  const harvestWarning = useMemo(() => {
    if (!event || !selectedDate) return null;
    const isHarvest = /harvest/i.test(event.eventType);
    if (!isHarvest) return null;
    const delay = differenceInDays(parseISO(selectedDate), new Date(event.date));
    if (delay > 14) return { level: 'critical' as const, msg: 'Critical — Harvest quality will be significantly affected. Consult expert.' };
    if (delay > 7) return { level: 'warn' as const, msg: 'Warning — Delaying harvest beyond 7 days may reduce crop quality.' };
    return null;
  }, [event, selectedDate]);

  const confirm = async (dateStr: string) => {
    if (!user || !event) return;
    setSaving(true);
    try {
      const newDate = dateStr;
      const originalDate = format(new Date(event.date), 'yyyy-MM-dd');
      const offset = differenceInDays(parseISO(newDate), new Date(event.date));

      const { error } = await supabase.from('calendar_events')
        .update({
          event_date: newDate,
          original_date: originalDate,
          rescheduled_reason: reason,
          rescheduled_at: new Date().toISOString(),
        })
        .eq('id', event.id);
      if (error) throw error;

      if (shiftRest && offset !== 0) {
        const { data: future } = await supabase.from('calendar_events')
          .select('id, event_date')
          .eq('user_id', user.id)
          .eq('crop_name', event.cropName)
          .gt('event_date', originalDate);
        if (future) {
          await Promise.all(future.map(f => supabase.from('calendar_events')
            .update({ event_date: format(addDays(parseISO(f.event_date), offset), 'yyyy-MM-dd') })
            .eq('id', f.id)
          ));
        }
      }

      await createNotification({
        userId: user.id,
        title: 'Activity rescheduled',
        message: `${event.eventType} for ${event.cropName} rescheduled to ${format(parseISO(newDate), 'MMM d, yyyy')}`,
        type: 'upcoming_activity',
        priority: 'normal',
        action_type: 'calendar',
        action_data: { date: newDate, cropName: event.cropName },
      });

      toast.success('Activity rescheduled');
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      onOpenChange(false);
    } catch (e) {
      console.error('reschedule failed', e);
      toast.error('Could not reschedule');
    } finally {
      setSaving(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />Reschedule activity</DialogTitle>
          <DialogDescription>
            {event.eventType} • {event.cropName} • currently {format(new Date(event.date), 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {mode === 'choose' && (
          <div className="grid gap-3">
            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => { setMode('suggest'); loadForecast(); }}>
              <Wand2 className="h-4 w-4 mr-2 text-primary" />
              <span className="text-left">
                <div className="font-medium">Suggest best date</div>
                <div className="text-xs text-muted-foreground">Based on weather & schedule</div>
              </span>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => { setMode('pick'); loadForecast(); }}>
              <CalendarDays className="h-4 w-4 mr-2 text-primary" />
              <span className="text-left">
                <div className="font-medium">Pick my own date</div>
                <div className="text-xs text-muted-foreground">Choose any date from the calendar</div>
              </span>
            </Button>
          </div>
        )}

        {mode !== 'choose' && (
          <div className="space-y-4">
            <ReasonAndShift reason={reason} setReason={setReason} shiftRest={shiftRest} setShiftRest={setShiftRest} />

            {mode === 'suggest' && (
              <div className="space-y-2">
                <Label>Top suggestions</Label>
                {loadingForecast ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading forecast…</div>
                ) : suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No forecast suggestions available.</p>
                ) : suggestions.map(s => {
                  const ds = format(s.date, 'yyyy-MM-dd');
                  return (
                    <button key={ds}
                      onClick={() => { setSelectedDate(ds); confirm(ds); }}
                      disabled={saving}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{format(s.date, 'EEE, MMM d')}</div>
                        <Badge variant="secondary">Suggested</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {mode === 'pick' && (
              <div className="space-y-2">
                <Label>New date</Label>
                <Input type="date" value={selectedDate} min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(e.target.value)} />
                {pickedWarning && (
                  <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{pickedWarning}</span>
                  </div>
                )}
                {harvestWarning && (
                  <div className={`flex items-start gap-2 p-2 rounded-md text-xs border ${
                    harvestWarning.level === 'critical' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{harvestWarning.msg}</span>
                  </div>
                )}
                <Button className="w-full" disabled={!selectedDate || saving}
                  onClick={() => confirm(selectedDate)}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Confirm reschedule
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => setMode('choose')}>Back</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReasonAndShift({ reason, setReason, shiftRest, setShiftRest }: {
  reason: string; setReason: (s: string) => void; shiftRest: boolean; setShiftRest: (b: boolean) => void;
}) {
  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/40">
      <div>
        <Label className="text-xs">Reason for rescheduling</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RESCHEDULE_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Shift all remaining activities</Label>
          <p className="text-[10px] text-muted-foreground">Move future tasks for this crop by the same offset</p>
        </div>
        <Switch checked={shiftRest} onCheckedChange={setShiftRest} />
      </div>
    </div>
  );
}
