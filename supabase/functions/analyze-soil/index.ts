import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      hi: "Hindi (हिंदी) - respond completely in Hindi using Devanagari script",
      mr: "Marathi (मराठी) - respond completely in Marathi using Devanagari script"
    };

    const systemPrompt = `You are an expert agricultural soil scientist and agronomist specializing in Indian farming conditions. Analyze the soil data provided and generate comprehensive, actionable, farmer-friendly recommendations.

CRITICAL: Your ENTIRE response must be in ${languageMap[language] || "English"} language. Every single field, explanation, crop name, and guidance must be in the target language. Use simple, easy-to-understand terms that farmers can follow.

For Hindi: Use complete Hindi with Devanagari script (e.g., "गेहूं" not "Wheat", "नाइट्रोजन की कमी" not "Nitrogen deficiency")
For Marathi: Use complete Marathi with Devanagari script (e.g., "गहू" not "Wheat", "नायट्रोजनची कमतरता" not "Nitrogen deficiency")

You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "healthScore": number between 0-100,
  "healthStatus": "Healthy" | "Good" | "Needs Attention" | "Poor",
  "summary": "A 2-3 sentence farmer-friendly summary of soil health in target language",
  "nutrientAnalysis": {
    "nitrogen": { "status": "Low" | "Optimal" | "High", "explanation": "brief explanation in target language" },
    "phosphorus": { "status": "Low" | "Optimal" | "High", "explanation": "brief explanation in target language" },
    "potassium": { "status": "Low" | "Optimal" | "High", "explanation": "brief explanation in target language" }
  },
  "insights": ["actionable insight 1 in target language", "actionable insight 2", "actionable insight 3"],
  "problemsDetected": [
    {
      "problem": "Soil problem detected in target language",
      "whyItAffects": "Why it affects crop growth - simple farmer-friendly explanation",
      "solution": "Recommended solution with specific quantities (e.g., Apply lime: 200-400 kg per acre)",
      "applicationMethod": "How to apply - step by step",
      "bestTimeToApply": "When to apply",
      "expectedImprovement": "Expected improvement in yield or soil health"
    }
  ],
  "cropRecommendations": [
    { 
      "crop": "crop name in target language", 
      "suitability": "High" | "Medium" | "Low", 
      "expectedYield": "yield description in target language with quantities per acre/hectare", 
      "confidence": number 0-100,
      "category": "Vegetables" | "Fruits" | "Pulses" | "Cereals" | "Oilseeds" | "Flowers" | "Cash Crops" | "Fodder"
    }
  ],
  "fertilizerRecommendations": {
    "chemical": [{ "name": "fertilizer name in target language", "dosage": "specific amount per acre (e.g., 50 kg/acre)", "timing": "when to apply in target language" }],
    "organic": [{ "name": "organic alternative name in target language", "dosage": "specific amount (e.g., 2-3 tons per acre)", "benefit": "why it helps in target language" }]
  },
  "recoveryGuidance": [
    { "issue": "problem identified in target language", "solution": "detailed actionable fix with quantities in target language", "timeline": "expected recovery time in target language" }
  ]
}

IMPORTANT GUIDELINES:
1. Recommend crops across multiple categories: Vegetables, Fruits, Pulses, Cereals, Oilseeds, Flowers, Cash Crops, Fodder, Millets, Medicinal - not just vegetables
2. Include at least 8-10 crop recommendations across different categories
3. Provide specific quantities in farmer-friendly units (kg/acre, tons/acre, bags/acre)
4. For fertilizers, specify exact NPK ratios and brand names if applicable
5. Recovery guidance should include both chemical and organic solutions
6. All text must be in the target language including crop names, fertilizer names, and all explanations
7. Base recommendations on ICAR verified agricultural data and Indian agronomy standards
8. Match crop suitability with the provided soil NPK, pH, temperature, humidity and rainfall values
9. Use real cost estimates and yield ranges from Indian agricultural data
10. Consider the soil texture when recommending crops`;

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

 Provide analysis considering Indian farming conditions and local crop varieties. Remember to respond ENTIRELY in ${languageMap[language] || "English"}.`;

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
