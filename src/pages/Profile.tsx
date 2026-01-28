import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Phone,
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
  Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { Language } from '@/lib/translations';

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

export default function Profile() {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    updateUser, 
    logout, 
    events, 
    posts, 
    language, 
    setLanguage,
    t 
  } = useApp();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    location: user?.location || '',
    landOwned: user?.landOwned || '',
    accountType: user?.accountType || 'farmer',
    phone: user?.phone || '',
  });

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">Please login to view your profile</p>
          <Button onClick={() => navigate('/login')}>{t('login')}</Button>
        </div>
      </Layout>
    );
  }

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const avatarUrl = event.target?.result as string;
        updateUser({ avatar: avatarUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user's activity
  const userEvents = events.slice(0, 5);
  const userPosts = posts.filter(p => p.userId === user.id).slice(0, 3);
  const completedEvents = events.filter(e => e.completed).length;
  const upcomingEvents = events.filter(e => !e.completed && new Date(e.date) >= new Date()).length;

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
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                  {user.username?.charAt(0).toUpperCase()}
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
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{user.username}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/80">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  {accountTypes.find(t => t.value === user.accountType)?.label || 'Farmer'}
                </Badge>
                {user.landOwned && (
                  <Badge className="bg-white/20 text-white hover:bg-white/30">
                    {user.landOwned}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 flex justify-center md:justify-end">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{events.length}</div>
                  <div className="text-sm text-white/70">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{userPosts.length}</div>
                  <div className="text-sm text-white/70">Posts</div>
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

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
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
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Username</Label>
                    {isEditing ? (
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{user.username}</p>
                    )}
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <p className="text-lg font-medium mt-1 text-muted-foreground">{user.phone}</p>
                    <p className="text-xs text-muted-foreground">Phone cannot be changed after verification</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    {isEditing ? (
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Village/District/State"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{user.location || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Land Owned</Label>
                    {isEditing ? (
                      <Input
                        value={formData.landOwned}
                        onChange={(e) => setFormData({ ...formData, landOwned: e.target.value })}
                        placeholder="e.g., 5 acres"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{user.landOwned || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    {isEditing ? (
                      <Select
                        value={formData.accountType}
                        onValueChange={(v) => setFormData({ ...formData, accountType: v as any })}
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
                          const type = accountTypes.find(t => t.value === user.accountType);
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
                </CardContent>
              </Card>

              {/* Activity Summary Card */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-primary" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500 text-white">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-emerald-700">{upcomingEvents}</div>
                          <div className="text-sm text-emerald-600">Upcoming Events</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-500 text-white">
                          <Droplets className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-sky-700">{completedEvents}</div>
                          <div className="text-sm text-sky-600">Completed</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500 text-white">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-700">{userPosts.length}</div>
                          <div className="text-sm text-amber-600">Posts Made</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-500 text-white">
                          <Heart className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-rose-700">
                            {userPosts.reduce((acc, p) => acc + p.likes.length, 0)}
                          </div>
                          <div className="text-sm text-rose-600">Likes Received</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Events */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Recent Farming Events
                  </CardTitle>
                  <CardDescription>Your scheduled farming activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {userEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No events scheduled yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate('/calendar')}>
                        Add Event
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userEvents.map((event) => {
                        const config = eventTypeIcons[event.eventType];
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
                              <p className="font-medium">{event.cropName}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant={event.completed ? 'default' : 'secondary'}>
                              {event.completed ? 'Done' : 'Pending'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Posts */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Your Posts
                  </CardTitle>
                  <CardDescription>Your community contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  {userPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No posts yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate('/community')}>
                        Create Post
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userPosts.map((post) => (
                        <div key={post.id} className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likes.length}
                            </span>
                            <span>{format(new Date(post.timestamp), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Language Preferences
                  </CardTitle>
                  <CardDescription>Choose your preferred language</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="hi">🇮🇳 हिंदी (Hindi)</SelectItem>
                      <SelectItem value="mr">🇮🇳 मराठी (Marathi)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <LogOut className="h-5 w-5" />
                    Account Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleLogout} className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
