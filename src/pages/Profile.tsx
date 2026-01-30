import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  MapPin,
  Camera,
  Save,
  Leaf,
  Calendar,
  MessageSquare,
  Heart,
  FileText,
  Settings,
  LogOut,
  Sprout,
  Droplets,
  FlaskConical,
  Scissors,
  Globe,
  Bookmark,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const accountTypes = [
  { value: 'farmer', label: 'Farmer', icon: Sprout },
  { value: 'agribusiness', label: 'Agribusiness', icon: Leaf },
  { value: 'student', label: 'Student', icon: FileText },
  { value: 'agronomist', label: 'Agronomist', icon: FlaskConical },
];

const eventTypeIcons = {
  sowing: { icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  fertilizing: { icon: FlaskConical, color: 'text-amber-500', bg: 'bg-amber-100' },
  irrigation: { icon: Droplets, color: 'text-sky-500', bg: 'bg-sky-100' },
  harvest: { icon: Scissors, color: 'text-rose-500', bg: 'bg-rose-100' },
};

interface SavedPost {
  id: string;
  post_id: string;
  post: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  profile: {
    username: string;
    avatar_url: string;
  } | null;
}

interface CalendarEvent {
  id: string;
  crop_name: string;
  event_type: string;
  event_date: string;
  notes: string | null;
  completed: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, loading: authLoading } = useAuth();
  const { language, setLanguage, t } = useApp();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    location: '',
    land_owned: '',
    account_type: 'farmer',
  });
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (profile) {
      setFormData({
        username: profile.username || '',
        location: profile.location || '',
        land_owned: profile.land_owned || '',
        account_type: profile.account_type || 'farmer',
      });
      fetchSavedPosts();
      fetchCalendarEvents();
    }
  }, [user, profile, authLoading]);

  const fetchSavedPosts = async () => {
    if (!user) return;
    
    const { data: savedData } = await supabase
      .from('saved_posts')
      .select('id, post_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (savedData && savedData.length > 0) {
      const postIds = savedData.map(s => s.post_id);
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, created_at, user_id')
        .in('id', postIds);

      if (posts) {
        const userIds = [...new Set(posts.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const postsWithProfiles: SavedPost[] = savedData.map(saved => {
          const post = posts.find(p => p.id === saved.post_id);
          const postProfile = post ? profileMap.get(post.user_id) : null;
          return {
            id: saved.id,
            post_id: saved.post_id,
            post: post ? {
              id: post.id,
              content: post.content,
              created_at: post.created_at,
            } : null,
            profile: postProfile ? {
              username: postProfile.username,
              avatar_url: postProfile.avatar_url,
            } : null,
          };
        }).filter(p => p.post !== null);

        setSavedPosts(postsWithProfiles);
      }
    }
  };

  const fetchCalendarEvents = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })
      .limit(10);

    if (data) {
      setCalendarEvents(data);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(formData as any);
    toast.success('Profile updated!');
    setIsEditing(false);
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const removeSavedPost = async (savedId: string) => {
    await supabase.from('saved_posts').delete().eq('id', savedId);
    setSavedPosts(prev => prev.filter(p => p.id !== savedId));
    toast.success('Post removed from saved');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-6">Please login to view your profile</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </Layout>
    );
  }

  const completedEvents = calendarEvents.filter(e => e.completed).length;
  const upcomingEvents = calendarEvents.filter(e => !e.completed && new Date(e.event_date) >= new Date()).length;

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary py-16">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920" 
            alt="Farm background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
                <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                  {profile.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-muted transition-colors"
              >
                <Camera className="h-5 w-5 text-primary" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.username}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/80">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  {accountTypes.find(t => t.value === profile.account_type)?.label || 'Farmer'}
                </Badge>
                {profile.land_owned && (
                  <Badge className="bg-white/20 text-white hover:bg-white/30">
                    {profile.land_owned}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 flex justify-center md:justify-end">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{calendarEvents.length}</div>
                  <div className="text-sm text-white/70">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{savedPosts.length}</div>
                  <div className="text-sm text-white/70">Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{completedEvents}</div>
                  <div className="text-sm text-white/70">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4 mx-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    {isEditing ? (
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{profile.username}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    {isEditing ? (
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Village/District/State"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{profile.location || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Land Owned</Label>
                    {isEditing ? (
                      <Input
                        value={formData.land_owned}
                        onChange={(e) => setFormData({ ...formData, land_owned: e.target.value })}
                        placeholder="e.g., 5 acres"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{profile.land_owned || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    {isEditing ? (
                      <Select
                        value={formData.account_type}
                        onValueChange={(v) => setFormData({ ...formData, account_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {accountTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const type = accountTypes.find(t => t.value === profile.account_type);
                          const Icon = type?.icon || User;
                          return (
                            <>
                              <Icon className="h-5 w-5 text-primary" />
                              <span className="text-lg font-medium">{type?.label || 'Farmer'}</span>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved">
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  Saved Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No saved posts yet</p>
                    <p className="text-sm">Posts you save will appear here</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/community')}>
                      Browse Community
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedPosts.map((saved) => (
                      <div key={saved.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={saved.profile?.avatar_url} />
                          <AvatarFallback>{saved.profile?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{saved.profile?.username || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{saved.post?.content}</p>
                          {saved.post?.created_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(saved.post.created_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSavedPost(saved.id)}
                        >
                          <Bookmark className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Farm Activities
                </CardTitle>
                <CardDescription>Your scheduled farming events</CardDescription>
              </CardHeader>
              <CardContent>
                {calendarEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No events scheduled yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/calendar')}>
                      Add Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {calendarEvents.map((event) => {
                      const config = eventTypeIcons[event.event_type as keyof typeof eventTypeIcons] || eventTypeIcons.sowing;
                      const Icon = config.icon;
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${config.bg} border`}
                        >
                          <div className={`p-2 rounded-lg bg-white ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{event.crop_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {event.event_type} • {format(new Date(event.event_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {event.completed && (
                            <Badge variant="secondary">Completed</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </Label>
                  <div className="flex gap-2">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'hi', label: 'हिंदी' },
                      { code: 'mr', label: 'मराठी' },
                    ].map((lang) => (
                      <Button
                        key={lang.code}
                        variant={language === lang.code ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLanguage(lang.code as any)}
                      >
                        {lang.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
