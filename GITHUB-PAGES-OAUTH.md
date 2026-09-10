# Guardian — GitHub Pages + Google OAuth

The repository is deployed as a GitHub Pages **project site** at:

`https://arunwilliams.github.io/guardian/`

The application callback is:

`https://arunwilliams.github.io/guardian/app/`

## Supabase Authentication → URL Configuration

Set **Site URL** to:

`https://arunwilliams.github.io/guardian/`

Add these **Redirect URLs**:

- `https://arunwilliams.github.io/guardian/app/`
- `https://arunwilliams.github.io/guardian/admin.html`
- `https://arunwilliams.github.io/guardian/studio.html`
- `http://localhost:5500/guardian/app/` (if using this local static server)

If you use another local port, add that exact URL too.

## Google Cloud Console

Keep Google's **Authorized JavaScript origins** and **Authorized redirect URIs** aligned with the Supabase Google provider configuration. The browser should not receive a Google client secret.

## Why this fixes the 404

The old site used `https://arunwilliams.github.io/guardian/app/`, which is a different GitHub Pages root from the project site `https://arunwilliams.github.io/guardian/`. The app now resolves its callback as the `/guardian/app/` directory.

The homepage also contains a compatibility bridge: if an old Supabase configuration sends OAuth back to `/guardian/#access_token=...`, it forwards the authentication response to `/guardian/app/`. New Google logins use PKCE and return to `/guardian/app/` directly.
