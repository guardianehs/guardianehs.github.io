# Guardian — EHS Assistant

A single-file, client-side EHS assistant: incident triage, near miss, first aid,
risk assessment, compliance, and a digital **Permit to Work** (fill → AI review →
print). It works **offline out of the box** and can optionally connect to Claude,
any free/OpenAI-compatible LLM, or a local Ollama model.

Everything runs in the browser. No backend, no build step, no server. Any API key
you enter is stored only in your browser (`localStorage`) and is never committed to
the repo.

**This repository is the public marketing site.** The app and the admin console
are deployed separately, off GitHub Pages, because GitHub Pages cannot set
security headers or gate anything by credential — see `SETUP.md`, "Isolating
Admin and the app off GitHub Pages," for the full explanation and steps.

---

## What's in the repository

| File | What it is | Served to visitors |
|---|---|---|
| `index.html` | **Public home page** — what Guardian is, the AI, functions, use cases, development, docs, about, with a *Try Guardian* call to action | yes |
| `promo.html` | Self-playing animated tour | yes |
| `post.html` | Reads published journal articles straight from the database | yes |
| `sw.js` | Service worker for offline launch — must sit beside `index.html` | — |
| `og.png` | Social preview card for links shared on LinkedIn/WhatsApp | — |
| `robots.txt`, `sitemap.xml` | Search-engine indexing | — |
| `projects.html` | Modules, roadmap and future models | yes |
| `team.html` | Who builds Guardian, and open places | yes |
| `blog.html` + `post-*.html` | Blog index and posts | yes |
| `site.css` | Shared stylesheet for every public page | — |
| `img-*.png`, `blog-*.png` | Product images and post covers | — |
| `supabase-setup.sql` | Database schema, roles and policies — run in Supabase, never served | no |

**Not in this repository at all:** the app (`deploy/app/`) and the admin console
plus writing studio (`deploy/console/`) deploy to their own hosts. See `SETUP.md`.

**If your site address is not `guardianehs.github.io`,** find and replace that string in
`index.html` (canonical, Open Graph, Twitter tags), `sitemap.xml` and `robots.txt`.
Nothing else on this site hard-codes it — the promo CTA and the repository links
read the address at runtime. The app itself lives at its own address; find and
replace that separately if it changes (see `SETUP.md`).

---

## Realtime (live data across the team)

Run the **Realtime** section at the end of `supabase-setup.sql` once. After that,
signed-in members of the same organisation see changes as they happen:

- a permit decision reaches the requester's screen the moment it's taken;
- approvers get a notice when a new request arrives;
- a register day saved by one person appears for everyone else.

A green pulse on the sidebar badge means the live connection is up. Realtime obeys
the same row-level security policies, so a member still only ever receives rows they
are allowed to see. GitHub only ever serves the interface — every piece of live data
comes from your own database.

### Adding a blog post

Copy `post-offline-ehs.html`, change the text, the `<title>`, the description, the
canonical link and the JSON-LD block, then add an entry to the list in `blog.html`
and a `<url>` line in `sitemap.xml`. No build step, no framework.

---

## Getting indexed

1. Publish the site, then open **Google Search Console** → add a property for the
   site URL → verify (the HTML-file method works fine on GitHub Pages).
2. Submit `sitemap.xml`, and use **URL Inspection → Request indexing** for the home page.
3. Do the same at **Bing Webmaster Tools** if you want Bing/DuckDuckGo coverage.
4. Link to the site from places already indexed — your portfolio, LinkedIn, GitHub
   profile. Inbound links are what actually moves a new domain.

The home page already carries a descriptive title, meta description, canonical URL,
Open Graph and Twitter cards, and structured data (`SoftwareApplication`, `Person`
for Arun Williams, and an `FAQPage` matching the visible FAQ) so results can show
rich snippets.

---

## Deploy as a standalone site

Guardian is meant to stand on its own, separate from any personal portfolio.

### The naming rule (important)
A root-level GitHub Pages address — `something.github.io` — only works when the
**repository name exactly matches the account name**. So `guardian.github.io`
would require an account literally called `guardian`, and that one is long taken.
Two workable routes:

**Route 1 — a GitHub organization (free, recommended)**
1. GitHub → **+ → New organization** → Free plan. Pick an available name, e.g.
   `guardian-ehs`, `guardian-hsse`, `guardianehs`.
2. Inside that organization, create a **public** repo named exactly
   `<org-name>.github.io` (e.g. `guardian-ehs.github.io`).
3. Commit every file from this repository to the repo **root** — at minimum
   `index.html`, `sw.js`, `promo.html`, `og.png`, `robots.txt` and `sitemap.xml`.
   This repo is the marketing site only; the app and admin console deploy
   elsewhere (see `SETUP.md`).
4. **Settings → Pages** → Deploy from a branch → `main` / `/ (root)` → Save.
5. Live in ~1 minute at `https://<org-name>.github.io/`.

Organizations are the sanctioned way to run a second identity — GitHub's terms
allow only one free personal account per person, so don't create a second user.

**Route 2 — your own domain (the real standalone answer)**
Buy a domain (e.g. `guardian-ehs.app`), add a `CNAME` file containing just the
domain to the repo root, point DNS at GitHub Pages, then tick **Enforce HTTPS** in
Settings → Pages. This works with either a user or an organization repo and means
the address never has to change again.

### After the address changes — update these three
Moving off the old sub-path breaks sign-in until the new origin is registered:

1. **Supabase → Authentication → URL Configuration**
   - *Site URL*: `https://<new-address>/`
   - *Redirect URLs*: add `https://<new-address>/` and `https://<new-address>/*`
2. **Google Cloud → Credentials → your OAuth client**
   - *Authorized JavaScript origins*: `https://<new-address>`
   - *Authorized redirect URI* stays the Supabase callback — unchanged.
3. **Ollama users** (if you locked it down): `OLLAMA_ORIGINS=https://<new-address>`

Nothing inside the app hard-codes the address — it uses relative paths throughout,
and the promo page reads its own URL at runtime — so no code edit is needed.

### A bonus of moving to the root
At a sub-path, the service worker and app manifest are scoped to that folder. At
the site root, `sw.js` controls the whole origin and the installed app opens at
`/` — cleaner offline behaviour and a tidier home-screen install.

---

## Connecting a model (optional)

Open **Settings** (gear, bottom-left) and pick a provider. Use **Test connection**
to confirm it works before relying on it.

| Provider  | Cost        | Setup |
|-----------|-------------|-------|
| **Offline** (default) | Free | Nothing — built-in EHS reference library |
| **Claude** | Paid | Anthropic API key from console.anthropic.com |
| **Free LLM** | Free tiers | Any OpenAI-compatible API — **OpenRouter** (has `:free` models) or **Groq** (`https://api.groq.com/openai/v1`) |
| **Ollama** | Free, private, offline | Run a model locally (see below) |

### Running the local Ollama option
1. Install from https://ollama.com, then `ollama pull llama3.1`.
2. Start it so the browser is allowed to reach it:
   - macOS/Linux: `OLLAMA_ORIGINS='*' ollama serve`
   - Windows: set env var `OLLAMA_ORIGINS` = `*`, then relaunch Ollama.
   - To lock it down, use your site's origin instead of `*`, e.g.
     `OLLAMA_ORIGINS=https://<your-site-address>`.
3. In Settings → Ollama, Base URL `http://localhost:11434/v1` (or
   `http://127.0.0.1:11434/v1`), model `llama3.1`, then **Test connection**.

> A browser can reach `http://localhost` from an HTTPS Pages site in Chrome. If a
> request fails with *"Failed to fetch"*, it's almost always the `OLLAMA_ORIGINS`
> setting above. Note that any in-app/preview sandbox cannot reach your localhost —
> test on the deployed page.

---

## Optional: organization logins & cloud database (Supabase)

By default Guardian is fully client-side. To add **EHS Executive / Org Admin
logins**, a shared org **daily register**, and the **master admin panel**:

1. Create a free project at https://supabase.com.
2. SQL Editor → paste and run **`supabase-setup.sql`** (in this repo).
3. Dashboard → Authentication → **Add user** (your email + password), then run
   the "promote to master" line at the bottom of the SQL file with your email.
4. In `index.html`, fill `CLOUD={url:'…',anonKey:'…'}` with your project URL and
   the **anon public** key (Settings → API). The anon key is *designed* to be
   public — every permission is enforced by the row-level-security policies.
   **Never** put the `service_role` key in this repo or anywhere client-side.
5. Commit & push. The login screen now gates the app; the daily register syncs
   per organization; the master panel opens with **Ctrl+Shift+M** (or 5 quick
   clicks on the sidebar logo) — for master accounts only. Hidden UI is not the
   security boundary: non-master queries are refused by the database itself.

Provision team accounts in Supabase → Authentication; assign each user an
organization and role from the master panel after their first sign-in.

---

## Offline launch (service worker)

Commit **`sw.js`** to the same folder as `index.html`. After the first online
visit, Guardian installs itself and will open with no connection at all —
offline chat, permits, audits and the register keep working. Updates are
network-first: whenever the user is online, the newest pushed version loads;
the cached copy is used only when offline. Supabase traffic is never cached.

---

## Privacy
- No analytics, no tracking, no backend.
- API keys and your conversation stay in your browser only.
- Offline mode and the risk-matrix / permit tools need no connection at all.

## Note
Guardian is decision-support, not a substitute for a qualified professional,
site-specific procedures, or legal advice. Offline answers are concise
best-practice summaries — verify against the current regulation for your
jurisdiction.
