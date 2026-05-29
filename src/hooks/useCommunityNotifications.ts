import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { createNotification } from '@/lib/notify';

/**
 * Subscribes to community post_comments so the farmer gets a "Community Reply"
 * notification whenever someone comments on one of their posts.
 *
 * Mount once near the app root (Layout or App component).
 */
export function useCommunityNotifications() {
  const { user } = useAuth();
  const { language } = useApp();
  const myPostIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    let active = true;

    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id);
      if (!active) return;
      myPostIds.current = new Set((data || []).map((p) => p.id));
    })();

    const channel = supabase
      .channel(`community-notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        async (payload) => {
          const c = payload.new as { post_id: string; user_id: string; content: string };
          if (c.user_id === user.id) return; // ignore self
          if (!myPostIds.current.has(c.post_id)) return;
          // fetch commenter username
          const { data: prof } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', c.user_id)
            .maybeSingle();
          const name = prof?.username || (language === 'hi' ? 'किसी ने' : language === 'mr' ? 'कोणीतरी' : 'Someone');
          await createNotification({
            userId: user.id,
            type: 'community_reply',
            title: language === 'hi' ? 'नई टिप्पणी' : language === 'mr' ? 'नवीन टिप्पणी' : 'New Comment',
            message: `${name}: ${c.content.slice(0, 90)}`,
            priority: 'normal',
            action_type: 'view_community',
            dedupeKey: `comment-${c.post_id}-${Date.now()}`,
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const p = payload.new as { id: string; user_id: string };
          if (p.user_id === user.id) myPostIds.current.add(p.id);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, language]);
}
