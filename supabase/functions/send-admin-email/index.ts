// Best-effort email sender for admin moderation actions.
// If the project has a Lovable Emails transactional template configured, this
// forwards the request to `send-transactional-email`. Otherwise it logs and
// returns 200 so callers don't fail — the in-app notification is the primary
// delivery channel.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, title, message } = await req.json();
    if (!email || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (SUPABASE_URL && SERVICE_KEY) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            templateName: 'agri360-account-notice',
            recipientEmail: email,
            idempotencyKey: `admin-${crypto.randomUUID()}`,
            templateData: { title, message },
          }),
        });
        if (!resp.ok) {
          console.warn('send-transactional-email returned', resp.status);
        }
      } catch (err) {
        console.warn('Transactional email not configured yet:', (err as Error).message);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-admin-email error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
