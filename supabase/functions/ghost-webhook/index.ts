import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'content-type': 'application/json', 'cache-control': 'no-store' };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({error:'method_not_allowed'}), {status:405,headers:cors});

  const secret = Deno.env.get('GUARDIAN_GHOST_WEBHOOK_SECRET') || '';
  const provided = req.headers.get('x-guardian-ghost-secret') || '';
  if (!secret || provided !== secret) return new Response(JSON.stringify({error:'unauthorized'}), {status:401,headers:cors});

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({error:'invalid_json'}), {status:400,headers:cors}); }

  const event = String(body?.event || body?.type || 'unknown');
  const eventId = String(body?.id || body?.webhook_id || `${event}:${crypto.randomUUID()}`);
  const severity = event.includes('deleted') ? 'medium' : event.includes('published') ? 'low' : 'info';
  const url = String(body?.post?.url || body?.page?.url || body?.site?.url || '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await supabase.from('ghost_events').upsert({
    source: 'ghost', event, event_id: eventId, target_url: url || null,
    severity, action: 'webhook', score: severity==='medium' ? 30 : severity==='low' ? 10 : 0,
    user_agent: req.headers.get('user-agent'),
    payload: body,
  }, { onConflict: 'source,event_id' });

  if (error) return new Response(JSON.stringify({error:error.message}), {status:500,headers:cors});
  return new Response(JSON.stringify({ok:true,event,event_id:eventId}), {status:202,headers:cors});
});
