import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  Loader2,
  Trash2,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface PostProfile {
  username: string;
  avatar_url: string;
  location: string | null;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profile: PostProfile | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

export default function Community() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPosts();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('posts_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;

    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    // Fetch profiles separately
    const userIds = [...new Set((postsData || []).map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url, location')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get likes and saves for current user
    const [{ data: likes }, { data: saves }] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', user.id),
      supabase.from('saved_posts').select('post_id').eq('user_id', user.id),
    ]);

    const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
    const savedPostIds = new Set(saves?.map(s => s.post_id) || []);

    // Get counts
    const postsWithCounts = await Promise.all(
      (postsData || []).map(async (post) => {
        const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
          supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        ]);

        const postProfile = profileMap.get(post.user_id);

        return {
          ...post,
          profile: postProfile ? {
            username: postProfile.username,
            avatar_url: postProfile.avatar_url,
            location: postProfile.location,
          } : null,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: likedPostIds.has(post.id),
          is_saved: savedPostIds.has(post.id),
        };
      })
    );

    setPosts(postsWithCounts);
    setLoading(false);
  };

  const createPost = async () => {
    if (!newPost.trim() || !user || !profile) return;

    setIsPosting(true);
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: newPost.trim(),
      });

    if (error) {
      toast.error('Failed to create post');
    } else {
      setNewPost('');
      toast.success('Post created!');
    }
    setIsPosting(false);
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }
    fetchPosts();
  };

  const toggleSave = async (postId: string, isSaved: boolean) => {
    if (!user) return;

    if (isSaved) {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
      toast.success('Removed from saved');
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
      toast.success('Post saved!');
    }
    fetchPosts();
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast.error('Failed to delete post');
    } else {
      toast.success('Post deleted');
    }
  };

  const startMessage = (userId: string) => {
    navigate(`/messages?user=${userId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-muted-foreground">Share your farming experiences</p>
        </div>

        {/* Create Post */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your farming tips, experiences, or questions..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Photo
                  </Button>
                  <Button 
                    onClick={createPost}
                    disabled={!newPost.trim() || isPosting}
                    size="sm"
                    className="bg-primary"
                  >
                    {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
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
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {post.profile?.location && (
                    <p className="text-xs text-muted-foreground">{post.profile.location}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {post.user_id === user?.id && (
                      <>
                        <DropdownMenuItem onClick={() => deletePost(post.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    {post.user_id !== user?.id && (
                      <DropdownMenuItem onClick={() => startMessage(post.user_id)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="px-4 pb-3">
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt="Post" 
                    className="mt-3 rounded-lg w-full object-cover max-h-96"
                  />
                )}
              </CardContent>

              <CardFooter className="px-4 py-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 ${post.is_liked ? 'text-red-500' : ''}`}
                    onClick={() => toggleLike(post.id, post.is_liked)}
                  >
                    <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{post.likes_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">{post.comments_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={post.is_saved ? 'text-primary' : ''}
                  onClick={() => toggleSave(post.id, post.is_saved)}
                >
                  <Bookmark className={`h-5 w-5 ${post.is_saved ? 'fill-current' : ''}`} />
                </Button>
              </CardFooter>
            </Card>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
