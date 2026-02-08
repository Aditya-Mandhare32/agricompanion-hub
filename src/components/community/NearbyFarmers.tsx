import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, MessageCircle, Loader2, Search, Users } from 'lucide-react';

interface FarmerProfile {
  user_id: string;
  username: string;
  avatar_url: string;
  location: string | null;
  land_owned: string | null;
  account_type: string | null;
}

interface NearbyFarmersProps {
  onMessageFarmer?: (userId: string) => void;
}

export function NearbyFarmers({ onMessageFarmer }: NearbyFarmersProps) {
  const { user } = useAuth();
  const { language } = useApp();
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, [user]);

  const fetchFarmers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url, location, land_owned, account_type')
      .neq('user_id', user.id)
      .limit(50);

    if (!error && data) {
      setFarmers(data);
    }
    setLoading(false);
  };

  const filteredFarmers = farmers.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.username.toLowerCase().includes(q) || (f.location?.toLowerCase().includes(q) ?? false);
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === 'hi' ? 'नाम या स्थान से खोजें...' : language === 'mr' ? 'नाव किंवा ठिकाणाने शोधा...' : 'Search by name or location...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredFarmers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {language === 'hi' ? 'कोई किसान नहीं मिला' : language === 'mr' ? 'कोणताही शेतकरी सापडला नाही' : 'No farmers found'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarmers.map((farmer) => (
            <Card key={farmer.user_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={farmer.avatar_url} />
                    <AvatarFallback>{farmer.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{farmer.username}</h4>
                    {farmer.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{farmer.location}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {farmer.account_type && (
                        <Badge variant="secondary" className="text-xs capitalize">{farmer.account_type}</Badge>
                      )}
                      {farmer.land_owned && (
                        <Badge variant="outline" className="text-xs">{farmer.land_owned}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 gap-2"
                  onClick={() => onMessageFarmer?.(farmer.user_id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {language === 'hi' ? 'संदेश भेजें' : language === 'mr' ? 'संदेश पाठवा' : 'Send Message'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
