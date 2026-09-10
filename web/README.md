# Guardian Web

The public Guardian website is now organized under `web/` for reusable web assets.

- `assets/css/` — home-page and shared presentation styles
- `assets/js/` — home interactions and reusable web components
- `components/` — visual components/assets such as the animated Guardian mark
- `pages/` — source copies of secondary public pages

`../index.html` remains the deployment entry point for GitHub Pages and imports these assets, so the public URL does not change.
