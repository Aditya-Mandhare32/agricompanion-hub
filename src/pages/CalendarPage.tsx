import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  LayoutList,
  Clock,
  MapPin,
  Leaf,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
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
  differenceInDays,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { CropEvent } from '@/lib/types';
import { sampleCrops, cropColorPalette, getSuggestedPlantingWindow, exportAsIcs, SampleCrop } from '@/lib/sampleCrops';
import { farmerNewsData, categoryConfig } from '@/lib/farmerNews';

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
  const { t, events, addEvent, updateEvent, deleteEvent, isAuthenticated, language } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CropEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [isAddCycleDialogOpen, setIsAddCycleDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Maharashtra');
  
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

  const getCropCyclesForDate = (date: Date) => {
    return cropCycles.filter(cycle => 
      isWithinInterval(date, { start: cycle.startDate, end: cycle.endDate })
    );
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Get news item text based on language
  const getNewsText = (item: typeof farmerNewsData[0], field: 'title' | 'summary') => {
    if (language === 'hi') {
      return field === 'title' ? (item.titleHi || item.title) : (item.summaryHi || item.summary);
    } else if (language === 'mr') {
      return field === 'title' ? (item.titleMr || item.title) : (item.summaryMr || item.summary);
    }
    return field === 'title' ? item.title : item.summary;
  };

  const getCategoryLabel = (category: keyof typeof categoryConfig) => {
    const config = categoryConfig[category];
    if (language === 'hi') return config.labelHi;
    if (language === 'mr') return config.labelMr;
    return config.label;
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">Please login to access the crop calendar</p>
          <Button asChild>
            <a href="/login">{t('login')}</a>
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
                Plan and track all your farming activities with smart reminders
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isAddCycleDialogOpen} onOpenChange={setIsAddCycleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                    <Layers className="h-5 w-5 mr-2" />
                    Add Crop Cycle
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Crop Cycle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Select Crop</Label>
                      <Select 
                        value={newCycle.cropId} 
                        onValueChange={(v) => setNewCycle({ ...newCycle, cropId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a crop" />
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
                          Duration: {sampleCrops.find(c => c.id === newCycle.cropId)?.growthDurationDays} days
                        </p>
                      </div>
                    )}

                    <div>
                      <Label>Region</Label>
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
                      <Label>Start Date</Label>
                      <Input 
                        type="date" 
                        value={format(newCycle.startDate, 'yyyy-MM-dd')}
                        onChange={(e) => setNewCycle({ ...newCycle, startDate: new Date(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea 
                        placeholder="Add any notes..."
                        value={newCycle.notes}
                        onChange={(e) => setNewCycle({ ...newCycle, notes: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleAddCropCycle} className="w-full" disabled={!newCycle.cropId}>
                      <Layers className="h-4 w-4 mr-2" />
                      Add Crop Cycle
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Farming Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Crop Name</Label>
                      <Select 
                        value={newEvent.cropName} 
                        onValueChange={(v) => setNewEvent({ ...newEvent, cropName: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          {cropsList.map(crop => (
                            <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Event Type</Label>
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
                      <Label>Date</Label>
                      <Input 
                        type="date" 
                        value={format(newEvent.date, 'yyyy-MM-dd')}
                        onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea 
                        placeholder="Add any notes about this event..."
                        value={newEvent.notes}
                        onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddEvent} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
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
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'timeline')}>
            <TabsList>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Month View
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <LayoutList className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" onClick={handleExportCalendar}>
            <Download className="h-4 w-4 mr-2" />
            Export Calendar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            {viewMode === 'month' ? (
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
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="space-y-4">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days with crop cycle blocks */}
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
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
                            <HoverCard key={currentDay.toISOString()}>
                              <HoverCardTrigger asChild>
                                <button
                                  onClick={() => setSelectedDate(currentDay)}
                                  className={`
                                    relative min-h-[80px] p-1 rounded-lg border transition-all duration-200 hover:shadow-md
                                    ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                                    ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border/50'}
                                    ${isTodayDate ? 'bg-primary/5' : ''}
                                    hover:border-primary/50
                                  `}
                                >
                                  <div className={`
                                    text-sm font-medium mb-1
                                    ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                                    ${isSelected ? 'text-primary' : ''}
                                    ${isTodayDate ? 'text-primary font-bold' : ''}
                                  `}>
                                    {format(currentDay, 'd')}
                                  </div>
                                  
                                  {/* Crop cycle blocks */}
                                  {dayCycles.length > 0 && (
                                    <div className="space-y-0.5 mb-1">
                                      {dayCycles.slice(0, 2).map((cycle, idx) => (
                                        <div 
                                          key={idx}
                                          className="text-[9px] px-1 py-0.5 rounded truncate font-medium text-white"
                                          style={{ backgroundColor: cycle.color }}
                                        >
                                          {cycle.cropName}
                                        </div>
                                      ))}
                                      {dayCycles.length > 2 && (
                                        <span className="text-[9px] text-muted-foreground">
                                          +{dayCycles.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Event icons */}
                                  {dayEvents.length > 0 && (
                                    <div className="flex flex-wrap gap-0.5 justify-center">
                                      {[...new Set(dayEvents.map(e => e.eventType))].slice(0, 3).map((type, idx) => {
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
                                      {dayEvents.length > 3 && (
                                        <span className="text-[9px] text-muted-foreground font-medium">
                                          +{dayEvents.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-72">
                                <div className="space-y-3">
                                  <div className="font-semibold">
                                    {format(currentDay, 'EEEE, MMMM d, yyyy')}
                                  </div>
                                  
                                  {dayCycles.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Active Crops:</p>
                                      {dayCycles.map((cycle, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm mb-1">
                                          <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: cycle.color }}
                                          />
                                          <span>{cycle.cropName}</span>
                                          <span className="text-xs text-muted-foreground">({cycle.region})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {dayEvents.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Events:</p>
                                      {dayEvents.map((event, idx) => {
                                        const config = eventTypeConfig[event.eventType];
                                        const Icon = config.icon;
                                        return (
                                          <div key={idx} className="flex items-center gap-2 text-sm mb-1">
                                            <Icon className={`h-3 w-3 ${config.textColor}`} />
                                            <span>{event.cropName} - {config.label}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {dayCycles.length === 0 && dayEvents.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No activities scheduled</p>
                                  )}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          );
                          
                          day = addDays(day, 1);
                        }
                        
                        return days;
                      })()}
                    </div>
                  </div>
                  
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
            ) : (
              /* Timeline View */
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutList className="h-5 w-5 text-primary" />
                    Timeline View
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4 pr-4">
                      {/* Active Crop Cycles */}
                      {cropCycles.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Active Crop Cycles</h3>
                          {cropCycles.map((cycle) => {
                            const progress = Math.min(100, Math.max(0,
                              (differenceInDays(new Date(), cycle.startDate) / 
                               differenceInDays(cycle.endDate, cycle.startDate)) * 100
                            ));
                            return (
                              <div key={cycle.id} className="mb-4 p-4 rounded-lg border bg-card">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: cycle.color }}
                                    />
                                    <span className="font-medium">{cycle.cropName}</span>
                                    <Badge variant="outline" className="text-xs">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {cycle.region}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => deleteCropCycle(cycle.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground mb-2">
                                  {format(cycle.startDate, 'MMM d')} → {format(cycle.endDate, 'MMM d, yyyy')}
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all"
                                    style={{ 
                                      width: `${progress}%`,
                                      backgroundColor: cycle.color
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 text-right">
                                  {Math.round(progress)}% complete
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Events Timeline */}
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Upcoming Events</h3>
                      {events
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((event) => {
                          const config = eventTypeConfig[event.eventType];
                          const Icon = config.icon;
                          return (
                            <div 
                              key={event.id}
                              className={`flex items-start gap-4 p-3 rounded-lg border ${config.bgLight}`}
                            >
                              <div className={`p-2 rounded-lg ${config.color} text-white`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{event.cropName}</h4>
                                  <Badge variant="outline" className={config.textColor}>
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                                </p>
                                {event.notes && (
                                  <p className="text-sm mt-1">{event.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingEvent(event)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => deleteEvent(event.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      
                      {events.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No events scheduled yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Selected Date Events */}
            {viewMode === 'month' && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">Events for</span>
                    <Badge variant="secondary" className="text-base font-normal">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No events scheduled for this day</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setNewEvent({ ...newEvent, date: selectedDate });
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
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
                  Multi-Crop Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cropCycles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Leaf className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No crop cycles added yet</p>
                    <p className="text-sm mt-1">Add crop cycles to manage multiple crops simultaneously</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsAddCycleDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Crop Cycle
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
                                    <span className="text-primary">{daysRemaining} days to harvest</span>
                                  ) : (
                                    <span className="text-emerald-600">Ready for harvest!</span>
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
                <CardTitle className="text-lg">Activity Summary</CardTitle>
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
                  Upcoming Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No upcoming events
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
                  Crop Colors
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

        {/* Live Farmer News Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              📰 {language === 'hi' ? 'किसान समाचार' : language === 'mr' ? 'शेतकरी बातम्या' : 'Farmer News'}
            </h2>
            <Badge variant="outline" className="animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2"></span>
              LIVE
            </Badge>
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {farmerNewsData.map((news) => {
                const catConfig = categoryConfig[news.category];
                return (
                  <Card 
                    key={news.id} 
                    className="w-[320px] flex-shrink-0 hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="relative">
                      <img 
                        src={news.image} 
                        alt={news.title}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      <Badge 
                        className={`absolute top-3 left-3 ${catConfig.color} text-white`}
                      >
                        {catConfig.icon} {getCategoryLabel(news.category)}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {getNewsText(news, 'title')}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {getNewsText(news, 'summary')}
                      </p>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                        <span>{news.source}</span>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {news.readTime} min read
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </section>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Crop Name</Label>
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
                <Label>Event Type</Label>
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
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={format(new Date(editingEvent.date), 'yyyy-MM-dd')}
                  onChange={(e) => setEditingEvent({ ...editingEvent, date: new Date(e.target.value) })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={editingEvent.notes || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateEvent} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
