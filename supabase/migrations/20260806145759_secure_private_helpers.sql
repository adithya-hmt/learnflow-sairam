-- Keep policy helpers callable by RLS without exposing them as Data API RPCs.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.current_role() set schema private;
alter function public.is_staff() set schema private;
alter function public.is_admin() set schema private;
alter function public.current_department() set schema private;
alter function public.is_super_admin() set schema private;
alter function public.can_manage_course(uuid) set schema private;
alter function public.is_mentor_of(uuid) set schema private;
alter function public.can_publish_social(uuid) set schema private;

create or replace function private.current_role()
returns public.app_role
language sql stable security definer set search_path = pg_catalog as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function private.is_staff()
returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select coalesce(private.current_role() in ('faculty','mentor','club_coordinator','department_admin','super_admin'), false)
$$;

create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select coalesce(private.current_role() in ('department_admin','super_admin'), false)
$$;

create or replace function private.current_department()
returns text
language sql stable security definer set search_path = pg_catalog as $$
  select department from public.profiles where id = (select auth.uid())
$$;

create or replace function private.is_super_admin()
returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select coalesce(private.current_role() = 'super_admin', false)
$$;

create or replace function private.can_manage_course(target uuid)
returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select coalesce(private.is_super_admin() or exists (
    select 1 from public.courses c where c.id = target and (
      c.faculty_id = (select auth.uid()) or
      (private.current_role() = 'department_admin' and c.department = private.current_department())
    )
  ), false)
$$;

create or replace function private.is_mentor_of(target uuid)
returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select exists (
    select 1 from public.mentor_assignments m
    where m.mentor_id = (select auth.uid()) and m.student_id = target and m.active
  )
$$;

create or replace function private.can_publish_social(target_club uuid)
returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select coalesce(private.is_super_admin() or exists (
    select 1 from public.clubs c where c.id = target_club and (
      (c.coordinator_id = (select auth.uid()) and private.current_role() = 'club_coordinator') or
      (private.current_role() = 'department_admin' and c.department = private.current_department())
    )
  ), false)
$$;

create or replace function public.protect_profile_authority()
returns trigger
language plpgsql security definer set search_path = pg_catalog as $$
begin
  if new.role is distinct from old.role and not private.is_super_admin() then
    raise exception 'Only super administrators can change roles';
  end if;
  if new.department is distinct from old.department and not private.is_super_admin() then
    raise exception 'Only super administrators can change profile departments';
  end if;
  if (new.email is distinct from old.email or new.roll_no is distinct from old.roll_no) and not private.is_super_admin() then
    raise exception 'Only super administrators can change institutional identity';
  end if;
  if new.role is distinct from old.role then
    insert into public.audit_log(actor_id, action, entity, entity_id, before_data, after_data)
    values ((select auth.uid()), 'role_changed', 'profiles', old.id::text, jsonb_build_object('role', old.role), jsonb_build_object('role', new.role));
  end if;
  return new;
end
$$;

alter function public.protect_attempt_identity() set search_path = pg_catalog;
revoke all on function public.protect_profile_authority() from public, anon, authenticated;
revoke all on function public.protect_attempt_identity() from public, anon, authenticated;

grant execute on function
  private.current_role(),
  private.is_staff(),
  private.is_admin(),
  private.current_department(),
  private.is_super_admin(),
  private.can_manage_course(uuid),
  private.is_mentor_of(uuid),
  private.can_publish_social(uuid)
to authenticated;
