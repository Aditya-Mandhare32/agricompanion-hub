import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart, MessageCircle, Bookmark, Share2, Loader2, BookmarkX, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PostProfile {
  username: string;
  avatar_url: string;
  location: string | null;
}

interface SavedPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profile: PostProfile | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

interface SavedPostsProps {
  onNavigateToMessages?: (userId: string) => void;
}

export function SavedPosts({ onNavigateToMessages }: SavedPostsProps) {
  const { user } = useAuth();
  const { language } = useApp();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSavedPosts();
  }, [user]);

  const fetchSavedPosts = async () => {
    if (!user) return;
    const { data: savedData } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!savedData || savedData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const postIds = savedData.map(s => s.post_id);
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds);

    if (!postsData) { setPosts([]); setLoading(false); return; }

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles')
      .select('user_id, username, avatar_url, location').in('user_id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id);
    const likedIds = new Set(likes?.map(l => l.post_id) || []);

    const enriched = await Promise.all(postsData.map(async (post) => {
      const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      ]);
      const p = profileMap.get(post.user_id);
      return {
        ...post,
        profile: p ? { username: p.username, avatar_url: p.avatar_url, location: p.location } : null,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        is_liked: likedIds.has(post.id),
      };
    }));

    setPosts(enriched);
    setLoading(false);
  };

  const unsavePost = async (postId: string) => {
    if (!user) return;
    await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success(language === 'hi' ? 'हटाया गया' : language === 'mr' ? 'काढले' : 'Removed from saved');
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    else await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    fetchSavedPosts();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <Bookmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {language === 'hi' ? 'कोई सहेजी हुई पोस्ट नहीं' : language === 'mr' ? 'कोणतीही जतन केलेली पोस्ट नाही' : 'No saved posts'}
        </h3>
        <p className="text-muted-foreground">
          {language === 'hi' ? 'पोस्ट पर बुकमार्क आइकन दबाएं' : language === 'mr' ? 'पोस्टवर बुकमार्क आयकॉन दाबा' : 'Tap the bookmark icon on posts to save them'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            {post.image_url && <img src={post.image_url} alt="Post" className="mt-3 rounded-lg w-full object-cover max-h-96" />}
          </CardContent>
          <CardFooter className="px-4 py-3 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className={`gap-2 ${post.is_liked ? 'text-red-500' : ''}`} onClick={() => toggleLike(post.id, post.is_liked)}>
                  <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} /><span className="text-sm">{post.likes_count}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="h-5 w-5" /><span className="text-sm">{post.comments_count}</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => unsavePost(post.id)}>
                <BookmarkX className="h-5 w-5 mr-1" />
                {language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढा' : 'Unsave'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
