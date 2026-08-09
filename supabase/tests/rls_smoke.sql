-- Run as a privileged local/test database role after both migrations. Everything rolls back.
begin;

do $$ declare blocked boolean := false; begin
  begin insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-000000000099', 'outsider@example.com', '{}'::jsonb); exception when others then blocked := true; end;
  if not blocked then raise exception 'Auth boundary failure: non-Sairam account was created'; end if;
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'student@sairamtap.edu.in', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'faculty@sairamtap.edu.in', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'club@sairamtap.edu.in', '{}'::jsonb);
set local session_replication_role = replica;
update public.profiles set role = 'student', department = 'CSE', year_of_study = 3, semester = 5, section = 'D' where id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'faculty', department = 'CSE' where id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'club_coordinator', department = 'OTHER' where id = '00000000-0000-0000-0000-000000000003';
set local session_replication_role = origin;
insert into public.courses (id, code, title, department, faculty_id, status) values ('10000000-0000-0000-0000-000000000001', 'RLS101', 'RLS test course', 'CSE', '00000000-0000-0000-0000-000000000002', 'published');
insert into public.enrollments (course_id, student_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.lessons (id, course_id, title, position, published) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Faculty draft', 99, false);
insert into public.assignments (id, course_id, title, created_by) values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Protected assignment', '00000000-0000-0000-0000-000000000002');
insert into public.quizzes (id, course_id, title, published) values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Protected quiz', true);
insert into public.quiz_questions (id, quiz_id, prompt, position) values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Protected question', 1);
insert into public.quiz_answer_keys (question_id, answer) values ('50000000-0000-0000-0000-000000000001', 'secret');
insert into public.lessons (id, course_id, title, position, published) values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Published lesson', 100, true);
insert into public.timetable_slots (department, year_of_study, semester, section, weekday, period, course_code, display_title, starts_at, ends_at)
values ('OTHER', 3, 5, 'A', 1, 1, 'RLS101', 'Other cohort slot', '09:00', '09:50'),
       ('CSE', 3, 5, 'D', 1, 2, 'RLS101', 'Matching cohort slot', '09:50', '10:40');
insert into public.attendance_summaries (student_id, percentage, source, source_at)
values ('00000000-0000-0000-0000-000000000001', 87.28, 'EDUMATE', '2026-08-06 16:25:00+05:30');
insert into public.notifications (recipient_id, title, body) values ('00000000-0000-0000-0000-000000000002', 'Other', 'Not mine');
insert into public.attendance_summaries (student_id, percentage, source, source_at) values ('00000000-0000-0000-0000-000000000002', 12, 'EDUMATE', '2026-08-06 16:25:00+05:30');

set local role anon;
do $$ declare blocked boolean := false; begin
  begin perform 1 from public.timetable_slots; exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: anon read timetable'; end if;
  blocked := false;
  begin perform 1 from public.attendance_summaries; exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: anon read attendance summaries'; end if;
  blocked := false;
  begin insert into public.timetable_slots (department, year_of_study, semester, section, weekday, period, course_code, display_title, starts_at, ends_at)
    values ('X', 1, 1, 'A', 1, 1, 'X', 'X', '09:00', '09:50'); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: anon inserted timetable'; end if;
  blocked := false;
  begin update public.attendance_summaries set percentage = 1; exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: anon updated attendance summaries'; end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$ declare blocked boolean := false; begin
  begin update public.profiles set role = 'super_admin' where id = auth.uid(); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student changed own role'; end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin update public.attendance_summaries set percentage = 99 where student_id = auth.uid(); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student updated attendance summary'; end if;
  blocked := false;
  begin delete from public.attendance_summaries where student_id = auth.uid(); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student deleted attendance summary'; end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin update public.profiles set section = 'A' where id = auth.uid(); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student changed own cohort'; end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin insert into public.attendance_summaries (student_id, percentage, source, source_at)
    values (auth.uid(), 88, 'tampered', now()); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student wrote attendance summary'; end if;
end $$;
do $$ begin
  if not exists (select 1 from public.timetable_slots where department = 'CSE' and section = 'D') then raise exception 'RLS failure: student missed matching timetable cohort'; end if;
  if exists (select 1 from public.timetable_slots where department = 'OTHER') then raise exception 'RLS failure: student read another timetable cohort'; end if;
end $$;
do $$ begin
  if exists (select 1 from public.lessons where id = '20000000-0000-0000-0000-000000000001') then raise exception 'RLS failure: student read unpublished lesson'; end if;
end $$;
insert into public.submissions (assignment_id, student_id, content, status) values ('30000000-0000-0000-0000-000000000001', auth.uid(), 'own draft', 'draft');
insert into public.lesson_progress (lesson_id, student_id, position_seconds) values ('20000000-0000-0000-0000-000000000002', auth.uid(), 10);
do $$ begin
  if not exists (select 1 from public.submissions where student_id = auth.uid() and status = 'draft') then raise exception 'RLS failure: student cannot read own draft'; end if;
  if not exists (select 1 from public.lesson_progress where student_id = auth.uid()) then raise exception 'RLS failure: student cannot read own progress'; end if;
end $$;
do $$ begin
  if exists (select 1 from public.quiz_answer_keys) then raise exception 'RLS failure: student read quiz answer key'; end if;
end $$;
do $$ begin
  if exists (select 1 from public.notifications where recipient_id = '00000000-0000-0000-0000-000000000002') then raise exception 'RLS failure: student read another user notification'; end if;
  if exists (select 1 from public.attendance_summaries where student_id = '00000000-0000-0000-0000-000000000002') then raise exception 'RLS failure: student read another user attendance'; end if;
end $$;
insert into public.notifications (recipient_id, title, body) values (auth.uid(), 'Private', 'Only my account');
do $$ begin
  if not exists (select 1 from public.notifications where recipient_id = auth.uid() and title = 'Private') then raise exception 'RLS failure: student could not read own notification'; end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin insert into public.submissions (assignment_id, student_id, content, status, score) values ('30000000-0000-0000-0000-000000000001', auth.uid(), 'tamper', 'graded', 100); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student inserted own grade'; end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin insert into public.quiz_attempts (quiz_id, student_id, score) values ('40000000-0000-0000-0000-000000000001', auth.uid(), 100); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student inserted quiz score'; end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin insert into public.calendar_events (owner_id, course_id, title, starts_at) values (auth.uid(), '10000000-0000-0000-0000-000000000001', 'Fake deadline', now()); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student injected course event'; end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
do $$ begin
  if exists (select 1 from public.assignments where id = '30000000-0000-0000-0000-000000000001') then raise exception 'RLS failure: club coordinator read academic assignment'; end if;
end $$;
do $$ begin
  if exists (select 1 from public.attendance_summaries where student_id = '00000000-0000-0000-0000-000000000001') then raise exception 'RLS failure: role-scoped staff read outside department attendance'; end if;
end $$;

reset role;
rollback;
