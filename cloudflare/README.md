# Cloudflare Worker

```bash
npm i -g wrangler
wrangler login
wrangler secret put SUPABASE_FUNCTION_URL
wrangler secret put GUARDIAN_GHOST_WEBHOOK_SECRET
wrangler deploy
```

Route the Worker on a Cloudflare-managed hostname. Keep the long random webhook secret out of Git.
