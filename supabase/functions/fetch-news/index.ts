import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Category detection by keywords (multi-language)
function detectCategory(text: string): "weather" | "government" | "market" | "crops" {
  const t = text.toLowerCase();
  if (/(weather|rain|monsoon|drought|flood|cyclone|temperature|forecast|मौसम|बारिश|पाऊस|हवामान)/i.test(t)) return "weather";
  if (/(government|scheme|subsidy|policy|minister|psf|msp|pm-kisan|सरकार|योजना|अनुदान|शासन)/i.test(t)) return "government";
  if (/(price|mandi|market|export|import|trade|rupee|कीमत|भाव|बाजार|मंडी)/i.test(t)) return "market";
  return "crops";
}

function farmerImpactLine(category: string, lang: string): string {
  const lines: Record<string, Record<string, string>> = {
    en: {
      weather: "🌧 Plan irrigation and harvesting accordingly.",
      government: "📋 Check eligibility and apply through your nearest center.",
      market: "💰 Track local mandi rates before selling.",
      crops: "🌱 Useful insight to improve your yield.",
    },
    hi: {
      weather: "🌧 सिंचाई और कटाई की योजना उसी अनुसार बनाएं।",
      government: "📋 पात्रता जांचें और नज़दीकी केंद्र पर आवेदन करें।",
      market: "💰 बेचने से पहले स्थानीय मंडी भाव देखें।",
      crops: "🌱 आपकी उपज बढ़ाने के लिए उपयोगी जानकारी।",
    },
    mr: {
      weather: "🌧 सिंचन व काढणीचे नियोजन त्यानुसार करा.",
      government: "📋 पात्रता तपासा आणि जवळच्या केंद्रावर अर्ज करा.",
      market: "💰 विक्रीपूर्वी स्थानिक बाजार भाव पाहा.",
      crops: "🌱 तुमचे उत्पन्न वाढवण्यासाठी उपयुक्त माहिती.",
    },
  };
  return (lines[lang] || lines.en)[category] || (lines[lang] || lines.en).crops;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language = "en", category = "all" } = await req.json();
    const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY");
    if (!GNEWS_API_KEY) throw new Error("GNEWS_API_KEY not configured");

    const langMap: Record<string, { lang: string; query: string; country: string }> = {
      en: { lang: "en", query: "(agriculture OR farming OR farmer OR crops OR mandi) AND India", country: "in" },
      hi: { lang: "hi", query: "कृषि OR खेती OR किसान OR फसल OR मंडी", country: "in" },
      mr: { lang: "mr", query: "शेती OR शेतकरी OR पीक OR बाजार", country: "in" },
    };
    const cfg = langMap[language] || langMap.en;

    const url = new URL("https://gnews.io/api/v4/search");
    url.searchParams.set("q", cfg.query);
    url.searchParams.set("lang", cfg.lang);
    url.searchParams.set("country", cfg.country);
    url.searchParams.set("max", "20");
    url.searchParams.set("sortby", "publishedAt");
    url.searchParams.set("apikey", GNEWS_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GNews error ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const articles = Array.isArray(json.articles) ? json.articles : [];

    const fallbackImages: Record<string, string> = {
      weather: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&q=80&fit=crop",
      government: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=400&q=80&fit=crop",
      market: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80&fit=crop",
      crops: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80&fit=crop",
    };

    let news = articles.map((a: any) => {
      const cat = detectCategory(`${a.title || ""} ${a.description || ""}`);
      return {
        title: a.title || "",
        description: a.description || a.content || "",
        url: a.url || "#",
        image: a.image || fallbackImages[cat],
        source: a.source?.name || "GNews",
        category: cat,
        region: "India",
        publishedAt: a.publishedAt || new Date().toISOString(),
        farmerImpact: farmerImpactLine(cat, language),
      };
    });

    if (category && category !== "all") {
      news = news.filter((n: any) => n.category === category);
    }

    return new Response(JSON.stringify({ news }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fetch news error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", news: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
