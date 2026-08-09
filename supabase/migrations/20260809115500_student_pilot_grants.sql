-- New academic pilot tables are read-only through the client; authoritative writes stay server-side.
revoke all on public.timetable_slots, public.attendance_summaries from anon, authenticated;
grant select on public.timetable_slots, public.attendance_summaries to authenticated;
