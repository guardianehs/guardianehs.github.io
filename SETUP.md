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

**1.3 Add the files.** Commit every file to the repository **root** (not a subfolder):

| File | Purpose |
|---|---|
| `index.html` | Public home page |
| `app.html` | The app |
| `admin.html` | Admin console |
| `promo.html` | Animated tour |
| `projects.html`, `team.html`, `blog.html`, `post-*.html` | Site pages |
| `site.css` | Shared stylesheet |
| `sw.js` | Offline launch — must sit beside `index.html` |
| `og.png`, `img-*.png`, `blog-*.png` | Images |
| `robots.txt`, `sitemap.xml` | Indexing |
| `supabase-setup.sql`, `README.md`, `SETUP.md` | Reference, never served |

**1.4 Turn on Pages.**
Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch `main`,
Folder `/ (root)` → **Save**.

**✅ Check:** after ~1 minute, `<SITE>/` shows the home page and **Try Guardian**
opens `<SITE>/app.html`. The app works immediately — permits, audits, register,
documents and the offline engine — with no account.

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
constant in `app.html`.

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
script in **`app.html`** *and* **`admin.html`**:

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

Expect *"1 row updated"*. If it says 0, sign in once at `<SITE>/app.html` first
(that creates the profile), then re-run.

**✅ Check:** open `<SITE>/admin.html`, sign in, and you're asked to **create an
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

## Keeping the operator tools off the public site

Anything served from GitHub Pages is readable by anyone who knows the URL —
that is how static hosting works, and no setting changes it. So the two operator
tools are **not published**:

| Tool | Where it lives | Who uses it |
|---|---|---|
| `admin.html` | your machine, in `private/` | you (master administrator) |
| `studio.html` | your machine, or each author's | authors with `can_publish` |

**Run them locally.** From the `private/` folder:

    python3 -m http.server 8787

Then open `http://localhost:8787/admin.html` or `http://localhost:8787/studio.html`.

**One Supabase setting:** Authentication → URL Configuration → add
`http://localhost:8787` and `http://localhost:8787/*` to *Redirect URLs*, so
sign-in can return to your machine. Leave *Site URL* on the public address.

**Keep them out of the repository.** The included `.gitignore` already excludes
`admin.html`, `studio.html`, `supabase-setup.sql` and `SETUP.md`. If you pushed
them earlier, delete them from the repo — they disappear from the site on the
next build.

**In the app**, the writing-studio button asks for the private address once:

    localStorage.setItem('guardian.studioUrl','http://localhost:8787/studio.html')

### What this does and does not protect

Hiding the files stops people reading how the tools are put together. It is not
the security boundary, and it was never carrying one: the tools hold no secret
key, and every action is authorised in the database — the master role check, the
bcrypt admin PIN, the `can_publish` flag and the row-level policies. Someone
holding a copy of `admin.html` still cannot read or change a single record.

The in-app master panel (Ctrl+Shift+M) stays inside the application, because it
is gated by the same role check and PIN rather than by being hidden.

---

## Verification checklist

| What | Where | Expected |
|---|---|---|
| Site loads | `<SITE>/` | Home page, permit rail animates to **ISSUED** |
| App loads | `<SITE>/app.html` | Sidebar, chat, permit, audit, register |
| Offline works | Airplane mode, reopen | App still opens and answers |
| Install works | Browser menu → Install | Opens standalone at `app.html` |
| Sign-in works | App → sign in | Lands on the Home dashboard with a role chip |
| Live data works | Two browsers, one org | Approve a permit → other screen updates itself |
| Admin works | `<SITE>/admin.html` | Sign in → PIN → console with counters |
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
