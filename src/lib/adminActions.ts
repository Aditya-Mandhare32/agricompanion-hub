import { supabase } from '@/integrations/supabase/client';

export type UserStatusValue = 'active' | 'warned' | 'restricted' | 'blocked';

/** Insert into admin_activity_logs. Must be called by an admin. */
export async function logAdminAction(
  adminId: string,
  actionType: string,
  targetUserId: string | null,
  targetUserEmail: string | null,
  reason?: string,
  metadata?: Record<string, any>,
) {
  await supabase.from('admin_activity_logs').insert({
    admin_id: adminId,
    action_type: actionType,
    target_user_id: targetUserId,
    target_user_email: targetUserEmail,
    reason: reason || null,
    metadata: metadata || null,
  });
}

/** Upsert user_status. Days = optional restriction window (only when status==='restricted'). */
export async function setUserStatus(
  userId: string,
  status: UserStatusValue,
  reason?: string,
  days?: number,
) {
  const { data: auth } = await supabase.auth.getUser();
  const restricted_until = status === 'restricted' && days
    ? new Date(Date.now() + days * 86400000).toISOString()
    : null;
  await supabase.from('user_status').upsert({
    user_id: userId,
    status,
    reason: reason || null,
    restricted_until,
    updated_by_admin: auth?.user?.id || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

/** Fire-and-forget in-app notification + best-effort email via edge function. */
export async function notifyUser(args: {
  userId: string;
  userEmail?: string | null;
  title: string;
  message: string;
  actionType?: string;
}) {
  // In-app notification (works immediately, persistent)
  await supabase.from('smart_notifications').insert({
    user_id: args.userId,
    type: 'gov_scheme', // reuse icon mapping (rose); admin action category
    title: args.title,
    message: args.message,
    priority: 'high',
    action_type: args.actionType || 'view_profile',
  });

  // Email (best-effort — silently no-op if function or domain not configured)
  if (args.userEmail) {
    try {
      await supabase.functions.invoke('send-admin-email', {
        body: {
          email: args.userEmail,
          title: args.title,
          message: args.message,
        },
      });
    } catch { /* ignore */ }
  }
}

/** Convenience wrapper: status change + notify + log. */
export async function applyModeration(args: {
  adminId: string;
  targetUserId: string;
  targetEmail: string | null;
  action: 'warn' | 'restrict7' | 'block' | 'unrestrict' | 'unblock';
  reason?: string;
}) {
  const messages: Record<typeof args.action, { title: string; message: string; status: UserStatusValue; days?: number }> = {
    warn: {
      title: 'Agri360 Account Notice',
      message: `You have received a warning from the Agri360 moderation team. Reason: ${args.reason || 'Community guidelines violation'}.`,
      status: 'warned',
    },
    restrict7: {
      title: 'Agri360 Account Notice',
      message: `Your account has been restricted from posting for 7 days. Reason: ${args.reason || 'Community guidelines violation'}.`,
      status: 'restricted', days: 7,
    },
    block: {
      title: 'Agri360 Account Notice',
      message: `Your account has been blocked. Reason: ${args.reason || 'Community guidelines violation'}. Contact adityamandhare28@gmail.com to appeal.`,
      status: 'blocked',
    },
    unrestrict: {
      title: 'Agri360 Account Notice',
      message: `Your account access has been restored.`,
      status: 'active',
    },
    unblock: {
      title: 'Agri360 Account Notice',
      message: `Your account access has been restored.`,
      status: 'active',
    },
  };
  const m = messages[args.action];
  await setUserStatus(args.targetUserId, m.status, args.reason, m.days);

  // Maintain blocked_users for global-block visibility logic
  if (args.action === 'block') {
    await supabase.from('blocked_users').insert({
      blocker_id: args.adminId,
      blocked_user_id: args.targetUserId,
      blocked_by_admin: true,
      reason: args.reason || null,
    });
  } else if (args.action === 'unblock') {
    await supabase.from('blocked_users').delete()
      .eq('blocked_user_id', args.targetUserId).eq('blocked_by_admin', true);
  }

  await logAdminAction(args.adminId, args.action, args.targetUserId, args.targetEmail || null, args.reason);
  await notifyUser({ userId: args.targetUserId, userEmail: args.targetEmail, title: m.title, message: m.message });
}
