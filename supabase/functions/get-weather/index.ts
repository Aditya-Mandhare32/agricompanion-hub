 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Indian city coordinates (lat, lon)
 const indianCities: Record<string, { lat: number; lon: number; state: string }> = {
   'pune': { lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
   'mumbai': { lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
   'nashik': { lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
   'nagpur': { lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
   'aurangabad': { lat: 19.8762, lon: 75.3433, state: 'Maharashtra' },
   'delhi': { lat: 28.6139, lon: 77.2090, state: 'Delhi' },
   'jaipur': { lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
   'indore': { lat: 22.7196, lon: 75.8577, state: 'Madhya Pradesh' },
   'bhopal': { lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh' },
   'hyderabad': { lat: 17.3850, lon: 78.4867, state: 'Telangana' },
   'bangalore': { lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
   'chennai': { lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
   'kolkata': { lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
   'lucknow': { lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
   'ahmedabad': { lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
   'chandigarh': { lat: 30.7333, lon: 76.7794, state: 'Chandigarh' },
   'patna': { lat: 25.5941, lon: 85.1376, state: 'Bihar' },
   'guntur': { lat: 16.3067, lon: 80.4365, state: 'Andhra Pradesh' },
   'vijayawada': { lat: 16.5062, lon: 80.6480, state: 'Andhra Pradesh' },
   'raipur': { lat: 21.2514, lon: 81.6296, state: 'Chhattisgarh' },
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { city = 'pune', language = 'en' } = await req.json();
     
     const cityKey = city.toLowerCase().replace(/[^a-z]/g, '');
     const coords = indianCities[cityKey] || indianCities['pune'];
     
     // Use Open-Meteo API (free, no API key required)
     const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Asia/Kolkata&forecast_days=7`;
     
     const response = await fetch(weatherUrl);
     
     if (!response.ok) {
       throw new Error(`Weather API error: ${response.status}`);
     }
     
     const data = await response.json();
     
     // Weather code descriptions
     const weatherCodes: Record<number, { en: string; hi: string; mr: string; icon: string }> = {
       0: { en: 'Clear sky', hi: 'साफ आसमान', mr: 'स्वच्छ आकाश', icon: 'sun' },
       1: { en: 'Mainly clear', hi: 'मुख्यतः साफ', mr: 'मुख्यतः स्वच्छ', icon: 'sun' },
       2: { en: 'Partly cloudy', hi: 'आंशिक बादल', mr: 'अंशतः ढगाळ', icon: 'cloud-sun' },
       3: { en: 'Overcast', hi: 'बादल छाए', mr: 'ढगाळ', icon: 'cloud' },
       45: { en: 'Foggy', hi: 'कोहरा', mr: 'धुके', icon: 'cloud-fog' },
       48: { en: 'Depositing fog', hi: 'घना कोहरा', mr: 'दाट धुके', icon: 'cloud-fog' },
       51: { en: 'Light drizzle', hi: 'हल्की बूंदाबांदी', mr: 'हलका रिमझिम', icon: 'cloud-drizzle' },
       53: { en: 'Moderate drizzle', hi: 'मध्यम बूंदाबांदी', mr: 'मध्यम रिमझिम', icon: 'cloud-drizzle' },
       55: { en: 'Dense drizzle', hi: 'तेज बूंदाबांदी', mr: 'दाट रिमझिम', icon: 'cloud-drizzle' },
       61: { en: 'Slight rain', hi: 'हल्की बारिश', mr: 'हलका पाऊस', icon: 'cloud-rain' },
       63: { en: 'Moderate rain', hi: 'मध्यम बारिश', mr: 'मध्यम पाऊस', icon: 'cloud-rain' },
       65: { en: 'Heavy rain', hi: 'तेज बारिश', mr: 'जोरदार पाऊस', icon: 'cloud-rain' },
       80: { en: 'Rain showers', hi: 'बौछारें', mr: 'सरी', icon: 'cloud-rain' },
       81: { en: 'Moderate showers', hi: 'मध्यम बौछारें', mr: 'मध्यम सरी', icon: 'cloud-rain' },
       82: { en: 'Violent showers', hi: 'तेज बौछारें', mr: 'जोरदार सरी', icon: 'cloud-rain' },
       95: { en: 'Thunderstorm', hi: 'तूफान', mr: 'वादळ', icon: 'cloud-lightning' },
       96: { en: 'Thunderstorm with hail', hi: 'ओलावृष्टि के साथ तूफान', mr: 'गारांसह वादळ', icon: 'cloud-lightning' },
       99: { en: 'Heavy thunderstorm', hi: 'भारी तूफान', mr: 'जोरदार वादळ', icon: 'cloud-lightning' },
     };
     
     const currentCode = data.current?.weather_code || 0;
     const currentWeather = weatherCodes[currentCode] || weatherCodes[0];
     
     // Build forecast array
     const forecast = data.daily?.time?.map((date: string, i: number) => ({
       date,
       maxTemp: data.daily.temperature_2m_max[i],
       minTemp: data.daily.temperature_2m_min[i],
       precipitation: data.daily.precipitation_sum[i],
       weatherCode: data.daily.weather_code[i],
       description: weatherCodes[data.daily.weather_code[i]]?.[language as keyof typeof weatherCodes[0]] || 
                    weatherCodes[data.daily.weather_code[i]]?.en || 
                    'Unknown',
       icon: weatherCodes[data.daily.weather_code[i]]?.icon || 'sun',
     })) || [];
     
     // Farming recommendations based on weather
     const farmingTips: string[] = [];
     const totalRainfall = forecast.reduce((sum: number, day: any) => sum + (day.precipitation || 0), 0);
     
     if (language === 'hi') {
       if (totalRainfall > 50) farmingTips.push('इस सप्ताह भारी बारिश की संभावना - सिंचाई रोकें');
       if (totalRainfall < 10 && data.current?.temperature_2m > 30) farmingTips.push('शुष्क और गर्म मौसम - सिंचाई बढ़ाएं');
       if (currentCode >= 95) farmingTips.push('तूफान की चेतावनी - खेत की सुरक्षा करें');
       if (data.current?.relative_humidity_2m > 80) farmingTips.push('उच्च आर्द्रता - कीट प्रकोप की निगरानी करें');
     } else if (language === 'mr') {
       if (totalRainfall > 50) farmingTips.push('या आठवड्यात जोरदार पाऊस - सिंचन थांबवा');
       if (totalRainfall < 10 && data.current?.temperature_2m > 30) farmingTips.push('कोरडे आणि गरम हवामान - सिंचन वाढवा');
       if (currentCode >= 95) farmingTips.push('वादळाचा इशारा - शेताचे संरक्षण करा');
       if (data.current?.relative_humidity_2m > 80) farmingTips.push('उच्च आर्द्रता - कीड प्रादुर्भावावर लक्ष ठेवा');
     } else {
       if (totalRainfall > 50) farmingTips.push('Heavy rainfall expected this week - pause irrigation');
       if (totalRainfall < 10 && data.current?.temperature_2m > 30) farmingTips.push('Dry and hot weather - increase irrigation');
       if (currentCode >= 95) farmingTips.push('Thunderstorm warning - protect field equipment');
       if (data.current?.relative_humidity_2m > 80) farmingTips.push('High humidity - monitor for pest outbreaks');
     }
     
     const result = {
       city: city.charAt(0).toUpperCase() + city.slice(1),
       state: coords.state,
       current: {
         temperature: data.current?.temperature_2m,
         humidity: data.current?.relative_humidity_2m,
         precipitation: data.current?.precipitation,
         windSpeed: data.current?.wind_speed_10m,
         description: currentWeather[language as keyof typeof currentWeather] || currentWeather.en,
         icon: currentWeather.icon,
       },
       forecast,
       farmingTips,
       totalWeeklyRainfall: totalRainfall,
     };
     
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("Weather error:", error);
     return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });