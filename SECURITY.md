# Guardian security boundary

This repository is the **public website and user-facing application only**.

Do not commit:
- database migrations or SQL schemas
- service-role keys, provider API keys, webhook secrets, or private credentials
- admin/studio/operator panels
- Ghost monitoring/admin tooling
- Cloudflare Worker/WAF deployment source
- internal architecture or deployment documents

Operational tooling belongs in the separate private `guardian-ops-portal` repository and protected portal.

If previously-public operational files were removed, review Git history and rewrite the public repository history where appropriate.
