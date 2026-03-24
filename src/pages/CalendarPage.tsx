import React, { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Sprout, 
  Droplets, 
  FlaskConical, 
  Scissors,
  Calendar as CalendarIcon,
  Check,
  Trash2,
  Edit,
  Bell,
  Download,
  Layers,
  LayoutList,
  Clock,
  MapPin,
  Leaf,
  TrendingUp,
  ShoppingCart,
  LogIn,
  Loader2
} from 'lucide-react';
import { 
  format, 
  isSameDay, 
  addDays, 
  differenceInDays
} from 'date-fns';
import { CropEvent } from '@/lib/types';
import { sampleCrops, getSuggestedPlantingWindow, exportAsIcs } from '@/lib/sampleCrops';
import { MonthGridView } from '@/components/calendar/MonthGridView';
import { TimelineView } from '@/components/calendar/TimelineView';
import { CropCycleEditDialog } from '@/components/calendar/CropCycleEditDialog';
import { ShopSection } from '@/components/calendar/ShopSection';
import { AddOtherCropDialog } from '@/components/calendar/AddOtherCropDialog';
import { useCalendarEvents, useActiveCrops, useDeleteCrop, useAllCropsFromDB } from '@/hooks/useCrops';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Crop cycle type for tracking multiple crops
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
    bgLight: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-700'
  },
  fertilizing: { 
    icon: FlaskConical, 
    color: 'bg-amber-500', 
    label: 'Fertilizing',
    bgLight: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-700'
  },
  irrigation: { 
    icon: Droplets, 
    color: 'bg-sky-500', 
    label: 'Irrigation',
    bgLight: 'bg-sky-50 border-sky-200',
    textColor: 'text-sky-700'
  },
  harvest: { 
    icon: Scissors, 
    color: 'bg-rose-500', 
    label: 'Harvest',
    bgLight: 'bg-rose-50 border-rose-200',
    textColor: 'text-rose-700'
  },
};

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
  const { t, events, addEvent, updateEvent, deleteEvent, language } = useApp();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // DB-backed data
  const { data: dbEvents } = useCalendarEvents();
  const { data: activeCrops } = useActiveCrops();
  const { data: allDbCrops } = useAllCropsFromDB();
  const deleteCropMutation = useDeleteCrop();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CropEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [isAddCycleDialogOpen, setIsAddCycleDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CropCycle | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('Maharashtra');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAddOtherOpen, setIsAddOtherOpen] = useState(false);
  const [deletingCropId, setDeletingCropId] = useState<string | null>(null);
  
  const [newEvent, setNewEvent] = useState({
    cropName: '',
    eventType: 'sowing' as CropEvent['eventType'],
    date: new Date(),
    notes: '',
  });

  const [newCycle, setNewCycle] = useState({
    cropId: '',
    startDate: new Date(),
    region: 'Maharashtra',
    notes: '',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', '/calendar');
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load crop cycles from localStorage
  useEffect(() => {
    const savedCycles = localStorage.getItem('agri360_cropCycles');
    if (savedCycles) {
      const parsed = JSON.parse(savedCycles);
      setCropCycles(parsed.map((c: CropCycle) => ({
        ...c,
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
      })));
    }
  }, []);

  // Save crop cycles to localStorage
  useEffect(() => {
    localStorage.setItem('agri360_cropCycles', JSON.stringify(cropCycles));
  }, [cropCycles]);

  const handleAddEvent = () => {
    if (!newEvent.cropName) return;
    
    addEvent({
      cropName: newEvent.cropName,
      eventType: newEvent.eventType,
      date: newEvent.date,
      notes: newEvent.notes,
      completed: false,
    });
    
    setNewEvent({
      cropName: '',
      eventType: 'sowing',
      date: new Date(),
      notes: '',
    });
    setIsAddDialogOpen(false);
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;
    updateEvent(editingEvent.id, editingEvent);
    setEditingEvent(null);
  };

  const handleAddCropCycle = () => {
    const crop = sampleCrops.find(c => c.id === newCycle.cropId);
    if (!crop) return;

    const endDate = addDays(newCycle.startDate, crop.growthDurationDays);
    const newCropCycle: CropCycle = {
      id: Date.now().toString(),
      cropId: crop.id,
      cropName: crop.name,
      startDate: newCycle.startDate,
      endDate,
      region: newCycle.region,
      color: crop.color,
      notes: newCycle.notes,
    };

    setCropCycles([...cropCycles, newCropCycle]);
    setNewCycle({ cropId: '', startDate: new Date(), region: 'Maharashtra', notes: '' });
    setIsAddCycleDialogOpen(false);

    // Auto-add events for the crop cycle
    addEvent({
      cropName: crop.name,
      eventType: 'sowing',
      date: newCycle.startDate,
      notes: `${crop.name} sowing - ${newCycle.region}`,
      completed: false,
    });

    addEvent({
      cropName: crop.name,
      eventType: 'harvest',
      date: endDate,
      notes: `${crop.name} harvest expected - ${newCycle.region}`,
      completed: false,
    });
  };

  const deleteCropCycle = (id: string) => {
    setCropCycles(cropCycles.filter(c => c.id !== id));
  };

  const updateCropCycle = (cycle: CropCycle) => {
    setCropCycles(cropCycles.map(c => c.id === cycle.id ? cycle : c));
  };

  const handleExportCalendar = () => {
    const icsContent = exportAsIcs(events);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agri360-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleComplete = (event: CropEvent) => {
    updateEvent(event.id, { completed: !event.completed });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Show loading state
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">
            {language === 'hi' ? 'कैलेंडर देखने के लिए लॉगिन करें' : 
             language === 'mr' ? 'कॅलेंडर पाहण्यासाठी लॉगिन करा' : 
             'Please login to access the crop calendar'}
          </p>
          <Button onClick={() => navigate('/login')}>
            <LogIn className="h-4 w-4 mr-2" />
            {t('login')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-sky-500 via-sky-600 to-primary py-12">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920" 
            alt="Farm field"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {t('smartCalendar')}
              </h1>
              <p className="text-white/80">
                {language === 'hi' ? 'स्मार्ट रिमाइंडर के साथ अपनी खेती गतिविधियों की योजना बनाएं' : 
                 language === 'mr' ? 'स्मार्ट स्मरणपत्रांसह तुमच्या शेती क्रियाकलापांचे नियोजन करा' :
                 'Plan and track all your farming activities with smart reminders'}
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isAddCycleDialogOpen} onOpenChange={setIsAddCycleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                    <Layers className="h-5 w-5 mr-2" />
                    {language === 'hi' ? 'फसल चक्र जोड़ें' : language === 'mr' ? 'पीक चक्र जोडा' : 'Add Crop Cycle'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{language === 'hi' ? 'फसल चक्र जोड़ें' : language === 'mr' ? 'पीक चक्र जोडा' : 'Add Crop Cycle'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>{language === 'hi' ? 'फसल चुनें' : language === 'mr' ? 'पीक निवडा' : 'Select Crop'}</Label>
                      <Select 
                        value={newCycle.cropId} 
                        onValueChange={(v) => setNewCycle({ ...newCycle, cropId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'hi' ? 'एक फसल चुनें' : language === 'mr' ? 'एक पीक निवडा' : 'Choose a crop'} />
                        </SelectTrigger>
                        <SelectContent>
                          {sampleCrops.map(crop => (
                            <SelectItem key={crop.id} value={crop.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: crop.color }}
                                />
                                {crop.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newCycle.cropId && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">
                          {getSuggestedPlantingWindow(newCycle.cropId, newCycle.region).suggestion}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'hi' ? 'अवधि:' : language === 'mr' ? 'कालावधी:' : 'Duration:'} {sampleCrops.find(c => c.id === newCycle.cropId)?.growthDurationDays} {language === 'hi' ? 'दिन' : language === 'mr' ? 'दिवस' : 'days'}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label>{language === 'hi' ? 'क्षेत्र' : language === 'mr' ? 'प्रदेश' : 'Region'}</Label>
                      <Select 
                        value={newCycle.region} 
                        onValueChange={(v) => setNewCycle({ ...newCycle, region: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{language === 'hi' ? 'आरंभ तिथि' : language === 'mr' ? 'सुरुवात तारीख' : 'Start Date'}</Label>
                      <Input 
                        type="date" 
                        value={format(newCycle.startDate, 'yyyy-MM-dd')}
                        onChange={(e) => setNewCycle({ ...newCycle, startDate: new Date(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label>{language === 'hi' ? 'नोट्स (वैकल्पिक)' : language === 'mr' ? 'टिपा (पर्यायी)' : 'Notes (Optional)'}</Label>
                      <Textarea 
                        placeholder={language === 'hi' ? 'कोई भी नोट जोड़ें...' : language === 'mr' ? 'कोणत्याही टिपा जोडा...' : 'Add any notes...'}
                        value={newCycle.notes}
                        onChange={(e) => setNewCycle({ ...newCycle, notes: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleAddCropCycle} className="w-full" disabled={!newCycle.cropId}>
                      <Layers className="h-4 w-4 mr-2" />
                      {language === 'hi' ? 'फसल चक्र जोड़ें' : language === 'mr' ? 'पीक चक्र जोडा' : 'Add Crop Cycle'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

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
                      <Select 
                        value={newEvent.cropName} 
                        onValueChange={(v) => setNewEvent({ ...newEvent, cropName: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'hi' ? 'फसल चुनें' : language === 'mr' ? 'पीक निवडा' : 'Select crop'} />
                        </SelectTrigger>
                        <SelectContent>
                          {cropsList.map(crop => (
                            <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'hi' ? 'इवेंट प्रकार' : language === 'mr' ? 'इव्हेंट प्रकार' : 'Event Type'}</Label>
                      <Select 
                        value={newEvent.eventType} 
                        onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v as CropEvent['eventType'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(eventTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'hi' ? 'तारीख' : language === 'mr' ? 'तारीख' : 'Date'}</Label>
                      <Input 
                        type="date" 
                        value={format(newEvent.date, 'yyyy-MM-dd')}
                        onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>{language === 'hi' ? 'नोट्स (वैकल्पिक)' : language === 'mr' ? 'टिपा (पर्यायी)' : 'Notes (Optional)'}</Label>
                      <Textarea 
                        placeholder={language === 'hi' ? 'इस इवेंट के बारे में कोई भी नोट जोड़ें...' : language === 'mr' ? 'या इव्हेंट बद्दल कोणत्याही टिपा जोडा...' : 'Add any notes about this event...'}
                        value={newEvent.notes}
                        onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddEvent} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'hi' ? 'इवेंट जोड़ें' : language === 'mr' ? 'इव्हेंट जोडा' : 'Add Event'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* View Toggle, Shop & Export */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'timeline')}>
              <TabsList>
                <TabsTrigger value="month" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {language === 'hi' ? 'माह दृश्य' : language === 'mr' ? 'महिना दृश्य' : 'Month View'}
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <LayoutList className="h-4 w-4" />
                  {language === 'hi' ? 'टाइमलाइन' : language === 'mr' ? 'टाइमलाइन' : 'Timeline'}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button 
              variant="outline" 
              onClick={() => setIsShopOpen(true)}
              className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {language === 'hi' ? 'दुकान' : language === 'mr' ? 'दुकान' : 'Shop'}
            </Button>
          </div>
          
          <Button variant="outline" onClick={handleExportCalendar}>
            <Download className="h-4 w-4 mr-2" />
            {language === 'hi' ? 'निर्यात करें' : language === 'mr' ? 'निर्यात करा' : 'Export Calendar'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            {viewMode === 'month' ? (
              <MonthGridView
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                events={events}
                cropCycles={cropCycles}
                onMonthChange={setCurrentMonth}
                onDateSelect={setSelectedDate}
                onCycleClick={(cycle) => setEditingCycle(cycle)}
              />
            ) : (
              <TimelineView
                events={events}
                cropCycles={cropCycles}
                onCycleClick={(cycle) => setEditingCycle(cycle)}
                onCycleDelete={deleteCropCycle}
                onEventEdit={setEditingEvent}
                onEventDelete={deleteEvent}
              />
            )}

            {/* Selected Date Events */}
            {viewMode === 'month' && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">{language === 'hi' ? 'इस दिन के इवेंट' : language === 'mr' ? 'या दिवसाचे इव्हेंट' : 'Events for'}</span>
                    <Badge variant="secondary" className="text-base font-normal">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{language === 'hi' ? 'इस दिन कोई इवेंट निर्धारित नहीं' : language === 'mr' ? 'या दिवशी कोणताही इव्हेंट नियोजित नाही' : 'No events scheduled for this day'}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setNewEvent({ ...newEvent, date: selectedDate });
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'hi' ? 'इवेंट जोड़ें' : language === 'mr' ? 'इव्हेंट जोडा' : 'Add Event'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => {
                        const config = eventTypeConfig[event.eventType];
                        const Icon = config.icon;
                        return (
                          <div 
                            key={event.id}
                            className={`p-4 rounded-xl border-2 ${config.bgLight} ${event.completed ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${config.color} text-white`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className={`font-semibold ${event.completed ? 'line-through' : ''}`}>
                                    {event.cropName}
                                  </h4>
                                  <p className={`text-sm ${config.textColor}`}>
                                    {config.label}
                                  </p>
                                  {event.notes && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {event.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleComplete(event)}
                                  className={event.completed ? 'text-green-600' : ''}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingEvent(event)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteEvent(event.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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

            {/* Multi-Crop Management Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  {language === 'hi' ? 'बहु-फसल प्रबंधन' : language === 'mr' ? 'बहु-पीक व्यवस्थापन' : 'Multi-Crop Management'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cropCycles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Leaf className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{language === 'hi' ? 'कोई फसल चक्र नहीं जोड़ा गया' : language === 'mr' ? 'कोणतेही पीक चक्र जोडलेले नाही' : 'No crop cycles added yet'}</p>
                    <p className="text-sm mt-1">{language === 'hi' ? 'एक साथ कई फसलों का प्रबंधन करने के लिए फसल चक्र जोड़ें' : language === 'mr' ? 'एकाच वेळी अनेक पिकांचे व्यवस्थापन करण्यासाठी पीक चक्र जोडा' : 'Add crop cycles to manage multiple crops simultaneously'}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsAddCycleDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'hi' ? 'पहला फसल चक्र जोड़ें' : language === 'mr' ? 'पहिले पीक चक्र जोडा' : 'Add First Crop Cycle'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cropCycles.map((cycle) => {
                      const crop = sampleCrops.find(c => c.id === cycle.cropId);
                      const daysRemaining = differenceInDays(cycle.endDate, new Date());
                      return (
                        <Card key={cycle.id} className="border-2" style={{ borderColor: cycle.color + '40' }}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {crop?.image && (
                                <img 
                                  src={crop.image} 
                                  alt={cycle.cropName}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">{cycle.cropName}</h4>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => deleteCropCycle(cycle.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {cycle.region}
                                </div>
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <Clock className="h-3 w-3" />
                                  {daysRemaining > 0 ? (
                                    <span className="text-primary">{daysRemaining} {language === 'hi' ? 'दिन बाकी' : language === 'mr' ? 'दिवस बाकी' : 'days to harvest'}</span>
                                  ) : (
                                    <span className="text-emerald-600">{language === 'hi' ? 'कटाई के लिए तैयार!' : language === 'mr' ? 'कापणीसाठी तयार!' : 'Ready for harvest!'}</span>
                                  )}
                                </div>
                                {crop && (
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      pH: {crop.optimalPhRange[0]}-{crop.optimalPhRange[1]}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      💧 {crop.waterNeed}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-lg">{language === 'hi' ? 'गतिविधि सारांश' : language === 'mr' ? 'क्रियाकलाप सारांश' : 'Activity Summary'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(eventTypeConfig).map(([key, config]) => {
                    const count = events.filter(e => e.eventType === key).length;
                    const Icon = config.icon;
                    return (
                      <div key={key} className="text-center p-3 rounded-xl bg-background">
                        <div className={`inline-flex p-2 rounded-lg ${config.color} text-white mb-2`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs text-muted-foreground">{config.label}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-primary" />
                  {language === 'hi' ? 'आगामी रिमाइंडर' : language === 'mr' ? 'आगामी स्मरणपत्रे' : 'Upcoming Reminders'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {language === 'hi' ? 'कोई आगामी इवेंट नहीं' : language === 'mr' ? 'कोणतेही आगामी इव्हेंट नाही' : 'No upcoming events'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => {
                      const config = eventTypeConfig[event.eventType];
                      const Icon = config.icon;
                      return (
                        <div 
                          key={event.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedDate(new Date(event.date))}
                        >
                          <div className={`p-2 rounded-lg ${config.color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.cropName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant="outline" className={config.textColor}>
                            {config.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Crop Color Palette */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {language === 'hi' ? 'फसल रंग' : language === 'mr' ? 'पीक रंग' : 'Crop Colors'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {sampleCrops.slice(0, 8).map(crop => (
                    <div key={crop.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: crop.color }}
                      />
                      <span className="text-sm truncate">{crop.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'hi' ? 'इवेंट संपादित करें' : language === 'mr' ? 'इव्हेंट संपादित करा' : 'Edit Event'}</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>{language === 'hi' ? 'फसल का नाम' : language === 'mr' ? 'पीकाचे नाव' : 'Crop Name'}</Label>
                <Select 
                  value={editingEvent.cropName} 
                  onValueChange={(v) => setEditingEvent({ ...editingEvent, cropName: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cropsList.map(crop => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'hi' ? 'इवेंट प्रकार' : language === 'mr' ? 'इव्हेंट प्रकार' : 'Event Type'}</Label>
                <Select 
                  value={editingEvent.eventType} 
                  onValueChange={(v) => setEditingEvent({ ...editingEvent, eventType: v as CropEvent['eventType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'hi' ? 'तारीख' : language === 'mr' ? 'तारीख' : 'Date'}</Label>
                <Input 
                  type="date" 
                  value={format(new Date(editingEvent.date), 'yyyy-MM-dd')}
                  onChange={(e) => setEditingEvent({ ...editingEvent, date: new Date(e.target.value) })}
                />
              </div>
              <div>
                <Label>{language === 'hi' ? 'नोट्स' : language === 'mr' ? 'टिपा' : 'Notes'}</Label>
                <Textarea 
                  value={editingEvent.notes || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateEvent} className="flex-1">
                  {language === 'hi' ? 'अपडेट करें' : language === 'mr' ? 'अपडेट करा' : 'Update Event'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    deleteEvent(editingEvent.id);
                    setEditingEvent(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Crop Cycle Edit Dialog */}
      <CropCycleEditDialog
        cycle={editingCycle}
        isOpen={!!editingCycle}
        onClose={() => setEditingCycle(null)}
        onSave={updateCropCycle}
        onDelete={deleteCropCycle}
        regions={regions}
      />

      {/* Shop Section */}
      <ShopSection isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
    </Layout>
  );
}
