import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ShieldAlert, Users, FileText, AlertTriangle, UserX, Trash2,
  Megaphone, Activity, BarChart3, MessageCircle, Send, Search, Loader2, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { applyModeration, logAdminAction, notifyUser } from '@/lib/adminActions';

interface ReportRow {
  id: string; reporter_id: string; reported_post_id: string; reported_user_id: string;
  reason: string; status: string; created_at: string;
  reporter?: any; reported?: any; post?: any; reportCount?: number;
}
interface UserRow {
  user_id: string; username: string; avatar_url: string; location: string | null;
  phone: string | null; created_at: string; is_admin: boolean;
  email?: string; status?: string; restricted_until?: string | null;
  postsCount?: number; reportsCount?: number; cropsCount?: number;
}
interface PostRow {
  id: string; user_id: string; content: string; image_url: string | null;
  created_at: string; likes?: number; comments?: number; reports?: number; author?: any;
}

export default function Admin() {
  const { user, profile } = useAuth();

  // Overview stats
  const [stats, setStats] = useState({
    users: 0, posts: 0, pending: 0, blocked: 0, restricted: 0,
    crops: 0, newUsers: 0, newPosts: 0, soil: 0, events: 0,
  });

  // Reports
  const [reports, setReports] = useState<ReportRow[]>([]);

  // Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'warned' | 'restricted' | 'blocked'>('all');
  const [userSort, setUserSort] = useState<'created_at' | 'reports' | 'posts'>('created_at');

  // Posts
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postFilter, setPostFilter] = useState<'all' | 'reported' | 'today' | 'flagged' | 'media'>('all');

  // Broadcast
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcTarget, setBcTarget] = useState<'all' | 'restricted' | 'blocked' | 'email'>('all');
  const [bcEmail, setBcEmail] = useState('');
  const [bcSending, setBcSending] = useState(false);
  const [bcHistory, setBcHistory] = useState<any[]>([]);

  // Blocked/Restricted
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [restrictedList, setRestrictedList] = useState<any[]>([]);

  // Activity logs
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>('');

  const loadAll = async () => {
    if (!user) return;

    // OVERVIEW
    const [
      { count: usersCount },
      { count: postsCount },
      { count: pendingCount },
      { data: blockedRows },
      { data: restrictedRows },
      { count: cropsCount },
      { count: soilCount },
      { count: eventsCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('post_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('user_status').select('user_id').eq('status', 'blocked'),
      supabase.from('user_status').select('user_id, restricted_until').eq('status', 'restricted'),
      supabase.from('crop_history').select('*', { count: 'exact', head: true }),
      supabase.from('saved_soil_analyses').select('*', { count: 'exact', head: true }),
      supabase.from('calendar_events').select('*', { count: 'exact', head: true }),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [{ count: newUsersCount }, { count: newPostsCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);
    setStats({
      users: usersCount || 0, posts: postsCount || 0, pending: pendingCount || 0,
      blocked: blockedRows?.length || 0, restricted: restrictedRows?.length || 0,
      crops: cropsCount || 0, newUsers: newUsersCount || 0, newPosts: newPostsCount || 0,
      soil: soilCount || 0, events: eventsCount || 0,
    });

    // REPORTS — pending with post + reporter + reported author
    const { data: reportData } = await supabase
      .from('post_reports').select('*')
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(50);
    if (reportData && reportData.length) {
      const postIds = [...new Set(reportData.map(r => r.reported_post_id))];
      const userIds = [...new Set([...reportData.map(r => r.reporter_id), ...reportData.map(r => r.reported_user_id)])];
      const [{ data: postRows }, { data: profRows }] = await Promise.all([
        supabase.from('posts').select('id, content, image_url').in('id', postIds),
        supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds),
      ]);
      const pmap = new Map(postRows?.map(p => [p.id, p]) || []);
      const umap = new Map(profRows?.map(p => [p.user_id, p]) || []);
      // Previous report count per reported user
      const reportedIds = [...new Set(reportData.map(r => r.reported_user_id))];
      const counts: Record<string, number> = {};
      for (const uid of reportedIds) {
        const { count } = await supabase.from('post_reports').select('*', { count: 'exact', head: true }).eq('reported_user_id', uid);
        counts[uid] = count || 0;
      }
      setReports(reportData.map(r => ({
        ...r,
        post: pmap.get(r.reported_post_id),
        reporter: umap.get(r.reporter_id),
        reported: umap.get(r.reported_user_id),
        reportCount: counts[r.reported_user_id] || 0,
      })));
    } else {
      setReports([]);
    }

    // USERS — join with user_status
    const { data: profileRows } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: statusRows } = await supabase.from('user_status').select('*');
    const statusMap = new Map(statusRows?.map(s => [s.user_id, s]) || []);
    // Counts
    const { data: postCountRows } = await supabase.from('posts').select('user_id');
    const postCounts: Record<string, number> = {};
    postCountRows?.forEach(p => { postCounts[p.user_id] = (postCounts[p.user_id] || 0) + 1; });
    const { data: reportedRows } = await supabase.from('post_reports').select('reported_user_id');
    const reportCounts: Record<string, number> = {};
    reportedRows?.forEach(r => { reportCounts[r.reported_user_id] = (reportCounts[r.reported_user_id] || 0) + 1; });
    const { data: cropRows } = await supabase.from('crop_history').select('user_id');
    const cropCounts: Record<string, number> = {};
    cropRows?.forEach(c => { cropCounts[c.user_id] = (cropCounts[c.user_id] || 0) + 1; });

    setUsers((profileRows || []).map(p => {
      const s = statusMap.get(p.user_id);
      return {
        ...p,
        status: s?.status || 'active',
        restricted_until: s?.restricted_until || null,
        postsCount: postCounts[p.user_id] || 0,
        reportsCount: reportCounts[p.user_id] || 0,
        cropsCount: cropCounts[p.user_id] || 0,
      };
    }));

    // POSTS
    const { data: postRows } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
    const postAuthorIds = [...new Set(postRows?.map(p => p.user_id) || [])];
    const { data: postAuthors } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', postAuthorIds);
    const authorMap = new Map(postAuthors?.map(p => [p.user_id, p]) || []);
    const { data: allReports } = await supabase.from('post_reports').select('reported_post_id');
    const postReportCounts: Record<string, number> = {};
    allReports?.forEach(r => { postReportCounts[r.reported_post_id] = (postReportCounts[r.reported_post_id] || 0) + 1; });
    setPosts((postRows || []).map(p => ({
      ...p,
      author: authorMap.get(p.user_id),
      reports: postReportCounts[p.id] || 0,
    })));

    // BROADCAST history
    const { data: bcRows } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(50);
    setBcHistory(bcRows || []);

    // BLOCKED & RESTRICTED
    const profileById = new Map((profileRows || []).map(p => [p.user_id, p]));
    setBlockedList((statusRows || []).filter(s => s.status === 'blocked').map(s => ({ ...s, profile: profileById.get(s.user_id) })));
    setRestrictedList((statusRows || []).filter(s => s.status === 'restricted').map(s => ({ ...s, profile: profileById.get(s.user_id) })));

    // ACTIVITY LOGS
    const { data: logRows } = await supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs(logRows || []);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [user]);

  // ---- Report actions ----
  const handleReport = async (r: ReportRow, action: 'dismiss' | 'delete' | 'warn' | 'restrict7' | 'block') => {
    if (!user) return;
    const targetEmail = null; // no easy email lookup from RLS
    if (action === 'dismiss') {
      await supabase.from('post_reports').update({ status: 'dismissed', resolved_at: new Date().toISOString(), admin_action: 'dismissed' }).eq('id', r.id);
      await logAdminAction(user.id, 'report_dismiss', r.reported_user_id, null, r.reason);
    } else if (action === 'delete') {
      await supabase.from('posts').delete().eq('id', r.reported_post_id);
      await supabase.from('post_reports').update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_action: 'post_deleted' }).eq('id', r.id);
      await logAdminAction(user.id, 'delete_post', r.reported_user_id, null, r.reason, { post_id: r.reported_post_id });
      await notifyUser({ userId: r.reported_user_id, userEmail: targetEmail, title: 'Agri360 Account Notice', message: `One of your posts was removed for: ${r.reason}.` });
    } else {
      await applyModeration({ adminId: user.id, targetUserId: r.reported_user_id, targetEmail, action, reason: r.reason });
      await supabase.from('post_reports').update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_action: action }).eq('id', r.id);
    }
    toast.success('Action applied');
    loadAll();
  };

  // ---- User actions ----
  const handleUserAction = async (u: UserRow, action: 'warn' | 'restrict7' | 'block' | 'unrestrict' | 'unblock' | 'delete') => {
    if (!user) return;
    if (action === 'delete') {
      await supabase.from('profiles').delete().eq('user_id', u.user_id);
      await logAdminAction(user.id, 'delete_account', u.user_id, u.email || null, 'Account deleted by admin');
      toast.success('Account deleted');
    } else {
      await applyModeration({ adminId: user.id, targetUserId: u.user_id, targetEmail: u.email || null, action });
      toast.success('Action applied');
    }
    loadAll();
  };

  // ---- Post actions ----
  const handleDeletePost = async (p: PostRow) => {
    if (!user) return;
    await supabase.from('posts').delete().eq('id', p.id);
    await logAdminAction(user.id, 'delete_post', p.user_id, null, 'Deleted from admin panel', { post_id: p.id });
    toast.success('Post deleted');
    loadAll();
  };

  // ---- Broadcast ----
  const sendBroadcast = async () => {
    if (!user || !bcTitle.trim() || !bcMessage.trim()) return;
    setBcSending(true);
    try {
      let recipients: { user_id: string }[] = [];
      if (bcTarget === 'all') {
        const { data } = await supabase.from('profiles').select('user_id');
        recipients = data || [];
      } else if (bcTarget === 'restricted' || bcTarget === 'blocked') {
        const { data } = await supabase.from('user_status').select('user_id').eq('status', bcTarget);
        recipients = data || [];
      } else if (bcTarget === 'email') {
        toast.info('Per-email targeting requires backend email lookup. Sent as broadcast log only.');
      }
      // Log broadcast
      await supabase.from('admin_notifications').insert({
        sent_by: user.id,
        sent_to: null,
        target_group: bcTarget,
        title: bcTitle,
        message: bcMessage,
      });
      // Create one in-app notification per recipient (batched)
      if (recipients.length) {
        const rows = recipients.map(r => ({
          user_id: r.user_id, type: 'gov_scheme',
          title: bcTitle, message: bcMessage, priority: 'normal', action_type: null,
        }));
        // Insert in chunks of 200
        for (let i = 0; i < rows.length; i += 200) {
          await supabase.from('smart_notifications').insert(rows.slice(i, i + 200));
        }
      }
      await logAdminAction(user.id, 'broadcast', null, null, `Broadcast to ${bcTarget}: ${bcTitle}`);
      toast.success(`Sent to ${recipients.length} user(s)`);
      setBcTitle(''); setBcMessage(''); loadAll();
    } catch (e) {
      console.error(e); toast.error('Broadcast failed');
    } finally {
      setBcSending(false);
    }
  };

  // ---- Computed ----
  const filteredUsers = useMemo(() => {
    let out = users;
    if (userFilter !== 'all') out = out.filter(u => (u.status || 'active') === userFilter);
    if (userSearch) {
      const q = userSearch.toLowerCase();
      out = out.filter(u => u.username?.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    }
    if (userSort === 'reports') out = [...out].sort((a, b) => (b.reportsCount || 0) - (a.reportsCount || 0));
    else if (userSort === 'posts') out = [...out].sort((a, b) => (b.postsCount || 0) - (a.postsCount || 0));
    return out.slice(0, 100);
  }, [users, userFilter, userSearch, userSort]);

  const filteredPosts = useMemo(() => {
    let out = posts;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (postFilter === 'reported' || postFilter === 'flagged') out = out.filter(p => (p.reports || 0) > 0);
    else if (postFilter === 'today') out = out.filter(p => new Date(p.created_at) >= today);
    else if (postFilter === 'media') out = out.filter(p => !!p.image_url);
    return out.slice(0, 100);
  }, [posts, postFilter]);

  const filteredLogs = useMemo(() =>
    logFilter ? logs.filter(l => l.action_type.includes(logFilter)) : logs,
  [logs, logFilter]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      warned: 'bg-amber-100 text-amber-700',
      restricted: 'bg-orange-100 text-orange-700',
      blocked: 'bg-red-100 text-red-700',
    };
    return <Badge className={map[s] || ''}>{s}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Signed in as {profile?.username}</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="reports"><AlertTriangle className="h-4 w-4 mr-1" />Reports {stats.pending > 0 && <Badge className="ml-1 bg-red-500">{stats.pending}</Badge>}</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="posts"><FileText className="h-4 w-4 mr-1" />Posts</TabsTrigger>
            <TabsTrigger value="broadcast"><Megaphone className="h-4 w-4 mr-1" />Broadcast</TabsTrigger>
            <TabsTrigger value="blocked"><Lock className="h-4 w-4 mr-1" />Blocked</TabsTrigger>
            <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-1" />Logs</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total Users', value: stats.users, icon: Users },
                { label: 'Total Posts', value: stats.posts, icon: FileText },
                { label: 'Pending Reports', value: stats.pending, icon: AlertTriangle, danger: stats.pending > 0 },
                { label: 'Blocked', value: stats.blocked, icon: UserX },
                { label: 'Restricted', value: stats.restricted, icon: Lock },
                { label: 'Active Crops', value: stats.crops, icon: BarChart3 },
                { label: 'New Users Today', value: stats.newUsers, icon: Users },
                { label: 'New Posts Today', value: stats.newPosts, icon: FileText },
                { label: 'Soil Reports', value: stats.soil, icon: FileText },
                { label: 'Calendar Events', value: stats.events, icon: Activity },
              ].map((s) => (
                <Card key={s.label} className={s.danger ? 'border-red-500 bg-red-50' : ''}>
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 mb-2 ${s.danger ? 'text-red-600' : 'text-primary'}`} />
                    <div className={`text-2xl font-bold ${s.danger ? 'text-red-600' : ''}`}>{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* REPORTS */}
          <TabsContent value="reports">
            <Card>
              <CardHeader><CardTitle>Pending Reports ({reports.length})</CardTitle></CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No pending reports</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <Card key={r.id} className="border-amber-200">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{r.post?.content?.slice(0, 200) || '(post deleted)'}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Reason: <strong>{r.reason}</strong> • {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Reporter: {r.reporter?.username || '—'} • Reported user: {r.reported?.username || '—'} • Prior reports: {r.reportCount}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleReport(r, 'dismiss')}>Dismiss</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReport(r, 'delete')}>Delete Post</Button>
                            <Button size="sm" variant="outline" onClick={() => handleReport(r, 'warn')}>Warn User</Button>
                            <Button size="sm" variant="outline" className="text-amber-700 border-amber-300" onClick={() => handleReport(r, 'restrict7')}>Restrict 7d</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReport(r, 'block')}>Block Permanently</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management ({filteredUsers.length})</CardTitle>
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or email" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={userFilter} onValueChange={(v) => setUserFilter(v as any)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="warned">Warned</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userSort} onValueChange={(v) => setUserSort(v as any)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Sort: Join date</SelectItem>
                      <SelectItem value="reports">Sort: Reports</SelectItem>
                      <SelectItem value="posts">Sort: Posts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Crops</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                            <div>
                              <div className="text-sm font-medium">{u.username}</div>
                              {u.is_admin && <Badge variant="outline" className="text-xs">admin</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{u.phone || '—'}</TableCell>
                        <TableCell className="text-xs">{u.location || '—'}</TableCell>
                        <TableCell className="text-xs">{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{u.postsCount}</TableCell>
                        <TableCell className={u.reportsCount! > 0 ? 'text-red-600 font-medium' : ''}>{u.reportsCount}</TableCell>
                        <TableCell>{u.cropsCount}</TableCell>
                        <TableCell>{statusBadge(u.status || 'active')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleUserAction(u, 'warn')} title="Warn">⚠️</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleUserAction(u, 'restrict7')} title="Restrict 7d">⏳</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleUserAction(u, 'block')} title="Block">🚫</Button>
                            {u.status === 'restricted' && <Button size="sm" variant="ghost" onClick={() => handleUserAction(u, 'unrestrict')} title="Unrestrict">✓</Button>}
                            {u.status === 'blocked' && <Button size="sm" variant="ghost" onClick={() => handleUserAction(u, 'unblock')} title="Unblock">✓</Button>}
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive">🗑</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                                  <AlertDialogDescription>This removes their profile permanently. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUserAction(u, 'delete')} className="bg-destructive">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* POSTS */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>All Posts ({filteredPosts.length})</CardTitle>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(['all', 'reported', 'today', 'flagged', 'media'] as const).map(f => (
                    <Button key={f} size="sm" variant={postFilter === f ? 'default' : 'outline'} onClick={() => setPostFilter(f)} className="capitalize">{f}</Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredPosts.map(p => (
                    <Card key={p.id} className={p.reports! > 0 ? 'border-amber-300' : ''}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <img src={p.author?.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{p.author?.username || '—'}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                            {p.reports! > 0 && <Badge className="bg-red-100 text-red-700">{p.reports} reports</Badge>}
                            {p.image_url && <Badge variant="outline">media</Badge>}
                          </div>
                          <p className="text-sm mt-1 line-clamp-2">{p.content}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePost(p)} className="bg-destructive">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BROADCAST */}
          <TabsContent value="broadcast">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Send Notification</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1"><Label>Title</Label><Input value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Message</Label><Textarea value={bcMessage} onChange={(e) => setBcMessage(e.target.value)} rows={4} /></div>
                  <div className="space-y-1">
                    <Label>Target</Label>
                    <Select value={bcTarget} onValueChange={(v) => setBcTarget(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        <SelectItem value="restricted">Restricted users</SelectItem>
                        <SelectItem value="blocked">Blocked users</SelectItem>
                        <SelectItem value="email">Specific email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bcTarget === 'email' && (
                    <div className="space-y-1"><Label>Email</Label><Input type="email" value={bcEmail} onChange={(e) => setBcEmail(e.target.value)} /></div>
                  )}
                  <Button onClick={sendBroadcast} disabled={bcSending || !bcTitle.trim() || !bcMessage.trim()} className="w-full">
                    {bcSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Send
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>History</CardTitle></CardHeader>
                <CardContent className="max-h-[480px] overflow-y-auto space-y-2">
                  {bcHistory.length === 0 ? <p className="text-sm text-muted-foreground">No broadcasts yet</p> :
                    bcHistory.map(b => (
                      <div key={b.id} className="p-2 border rounded text-xs">
                        <div className="flex items-center justify-between"><strong>{b.title}</strong><Badge variant="outline">{b.target_group || 'user'}</Badge></div>
                        <div className="text-muted-foreground line-clamp-2 mt-1">{b.message}</div>
                        <div className="text-muted-foreground/70 mt-1">{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* BLOCKED / RESTRICTED */}
          <TabsContent value="blocked">
            <Tabs defaultValue="blocked">
              <TabsList>
                <TabsTrigger value="blocked">Blocked ({blockedList.length})</TabsTrigger>
                <TabsTrigger value="restricted">Restricted ({restrictedList.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="blocked">
                <Card><CardContent className="p-3 space-y-2">
                  {blockedList.length === 0 ? <p className="text-sm text-muted-foreground p-4">No blocked users</p> :
                    blockedList.map(b => (
                      <div key={b.user_id} className="flex items-center gap-2 p-2 border rounded">
                        <img src={b.profile?.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{b.profile?.username || b.user_id}</div>
                          <div className="text-xs text-muted-foreground">{b.reason || 'No reason'} • {formatDistanceToNow(new Date(b.updated_at), { addSuffix: true })}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleUserAction({ user_id: b.user_id, username: b.profile?.username || '', avatar_url: '', location: null, phone: null, created_at: '', is_admin: false } as UserRow, 'unblock')}>Unblock</Button>
                      </div>
                    ))}
                </CardContent></Card>
              </TabsContent>
              <TabsContent value="restricted">
                <Card><CardContent className="p-3 space-y-2">
                  {restrictedList.length === 0 ? <p className="text-sm text-muted-foreground p-4">No restricted users</p> :
                    restrictedList.map(b => {
                      const ru = b.restricted_until ? new Date(b.restricted_until) : null;
                      const daysLeft = ru ? Math.max(0, Math.ceil((ru.getTime() - Date.now()) / 86400000)) : 0;
                      return (
                        <div key={b.user_id} className="flex items-center gap-2 p-2 border rounded">
                          <img src={b.profile?.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{b.profile?.username || b.user_id}</div>
                            <div className="text-xs text-muted-foreground">{b.reason || 'No reason'} • {daysLeft}d left</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleUserAction({ user_id: b.user_id, username: b.profile?.username || '', avatar_url: '', location: null, phone: null, created_at: '', is_admin: false } as UserRow, 'unrestrict')}>Unrestrict</Button>
                        </div>
                      );
                    })}
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* LOGS */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <Input placeholder="Filter by action type" value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className="mt-3 max-w-sm" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(l => (
                      <TableRow key={l.id}>
                        <TableCell><Badge variant="outline">{l.action_type}</Badge></TableCell>
                        <TableCell className="text-xs">{l.target_user_email || l.target_user_id?.slice(0, 8) || '—'}</TableCell>
                        <TableCell className="text-xs">{l.reason || '—'}</TableCell>
                        <TableCell className="text-xs">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
