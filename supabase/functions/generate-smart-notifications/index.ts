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
    const { userId, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's calendar events
    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("event_date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0])
      .lte("event_date", new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);

    // Fetch latest soil analysis
    const { data: soilAnalyses } = await supabase
      .from("saved_soil_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    // Fetch crop history
    const { data: cropHistory } = await supabase
      .from("crop_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch weather for user location
    const { data: profile } = await supabase
      .from("profiles")
      .select("location")
      .eq("user_id", userId)
      .maybeSingle();

    let weatherInfo = "";
    try {
      const weatherResp = await fetch(
        `${supabaseUrl}/functions/v1/get-weather`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ city: profile?.location?.split(",")[0]?.trim() || "Pune", language }),
        }
      );
      if (weatherResp.ok) {
        const wd = await weatherResp.json();
        weatherInfo = `Current: ${wd.current?.temperature}°C, Humidity: ${wd.current?.humidity}%, Weekly Rain: ${wd.totalWeeklyRainfall}mm. Forecast: ${wd.forecast?.slice(0, 3).map((d: any) => `${d.day}: ${d.temperature_max}°C, Rain: ${d.precipitation}mm`).join("; ")}`;
      }
    } catch {}

    const today = new Date().toISOString().split("T")[0];
    const missedTasks = (events || []).filter(
      (e) => e.event_date < today && !e.completed
    );
    const upcomingTasks = (events || []).filter(
      (e) => e.event_date >= today && e.event_date <= new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]
    );

    const langMap: Record<string, string> = {
      en: "English",
      hi: "Hindi (respond in Devanagari script)",
      mr: "Marathi (respond in Devanagari script)",
    };

    const prompt = `You are an AI farming assistant. Generate smart notifications for a farmer based on their data.

RESPOND ENTIRELY IN ${langMap[language] || "English"}.

Current Date: ${today}
Weather: ${weatherInfo || "Not available"}
Missed Tasks: ${JSON.stringify(missedTasks.map((e) => ({ crop: e.crop_name, type: e.event_type, date: e.event_date })))}
Upcoming Tasks: ${JSON.stringify(upcomingTasks.map((e) => ({ crop: e.crop_name, type: e.event_type, date: e.event_date, completed: e.completed })))}
Soil Analysis: ${soilAnalyses?.[0] ? JSON.stringify({ healthScore: (soilAnalyses[0].analysis_data as any)?.healthScore, status: (soilAnalyses[0].analysis_data as any)?.healthStatus }) : "None"}
Recent Crops: ${JSON.stringify(cropHistory?.map((c) => c.crop_name) || [])}

Generate a JSON array of notifications. Each notification:
{
  "title": "short title",
  "message": "actionable message with specific guidance",
  "type": "weather_alert" | "crop_risk" | "task_reminder" | "nutrient_alert" | "irrigation" | "daily_summary",
  "priority": "high" | "normal" | "low",
  "action_type": "mark_complete" | "view_calendar" | "view_soil" | "remind_later" | null,
  "action_data": {} or null
}

Rules:
1. If rain is expected, cancel/adjust irrigation reminders
2. If tasks are missed, warn about crop risk with corrective action
3. Include one daily summary notification
4. Generate 3-6 notifications total
5. Base alerts on actual crop stage and soil data
6. All text in target language

Return ONLY a valid JSON array, no markdown.`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API quota exceeded" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const cleanContent = content?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const notifications = JSON.parse(cleanContent);

    // Save to database
    const notifRecords = notifications.map((n: any) => ({
      user_id: userId,
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority || "normal",
      action_type: n.action_type || null,
      action_data: n.action_data || null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));

    await supabase.from("smart_notifications").insert(notifRecords);

    return new Response(JSON.stringify({ notifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Smart notifications error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
