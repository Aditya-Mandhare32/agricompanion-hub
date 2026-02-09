import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Heart, MessageCircle, Loader2, Trash2, Pencil, UserCircle, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PostProfile {
  username: string;
  avatar_url: string;
  location: string | null;
}

interface MyPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profile: PostProfile | null;
  likes_count: number;
  comments_count: number;
}

export function MyPosts() {
  const { user, profile } = useAuth();
  const { language } = useApp();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<MyPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchMyPosts();
  }, [user]);

  const fetchMyPosts = async () => {
    if (!user) return;
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!postsData) { setPosts([]); setLoading(false); return; }

    const enriched = await Promise.all(postsData.map(async (post) => {
      const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      ]);
      return {
        ...post,
        profile: profile ? { username: profile.username, avatar_url: profile.avatar_url, location: profile.location } : null,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
      };
    }));

    setPosts(enriched);
    setLoading(false);
  };

  const deletePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post?.image_url) {
      const urlParts = post.image_url.split('/community-images/');
      if (urlParts.length >= 2) await supabase.storage.from('community-images').remove([urlParts[1]]);
    }
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) toast.error('Failed to delete');
    else {
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success(language === 'hi' ? 'पोस्ट हटाई गई' : language === 'mr' ? 'पोस्ट हटवली' : 'Post deleted');
    }
  };

  const startEdit = (post: MyPost) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const saveEdit = async () => {
    if (!editingPost || !editContent.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('posts').update({ content: editContent.trim() }).eq('id', editingPost.id);
    if (error) toast.error('Failed to update');
    else {
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editContent.trim() } : p));
      toast.success(language === 'hi' ? 'पोस्ट अपडेट हुई' : language === 'mr' ? 'पोस्ट अपडेट झाली' : 'Post updated');
      setEditingPost(null);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <UserCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {language === 'hi' ? 'अभी कोई पोस्ट नहीं' : language === 'mr' ? 'अद्याप कोणतीही पोस्ट नाही' : 'No posts yet'}
        </h3>
        <p className="text-muted-foreground">
          {language === 'hi' ? 'फ़ीड टैब से पोस्ट करें' : language === 'mr' ? 'फीड टॅबवरून पोस्ट करा' : 'Create posts from the Feed tab'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {language === 'hi' ? `${posts.length} पोस्ट` : language === 'mr' ? `${posts.length} पोस्ट` : `${posts.length} posts`}
        </p>
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="flex-row items-start gap-3 p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profile?.avatar_url} />
                <AvatarFallback>{post.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{post.profile?.username}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
                {post.profile?.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{post.profile.location}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(post)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePost(post.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="Post" className="mt-3 rounded-lg w-full object-cover max-h-96" />}
            </CardContent>
            <CardFooter className="px-4 py-3 border-t">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" /> {post.likes_count}
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" /> {post.comments_count}
                </span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'hi' ? 'पोस्ट संपादित करें' : language === 'mr' ? 'पोस्ट संपादित करा' : 'Edit Post'}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              {language === 'hi' ? 'रद्द' : language === 'mr' ? 'रद्द' : 'Cancel'}
            </Button>
            <Button onClick={saveEdit} disabled={saving || !editContent.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {language === 'hi' ? 'सहेजें' : language === 'mr' ? 'जतन करा' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
