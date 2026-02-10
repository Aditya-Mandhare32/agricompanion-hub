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
    const { message, language = "en", conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langMap: Record<string, string> = {
      en: "English",
      hi: "Hindi (respond ENTIRELY in Devanagari script, like a friendly village elder)",
      mr: "Marathi (respond ENTIRELY in Devanagari script, like a helpful shetkari mitra)",
    };

    const systemPrompt = `You are "Patil" 🌾, a warm, knowledgeable farming friend from Maharashtra, India. You talk like a trusted neighbor who happens to know everything about agriculture.

CRITICAL: Respond ENTIRELY in ${langMap[language] || "English"}. 

Your personality:
- Warm, encouraging, uses farming metaphors
- Gives practical, actionable advice with specific quantities
- References Indian farming practices, local crop varieties, and government schemes
- Uses simple language a farmer would understand
- Occasionally uses emojis like 🌱 🌾 💧 ☀️
- Addresses the farmer as "bhai" (brother) or "dost" (friend) in Hindi, "dada" or "mitra" in Marathi
- Keeps responses concise (3-5 paragraphs max)

You can help with:
- Crop disease identification & organic/chemical remedies
- Fertilizer recommendations with exact NPK ratios and quantities per acre
- Government schemes (PM-KISAN, PMFBY, KCC, SMAM, PM-KUSUM, etc.)
- Weather preparation and irrigation planning
- Soil health improvement
- Market price guidance
- Pest management with IPM strategies
- Organic farming transition advice

When you don't know something specific, suggest visiting the nearest Krishi Vigyan Kendra or agriculture office.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chatbot AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
