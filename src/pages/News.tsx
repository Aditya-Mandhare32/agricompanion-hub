import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  RefreshCw, CloudSun, Building2, TrendingUp, Sprout,
  ExternalLink, Radio, Bookmark, BookmarkCheck, MapPin, Clock, AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image: string;
  source: string;
  category: string;
  publishedAt: string;
  region?: string;
  farmerImpact?: string;
}

const categoryIcons: Record<string, typeof CloudSun> = {
  weather: CloudSun,
  government: Building2,
  market: TrendingUp,
  crops: Sprout,
};

const categoryColors: Record<string, string> = {
  weather: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  government: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  market: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  crops: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export default function News() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('agri360_saved_news');
    if (saved) setSavedArticles(new Set(JSON.parse(saved)));
    loadNews();
  }, [language]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-news', {
        body: { language, category: 'all' },
      });
      if (fnError) throw fnError;
      const newsItems = data?.news || [];
      setNews(newsItems);
      // Store all news for saved page
      localStorage.setItem('agri360_all_news', JSON.stringify(newsItems));
    } catch (err) {
      console.error('News fetch error:', err);
      setError(language === 'hi' ? 'समाचार लोड करने में त्रुटि' : language === 'mr' ? 'बातम्या लोड करण्यात त्रुटी' : 'Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-news', {
        body: { language, category: activeTab },
      });
      if (fnError) throw fnError;
      setNews(data?.news || []);
      toast.success(language === 'hi' ? 'समाचार अपडेट!' : language === 'mr' ? 'बातम्या अपडेट!' : 'News refreshed!');
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSaveArticle = (title: string) => {
    const newSaved = new Set(savedArticles);
    if (newSaved.has(title)) {
      newSaved.delete(title);
    } else {
      newSaved.add(title);
    }
    setSavedArticles(newSaved);
    localStorage.setItem('agri360_saved_news', JSON.stringify([...newSaved]));
  };

  const filteredNews = activeTab === 'all' ? news : news.filter(item => item.category === activeTab);

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {language === 'hi' ? 'कृषि समाचार' : language === 'mr' ? 'शेती बातम्या' : 'Farmer News'}
              </h1>
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {language === 'hi' ? 'नवीनतम कृषि अपडेट' : language === 'mr' ? 'नवीनतम कृषी अपडेट्स' : 'Latest agriculture updates'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/saved-news')}>
              <BookmarkCheck className="h-4 w-4 mr-2" />
              {language === 'hi' ? 'सहेजे' : language === 'mr' ? 'जतन' : 'Saved'}
            </Button>
            <Button variant="outline" onClick={refreshNews} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {language === 'hi' ? 'रिफ्रेश' : language === 'mr' ? 'रिफ्रेश' : 'Refresh'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="all" className="py-2">
              {language === 'hi' ? 'सभी' : language === 'mr' ? 'सर्व' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="weather" className="py-2">
              <CloudSun className="h-4 w-4 mr-1 hidden sm:block" />
              {language === 'hi' ? 'मौसम' : language === 'mr' ? 'हवामान' : 'Weather'}
            </TabsTrigger>
            <TabsTrigger value="government" className="py-2">
              <Building2 className="h-4 w-4 mr-1 hidden sm:block" />
              {language === 'hi' ? 'सरकार' : language === 'mr' ? 'शासन' : 'Govt'}
            </TabsTrigger>
            <TabsTrigger value="market" className="py-2">
              <TrendingUp className="h-4 w-4 mr-1 hidden sm:block" />
              {language === 'hi' ? 'बाजार' : language === 'mr' ? 'बाजार' : 'Market'}
            </TabsTrigger>
            <TabsTrigger value="crops" className="py-2">
              <Sprout className="h-4 w-4 mr-1 hidden sm:block" />
              {language === 'hi' ? 'फसल' : language === 'mr' ? 'पीक' : 'Crops'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive/50 mb-3" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadNews} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'hi' ? 'पुनः प्रयास करें' : language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Try Again'}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <Skeleton className="sm:w-48 h-40 sm:h-auto" />
                  <div className="flex-1 p-4 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && (
          <div className="grid gap-4">
            {filteredNews.map((item, idx) => {
              const CategoryIcon = categoryIcons[item.category] || Sprout;
              const isSaved = savedArticles.has(item.title);
              return (
                <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${categoryColors[item.category] || ''} shrink-0`}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </Badge>
                            {item.region && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-2.5 w-2.5 mr-1" />
                                {item.region}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 shrink-0 ${isSaved ? 'text-primary' : ''}`}
                            onClick={() => toggleSaveArticle(item.title)}
                          >
                            {isSaved ? <BookmarkCheck className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
                          </Button>
                        </div>
                        <h3 className="font-semibold text-base leading-tight mt-2">{item.title}</h3>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        {item.farmerImpact && (
                          <div className="mt-2 p-2 bg-primary/5 rounded-md text-xs text-primary border-l-2 border-primary">
                            <strong>{language === 'hi' ? 'किसान टिप:' : language === 'mr' ? 'शेतकरी टिप:' : 'Farmer Tip:'}</strong> {item.farmerImpact}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium">{item.source}</span>
                            {item.publishedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(item.publishedAt), 'dd MMM yyyy')}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary text-xs"
                            onClick={() => {
                              if (item.url && item.url !== '#') {
                                window.open(item.url, '_blank', 'noopener,noreferrer');
                              } else {
                                toast.info(language === 'hi' ? 'पूर्ण लेख जल्द उपलब्ध होगा' : language === 'mr' ? 'पूर्ण लेख लवकरच उपलब्ध होईल' : 'Full article coming soon');
                              }
                            }}
                          >
                            {language === 'hi' ? 'पूरा पढ़ें' : language === 'mr' ? 'पूर्ण वाचा' : 'Read More'}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredNews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === 'hi' ? 'इस श्रेणी में कोई समाचार नहीं' : language === 'mr' ? 'या श्रेणीत बातम्या नाहीत' : 'No news found in this category'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
