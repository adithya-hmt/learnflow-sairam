-- Safe seed: does not create login credentials.
-- Remove the exact legacy demo rows so an older seed cannot leak fabricated data into the connected pilot.
delete from public.achievements where slug = 'first-login' and title = 'First steps' and description = 'Started your LearnFlow journey.';
delete from public.social_posts where body = 'Welcome to the LearnFlow community feed.' and club_name = 'LearnFlow';
update public.courses set status = 'archived' where code = 'CS101';

insert into public.courses (code, title, description, department, status, starts_on, ends_on) values
  ('24ITPC501', 'Computer Networks', 'Semester V core course from the R-2024 CSE syllabus.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24CSPW501', 'Artificial Intelligence with Laboratory', 'Semester V AI theory and laboratory course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24AIEL503', 'Human Centered Computing', 'Professional Elective I.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24ITEL516', 'Learning Analytics Tools', 'Professional Elective II.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24ITPL501', 'Computer Networks Laboratory', 'Semester V Computer Networks practical course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24MGMC501', 'Constitution of India', 'Mandatory Semester V course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('20CSTP501', 'Skill Enhancement', 'Skill and habits development course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24CSID501', 'Prototype Development Lab I', 'Semester V prototype development laboratory.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24CSEL503', 'Fundamentals of Cyber Security', 'Open elective.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29')
on conflict (code) do update set title = excluded.title, description = excluded.description, department = excluded.department,
  status = excluded.status, starts_on = excluded.starts_on, ends_on = excluded.ends_on;

-- The pilot account is provisioned only when its auth identity already exists.
update public.profiles
set full_name = coalesce(nullif(full_name, ''), 'ADITHYA S'), department = 'Computer Science and Engineering',
    year_of_study = 3, semester = 5, section = 'D'
where lower(email) = 'secl25cs08@sairamtap.edu.in' and role = 'student';

insert into public.timetable_slots (department, year_of_study, semester, section, weekday, period, course_id, course_code, display_title, starts_at, ends_at)
select 'Computer Science and Engineering', 3, 5, 'D', v.weekday, v.period, c.id, v.code, v.title, v.starts_at, v.ends_at
from (values
 (1,1,'20CSTP501','Skill Enhancement / 7 Habits','09:00'::time,'09:50'::time),(1,2,'24CSEL503','Fundamentals of Cyber Security','09:50','10:40'),(1,3,'24AIEL503','Human Centered Computing','10:55','11:45'),(1,4,'24AIEL503','Human Centered Computing','11:45','12:35'),(1,6,'24MGMC501','Constitution of India','13:25','14:15'),(1,7,'24CSPW501','Artificial Intelligence','14:15','15:05'),(1,8,'24ITPC501','Computer Networks','15:20','16:10'),
 (2,1,'24CSPW501','Artificial Intelligence Laboratory','09:00','09:50'),(2,2,'24CSPW501','Artificial Intelligence Laboratory','09:50','10:40'),(2,3,'24CSPW501','Artificial Intelligence Laboratory','10:55','11:45'),(2,4,'24ITEL516','Learning Analytics Tools','11:45','12:35'),(2,6,'24ITPC501','Computer Networks','13:25','14:15'),(2,7,'24CSPW501','Artificial Intelligence','14:15','15:05'),(2,8,'24MGMC501','Constitution of India','15:20','16:10'),
 (3,1,'24CSEL503','Fundamentals of Cyber Security','09:00','09:50'),(3,2,'24ITPC501','Computer Networks','09:50','10:40'),(3,3,'24AIEL503','Human Centered Computing','10:55','11:45'),(3,4,'24AIEL503','Human Centered Computing','11:45','12:35'),(3,6,'24CSPW501','Artificial Intelligence','13:25','14:15'),(3,7,'24CSEL503','Fundamentals of Cyber Security','14:15','15:05'),(3,8,'20CSTP501','Skill Enhancement / 7 Habits','15:20','16:10'),
 (4,1,'24ITEL516','Learning Analytics Tools','09:00','09:50'),(4,2,'24ITPC501','Computer Networks','09:50','10:40'),(4,3,'24CSID501','Prototype Development Lab I','10:55','11:45'),(4,4,'24CSID501','Prototype Development Lab I','11:45','12:35'),(4,6,'24ITPL501','Computer Networks Laboratory','13:25','14:15'),(4,7,'24ITPL501','Computer Networks Laboratory','14:15','15:05'),(4,8,'24ITPL501','Computer Networks Laboratory','15:20','16:10'),
 (5,1,'24ITPC501','Computer Networks','09:00','09:50'),(5,2,'24CSEL503','Fundamentals of Cyber Security','09:50','10:40'),(5,3,'24CSPW501','Artificial Intelligence','10:55','11:45'),(5,4,'24CSEL503','Fundamentals of Cyber Security','11:45','12:35'),(5,6,'24ITEL516','Learning Analytics Tools','13:25','14:15'),(5,7,'24ITEL516','Learning Analytics Tools','14:15','15:05'),(5,8,'24ITEL516','Learning Analytics Tools','15:20','16:10')
) v(weekday, period, code, title, starts_at, ends_at) join public.courses c on c.code = v.code
on conflict (department, year_of_study, semester, section, weekday, period) do update set course_id = excluded.course_id, course_code = excluded.course_code, display_title = excluded.display_title, starts_at = excluded.starts_at, ends_at = excluded.ends_at;

insert into public.enrollments (course_id, student_id, status)
select c.id, p.id, 'active' from public.courses c cross join public.profiles p
where lower(p.email) = 'secl25cs08@sairamtap.edu.in' and p.role = 'student'
  and c.code in ('24ITPC501','24CSPW501','24AIEL503','24ITEL516','24ITPL501','24MGMC501','20CSTP501','24CSID501','24CSEL503')
on conflict (course_id, student_id) do update set status = 'active';

insert into public.attendance_summaries (student_id, course_id, course_code, percentage, source, source_at)
select p.id, c.id, null, v.percentage, 'EDUMATE', '2026-08-06 16:25:00+05:30'::timestamptz
from public.profiles p cross join (values
  ('20CSTP501',90::numeric),('24AIEL503',90),('24CSID501',100),('24CSPW501',95.12),('24ITEL516',83.33),
  ('24ITPC501',86.96),('24ITPL501',80),('24MGMC501',100),('24CSEL503',75)
) v(code, percentage) join public.courses c on c.code = v.code
where lower(p.email) = 'secl25cs08@sairamtap.edu.in' and p.role = 'student'
on conflict (student_id, course_id) where course_id is not null do update set percentage = excluded.percentage, source = excluded.source, source_at = excluded.source_at;
insert into public.attendance_summaries (student_id, course_code, percentage, source, source_at)
select id, 'MC', 50, 'EDUMATE', '2026-08-06 16:25:00+05:30'::timestamptz from public.profiles where lower(email) = 'secl25cs08@sairamtap.edu.in' and role = 'student'
on conflict (student_id, course_code) where course_id is null and course_code is not null do update set percentage = excluded.percentage, source = excluded.source, source_at = excluded.source_at;
insert into public.attendance_summaries (student_id, percentage, source, source_at)
select id, 87.28, 'EDUMATE', '2026-08-06 16:25:00+05:30'::timestamptz from public.profiles where lower(email) = 'secl25cs08@sairamtap.edu.in' and role = 'student'
on conflict (student_id) where course_id is null and course_code is null do update set percentage = excluded.percentage, source = excluded.source, source_at = excluded.source_at;

with milestone(title, description, kind, starts_at, ends_at) as (values
  ('CAT I', 'Continuous Assessment Test I', 'exam'::public.event_kind, '2026-08-27 09:00:00+05:30'::timestamptz, '2026-09-03 16:10:00+05:30'::timestamptz),
  ('CAT I marks published', 'CAT I marks display date', 'deadline'::public.event_kind, '2026-09-08 09:00:00+05:30'::timestamptz, null::timestamptz),
  ('CAT I result review', 'Department result review', 'meeting'::public.event_kind, '2026-09-15 09:00:00+05:30'::timestamptz, null::timestamptz),
  ('Ideathon 7.0 inauguration', 'Institution innovation event', 'club'::public.event_kind, '2026-10-01 09:00:00+05:30'::timestamptz, null::timestamptz),
  ('Syllabus completion deadline', 'Last date for odd-semester syllabus completion', 'deadline'::public.event_kind, '2026-10-21 16:10:00+05:30'::timestamptz, null::timestamptz),
  ('CAT II', 'Continuous Assessment Test II', 'exam'::public.event_kind, '2026-10-22 09:00:00+05:30'::timestamptz, '2026-10-29 16:10:00+05:30'::timestamptz),
  ('Last working day', 'Course exit survey and last working day', 'deadline'::public.event_kind, '2026-10-29 16:10:00+05:30'::timestamptz, null::timestamptz),
  ('End-semester practical examinations', 'Odd-semester practical examinations', 'exam'::public.event_kind, '2026-10-30 09:00:00+05:30'::timestamptz, '2026-11-06 16:10:00+05:30'::timestamptz),
  ('End-semester theory examinations', 'Odd-semester theory examinations', 'exam'::public.event_kind, '2026-11-10 09:00:00+05:30'::timestamptz, '2026-11-24 16:10:00+05:30'::timestamptz),
  ('Even semester begins', 'Commencement of the 2026–27 even semester', 'class'::public.event_kind, '2026-12-10 09:00:00+05:30'::timestamptz, null::timestamptz),
  ('PGPA calculation deadline', 'Deadline for PGPA calculation', 'deadline'::public.event_kind, '2027-01-02 17:00:00+05:30'::timestamptz, null::timestamptz)
)
insert into public.calendar_events (title, description, kind, starts_at, ends_at)
select title, description, kind, starts_at, ends_at from milestone m
where not exists (select 1 from public.calendar_events e where e.title = m.title and e.starts_at = m.starts_at);
