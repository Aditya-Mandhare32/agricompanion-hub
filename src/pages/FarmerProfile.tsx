import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, MapPin, Grid3X3, Heart, MessageCircle, Loader2, Play, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|m4v|ogg)(\?|$)/i.test(url);

interface PublicProfile {
  user_id: string;
  username: string;
  avatar_url: string;
  location: string | null;
  account_type: string | null;
  land_owned: string | null;
}

interface PostRow {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export default function FarmerProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useApp();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PostRow | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: postsData }] = await Promise.all([
        supabase.from('profiles').select('user_id, username, avatar_url, location, account_type, land_owned').eq('user_id', userId).maybeSingle(),
        supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);
      if (!active) return;
      setProfile(prof as PublicProfile);
      const enriched = await Promise.all((postsData || []).map(async (p: any) => {
        const [{ count: likes }, { count: comments }] = await Promise.all([
          supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', p.id),
          supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', p.id),
        ]);
        return { id: p.id, content: p.content, image_url: p.image_url, created_at: p.created_at, likes_count: likes || 0, comments_count: comments || 0 };
      }));
      if (!active) return;
      setPosts(enriched);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [userId]);

  const t = (en: string, hi: string, mr: string) => language === 'hi' ? hi : language === 'mr' ? mr : en;
  const isSelf = user?.id === userId;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('Back', 'वापस', 'मागे')}
        </Button>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !profile ? (
          <div className="text-center py-16 text-muted-foreground">{t('Farmer not found', 'किसान नहीं मिला', 'शेतकरी सापडला नाही')}</div>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-emerald-100 h-24" />
              <CardContent className="-mt-12 pb-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-2xl">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold mt-3">{profile.username}</h2>
                  {profile.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />{profile.location}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {profile.account_type && <Badge variant="secondary" className="capitalize">{profile.account_type}</Badge>}
                    {profile.land_owned && <Badge variant="outline">{profile.land_owned}</Badge>}
                  </div>
                  <div className="flex gap-8 mt-4 text-center">
                    <div><p className="text-lg font-bold">{posts.length}</p><p className="text-xs text-muted-foreground">{t('Posts', 'पोस्ट', 'पोस्ट')}</p></div>
                    <div><p className="text-lg font-bold">{posts.reduce((s, p) => s + p.likes_count, 0)}</p><p className="text-xs text-muted-foreground">{t('Likes', 'लाइक', 'लाइक')}</p></div>
                  </div>
                  {!isSelf && user && (
                    <Button size="sm" variant="outline" className="mt-4" asChild>
                      <Link to={`/messages?user=${userId}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('Message', 'संदेश', 'संदेश')}
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <Grid3X3 className="h-16 w-16 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">{t('No posts yet', 'अभी कोई पोस्ट नहीं', 'अद्याप कोणतीही पोस्ट नाही')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <button key={post.id} className="relative group" onClick={() => setSelected(post)}>
                      <AspectRatio ratio={1}>
                        {post.image_url ? (
                          isVideoUrl(post.image_url) ? (
                            <div className="relative w-full h-full">
                              <video src={post.image_url} className="w-full h-full object-cover rounded-sm" muted playsInline preload="metadata" />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/50 rounded-full p-2"><Play className="h-5 w-5 text-white fill-white" /></div>
                              </div>
                            </div>
                          ) : (
                            <img src={post.image_url} alt="Post" className="w-full h-full object-cover rounded-sm" />
                          )
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-md">
            {selected && profile && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-sm">{profile.username}</DialogTitle>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                </DialogHeader>
                {selected.image_url && (
                  isVideoUrl(selected.image_url)
                    ? <video src={selected.image_url} controls className="w-full rounded-lg" />
                    : <AspectRatio ratio={1}><img src={selected.image_url} alt="Post" className="w-full h-full object-cover rounded-lg" /></AspectRatio>
                )}
                <p className="text-sm whitespace-pre-wrap">{selected.content}</p>
                <div className="flex gap-4 pt-2 border-t text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{selected.likes_count}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{selected.comments_count}</span>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
