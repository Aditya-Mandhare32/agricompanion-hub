import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudFog, CloudSun,
  Droplets, Wind, Thermometer, MapPin, AlertTriangle, RefreshCw, Navigation, Pin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WeatherData {
  city: string;
  state: string;
  current: {
    temperature: number; humidity: number; precipitation: number;
    windSpeed: number; description: string; icon: string;
  };
  forecast: Array<{
    date: string; maxTemp: number; minTemp: number;
    precipitation: number; description: string; icon: string;
  }>;
  farmingTips: string[];
  totalWeeklyRainfall: number;
}

interface WeatherWidgetProps {
  city?: string;
  language?: string;
  compact?: boolean;
  /** When true (default on dashboard), prompt for geolocation on first mount. */
  useGeolocation?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  'sun': Sun, 'cloud': Cloud, 'cloud-sun': CloudSun,
  'cloud-rain': CloudRain, 'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning, 'cloud-fog': CloudFog,
};

const GEO_CACHE_KEY = 'agri360_geo_coords';
const GEO_PERM_KEY = 'agri360_geo_perm';

export function WeatherWidget({ city = 'Pune', language = 'en', compact = false, useGeolocation = false }: WeatherWidgetProps) {
  const { profile, updateProfile } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [savingFarm, setSavingFarm] = useState(false);

  // Prefer saved farm coords from profile. Fall back to cached GPS if user has not set one yet.
  const farmCoords = (profile?.farm_latitude != null && profile?.farm_longitude != null)
    ? { lat: profile.farm_latitude, lon: profile.farm_longitude }
    : null;

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(() => {
    if (farmCoords) return farmCoords;
    if (!useGeolocation) return null;
    try {
      const cached = localStorage.getItem(GEO_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  // Sync when profile loads/changes after mount.
  useEffect(() => {
    if (farmCoords) setCoords(farmCoords);
  }, [profile?.farm_latitude, profile?.farm_longitude]); // eslint-disable-line

  const requestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) { setGeoDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(c);
        setGeoDenied(false);
        try {
          localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c));
          localStorage.setItem(GEO_PERM_KEY, 'granted');
        } catch {}
      },
      (err) => {
        setGeoDenied(true);
        try { localStorage.setItem(GEO_PERM_KEY, 'denied'); } catch {}
        console.warn('Geolocation error:', err.message);
      },
      { timeout: 8000, maximumAge: 1000 * 60 * 30 },
    );
  }, []);

  useEffect(() => {
    // If farm coords are saved, never ask for GPS again.
    if (farmCoords) return;
    if (!useGeolocation) return;
    const prev = (() => { try { return localStorage.getItem(GEO_PERM_KEY); } catch { return null; } })();
    if (prev === 'denied') { setGeoDenied(true); return; }
    if (!coords) requestGeolocation();
  }, [useGeolocation, coords, requestGeolocation, farmCoords]);

  const saveAsFarmLocation = async () => {
    if (!coords) return;
    setSavingFarm(true);
    try {
      await updateProfile({
        farm_latitude: coords.lat,
        farm_longitude: coords.lon,
        farm_location_label: weather ? `${weather.city}, ${weather.state}` : null,
      } as any);
      toast.success(
        language === 'hi' ? 'खेत का स्थान सहेजा गया' :
        language === 'mr' ? 'शेताचे ठिकाण जतन झाले' :
        'Saved as your farm location'
      );
    } catch (e) {
      toast.error('Could not save farm location');
    } finally {
      setSavingFarm(false);
    }
  };

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, any> = { language };
      if (coords) { body.lat = coords.lat; body.lon = coords.lon; }
      else { body.city = city; }
      const { data, error: fnError } = await supabase.functions.invoke('get-weather', { body });
      if (fnError) throw fnError;
      setWeather(data);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (userId && data) {
          const { createNotification } = await import('@/lib/notify');
          const today = new Date().toISOString().split('T')[0];
          const t = data.current?.temperature;
          const rain = data.totalWeeklyRainfall;
          if (typeof t === 'number' && (t > 40 || t < 5)) {
            await createNotification({
              userId, type: 'weather_warning',
              title: language === 'hi' ? 'मौसम चेतावनी' : language === 'mr' ? 'हवामान इशारा' : 'Weather Warning',
              message: `${language === 'hi' ? 'तापमान' : language === 'mr' ? 'तापमान' : 'Temperature'}: ${Math.round(t)}°C`,
              priority: 'high', action_type: 'view_calendar', dedupeKey: `weather-temp-${today}`,
            });
          }
          if (typeof rain === 'number' && rain > 20) {
            await createNotification({
              userId, type: 'weather_warning',
              title: language === 'hi' ? 'भारी बारिश' : language === 'mr' ? 'जोरदार पाऊस' : 'Heavy Rain Forecast',
              message: `${Math.round(rain)}mm ${language === 'hi' ? 'इस सप्ताह' : language === 'mr' ? 'या आठवड्यात' : 'this week'}`,
              priority: 'high', action_type: 'view_calendar', dedupeKey: `weather-rain-${today}`,
            });
          }
        }
      } catch {}
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to load weather');
    } finally {
      setLoading(false);
    }
  }, [city, language, coords]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-16" /></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center text-muted-foreground">
          <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error || 'Weather unavailable'}</p>
          <Button variant="ghost" size="sm" onClick={fetchWeather} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = iconMap[weather.current.icon] || Sun;
  // Show "save as farm" only when we have a GPS reading but the profile has no saved farm yet.
  const showSaveFarmPrompt = !!coords && !farmCoords && !!profile;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
          <WeatherIcon className="h-5 w-5 text-amber-400" />
          <div>
            <div className="text-xs opacity-70">{weather.current.description}</div>
            <div className="font-semibold">{Math.round(weather.current.temperature)}°C</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
          <Droplets className="h-5 w-5 text-sky-400" />
          <div>
            <div className="text-xs opacity-70">{language === 'hi' ? 'साप्ताहिक वर्षा' : language === 'mr' ? 'साप्ताहिक पाऊस' : 'Weekly Rain'}</div>
            <div className="font-semibold">{Math.round(weather.totalWeeklyRainfall)}mm</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
          <Thermometer className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="text-xs opacity-70">{language === 'hi' ? 'आर्द्रता' : language === 'mr' ? 'आर्द्रता' : 'Humidity'}</div>
            <div className="font-semibold">{weather.current.humidity}%</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-200 overflow-hidden">
      <CardContent className="p-0">
        {useGeolocation && geoDenied && !farmCoords && (
          <div className="px-4 pt-3 -mb-1 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-200 py-2">
            <Navigation className="h-3.5 w-3.5" />
            <span className="flex-1">
              {language === 'hi' ? 'सटीक मौसम के लिए स्थान सक्षम करें' : language === 'mr' ? 'अचूक हवामानासाठी स्थान सक्षम करा' : 'Enable location for accurate local weather'}
            </span>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={requestGeolocation}>Retry</Button>
          </div>
        )}
        {showSaveFarmPrompt && (
          <div className="px-4 pt-3 -mb-1 flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border-b border-emerald-200 py-2">
            <Pin className="h-3.5 w-3.5" />
            <span className="flex-1">
              {language === 'hi' ? 'इस स्थान को अपना खेत बनाएं?' :
               language === 'mr' ? 'हे ठिकाण तुमचे शेत म्हणून जतन करायचे?' :
               'Save this as your farm location?'}
            </span>
            <Button size="sm" variant="default" className="h-6 text-xs" disabled={savingFarm} onClick={saveAsFarmLocation}>
              {savingFarm ? '…' : (language === 'hi' ? 'सहेजें' : language === 'mr' ? 'जतन करा' : 'Save')}
            </Button>
          </div>
        )}
        <div className="p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white">
          <div className="flex items-center gap-1 text-sm opacity-80 mb-2">
            <MapPin className="h-4 w-4" />
            {weather.city}, {weather.state}
            {farmCoords && (
              <Badge variant="secondary" className="ml-2 h-5 text-[10px] bg-white/20 text-white border-0">
                {language === 'hi' ? 'खेत' : language === 'mr' ? 'शेत' : 'Farm'}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={fetchWeather}
              className="ml-auto text-white/80 hover:text-white hover:bg-white/10 h-6 w-6 p-0">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold">{Math.round(weather.current.temperature)}°C</div>
              <div className="text-sm opacity-90">{weather.current.description}</div>
            </div>
            <WeatherIcon className="h-16 w-16 opacity-90" />
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1"><Droplets className="h-4 w-4" />{weather.current.humidity}%</div>
            <div className="flex items-center gap-1"><Wind className="h-4 w-4" />{Math.round(weather.current.windSpeed)} km/h</div>
            <div className="flex items-center gap-1"><CloudRain className="h-4 w-4" />{weather.current.precipitation}mm</div>
          </div>
        </div>
        <div className="p-4">
          <h4 className="text-sm font-medium mb-3">
            {language === 'hi' ? '7-दिन का पूर्वानुमान' : language === 'mr' ? '7-दिवसांचा अंदाज' : '7-Day Forecast'}
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {weather.forecast.slice(0, 7).map((day, i) => {
              const DayIcon = iconMap[day.icon] || Sun;
              const date = new Date(day.date);
              const dayName = i === 0
                ? (language === 'hi' ? 'आज' : language === 'mr' ? 'आज' : 'Today')
                : date.toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US', { weekday: 'short' });
              return (
                <div key={day.date} className="flex-shrink-0 text-center p-2 rounded-lg bg-muted/50 min-w-[60px]">
                  <div className="text-xs text-muted-foreground">{dayName}</div>
                  <DayIcon className="h-5 w-5 mx-auto my-1 text-sky-500" />
                  <div className="text-xs font-medium">{Math.round(day.maxTemp)}°</div>
                  <div className="text-xs text-muted-foreground">{Math.round(day.minTemp)}°</div>
                </div>
              );
            })}
          </div>
        </div>
        {weather.farmingTips.length > 0 && (
          <div className="px-4 pb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {language === 'hi' ? 'खेती सलाह' : language === 'mr' ? 'शेती सल्ला' : 'Farming Tips'}
            </h4>
            <div className="space-y-1">
              {weather.farmingTips.map((tip, i) => (
                <Badge key={i} variant="secondary" className="text-xs mr-1 mb-1">{tip}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
