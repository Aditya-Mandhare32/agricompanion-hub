import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Search } from 'lucide-react';

interface MarketPrice {
  name: string; name_hi: string; name_mr: string;
  price_min: number; price_max: number; unit: string;
  trend: 'up' | 'down' | 'stable'; change_percent: number; image: string;
}

export function MarketPrices() {
  const { language } = useApp();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchPrices(); }, [language]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-market-prices', { body: { language } });
      if (error) throw error;
      setPrices(data.prices || []);
      setDate(data.date || new Date().toISOString().split('T')[0]);
    } catch (err) { console.error('Market prices error:', err); }
    finally { setLoading(false); }
  };

  const getName = (item: MarketPrice) => {
    if (language === 'hi') return item.name_hi || item.name;
    if (language === 'mr') return item.name_mr || item.name;
    return item.name;
  };

  const filteredPrices = searchQuery.trim()
    ? prices.filter(p => getName(p).toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : prices;

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-red-500" />;
    if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Card className="flex flex-col" style={{ maxHeight: '500px' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {language === 'hi' ? "आज का बाजार भाव" : language === 'mr' ? "आजचे बाजारभाव" : "Today's Market Prices"}
          </CardTitle>
          <Badge variant="outline" className="text-xs">{date}</Badge>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'hi' ? 'फसल खोजें...' : language === 'mr' ? 'पीक शोधा...' : 'Search crop price...'}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {filteredPrices.map((item, idx) => (
              <div key={idx} className="relative rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-20 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'; }} />
                </div>
                <div className="p-2.5">
                  <h4 className="font-semibold text-xs truncate">{getName(item)}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-primary">₹{item.price_min}-{item.price_max}</span>
                    <span className="text-[10px] text-muted-foreground">/{item.unit}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon trend={item.trend} />
                    <span className={`text-[10px] font-medium ${item.trend === 'up' ? 'text-red-500' : item.trend === 'down' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {item.change_percent > 0 ? '+' : ''}{item.change_percent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredPrices.length === 0 && (
              <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
                {language === 'hi' ? 'कोई परिणाम नहीं' : language === 'mr' ? 'कोणतेही निकाल नाहीत' : 'No results found'}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
