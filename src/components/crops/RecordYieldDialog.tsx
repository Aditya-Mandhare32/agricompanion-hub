import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { createNotification } from '@/lib/notify';
import { differenceInDays } from 'date-fns';

interface CropRecord {
  id: string;
  crop_name: string;
  field_name?: string | null;
  sowing_date?: string | null;
  expected_harvest_date?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop: CropRecord | null;
  language: string;
  onCompleted?: () => void;
}

const ISSUE_OPTIONS = [
  { value: 'none',    label_en: 'None',          label_hi: 'कोई नहीं',     label_mr: 'काही नाही' },
  { value: 'pest',    label_en: 'Pest attack',   label_hi: 'कीट हमला',     label_mr: 'किडींचा हल्ला' },
  { value: 'disease', label_en: 'Disease',       label_hi: 'रोग',           label_mr: 'रोग' },
  { value: 'drought', label_en: 'Drought',       label_hi: 'सूखा',          label_mr: 'दुष्काळ' },
  { value: 'flood',   label_en: 'Flood',         label_hi: 'बाढ़',          label_mr: 'पूर' },
  { value: 'heat',    label_en: 'Heat stress',   label_hi: 'गर्मी तनाव',    label_mr: 'उष्णतेचा ताण' },
  { value: 'weeds',   label_en: 'Weeds',         label_hi: 'खरपतवार',       label_mr: 'तण' },
];

export function RecordYieldDialog({ open, onOpenChange, crop, language, onCompleted }: Props) {
  const { user } = useAuth();
  const [yieldAmount, setYieldAmount] = useState('');
  const [yieldUnit, setYieldUnit] = useState<'kg' | 'quintal'>('quintal');
  const [pricePerKg, setPricePerKg] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totalIncome = useMemo(() => {
    const amount = parseFloat(yieldAmount);
    const price = parseFloat(pricePerKg);
    if (!isFinite(amount) || !isFinite(price)) return 0;
    const kg = yieldUnit === 'quintal' ? amount * 100 : amount;
    return Math.round(kg * price);
  }, [yieldAmount, pricePerKg, yieldUnit]);

  const toggleIssue = (v: string) => {
    if (v === 'none') { setIssues(['none']); return; }
    setIssues(prev => {
      const filtered = prev.filter(i => i !== 'none');
      return filtered.includes(v) ? filtered.filter(i => i !== v) : [...filtered, v];
    });
  };

  const submit = async () => {
    if (!user || !crop) return;
    if (!yieldAmount || !pricePerKg) {
      toast.error(language === 'hi' ? 'उपज और कीमत भरें' : language === 'mr' ? 'उत्पादन व किंमत भरा' : 'Enter yield and price');
      return;
    }
    setSaving(true);
    try {
      const sowingDate = crop.sowing_date ? new Date(crop.sowing_date) : null;
      const today = new Date();
      const totalDays = sowingDate ? Math.max(1, differenceInDays(today, sowingDate)) : null;

      const { error: insertErr } = await (supabase.from('completed_crops' as any) as any).insert({
        user_id: user.id,
        crop_schedule_id: crop.id,
        crop_name: crop.crop_name,
        field_name: crop.field_name ?? null,
        sowing_date: crop.sowing_date ?? null,
        harvest_date: today.toISOString().split('T')[0],
        total_days: totalDays,
        yield_amount: parseFloat(yieldAmount),
        yield_unit: yieldUnit,
        selling_price: parseFloat(pricePerKg),
        total_income: totalIncome,
        issues_faced: issues.filter(i => i !== 'none'),
        season_rating: rating || null,
        notes: notes || null,
      });
      if (insertErr) throw insertErr;

      // Mark the source crop as completed so it disappears from Active Crops.
      await supabase
        .from('crop_history')
        .update({ status: 'completed', harvested_at: new Date().toISOString() } as any)
        .eq('id', crop.id)
        .eq('user_id', user.id);

      // Remove future calendar events for this crop so dashboard stops nagging.
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id)
        .eq('crop_name', crop.crop_name)
        .eq('completed', false);

      // Notify farmer
      try {
        await createNotification({
          userId: user.id,
          type: 'crop_harvest_complete',
          title: language === 'hi' ? 'फसल कटाई पूर्ण' : language === 'mr' ? 'पीक काढणी पूर्ण' : 'Harvest Complete',
          message: `${crop.crop_name} — ${language === 'hi' ? 'सीज़न सफलतापूर्वक दर्ज' : language === 'mr' ? 'हंगाम यशस्वीरीत्या नोंदवला' : 'season recorded successfully'} (₹${totalIncome.toLocaleString('en-IN')})`,
          priority: 'normal',
          action_type: 'view_dashboard',
          dedupeKey: `harvest-${crop.id}`,
        });
      } catch {}

      toast.success(language === 'hi' ? 'सीज़न सफलतापूर्वक दर्ज हुआ' : language === 'mr' ? 'हंगाम यशस्वीरीत्या नोंदवला' : 'Season recorded successfully');
      onOpenChange(false);
      onCompleted?.();
      // Reset for next time
      setYieldAmount(''); setPricePerKg(''); setIssues([]); setRating(0); setNotes('');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!crop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'hi' ? `${crop.crop_name} — उपज दर्ज करें` :
             language === 'mr' ? `${crop.crop_name} — उत्पादन नोंदवा` :
             `Record yield — ${crop.crop_name}`}
          </DialogTitle>
          <DialogDescription>
            {language === 'hi' ? 'अपनी मेहनत का परिणाम सहेजें' :
             language === 'mr' ? 'तुमच्या मेहनतीचे फळ जतन करा' :
             'Save the outcome of your season for future tracking'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">
                {language === 'hi' ? 'कुल उपज' : language === 'mr' ? 'एकूण उत्पादन' : 'Total Yield'}
              </Label>
              <Input type="number" min="0" step="0.01" value={yieldAmount} onChange={(e) => setYieldAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Select value={yieldUnit} onValueChange={(v: any) => setYieldUnit(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quintal">Quintal</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              {language === 'hi' ? 'विक्रय मूल्य (₹ प्रति किलो)' :
               language === 'mr' ? 'विक्री किंमत (₹ प्रति किलो)' :
               'Selling price (₹ per kg)'}
            </Label>
            <Input type="number" min="0" step="0.01" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} placeholder="0" />
          </div>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-900">
              {language === 'hi' ? 'कुल आय' : language === 'mr' ? 'एकूण उत्पन्न' : 'Total Income'}
            </span>
            <span className="text-xl font-bold text-emerald-700 flex items-center">
              <IndianRupee className="h-5 w-5" />{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">
              {language === 'hi' ? 'समस्याएं (जो लागू हों)' : language === 'mr' ? 'अडचणी (लागू असलेल्या)' : 'Issues faced (select all that apply)'}
            </Label>
            <div className="flex flex-wrap gap-2">
              {ISSUE_OPTIONS.map(opt => {
                const label = language === 'hi' ? opt.label_hi : language === 'mr' ? opt.label_mr : opt.label_en;
                const selected = issues.includes(opt.value);
                return (
                  <Badge
                    key={opt.value}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleIssue(opt.value)}
                  >
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              {language === 'hi' ? 'सीज़न रेटिंग' : language === 'mr' ? 'हंगाम रेटिंग' : 'Season rating'}
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n === rating ? 0 : n)}
                  className="p-1 hover:scale-110 transition"
                  aria-label={`${n} stars`}
                >
                  <Star className={`h-7 w-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              {language === 'hi' ? 'टिप्पणियाँ (वैकल्पिक)' : language === 'mr' ? 'टिप्पणी (पर्यायी)' : 'Notes (optional)'}
            </Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {language === 'hi' ? 'सहेजें' : language === 'mr' ? 'जतन करा' : 'Save Season'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
