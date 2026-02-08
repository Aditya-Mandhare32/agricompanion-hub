import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, MapPin, UsersRound, Loader2, LogIn } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { CommunityMessages } from '@/components/community/CommunityMessages';
import { NearbyFarmers } from '@/components/community/NearbyFarmers';
import { CommunityGroups } from '@/components/community/CommunityGroups';

export default function Community() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('feed');
  const [messageTarget, setMessageTarget] = useState<string | null>(null);

  // Check for tab or user params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['feed', 'messages', 'nearby', 'groups'].includes(tab)) {
      setActiveTab(tab);
    }
    const targetUser = searchParams.get('user');
    if (targetUser) {
      setActiveTab('messages');
      setMessageTarget(targetUser);
    }
  }, [searchParams]);

  // Redirect to login if not authenticated
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
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

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

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {language === 'hi' ? 'किसान समुदाय' : language === 'mr' ? 'शेतकरी समुदाय' : 'Farmer Community'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'hi' ? 'अपने अनुभव साझा करें, चैट करें और अन्य किसानों से जुड़ें' :
             language === 'mr' ? 'तुमचे अनुभव शेअर करा, चॅट करा आणि इतर शेतकऱ्यांशी जोडा' :
             'Share experiences, chat, and connect with fellow farmers'}
          </p>
        </div>

        {/* Community Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="feed" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'फ़ीड' : language === 'mr' ? 'फीड' : 'Feed'}</span>
              <span className="sm:hidden">{language === 'hi' ? 'फ़ीड' : language === 'mr' ? 'फीड' : 'Feed'}</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'संदेश' : language === 'mr' ? 'संदेश' : 'Chat'}</span>
              <span className="sm:hidden">{language === 'hi' ? 'चैट' : language === 'mr' ? 'चॅट' : 'Chat'}</span>
            </TabsTrigger>
            <TabsTrigger value="nearby" className="gap-1.5 text-xs sm:text-sm">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'नज़दीकी किसान' : language === 'mr' ? 'जवळचे शेतकरी' : 'Nearby'}</span>
              <span className="sm:hidden">{language === 'hi' ? 'नज़दीक' : language === 'mr' ? 'जवळ' : 'Near'}</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5 text-xs sm:text-sm">
              <UsersRound className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'समूह' : language === 'mr' ? 'गट' : 'Groups'}</span>
              <span className="sm:hidden">{language === 'hi' ? 'समूह' : language === 'mr' ? 'गट' : 'Groups'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <CommunityFeed onNavigateToMessages={handleNavigateToMessages} />
          </TabsContent>

          <TabsContent value="messages">
            <CommunityMessages targetUserId={messageTarget} />
          </TabsContent>

          <TabsContent value="nearby">
            <NearbyFarmers onMessageFarmer={handleNavigateToMessages} />
          </TabsContent>

          <TabsContent value="groups">
            <CommunityGroups />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
