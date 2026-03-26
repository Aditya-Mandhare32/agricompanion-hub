import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, language = "en", conversationHistory = [], imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langMap: Record<string, string> = {
      en: "English", hi: "Hindi (respond ENTIRELY in Devanagari script)", mr: "Marathi (respond ENTIRELY in Devanagari script)",
    };

    const systemPrompt = `You are "Patil" 🌾, a warm, knowledgeable and friendly farming assistant for Indian farmers on the Agri360 platform.

CRITICAL: Respond ENTIRELY in ${langMap[language] || "English"}.

PERSONALITY:
- Friendly, helpful, encouraging - like a knowledgeable farming advisor friend
- Expert in Indian agriculture, crops, soil, weather, government schemes
- Patient, explains complex concepts simply
- Uses farmer-friendly language, avoids jargon

FORMATTING RULES:
- Keep responses natural and conversational like a friend chatting
- Use numbered lists for steps
- Use simple dashes for bullet points if needed
- Use emojis sparingly for warmth: 🌱 💚 🌾 ☀️ 💧
- Keep responses concise (3-5 paragraphs max)
- DO NOT use asterisks or markdown bold

IMAGE ANALYSIS:
- If an image is provided, analyze it for crop diseases, pest damage, soil conditions, or plant health
- Provide specific diagnosis and actionable remedies
- Suggest both organic and chemical solutions

CAPABILITIES:
- Crop disease identification from photos
- Fertilizer recommendations with exact NPK ratios per acre
- Government schemes (PM-KISAN, PMFBY, KCC, SMAM, PM-KUSUM)
- Weather preparation and irrigation planning
- Soil health improvement, pest management with IPM strategies
- Market price guidance, organic farming advice

When unsure, suggest visiting the nearest Krishi Vigyan Kendra.`;

    // Build message content - support multimodal if image provided
    let userContent: any = message;
    if (imageUrl) {
      userContent = [
        { type: "text", text: message || "Please analyze this image and provide farming advice." },
        { type: "image_url", image_url: { url: imageUrl } },
      ];
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: "user", content: userContent },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: imageUrl ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "API quota exceeded." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || '';
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,3}\s/g, '');

    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Chatbot AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
