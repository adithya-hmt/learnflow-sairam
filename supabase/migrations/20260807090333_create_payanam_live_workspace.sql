create table if not exists public.payanam_workspaces (
  workspace_key text primary key,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.payanam_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists payanam_workspaces_set_updated_at on public.payanam_workspaces;
create trigger payanam_workspaces_set_updated_at
before update on public.payanam_workspaces
for each row
execute function public.payanam_set_updated_at();

grant select, insert, update on public.payanam_workspaces to anon;
grant select, insert, update on public.payanam_workspaces to authenticated;

alter table public.payanam_workspaces enable row level security;

drop policy if exists "payanam demo workspace read" on public.payanam_workspaces;
create policy "payanam demo workspace read"
on public.payanam_workspaces
for select
to anon, authenticated
using (workspace_key = 'demo');

drop policy if exists "payanam demo workspace insert" on public.payanam_workspaces;
create policy "payanam demo workspace insert"
on public.payanam_workspaces
for insert
to anon, authenticated
with check (workspace_key = 'demo');

drop policy if exists "payanam demo workspace update" on public.payanam_workspaces;
create policy "payanam demo workspace update"
on public.payanam_workspaces
for update
to anon, authenticated
using (workspace_key = 'demo')
with check (workspace_key = 'demo');

do $$
begin
  alter publication supabase_realtime add table public.payanam_workspaces;
exception
  when duplicate_object then null;
end
$$;
