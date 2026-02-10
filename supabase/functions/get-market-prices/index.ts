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
    const { language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const today = new Date().toISOString().split("T")[0];

    const prompt = `Generate realistic today's (${today}) Indian mandi/market vegetable prices as JSON array. Use actual current-season price ranges for major Indian markets.

${language === "hi" ? "Respond with Hindi names in Devanagari." : language === "mr" ? "Respond with Marathi names in Devanagari." : "Respond in English."}

Return 10 vegetables:
[{
  "name": "vegetable name",
  "name_hi": "Hindi name",
  "name_mr": "Marathi name",
  "price_min": number (₹/kg min),
  "price_max": number (₹/kg max),
  "unit": "kg",
  "trend": "up" | "down" | "stable",
  "change_percent": number (positive or negative),
  "image": "unsplash photo URL"
}]

Include: Tomato, Onion, Potato, Green Chili, Brinjal, Cauliflower, Cabbage, Lady Finger, Capsicum, Coriander.

Use these Unsplash images:
- Tomato: https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=200
- Onion: https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200
- Potato: https://images.unsplash.com/photo-1518977676601-b53f82ber3?w=200
- Green Chili: https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=200
- Brinjal: https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200
- Cauliflower: https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200
- Cabbage: https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=200
- Lady Finger: https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=200
- Capsicum: https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200
- Coriander: https://images.unsplash.com/photo-1592473735366-7a72de9a0ddb?w=200

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

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const cleanContent = content?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const prices = JSON.parse(cleanContent);

    return new Response(JSON.stringify({ prices, date: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market prices error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
