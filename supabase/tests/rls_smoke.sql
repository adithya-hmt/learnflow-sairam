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
update public.profiles set role = 'student', department = 'CSE' where id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'faculty', department = 'CSE' where id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'club_coordinator', department = 'CSE' where id = '00000000-0000-0000-0000-000000000003';
set local session_replication_role = origin;
insert into public.courses (id, code, title, department, faculty_id, status) values ('10000000-0000-0000-0000-000000000001', 'RLS101', 'RLS test course', 'CSE', '00000000-0000-0000-0000-000000000002', 'published');
insert into public.enrollments (course_id, student_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
insert into public.lessons (id, course_id, title, position, published) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Faculty draft', 99, false);
insert into public.assignments (id, course_id, title, created_by) values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Protected assignment', '00000000-0000-0000-0000-000000000002');
insert into public.quizzes (id, course_id, title, published) values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Protected quiz', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

do $$ declare blocked boolean := false; begin
  begin update public.profiles set role = 'super_admin' where id = auth.uid(); exception when others then blocked := true; end;
  if not blocked then raise exception 'RLS failure: student changed own role'; end if;
end $$;
do $$ begin
  if exists (select 1 from public.lessons where id = '20000000-0000-0000-0000-000000000001') then raise exception 'RLS failure: student read unpublished lesson'; end if;
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

reset role;
rollback;
