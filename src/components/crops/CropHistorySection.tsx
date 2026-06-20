import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Star, IndianRupee, Calendar, Leaf } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Completed {
  id: string;
  crop_name: string;
  field_name: string | null;
  sowing_date: string | null;
  harvest_date: string;
  total_days: number | null;
  yield_amount: number | null;
  yield_unit: string | null;
  selling_price: number | null;
  total_income: number | null;
  issues_faced: string[] | null;
  season_rating: number | null;
  notes: string | null;
  health_score_average: number | null;
  created_at: string;
}

interface Props { language: string }

export function CropHistorySection({ language }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Completed | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['completedCrops', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('completed_crops' as any) as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('harvest_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Completed[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <section className="mt-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
          <Archive className="h-5 w-5 text-primary" />
          {language === 'hi' ? 'फसल इतिहास' : language === 'mr' ? 'पीक इतिहास' : 'Crop History'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          {language === 'hi' ? 'फसल इतिहास' : language === 'mr' ? 'पीक इतिहास' : 'Crop History'}
          <Badge variant="secondary" className="ml-2">{data.length}</Badge>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map(c => (
          <Card
            key={c.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500"
            onClick={() => setSelected(c)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-base">{c.crop_name}</h3>
                  {c.field_name && <p className="text-xs text-muted-foreground">{c.field_name}</p>}
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`h-3 w-3 ${(c.season_rating || 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c.total_days ?? '—'}d</span>
                <span className="flex items-center gap-1"><Leaf className="h-3 w-3" />{c.yield_amount ?? '—'} {c.yield_unit}</span>
              </div>
              <div className="text-sm font-medium text-emerald-700 flex items-center">
                <IndianRupee className="h-4 w-4" />
                {(c.total_income ?? 0).toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-600" />
                  {selected.crop_name}
                  {selected.field_name && <span className="text-sm text-muted-foreground font-normal">— {selected.field_name}</span>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <Stat label={language === 'hi' ? 'बुवाई' : language === 'mr' ? 'पेरणी' : 'Sown'}
                        value={selected.sowing_date ? format(new Date(selected.sowing_date), 'dd MMM yyyy') : '—'} />
                  <Stat label={language === 'hi' ? 'कटाई' : language === 'mr' ? 'काढणी' : 'Harvested'}
                        value={format(new Date(selected.harvest_date), 'dd MMM yyyy')} />
                  <Stat label={language === 'hi' ? 'कुल दिन' : language === 'mr' ? 'एकूण दिवस' : 'Total days'}
                        value={selected.total_days?.toString() ?? '—'} />
                  <Stat label={language === 'hi' ? 'उपज' : language === 'mr' ? 'उत्पादन' : 'Yield'}
                        value={`${selected.yield_amount ?? '—'} ${selected.yield_unit ?? ''}`} />
                  <Stat label={language === 'hi' ? 'मूल्य/किलो' : language === 'mr' ? 'किंमत/किलो' : 'Price/kg'}
                        value={`₹${selected.selling_price ?? '—'}`} />
                  <Stat label={language === 'hi' ? 'कुल आय' : language === 'mr' ? 'एकूण उत्पन्न' : 'Total income'}
                        value={`₹${(selected.total_income ?? 0).toLocaleString('en-IN')}`} highlight />
                </div>
                {selected.issues_faced && selected.issues_faced.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {language === 'hi' ? 'समस्याएं' : language === 'mr' ? 'अडचणी' : 'Issues'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selected.issues_faced.map((i) => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}
                    </div>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {language === 'hi' ? 'टिप्पणी' : language === 'mr' ? 'टिप्पणी' : 'Notes'}
                    </div>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-2 ${highlight ? 'border-emerald-300 bg-emerald-50' : 'border-border'}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${highlight ? 'text-emerald-700' : ''}`}>{value}</div>
    </div>
  );
}
