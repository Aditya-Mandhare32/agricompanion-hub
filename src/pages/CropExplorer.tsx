import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, Sprout, Droplets, Sun, Calendar, IndianRupee,
  TrendingUp, Leaf, Filter, X, ChevronDown
} from 'lucide-react';

interface CropData {
  id: string;
  name: string;
  name_hi: string | null;
  name_mr: string | null;
  category: string;
  season: string;
  duration_days: number | null;
  min_ph: number | null;
  max_ph: number | null;
  water_needs: string | null;
  cost_per_acre: number | null;
  expected_yield_per_acre: string | null;
  market_price_range: string | null;
  profit_potential: string | null;
  image_url: string | null;
  growing_guide: any;
  expert_tips: string[] | null;
  soil_types: string[] | null;
  ideal_temperature_min: number | null;
  ideal_temperature_max: number | null;
}

const categories = ['All', 'Cereals', 'Vegetables', 'Fruits', 'Pulses', 'Oilseeds', 'Cash Crops', 'Flowers', 'Fodder'];
const seasons = ['All', 'Kharif', 'Rabi', 'Zaid', 'Year-round'];
const waterOptions = ['All', 'Low', 'Medium', 'High'];

export default function CropExplorer() {
  const { language } = useApp();
  const [crops, setCrops] = useState<CropData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [seasonFilter, setSeasonFilter] = useState('All');
  const [waterFilter, setWaterFilter] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('name');
    if (!error && data) setCrops(data as CropData[]);
    setLoading(false);
  };

  const getName = (crop: CropData) => {
    if (language === 'hi' && crop.name_hi) return crop.name_hi;
    if (language === 'mr' && crop.name_mr) return crop.name_mr;
    return crop.name;
  };

  const filteredCrops = useMemo(() => {
    return crops.filter(crop => {
      const matchesSearch = !search || 
        crop.name.toLowerCase().includes(search.toLowerCase()) ||
        (crop.name_hi && crop.name_hi.includes(search)) ||
        (crop.name_mr && crop.name_mr.includes(search)) ||
        crop.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || crop.category === categoryFilter;
      const matchesSeason = seasonFilter === 'All' || crop.season === seasonFilter;
      const matchesWater = waterFilter === 'All' || crop.water_needs === waterFilter;
      return matchesSearch && matchesCategory && matchesSeason && matchesWater;
    });
  }, [crops, search, categoryFilter, seasonFilter, waterFilter]);

  const profitColor = (p: string | null) => {
    if (p === 'Very High') return 'text-emerald-600 bg-emerald-500/10';
    if (p === 'High') return 'text-primary bg-primary/10';
    if (p === 'Medium') return 'text-amber-600 bg-amber-500/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {language === 'hi' ? 'फसल एक्सप्लोरर' : language === 'mr' ? 'पीक एक्सप्लोरर' : 'Crop Explorer'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'hi' ? '25+ फसलों का विस्तृत डेटा' : language === 'mr' ? '25+ पिकांचा तपशीलवार डेटा' : 'Detailed data on 25+ Indian crops'}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'hi' ? 'फसल खोजें...' : language === 'mr' ? 'पीक शोधा...' : 'Search crops...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
                <Filter className="h-4 w-4 mr-1" />
                {language === 'hi' ? 'फ़िल्टर' : language === 'mr' ? 'फिल्टर' : 'Filters'}
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl border">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger><SelectValue placeholder="Season" /></SelectTrigger>
                  <SelectContent>
                    {seasons.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={waterFilter} onValueChange={setWaterFilter}>
                  <SelectTrigger><SelectValue placeholder="Water Needs" /></SelectTrigger>
                  <SelectContent>
                    {waterOptions.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(categoryFilter !== 'All' || seasonFilter !== 'All' || waterFilter !== 'All') && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {categoryFilter !== 'All' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategoryFilter('All')}>{categoryFilter} <X className="h-3 w-3 ml-1" /></Badge>}
                {seasonFilter !== 'All' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setSeasonFilter('All')}>{seasonFilter} <X className="h-3 w-3 ml-1" /></Badge>}
                {waterFilter !== 'All' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setWaterFilter('All')}>{waterFilter} water <X className="h-3 w-3 ml-1" /></Badge>}
              </div>
            )}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredCrops.length} {language === 'hi' ? 'फसलें मिलीं' : language === 'mr' ? 'पिके सापडली' : 'crops found'}
          </p>

          {/* Crops Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCrops.map((crop) => (
                <Card
                  key={crop.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
                  onClick={() => setSelectedCrop(crop)}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={crop.image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'}
                      alt={crop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-white font-bold text-lg">{getName(crop)}</h3>
                      <span className="text-white/80 text-xs">{crop.name !== getName(crop) ? crop.name : ''}</span>
                    </div>
                    <Badge className="absolute top-3 right-3 text-xs" variant="secondary">{crop.category}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-1.5 rounded-lg bg-muted/50">
                        <Calendar className="h-3.5 w-3.5 mx-auto text-primary mb-0.5" />
                        <div className="text-[10px] text-muted-foreground">{crop.season}</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-muted/50">
                        <Droplets className="h-3.5 w-3.5 mx-auto text-sky-500 mb-0.5" />
                        <div className="text-[10px] text-muted-foreground">{crop.water_needs || '-'}</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-muted/50">
                        <Sun className="h-3.5 w-3.5 mx-auto text-amber-500 mb-0.5" />
                        <div className="text-[10px] text-muted-foreground">{crop.duration_days ? `${crop.duration_days}d` : '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {crop.cost_per_acre && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {(crop.cost_per_acre / 1000).toFixed(0)}K/acre
                        </span>
                      )}
                      {crop.profit_potential && (
                        <Badge variant="outline" className={`text-[10px] ${profitColor(crop.profit_potential)}`}>
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                          {crop.profit_potential}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Crop Detail Dialog */}
      <Dialog open={!!selectedCrop} onOpenChange={() => setSelectedCrop(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCrop && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3">
                  <Sprout className="h-6 w-6 text-primary" />
                  {getName(selectedCrop)}
                  {selectedCrop.name !== getName(selectedCrop) && (
                    <span className="text-base text-muted-foreground font-normal">({selectedCrop.name})</span>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image */}
                <div className="rounded-xl overflow-hidden h-48">
                  <img
                    src={selectedCrop.image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600'}
                    alt={selectedCrop.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
                    <div className="text-xs text-muted-foreground">Season</div>
                    <div className="font-semibold text-sm">{selectedCrop.season}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Droplets className="h-5 w-5 mx-auto text-sky-500 mb-1" />
                    <div className="text-xs text-muted-foreground">Water</div>
                    <div className="font-semibold text-sm">{selectedCrop.water_needs || '-'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Sun className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="font-semibold text-sm">{selectedCrop.duration_days ? `${selectedCrop.duration_days} days` : '-'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                    <div className="text-xs text-muted-foreground">Profit</div>
                    <div className="font-semibold text-sm">{selectedCrop.profit_potential || '-'}</div>
                  </div>
                </div>

                {/* Soil & Nutrient Requirements */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    {language === 'hi' ? 'आवश्यकताएं' : language === 'mr' ? 'आवश्यकता' : 'Requirements'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">pH Range</span>
                      <span className="font-medium">{selectedCrop.min_ph}-{selectedCrop.max_ph}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">Temp (°C)</span>
                      <span className="font-medium">{selectedCrop.ideal_temperature_min}-{selectedCrop.ideal_temperature_max}</span>
                    </div>
                    {selectedCrop.soil_types && (
                      <div className="col-span-2 p-2 bg-muted/30 rounded-lg">
                        <span className="text-muted-foreground text-xs">Suitable soils: </span>
                        <span className="font-medium text-xs">{selectedCrop.soil_types.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Economics */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    {language === 'hi' ? 'अर्थशास्त्र' : language === 'mr' ? 'अर्थशास्त्र' : 'Economics'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="p-3 bg-primary/5 rounded-xl">
                      <div className="text-xs text-muted-foreground">Cost/Acre</div>
                      <div className="font-bold text-primary">₹{selectedCrop.cost_per_acre?.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-xl">
                      <div className="text-xs text-muted-foreground">Expected Yield</div>
                      <div className="font-bold text-secondary">{selectedCrop.expected_yield_per_acre}</div>
                    </div>
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <div className="text-xs text-muted-foreground">Market Price</div>
                      <div className="font-bold text-accent">{selectedCrop.market_price_range}</div>
                    </div>
                  </div>
                </div>

                {/* Growing Guide */}
                {selectedCrop.growing_guide && typeof selectedCrop.growing_guide === 'object' && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === 'hi' ? 'उगाने की विधि' : language === 'mr' ? 'वाढवण्याची पद्धत' : 'Growing Guide'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedCrop.growing_guide as Record<string, any>).map(([key, value]) => {
                        if (key === 'fertilizer_schedule' && Array.isArray(value)) return null;
                        return (
                          <div key={key} className="p-3 bg-muted/30 rounded-lg">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                            <span className="text-muted-foreground">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expert Tips */}
                {selectedCrop.expert_tips && selectedCrop.expert_tips.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === 'hi' ? 'विशेषज्ञ सुझाव' : language === 'mr' ? 'तज्ञ सल्ले' : 'Expert Tips'}
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedCrop.expert_tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Leaf className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
