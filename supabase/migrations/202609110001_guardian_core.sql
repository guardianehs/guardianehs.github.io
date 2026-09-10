-- Guardian EHS v3: normalized core schema + Ghost security telemetry
-- Safe for local Supabase and managed Supabase. Run after `supabase start`.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  full_name text,
  title text,
  role text not null default 'viewer' check (role in ('viewer','ehs_executive','sme','org_admin','master')),
  can_publish boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  client_name text,
  client_code text,
  location text,
  manager text,
  status text not null default 'active' check (status in ('active','paused','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, code)
);

create table if not exists public.invites (
  token text primary key default encode(gen_random_bytes(24),'hex'),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  role text not null default 'viewer' check (role in ('viewer','ehs_executive','sme','org_admin')),
  title text,
  email text,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses > 0 and max_uses <= 50),
  uses integer not null default 0 check (uses >= 0),
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_entries (
  org_id uuid not null references public.organizations(id) on delete cascade,
  date date not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key(org_id, date)
);

create table if not exists public.permit_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requester_name text,
  permit_no text,
  work_types text,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  sme_note text,
  decision_note text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  cover text,
  body text not null default '',
  visibility text not null default 'public' check (visibility in ('public','members')),
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  author_role text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  module text,
  kind text not null,
  severity text not null,
  title text not null,
  detail text,
  expected text,
  actual text,
  page text,
  build text,
  device text,
  status text not null default 'open',
  admin_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.safety_graph (
  org_id uuid not null references public.organizations(id) on delete cascade,
  graph_id text not null default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key(org_id, graph_id)
);

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  path text not null,
  label text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Ghost CMS security/availability telemetry. This is intentionally separate from EHS records.
create table if not exists public.ghost_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'ghost',
  event text not null,
  event_id text,
  target_url text,
  severity text not null default 'info' check (severity in ('info','low','medium','high','critical')),
  action text not null default 'webhook',
  score integer not null default 0 check (score >= 0 and score <= 100),
  ip inet,
  user_agent text,
  country text,
  rule text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(source, event_id)
);

create table if not exists public.ghost_warnings (
  id uuid primary key default gen_random_uuid(),
  trigger_pattern text not null,
  title text not null,
  detail text,
  severity text not null default 'medium' check (severity in ('info','low','medium','high','critical')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ghost_incidents (
  id uuid primary key default gen_random_uuid(),
  ghost_event_id uuid references public.ghost_events(id) on delete set null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  title text not null,
  detail text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_projects_org on public.projects(org_id);
create index if not exists idx_daily_org_date on public.daily_entries(org_id, date desc);
create index if not exists idx_permits_org_created on public.permit_requests(org_id, created_at desc);
create index if not exists idx_posts_status_updated on public.posts(status, updated_at desc);
create index if not exists idx_ghost_events_created on public.ghost_events(created_at desc);
create index if not exists idx_ghost_events_severity on public.ghost_events(severity, created_at desc);

-- Generic updated_at trigger.
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_org_updated on public.organizations;
create trigger trg_org_updated before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists trg_profile_updated on public.profiles;
create trigger trg_profile_updated before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_project_updated on public.projects;
create trigger trg_project_updated before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists trg_daily_updated on public.daily_entries;
create trigger trg_daily_updated before update on public.daily_entries for each row execute function public.set_updated_at();
drop trigger if exists trg_permit_updated on public.permit_requests;
create trigger trg_permit_updated before update on public.permit_requests for each row execute function public.set_updated_at();
drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated before update on public.posts for each row execute function public.set_updated_at();
drop trigger if exists trg_ghost_warning_updated on public.ghost_warnings;
create trigger trg_ghost_warning_updated before update on public.ghost_warnings for each row execute function public.set_updated_at();

-- Helper predicates used by RLS. Security definer avoids recursive profile-policy checks.
create or replace function public.current_role() returns text
language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() limit 1 $$;

create or replace function public.current_org_id() returns uuid
language sql stable security definer set search_path=public
as $$ select org_id from public.profiles where id=auth.uid() limit 1 $$;

create or replace function public.is_master() returns boolean
language sql stable security definer set search_path=public
as $$ select coalesce(public.current_role()='master',false) $$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.invites enable row level security;
alter table public.daily_entries enable row level security;
alter table public.permit_requests enable row level security;
alter table public.posts enable row level security;
alter table public.feedback enable row level security;
alter table public.safety_graph enable row level security;
alter table public.evidence enable row level security;
alter table public.ghost_events enable row level security;
alter table public.ghost_warnings enable row level security;
alter table public.ghost_incidents enable row level security;

-- Organization data: members see their own org; masters see all.
drop policy if exists org_read on public.organizations;
create policy org_read on public.organizations for select using (public.is_master() or id=public.current_org_id());
drop policy if exists org_write on public.organizations;
create policy org_write on public.organizations for all using (public.is_master()) with check (public.is_master());

drop policy if exists profile_read on public.profiles;
create policy profile_read on public.profiles for select using (public.is_master() or id=auth.uid() or org_id=public.current_org_id());
drop policy if exists profile_write on public.profiles;
create policy profile_write on public.profiles for update using (public.is_master() or (org_id=public.current_org_id() and public.current_role()='org_admin')) with check (public.is_master() or (org_id=public.current_org_id() and public.current_role()='org_admin'));

-- Org-scoped tables.
drop policy if exists project_rw on public.projects;
create policy project_rw on public.projects for all using (public.is_master() or (org_id=public.current_org_id() and public.current_role() in ('org_admin','master','ehs_executive'))) with check (public.is_master() or (org_id=public.current_org_id() and public.current_role() in ('org_admin','master','ehs_executive')));

drop policy if exists invite_rw on public.invites;
create policy invite_rw on public.invites for all using (public.is_master() or (org_id=public.current_org_id() and public.current_role() in ('org_admin','master'))) with check (public.is_master() or (org_id=public.current_org_id() and public.current_role() in ('org_admin','master')));

drop policy if exists daily_rw on public.daily_entries;
create policy daily_rw on public.daily_entries for all using (public.is_master() or org_id=public.current_org_id()) with check (public.is_master() or org_id=public.current_org_id());

drop policy if exists permit_read on public.permit_requests;
create policy permit_read on public.permit_requests for select using (public.is_master() or org_id=public.current_org_id());
drop policy if exists permit_insert on public.permit_requests;
create policy permit_insert on public.permit_requests for insert with check (org_id=public.current_org_id() and requested_by=auth.uid());
drop policy if exists permit_update on public.permit_requests;
create policy permit_update on public.permit_requests for update using (public.is_master() or (org_id=public.current_org_id() and public.current_role() in ('sme','org_admin','master'))) with check (public.is_master() or org_id=public.current_org_id());

drop policy if exists evidence_rw on public.evidence;
create policy evidence_rw on public.evidence for all using (public.is_master() or org_id=public.current_org_id()) with check (public.is_master() or org_id=public.current_org_id());

drop policy if exists graph_rw on public.safety_graph;
create policy graph_rw on public.safety_graph for all using (public.is_master() or org_id=public.current_org_id()) with check (public.is_master() or org_id=public.current_org_id());

-- Feedback can be created by signed-in users; only the author/master can read all details.
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert with check (auth.uid() is not null and (user_id is null or user_id=auth.uid()));
drop policy if exists feedback_read on public.feedback;
create policy feedback_read on public.feedback for select using (public.is_master() or user_id=auth.uid());
drop policy if exists feedback_update on public.feedback;
create policy feedback_update on public.feedback for update using (public.is_master());

-- Public journal reads; publishing remains privileged.
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (status='published' and visibility='public' or auth.uid() is not null and (public.is_master() or author_id=auth.uid() or public.current_role()='org_admin'));
drop policy if exists posts_write on public.posts;
create policy posts_write on public.posts for all using (public.is_master() or public.current_role()='org_admin' or public.current_role()='ehs_executive') with check (public.is_master() or public.current_role()='org_admin' or public.current_role()='ehs_executive');

-- Ghost telemetry is global security data: master-only browser access.
drop policy if exists ghost_events_read on public.ghost_events;
create policy ghost_events_read on public.ghost_events for select using (public.is_master());
drop policy if exists ghost_events_write on public.ghost_events;
create policy ghost_events_write on public.ghost_events for insert with check (false);
drop policy if exists ghost_events_update on public.ghost_events;
create policy ghost_events_update on public.ghost_events for update using (public.is_master()) with check (public.is_master());
drop policy if exists ghost_events_delete on public.ghost_events;
create policy ghost_events_delete on public.ghost_events for delete using (public.is_master());

drop policy if exists ghost_warning_read on public.ghost_warnings;
create policy ghost_warning_read on public.ghost_warnings for select using (auth.uid() is not null);
drop policy if exists ghost_warning_write on public.ghost_warnings;
create policy ghost_warning_write on public.ghost_warnings for all using (public.is_master()) with check (public.is_master());

drop policy if exists ghost_incident_rw on public.ghost_incidents;
create policy ghost_incident_rw on public.ghost_incidents for all using (public.is_master()) with check (public.is_master());

-- Realtime publication for the tables the UI listens to.
do $$ begin
  alter publication supabase_realtime add table public.permit_requests;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.daily_entries;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ghost_events;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- Storage bucket for evidence. Keep object access private and let Storage RLS govern it.
insert into storage.buckets(id,name,public) values ('evidence','evidence',false) on conflict (id) do nothing;

drop policy if exists evidence_object_read on storage.objects;
create policy evidence_object_read on storage.objects for select using (bucket_id='evidence' and (public.is_master() or (auth.uid() is not null and (storage.foldername(name))[1] = public.current_org_id()::text)));
drop policy if exists evidence_object_insert on storage.objects;
create policy evidence_object_insert on storage.objects for insert with check (bucket_id='evidence' and auth.uid() is not null and (storage.foldername(name))[1] = public.current_org_id()::text);

-- RPC compatibility used by the existing app.
create or replace function public.ghost_get_warnings()
returns setof public.ghost_warnings
language sql stable security definer set search_path=public
as $$ select * from public.ghost_warnings where enabled=true order by severity desc, created_at desc $$;
