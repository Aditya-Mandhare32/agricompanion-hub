import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Users,
  TrendingUp,
  HelpCircle,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  LogIn
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';

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

const cropCategories = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Vegetables', 'Fruits', 'Pulses'];
const issueTypes = ['Pests', 'Disease', 'Irrigation', 'Fertilizer', 'Weather', 'Market', 'General'];
const regions = ['Maharashtra', 'Punjab', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'UP', 'MP'];

const trendingTopics = [
  { tag: '#RabiSeason', posts: 234 },
  { tag: '#OrganicFarming', posts: 189 },
  { tag: '#DroughtAlert', posts: 156 },
  { tag: '#CottonPrices', posts: 143 },
  { tag: '#NewVarieties', posts: 98 },
];

export default function Community() {
  const { user, profile, loading: authLoading } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate, location.pathname]);

  useEffect(() => {
    if (user) {
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
    }
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

    // Get counts and comments
    const postsWithCounts = await Promise.all(
      (postsData || []).map(async (post) => {
        const [{ count: likesCount }, { data: commentsData }] = await Promise.all([
          supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('post_comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true }),
        ]);

        // Fetch comment profiles
        const commentUserIds = [...new Set((commentsData || []).map(c => c.user_id))];
        const { data: commentProfiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url, location')
          .in('user_id', commentUserIds);

        const commentProfileMap = new Map(commentProfiles?.map(p => [p.user_id, p]) || []);

        const postProfile = profileMap.get(post.user_id);

        return {
          ...post,
          profile: postProfile ? {
            username: postProfile.username,
            avatar_url: postProfile.avatar_url,
            location: postProfile.location,
          } : null,
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

  const createPost = async () => {
    if (!newPost.trim() || !user || !profile) return;

    setIsPosting(true);
    
    const content = isAskingQuestion ? `❓ ${newPost.trim()}` : newPost.trim();
    
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
      });

    if (error) {
      toast.error('Failed to create post');
    } else {
      setNewPost('');
      setIsAskingQuestion(false);
      toast.success(isAskingQuestion ? 'Question posted!' : 'Post created!');
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

  const addComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    setPostingComment(postId);
    
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: commentInputs[postId].trim(),
    });

    if (error) {
      toast.error('Failed to add comment');
    } else {
      setCommentInputs({ ...commentInputs, [postId]: '' });
      fetchPosts();
    }
    setPostingComment(null);
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const startMessage = (userId: string) => {
    navigate(`/messages?user=${userId}`);
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!post.content.toLowerCase().includes(query)) return false;
    }
    if (activeTab === 'questions') {
      if (!post.content.startsWith('❓')) return false;
    }
    return true;
  });

  // Show loading state
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {language === 'hi' ? 'लॉगिन आवश्यक' : language === 'mr' ? 'लॉगिन आवश्यक' : 'Login Required'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {language === 'hi' ? 'समुदाय में शामिल होने के लिए लॉगिन करें' : 
             language === 'mr' ? 'समुदायात सामील होण्यासाठी लॉगिन करा' : 
             'Please login to join the community'}
          </p>
          <Button onClick={() => navigate('/login')}>
            <LogIn className="h-4 w-4 mr-2" />
            {language === 'hi' ? 'लॉगिन' : language === 'mr' ? 'लॉगिन' : 'Login'}
          </Button>
        </div>
      </Layout>
    );
  }

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
      <div className="container max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header with Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {language === 'hi' ? 'किसान समुदाय' : language === 'mr' ? 'शेतकरी समुदाय' : 'Farmer Community'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'hi' ? 'अपने अनुभव साझा करें और सीखें' : 
                   language === 'mr' ? 'तुमचे अनुभव शेअर करा आणि शिका' : 
                   'Share your experiences and learn from others'}
                </p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="feed" className="gap-1">
                    <Users className="h-4 w-4" />
                    {language === 'hi' ? 'फ़ीड' : language === 'mr' ? 'फीड' : 'Feed'}
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="gap-1">
                    <HelpCircle className="h-4 w-4" />
                    {language === 'hi' ? 'सवाल' : language === 'mr' ? 'प्रश्न' : 'Questions'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'hi' ? 'खोजें...' : language === 'mr' ? 'शोधा...' : 'Search posts...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-primary/10' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {language === 'hi' ? 'फ़िल्टर' : language === 'mr' ? 'फिल्टर' : 'Filters'}
                </Button>
              </div>

              {/* Filter Options */}
              <Collapsible open={showFilters}>
                <CollapsibleContent className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {language === 'hi' ? 'फसल' : language === 'mr' ? 'पीक' : 'Crop'}
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {cropCategories.slice(0, 4).map(crop => (
                          <Badge
                            key={crop}
                            variant={selectedCrop === crop ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setSelectedCrop(selectedCrop === crop ? null : crop)}
                          >
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {language === 'hi' ? 'समस्या' : language === 'mr' ? 'समस्या' : 'Issue'}
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {issueTypes.slice(0, 4).map(issue => (
                          <Badge
                            key={issue}
                            variant={selectedIssue === issue ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setSelectedIssue(selectedIssue === issue ? null : issue)}
                          >
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {language === 'hi' ? 'क्षेत्र' : language === 'mr' ? 'प्रदेश' : 'Region'}
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {regions.slice(0, 4).map(region => (
                          <Badge
                            key={region}
                            variant={selectedRegion === region ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                          >
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Create Post */}
            <Card>
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
                        : (language === 'hi' ? 'अपना अनुभव साझा करें...' : language === 'mr' ? 'तुमचा अनुभव शेअर करा...' : 'Share your farming tips or questions...')
                      }
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <ImageIcon className="h-5 w-5 mr-2" />
                          {language === 'hi' ? 'फोटो' : language === 'mr' ? 'फोटो' : 'Photo'}
                        </Button>
                        <Button 
                          variant={isAskingQuestion ? 'secondary' : 'ghost'} 
                          size="sm" 
                          onClick={() => setIsAskingQuestion(!isAskingQuestion)}
                          className={isAskingQuestion ? 'bg-amber-100 text-amber-700' : 'text-muted-foreground'}
                        >
                          <HelpCircle className="h-5 w-5 mr-2" />
                          {language === 'hi' ? 'सवाल' : language === 'mr' ? 'प्रश्न' : 'Question'}
                        </Button>
                      </div>
                      <Button 
                        onClick={createPost}
                        disabled={!newPost.trim() || isPosting}
                        size="sm"
                        className="bg-primary"
                      >
                        {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        {language === 'hi' ? 'पोस्ट' : language === 'mr' ? 'पोस्ट' : 'Post'}
                      </Button>
                    </div>
                  </div>
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
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                        {post.content.startsWith('❓') && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                            {language === 'hi' ? 'सवाल' : language === 'mr' ? 'प्रश्न' : 'Question'}
                          </Badge>
                        )}
                      </div>
                      {post.profile?.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {post.profile.location}
                        </p>
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
                              {language === 'hi' ? 'हटाएं' : language === 'mr' ? 'हटवा' : 'Delete'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {post.user_id !== user?.id && (
                          <DropdownMenuItem onClick={() => startMessage(post.user_id)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {language === 'hi' ? 'संदेश' : language === 'mr' ? 'संदेश' : 'Message'}
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

                  <CardFooter className="px-4 py-3 border-t flex flex-col items-stretch">
                    <div className="flex items-center justify-between">
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm">{post.comments_count}</span>
                          {expandedComments.has(post.id) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
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
                    </div>

                    {/* Comments Section */}
                    <Collapsible open={expandedComments.has(post.id)}>
                      <CollapsibleContent className="mt-4 pt-4 border-t">
                        {/* Existing Comments */}
                        <div className="space-y-3 mb-4">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profile?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {comment.profile?.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs">{comment.profile?.username}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                          {post.comments.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              {language === 'hi' ? 'अभी कोई टिप्पणी नहीं' : 
                               language === 'mr' ? 'अद्याप कोणतीही टिप्पणी नाही' : 
                               'No comments yet'}
                            </p>
                          )}
                        </div>

                        {/* Add Comment */}
                        <div className="flex gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {profile?.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder={language === 'hi' ? 'टिप्पणी लिखें...' : language === 'mr' ? 'टिप्पणी लिहा...' : 'Write a comment...'}
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                              className="h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => addComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim() || postingComment === post.id}
                            >
                              {postingComment === post.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
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
                    {activeTab === 'questions' 
                      ? (language === 'hi' ? 'कोई सवाल नहीं' : language === 'mr' ? 'कोणताही प्रश्न नाही' : 'No questions yet')
                      : (language === 'hi' ? 'कोई पोस्ट नहीं' : language === 'mr' ? 'कोणतीही पोस्ट नाही' : 'No posts yet')
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'hi' ? 'पहले साझा करने वाले बनें!' : 
                     language === 'mr' ? 'प्रथम शेअर करणारे व्हा!' : 
                     'Be the first to share something!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Trending Topics */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {language === 'hi' ? 'ट्रेंडिंग' : language === 'mr' ? 'ट्रेंडिंग' : 'Trending Topics'}
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <div 
                    key={topic.tag}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm text-primary">{topic.tag}</p>
                      <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                    </div>
                    <span className="text-lg text-muted-foreground/50">#{index + 1}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Crop Categories */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold">
                  {language === 'hi' ? 'फसल श्रेणियां' : language === 'mr' ? 'पीक श्रेणी' : 'Crop Categories'}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cropCategories.map((crop) => (
                    <Badge 
                      key={crop} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {crop}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="pt-6 text-center">
                <HelpCircle className="h-12 w-12 mx-auto text-primary mb-3" />
                <h3 className="font-semibold mb-2">
                  {language === 'hi' ? 'मदद चाहिए?' : language === 'mr' ? 'मदत हवी आहे?' : 'Need Help?'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'hi' ? 'समुदाय से सवाल पूछें' : 
                   language === 'mr' ? 'समुदायाला प्रश्न विचारा' : 
                   'Ask the community your questions'}
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setIsAskingQuestion(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {language === 'hi' ? 'सवाल पूछें' : language === 'mr' ? 'प्रश्न विचारा' : 'Ask a Question'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
