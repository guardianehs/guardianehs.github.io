# Free Cloudflare WAF profile for Guardian + Ghost

Cloudflare Free currently supports custom WAF rules and one rate-limiting rule. Use the zone-level rules below; do not put a Supabase secret in a browser or in DNS.

## Recommended rules

1. **Block direct database/admin ports**
   - Expression: `http.host eq "api.example.com" and http.request.uri.path matches "^/(pg|db|supavisor)"`
   - Action: Block

2. **Challenge obvious scanner paths**
   - Expression: `http.request.uri.path in {"/wp-admin" "/wp-login.php" "/xmlrpc.php" "/.env" "/phpmyadmin"}`
   - Action: Managed Challenge

3. **Block non-POST traffic to Ghost webhook ingress**
   - Expression: `starts_with(http.request.uri.path, "/ghost/") and http.request.method ne "POST"`
   - Action: Block

4. **Protect the monitoring console**
   - Expression: `http.request.uri.path eq "/ghost-monitor.html" and not cf.client.bot`
   - Action: Managed Challenge

5. **Rate-limit webhook traffic**
   - Create one Free-plan rate-limiting rule for `starts_with(http.request.uri.path, "/ghost/")`.
   - Suggested starting point: 60 requests/minute per IP, then tune to the actual Ghost delivery pattern.

Also enable the Cloudflare Free Managed Ruleset. The five custom rules are a small perimeter layer; they do not replace Supabase RLS, Ghost webhook authentication, or secure origin configuration.
