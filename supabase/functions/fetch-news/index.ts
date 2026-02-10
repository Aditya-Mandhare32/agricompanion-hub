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

    const prompt = `You are an Indian agriculture news aggregator. Generate 12 realistic, current agricultural news articles for Indian farmers as of ${today}.

RESPOND IN ${language === "hi" ? "Hindi (Devanagari)" : language === "mr" ? "Marathi (Devanagari)" : "English"}.

Each article must have real-world plausibility with actual scheme names, real crop names, real Indian locations.
${category !== "all" ? `Focus on category: ${category}` : "Mix across all categories."}

Return a JSON array:
[{
  "title": "headline",
  "description": "2-3 sentence summary",
  "url": "https://realistic-source-url.com/article-slug",
  "image": "unsplash URL relevant to topic (use https://images.unsplash.com/photo-ID?w=400)",
  "source": "real Indian ag news source name",
  "category": "weather|government|market|crops",
  "region": "Indian state/region",
  "farmerImpact": "one-line actionable tip for farmer with emoji",
  "publishedAt": "ISO date within last 3 days"
}]

Use these real Unsplash images:
- Weather: photo-1534088568595-a066f410bcda, photo-1504608524841-42fe6f032b4b, photo-1492011221367-f47e3ccd77a0
- Government: photo-1523292562811-8fa7962a78c8, photo-1450101499163-c8848c66ca85, photo-1554224155-6726b3ff858f
- Market: photo-1488459716781-31db52582fe9, photo-1542838132-92c53300491e, photo-1599488615731-7e5c2823ff28
- Crops: photo-1574323347407-f5e1ad6d020b, photo-1500382017468-9049fed747ef, photo-1523348837708-15d4a09cfac2

Return ONLY a valid JSON array.`;

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
    const content = data.choices?.[0]?.message?.content;
    const cleanContent = content?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const news = JSON.parse(cleanContent);

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
