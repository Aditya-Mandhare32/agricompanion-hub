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
      hi: "Hindi (respond ENTIRELY in Devanagari script)",
      mr: "Marathi (respond ENTIRELY in Devanagari script)",
    };

    const systemPrompt = `You are "AI Assist" 🌾, a knowledgeable and friendly farming assistant for Indian farmers.

CRITICAL: Respond ENTIRELY in ${langMap[language] || "English"}.

FORMATTING RULES - VERY IMPORTANT:
- DO NOT use asterisks (*) or markdown bold (**) anywhere in your response
- DO NOT use bullet points with asterisks
- Use numbered lists (1. 2. 3.) for steps
- Use simple dashes (-) for bullet points if needed
- Use clear paragraph breaks for readability
- Keep responses clean, natural and conversational like a knowledgeable friend
- Use emojis sparingly: 🌱 🌾 💧 ☀️ 📋

Your personality:
- Warm, encouraging, practical
- Gives specific quantities and actionable advice
- References Indian farming practices, local crop varieties, and government schemes
- Uses simple language farmers understand
- Addresses the farmer warmly in their language
- Keeps responses concise (3-5 paragraphs max)

You can help with:
- Crop disease identification and remedies (organic + chemical)
- Fertilizer recommendations with exact NPK ratios per acre
- Government schemes (PM-KISAN, PMFBY, KCC, SMAM, PM-KUSUM)
- Weather preparation and irrigation planning
- Soil health improvement
- Market price guidance
- Pest management with IPM strategies
- Organic farming transition advice

When you don't know something, suggest visiting the nearest Krishi Vigyan Kendra.`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API quota exceeded." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || '';
    
    // Clean up any remaining markdown artifacts
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,3}\s/g, '');

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chatbot AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
