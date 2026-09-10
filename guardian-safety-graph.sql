-- Guardian 2.0 Safety Graph
-- Run this after your existing Supabase setup. RLS keeps the graph inside the member organization.
create table if not exists public.safety_graph (
  org_id uuid not null references public.organizations(id) on delete cascade,
  graph_id text not null default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (org_id, graph_id)
);
alter table public.safety_graph enable row level security;
drop policy if exists "safety graph members read" on public.safety_graph;
drop policy if exists "safety graph members write" on public.safety_graph;
create policy "safety graph members read" on public.safety_graph for select using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.org_id=safety_graph.org_id));
create policy "safety graph members write" on public.safety_graph for insert with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.org_id=safety_graph.org_id));
create policy "safety graph members update" on public.safety_graph for update using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.org_id=safety_graph.org_id)) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.org_id=safety_graph.org_id));
