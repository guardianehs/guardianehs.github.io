# Guardian — steps to reproduce

A complete run from an empty GitHub account to a working site with live data.
Roughly 30 minutes. Do the steps in order; each one is verifiable before moving on.

Placeholders used below:
- `<ORG>` — your GitHub organization name (example: `guardianehs`)
- `<SITE>` — the resulting address (example: `https://guardianehs.github.io`)
- `<YOU>` — your email address

---

## Stage 1 · Publish the site (10 min)

**1.1 Create the organization.**
GitHub → **+** (top right) → **New organization** → **Free**. Name it `<ORG>`.
This is required: a root address only works when the *owner account* name matches
the repository name. A repo called `guardianehs.github.io` sitting under a personal
account becomes `username.github.io/guardianehs.github.io/` instead.

**1.2 Create the repository.**
Inside the organization → **New repository** → name it exactly `<ORG>.github.io` →
**Public** → Create.

> Already made the repo under your personal account? Don't rename it — transfer it:
> repo → **Settings → General → Danger Zone → Transfer ownership** → new owner `<ORG>`.
> Pages resets on transfer, so redo step 1.4.

**1.3 Add the files.** This repository is the **marketing site only** — commit
these to the repository **root** (not a subfolder):

| File | Purpose |
|---|---|
| `index.html` | Public home page |
| `promo.html` | Animated tour |
| `post.html` | Reads published journal articles from the database |
| `projects.html`, `team.html`, `blog.html`, `post-permit-workflow.html`, `post-offline-ehs.html` | Site pages |
| `site.css` | Shared stylesheet |
| `sw.js` | Offline launch for the marketing pages |
| `og.png`, `img-*.png`, `blog-*.png` | Images |
| `robots.txt`, `sitemap.xml` | Indexing |
| `supabase-setup.sql`, `README.md`, `SETUP.md` | Reference, never served |

The app and the admin console deploy **separately, off GitHub Pages** — that's
its own step, in "Isolating Admin and the app off GitHub Pages" further down
this document. Do that step before Stage 3, since the app is where you'll sign
in to test everything that follows.

**1.4 Turn on Pages.**
Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch `main`,
Folder `/ (root)` → **Save**.

**✅ Check:** after ~1 minute, `<SITE>/` shows the home page. The **Try Guardian**
button won't work correctly yet — it points at the app's own address, which
you'll set up next.

---

## Stage 2 · Replace the placeholders (5 min)

**2.1 Your address.** If `<ORG>` is not `guardianehs`, find and replace
`guardianehs.github.io` with your address in:
`index.html`, `projects.html`, `team.html`, `blog.html`,
`post-permit-workflow.html`, `post-offline-ehs.html`, `sitemap.xml`, `robots.txt`.
(These are canonical, Open Graph and sitemap URLs. The app, the promo CTA and the
repository links read the address at runtime and need no edit.)

**2.2 Your contact address.** Replace `CHANGE-ME@example.com` in
`index.html`, `projects.html`, `team.html`, `blog.html`, and the `SUPPORT_EMAIL`
constant in the app itself (`deploy/app/index.html`).

**✅ Check:** search the repo for `CHANGE-ME` — no results.

---

## Stage 3 · Database and accounts (10 min)

Everything so far runs with no backend. This stage adds sign-in, duty roles,
shared data and live updates. Skip it if you only want the standalone tool.

**3.1 Create the project.** [supabase.com](https://supabase.com) → **New project** →
free plan → nearest region (`ap-south-1` for India). Save the database password.

**3.2 Run the schema.** **SQL Editor → New query** → paste **all** of
`supabase-setup.sql` → **Run**. Expect *"Success. No rows returned."*
The file is re-runnable and installs, in order: core schema and policies → admin PIN
→ evidence storage → permit approval workflow → duty roles and SME review →
job titles → optional default admin → realtime.

**3.3 Connect the app.** **Project Settings → API** → copy the **Project URL** and the
**publishable** (anon) key. Put both into the `CLOUD` constant near the top of the
script in **both** `deploy/app/index.html` and `deploy/console/admin.html` (and
`deploy/console/studio.html`, which shares the app's config format):

```js
const CLOUD={url:'https://YOURPROJECT.supabase.co', anonKey:'sb_publishable_…'};
```

Never use the `service_role` / secret key — it must stay inside Supabase.
The publishable key is designed to be public; the row-level policies are the guard.

**3.4 Allow sign-ins.** **Authentication → Sign In / Providers → Email** →
enable the provider, turn **Allow new users to sign up** ON (the admin console
creates accounts through it), and turn **Confirm email** OFF so new users can sign in
immediately.

**3.5 Set the return addresses.** **Authentication → URL Configuration** →
*Site URL* `<SITE>/` and add `<SITE>/` plus `<SITE>/*` to *Redirect URLs*.
Skipping this is what sends sign-ins back to `localhost`.

**3.6 Create your master account.** **Authentication → Users → Add user →
Create new user** → `<YOU>` + password → tick **Auto confirm user**. Then in the
**SQL Editor**:

```sql
update public.profiles set role='master', title='Master Admin'
  where id = (select id from auth.users where email='<YOU>');
```

Expect *"1 row updated"*. If it says 0, sign in once at your app address first
(that creates the profile), then re-run.

**✅ Check:** open your console address, sign in, and you're asked to **create an
admin PIN** (6+ characters). Set it and the console opens with four counters.

---

## Stage 4 · Set up your organisation (5 min)

**4.1 Create the organisation.** Admin console → **Users & organizations** →
**+ New** → name it.

**4.2 Add people.** Same tab → **Add user** → name, email, temporary password,
job title, organisation → **Create**. The title sets the duty automatically:

| Job title | Duty |
|---|---|
| EHS Officer · Permit Holder · Site Engineer | Requester |
| SME | SME reviewer |
| Project Manager | Verifier & issuer |
| Other | Viewer (dashboard only) |

**4.3 Assign yourself an organisation** too, so your own dashboard has data.

**✅ Check the whole loop:** sign in as a requester in one browser and as yourself
in another. Fill a permit → **Submit for approval**. The approver's screen shows a
notice and the pending count **without refreshing**; approve it, and the requester's
status chip turns green on the spot. That's realtime working.

---

## Stage 5 · Google sign-in (optional, 10 min)

**5.1** [console.cloud.google.com](https://console.cloud.google.com) → create a project →
**APIs & Services → OAuth consent screen** → External → app name, your email → save.
If publishing status stays **Testing**, add yourself under **Test users** or click
**Publish app**, otherwise Google blocks everyone else.

**5.2 Credentials → Create credentials → OAuth client ID → Web application:**
- Authorized JavaScript origins: `<SITE>`
- Authorized redirect URI: `https://YOURPROJECT.supabase.co/auth/v1/callback`

Copy the Client ID **and** secret from the dialog at the same moment — a mismatched
pair is the usual cause of *"Unable to exchange external code"*.

**5.3** Supabase → **Authentication → Sign In / Providers → Google** → enable →
paste both → Save. No redeploy needed; test the button.

---

## Stage 6 · Get indexed (5 min)

1. **Google Search Console** → add a property for `<SITE>` → verify (HTML file method
   works on Pages) → submit `sitemap.xml` → **URL Inspection → Request indexing** on
   the home page.
2. Repeat at **Bing Webmaster Tools** for Bing and DuckDuckGo.
3. Link to `<SITE>` from your portfolio, LinkedIn and GitHub profile. Inbound links
   are what actually move a new site.

The pages already carry titles, descriptions, canonical URLs, Open Graph and Twitter
cards, and structured data (`SoftwareApplication`, `Person`, `FAQPage`, `BlogPosting`).

---

## Isolating Admin and the app off GitHub Pages

Guardian is now split across **three separate origins**, each carrying only
the risk it needs to:

| Origin | What's there | Repo / folder | Public? |
|---|---|---|---|
| **Marketing site** | `index.html`, `projects.html`, `team.html`, `blog.html`, the posts, `promo.html`, `post.html` | this repository, on GitHub Pages | Yes — indexed, no login |
| **The app** | Guardian itself — permits, audits, register, chat | `deploy/app/` → its own host | Yes — but a real host, not GitHub Pages |
| **The console** | Admin console + writing studio | `deploy/console/` → its own host | No — unlisted, `noindex`, ideally access-gated |

GitHub Pages is a fine host for the marketing pages: nobody signs in, nothing is
written, and being "just files anyone can read" is the correct threat model for
a public brochure. It is the wrong host for anything else, because it **cannot
set security headers, cannot restrict by IP or credential at the edge, and
serves every file it holds to anyone who asks** — there is no configuration
that changes this. That's true of the app (a real login surface) and doubly true
of the console (master administration and account creation).

### Deploy the app — Cloudflare Pages (free, no card required)

`deploy/app/` is ready to push exactly as it is. Cloudflare Pages gives every
project a free `*.pages.dev` address, with unlimited bandwidth and requests on
the free plan, and reads the `_headers`/`_redirects` files already sitting in
that folder without any extra configuration.

**Fastest path — drag and drop, no Git, about 2 minutes:**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → sign up free → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Project name: `guardian-ehs-app` (this becomes part of your address). Drag
   the entire `deploy/app/` folder onto the upload area.
3. **Deploy site.** Cloudflare gives you the live address immediately:
   **`https://guardian-ehs-app.pages.dev`** — that's the exact address already
   wired into every "Try Guardian" link in this repo, so if you use this project
   name, nothing else needs to change.
4. If that name is taken, Cloudflare will tell you at step 2 — pick another
   (e.g. `guardianehs-app`) and then find-and-replace
   `guardian-ehs-app.pages.dev` with your actual subdomain across `index.html`,
   `projects.html`, `team.html`, `blog.html`, `post-permit-workflow.html`,
   `post-offline-ehs.html` and `post.html`, then push the marketing site again.

**To update it later:** repeat step 2 with the changed `deploy/app/` folder —
each upload becomes the new live version in seconds. Free tier keeps every
previous upload as an instant-rollback deployment.

**If you'd rather it redeploy automatically on every push:** create a small
GitHub repo containing only the contents of `deploy/app/`, then in the same
Pages project choose **Connect to Git** instead of Upload assets. Same free
tier, same address, but it updates itself whenever you push.

`deploy/app/index.html` is the entire application — identical to what used to
be `app.html`, just renamed so it serves at the address root. `deploy/app/app.html`
is a one-line redirect stub kept only so old bookmarks to `/app.html` still land
correctly. `deploy/app/sw.js` is the app's own offline service worker.

### Deploy the console — Netlify (free, a genuinely different company)

`deploy/console/` holds `admin.html` and `studio.html` together. It goes on a
**different provider from the app on purpose** — if Cloudflare ever has an
outage or an account problem, your operator tools are unaffected, and vice
versa. Netlify's free tier (100 GB bandwidth/month, no card required) is more
than enough for an admin console used by three people.

**Fastest path — drag and drop, no Git, about 2 minutes:**
1. [app.netlify.com](https://app.netlify.com) → sign up free → drag the
   `deploy/console/` folder straight onto the dashboard where it says
   **"Drag and drop your site output here."**
2. Netlify deploys instantly at a random address like
   `https://determined-lovelace-a1b2c3.netlify.app` — it works immediately,
   but rename it: **Site configuration → Change site name** → `guardian-ehs-console`.
   That gives you **`https://guardian-ehs-console.netlify.app`** — the exact
   address already used in this repo's documentation and the app's studio-link
   instructions below.
3. If that name is taken, pick another and use it in place of
   `guardian-ehs-console` wherever this document mentions it.

**To update it later:** drag the folder onto the dashboard again, or onto the
site's **Deploys** tab. Netlify also keeps every previous deploy for instant
rollback, free.

Nothing in the marketing site or the app links to the console's address — you
reach it by going there directly, or from the app's "Writing studio" action,
which asks once for the address and remembers it on that device:

    localStorage.setItem('guardian.studioUrl','https://guardian-ehs-console.netlify.app/studio.html')

**Optional, free, extra layer:** Cloudflare Access can require a second
sign-in (your Google or GitHub identity) before the console page even loads —
free for up to 50 users — but it only fronts domains Cloudflare itself
controls the DNS for. A bare `*.netlify.app` address doesn't qualify, so this
upgrade needs either a custom domain pointed at Cloudflare, or hosting the
console on Cloudflare Pages instead of Netlify (a second free Pages project,
e.g. `guardian-ehs-console`, with **Access policy** turned on in that project's
settings — no domain purchase needed for that path). Either is a later
upgrade, not a requirement: the PIN, the master-role check and row-level
security already stand between an unauthenticated visitor and any data.

**Or, skip hosting it altogether** and run it from your own machine — see
`private/run-local.md`. Fine for one administrator on one computer; not usable
by Jobel or Sajil, and not reachable when you're not at that machine.

### One-time settings this split requires

**Supabase → Authentication → URL Configuration** — add every address that
needs to complete a sign-in redirect:

    Site URL:      https://guardianehs.github.io/
    Redirect URLs: https://guardianehs.github.io/*
                   https://guardian-ehs-app.pages.dev/*
                   https://guardian-ehs-console.netlify.app/*

**Google Cloud → your OAuth client → Authorized JavaScript origins** — add the
app and console addresses alongside the marketing site's:

    https://guardianehs.github.io
    https://guardian-ehs-app.pages.dev
    https://guardian-ehs-console.netlify.app

The redirect URI stays the single Supabase callback; only the origins list grows.

### What actually changed in the files

- Every "Try Guardian" link on the marketing site now points at the app's own
  address instead of `./app.html`.
- `admin.html` and `studio.html` are gone from this repo entirely — they live
  only in `deploy/console/` (and, if you use it, `private/` for local runs).
- The site's own `sw.js` no longer caches the app — it caches only the
  marketing pages, since the app is a different origin now and manages its own
  offline behaviour via `deploy/app/sw.js`.
- `sitemap.xml` no longer lists the app, since a sitemap only covers one origin.

### What this does and does not protect

Separating the origins is the real control: the console can carry stricter
headers, a stricter CSP, `no-store` caching and — if you add Cloudflare Access —
a second authentication layer in front of it, none of which GitHub Pages could
ever offer. It is not a *replacement* for the database-level protections
already in place: the tools hold no secret key, and every action is still
authorised by the master role check, the bcrypt admin PIN, the `can_publish`
flag and the row-level security policies. Someone who finds the console's
address without valid credentials still cannot read or change a single record —
the separation just means fewer people find the address at all, and the ones
who do face a harder front door.

The in-app master panel (Ctrl+Shift+M) stays inside the application itself,
because it is gated by the same role check and PIN rather than by being hidden.

---

## Edge protection (the WAF question) and device optimisation

### What a WAF can and cannot do here

A web application firewall inspects requests **before** they reach the
application: rate limits, bot rules, geo rules, signature matching, DDoS
absorption. It has to run at the network edge. GitHub Pages serves static files
and gives you no request filtering at all, and a "firewall" written in the page
itself is not a control — the attacker simply doesn't run your JavaScript.

So Guardian's real protection sits in two places that cannot be bypassed from a
browser:

| Layer | What it enforces |
|---|---|
| Postgres row-level security | Every read and write is authorised per row and per role. A stolen publishable key gets an attacker nothing. |
| Security-definer functions | The admin PIN (bcrypt, `pg_sleep` throttle), SME review and post listing refuse callers who lack the role. |

**To add a genuine WAF, put a proxy in front of the site.** With a custom domain
this is free and takes about 20 minutes:

1. Point the domain's nameservers at **Cloudflare** and add the `CNAME` to
   `<ORG>.github.io` with the proxy (orange cloud) enabled.
2. Turn on, under Security: **Bot Fight Mode**, **managed WAF rules**, and a
   **rate limiting rule** — e.g. 30 requests/minute per IP to `/app.html`.
3. Add a **custom rule** blocking anything you never expect, such as requests
   with no `User-Agent`, or paths like `/wp-login.php` that only scanners ask for.
4. In Supabase → **Authentication → Attack protection**, enable **captcha**
   (hCaptcha or Turnstile) on sign-in and sign-up, and leave the built-in auth
   rate limits on. That is the control that actually protects your accounts.
5. Keep the operator tools off the public site (see the section above).

### What the app now sets for itself

`app.html` carries a **Content-Security-Policy** meta tag that restricts where
scripts, styles, fonts and network calls may go — the Supabase project, the model
providers you can select, the font CDN and nothing else — plus
`frame-ancestors 'none'` (no clickjacking), `object-src 'none'`, `form-action
'none'` and a strict referrer policy. The admin PIN also **locks on this device
for five minutes after five wrong attempts**, on top of the server-side throttle.

Two honest limits: `X-Frame-Options`, `Strict-Transport-Security` and
`X-Content-Type-Options` are *headers*, not meta tags, so a static host cannot
set them — a proxy can. And if you add a model provider that is not in the policy
list, add its host to `connect-src` or the call will be blocked.

### Device optimisation

The app profiles the device on load and adapts, rather than shipping one layout
for everyone:

| Profile | What changes |
|---|---|
| **Phone** | Single column throughout, checklists stack with full-width Yes/No/N-A buttons, the action bar sticks to the bottom, **camera comes before file-picker** on attachments, KPI tiles go two-up |
| **Tablet** | Two-column forms, three-column gas grid, moderate density — sized for a permit being completed on a walk |
| **Desktop** | Full-width permit, four-column KPIs, denser tables, tighter rows |
| **Touch input** | Every target at least 40 px, and nothing depends on hover — applied even on a touchscreen laptop, which keeps the desktop layout |
| **Low-end or data saver** | Animation and shadows off, lighter rendering. Triggered by ≤2 GB memory, ≤2 cores, a 2G/3G connection or the browser's data-saver setting |

Detection uses screen size, pointer type, User-Agent Client Hints, touch points
(which is how an iPad in desktop mode is identified), the Network Information API
and reported memory and cores. **Settings → This device** shows what was detected
and lets anyone override the layout, choose comfortable or compact density, or
force lite mode. It re-profiles on rotation, resize and network change.

### The device identifier

Each browser stores a random identifier the first time it runs Guardian. It
labels signatures in the permit audit trail, so a record shows *which device* a
permit was authorised from — useful when a permit is questioned later. It is
**not** a fingerprint: no canvas or font probing, nothing is sent anywhere unless
your organisation's database is connected, and clearing site data resets it.
Browser-based device *attestation* is not possible, so treat it as a helpful
label, not proof of identity.

---

## Verification checklist

| What | Where | Expected |
|---|---|---|
| Site loads | `<SITE>/` | Home page, permit rail animates to **ISSUED** |
| App loads | your app address | Sidebar, chat, permit, audit, register |
| Offline works | Airplane mode, reopen | App still opens and answers |
| Install works | Browser menu → Install | Opens standalone at the app's own root |
| Sign-in works | App → sign in | Lands on the Home dashboard with a role chip |
| Live data works | Two browsers, one org | Approve a permit → other screen updates itself |
| Admin works | your console address | Sign in → PIN → console with counters |
| Indexing ready | `<SITE>/robots.txt` | Serves text, references the sitemap |

---

## When something breaks

| Symptom | Cause | Fix |
|---|---|---|
| Site is at `username.github.io/repo/` | Repo owned by a personal account | Transfer to the organisation (1.2) |
| *"Email signups are disabled"* | Sign-ups off | Stage 3.4 |
| Sign-in returns to the login screen | Site/Redirect URLs unset | Stage 3.5 |
| *"Unable to exchange external code"* | Client ID/secret mismatch | Regenerate the pair, re-paste (5.2–5.3) |
| *"No OAuth clients to display"* | Wrong Google project or account | Switch project, or create a fresh client |
| Admin panel won't open | Account isn't `master` | Re-run the promote SQL (3.6); the shortcut re-reads your role each press |
| *"PIN functions not installed"* | Partial SQL run | Re-run `supabase-setup.sql` in full |
| Uploads rejected | Storage section not run | Re-run the SQL; only PDF/Excel/Word/images ≤15 MB are allowed |
| No live updates | Realtime section not run | Re-run the last SQL section; the sidebar dot pulses green when connected |
| Free project paused | 7 days idle on the free tier | Click **Restore** in Supabase; no data is lost |

---

## Updating later

- **App or site change** — commit the file; visitors get it on next load (the service
  worker is network-first, so nothing is served stale while online).
- **Force every installed copy to refresh** — bump `guardian-shell-v3` and
  `guardian-runtime-v3` in `sw.js` to `v4` in the same commit.
- **New blog post** — copy `post-offline-ehs.html`, change the text, title,
  description, canonical link and JSON-LD; add it to `blog.html` and `sitemap.xml`.
- **Change the admin PIN** — SQL Editor: `select set_admin_pin('new-pin');`
