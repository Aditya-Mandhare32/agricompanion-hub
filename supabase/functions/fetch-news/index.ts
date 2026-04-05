import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language = "en", category = "all" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const today = new Date().toISOString().split("T")[0];

    const unsplashPhotos = {
      weather: [
        "photo-1534088568595-a066f410bcda", "photo-1504608524841-42fe6f032b4b",
        "photo-1492011221367-f47e3ccd77a0", "photo-1501630834273-4b5604d2ee31",
        "photo-1530908295418-a12e326966ba"
      ],
      government: [
        "photo-1523292562811-8fa7962a78c8", "photo-1450101499163-c8848c66ca85",
        "photo-1554224155-6726b3ff858f", "photo-1434030216411-0b793f4b4173",
        "photo-1541872703-74c5e44368f9"
      ],
      market: [
        "photo-1488459716781-31db52582fe9", "photo-1542838132-92c53300491e",
        "photo-1599488615731-7e5c2823ff28", "photo-1533900298318-6b8da08a523e",
        "photo-1526304640581-d334cdbbf45e"
      ],
      crops: [
        "photo-1574323347407-f5e1ad6d020b", "photo-1500382017468-9049fed747ef",
        "photo-1523348837708-15d4a09cfac2", "photo-1625246333195-78d9c38ad449",
        "photo-1464226184884-fa280b87c399"
      ],
    };

    const prompt = `You are an Indian agriculture news aggregator. Generate exactly 20 realistic, current agricultural news articles for Indian farmers as of ${today}.

RESPOND IN ${language === "hi" ? "Hindi (Devanagari)" : language === "mr" ? "Marathi (Devanagari)" : "English"}.

Each article must have real-world plausibility with actual scheme names, real crop names, real Indian locations. Each must be UNIQUE with different topics.
${category !== "all" ? `Focus on category: ${category}` : "Include 5 weather, 5 government, 5 market, 5 crops articles."}

Return ONLY a JSON array (no other text, no markdown):
[{"title":"headline","description":"2-3 sentence summary","url":"https://source.com/slug","image":"USE_PLACEHOLDER","source":"real Indian ag news source","category":"weather|government|market|crops","region":"Indian state","farmerImpact":"one-line tip with emoji","publishedAt":"ISO date within last 3 days"}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Robust JSON extraction - find the array
    let cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const firstBracket = cleanContent.indexOf("[");
    const lastBracket = cleanContent.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleanContent = cleanContent.substring(firstBracket, lastBracket + 1);
    }
    
    let news;
    try {
      news = JSON.parse(cleanContent);
    } catch {
      console.error("JSON parse failed, content:", cleanContent.substring(0, 200));
      news = [];
    }

    // Replace placeholder images with actual Unsplash URLs
    news = news.map((item: any, index: number) => {
      const cat = item.category || "crops";
      const photos = unsplashPhotos[cat as keyof typeof unsplashPhotos] || unsplashPhotos.crops;
      const photoId = photos[index % photos.length];
      return {
        ...item,
        image: `https://images.unsplash.com/${photoId}?w=400&q=80&fit=crop`,
      };
    });

    return new Response(JSON.stringify({ news }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fetch news error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
