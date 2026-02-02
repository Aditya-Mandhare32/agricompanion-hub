import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SoilData {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
  ec: number;
  moisture: number;
  texture: string;
  temperature: number;
  humidity: number;
  rainfall: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { soilData, language = "en" } = await req.json() as { soilData: SoilData; language: string };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageMap: Record<string, string> = {
      en: "English",
      hi: "Hindi (हिंदी)",
      mr: "Marathi (मराठी)"
    };

    const systemPrompt = `You are an expert agricultural soil scientist and agronomist. Analyze the soil data provided and generate comprehensive, farmer-friendly recommendations.

IMPORTANT: Respond ONLY in ${languageMap[language] || "English"} language. Use simple, easy-to-understand terms that farmers can follow.

You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "healthScore": number between 0-100,
  "healthStatus": "Healthy" | "Good" | "Needs Attention" | "Poor",
  "summary": "A 2-3 sentence farmer-friendly summary of soil health",
  "nutrientAnalysis": {
    "nitrogen": { "status": "Low" | "Optimal" | "High", "explanation": "brief explanation" },
    "phosphorus": { "status": "Low" | "Optimal" | "High", "explanation": "brief explanation" },
    "potassium": { "status": "Low" | "Optimal" | "High", "explanation": "brief explanation" }
  },
  "insights": ["insight 1", "insight 2", "insight 3"],
  "cropRecommendations": [
    { "crop": "name", "suitability": "High" | "Medium" | "Low", "expectedYield": "yield description", "confidence": number 0-100 }
  ],
  "fertilizerRecommendations": {
    "chemical": [{ "name": "fertilizer name", "dosage": "amount per hectare", "timing": "when to apply" }],
    "organic": [{ "name": "organic alternative", "dosage": "amount", "benefit": "why it helps" }]
  },
  "recoveryGuidance": [
    { "issue": "problem identified", "solution": "how to fix", "timeline": "expected recovery time" }
  ]
}`;

    const userPrompt = `Analyze this soil data and provide comprehensive recommendations:

Soil Parameters:
- pH Level: ${soilData.ph}
- Nitrogen (N): ${soilData.nitrogen} kg/ha
- Phosphorus (P): ${soilData.phosphorus} kg/ha
- Potassium (K): ${soilData.potassium} kg/ha
- Organic Carbon: ${soilData.organicCarbon}%
- Electrical Conductivity (EC): ${soilData.ec} dS/m
- Moisture: ${soilData.moisture}%
- Soil Texture: ${soilData.texture}
- Temperature: ${soilData.temperature}°C
- Humidity: ${soilData.humidity}%
- Rainfall: ${soilData.rainfall} mm

Provide analysis considering Indian farming conditions and local crop varieties.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API quota exceeded. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analyze soil error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
