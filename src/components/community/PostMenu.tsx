import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Trash2, Flag, UserX, ShieldAlert, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logAdminAction, setUserStatus } from '@/lib/adminActions';

const REPORT_REASONS = [
  'False Information',
  'Spam',
  'Inappropriate Content',
  'Misleading Farming Advice',
];

interface PostMenuProps {
  postId: string;
  postUserId: string;
  postUserEmail?: string | null;
  onDelete?: () => void;
  onEdit?: () => void;
  onUserBlocked?: (userId: string) => void;
}

export function PostMenu({ postId, postUserId, postUserEmail, onDelete, onEdit, onUserBlocked }: PostMenuProps) {
  const { user, profile } = useAuth();
  const isOwn = user?.id === postUserId;
  const isAdmin = !!profile?.is_admin;

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('post_reports').insert({
      reporter_id: user.id,
      reported_post_id: postId,
      reported_user_id: postUserId,
      reason,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) { toast.error('Failed to submit report'); return; }
    toast.success('Report submitted. Admin will review within 24 hours.');
    setReportOpen(false);
  };

  const blockUser = async () => {
    if (!user) return;
    const { error } = await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_user_id: postUserId,
      blocked_by_admin: false,
    });
    if (error && !error.message?.includes('duplicate')) { toast.error('Failed to block user'); return; }
    toast.success('You will no longer see posts from this user.');
    onUserBlocked?.(postUserId);
  };

  const adminRestrict = async () => {
    if (!user) return;
    await setUserStatus(postUserId, 'restricted', 'Restricted from post menu', 7);
    await logAdminAction(user.id, 'restrict_user', postUserId, postUserEmail || null, 'Restricted from post menu');
    toast.success('User restricted for 7 days');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwn ? (
            <>
              {onEdit && <DropdownMenuItem onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Edit Post</DropdownMenuItem>}
              {onDelete && <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Delete Post
              </DropdownMenuItem>}
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setReportOpen(true)}>
                <Flag className="h-4 w-4 mr-2" />Report Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={blockUser}>
                <UserX className="h-4 w-4 mr-2" />Block User
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={adminRestrict} className="text-amber-600">
                    <ShieldAlert className="h-4 w-4 mr-2" />Restrict User (7 days)
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>Select the reason for reporting this post.</DialogDescription>
          </DialogHeader>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <div key={r} className="flex items-center space-x-2">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r} className="cursor-pointer">{r}</Label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button onClick={submitReport} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
