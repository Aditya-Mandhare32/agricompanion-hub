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

    const systemPrompt = `You are an expert agricultural soil scientist for Indian farmers. Analyze soil data and return JSON only (no markdown).

LANGUAGE RULE — STRICT:
Target language: ${languageMap[language] || "English"}.
EVERY user-visible string MUST be in the target language, including:
  - summary, insights[]
  - nutrientAnalysis.*.explanation
  - problemsDetected[].problem, whyItAffects, solution, applicationMethod, bestTimeToApply, expectedImprovement
  - cropRecommendations[].crop (translate crop names: Rice→चावल/भात, Cotton→कपास/कापूस, Wheat→गेहूं/गहू, Soybean→सोयाबीन, Ginger→अदरक/आले, etc.) and expectedYield (translate "20-25 quintals per acre" → "२०-२५ क्विंटल प्रति एकड़" / "२०-२५ क्विंटल प्रति एकर")
  - fertilizerRecommendations.chemical[].name, dosage, timing
  - fertilizerRecommendations.organic[].name, dosage, benefit
  - recoveryGuidance[].issue, solution, timeline

ONLY these enum tokens MUST stay exact English (the UI maps them):
  - healthStatus: "Healthy" | "Good" | "Needs Attention" | "Poor"
  - nutrientAnalysis.*.status: "Low" | "Optimal" | "High"
  - cropRecommendations[].suitability: "High" | "Medium" | "Low"
  - cropRecommendations[].category: "Vegetables" | "Fruits" | "Pulses" | "Cereals" | "Oilseeds" | "Flowers" | "Cash Crops" | "Fodder"

JSON SHAPE:
{
  "healthScore": 0-100,
  "healthStatus": <enum>,
  "summary": "2-3 sentences (target language)",
  "nutrientAnalysis": {
    "nitrogen":   { "status": <enum>, "explanation": "(target language)" },
    "phosphorus": { "status": <enum>, "explanation": "(target language)" },
    "potassium":  { "status": <enum>, "explanation": "(target language)" }
  },
  "insights": ["(target language)", ...],
  "problemsDetected": [
    {
      "problem": "(target language) e.g. for Marathi: 'मातीची आम्लता (कमी pH 5.6)'",
      "whyItAffects": "(target language)",
      "solution": "(target language with quantities)",
      "applicationMethod": "(target language step by step)",
      "bestTimeToApply": "(target language)",
      "expectedImprovement": "(target language)"
    }
  ],
  "cropRecommendations": [
    { "crop": "(target language crop name)", "suitability": <enum>, "expectedYield": "(target language with quantities per acre)", "confidence": 0-100, "category": <enum> }
  ],
  "fertilizerRecommendations": {
    "chemical": [{ "name": "(target language)", "dosage": "(target language e.g. ५० किलो/एकर)", "timing": "(target language)" }],
    "organic":  [{ "name": "(target language)", "dosage": "(target language)", "benefit": "(target language)" }]
  },
  "recoveryGuidance": [
    { "issue": "(target language)", "solution": "(target language)", "timeline": "(target language)" }
  ]
}

GUIDELINES:
1. Include 8-10 crop recommendations across multiple categories.
2. Provide specific quantities in farmer-friendly units (kg/acre, tons/acre).
3. Base on ICAR data and Indian agronomy.
4. Match crops to soil NPK, pH, temperature, humidity, rainfall.
5. Do NOT leave any string field in English when the target language is Hindi or Marathi.`;

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
