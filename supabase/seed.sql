-- Safe seed: does not create login credentials. It enriches the first existing profile when one exists.
insert into public.courses (code, title, description, department, status)
values ('CS101', 'Foundations of Computing', 'A practical introduction to programming and problem solving.', 'Computer Science', 'published')
on conflict (code) do update set title = excluded.title, description = excluded.description;

insert into public.courses (code, title, description, department, status, starts_on, ends_on) values
  ('24ITPC501', 'Computer Networks', 'Semester V core course from the R-2024 CSE syllabus.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24CSPW501', 'Artificial Intelligence with Laboratory', 'Semester V AI theory and laboratory course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24AIEL503', 'Human Centered Computing', 'Professional Elective I.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24ITEL516', 'Learning Analytics Tools', 'Professional Elective II.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24ITPL501', 'Computer Networks Laboratory', 'Semester V Computer Networks practical course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24MGMC501', 'Constitution of India', 'Mandatory Semester V course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24CSTP501', 'Skill Enhancement', 'Skill and habits development course.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24CSID501', 'Prototype Development Lab I', 'Semester V prototype development laboratory.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29'),
  ('24SCOE901', 'Fundamentals of Cyber Security', 'Open elective.', 'Computer Science and Engineering', 'published', '2026-07-02', '2026-10-29')
on conflict (code) do update set title = excluded.title, description = excluded.description, starts_on = excluded.starts_on, ends_on = excluded.ends_on;

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

insert into public.lessons (course_id, title, summary, position, published)
select id, 'Welcome to LearnFlow', 'Orientation, outcomes, and how to study offline.', 1, true
from public.courses where code = 'CS101'
on conflict (course_id, position) do update set title = excluded.title, summary = excluded.summary, published = true;

insert into public.calendar_events (title, description, kind, starts_at, ends_at, course_id)
select 'CS101 orientation', 'Bring your student ID for attendance.', 'class', now() + interval '1 day', now() + interval '1 day 1 hour', id
from public.courses where code = 'CS101'
and not exists (select 1 from public.calendar_events where title = 'CS101 orientation');

do $$
declare p uuid;
begin
  select id into p from public.profiles order by created_at limit 1;
  if p is not null then
    insert into public.social_posts (author_id, body, club_name)
    select p, 'Welcome to the LearnFlow community feed.', 'LearnFlow'
    where (select role from public.profiles where id = p) in ('club_coordinator','department_admin','super_admin')
    and not exists (select 1 from public.social_posts where body = 'Welcome to the LearnFlow community feed.');
    insert into public.achievements (student_id, slug, title, description)
    select p, 'first-login', 'First steps', 'Started your LearnFlow journey.'
    where (select role from public.profiles where id = p) = 'student'
    on conflict (student_id, slug) do nothing;
  end if;
end $$;
