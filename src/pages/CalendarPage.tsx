import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Sun,
  Cloud,
  Wheat
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, getDay, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns';
import { CropEvent } from '@/lib/types';

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

export default function CalendarPage() {
  const { t, events, addEvent, updateEvent, deleteEvent, isAuthenticated } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CropEvent | null>(null);
  
  const [newEvent, setNewEvent] = useState({
    cropName: '',
    eventType: 'sowing' as CropEvent['eventType'],
    date: new Date(),
    notes: '',
  });

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

  const getDaysWithEvents = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.filter(day => 
      events.some(event => isSameDay(new Date(event.date), day))
    );
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
                      onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v as any })}
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
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
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
                {/* Custom Calendar Grid with Icons */}
                <div className="space-y-4">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
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
                        const isCurrentMonth = isSameMonth(currentDay, currentMonth);
                        const isSelected = isSameDay(currentDay, selectedDate);
                        const isTodayDate = isToday(currentDay);
                        
                        days.push(
                          <button
                            key={currentDay.toISOString()}
                            onClick={() => setSelectedDate(currentDay)}
                            className={`
                              relative min-h-[70px] p-1 rounded-lg border transition-all duration-200 hover:shadow-md
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
                                      <Icon className="h-3 w-3 text-white" />
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    +{dayEvents.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                        
                        day = addDays(day, 1);
                      }
                      
                      return days;
                    })()}
                  </div>
                </div>
                
                {/* Event Legend */}
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

            {/* Selected Date Events */}
            <Card className="mt-6 shadow-lg">
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

            {/* Quick Tips */}
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  Farming Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Plan sowing dates based on monsoon patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Set irrigation reminders during dry spells</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Schedule fertilizer application at growth stages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Mark harvest windows to plan labor needs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
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
                  onValueChange={(v) => setEditingEvent({ ...editingEvent, eventType: v as any })}
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
