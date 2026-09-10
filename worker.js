/**
 * Guardian Ghost webhook edge proxy.
 * Deploy with a route such as https://monitor.example.com/ghost/<secret>.
 * Keep SUPABASE_FUNCTION_URL and GUARDIAN_GHOST_WEBHOOK_SECRET as Worker secrets.
 * This intentionally exposes no Supabase service key to Ghost or the browser.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || !url.pathname.startsWith('/ghost/')) {
      return new Response('Not found', {status:404});
    }
    const token = url.pathname.split('/')[2] || '';
    if (!token || token !== env.GUARDIAN_GHOST_WEBHOOK_SECRET) {
      return new Response('Unauthorized', {status:401});
    }
    const target = env.SUPABASE_FUNCTION_URL;
    if (!target) return new Response('Misconfigured', {status:500});
    const body = await request.arrayBuffer();
    if (body.byteLength > 1024 * 1024) return new Response('Payload too large', {status:413});
    const upstream = await fetch(target, {
      method:'POST',
      headers:{
        'content-type': request.headers.get('content-type') || 'application/json',
        'x-guardian-ghost-secret': env.GUARDIAN_GHOST_WEBHOOK_SECRET,
      },
      body,
    });
    return new Response(upstream.body, {status:upstream.status, headers:{'content-type':'application/json'}});
  }
};
