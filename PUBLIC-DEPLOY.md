# Public GitHub Pages deployment

This repository is deliberately limited to public web assets and the user-facing Guardian application.

Deploy the **repository root** to GitHub Pages. Do not copy the private operations portal into this repository.

Canonical public URLs:
- https://guardianehs.github.io/
- https://guardianehs.github.io/app/
- https://guardianehs.github.io/blog.html
- https://guardianehs.github.io/projects.html
- https://guardianehs.github.io/team.html

Private operations:
- Keep in a separate private GitHub repository: `guardian-ops-portal`
- Deploy behind Cloudflare Access at a protected hostname such as `portal.guardianehs.com`

If this public repository previously contained internal files, removing them from the latest tree is not enough to remove them from Git history. Rewrite history before treating the public repository as clean.
