import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Bell, BellOff, Loader2, History, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { routeForNotification, needsDetailModal, translateNotification, type NotifLike } from '@/lib/notificationActions';
import { NotificationDetailModal } from '@/components/notifications/NotificationDetailModal';
import { toast } from 'sonner';

interface Row {
  id: string; title: string; message: string; type: string;
  priority: string; action_type: string | null; action_data: any;
  read: boolean; dismissed: boolean; created_at: string;
}

export function NotificationHistory() {
  const { user } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Row | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('smart_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setRows((data || []) as Row[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const clearAll = async () => {
    if (!user) return;
    await supabase.from('smart_notifications').delete().eq('user_id', user.id);
    setRows([]);
    toast.success(language === 'hi' ? 'सभी सूचनाएं हटाई गईं' : language === 'mr' ? 'सर्व सूचना काढून टाकल्या' : 'All notifications cleared');
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('smart_notifications').delete().eq('id', id);
    setRows((p) => p.filter((r) => r.id !== id));
  };

  const onClick = async (n: Row) => {
    if (!n.read) {
      await supabase.from('smart_notifications').update({ read: true }).eq('id', n.id);
      setRows((p) => p.map((r) => (r.id === n.id ? { ...r, read: true } : r)));
    }
    if (needsDetailModal(n.type)) { setModal(n); return; }
    navigate(routeForNotification(n as NotifLike).path);
  };

  const headerLabel = language === 'hi' ? 'सूचना इतिहास' : language === 'mr' ? 'सूचना इतिहास' : 'Notification History';
  const clearLabel = language === 'hi' ? 'सभी हटाएं' : language === 'mr' ? 'सर्व काढा' : 'Clear all';

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="font-medium">{headerLabel}</span>
          {rows.length > 0 && <Badge variant="secondary">{rows.length}</Badge>}
        </div>
        {rows.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> {clearLabel}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BellOff className="h-8 w-8 mb-2 opacity-40" />
          <span className="text-sm">
            {language === 'hi' ? 'कोई पिछली सूचना नहीं' : language === 'mr' ? 'कोणतीही जुनी सूचना नाही' : 'No past notifications'}
          </span>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-md border divide-y">
          {rows.map((n) => {
            const tr = translateNotification(n as NotifLike, language);
            return (
              <button
                key={n.id}
                onClick={() => onClick(n)}
                className={`w-full text-left flex items-start gap-3 p-3 hover:bg-muted/60 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <Bell className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{tr.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tr.message}</p>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => deleteOne(n.id, e)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Delete notification"
                >
                  <X className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <NotificationDetailModal
        notif={modal as NotifLike | null}
        open={!!modal}
        onOpenChange={(v) => !v && setModal(null)}
        onContinue={() => {
          if (!modal) return;
          const path = routeForNotification(modal as NotifLike).path;
          setModal(null);
          navigate(path);
        }}
      />
    </div>
  );
}
