-- LearnFlow core schema. Supabase auth.users is the identity source.
create extension if not exists pgcrypto;

create type public.app_role as enum ('student','faculty','mentor','club_coordinator','department_admin','super_admin');
create type public.course_status as enum ('draft','published','archived');
create type public.enrollment_status as enum ('active','completed','dropped');
create type public.submission_status as enum ('draft','submitted','graded','late');
create type public.event_kind as enum ('class','exam','deadline','meeting','club');
create type public.attendance_method as enum ('manual','nfc','qr','ble','kiosk');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role public.app_role not null default 'student',
  department text,
  year_of_study smallint check (year_of_study between 1 and 6),
  avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, title text not null, description text not null default '',
  department text, faculty_id uuid references public.profiles(id) on delete set null,
  status public.course_status not null default 'draft', starts_on date, ends_on date,
  created_at timestamptz not null default now()
);
create table public.enrollments (
  course_id uuid references public.courses(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  status public.enrollment_status not null default 'active', enrolled_at timestamptz not null default now(),
  primary key (course_id, student_id)
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, summary text not null default '', position integer not null default 0,
  video_url text, resource_urls jsonb not null default '[]'::jsonb, published boolean not null default false,
  unique(course_id, position)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, instructions text not null default '', due_at timestamptz, max_score numeric(6,2) not null default 100 check (max_score >= 0),
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, content text not null default '', attachment_urls jsonb not null default '[]'::jsonb,
  status public.submission_status not null default 'draft', score numeric(6,2), feedback text, submitted_at timestamptz, graded_at timestamptz,
  unique(assignment_id, student_id)
);
create table public.quizzes (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, instructions text not null default '', time_limit_seconds integer check (time_limit_seconds > 0), published boolean not null default false
);
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null, options jsonb not null default '[]'::jsonb, points numeric(6,2) not null default 1 check (points > 0), position integer not null default 0,
  unique(quiz_id, position)
);
-- Keep answer keys out of the student-facing question payload.
create table public.quiz_answer_keys (
  question_id uuid primary key references public.quiz_questions(id) on delete cascade,
  answer text not null
);
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, answers jsonb not null default '{}'::jsonb,
  score numeric(6,2), started_at timestamptz not null default now(), submitted_at timestamptz,
  unique(quiz_id, student_id, started_at)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade, title text not null, description text not null default '',
  kind public.event_kind not null default 'class', starts_at timestamptz not null, ends_at timestamptz, location text,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), check (ends_at is null or ends_at >= starts_at)
);
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(), event_id uuid references public.calendar_events(id) on delete set null,
  course_id uuid references public.courses(id) on delete cascade, student_id uuid not null references public.profiles(id) on delete cascade,
  attended_at timestamptz not null default now(), method public.attendance_method not null default 'manual', device_ref text, marked_by uuid references public.profiles(id) on delete set null,
  unique(event_id, student_id)
);
create table public.achievements (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null, title text not null, description text not null default '', awarded_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb,
  unique(student_id, slug)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text not null default '', data jsonb not null default '{}'::jsonb, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.social_posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) <= 5000), media_urls jsonb not null default '[]'::jsonb, club_name text, published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.device_registrations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null, platform text not null, push_token text, capabilities jsonb not null default '[]'::jsonb, last_seen_at timestamptz not null default now(),
  unique(user_id, device_id)
);
create table public.sync_changes (
  id bigint generated always as identity primary key, user_id uuid not null references public.profiles(id) on delete cascade,
  entity text not null, entity_id uuid not null, operation text not null check (operation in ('upsert','delete')), payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), acknowledged_at timestamptz
);

create index enrollments_student_idx on public.enrollments(student_id);
create index lessons_course_idx on public.lessons(course_id, position);
create index notifications_recipient_idx on public.notifications(recipient_id, created_at desc);
create index social_posts_feed_idx on public.social_posts(published_at desc);
create index sync_changes_user_idx on public.sync_changes(user_id, created_at);

create or replace function public.current_role() returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() in ('faculty','mentor','club_coordinator','department_admin','super_admin'), false)
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() in ('department_admin','super_admin'), false)
$$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email) on conflict (id) do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Students see their own records; staff manage academic content. Policies call SECURITY DEFINER helpers to avoid profile recursion.
create policy profiles_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy courses_read on public.courses for select using (status = 'published' or faculty_id = auth.uid() or public.is_staff());
create policy courses_staff_write on public.courses for all using (public.is_staff()) with check (public.is_staff());
create policy enrollments_self_or_staff on public.enrollments for select using (student_id = auth.uid() or public.is_staff());
create policy enrollments_staff_write on public.enrollments for all using (public.is_staff()) with check (public.is_staff());
create policy lessons_read on public.lessons for select using (published or public.is_staff() or exists (select 1 from enrollments e where e.course_id = lessons.course_id and e.student_id = auth.uid()));
create policy lessons_staff_write on public.lessons for all using (public.is_staff()) with check (public.is_staff());
create policy assignments_read on public.assignments for select using (public.is_staff() or exists (select 1 from enrollments e where e.course_id = assignments.course_id and e.student_id = auth.uid()));
create policy assignments_staff_write on public.assignments for all using (public.is_staff()) with check (public.is_staff());
create policy submissions_self_or_staff on public.submissions for select using (student_id = auth.uid() or public.is_staff());
create policy submissions_self_write on public.submissions for insert with check (student_id = auth.uid());
create policy submissions_self_update on public.submissions for update using (student_id = auth.uid() and status in ('draft','submitted')) with check (student_id = auth.uid());
create policy submissions_staff_grade on public.submissions for update using (public.is_staff()) with check (public.is_staff());
create policy quizzes_read on public.quizzes for select using (published or public.is_staff());
create policy quizzes_staff_write on public.quizzes for all using (public.is_staff()) with check (public.is_staff());
create policy questions_read on public.quiz_questions for select using (public.is_staff() or exists (select 1 from quizzes q where q.id = quiz_questions.quiz_id and q.published));
create policy questions_staff_write on public.quiz_questions for all using (public.is_staff()) with check (public.is_staff());
create policy answer_keys_staff on public.quiz_answer_keys for all using (public.is_staff()) with check (public.is_staff());
create policy attempts_self_or_staff on public.quiz_attempts for all using (student_id = auth.uid() or public.is_staff()) with check (student_id = auth.uid() or public.is_staff());
create policy events_read on public.calendar_events for select using (owner_id = auth.uid() or public.is_staff() or exists (select 1 from enrollments e where e.course_id = calendar_events.course_id and e.student_id = auth.uid()));
create policy events_staff_write on public.calendar_events for all using (public.is_staff()) with check (public.is_staff());
create policy attendance_self_or_staff on public.attendance_records for select using (student_id = auth.uid() or public.is_staff());
create policy attendance_staff_write on public.attendance_records for all using (public.is_staff()) with check (public.is_staff());
create policy achievements_self_or_staff on public.achievements for select using (student_id = auth.uid() or public.is_staff());
create policy achievements_staff_write on public.achievements for all using (public.is_staff()) with check (public.is_staff());
create policy notifications_self on public.notifications for all using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy social_feed_read on public.social_posts for select using (auth.uid() is not null);
create policy social_author_write on public.social_posts for all using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
create policy devices_self on public.device_registrations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sync_self on public.sync_changes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
