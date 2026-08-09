-- Student pilot data boundary for CSE Year 3 / Semester 5 / Section D.
create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  year_of_study smallint not null check (year_of_study between 1 and 6),
  semester smallint not null check (semester between 1 and 8),
  section text not null check (length(section) between 1 and 4),
  weekday smallint not null check (weekday between 1 and 7),
  period smallint not null check (period > 0),
  course_id uuid references public.courses(id) on delete set null,
  course_code text not null,
  display_title text not null,
  starts_at time not null,
  ends_at time not null,
  room text,
  constraint timetable_slots_time_check check (ends_at > starts_at),
  constraint timetable_slots_cohort_period_key unique (department, year_of_study, semester, section, weekday, period)
);
create index timetable_slots_course_idx on public.timetable_slots (course_id);

create table public.attendance_summaries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  course_code text,
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  attended_count integer check (attended_count is null or attended_count >= 0),
  held_count integer check (held_count is null or held_count >= 0),
  source text not null,
  source_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint attendance_counts_check check (attended_count is null or held_count is null or attended_count <= held_count),
  constraint attendance_course_code_check check (course_id is not null or course_code is null or length(course_code) > 0)
);
create unique index attendance_summaries_overall_key on public.attendance_summaries (student_id) where course_id is null and course_code is null;
create unique index attendance_summaries_course_key on public.attendance_summaries (student_id, course_id) where course_id is not null;
create unique index attendance_summaries_external_course_key on public.attendance_summaries (student_id, course_code) where course_id is null and course_code is not null;
create index attendance_summaries_student_idx on public.attendance_summaries (student_id);
create index attendance_summaries_course_idx on public.attendance_summaries (course_id);

alter table public.timetable_slots enable row level security;
alter table public.attendance_summaries enable row level security;

drop policy if exists courses_read_authenticated on public.courses;
create policy courses_read_authenticated on public.courses for select using (
  private.can_manage_course(id) or exists (
    select 1 from public.enrollments e where e.course_id = courses.id and e.student_id = (select auth.uid())
      and e.status = 'active' and courses.status = 'published'
  )
);

create policy timetable_slots_scoped_read on public.timetable_slots for select using (
  private.current_role() = 'super_admin' or
  (private.current_role() = 'department_admin' and department = private.current_department()) or
  (course_id is not null and private.can_manage_course(course_id)) or
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'student'
      and p.department = timetable_slots.department and p.year_of_study = timetable_slots.year_of_study
      and p.semester = timetable_slots.semester and p.section = timetable_slots.section
  ) or exists (
    select 1 from public.mentor_assignments ma join public.profiles p on p.id = ma.student_id
    where ma.mentor_id = (select auth.uid()) and ma.active
      and p.department = timetable_slots.department and p.year_of_study = timetable_slots.year_of_study
      and p.semester = timetable_slots.semester and p.section = timetable_slots.section
  )
);

create policy attendance_summaries_scoped_read on public.attendance_summaries for select using (
  student_id = (select auth.uid()) or private.is_mentor_of(student_id) or
  (course_id is not null and private.can_manage_course(course_id)) or
  (course_id is null and private.current_role() in ('super_admin','department_admin') and exists (
    select 1 from public.profiles p where p.id = attendance_summaries.student_id
      and (private.current_role() = 'super_admin' or p.department = private.current_department())
  ))
);

revoke all on public.timetable_slots, public.attendance_summaries from anon;
grant select on public.timetable_slots, public.attendance_summaries to authenticated;

-- ponytail: exact pilot normalization is done before authority checks; replace with a registrar roster import when one exists.
create or replace function public.set_student_pilot_profile()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if lower(coalesce(new.email, '')) = 'secl25cs08@sairamtap.edu.in' and new.role = 'student' then
    new.department := 'Computer Science and Engineering'; new.year_of_study := 3; new.semester := 5; new.section := 'D';
  end if;
  return new;
end $$;
create or replace function public.enroll_student_pilot()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if lower(coalesce(new.email, '')) = 'secl25cs08@sairamtap.edu.in' and new.role = 'student' then
    insert into public.enrollments (course_id, student_id, status)
    select c.id, new.id, 'active' from public.courses c
    where c.code in ('24ITPC501','24CSPW501','24AIEL503','24ITEL516','24ITPL501','24MGMC501','20CSTP501','24CSID501','24CSEL503')
    on conflict (course_id, student_id) do update set status = 'active';
  end if;
  return new;
end $$;
drop trigger if exists set_student_pilot_profile on public.profiles;
create trigger set_student_pilot_profile before insert on public.profiles for each row execute function public.set_student_pilot_profile();
drop trigger if exists enroll_student_pilot on public.profiles;
create trigger enroll_student_pilot after insert on public.profiles for each row execute function public.enroll_student_pilot();
revoke all on function public.set_student_pilot_profile(), public.enroll_student_pilot() from public, anon, authenticated;

-- Keep institutional identity, role, and pilot cohort dimensions immutable to clients.
create or replace function public.protect_profile_authority()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
declare trusted_database_session constant boolean :=
  session_user in ('postgres', 'supabase_admin')
  and nullif(current_setting('request.jwt.claim.sub', true), '') is null;
begin
  if new.role is distinct from old.role and not (trusted_database_session or private.is_super_admin()) then raise exception 'Only super administrators can change roles'; end if;
  if new.department is distinct from old.department and not (trusted_database_session or private.is_super_admin()) then raise exception 'Only super administrators can change profile departments'; end if;
  if new.year_of_study is distinct from old.year_of_study or new.semester is distinct from old.semester or new.section is distinct from old.section then
    if not (trusted_database_session or private.is_super_admin()) then raise exception 'Only super administrators can change profile cohort'; end if;
  end if;
  if (new.email is distinct from old.email or new.roll_no is distinct from old.roll_no) and not (trusted_database_session or private.is_super_admin()) then raise exception 'Only super administrators can change institutional identity'; end if;
  if new.role is distinct from old.role then
    insert into public.audit_log(actor_id, action, entity, entity_id, before_data, after_data)
    values ((select auth.uid()), 'role_changed', 'profiles', old.id::text, jsonb_build_object('role', old.role), jsonb_build_object('role', new.role));
  end if;
  return new;
end $$;
revoke all on function public.protect_profile_authority() from public, anon, authenticated;
