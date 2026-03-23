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
  Leaf, Droplets, Bug, Scissors, Activity, Bell
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// Memoized components
const CropCard = React.memo(({ crop, language }: { crop: any; language: string }) => {
  const dayNumber = differenceInDays(new Date(), new Date(crop.sowing_date || crop.created_at));
  const totalDuration = crop.expected_harvest_date && crop.sowing_date
    ? differenceInDays(new Date(crop.expected_harvest_date), new Date(crop.sowing_date))
    : 120;
  const progress = Math.min(100, Math.max(0, (dayNumber / totalDuration) * 100));
  const progressColor = progress >= 85 ? 'bg-emerald-500' : progress >= 70 ? 'bg-amber-500' : 'bg-red-500';
  const healthEmoji = progress < 30 ? '🌱' : progress < 60 ? '🌿' : progress < 85 ? '🌾' : '🎉';

  return (
    <motion.div variants={fadeIn}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: progress >= 85 ? '#10b981' : progress >= 70 ? '#f59e0b' : '#ef4444' }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg text-foreground">{crop.crop_name}</h3>
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
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs">{crop.crop_category}</Badge>
              </div>
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
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onComplete(task.id)}
        className="data-[state=checked]:bg-primary"
      />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
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
          <Link to="/crop-explorer"><Sprout className="h-5 w-5 mr-2" />
            {language === 'hi' ? 'पहली फसल जोड़ें' : language === 'mr' ? 'पहिले पीक जोडा' : 'Add First Crop'}
          </Link>
        </Button>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: '📊', title: language === 'hi' ? 'स्मार्ट एनालिटिक्स' : language === 'mr' ? 'स्मार्ट अॅनालिटिक्स' : 'Smart Analytics', desc: language === 'hi' ? 'AI-संचालित मिट्टी और फसल विश्लेषण' : language === 'mr' ? 'AI-चालित माती आणि पीक विश्लेषण' : 'AI-powered soil & crop analysis' },
          { icon: '📅', title: language === 'hi' ? 'ऑटो शेड्यूलिंग' : language === 'mr' ? 'ऑटो शेड्युलिंग' : 'Auto Scheduling', desc: language === 'hi' ? 'बुवाई से कटाई तक स्वचालित' : language === 'mr' ? 'पेरणीपासून कापणीपर्यंत स्वयंचलित' : 'Automated sowing to harvest' },
          { icon: '🤖', title: language === 'hi' ? 'AI सहायक' : language === 'mr' ? 'AI सहाय्यक' : 'AI Assistant', desc: language === 'hi' ? 'पतिल बाबा से सलाह लें' : language === 'mr' ? 'पाटील दादांचा सल्ला घ्या' : 'Get advice from Patil' },
        ].map((item) => (
          <Card key={item.title} className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">
              {language === 'hi' ? 'शुरू कैसे करें' : language === 'mr' ? 'कसे सुरू करावे' : 'Getting Started'}
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {[
                { step: '1', label: language === 'hi' ? 'मिट्टी अपलोड करें' : language === 'mr' ? 'माती अपलोड करा' : 'Upload Soil' },
                { step: '2', label: language === 'hi' ? 'AI सुझाव लें' : language === 'mr' ? 'AI सूचना घ्या' : 'AI Recommends' },
                { step: '3', label: language === 'hi' ? 'कैलेंडर बनाएं' : language === 'mr' ? 'कॅलेंडर तयार करा' : 'Calendar Generated' },
              ].map((s, i) => (
                <React.Fragment key={s.step}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">{s.step}</div>
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { language } = useApp();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Active crops from crop_history
  const { data: crops, isLoading: cropsLoading } = useQuery({
    queryKey: ['activeCrops', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crop_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 300000,
    refetchInterval: 60000,
  });

  // Today's tasks
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['todayTasks', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .eq('event_date', today)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 300000,
    refetchInterval: 60000,
  });

  // Upcoming events
  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcomingEvents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .gte('event_date', today)
        .eq('completed', false)
        .order('event_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 300000,
  });

  // Unread notifications count
  const { data: unreadNotifCount } = useQuery({
    queryKey: ['unreadNotifs', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('smart_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false)
        .eq('dismissed', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Weather
  const { data: weatherData } = useQuery({
    queryKey: ['weather', profile?.location || 'Pune', language],
    queryFn: async () => {
      const city = profile?.location?.split(',')[0]?.trim() || 'Pune';
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { city, language },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 3600000,
  });

  // Complete task mutation with optimistic update
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({ completed: true })
        .eq('id', taskId);
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
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['todayTasks', user?.id, today], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
    },
  });

  // Real-time subscriptions
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
        queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crop_history', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['activeCrops'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'smart_notifications', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['unreadNotifs'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.username || 'Farmer';
    if (language === 'hi') {
      return hour < 12 ? `सुप्रभात, ${name} 👋` : hour < 17 ? `नमस्ते, ${name} 👋` : `शुभ संध्या, ${name} 👋`;
    }
    if (language === 'mr') {
      return hour < 12 ? `सुप्रभात, ${name} 👋` : hour < 17 ? `नमस्कार, ${name} 👋` : `शुभ संध्याकाळ, ${name} 👋`;
    }
    return hour < 12 ? `Good Morning, ${name} 👋` : hour < 17 ? `Good Afternoon, ${name} 👋` : `Good Evening, ${name} 👋`;
  }, [profile?.username, language]);

  const activeCropSummary = useMemo(() => {
    if (!crops?.length) return null;
    const latest = crops[0];
    const dayNum = differenceInDays(new Date(), new Date(latest.sowing_date || latest.created_at));
    return { name: latest.crop_name, dayNumber: dayNum };
  }, [crops]);

  const pendingTasks = useMemo(() => tasks?.filter(t => !t.completed) || [], [tasks]);
  const completedTasks = useMemo(() => tasks?.filter(t => t.completed) || [], [tasks]);

  if (cropsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </Layout>
    );
  }

  const hasCrops = (crops?.length || 0) > 0;

  return (
    <Layout>
      <motion.div initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Hero Section */}
        <motion.section variants={fadeIn} className="rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-emerald-700" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-5 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Greeting */}
              <div className="text-primary-foreground">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{greeting}</h1>
                {activeCropSummary ? (
                  <p className="text-sm opacity-90 mb-4">
                    {language === 'hi' ? `${activeCropSummary.name} का दिन ${activeCropSummary.dayNumber}` :
                     language === 'mr' ? `${activeCropSummary.name} चा दिवस ${activeCropSummary.dayNumber}` :
                     `Day ${activeCropSummary.dayNumber} of ${activeCropSummary.name}`}
                  </p>
                ) : (
                  <p className="text-sm opacity-90 mb-4">
                    {language === 'hi' ? 'शुरू करने के लिए तैयार?' : language === 'mr' ? 'सुरू करण्यास तयार?' : 'Ready to start?'}
                  </p>
                )}

                {/* Weather - always visible */}
                {weatherData ? (
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <Sun className="h-4 w-4 text-amber-400" />
                      <div>
                        <div className="text-[10px] opacity-70">{weatherData.current?.description}</div>
                        <div className="font-semibold text-sm">{Math.round(weatherData.current?.temperature || 0)}°C</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <CloudRain className="h-4 w-4 text-sky-400" />
                      <div>
                        <div className="text-[10px] opacity-70">{language === 'hi' ? 'वर्षा' : language === 'mr' ? 'पाऊस' : 'Rain'}</div>
                        <div className="font-semibold text-sm">{Math.round(weatherData.totalWeeklyRainfall || 0)}mm</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <Thermometer className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="text-[10px] opacity-70">{language === 'hi' ? 'आर्द्रता' : language === 'mr' ? 'आर्द्रता' : 'Humidity'}</div>
                        <div className="font-semibold text-sm">{weatherData.current?.humidity || 0}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] opacity-60">
                      <MapPin className="h-3 w-3" />
                      {weatherData.city}, {weatherData.state}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg animate-pulse w-24 h-12" />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: 5-day forecast */}
              {weatherData?.forecast && (
                <div className="hidden lg:flex items-center gap-2">
                  {weatherData.forecast.slice(0, 5).map((day: any, i: number) => (
                    <div key={i} className="flex-1 text-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-[10px] opacity-70 text-primary-foreground">{day.day}</div>
                      <div className="text-lg my-1">{day.icon || '☀️'}</div>
                      <div className="text-xs font-semibold text-primary-foreground">{Math.round(day.maxTemp)}°</div>
                      <div className="text-[10px] opacity-60 text-primary-foreground">{Math.round(day.minTemp)}°</div>
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
                  <Link to="/crop-explorer">
                    {language === 'hi' ? 'फसल जोड़ें' : language === 'mr' ? 'पीक जोडा' : 'Add Crop'}
                  </Link>
                </Button>
              </div>
              <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crops?.map(crop => (
                  <CropCard key={crop.id} crop={crop} language={language} />
                ))}
              </motion.div>
            </motion.section>

            {/* Tasks & Timeline row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Tasks */}
              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      {language === 'hi' ? 'आज के कार्य' : language === 'mr' ? 'आजची कामे' : "Today's Tasks"}
                      {pendingTasks.length > 0 && (
                        <Badge className="ml-auto">{pendingTasks.length}</Badge>
                      )}
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
                        <p className="text-xs text-muted-foreground mb-2">
                          {language === 'hi' ? 'पूर्ण' : language === 'mr' ? 'पूर्ण' : 'Completed'} ({completedTasks.length})
                        </p>
                        {completedTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="flex items-center gap-2 py-1 text-sm text-muted-foreground line-through">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            {task.event_type} — {task.crop_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming Events */}
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
                        {upcomingEvents.map((event, i) => (
                          <div key={event.id} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.event_type} — {event.crop_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {format(new Date(event.event_date), 'dd MMM')}
                            </Badge>
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
              <motion.div variants={fadeIn}>
                <SmartNotifications />
              </motion.div>
              <motion.div variants={fadeIn}>
                <MarketPrices />
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
