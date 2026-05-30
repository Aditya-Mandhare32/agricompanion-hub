import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { showLocalNotification } from '@/lib/pushNotifications';
import {
  Menu, Bell, User, LogOut, Globe, Leaf, FileText, Calendar as CalendarIcon,
  Users, Newspaper, MessageCircle, BarChart3, AlertTriangle, Sprout, Bug,
  CloudRain, Landmark, CheckCircle2, TrendingUp, Wheat, BellOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { routeForNotification, needsDetailModal, translateNotification, type NotifLike } from '@/lib/notificationActions';
import { NotificationDetailModal } from '@/components/notifications/NotificationDetailModal';

const navItems = [
  { path: '/dashboard', label: 'dashboard', icon: BarChart3, authOnly: true },
  { path: '/soil-report', label: 'soilReport', icon: FileText },
  { path: '/calendar', label: 'calendar', icon: CalendarIcon },
  { path: '/community', label: 'community', icon: Users },
  { path: '/news', label: 'news', icon: Newspaper },
];

interface SmartNotif {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  action_type: string | null;
  action_data: any;
  read: boolean;
  dismissed: boolean;
  created_at: string;
}

// Icon + color mapping per type group
const typeIconMap: Record<string, { Icon: any; cls: string }> = {
  task_today: { Icon: CalendarIcon, cls: 'text-blue-600 bg-blue-50' },
  upcoming_activity: { Icon: CalendarIcon, cls: 'text-blue-600 bg-blue-50' },
  overdue: { Icon: CalendarIcon, cls: 'text-blue-600 bg-blue-50' },
  harvest_coming: { Icon: Wheat, cls: 'text-blue-600 bg-blue-50' },
  schedule_generated: { Icon: Sprout, cls: 'text-blue-600 bg-blue-50' },
  task_reminder: { Icon: CalendarIcon, cls: 'text-blue-600 bg-blue-50' },
  pest_alert: { Icon: Bug, cls: 'text-amber-600 bg-amber-50' },
  weather_warning: { Icon: CloudRain, cls: 'text-amber-600 bg-amber-50' },
  weather_alert: { Icon: CloudRain, cls: 'text-amber-600 bg-amber-50' },
  activity_conflict: { Icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  health_drop: { Icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  crop_risk: { Icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  soil_ready: { Icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
  nutrient_alert: { Icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
  market_price: { Icon: TrendingUp, cls: 'text-emerald-600 bg-emerald-50' },
  weekly_summary: { Icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
  community_reply: { Icon: MessageCircle, cls: 'text-violet-600 bg-violet-50' },
  nearby_farmer: { Icon: Users, cls: 'text-violet-600 bg-violet-50' },
  message_alert: { Icon: MessageCircle, cls: 'text-violet-600 bg-violet-50' },
  gov_scheme: { Icon: Landmark, cls: 'text-rose-600 bg-rose-50' },
};

const getIcon = (type: string) => typeIconMap[type] || { Icon: Bell, cls: 'text-primary bg-primary/10' };

export function Header() {
  const { t, language, setLanguage } = useApp();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState<SmartNotif[]>([]);
  const [modalNotif, setModalNotif] = useState<SmartNotif | null>(null);

  const unreadCount = notifs.filter((n) => !n.read && !n.dismissed).length;

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('smart_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifs((data || []) as SmartNotif[]);
  }, [user]);

  // initial load + realtime subscription
  useEffect(() => {
    if (!user) { setNotifs([]); return; }
    fetchNotifs();
    const channel = supabase
      .channel(`header-notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'smart_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as SmartNotif;
          setNotifs((prev) => [n, ...prev].slice(0, 20));
          // also fire local browser notification (no-op in iframe/preview)
          showLocalNotification(n.title, n.message, '/dashboard');
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'smart_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as SmartNotif;
          setNotifs((prev) => prev.map((x) => (x.id === n.id ? n : x)));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifs]);

  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('smart_notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    if (!user) return;
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('smart_notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false);
  };

  const handleClick = async (n: SmartNotif) => {
    await markRead(n.id);
    if (needsDetailModal(n.type)) {
      setModalNotif(n);
      return;
    }
    const { path } = routeForNotification(n as NotifLike);
    navigate(path);
  };

  const handleModalContinue = () => {
    if (!modalNotif) return;
    const { path } = routeForNotification(modalNotif as NotifLike);
    setModalNotif(null);
    navigate(path);
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
  ];

  const emptyLabel = language === 'hi' ? 'कोई सूचना नहीं' : language === 'mr' ? 'कोणत्याही सूचना नाहीत' : 'No notifications';
  const markAllLabel = language === 'hi' ? 'सभी पढ़े' : language === 'mr' ? 'सर्व वाचले' : 'Mark all read';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-effect">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl hero-gradient">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">Agri360</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.filter(item => !item.authOnly || user).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                <Icon className="h-4 w-4" />{t(item.label as any)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex"><Globe className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as any)}
                  className={language === lang.code ? 'bg-primary/10 text-primary' : ''}>{lang.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] p-0">
                  <div className="flex items-center justify-between p-3 border-b">
                    <span className="font-semibold">
                      {language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'Notifications'}
                    </span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />{markAllLabel}
                      </Button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                        <BellOff className="h-8 w-8 mb-2 opacity-40" />
                        <span className="text-sm">{emptyLabel}</span>
                      </div>
                    ) : (
                      notifs.map((n) => {
                        const { Icon, cls } = getIcon(n.type);
                        return (
                          <button key={n.id} onClick={() => handleClick(n)}
                            className={`w-full text-left flex gap-3 p-3 border-b last:border-b-0 hover:bg-muted/60 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                            <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${cls}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate">{n.title}</span>
                                {!n.read && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                              <span className="text-[10px] text-muted-foreground/70">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="font-medium">{profile?.username}</p>
                    <p className="text-sm text-muted-foreground">{profile?.location}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/profile" className="flex items-center gap-2"><User className="h-4 w-4" />{t('profile')}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/messages" className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />Messages</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />{t('logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild><Link to="/login">{t('login')}</Link></Button>
              <Button asChild><Link to="/signup">{t('signup')}</Link></Button>
            </div>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.filter(item => !item.authOnly || user).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={`nav-link ${isActive ? 'active' : ''}`}>
                      <Icon className="h-5 w-5" />{t(item.label as any)}
                    </Link>
                  );
                })}
                <div className="border-t my-4" />
                <div className="px-4 py-2">
                  <p className="text-sm font-medium mb-2">{t('language')}</p>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <Button key={lang.code} variant={language === lang.code ? 'default' : 'outline'} size="sm" onClick={() => setLanguage(lang.code as any)}>{lang.label}</Button>
                    ))}
                  </div>
                </div>
                {!user && (
                  <>
                    <div className="border-t my-4" />
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="nav-link">{t('login')}</Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-primary mx-4">{t('signup')}</Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
