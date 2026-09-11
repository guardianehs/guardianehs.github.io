# Public repository history cleanup

The public Pages repository previously contained operational files. Deleting them from the working tree does not erase old commits.

Recommended approach: make a backup clone, install `git-filter-repo`, then rewrite only the public repository history using the paths that were exposed.

Example path set:

```text
admin.html
studio.html
guardian-ghost-admin-panel.html
ghost-monitor.html
monitor/ghost-monitor.html
ghost-integration-ehs.js
guardian-cloud-config.example.js
guardian-safety-graph.sql
supabase/
cloudflare/
wrangler.toml
worker.js
WAF-RULES.md
GUARDIAN-2.0-ARCHITECTURE.md
LOCAL-SUPABASE-GHOST.md
SETUP.md
GITHUB-PAGES-OAUTH.md
README (16).md
README (8).md
REPO-CLEANUP-MANIFEST.txt
```

Do not blindly run a history rewrite on an active shared repository without a backup. Coordinate the force-push with anyone else who may have cloned it.
