import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Heart, MessageCircle, Loader2, Trash2, Pencil, UserCircle, MapPin, Camera, Save, Grid3X3, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface MyPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

const accountTypes = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'agribusiness', label: 'Agribusiness' },
  { value: 'student', label: 'Student' },
  { value: 'agronomist', label: 'Agronomist' },
];

export function MyPosts() {
  const { user, profile, updateProfile } = useAuth();
  const { language } = useApp();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<MyPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [formData, setFormData] = useState({ username: '', location: '', land_owned: '', account_type: 'farmer' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) fetchMyPosts();
    if (profile) {
      setFormData({
        username: profile.username || '',
        location: profile.location || '',
        land_owned: profile.land_owned || '',
        account_type: profile.account_type || 'farmer',
      });
    }
  }, [user, profile]);

  const fetchMyPosts = async () => {
    if (!user) return;
    const { data: postsData } = await supabase
      .from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!postsData) { setPosts([]); setLoading(false); return; }
    const enriched = await Promise.all(postsData.map(async (post) => {
      const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      ]);
      return { ...post, likes_count: likesCount || 0, comments_count: commentsCount || 0 };
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
    else { setPosts(prev => prev.filter(p => p.id !== postId)); toast.success(language === 'hi' ? 'पोस्ट हटाई गई' : language === 'mr' ? 'पोस्ट हटवली' : 'Post deleted'); }
  };

  const saveEdit = async () => {
    if (!editingPost || !editContent.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('posts').update({ content: editContent.trim() }).eq('id', editingPost.id);
    if (error) toast.error('Failed to update');
    else { setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editContent.trim() } : p)); toast.success('Post updated'); setEditingPost(null); }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }

    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('community-images').upload(fileName, file, { upsert: true });
    if (uploadError) { toast.error('Upload failed'); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from('community-images').getPublicUrl(fileName);
    await updateProfile({ avatar_url: data.publicUrl } as any);
    toast.success(language === 'hi' ? 'फोटो अपडेट हुआ' : language === 'mr' ? 'फोटो अपडेट झाला' : 'Avatar updated!');
    setUploadingAvatar(false);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    await updateProfile(formData as any);
    toast.success('Profile updated!');
    setIsEditingProfile(false);
    setProfileSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 h-24 relative" />
          <CardContent className="-mt-12 pb-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl">{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" /> : <Camera className="h-3.5 w-3.5 text-primary-foreground" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <h2 className="text-xl font-bold mt-3">{profile?.username}</h2>
              {profile?.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{profile.location}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{accountTypes.find(t => t.value === profile?.account_type)?.label || 'Farmer'}</Badge>
                {profile?.land_owned && <Badge variant="outline">{profile.land_owned}</Badge>}
              </div>
              <div className="flex gap-8 mt-4 text-center">
                <div><p className="text-lg font-bold">{posts.length}</p><p className="text-xs text-muted-foreground">{language === 'hi' ? 'पोस्ट' : language === 'mr' ? 'पोस्ट' : 'Posts'}</p></div>
                <div><p className="text-lg font-bold">{posts.reduce((s, p) => s + p.likes_count, 0)}</p><p className="text-xs text-muted-foreground">{language === 'hi' ? 'लाइक' : language === 'mr' ? 'लाइक' : 'Likes'}</p></div>
              </div>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsEditingProfile(true)}>
                <Settings className="h-4 w-4 mr-2" />
                {language === 'hi' ? 'प्रोफाइल संपादित करें' : language === 'mr' ? 'प्रोफाइल संपादित करा' : 'Edit Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Grid3X3 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'hi' ? 'अभी कोई पोस्ट नहीं' : language === 'mr' ? 'अद्याप कोणतीही पोस्ट नाही' : 'No posts yet'}
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post.id} className="relative group cursor-pointer" onClick={() => { setEditingPost(post); setEditContent(post.content); }}>
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
        )}
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'hi' ? 'पोस्ट' : language === 'mr' ? 'पोस्ट' : 'Post'}</DialogTitle>
          </DialogHeader>
          {editingPost?.image_url && (
            <AspectRatio ratio={1}><img src={editingPost.image_url} alt="Post" className="w-full h-full object-cover rounded-lg" /></AspectRatio>
          )}
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[80px]" />
          <DialogFooter className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => { deletePost(editingPost!.id); setEditingPost(null); }}>
              <Trash2 className="h-4 w-4 mr-1" />{language === 'hi' ? 'हटाएं' : language === 'mr' ? 'हटवा' : 'Delete'}
            </Button>
            <Button onClick={saveEdit} disabled={saving || !editContent.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {language === 'hi' ? 'सहेजें' : language === 'mr' ? 'जतन करा' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'hi' ? 'प्रोफाइल संपादित करें' : language === 'mr' ? 'प्रोफाइल संपादित करा' : 'Edit Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Username</Label><Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Village/District/State" /></div>
            <div><Label>Land Owned</Label><Input value={formData.land_owned} onChange={(e) => setFormData({ ...formData, land_owned: e.target.value })} placeholder="e.g., 5 acres" /></div>
            <div>
              <Label>Account Type</Label>
              <Select value={formData.account_type} onValueChange={(v) => setFormData({ ...formData, account_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{accountTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
            <Button onClick={handleProfileSave} disabled={profileSaving}>
              {profileSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
