 import React, { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Skeleton } from '@/components/ui/skeleton';
 import { 
   Sun, 
   Cloud, 
   CloudRain, 
   CloudDrizzle, 
   CloudLightning, 
   CloudFog,
   CloudSun,
   Droplets,
   Wind,
   Thermometer,
   MapPin,
   AlertTriangle,
   RefreshCw
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 interface WeatherData {
   city: string;
   state: string;
   current: {
     temperature: number;
     humidity: number;
     precipitation: number;
     windSpeed: number;
     description: string;
     icon: string;
   };
   forecast: Array<{
     date: string;
     maxTemp: number;
     minTemp: number;
     precipitation: number;
     description: string;
     icon: string;
   }>;
   farmingTips: string[];
   totalWeeklyRainfall: number;
 }
 
 interface WeatherWidgetProps {
   city?: string;
   language?: string;
   compact?: boolean;
 }
 
 const iconMap: Record<string, React.ElementType> = {
   'sun': Sun,
   'cloud': Cloud,
   'cloud-sun': CloudSun,
   'cloud-rain': CloudRain,
   'cloud-drizzle': CloudDrizzle,
   'cloud-lightning': CloudLightning,
   'cloud-fog': CloudFog,
 };
 
 export function WeatherWidget({ city = 'Pune', language = 'en', compact = false }: WeatherWidgetProps) {
   const [weather, setWeather] = useState<WeatherData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchWeather = async () => {
     setLoading(true);
     setError(null);
     
     try {
       const { data, error: fnError } = await supabase.functions.invoke('get-weather', {
         body: { city, language },
       });
 
       if (fnError) throw fnError;
       setWeather(data);
     } catch (err) {
       console.error('Weather fetch error:', err);
       setError('Failed to load weather');
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     fetchWeather();
   }, [city, language]);
 
   if (loading) {
     return (
       <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-200">
         <CardContent className="p-4">
           <div className="flex items-center gap-4">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-6 w-16" />
             </div>
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
             <div className="text-xs opacity-70">
               {language === 'hi' ? 'साप्ताहिक वर्षा' : language === 'mr' ? 'साप्ताहिक पाऊस' : 'Weekly Rain'}
             </div>
             <div className="font-semibold">{Math.round(weather.totalWeeklyRainfall)}mm</div>
           </div>
         </div>
         <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
           <Thermometer className="h-5 w-5 text-emerald-400" />
           <div>
             <div className="text-xs opacity-70">
               {language === 'hi' ? 'आर्द्रता' : language === 'mr' ? 'आर्द्रता' : 'Humidity'}
             </div>
             <div className="font-semibold">{weather.current.humidity}%</div>
           </div>
         </div>
       </div>
     );
   }
 
   return (
     <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-200 overflow-hidden">
       <CardContent className="p-0">
         {/* Current Weather */}
         <div className="p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white">
           <div className="flex items-center gap-1 text-sm opacity-80 mb-2">
             <MapPin className="h-4 w-4" />
             {weather.city}, {weather.state}
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={fetchWeather}
               className="ml-auto text-white/80 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
             >
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
             <div className="flex items-center gap-1">
               <Droplets className="h-4 w-4" />
               {weather.current.humidity}%
             </div>
             <div className="flex items-center gap-1">
               <Wind className="h-4 w-4" />
               {Math.round(weather.current.windSpeed)} km/h
             </div>
             <div className="flex items-center gap-1">
               <CloudRain className="h-4 w-4" />
               {weather.current.precipitation}mm
             </div>
           </div>
         </div>
 
         {/* 7-Day Forecast */}
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
 
         {/* Farming Tips */}
         {weather.farmingTips.length > 0 && (
           <div className="px-4 pb-4">
             <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
               <AlertTriangle className="h-4 w-4 text-amber-500" />
               {language === 'hi' ? 'खेती सलाह' : language === 'mr' ? 'शेती सल्ला' : 'Farming Tips'}
             </h4>
             <div className="space-y-1">
               {weather.farmingTips.map((tip, i) => (
                 <Badge key={i} variant="secondary" className="text-xs mr-1 mb-1">
                   {tip}
                 </Badge>
               ))}
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }