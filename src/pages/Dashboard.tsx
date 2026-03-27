import React, { Suspense, lazy, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SmartNotifications } from '@/components/notifications/SmartNotifications';
import { MarketPrices } from '@/components/dashboard/MarketPrices';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import {
  Sprout, Calendar, Upload, BarChart3, CloudRain, Sun, Thermometer,
  MapPin, TrendingUp, CheckCircle, Clock, AlertTriangle, ArrowRight,
  Leaf, Droplets, Bug, Scissors, Activity, Bell, Cloud, CloudSnow, CloudLightning, Wind
} from 'lucide-react';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// Dynamic weather background images based on conditions
function getWeatherImage(description?: string, temp?: number): string {
  const desc = (description || '').toLowerCase();
  if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower'))
    return 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1920&q=80';
  if (desc.includes('thunder') || desc.includes('storm'))
    return 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1920&q=80';
  if (desc.includes('snow') || desc.includes('sleet'))
    return 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1920&q=80';
  if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze'))
    return 'https://images.unsplash.com/photo-1487621167305-5d248087c724?w=1920&q=80';
  if (desc.includes('cloud') || desc.includes('overcast'))
    return 'https://images.unsplash.com/photo-1501004318855-fce4f4ed9fbc?w=1920&q=80';
  if (temp && temp > 38)
    return 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=1920&q=80';
  if (temp && temp > 32)
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80';
  if (temp && temp < 15)
    return 'https://images.unsplash.com/photo-1510596713412-56030de252c8?w=1920&q=80';
  return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80';
}

function getWeatherIcon(description?: string) {
  const desc = (description || '').toLowerCase();
  if (desc.includes('rain') || desc.includes('drizzle')) return <CloudRain className="h-8 w-8 text-sky-300" />;
  if (desc.includes('thunder') || desc.includes('storm')) return <CloudLightning className="h-8 w-8 text-yellow-300" />;
  if (desc.includes('snow')) return <CloudSnow className="h-8 w-8 text-blue-200" />;
  if (desc.includes('cloud') || desc.includes('overcast')) return <Cloud className="h-8 w-8 text-gray-300" />;
  if (desc.includes('fog') || desc.includes('mist')) return <Wind className="h-8 w-8 text-gray-400" />;
  return <Sun className="h-8 w-8 text-amber-400" />;
}

const CropCard = React.memo(({ crop, language }: { crop: any; language: string }) => {
  const dayNumber = differenceInDays(new Date(), new Date(crop.sowing_date || crop.created_at));
  const totalDuration = crop.expected_harvest_date && crop.sowing_date
    ? differenceInDays(new Date(crop.expected_harvest_date), new Date(crop.sowing_date)) : 120;
  const progress = Math.min(100, Math.max(0, (dayNumber / totalDuration) * 100));
  const progressColor = progress >= 85 ? 'bg-emerald-500' : progress >= 70 ? 'bg-amber-500' : 'bg-red-500';
  const healthEmoji = progress < 30 ? '🌱' : progress < 60 ? '🌿' : progress < 85 ? '🌾' : '🎉';

  return (
    <motion.div variants={fadeIn}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: progress >= 85 ? '#10b981' : progress >= 70 ? '#f59e0b' : '#ef4444' }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
            <h3 className="font-bold text-lg text-foreground">
              {language === 'hi' && crop.crop_name_hi ? crop.crop_name_hi : language === 'mr' && crop.crop_name_mr ? crop.crop_name_mr : crop.crop_name}
            </h3>
              {crop.field_name && <p className="text-xs text-muted-foreground">{crop.field_name}</p>}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl">{healthEmoji}</span>
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {language === 'hi' ? 'लाइव' : language === 'mr' ? 'लाइव्ह' : 'Live'}
              </Badge>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                {language === 'hi' ? `दिन ${dayNumber}` : language === 'mr' ? `दिवस ${dayNumber}` : `Day ${dayNumber}`}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {crop.sowing_date ? format(new Date(crop.sowing_date), 'dd MMM') : '—'}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Scissors className="h-3.5 w-3.5" />
              {crop.expected_harvest_date ? format(new Date(crop.expected_harvest_date), 'dd MMM') : '—'}
            </div>
            {crop.crop_category && (
              <div className="col-span-2"><Badge variant="outline" className="text-xs">{crop.crop_category}</Badge></div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
CropCard.displayName = 'CropCard';

const TaskItem = React.memo(({ task, onComplete, language }: { task: any; onComplete: (id: string) => void; language: string }) => {
  const typeIcons: Record<string, React.ReactNode> = {
    'Sowing': <Sprout className="h-4 w-4 text-emerald-500" />,
    'Irrigation': <Droplets className="h-4 w-4 text-blue-500" />,
    'Fertilizing': <Leaf className="h-4 w-4 text-amber-600" />,
    'Spraying': <Bug className="h-4 w-4 text-red-500" />,
    'Weeding': <Scissors className="h-4 w-4 text-green-600" />,
    'Harvesting': <TrendingUp className="h-4 w-4 text-orange-500" />,
  };
  return (
    <motion.div variants={fadeIn} className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors">
      <Checkbox checked={task.completed} onCheckedChange={() => onComplete(task.id)} className="data-[state=checked]:bg-primary" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {typeIcons[task.event_type] || <Clock className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-sm truncate">{task.event_type}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{task.crop_name} {task.notes ? `— ${task.notes}` : ''}</p>
      </div>
    </motion.div>
  );
});
TaskItem.displayName = 'TaskItem';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    </div>
  );
}

function EmptyState({ language }: { language: string }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center py-16 max-w-2xl mx-auto">
      <motion.div variants={fadeIn} className="text-8xl mb-6 animate-bounce">🌱</motion.div>
      <motion.h2 variants={fadeIn} className="text-3xl font-bold mb-3 text-foreground">
        {language === 'hi' ? 'अभी तक कोई सक्रिय फसल नहीं' : language === 'mr' ? 'अजून कोणतीही सक्रिय पिके नाहीत' : 'No Active Crops Yet'}
      </motion.h2>
      <motion.p variants={fadeIn} className="text-muted-foreground mb-8 text-lg">
        {language === 'hi' ? 'अपनी स्मार्ट खेती यात्रा शुरू करें!' : language === 'mr' ? 'तुमचा स्मार्ट शेती प्रवास सुरू करा!' : 'Start your smart farming journey!'}
      </motion.p>
      <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <Button asChild size="lg" className="text-base px-8">
          <Link to="/soil-report"><Upload className="h-5 w-5 mr-2" />
            {language === 'hi' ? 'मिट्टी रिपोर्ट अपलोड करें' : language === 'mr' ? 'माती अहवाल अपलोड करा' : 'Upload Soil Report'}
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="text-base px-8">
          <Link to="/calendar"><Calendar className="h-5 w-5 mr-2" />
            {language === 'hi' ? 'कैलेंडर खोलें' : language === 'mr' ? 'कॅलेंडर उघडा' : 'Open Calendar'}
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { language } = useApp();
  const queryClient = useQueryClient();

  const { data: crops, isLoading: cropsLoading } = useQuery({
    queryKey: ['activeCrops', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('crop_history').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id, staleTime: 300000, refetchInterval: 60000,
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['todayTasks', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_events').select('*').eq('user_id', user!.id).eq('event_date', today).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id, staleTime: 300000, refetchInterval: 60000,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcomingEvents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_events').select('*').eq('user_id', user!.id).gte('event_date', today).eq('completed', false).order('event_date', { ascending: true }).limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id, staleTime: 300000,
  });

  const { data: weatherData } = useQuery({
    queryKey: ['weather', profile?.location || 'Pune', language],
    queryFn: async () => {
      const city = profile?.location?.split(',')[0]?.trim() || 'Pune';
      const { data, error } = await supabase.functions.invoke('get-weather', { body: { city, language } });
      if (error) throw error;
      return data;
    },
    staleTime: 3600000,
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('calendar_events').update({ completed: true }).eq('id', taskId);
      if (error) throw error;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['todayTasks'] });
      const previous = queryClient.getQueryData(['todayTasks', user?.id, today]);
      queryClient.setQueryData(['todayTasks', user?.id, today], (old: any[]) =>
        old?.map(t => t.id === taskId ? { ...t, completed: true } : t)
      );
      return { previous };
    },
    onError: (_err, _id, context) => { queryClient.setQueryData(['todayTasks', user?.id, today], context?.previous); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
    },
  });

  React.useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
        queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crop_history', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['activeCrops'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.username || 'Farmer';
    if (language === 'hi') return hour < 12 ? `सुप्रभात, ${name} 👋` : hour < 17 ? `नमस्ते, ${name} 👋` : `शुभ संध्या, ${name} 👋`;
    if (language === 'mr') return hour < 12 ? `सुप्रभात, ${name} 👋` : hour < 17 ? `नमस्कार, ${name} 👋` : `शुभ संध्याकाळ, ${name} 👋`;
    return hour < 12 ? `Good Morning, ${name} 👋` : hour < 17 ? `Good Afternoon, ${name} 👋` : `Good Evening, ${name} 👋`;
  }, [profile?.username, language]);

  const activeCropSummary = useMemo(() => {
    if (!crops?.length) return null;
    const latest = crops[0];
    return { name: latest.crop_name, dayNumber: differenceInDays(new Date(), new Date(latest.sowing_date || latest.created_at)) };
  }, [crops]);

  const pendingTasks = useMemo(() => tasks?.filter(t => !t.completed) || [], [tasks]);
  const completedTasks = useMemo(() => tasks?.filter(t => t.completed) || [], [tasks]);

  if (cropsLoading) return <Layout><div className="container mx-auto px-4 py-8"><DashboardSkeleton /></div></Layout>;

  const hasCrops = (crops?.length || 0) > 0;
  const weatherBgImage = getWeatherImage(weatherData?.current?.description, weatherData?.current?.temperature);
  const weatherTip = weatherData?.farmingTip || (
    language === 'hi' ? '✓ आज खेती के लिए अच्छा दिन है' :
    language === 'mr' ? '✓ आज शेतीसाठी चांगला दिवस आहे' :
    '✓ Good conditions for farming today'
  );

  return (
    <Layout>
      <motion.div initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Dynamic Weather Hero Section */}
        <motion.section variants={fadeIn} className="rounded-2xl overflow-hidden relative min-h-[280px]">
          {/* Dynamic background image based on weather */}
          <div className="absolute inset-0">
           <img 
              src={weatherBgImage} 
              alt="Weather" 
              crossOrigin="anonymous"
              className="w-full h-full object-cover transition-all duration-1000"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </div>
          
          <div className="relative p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
              {/* Left: Greeting + Weather */}
              <div className="text-white">
                <p className="text-sm opacity-70 mb-1">
                  {language === 'hi' ? 'स्वागत है,' : language === 'mr' ? 'स्वागत आहे,' : 'Welcome back,'}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{profile?.username || 'Farmer'} 👋</h1>
                {profile?.location && (
                  <div className="flex items-center gap-1.5 text-sm opacity-80 mb-6">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}

                {weatherData?.current ? (
                  <div className="flex items-end gap-6 mb-4">
                    <div className="flex items-center gap-3">
                      {getWeatherIcon(weatherData.current.description)}
                      <div>
                        <div className="text-5xl font-bold">{Math.round(weatherData.current.temperature)}°C</div>
                        <div className="text-sm opacity-80 capitalize">{weatherData.current.description}</div>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm opacity-80">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="h-3.5 w-3.5" />
                        Feels like: {Math.round(weatherData.current.feelsLike || weatherData.current.temperature)}°
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5" />
                        {language === 'hi' ? 'आर्द्रता' : language === 'mr' ? 'आर्द्रता' : 'Humidity'}: {weatherData.current.humidity}%
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wind className="h-3.5 w-3.5" />
                        {language === 'hi' ? 'हवा' : language === 'mr' ? 'वारा' : 'Wind'}: {weatherData.current.windSpeed || 0} km/h
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 mb-4">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg animate-pulse w-24 h-12" />)}
                  </div>
                )}

                {/* Today's Tip */}
                <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 max-w-lg">
                  <span className="text-sm">
                    <span className="text-emerald-300 font-semibold">
                      {language === 'hi' ? "आज की टिप:" : language === 'mr' ? "आजची टीप:" : "Today's Tip:"}
                    </span>{' '}
                    {weatherTip}
                  </span>
                </div>
              </div>

              {/* Right: 5-day forecast */}
              {weatherData?.forecast && (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <p className="text-white/70 text-sm font-medium mb-1">
                    {language === 'hi' ? '5-दिन का पूर्वानुमान' : language === 'mr' ? '5-दिवसांचा अंदाज' : '5-Day Forecast'}
                  </p>
                  {weatherData.forecast.slice(0, 5).map((day: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{day.icon || '☀️'}</span>
                        <span className="text-sm">{day.day}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-bold">{Math.round(day.maxTemp)}°</span>
                        <span className="opacity-60">/{Math.round(day.minTemp)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Main content */}
        {!hasCrops ? (
          <EmptyState language={language} />
        ) : (
          <>
            {/* Crop Cards */}
            <motion.section variants={fadeIn}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  {language === 'hi' ? 'सक्रिय फसलें' : language === 'mr' ? 'सक्रिय पिके' : 'Active Crops'}
                  <Badge variant="secondary" className="ml-2">{crops?.length}</Badge>
                </h2>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/calendar">
                    {language === 'hi' ? 'फसल जोड़ें' : language === 'mr' ? 'पीक जोडा' : 'Add Crop'}
                  </Link>
                </Button>
              </div>
              <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crops?.map(crop => <CropCard key={crop.id} crop={crop} language={language} />)}
              </motion.div>
            </motion.section>

            {/* Tasks & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      {language === 'hi' ? 'आज के कार्य' : language === 'mr' ? 'आजची कामे' : "Today's Tasks"}
                      {pendingTasks.length > 0 && <Badge className="ml-auto">{pendingTasks.length}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tasksLoading ? (
                      [1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)
                    ) : pendingTasks.length > 0 ? (
                      <motion.div variants={stagger} className="space-y-2">
                        {pendingTasks.map(task => (
                          <TaskItem key={task.id} task={task} onComplete={(id) => completeTask.mutate(id)} language={language} />
                        ))}
                      </motion.div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                        <p className="text-sm">{language === 'hi' ? 'सब काम पूरे!' : language === 'mr' ? 'सर्व कामे पूर्ण!' : 'All tasks done!'}</p>
                      </div>
                    )}
                    {completedTasks.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">{language === 'hi' ? 'पूर्ण' : language === 'mr' ? 'पूर्ण' : 'Completed'} ({completedTasks.length})</p>
                        {completedTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="flex items-center gap-2 py-1 text-sm text-muted-foreground line-through">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />{task.event_type} — {task.crop_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {language === 'hi' ? 'आगामी कार्यक्रम' : language === 'mr' ? 'आगामी कार्यक्रम' : 'Upcoming Events'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingEvents && upcomingEvents.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.event_type} — {event.crop_name}</p>
                              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}</p>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">{format(new Date(event.event_date), 'dd MMM')}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{language === 'hi' ? 'कोई आगामी कार्यक्रम नहीं' : language === 'mr' ? 'कोणतेही आगामी कार्यक्रम नाहीत' : 'No upcoming events'}</p>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                      <Link to="/calendar">
                        {language === 'hi' ? 'कैलेंडर खोलें' : language === 'mr' ? 'कॅलेंडर उघडा' : 'Open Calendar'}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Smart Notifications & Market Prices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fadeIn}><SmartNotifications /></motion.div>
              <motion.div variants={fadeIn}><MarketPrices /></motion.div>
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
