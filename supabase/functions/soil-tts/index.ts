import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // For multilingual TTS, we'll use Lovable AI to generate speech-ready text
    // and then convert it using a simple approach
    const languageConfig: Record<string, { voice: string; prompt: string }> = {
      en: { 
        voice: "en-US", 
        prompt: "Speak clearly and naturally for a farmer audience." 
      },
      hi: { 
        voice: "hi-IN", 
        prompt: "बोलें स्पष्ट और सरल भाषा में किसानों के लिए।" 
      },
      mr: { 
        voice: "mr-IN", 
        prompt: "शेतकऱ्यांसाठी स्पष्ट आणि सोप्या भाषेत बोला।" 
      },
    };

    const config = languageConfig[language] || languageConfig.en;

    // Generate a spoken version of the text using AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: `You are a helpful agricultural advisor. Convert the following soil analysis report into a natural, spoken explanation suitable for text-to-speech. ${config.prompt} Keep it concise but informative. Respond only with the spoken text, no additional formatting.` 
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const spokenText = data.choices?.[0]?.message?.content || text;

    return new Response(JSON.stringify({ 
      spokenText,
      language: config.voice 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
