import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Sprout, Clock, Sun, Droplets, Leaf, Plus, Lightbulb } from 'lucide-react';
import { useAllCropsFromDB } from '@/hooks/useCrops';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getCropActivities, getActivityDayOffsets, getTipForActivity, getActivityName, type CropActivityData } from '@/lib/cropActivities';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

export function AddOtherCropDialog({ isOpen, onClose, language }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allCrops, isLoading } = useAllCropsFromDB();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [sowingDate, setSowingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [acres, setAcres] = useState('1');
  const [adding, setAdding] = useState(false);
  const [cropActivitiesData, setCropActivitiesData] = useState<Record<string, CropActivityData>>({});

  useEffect(() => {
    getCropActivities().then(setCropActivitiesData);
  }, []);

  const filteredCrops = useMemo(() => {
    if (!allCrops) return [];
    if (!searchQuery.trim()) return allCrops;
    const q = searchQuery.toLowerCase();
    return allCrops.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.name_hi?.toLowerCase().includes(q) ||
      c.name_mr?.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }, [allCrops, searchQuery]);

  const getCropName = (crop: any) => {
    if (language === 'hi' && crop.name_hi) return `${crop.name_hi} (${crop.name})`;
    if (language === 'mr' && crop.name_mr) return `${crop.name_mr} (${crop.name})`;
    return crop.name;
  };

  const handleAddCrop = async () => {
    if (!selectedCrop || !user) return;
    setAdding(true);
    try {
      const sDate = new Date(sowingDate);
      const duration = selectedCrop.duration_days || 90;
      const harvestDate = addDays(sDate, duration);

      const { error: histError } = await supabase.from('crop_history').insert({
        user_id: user.id,
        crop_name: selectedCrop.name,
        crop_category: selectedCrop.category,
        sowing_date: format(sDate, 'yyyy-MM-dd'),
        expected_harvest_date: format(harvestDate, 'yyyy-MM-dd'),
        field_name: `${acres} acres`,
        source: 'manual',
      });
      if (histError) throw histError;

      // Use ICAR activity dataset if available
      const cropActivityData = cropActivitiesData[selectedCrop.name];
      let calendarInserts: any[] = [];

      if (cropActivityData && cropActivityData.activities.length > 0) {
        const offsets = getActivityDayOffsets(cropActivityData.activities, duration);
        const tip = getTipForActivity(cropActivityData, language);
        const shortTip = tip ? tip.split('.')[0] + '.' : '';
        
        calendarInserts = offsets.map(({ activity, dayOffset }) => ({
          user_id: user.id,
          crop_name: selectedCrop.name,
          event_type: getActivityName(activity, language),
          event_date: format(addDays(sDate, dayOffset), 'yyyy-MM-dd'),
          notes: `${selectedCrop.name} - ${getActivityName(activity, language)} (${acres} acres)${activity.notes ? ' | ' + activity.notes : ''}${shortTip ? ' | 💡 ' + shortTip : ''}`,
        }));
      } else {
        // Fallback generic activities
        const events = [
          { type: 'Sowing', dayOffset: 0 },
          { type: 'Irrigation', dayOffset: Math.floor(duration * 0.1) },
          { type: 'Weeding', dayOffset: Math.floor(duration * 0.2) },
          { type: 'Fertilizing', dayOffset: Math.floor(duration * 0.3) },
          { type: 'Spraying', dayOffset: Math.floor(duration * 0.5) },
          { type: 'Harvesting', dayOffset: duration },
        ];
        calendarInserts = events.map(e => ({
          user_id: user.id,
          crop_name: selectedCrop.name,
          event_type: e.type,
          event_date: format(addDays(sDate, e.dayOffset), 'yyyy-MM-dd'),
          notes: `${selectedCrop.name} - ${e.type} (${acres} acres)`,
        }));
      }

      const { error: calError } = await supabase.from('calendar_events').insert(calendarInserts);
      if (calError) throw calError;

      queryClient.invalidateQueries({ queryKey: ['activeCrops'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });

      toast.success(
        language === 'hi' ? 'फसल सफलतापूर्वक जोड़ी गई!' :
        language === 'mr' ? 'पीक यशस्वीरित्या जोडले!' :
        'Crop added successfully!'
      );
      setSelectedCrop(null);
      setSearchQuery('');
      onClose();
    } catch (err) {
      console.error('Add crop error:', err);
      toast.error('Failed to add crop');
    } finally {
      setAdding(false);
    }
  };

  // Get activity preview for selected crop
  const activityPreview = useMemo(() => {
    if (!selectedCrop) return [];
    const data = cropActivitiesData[selectedCrop.name];
    if (!data) return [];
    return data.activities.map(a => getActivityName(a, language));
  }, [selectedCrop, cropActivitiesData, language]);

  const farmingTip = useMemo(() => {
    if (!selectedCrop) return '';
    const data = cropActivitiesData[selectedCrop.name];
    if (!data) return '';
    return getTipForActivity(data, language);
  }, [selectedCrop, cropActivitiesData, language]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {language === 'hi' ? 'अन्य फसल जोड़ें' : language === 'mr' ? 'इतर पीक जोडा' : 'Add Other Crop'}
          </DialogTitle>
        </DialogHeader>

        {!selectedCrop ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'hi' ? 'फसल खोजें...' : language === 'mr' ? 'पीक शोधा...' : 'Search crops...'}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"
              />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading crops...</div>
                ) : filteredCrops.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'hi' ? 'कोई फसल नहीं मिली' : language === 'mr' ? 'कोणतेही पीक सापडले नाही' : 'No crops found'}
                  </div>
                ) : (
                  filteredCrops.map((crop) => (
                    <Card key={crop.id} className="cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors" onClick={() => setSelectedCrop(crop)}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{getCropName(crop)}</h4>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <Badge variant="outline" className="text-xs"><Leaf className="h-3 w-3 mr-1" />{crop.category}</Badge>
                              <Badge variant="outline" className="text-xs"><Sun className="h-3 w-3 mr-1" />{crop.season}</Badge>
                              {crop.duration_days && <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{crop.duration_days}d</Badge>}
                              {crop.water_needs && <Badge variant="outline" className="text-xs"><Droplets className="h-3 w-3 mr-1" />{crop.water_needs}</Badge>}
                            </div>
                          </div>
                          <Sprout className="h-5 w-5 text-primary/50 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-2">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg">{getCropName(selectedCrop)}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge>{selectedCrop.category}</Badge>
                    <Badge variant="secondary">{selectedCrop.season}</Badge>
                    {selectedCrop.duration_days && <Badge variant="outline">{selectedCrop.duration_days} days</Badge>}
                  </div>
                  {selectedCrop.water_needs && (
                    <p className="text-sm text-muted-foreground mt-2">💧 {language === 'hi' ? 'पानी:' : language === 'mr' ? 'पाणी:' : 'Water:'} {selectedCrop.water_needs}</p>
                  )}
                </CardContent>
              </Card>

              {/* Activities Preview */}
              {activityPreview.length > 0 && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold mb-2">
                      📋 {language === 'hi' ? 'गतिविधियाँ' : language === 'mr' ? 'क्रिया' : 'Activities'} ({activityPreview.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activityPreview.map((act, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{act}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Farming Tip */}
              {farmingTip && (
                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                          {language === 'hi' ? 'पारंपरिक टिप' : language === 'mr' ? 'पारंपरिक टीप' : 'Traditional Tip'}
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 line-clamp-3">{farmingTip.split('|')[0].trim()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label>{language === 'hi' ? 'बुवाई तारीख' : language === 'mr' ? 'पेरणी तारीख' : 'Sowing Date'}</Label>
                <Input type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} />
              </div>
              <div>
                <Label>{language === 'hi' ? 'कितने एकड़' : language === 'mr' ? 'किती एकर' : 'How many acres'}</Label>
                <Input type="number" min="0.1" step="0.1" value={acres} onChange={(e) => setAcres(e.target.value)} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedCrop(null)} className="flex-1">
                  {language === 'hi' ? 'वापस' : language === 'mr' ? 'मागे' : 'Back'}
                </Button>
                <Button onClick={handleAddCrop} disabled={adding} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {adding
                    ? (language === 'hi' ? 'जोड़ रहे हैं...' : language === 'mr' ? 'जोडत आहे...' : 'Adding...')
                    : (language === 'hi' ? 'फसल जोड़ें' : language === 'mr' ? 'पीक जोडा' : 'Add Crop')
                  }
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
