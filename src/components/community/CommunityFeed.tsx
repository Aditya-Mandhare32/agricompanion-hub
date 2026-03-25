import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  Image as ImageIcon, Send, Loader2, Trash2, Users,
  HelpCircle, Filter, Search, X, ChevronDown, ChevronUp, MapPin,
  Plus, Video, UserCircle, Download
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface PostProfile {
  username: string;
  avatar_url: string;
  location: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: PostProfile;
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
  comments: Comment[];
}

interface CommunityFeedProps {
  onNavigateToMessages?: (userId: string) => void;
}

export function CommunityFeed({ onNavigateToMessages }: CommunityFeedProps) {
  const { user, profile } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const postFormRef = useRef<HTMLDivElement>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<'feed' | 'questions'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPosts();
      const channel = supabase
        .channel('posts_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  // Show FAB when scrolled past post form
  useEffect(() => {
    const handleScroll = () => {
      if (postFormRef.current) {
        const rect = postFormRef.current.getBoundingClientRect();
        setShowFab(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPosts = async () => {
    if (!user) return;
    const { data: postsData, error } = await supabase
      .from('posts').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching posts:', error); return; }

    const userIds = [...new Set((postsData || []).map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles')
      .select('user_id, username, avatar_url, location').in('user_id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const [{ data: likes }, { data: saves }] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', user.id),
      supabase.from('saved_posts').select('post_id').eq('user_id', user.id),
    ]);
    const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
    const savedPostIds = new Set(saves?.map(s => s.post_id) || []);

    const postsWithCounts = await Promise.all(
      (postsData || []).map(async (post) => {
        const [{ count: likesCount }, { data: commentsData }] = await Promise.all([
          supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('post_comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true }),
        ]);
        const commentUserIds = [...new Set((commentsData || []).map(c => c.user_id))];
        let commentProfileMap = new Map<string, any>();
        if (commentUserIds.length > 0) {
          const { data: commentProfiles } = await supabase.from('profiles')
            .select('user_id, username, avatar_url, location').in('user_id', commentUserIds);
          commentProfileMap = new Map(commentProfiles?.map(p => [p.user_id, p]) || []);
        }
        const postProfile = profileMap.get(post.user_id);

        return {
          ...post,
          profile: postProfile ? { username: postProfile.username, avatar_url: postProfile.avatar_url, location: postProfile.location } : null,
          likes_count: likesCount || 0,
          comments_count: (commentsData || []).length,
          is_liked: likedPostIds.has(post.id),
          is_saved: savedPostIds.has(post.id),
          comments: (commentsData || []).map(c => ({
            ...c,
            profile: commentProfileMap.get(c.user_id) ? {
              username: commentProfileMap.get(c.user_id)!.username,
              avatar_url: commentProfileMap.get(c.user_id)!.avatar_url,
              location: commentProfileMap.get(c.user_id)!.location,
            } : undefined,
          })),
        };
      })
    );
    setPosts(postsWithCounts);
    setLoading(false);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { toast.error('Please select an image or video'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be less than 50MB'); return; }
    setSelectedMedia(file);
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeSelectedMedia = () => { setSelectedMedia(null); setMediaPreview(null); };

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('community-images').upload(fileName, file);
    if (uploadError) { console.error('Upload error:', uploadError); return null; }
    const { data } = supabase.storage.from('community-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const createPost = async () => {
    if (!newPost.trim() || !user || !profile) return;
    setIsPosting(true);
    let mediaUrl: string | null = null;
    if (selectedMedia) {
      setIsUploadingMedia(true);
      mediaUrl = await uploadMedia(selectedMedia);
      setIsUploadingMedia(false);
      if (!mediaUrl && selectedMedia) { toast.error('Failed to upload media'); setIsPosting(false); return; }
    }
    const content = isAskingQuestion ? `❓ ${newPost.trim()}` : newPost.trim();
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content, image_url: mediaUrl });
    if (error) { toast.error('Failed to create post'); }
    else { setNewPost(''); setIsAskingQuestion(false); setSelectedMedia(null); setMediaPreview(null); toast.success(isAskingQuestion ? 'Question posted!' : 'Post created!'); }
    setIsPosting(false);
  };

  const deletePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post?.image_url) {
      const urlParts = post.image_url.split('/community-images/');
      if (urlParts.length >= 2) await supabase.storage.from('community-images').remove([urlParts[1]]);
    }
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) toast.error('Failed to delete post');
    else toast.success('Post deleted');
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    if (isLiked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    else await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    fetchPosts();
  };

  const toggleSave = async (postId: string, isSaved: boolean) => {
    if (!user) return;
    if (isSaved) { await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id); toast.success('Removed from saved'); }
    else { await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id }); toast.success('Post saved!'); }
    fetchPosts();
  };

  const addComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;
    setPostingComment(postId);
    const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, content: commentInputs[postId].trim() });
    if (error) toast.error('Failed to add comment');
    else { setCommentInputs({ ...commentInputs, [postId]: '' }); fetchPosts(); }
    setPostingComment(null);
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) newExpanded.delete(postId);
    else newExpanded.add(postId);
    setExpandedComments(newExpanded);
  };

  const startMessage = (userId: string) => {
    if (onNavigateToMessages) onNavigateToMessages(userId);
    else navigate(`/messages?user=${userId}`);
  };

  const scrollToPostForm = () => {
    postFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const textarea = postFormRef.current?.querySelector('textarea');
      textarea?.focus();
    }, 500);
  };

  const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

  const filteredPosts = posts.filter(post => {
    if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (feedFilter === 'questions' && !post.content.startsWith('❓')) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-2 mb-3">
          <Button variant={feedFilter === 'feed' ? 'default' : 'outline'} size="sm" onClick={() => setFeedFilter('feed')} className="gap-1">
            <Users className="h-4 w-4" />{language === 'hi' ? 'फ़ीड' : language === 'mr' ? 'फीड' : 'Feed'}
          </Button>
          <Button variant={feedFilter === 'questions' ? 'default' : 'outline'} size="sm" onClick={() => setFeedFilter('questions')} className="gap-1">
            <HelpCircle className="h-4 w-4" />{language === 'hi' ? 'सवाल' : language === 'mr' ? 'प्रश्न' : 'Questions'}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={language === 'hi' ? 'खोजें...' : language === 'mr' ? 'शोधा...' : 'Search posts...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          {searchQuery && <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery('')}><X className="h-3 w-3" /></Button>}
        </div>
      </Card>

      {/* Create Post */}
      <Card ref={postFormRef}>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={isAskingQuestion
                  ? (language === 'hi' ? 'अपना सवाल पूछें...' : language === 'mr' ? 'तुमचा प्रश्न विचारा...' : 'Ask your question...')
                  : (language === 'hi' ? 'अपना अनुभव साझा करें...' : language === 'mr' ? 'तुमचा अनुभव शेअर करा...' : 'Share your farming tips or questions...')}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
              />
              {mediaPreview && (
                <div className="relative mt-3 inline-block">
                  {selectedMedia?.type.startsWith('video/') ? (
                    <video src={mediaPreview} className="max-h-40 rounded-lg border" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="max-h-40 rounded-lg border" />
                  )}
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeSelectedMedia}><X className="h-3 w-3" /></Button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex gap-2">
                  <input type="file" id="post-media-input" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" />
                  <Button variant="ghost" size="sm" className={selectedMedia ? 'text-primary' : 'text-muted-foreground'} onClick={() => document.getElementById('post-media-input')?.click()}>
                    <ImageIcon className="h-5 w-5 mr-1" />
                    {language === 'hi' ? 'फोटो' : language === 'mr' ? 'फोटो' : 'Photo'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { const input = document.getElementById('post-media-input') as HTMLInputElement; if (input) { input.accept = 'video/*'; input.click(); input.accept = 'image/*,video/*'; } }}>
                    <Video className="h-5 w-5 mr-1" />
                    {language === 'hi' ? 'वीडियो' : language === 'mr' ? 'व्हिडिओ' : 'Video'}
                  </Button>
                  <Button variant={isAskingQuestion ? 'secondary' : 'ghost'} size="sm" onClick={() => setIsAskingQuestion(!isAskingQuestion)} className={isAskingQuestion ? 'bg-amber-100 text-amber-700' : 'text-muted-foreground'}>
                    <HelpCircle className="h-5 w-5 mr-1" />
                    {language === 'hi' ? 'सवाल' : language === 'mr' ? 'प्रश्न' : 'Question'}
                  </Button>
                </div>
                <Button onClick={createPost} disabled={!newPost.trim() || isPosting || isUploadingMedia} size="sm" className="bg-primary">
                  {isPosting || isUploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  {language === 'hi' ? 'पोस्ट' : language === 'mr' ? 'पोस्ट' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{language === 'hi' ? 'मदद चाहिए?' : language === 'mr' ? 'मदत हवी?' : 'Need Help?'}</h3>
              <p className="text-xs text-muted-foreground">{language === 'hi' ? 'समुदाय से सवाल पूछें या AI सहायक से बात करें' : language === 'mr' ? 'समुदायाला प्रश्न विचारा किंवा AI सहाय्यकाशी बोला' : 'Ask the community or talk to AI assistant'}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setIsAskingQuestion(true); scrollToPostForm(); }}>
              <HelpCircle className="h-4 w-4 mr-1" />{language === 'hi' ? 'पूछें' : language === 'mr' ? 'विचारा' : 'Ask'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
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
                  {post.content.startsWith('❓') && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Question</Badge>}
                </div>
                {post.profile?.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{post.profile.location}</p>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {post.user_id === user?.id && (
                    <><DropdownMenuItem onClick={() => deletePost(post.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem><DropdownMenuSeparator /></>
                  )}
                  {post.user_id !== user?.id && (
                    <>
                      <DropdownMenuItem onClick={() => startMessage(post.user_id)}><MessageCircle className="h-4 w-4 mr-2" />Message</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/profile?user=${post.user_id}`)}><UserCircle className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
                    </>
                  )}
                  {post.image_url && (
                    <DropdownMenuItem onClick={async () => {
                      try {
                        const resp = await fetch(post.image_url!);
                        const blob = await resp.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `agri360-post-${post.id}.${post.image_url!.split('.').pop()?.split('?')[0] || 'jpg'}`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Download started!');
                      } catch { toast.error('Download failed'); }
                    }}><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                <div className="mt-3">
                  <AspectRatio ratio={4/3}>
                    {isVideoUrl(post.image_url) ? (
                      <video src={post.image_url} controls className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <img src={post.image_url} alt="Post" className="w-full h-full object-cover rounded-lg" />
                    )}
                  </AspectRatio>
                </div>
              )}
            </CardContent>
            <CardFooter className="px-4 py-3 border-t flex flex-col items-stretch">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className={`gap-1 ${post.is_liked ? 'text-red-500' : ''}`} onClick={() => toggleLike(post.id, post.is_liked)}>
                    <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} /><span className="text-sm">{post.likes_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => toggleComments(post.id)}>
                    <MessageCircle className="h-5 w-5" /><span className="text-sm">{post.comments_count}</span>
                    {expandedComments.has(post.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="sm"><Share2 className="h-5 w-5" /></Button>
                </div>
                <Button variant="ghost" size="sm" className={post.is_saved ? 'text-primary' : ''} onClick={() => toggleSave(post.id, post.is_saved)}>
                  <Bookmark className={`h-5 w-5 ${post.is_saved ? 'fill-current' : ''}`} />
                </Button>
              </div>
              <Collapsible open={expandedComments.has(post.id)}>
                <CollapsibleContent className="mt-4 pt-4 border-t">
                  <div className="space-y-3 mb-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={comment.profile?.avatar_url} /><AvatarFallback className="text-xs">{comment.profile?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 bg-muted rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs">{comment.profile?.username}</span>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {post.comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>}
                  </div>
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8"><AvatarImage src={profile?.avatar_url} /><AvatarFallback className="text-xs">{profile?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder={language === 'hi' ? 'टिप्पणी लिखें...' : language === 'mr' ? 'टिप्पणी लिहा...' : 'Write a comment...'}
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" className="h-8" onClick={() => addComment(post.id)} disabled={!commentInputs[post.id]?.trim() || postingComment === post.id}>
                        {postingComment === post.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardFooter>
          </Card>
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {feedFilter === 'questions' ? 'No questions yet' : 'No posts yet'}
            </h3>
            <p className="text-muted-foreground">Be the first to share something!</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {showFab && (
        <button
          onClick={scrollToPostForm}
          className="fixed bottom-36 md:bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
