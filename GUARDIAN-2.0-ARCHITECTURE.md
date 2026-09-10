# Guardian 2.0 — Connected Safety Architecture

Guardian now includes a Safety Graph layer that links the existing modules through four common context keys:

- Worker ID
- Work ID
- Risk ID
- Evidence/record identity

The graph connects daily register, HIRA/JSA, PTW, audit, incident/event, quality and security records. Each saved module snapshot is stored with the shared context and relationships.

## Guardian AI context

When **Use connected safety data for AI answers** is enabled, the assistant receives a bounded, sanitized Safety Graph snapshot along with the user's question. This lets it identify relationships, repeated-risk patterns, missing controls and inconsistencies across records.

This is contextual retrieval, **not training an external AI model**. API keys and secrets must never be stored in the frontend. For sensitive data, use an approved private/local model and appropriate organizational controls.

## Supabase

Run `guardian-safety-graph.sql` after the existing Supabase setup. The table is protected by organization-based RLS and stores the graph as JSONB.

## Next production phase

The current layer is intentionally additive. The next phase should move from snapshots to first-class relational entities: `workers`, `work_orders`, `risks`, `controls`, `permits`, `evidence`, `events`, `actions`, and `verifications`, all keyed by UUID and protected by organization/site RLS.
