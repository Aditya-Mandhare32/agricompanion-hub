import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if crops already exist
    const { count } = await supabase.from("crops").select("*", { count: "exact", head: true });
    if (count && count > 0) {
      return new Response(JSON.stringify({ message: "Crops already populated", count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Generate a JSON array of 25 Indian crops with real agricultural data. Each crop object:
{
  "name": "English name",
  "name_hi": "Hindi name in Devanagari",
  "name_mr": "Marathi name in Devanagari",
  "category": "Vegetables|Fruits|Pulses|Cereals|Oilseeds|Flowers|Cash Crops|Fodder",
  "season": "Kharif|Rabi|Zaid|Year-round",
  "duration_days": number,
  "min_ph": number, "max_ph": number,
  "min_nitrogen": number, "max_nitrogen": number,
  "min_phosphorus": number, "max_phosphorus": number,
  "min_potassium": number, "max_potassium": number,
  "ideal_temperature_min": number, "ideal_temperature_max": number,
  "water_needs": "Low|Medium|High",
  "soil_types": ["array of suitable soil types"],
  "cost_per_acre": number in INR,
  "expected_yield_per_acre": "e.g. 15-20 quintals",
  "market_price_range": "e.g. ₹2000-3500/quintal",
  "profit_potential": "Low|Medium|High|Very High",
  "growing_guide": {
    "land_preparation": "step",
    "sowing": "step",
    "irrigation": "schedule",
    "fertilizer_schedule": [{"stage": "name", "fertilizer": "type", "quantity": "amount"}],
    "pest_management": "tips",
    "harvesting": "when and how"
  },
  "expert_tips": ["tip1", "tip2", "tip3"],
  "image_url": "https://images.unsplash.com/photo-... relevant crop image"
}

Include: Rice, Wheat, Maize, Cotton, Sugarcane, Soybean, Groundnut, Tomato, Onion, Potato, Chickpea, Mustard, Turmeric, Chili, Brinjal, Banana, Mango, Grapes, Pomegranate, Jowar, Bajra, Sunflower, Marigold, Napier Grass, Tea.

Use REAL agricultural data from Indian agronomy standards. Accurate pH ranges, NPK requirements, cost estimates in INR, and real yield ranges.

Return ONLY the JSON array.`;

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
    const crops = JSON.parse(cleanContent);

    const { error } = await supabase.from("crops").insert(crops);
    if (error) throw error;

    return new Response(JSON.stringify({ message: "Crops populated", count: crops.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Populate crops error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
