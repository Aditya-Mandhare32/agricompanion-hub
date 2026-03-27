import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SavedNewsItem {
  title: string;
  description: string;
  url: string;
  image: string;
  source: string;
  category: string;
  publishedAt: string;
  region?: string;
}

export default function SavedNews() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [savedNews, setSavedNews] = useState<SavedNewsItem[]>([]);

  useEffect(() => {
    const savedTitles = JSON.parse(localStorage.getItem('agri360_saved_news') || '[]') as string[];
    const allNews = JSON.parse(localStorage.getItem('agri360_all_news') || '[]') as SavedNewsItem[];
    setSavedNews(allNews.filter(n => savedTitles.includes(n.title)));
  }, []);

  const unsaveArticle = (title: string) => {
    const savedTitles = JSON.parse(localStorage.getItem('agri360_saved_news') || '[]') as string[];
    const updated = savedTitles.filter((t: string) => t !== title);
    localStorage.setItem('agri360_saved_news', JSON.stringify(updated));
    setSavedNews(prev => prev.filter(n => n.title !== title));
    toast.success(language === 'hi' ? 'हटाया गया' : language === 'mr' ? 'काढले' : 'Removed');
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/news')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookmarkCheck className="h-6 w-6 text-primary" />
              {language === 'hi' ? 'सहेजी गई खबरें' : language === 'mr' ? 'जतन केलेल्या बातम्या' : 'Saved News'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {savedNews.length} {language === 'hi' ? 'लेख' : language === 'mr' ? 'लेख' : 'articles'}
            </p>
          </div>
        </div>

        {savedNews.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'hi' ? 'कोई सहेजी गई खबरें नहीं' : language === 'mr' ? 'जतन केलेल्या बातम्या नाहीत' : 'No saved news'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'hi' ? 'समाचार पृष्ठ से लेख सहेजें' : language === 'mr' ? 'बातम्या पृष्ठावरून लेख जतन करा' : 'Save articles from the news page'}
            </p>
            <Button variant="outline" onClick={() => navigate('/news')}>
              {language === 'hi' ? 'समाचार देखें' : language === 'mr' ? 'बातम्या पहा' : 'Browse News'}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedNews.map((item, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'; }} />
                  </div>
                  <div className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => unsaveArticle(item.title)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="font-semibold text-base leading-tight mt-2">{item.title}</h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium">{item.source}</span>
                          {item.publishedAt && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(item.publishedAt), 'dd MMM yyyy')}</span>}
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary text-xs"
                          onClick={() => item.url && item.url !== '#' ? window.open(item.url, '_blank') : toast.info('Full article coming soon')}>
                          {language === 'hi' ? 'पूरा पढ़ें' : language === 'mr' ? 'पूर्ण वाचा' : 'Read More'}<ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
