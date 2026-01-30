import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  CloudSun, 
  Building2, 
  TrendingUp, 
  Sprout,
  ExternalLink,
  Loader2,
  Radio
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  source: string;
  category: 'weather' | 'government' | 'market' | 'crops';
  publishedAt: Date;
}

// Agriculture RSS feed sources (simulated with realistic data)
const generateNews = (): NewsItem[] => {
  const newsTemplates = [
    // Weather
    { 
      category: 'weather' as const, 
      titles: [
        'Monsoon Update: Heavy Rainfall Expected in Western Maharashtra',
        'Weather Advisory: Dry Spell Likely in Next 10 Days',
        'IMD Predicts Above Normal Rainfall This Season',
        'Heat Wave Alert for Central India Farmers',
        'Cyclone Warning: Coastal Farmers Advised to Take Precautions'
      ],
      descriptions: [
        'The India Meteorological Department has issued a forecast indicating significant rainfall patterns that could affect crop planning.',
        'Farmers are advised to adjust irrigation schedules based on the latest weather predictions.',
        'Updated weather models suggest favorable conditions for rabi crop sowing in the coming weeks.'
      ]
    },
    // Government
    { 
      category: 'government' as const, 
      titles: [
        'PM-KISAN: New Installment Released for 11 Crore Farmers',
        'Government Announces MSP Increase for Kharif Crops 2025',
        'New Subsidy Scheme for Drip Irrigation Systems',
        'Crop Insurance Claims Now Available Online',
        'State Government Waives Farm Loans Under New Policy'
      ],
      descriptions: [
        'The Ministry of Agriculture has announced new initiatives to support farmers with financial assistance and improved market access.',
        'Applications are now open for various agricultural development programs. Farmers can apply through their local agriculture office.',
        'The new policy aims to increase farmer income and reduce agricultural debt burden.'
      ]
    },
    // Market
    { 
      category: 'market' as const, 
      titles: [
        'Onion Prices Surge 40% in Major Mandis',
        'Soybean Export Demand Boosts Domestic Prices',
        'Cotton Futures Trading Higher on Global Demand',
        'Wheat Procurement Crosses 30 Million Tonnes',
        'Tomato Prices Stabilize After Recent Volatility'
      ],
      descriptions: [
        'Market analysts report significant price movements due to supply chain adjustments and seasonal demand patterns.',
        'Traders suggest farmers may benefit from current market conditions for select commodities.',
        'Agricultural commodity markets show mixed trends with grains performing well.'
      ]
    },
    // Crops
    { 
      category: 'crops' as const, 
      titles: [
        'New Drought-Resistant Rice Variety Released by ICAR',
        'Pest Alert: Pink Bollworm Infestation in Cotton Belt',
        'Organic Farming Training Programs in Your District',
        'Success Story: Farmer Doubles Income with Mixed Cropping',
        'Scientists Develop High-Yield Wheat Variety for Northern Plains'
      ],
      descriptions: [
        'Agricultural research institutions continue to develop improved crop varieties suited to changing climate conditions.',
        'Experts recommend integrated pest management strategies for sustainable crop protection.',
        'New farming techniques are helping farmers achieve better yields with lower input costs.'
      ]
    }
  ];

  const images = {
    weather: [
      'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400',
      'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400',
      'https://images.unsplash.com/photo-1492011221367-f47e3ccd77a0?w=400'
    ],
    government: [
      'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=400',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400'
    ],
    market: [
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
    ],
    crops: [
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400'
    ]
  };

  const sources = ['Krishi Jagran', 'Agriculture Today', 'Kisan News', 'Farm India', 'Agri Express'];

  const allNews: NewsItem[] = [];

  newsTemplates.forEach((template) => {
    template.titles.forEach((title, index) => {
      allNews.push({
        id: `${template.category}-${index}-${Date.now()}-${Math.random()}`,
        title,
        description: template.descriptions[index % template.descriptions.length],
        url: '#',
        image: images[template.category][index % images[template.category].length],
        source: sources[Math.floor(Math.random() * sources.length)],
        category: template.category,
        publishedAt: new Date(Date.now() - Math.random() * 86400000 * 3), // Random time in last 3 days
      });
    });
  });

  // Shuffle and return
  return allNews.sort(() => Math.random() - 0.5);
};

const categoryIcons = {
  weather: CloudSun,
  government: Building2,
  market: TrendingUp,
  crops: Sprout,
};

const categoryColors = {
  weather: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  government: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  market: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  crops: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setNews(generateNews());
    setLoading(false);
  };

  const refreshNews = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setNews(generateNews());
    setRefreshing(false);
  };

  const filteredNews = activeTab === 'all' 
    ? news 
    : news.filter(item => item.category === activeTab);

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
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Farmer News</h1>
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            </div>
            <p className="text-muted-foreground">Latest agriculture updates</p>
          </div>
          <Button 
            variant="outline" 
            onClick={refreshNews}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="all" className="py-2">All</TabsTrigger>
            <TabsTrigger value="weather" className="py-2">
              <CloudSun className="h-4 w-4 mr-1 hidden sm:block" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="government" className="py-2">
              <Building2 className="h-4 w-4 mr-1 hidden sm:block" />
              Govt
            </TabsTrigger>
            <TabsTrigger value="market" className="py-2">
              <TrendingUp className="h-4 w-4 mr-1 hidden sm:block" />
              Market
            </TabsTrigger>
            <TabsTrigger value="crops" className="py-2">
              <Sprout className="h-4 w-4 mr-1 hidden sm:block" />
              Crops
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* News Grid */}
        <div className="grid gap-4">
          {filteredNews.map((item) => {
            const CategoryIcon = categoryIcons[item.category];
            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-40 sm:h-auto">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${categoryColors[item.category]} shrink-0`}
                        >
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base leading-tight mt-2">{item.title}</h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">{item.source}</span>
                        <Button variant="ghost" size="sm" className="text-primary">
                          Read More
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

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No news found in this category</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
