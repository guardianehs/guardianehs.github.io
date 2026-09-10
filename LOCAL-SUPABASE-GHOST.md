# Guardian local + Supabase + Ghost monitoring

This revision replaces the old Ghost SSE approach with a simpler pipeline:

`Ghost CMS webhook → Cloudflare WAF/Worker → Supabase Edge Function → ghost_events → Supabase Realtime → master monitor`

Supabase's local CLI stack and self-hosted stack both support Realtime; local development should remain bound to localhost. For production self-hosting, use Docker and put the gateway behind TLS/reverse proxy.

## 1. Local database

Install Docker and the Supabase CLI, then from the repository root:

```bash
supabase init
supabase start
supabase db reset
```

The migration in `supabase/migrations/202609110001_guardian_core.sql` creates the normalized Guardian core plus Ghost telemetry tables. It also adds `permit_requests`, `daily_entries`, and `ghost_events` to the Realtime publication.

## 2. Existing hosted Supabase

Create a migration from this file and run it with the Supabase CLI, or paste it into SQL Editor. Before applying it to a production database, take a backup and reconcile any existing policies/functions with the migration.

Do not put a `service_role`/secret key in the browser. The current repository's publishable key is okay for a browser client, but database access must be enforced by RLS.

## 3. Ghost webhook

Create a Ghost Custom Integration and add webhooks for at least:

- `post.published`
- `post.edited`
- `post.deleted`
- `member.added`
- `member.deleted`
- `site.changed`

Ghost sends webhook POST requests to your target URL. Use the Cloudflare Worker endpoint so the Supabase function itself is not the public ingress.

Set these Worker secrets:

```bash
wrangler secret put SUPABASE_FUNCTION_URL
wrangler secret put GUARDIAN_GHOST_WEBHOOK_SECRET
```

`SUPABASE_FUNCTION_URL` should be your deployed function URL, for example:
`https://<project-ref>.supabase.co/functions/v1/ghost-webhook`

Set the same `GUARDIAN_GHOST_WEBHOOK_SECRET` as the token embedded in the Ghost webhook path:
`https://monitor.example.com/ghost/<long-random-secret>`

Set the same secret in the Edge Function environment. Never use the publishable key as this secret.

## 4. Realtime monitor

Open `monitor/ghost-monitor.html` from the same authenticated Guardian origin, or deploy it beside the app. Only a `master` profile can read `ghost_events`.

The browser subscribes directly to Supabase Realtime; there is no SSE endpoint and no JWT passed through a URL.

## 5. Free WAF

Put the monitor/webhook hostname behind Cloudflare and use `cloudflare/WAF-RULES.md`. Cloudflare Free supports custom WAF rules and one rate-limiting rule, plus the Free Managed Ruleset.

## 6. Important fixes from the old implementation

- Removed `EventSource(..., {headers})`: browsers do not provide a portable authenticated-header EventSource API.
- Removed JWT query-string handoff to the admin panel.
- Removed browser writes to `ghost_events`; only the server-side webhook function can insert telemetry.
- Added Realtime subscription directly to `ghost_events`.
- Kept Ghost Admin API credentials server-side only.
- Separated Ghost CMS events from EHS operational tables.

## 7. Production topology

Recommended:

`Cloudflare → static app/monitor + webhook Worker → Supabase Edge Function → Supabase Postgres/Realtime`

If you self-host Supabase, run the official Docker stack and keep Postgres private. The official self-hosted stack includes Auth, PostgREST, Realtime, Storage, Edge Runtime and Studio.
