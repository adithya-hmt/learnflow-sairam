-- Connected-product additions and least-privilege policy repair.
create table public.mentor_assignments (
  mentor_id uuid references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  primary key (mentor_id, student_id)
);
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, slug text not null unique,
  department text, coordinator_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.social_posts add column club_id uuid references public.clubs(id) on delete set null;
create table public.lesson_progress (
  lesson_id uuid references public.lessons(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  completed_at timestamptz, position_seconds integer not null default 0 check (position_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);
create table public.download_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  entity_kind text not null check (entity_kind in ('lesson','resource')),
  entity_id uuid not null, status text not null default 'ready' check (status in ('queued','ready','expired')),
  size_bytes bigint check (size_bytes is null or size_bytes >= 0), updated_at timestamptz not null default now(),
  unique (user_id, entity_kind, entity_id)
);
create table public.social_reactions (
  post_id uuid references public.social_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like','celebrate')),
  created_at timestamptz not null default now(), primary key (post_id, user_id)
);
create table public.integration_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null,
  source text not null, external_id text, event_kind text not null,
  payload jsonb not null default '{}'::jsonb, verified boolean not null default false,
  created_at timestamptz not null default now(), unique (source, external_id)
);
create table public.audit_log (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null,
  action text not null, entity text not null, entity_id text, before_data jsonb, after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_department() returns text language sql stable security definer set search_path = public as $$
  select department from public.profiles where id = auth.uid()
$$;
create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'super_admin', false)
$$;
create or replace function public.can_manage_course(target uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.is_super_admin() or exists (
    select 1 from public.courses c where c.id = target and (
      c.faculty_id = auth.uid() or (public.current_role() = 'department_admin' and c.department = public.current_department())
    )
  ), false)
$$;
create or replace function public.is_mentor_of(target uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mentor_assignments m where m.mentor_id = auth.uid() and m.student_id = target and m.active)
$$;
create or replace function public.can_publish_social(target_club uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.is_super_admin() or exists (
    select 1 from public.clubs c where c.id = target_club and (
      (c.coordinator_id = auth.uid() and public.current_role() = 'club_coordinator') or
      (public.current_role() = 'department_admin' and c.department = public.current_department())
    )
  ), false)
$$;

create or replace function public.protect_profile_authority() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_super_admin() then
    raise exception 'Only super administrators can change roles';
  end if;
  if new.department is distinct from old.department and not public.is_super_admin() then
    raise exception 'Only super administrators can change profile departments';
  end if;
  if new.role is distinct from old.role then
    insert into public.audit_log(actor_id, action, entity, entity_id, before_data, after_data)
    values (auth.uid(), 'role_changed', 'profiles', old.id::text, jsonb_build_object('role', old.role), jsonb_build_object('role', new.role));
  end if;
  return new;
end $$;
create trigger protect_profile_authority before update on public.profiles for each row execute function public.protect_profile_authority();
create or replace function public.protect_attempt_identity() returns trigger language plpgsql as $$
begin
  if new.quiz_id is distinct from old.quiz_id or new.student_id is distinct from old.student_id or new.started_at is distinct from old.started_at then
    raise exception 'Quiz attempt identity is immutable';
  end if;
  return new;
end $$;
create trigger protect_attempt_identity before update on public.quiz_attempts for each row execute function public.protect_attempt_identity();

alter table public.mentor_assignments enable row level security;
alter table public.clubs enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.download_items enable row level security;
alter table public.social_reactions enable row level security;
alter table public.integration_events enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_admin on public.profiles;
create policy profiles_read_scoped on public.profiles for select using (
  id = auth.uid() or public.is_super_admin() or public.is_mentor_of(id) or
  (public.current_role() = 'department_admin' and department = public.current_department()) or
  (public.current_role() = 'faculty' and exists (
    select 1 from public.enrollments e join public.courses c on c.id = e.course_id where e.student_id = profiles.id and c.faculty_id = auth.uid()
  ))
);
create policy profiles_super_admin on public.profiles for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists courses_read on public.courses;
create policy courses_read_authenticated on public.courses for select using (
  auth.uid() is not null and (status = 'published' or public.can_manage_course(id))
);

drop policy if exists courses_staff_write on public.courses;
create policy courses_scoped_write on public.courses for all using (public.can_manage_course(id)) with check (
  public.is_super_admin() or faculty_id = auth.uid() or (public.current_role() = 'department_admin' and department = public.current_department() and (
    faculty_id is null or exists (select 1 from public.profiles p where p.id = faculty_id and p.department = public.current_department() and p.role = 'faculty')
  ))
);
drop policy if exists enrollments_self_or_staff on public.enrollments;
drop policy if exists enrollments_staff_write on public.enrollments;
create policy enrollments_scoped_read on public.enrollments for select using (student_id = auth.uid() or public.is_mentor_of(student_id) or public.can_manage_course(course_id));
create policy enrollments_scoped_write on public.enrollments for all using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));
drop policy if exists lessons_staff_write on public.lessons;
drop policy if exists lessons_read on public.lessons;
create policy lessons_scoped_read on public.lessons for select using (
  auth.uid() is not null and (public.can_manage_course(course_id) or (published and exists (
    select 1 from public.enrollments e where e.course_id = lessons.course_id and e.student_id = auth.uid() and e.status = 'active'
  )))
);
create policy lessons_scoped_write on public.lessons for all using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));
drop policy if exists assignments_read on public.assignments;
drop policy if exists assignments_staff_write on public.assignments;
create policy assignments_scoped_read on public.assignments for select using (public.can_manage_course(course_id) or exists (
  select 1 from public.enrollments e where e.course_id = assignments.course_id and e.student_id = auth.uid() and e.status = 'active'
));
create policy assignments_scoped_write on public.assignments for all using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));
drop policy if exists submissions_self_or_staff on public.submissions;
drop policy if exists submissions_staff_grade on public.submissions;
drop policy if exists submissions_self_write on public.submissions;
drop policy if exists submissions_self_update on public.submissions;
create policy submissions_scoped_read on public.submissions for select using (
  student_id = auth.uid() or public.is_mentor_of(student_id) or exists (
    select 1 from public.assignments a where a.id = assignment_id and public.can_manage_course(a.course_id)
  )
);
create policy submissions_student_insert on public.submissions for insert with check (
  student_id = auth.uid() and status = 'draft' and score is null and feedback is null and graded_at is null and exists (
    select 1 from public.assignments a join public.enrollments e on e.course_id = a.course_id
    where a.id = assignment_id and e.student_id = auth.uid() and e.status = 'active'
  )
);
create policy submissions_student_update on public.submissions for update using (
  student_id = auth.uid() and status in ('draft','submitted') and exists (
    select 1 from public.assignments a join public.enrollments e on e.course_id = a.course_id
    where a.id = assignment_id and e.student_id = auth.uid() and e.status = 'active'
  )
) with check (student_id = auth.uid() and status in ('draft','submitted') and score is null and feedback is null and graded_at is null and exists (
  select 1 from public.assignments a join public.enrollments e on e.course_id = a.course_id
  where a.id = assignment_id and e.student_id = auth.uid() and e.status = 'active'
));
create policy submissions_scoped_grade on public.submissions for update using (exists (
  select 1 from public.assignments a where a.id = assignment_id and public.can_manage_course(a.course_id)
)) with check (exists (select 1 from public.assignments a where a.id = assignment_id and public.can_manage_course(a.course_id)));
drop policy if exists quizzes_staff_write on public.quizzes;
drop policy if exists quizzes_read on public.quizzes;
create policy quizzes_scoped_read on public.quizzes for select using (auth.uid() is not null and (public.can_manage_course(course_id) or (published and exists (
  select 1 from public.enrollments e where e.course_id = quizzes.course_id and e.student_id = auth.uid() and e.status = 'active'
))));
create policy quizzes_scoped_write on public.quizzes for all using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));
drop policy if exists questions_staff_write on public.quiz_questions;
drop policy if exists questions_read on public.quiz_questions;
create policy questions_scoped_read on public.quiz_questions for select using (exists (
  select 1 from public.quizzes q where q.id = quiz_id and (public.can_manage_course(q.course_id) or (q.published and exists (
    select 1 from public.enrollments e where e.course_id = q.course_id and e.student_id = auth.uid() and e.status = 'active'
  )))
));
create policy questions_scoped_write on public.quiz_questions for all using (exists (
  select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id)
)) with check (exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id)));
drop policy if exists answer_keys_staff on public.quiz_answer_keys;
create policy answer_keys_scoped on public.quiz_answer_keys for all using (exists (
  select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = question_id and public.can_manage_course(q.course_id)
)) with check (exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = question_id and public.can_manage_course(q.course_id)));
drop policy if exists attempts_self_or_staff on public.quiz_attempts;
create policy attempts_scoped_read on public.quiz_attempts for select using (student_id = auth.uid() or exists (
  select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id)
));
create policy attempts_student_insert on public.quiz_attempts for insert with check (student_id = auth.uid() and score is null and submitted_at is null and exists (
  select 1 from public.quizzes q join public.enrollments e on e.course_id = q.course_id
  where q.id = quiz_id and q.published and e.student_id = auth.uid() and e.status = 'active'
));
create policy attempts_student_update on public.quiz_attempts for update using (student_id = auth.uid() and submitted_at is null and exists (
  select 1 from public.quizzes q join public.enrollments e on e.course_id = q.course_id
  where q.id = quiz_id and q.published and e.student_id = auth.uid() and e.status = 'active'
)) with check (student_id = auth.uid() and score is null and exists (
  select 1 from public.quizzes q join public.enrollments e on e.course_id = q.course_id
  where q.id = quiz_id and q.published and e.student_id = auth.uid() and e.status = 'active'
));
create policy attempts_staff_update on public.quiz_attempts for update using (exists (
  select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id)
)) with check (exists (select 1 from public.quizzes q where q.id = quiz_id and public.can_manage_course(q.course_id)));
drop policy if exists events_staff_write on public.calendar_events;
drop policy if exists events_read on public.calendar_events;
create policy events_scoped_read on public.calendar_events for select using (
  owner_id = auth.uid() or (course_id is not null and (public.can_manage_course(course_id) or exists (
    select 1 from public.enrollments e where e.course_id = calendar_events.course_id and e.student_id = auth.uid() and e.status = 'active'
  )))
);
create policy events_personal_write on public.calendar_events for all using (owner_id = auth.uid() and course_id is null) with check (owner_id = auth.uid() and course_id is null);
create policy events_course_write on public.calendar_events for all using (course_id is not null and public.can_manage_course(course_id)) with check (course_id is not null and public.can_manage_course(course_id));
drop policy if exists attendance_self_or_staff on public.attendance_records;
drop policy if exists attendance_staff_write on public.attendance_records;
create policy attendance_scoped_read on public.attendance_records for select using (student_id = auth.uid() or public.is_mentor_of(student_id) or (course_id is not null and public.can_manage_course(course_id)));
create policy attendance_scoped_write on public.attendance_records for all using (course_id is not null and public.can_manage_course(course_id)) with check (course_id is not null and public.can_manage_course(course_id));
drop policy if exists achievements_self_or_staff on public.achievements;
drop policy if exists achievements_staff_write on public.achievements;
create policy achievements_scoped_read on public.achievements for select using (student_id = auth.uid() or public.is_mentor_of(student_id) or public.is_super_admin());
create policy achievements_scoped_write on public.achievements for all using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists social_author_write on public.social_posts;
create policy social_scoped_insert on public.social_posts for insert with check (author_id = auth.uid() and public.can_publish_social(club_id));
create policy social_scoped_update on public.social_posts for update using (author_id = auth.uid() and public.can_publish_social(club_id)) with check (author_id = auth.uid() and public.can_publish_social(club_id));
create policy social_scoped_delete on public.social_posts for delete using (author_id = auth.uid() and public.can_publish_social(club_id));

create policy mentor_assignments_read on public.mentor_assignments for select using (mentor_id = auth.uid() or student_id = auth.uid() or public.is_super_admin());
create policy mentor_assignments_admin on public.mentor_assignments for all using (public.is_super_admin() or (public.current_role() = 'department_admin' and exists (
  select 1 from public.profiles m join public.profiles s on s.id = mentor_assignments.student_id where m.id = mentor_assignments.mentor_id and m.department = public.current_department() and s.department = public.current_department()
))) with check (public.is_super_admin() or (public.current_role() = 'department_admin' and exists (
  select 1 from public.profiles m join public.profiles s on s.id = mentor_assignments.student_id where m.id = mentor_assignments.mentor_id and m.department = public.current_department() and s.department = public.current_department()
)));
create policy clubs_read on public.clubs for select using (auth.uid() is not null);
create policy clubs_admin on public.clubs for all using (public.is_super_admin() or (public.current_role() = 'department_admin' and department = public.current_department())) with check (public.is_super_admin() or (public.current_role() = 'department_admin' and department = public.current_department()));
create policy lesson_progress_read on public.lesson_progress for select using (student_id = auth.uid() or public.is_mentor_of(student_id) or exists (
  select 1 from public.lessons l where l.id = lesson_id and public.can_manage_course(l.course_id)
));
create policy lesson_progress_insert on public.lesson_progress for insert with check (student_id = auth.uid() and exists (
  select 1 from public.lessons l join public.enrollments e on e.course_id = l.course_id
  where l.id = lesson_id and l.published and e.student_id = auth.uid() and e.status = 'active'
));
create policy lesson_progress_update on public.lesson_progress for update using (student_id = auth.uid() and exists (
  select 1 from public.lessons l join public.enrollments e on e.course_id = l.course_id
  where l.id = lesson_id and l.published and e.student_id = auth.uid() and e.status = 'active'
)) with check (student_id = auth.uid() and exists (
  select 1 from public.lessons l join public.enrollments e on e.course_id = l.course_id
  where l.id = lesson_id and l.published and e.student_id = auth.uid() and e.status = 'active'
));
create policy lesson_progress_delete on public.lesson_progress for delete using (student_id = auth.uid());
create policy downloads_self on public.download_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reactions_self_write on public.social_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reactions_read on public.social_reactions for select using (auth.uid() is not null);
create policy integration_admin_read on public.integration_events for select using (public.is_super_admin());
create policy audit_admin_read on public.audit_log for select using (public.is_super_admin());
