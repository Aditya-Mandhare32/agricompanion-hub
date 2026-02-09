import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell, CloudRain, AlertTriangle, Calendar, Droplets, Leaf,
  CheckCircle, Clock, Loader2, RefreshCw, X, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SmartNotification {
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

const typeIcons: Record<string, typeof Bell> = {
  weather_alert: CloudRain,
  crop_risk: AlertTriangle,
  task_reminder: Calendar,
  nutrient_alert: Leaf,
  irrigation: Droplets,
  daily_summary: FileText,
};

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  normal: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-muted text-muted-foreground border-border',
};

export function SmartNotifications() {
  const { user } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Realtime subscription
      const channel = supabase
        .channel('smart_notifs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'smart_notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
          setNotifications(prev => [payload.new as SmartNotification, ...prev]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('smart_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data || []) as SmartNotification[]);
    setLoading(false);
  };

  const generateNotifications = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-smart-notifications', {
        body: { userId: user.id, language },
      });
      if (error) throw error;
      toast.success(language === 'hi' ? 'नई सूचनाएं तैयार!' : language === 'mr' ? 'नवीन सूचना तयार!' : 'Smart alerts generated!');
      await fetchNotifications();
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate alerts');
    } finally {
      setGenerating(false);
    }
  };

  const dismissNotification = async (id: string) => {
    await supabase.from('smart_notifications').update({ dismissed: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markRead = async (id: string) => {
    await supabase.from('smart_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleAction = async (notif: SmartNotification) => {
    await markRead(notif.id);
    switch (notif.action_type) {
      case 'view_calendar': navigate('/calendar'); break;
      case 'view_soil': navigate('/soil-report'); break;
      case 'mark_complete': 
        await dismissNotification(notif.id);
        toast.success(language === 'hi' ? 'पूर्ण!' : language === 'mr' ? 'पूर्ण!' : 'Marked complete!');
        break;
      default: await markRead(notif.id);
    }
  };

  const actionLabels: Record<string, Record<string, string>> = {
    mark_complete: { en: 'Mark Done', hi: 'पूर्ण करें', mr: 'पूर्ण करा' },
    view_calendar: { en: 'View Calendar', hi: 'कैलेंडर देखें', mr: 'कॅलेंडर पहा' },
    view_soil: { en: 'View Soil Report', hi: 'मिट्टी रिपोर्ट', mr: 'माती अहवाल' },
    remind_later: { en: 'Remind Later', hi: 'बाद में याद दिलाएं', mr: 'नंतर आठवण करा' },
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {language === 'hi' ? 'स्मार्ट अलर्ट' : language === 'mr' ? 'स्मार्ट अलर्ट' : 'Smart Farming Alerts'}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generateNotifications} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">
              {language === 'hi' ? 'अपडेट' : language === 'mr' ? 'अपडेट' : 'Refresh'}
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">
              {language === 'hi' ? 'कोई अलर्ट नहीं' : language === 'mr' ? 'कोणताही अलर्ट नाही' : 'No alerts yet'}
            </p>
            <Button onClick={generateNotifications} disabled={generating} size="sm">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {language === 'hi' ? 'अलर्ट बनाएं' : language === 'mr' ? 'अलर्ट तयार करा' : 'Generate Alerts'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Bell;
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${priorityColors[notif.priority] || priorityColors.normal} ${!notif.read ? 'ring-2 ring-primary/20' : 'opacity-80'}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{notif.title}</span>
                        {notif.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0">
                            {language === 'hi' ? 'ज़रूरी' : language === 'mr' ? 'तातडीचे' : 'Urgent'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm opacity-90">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {notif.action_type && (
                          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleAction(notif)}>
                            {notif.action_type === 'mark_complete' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {notif.action_type === 'view_calendar' && <Calendar className="h-3 w-3 mr-1" />}
                            {actionLabels[notif.action_type]?.[language] || actionLabels[notif.action_type]?.en || notif.action_type}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => dismissNotification(notif.id)}>
                          <X className="h-3 w-3 mr-1" />
                          {language === 'hi' ? 'खारिज' : language === 'mr' ? 'नकारा' : 'Dismiss'}
                        </Button>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3 inline mr-0.5" />
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
