import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Returns the set of user_ids that the current user (or an admin) has blocked. */
export function useBlockedUsers() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setBlocked(new Set()); return; }
    let active = true;

    const fetchBlocked = async () => {
      const { data } = await supabase
        .from('blocked_users')
        .select('blocked_user_id, blocker_id, blocked_by_admin')
        .or(`blocker_id.eq.${user.id},blocked_by_admin.eq.true`);
      if (!active) return;
      setBlocked(new Set((data || []).map((b: any) => b.blocked_user_id)));
    };
    fetchBlocked();

    const channel = supabase
      .channel(`blocked-users-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_users' }, fetchBlocked)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  const addLocal = (uid: string) => setBlocked((prev) => new Set([...prev, uid]));
  return { blocked, addLocal };
}

/** Returns true if the user is currently restricted/blocked from posting. */
export function useUserRestriction() {
  const { user } = useAuth();
  const [status, setStatus] = useState<{ kind: 'ok' | 'restricted' | 'blocked'; until?: string; reason?: string }>({ kind: 'ok' });

  useEffect(() => {
    if (!user) return;
    let active = true;
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('user_status')
        .select('status, restricted_until, reason')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (!data) { setStatus({ kind: 'ok' }); return; }
      if (data.status === 'blocked') { setStatus({ kind: 'blocked', reason: data.reason || undefined }); return; }
      if (data.status === 'restricted' && data.restricted_until && new Date(data.restricted_until) > new Date()) {
        setStatus({ kind: 'restricted', until: data.restricted_until, reason: data.reason || undefined });
        return;
      }
      setStatus({ kind: 'ok' });
    };
    fetchStatus();
    const channel = supabase
      .channel(`user-status-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_status', filter: `user_id=eq.${user.id}` }, fetchStatus)
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  return status;
}
