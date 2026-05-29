import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Mode = "daily" | "upcoming" | "weekly" | "user";

const t = (lang: string, en: string, hi: string, mr: string) =>
  lang === "hi" ? hi : lang === "mr" ? mr : en;

async function insertIfNew(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  type: string,
  dedupeKey: string,
  payload: Record<string, unknown>,
) {
  const since = new Date(Date.now() - 18 * 3600 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("smart_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("dismissed", false)
    .gte("created_at", since)
    .ilike("action_data->>dedupeKey", dedupeKey)
    .limit(1);
  if (existing && existing.length > 0) return;
  await supabase.from("smart_notifications").insert({
    user_id: userId,
    type,
    ...payload,
    action_data: { ...(payload.action_data ?? {}), dedupeKey },
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
}

async function processUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  language: string,
  mode: Mode,
) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // ---- CALENDAR EVENTS ----
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId);

  const todays = (events || []).filter((e) => e.event_date === today && !e.completed);
  const overdue = (events || []).filter((e) => e.event_date < today && !e.completed);
  const upcoming = (events || []).filter((e) => e.event_date === tomorrow && !e.completed);

  if ((mode === "daily" || mode === "user") && todays.length > 0) {
    const list = todays.map((e) => `${e.crop_name} – ${e.event_type}`).join(", ");
    await insertIfNew(supabase, userId, "task_today", `today-${today}`, {
      title: t(language, "Tasks Today", "आज के काम", "आजची कामे"),
      message: `${todays.length} ${t(language, "task(s) scheduled:", "कार्य निर्धारित हैं:", "कामे नियोजित आहेत:")} ${list}`,
      priority: "high",
      action_type: "view_calendar",
    });
  }

  if (mode === "upcoming" || mode === "daily" || mode === "user") {
    for (const e of overdue.slice(0, 3)) {
      await insertIfNew(supabase, userId, "overdue", `overdue-${e.id}`, {
        title: t(language, "Overdue Task", "बकाया कार्य", "रखडलेले काम"),
        message: `${e.event_type} – ${e.crop_name} (${e.event_date})`,
        priority: "high",
        action_type: "view_calendar",
      });
    }
    for (const e of upcoming.slice(0, 3)) {
      await insertIfNew(supabase, userId, "upcoming_activity", `upcoming-${e.id}`, {
        title: t(language, "Upcoming Activity", "आगामी गतिविधि", "आगामी क्रियाकलाप"),
        message: t(language,
          `Tomorrow: ${e.event_type} for ${e.crop_name}`,
          `कल: ${e.crop_name} के लिए ${e.event_type}`,
          `उद्या: ${e.crop_name} साठी ${e.event_type}`),
        priority: "normal",
        action_type: "view_calendar",
      });
    }
  }

  // ---- HARVEST COMING (within 7 days) ----
  if (mode === "daily" || mode === "user") {
    const { data: crops } = await supabase
      .from("crop_history")
      .select("*")
      .eq("user_id", userId)
      .not("expected_harvest_date", "is", null)
      .gte("expected_harvest_date", today)
      .lte("expected_harvest_date", in7);
    for (const c of crops || []) {
      await insertIfNew(supabase, userId, "harvest_coming", `harvest-${c.id}`, {
        title: t(language, "Harvest Coming", "कटाई आ रही है", "कापणी जवळ आली"),
        message: t(language,
          `${c.crop_name} harvest on ${c.expected_harvest_date}`,
          `${c.crop_name} कटाई ${c.expected_harvest_date} को`,
          `${c.crop_name} कापणी ${c.expected_harvest_date} रोजी`),
        priority: "normal",
        action_type: "view_calendar",
      });
    }
  }

  // ---- WEEKLY SUMMARY ----
  if (mode === "weekly") {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const weekEvents = (events || []).filter((e) => e.event_date >= weekAgo && e.event_date <= today);
    const completed = weekEvents.filter((e) => e.completed).length;
    const pending = weekEvents.filter((e) => !e.completed).length;
    await insertIfNew(supabase, userId, "weekly_summary", `week-${today}`, {
      title: t(language, "Weekly Farm Summary", "साप्ताहिक खेत सारांश", "साप्ताहिक शेत सारांश"),
      message: t(language,
        `Completed: ${completed} • Pending: ${pending}`,
        `पूर्ण: ${completed} • बाकी: ${pending}`,
        `पूर्ण: ${completed} • प्रलंबित: ${pending}`),
      priority: "normal",
      action_type: "view_calendar",
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: Mode = body.mode ?? "user";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (mode === "user") {
      const { userId, language = "en" } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await processUser(supabase, userId, language, "user");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch mode: iterate every profile
    const { data: profiles } = await supabase.from("profiles").select("user_id, language");
    let count = 0;
    for (const p of profiles || []) {
      try {
        await processUser(supabase, p.user_id, p.language || "en", mode);
        count++;
      } catch (e) {
        console.error(`processUser failed for ${p.user_id}:`, e);
      }
    }
    return new Response(JSON.stringify({ ok: true, mode, processed: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-smart-notifications error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
