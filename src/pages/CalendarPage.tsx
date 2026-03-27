import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Sprout, Droplets, FlaskConical, Scissors,
  Calendar as CalendarIcon, Check, Trash2, Edit, Bell, Download,
  Layers, LayoutList, Clock, MapPin, Leaf, TrendingUp,
  ShoppingCart, LogIn, Loader2, Lightbulb, Bug, Wheat
} from 'lucide-react';
import { format, isSameDay, addDays, differenceInDays } from 'date-fns';
import { CropEvent } from '@/lib/types';
import { sampleCrops, getSuggestedPlantingWindow, exportAsIcs } from '@/lib/sampleCrops';
import { MonthGridView } from '@/components/calendar/MonthGridView';
import { TimelineView } from '@/components/calendar/TimelineView';
import { CropCycleEditDialog } from '@/components/calendar/CropCycleEditDialog';
import { ShopSection } from '@/components/calendar/ShopSection';
import { AddOtherCropDialog } from '@/components/calendar/AddOtherCropDialog';
import { CropHealthPopup } from '@/components/calendar/CropHealthPopup';
import { useCalendarEvents, useActiveCrops, useDeleteCrop, useAllCropsFromDB } from '@/hooks/useCrops';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getCropActivities, getActivityName, getTipForActivity, type CropActivityData } from '@/lib/cropActivities';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CropCycle {
  id: string; cropId: string; cropName: string;
  startDate: Date; endDate: Date; region: string; color: string; notes?: string;
}

// Extended event type config to support ICAR activity names
const eventTypeConfig: Record<string, { icon: any; color: string; label: string; bgLight: string; textColor: string }> = {
  'Sowing': { icon: Sprout, color: 'bg-emerald-500', label: 'Sowing', bgLight: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
  'sowing': { icon: Sprout, color: 'bg-emerald-500', label: 'Sowing', bgLight: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
  'Fertilizing': { icon: FlaskConical, color: 'bg-amber-500', label: 'Fertilizing', bgLight: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  'fertilizing': { icon: FlaskConical, color: 'bg-amber-500', label: 'Fertilizing', bgLight: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  'Irrigation': { icon: Droplets, color: 'bg-sky-500', label: 'Irrigation', bgLight: 'bg-sky-50 border-sky-200', textColor: 'text-sky-700' },
  'irrigation': { icon: Droplets, color: 'bg-sky-500', label: 'Irrigation', bgLight: 'bg-sky-50 border-sky-200', textColor: 'text-sky-700' },
  'Harvest': { icon: Scissors, color: 'bg-rose-500', label: 'Harvest', bgLight: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700' },
  'harvest': { icon: Scissors, color: 'bg-rose-500', label: 'Harvest', bgLight: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700' },
  'Harvesting': { icon: Scissors, color: 'bg-rose-500', label: 'Harvesting', bgLight: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700' },
  'Weeding': { icon: Leaf, color: 'bg-green-600', label: 'Weeding', bgLight: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  'Spraying': { icon: Bug, color: 'bg-red-500', label: 'Spraying', bgLight: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  'Land Preparation': { icon: Wheat, color: 'bg-orange-500', label: 'Land Prep', bgLight: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
};

function getEventConfig(eventType: string) {
  return eventTypeConfig[eventType] || { icon: CalendarIcon, color: 'bg-primary', label: eventType, bgLight: 'bg-primary/5 border-primary/20', textColor: 'text-primary' };
}

const cropsList = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean',
  'Groundnut', 'Tomato', 'Potato', 'Onion', 'Grapes', 'Banana',
  'Mango', 'Apple', 'Orange', 'Chickpea', 'Lentil', 'Mustard'
];

const regions = [
  'Maharashtra', 'Punjab', 'Karnataka', 'Gujarat', 'Rajasthan',
  'Tamil Nadu', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Andhra Pradesh'
];

export default function CalendarPage() {
  const { t, language } = useApp();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: dbEvents } = useCalendarEvents();
  const { data: activeCrops } = useActiveCrops();
  const { data: allDbCrops } = useAllCropsFromDB();
  const deleteCropMutation = useDeleteCrop();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [isAddCycleDialogOpen, setIsAddCycleDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CropCycle | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAddOtherOpen, setIsAddOtherOpen] = useState(false);
  const [deletingCropId, setDeletingCropId] = useState<string | null>(null);
  const [cropActivitiesData, setCropActivitiesData] = useState<Record<string, CropActivityData>>({});
  const [healthPopup, setHealthPopup] = useState<{ open: boolean; cropName: string; activity: string }>({ open: false, cropName: '', activity: '' });
  
  const [newEvent, setNewEvent] = useState({
    cropName: '', eventType: 'Sowing', date: new Date(), notes: '',
  });

  const [newCycle, setNewCycle] = useState({
    cropId: '', startDate: new Date(), region: 'Maharashtra', notes: '',
  });

  useEffect(() => {
    getCropActivities().then(setCropActivitiesData);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', '/calendar');
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem('agri360_cropCycles');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCropCycles(parsed.map((c: CropCycle) => ({ ...c, startDate: new Date(c.startDate), endDate: new Date(c.endDate) })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agri360_cropCycles', JSON.stringify(cropCycles));
  }, [cropCycles]);

  // Convert DB events to CropEvent format for MonthGridView
  const calendarEvents: CropEvent[] = useMemo(() => {
    if (!dbEvents) return [];
    return dbEvents.map(e => ({
      id: e.id,
      cropName: e.crop_name,
      eventType: e.event_type as any,
      date: new Date(e.event_date),
      notes: e.notes || '',
      completed: e.completed || false,
    }));
  }, [dbEvents]);

  const selectedDateEvents = useMemo(() => {
    return calendarEvents.filter(e => isSameDay(new Date(e.date), selectedDate));
  }, [calendarEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    return calendarEvents
      .filter(e => new Date(e.date) >= new Date() && !e.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [calendarEvents]);

  // Get farming tips for upcoming activities
  const upcomingTips = useMemo(() => {
    if (!dbEvents || !cropActivitiesData) return [];
    const now = new Date();
    const upcoming = dbEvents
      .filter(e => new Date(e.event_date) >= now && !e.completed)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 5);

    const tips: { cropName: string; activity: string; tip: string; date: string }[] = [];
    for (const event of upcoming) {
      const data = cropActivitiesData[event.crop_name];
      if (data) {
        const tipText = getTipForActivity(data, language);
        if (tipText) {
          // Split tips by period and take unique ones
          const sentences = tipText.split(/[.|]/).filter(s => s.trim().length > 10);
          const shortTip = sentences[0]?.trim() || tipText.slice(0, 120);
          tips.push({
            cropName: event.crop_name,
            activity: event.event_type,
            tip: shortTip,
            date: event.event_date,
          });
        }
      }
    }
    // Deduplicate by crop
    const seen = new Set<string>();
    return tips.filter(t => {
      const key = `${t.cropName}-${t.activity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 4);
  }, [dbEvents, cropActivitiesData, language]);

  const handleAddEvent = async () => {
    if (!newEvent.cropName || !user) return;
    try {
      const { error } = await supabase.from('calendar_events').insert({
        user_id: user.id,
        crop_name: newEvent.cropName,
        event_type: newEvent.eventType,
        event_date: format(newEvent.date, 'yyyy-MM-dd'),
        notes: newEvent.notes,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(language === 'hi' ? 'इवेंट जोड़ा गया!' : language === 'mr' ? 'इव्हेंट जोडला!' : 'Event added!');
      setNewEvent({ cropName: '', eventType: 'Sowing', date: new Date(), notes: '' });
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error('Add event error:', err);
      toast.error('Failed to add event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success('Event deleted');
    } catch (err) {
      console.error('Delete event error:', err);
      toast.error('Failed to delete event');
    }
  };

  const handleToggleComplete = async (event: CropEvent) => {
    try {
      const newCompleted = !event.completed;
      const { error } = await supabase.from('calendar_events').update({ completed: newCompleted }).eq('id', event.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      // Show health popup when completing a task
      if (newCompleted) {
        setHealthPopup({ open: true, cropName: event.cropName, activity: event.eventType });
      }
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  const handleHealthSubmit = (response: { condition: string; notes: string }) => {
    toast.success(
      language === 'hi' ? `${healthPopup.cropName} की स्थिति दर्ज की गई: ${response.condition}` :
      language === 'mr' ? `${healthPopup.cropName} ची स्थिती नोंदवली: ${response.condition}` :
      `${healthPopup.cropName} health recorded: ${response.condition}`
    );
    // Update tips based on condition
    if (response.condition === 'poor') {
      toast.info(
        language === 'hi' ? 'AI सहायक से मदद लें या मिट्टी रिपोर्ट देखें' :
        language === 'mr' ? 'AI सहाय्यकाकडून मदत घ्या किंवा माती अहवाल पहा' :
        'Consider consulting AI assistant or checking soil report',
        { duration: 5000 }
      );
    }
  };

  const handleAddCropCycle = () => {
    const crop = sampleCrops.find(c => c.id === newCycle.cropId);
    if (!crop) return;
    const endDate = addDays(newCycle.startDate, crop.growthDurationDays);
    const newCropCycle: CropCycle = {
      id: Date.now().toString(), cropId: crop.id, cropName: crop.name,
      startDate: newCycle.startDate, endDate, region: newCycle.region,
      color: crop.color, notes: newCycle.notes,
    };
    setCropCycles([...cropCycles, newCropCycle]);
    setNewCycle({ cropId: '', startDate: new Date(), region: 'Maharashtra', notes: '' });
    setIsAddCycleDialogOpen(false);
  };

  const handleExportCalendar = () => {
    const icsContent = exportAsIcs(calendarEvents as any);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'agri360-calendar.ics'; a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  if (!user) return (
    <Layout><div className="container mx-auto px-4 py-20 text-center">
      <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">{t('loginRequired')}</h1>
      <Button onClick={() => navigate('/login')}><LogIn className="h-4 w-4 mr-2" />{t('login')}</Button>
    </div></Layout>
  );

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-sky-500 via-sky-600 to-primary py-12">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920" alt="Farm" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('smartCalendar')}</h1>
              <p className="text-white/80">
                {language === 'hi' ? 'स्मार्ट रिमाइंडर के साथ अपनी खेती गतिविधियों की योजना बनाएं' :
                 language === 'mr' ? 'स्मार्ट स्मरणपत्रांसह तुमच्या शेती क्रियाकलापांचे नियोजन करा' :
                 'Plan and track all your farming activities with smart reminders'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                onClick={() => setIsAddOtherOpen(true)}>
                <Sprout className="h-5 w-5 mr-2" />
                {language === 'hi' ? 'अन्य जोड़ें' : language === 'mr' ? 'इतर जोडा' : 'Add Other'}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    {language === 'hi' ? 'इवेंट जोड़ें' : language === 'mr' ? 'इव्हेंट जोडा' : 'Add Event'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{language === 'hi' ? 'नया खेती इवेंट जोड़ें' : language === 'mr' ? 'नवीन शेती इव्हेंट जोडा' : 'Add New Farming Event'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>{language === 'hi' ? 'फसल का नाम' : language === 'mr' ? 'पीकाचे नाव' : 'Crop Name'}</Label>
                      <Select value={newEvent.cropName} onValueChange={(v) => setNewEvent({ ...newEvent, cropName: v })}>
                        <SelectTrigger><SelectValue placeholder={language === 'hi' ? 'फसल चुनें' : language === 'mr' ? 'पीक निवडा' : 'Select crop'} /></SelectTrigger>
                        <SelectContent>{cropsList.map(crop => <SelectItem key={crop} value={crop}>{crop}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'hi' ? 'इवेंट प्रकार' : language === 'mr' ? 'इव्हेंट प्रकार' : 'Event Type'}</Label>
                      <Select value={newEvent.eventType} onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Sowing', 'Irrigation', 'Weeding', 'Fertilizing', 'Spraying', 'Harvesting', 'Land Preparation'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'hi' ? 'तारीख' : language === 'mr' ? 'तारीख' : 'Date'}</Label>
                      <Input type="date" value={format(newEvent.date, 'yyyy-MM-dd')} onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })} />
                    </div>
                    <div>
                      <Label>{language === 'hi' ? 'नोट्स' : language === 'mr' ? 'टिपा' : 'Notes (Optional)'}</Label>
                      <Textarea value={newEvent.notes} onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })} />
                    </div>
                    <Button onClick={handleAddEvent} className="w-full"><Plus className="h-4 w-4 mr-2" />{language === 'hi' ? 'इवेंट जोड़ें' : language === 'mr' ? 'इव्हेंट जोडा' : 'Add Event'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* View Toggle & Export */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'timeline')}>
              <TabsList>
                <TabsTrigger value="month" className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{language === 'hi' ? 'माह' : language === 'mr' ? 'महिना' : 'Month'}</TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2"><LayoutList className="h-4 w-4" />{language === 'hi' ? 'टाइमलाइन' : language === 'mr' ? 'टाइमलाइन' : 'Timeline'}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={() => setIsShopOpen(true)} className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
              <ShoppingCart className="h-4 w-4 mr-2" />{language === 'hi' ? 'दुकान' : language === 'mr' ? 'दुकान' : 'Shop'}
            </Button>
          </div>
          <Button variant="outline" onClick={handleExportCalendar}><Download className="h-4 w-4 mr-2" />{language === 'hi' ? 'निर्यात' : language === 'mr' ? 'निर्यात' : 'Export'}</Button>
        </div>

        {/* Multi-Crop Management */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {language === 'hi' ? 'बहु-फसल प्रबंधन' : language === 'mr' ? 'बहु-पीक व्यवस्थापन' : 'Multi-Crop Management'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!activeCrops || activeCrops.length === 0) && cropCycles.length === 0 ? (
              <div className="text-center py-8">
                <Leaf className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-1">{language === 'hi' ? 'अभी कोई फसल चक्र नहीं' : language === 'mr' ? 'अद्याप कोणतेही पीक चक्र नाही' : 'No crop cycles added yet'}</p>
                <p className="text-xs text-muted-foreground mb-4">{language === 'hi' ? 'एक साथ कई फसलें प्रबंधित करने के लिए फसल चक्र जोड़ें' : language === 'mr' ? 'एकाच वेळी अनेक पिके व्यवस्थापित करण्यासाठी पीक चक्र जोडा' : 'Add crop cycles to manage multiple crops simultaneously'}</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setIsAddCycleDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />{language === 'hi' ? 'फसल चक्र जोड़ें' : language === 'mr' ? 'पीक चक्र जोडा' : 'Add Crop Cycle'}</Button>
                  <Button variant="outline" onClick={() => setIsAddOtherOpen(true)}><Sprout className="h-4 w-4 mr-2" />{language === 'hi' ? 'अन्य जोड़ें' : language === 'mr' ? 'इतर जोडा' : 'Add Other'}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCrops?.map((crop) => (
                  <div key={crop.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <h4 className="font-semibold">{crop.crop_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {crop.crop_category && <Badge variant="outline" className="text-xs">{crop.crop_category}</Badge>}
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingCropId(crop.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />{language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढा' : 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {viewMode === 'month' ? (
              <MonthGridView
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                events={calendarEvents}
                cropCycles={cropCycles}
                onMonthChange={setCurrentMonth}
                onDateSelect={setSelectedDate}
                onCycleClick={(cycle) => setEditingCycle(cycle)}
              />
            ) : (
              <TimelineView events={calendarEvents} cropCycles={cropCycles} onCycleClick={(cycle) => setEditingCycle(cycle)} onCycleDelete={(id) => setCropCycles(prev => prev.filter(c => c.id !== id))} onEventEdit={() => {}} onEventDelete={handleDeleteEvent} />
            )}

            {/* Selected Date Events */}
            {viewMode === 'month' && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{language === 'hi' ? 'इस दिन के इवेंट' : language === 'mr' ? 'या दिवसाचे इव्हेंट' : 'Events for'}</span>
                    <Badge variant="secondary" className="text-base font-normal">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{language === 'hi' ? 'इस दिन कोई इवेंट नहीं' : language === 'mr' ? 'या दिवशी कोणताही इव्हेंट नाही' : 'No events scheduled for this day'}</p>
                      <Button variant="outline" className="mt-4" onClick={() => { setNewEvent(e => ({ ...e, date: selectedDate })); setIsAddDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />{language === 'hi' ? 'इवेंट जोड़ें' : language === 'mr' ? 'इव्हेंट जोडा' : 'Add Event'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => {
                        const config = getEventConfig(event.eventType);
                        const Icon = config.icon;
                        return (
                          <div key={event.id} className={`p-4 rounded-xl border-2 ${config.bgLight} ${event.completed ? 'opacity-60' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${config.color} text-white`}><Icon className="h-5 w-5" /></div>
                                <div>
                                  <h4 className={`font-semibold ${event.completed ? 'line-through' : ''}`}>{event.cropName}</h4>
                                  <p className={`text-sm ${config.textColor}`}>{config.label}</p>
                                  {event.notes && <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleToggleComplete(event)} className={event.completed ? 'text-green-600' : ''}><Check className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Active Crops */}
            {activeCrops && activeCrops.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sprout className="h-5 w-5 text-primary" />{language === 'hi' ? 'सक्रिय फसलें' : language === 'mr' ? 'सक्रिय पिके' : 'Active Crops'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeCrops.map((crop) => (
                      <div key={crop.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div>
                          <h4 className="font-semibold">{crop.crop_name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {crop.crop_category && <Badge variant="outline" className="text-xs">{crop.crop_category}</Badge>}
                            {crop.field_name && <span>{crop.field_name}</span>}
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => setDeletingCropId(crop.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />{language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढा' : 'Remove'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Summary */}
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-lg">{language === 'hi' ? 'गतिविधि सारांश' : language === 'mr' ? 'क्रियाकलाप सारांश' : 'Activity Summary'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'Sowing', ...getEventConfig('Sowing') },
                    { key: 'Fertilizing', ...getEventConfig('Fertilizing') },
                    { key: 'Irrigation', ...getEventConfig('Irrigation') },
                    { key: 'Harvest', ...getEventConfig('Harvest') },
                  ].map(({ key, icon: Icon, color, label }) => {
                    const count = calendarEvents.filter(e => 
                      e.eventType.toLowerCase().includes(key.toLowerCase())
                    ).length;
                    return (
                      <div key={key} className="text-center p-3 rounded-xl bg-background">
                        <div className={`inline-flex p-2 rounded-lg ${color} text-white mb-2`}><Icon className="h-4 w-4" /></div>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Reminders */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-primary" />
                  {language === 'hi' ? 'आगामी रिमाइंडर' : language === 'mr' ? 'आगामी स्मरणपत्रे' : 'Upcoming Reminders'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{language === 'hi' ? 'कोई आगामी इवेंट नहीं' : language === 'mr' ? 'कोणतेही आगामी इव्हेंट नाही' : 'No upcoming events'}</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => {
                      const config = getEventConfig(event.eventType);
                      const Icon = config.icon;
                      return (
                        <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedDate(new Date(event.date))}>
                          <div className={`p-2 rounded-lg ${config.color} text-white`}><Icon className="h-4 w-4" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.cropName}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMM d, yyyy')}</p>
                          </div>
                          <Badge variant="outline" className={config.textColor}>{config.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Farming Tips (replaces Crop Colors) */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  {language === 'hi' ? 'खेती टिप्स' : language === 'mr' ? 'शेती टिप्स' : 'Farming Tips'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingTips.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    {language === 'hi' ? 'फसल जोड़ें तो टिप्स दिखेंगे' : language === 'mr' ? 'पीक जोडा म्हणजे टिप्स दिसतील' : 'Add crops to see farming tips'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingTips.map((tip, i) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">{tip.cropName}</Badge>
                          <span className="text-xs text-muted-foreground">{tip.activity}</span>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300">{tip.tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Crop Cycle Edit Dialog */}
      <CropCycleEditDialog cycle={editingCycle} isOpen={!!editingCycle} onClose={() => setEditingCycle(null)} onSave={(c) => setCropCycles(prev => prev.map(x => x.id === c.id ? c : x))} onDelete={(id) => setCropCycles(prev => prev.filter(c => c.id !== id))} regions={regions} />
      <ShopSection isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      <AddOtherCropDialog isOpen={isAddOtherOpen} onClose={() => setIsAddOtherOpen(false)} language={language} />
      <CropHealthPopup 
        isOpen={healthPopup.open} 
        onClose={() => setHealthPopup({ open: false, cropName: '', activity: '' })} 
        cropName={healthPopup.cropName} 
        activityName={healthPopup.activity} 
        language={language} 
        onSubmit={handleHealthSubmit} 
      />

      {/* Delete Crop Confirmation */}
      <AlertDialog open={!!deletingCropId} onOpenChange={() => setDeletingCropId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'hi' ? 'फसल हटाएं?' : language === 'mr' ? 'पीक काढायचे?' : 'Remove Crop?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'hi' ? 'फसल और उसके सभी कैलेंडर इवेंट हटा दिए जाएंगे।' :
               language === 'mr' ? 'पीक आणि त्याचे सर्व कॅलेंडर इव्हेंट काढले जातील.' :
               'The crop and all its calendar events will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingCropId) { deleteCropMutation.mutate(deletingCropId); setDeletingCropId(null); } }}>
              {language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढा' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
