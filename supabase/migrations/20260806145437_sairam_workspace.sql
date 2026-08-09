-- Sairam identity boundary, institution calendar visibility, and explicit API privileges.
alter table public.profiles
  add column roll_no text unique,
  add column semester smallint check (semester between 1 and 8),
  add column section text check (section is null or length(section) between 1 and 4),
  add constraint profiles_sairam_email check (email is null or lower(split_part(email, '@', 2)) = 'sairamtap.edu.in') not valid;
alter table public.profiles validate constraint profiles_sairam_email;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or lower(split_part(new.email, '@', 2)) <> 'sairamtap.edu.in' then
    raise exception 'A @sairamtap.edu.in account is required';
  end if;
  insert into public.profiles (id, full_name, email, roll_no)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    lower(new.email),
    upper(split_part(new.email, '@', 1))
  ) on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.protect_profile_authority() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_super_admin() then
    raise exception 'Only super administrators can change roles';
  end if;
  if new.department is distinct from old.department and not public.is_super_admin() then
    raise exception 'Only super administrators can change profile departments';
  end if;
  if (new.email is distinct from old.email or new.roll_no is distinct from old.roll_no) and not public.is_super_admin() then
    raise exception 'Only super administrators can change institutional identity';
  end if;
  if new.role is distinct from old.role then
    insert into public.audit_log(actor_id, action, entity, entity_id, before_data, after_data)
    values ((select auth.uid()), 'role_changed', 'profiles', old.id::text, jsonb_build_object('role', old.role), jsonb_build_object('role', new.role));
  end if;
  return new;
end $$;

drop policy if exists events_read on public.calendar_events;
drop policy if exists events_scoped_read on public.calendar_events;
create policy events_scoped_read on public.calendar_events for select using (
  owner_id = (select auth.uid()) or public.is_staff() or
  (owner_id is null and course_id is null) or
  exists (select 1 from public.enrollments e where e.course_id = calendar_events.course_id and e.student_id = (select auth.uid()) and e.status = 'active')
);

-- The publishable client receives only table privileges; RLS remains the authority.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.current_role() from public, anon;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.current_department() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.can_manage_course(uuid) from public, anon;
revoke execute on function public.is_mentor_of(uuid) from public, anon;
revoke execute on function public.can_publish_social(uuid) from public, anon;
grant execute on function public.current_role(), public.is_staff(), public.is_admin(), public.current_department(), public.is_super_admin(), public.can_manage_course(uuid), public.is_mentor_of(uuid), public.can_publish_social(uuid) to authenticated;
