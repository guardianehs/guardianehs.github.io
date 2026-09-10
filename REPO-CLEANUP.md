# Guardian repository cleanup

The repository now has one canonical implementation for each area:

- `index.html` — public home page
- `web/` — web UI, assistant assets and public pages
- `app/` — authenticated Guardian application
- `monitor/` — Ghost realtime monitor
- `supabase/` — database migrations and Edge Functions
- `cloudflare/` — WAF/Worker configuration

Legacy public URLs such as `/blog.html`, `/projects.html` and `/app.html` are now tiny compatibility redirects. The full page source is no longer duplicated at the repository root.

Removed upload-conflict duplicates include:
`404 (12).html`, `app (11).html`, `blog (1).html`, `README (16).md`, `README (8).md`, `ghost-integration-ehs (14).js`, `guardian-cloud-config (10).js`, `index (13).html`, `post (2).html`, `post-bengaluru-garbage (3).html`, `post-offline-ehs (4).html`, `post-permit-workflow (5).html`, `projects (6).html`, `promo (7).html`, `sw (15).js`, and `team (9).html`.

The old scattered copies of the assistant, Ghost integration, cloud config, worker, home assets and safety graph SQL were also removed in favor of their canonical locations under `web/`, `app/`, `cloudflare/` and `supabase/`.
