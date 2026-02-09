import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, Bookmark, UserCircle, Loader2, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { CommunityMessages } from '@/components/community/CommunityMessages';
import { SavedPosts } from '@/components/community/SavedPosts';
import { MyPosts } from '@/components/community/MyPosts';
import { Chatbot } from '@/components/Chatbot';

export default function Community() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('feed');
  const [messageTarget, setMessageTarget] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['feed', 'messages', 'saved', 'myposts'].includes(tab)) {
      setActiveTab(tab);
    }
    const targetUser = searchParams.get('user');
    if (targetUser) {
      setActiveTab('messages');
      setMessageTarget(targetUser);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate, location.pathname]);

  const handleNavigateToMessages = (userId: string) => {
    setMessageTarget(userId);
    setActiveTab('messages');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Custom Community Header - replaces main app nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-effect">
        <div className="container mx-auto flex h-14 items-center px-4 gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              {language === 'hi' ? 'किसान समुदाय' : language === 'mr' ? 'शेतकरी समुदाय' : 'Farmer Community'}
            </h1>
          </div>
        </div>
      </header>

      {/* Community Content */}
      <div className="flex-1 container max-w-6xl mx-auto px-4 py-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="feed" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span>{language === 'hi' ? 'फ़ीड' : language === 'mr' ? 'फीड' : 'Feed'}</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-4 w-4" />
              <span>{language === 'hi' ? 'चैट' : language === 'mr' ? 'चॅट' : 'Chat'}</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 text-xs sm:text-sm">
              <Bookmark className="h-4 w-4" />
              <span>{language === 'hi' ? 'सहेजे' : language === 'mr' ? 'जतन' : 'Saved'}</span>
            </TabsTrigger>
            <TabsTrigger value="myposts" className="gap-1.5 text-xs sm:text-sm">
              <UserCircle className="h-4 w-4" />
              <span>{language === 'hi' ? 'मेरे' : language === 'mr' ? 'माझे' : 'Mine'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <CommunityFeed onNavigateToMessages={handleNavigateToMessages} />
          </TabsContent>

          <TabsContent value="messages">
            <CommunityMessages targetUserId={messageTarget} />
          </TabsContent>

          <TabsContent value="saved">
            <SavedPosts onNavigateToMessages={handleNavigateToMessages} />
          </TabsContent>

          <TabsContent value="myposts">
            <MyPosts />
          </TabsContent>
        </Tabs>
      </div>

      <Chatbot />
    </div>
  );
}
