import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Heart, MessageCircle, Bookmark, Loader2, BookmarkX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(null);

  useEffect(() => {
    if (user) fetchSavedPosts();
  }, [user]);

  const fetchSavedPosts = async () => {
    if (!user) return;
    const { data: savedData } = await supabase
      .from('saved_posts').select('post_id').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!savedData || savedData.length === 0) { setPosts([]); setLoading(false); return; }

    const postIds = savedData.map(s => s.post_id);
    const { data: postsData } = await supabase.from('posts').select('*').in('id', postIds);
    if (!postsData) { setPosts([]); setLoading(false); return; }

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url, location').in('user_id', userIds);
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
    setSelectedPost(null);
    toast.success(language === 'hi' ? 'हटाया गया' : language === 'mr' ? 'काढले' : 'Removed from saved');
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
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <div key={post.id} className="relative group cursor-pointer" onClick={() => setSelectedPost(post)}>
            <AspectRatio ratio={1}>
              {post.image_url ? (
                <img src={post.image_url} alt="Post" className="w-full h-full object-cover rounded-sm" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center rounded-sm p-2">
                  <p className="text-xs text-muted-foreground line-clamp-4 text-center">{post.content}</p>
                </div>
              )}
            </AspectRatio>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-sm">
              <span className="text-white text-sm flex items-center gap-1"><Heart className="h-4 w-4 fill-white" />{post.likes_count}</span>
              <span className="text-white text-sm flex items-center gap-1"><MessageCircle className="h-4 w-4 fill-white" />{post.comments_count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-md">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedPost.profile?.avatar_url} />
                    <AvatarFallback>{selectedPost.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-sm">{selectedPost.profile?.username}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              </DialogHeader>
              {selectedPost.image_url && (
                <AspectRatio ratio={1}><img src={selectedPost.image_url} alt="Post" className="w-full h-full object-cover rounded-lg" /></AspectRatio>
              )}
              <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-4">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Heart className="h-4 w-4" />{selectedPost.likes_count}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><MessageCircle className="h-4 w-4" />{selectedPost.comments_count}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => unsavePost(selectedPost.id)}>
                  <BookmarkX className="h-4 w-4 mr-1" />
                  {language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढा' : 'Unsave'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
