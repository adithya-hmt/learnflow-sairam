import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Card, Pill, Screen, Section, s } from '@/components';
import { formatCalendarDate, formatClockTime, formatDateTime, getWeekDates, isUpcomingEvent } from '@/domain';
import { useAssignments, useEvents, useProfile } from '@/data/hooks';
import { academicMilestones, getScheduleStatus, isWeekday, periods, timetable, weekdays, type Weekday } from '@/studentData';
import { colors } from '@/theme';
import { useAuth } from '@/auth';

const weekdayFor = (date: Date): Weekday | null => {
  const value = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  return isWeekday(value) ? value : null;
};

const periodTime = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return formatClockTime(date);
};

export default function Calendar() {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<Weekday>(() => weekdayFor(new Date()) ?? 'Monday');
  const auth = useAuth();
  const { data: profile } = useProfile();
  const { data: assignments = [] } = useAssignments();
  const { data: events = [] } = useEvents();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const currentWeekday = weekdayFor(now);
  const weekDates = useMemo(() => getWeekDates(now), [now.getFullYear(), now.getMonth(), now.getDate()]);
  const upcomingEvents = useMemo(() => events.filter((event) => isUpcomingEvent(event.startsAt, event.endsAt, now)), [events, now]);
  const status = currentWeekday === selected ? getScheduleStatus(selected, now) : null;

  if (auth.configured) return <Screen title="My calendar" subtitle={profile?.department || 'Your live college schedule'}>
    <ClockCard now={now} message="Live schedule uses this device’s local time." />
    <Section title="Upcoming events">{upcomingEvents.length === 0 ? <Card><Text style={s.body}>No upcoming classes or events are currently published for this account.</Text></Card> : upcomingEvents.slice(0, 12).map((event) => <Card key={event.id}><Text style={c.title}>{event.title}</Text><Text style={s.body}>{formatDateTime(event.startsAt)} · {event.location || event.kind}</Text></Card>)}</Section>
    <Section title="Upcoming work">{assignments.length === 0 ? <Card><Text style={s.body}>No pending assignments are currently published.</Text></Card> : assignments.slice(0, 8).map((item) => <Pressable key={item.id} onPress={() => router.push(`/assignment/${item.id}`)}><Card style={c.assignment}><View style={{ flex: 1 }}><Text style={c.title}>{item.title}</Text><Text style={s.body}>{item.course} · {item.dueAt ? formatDateTime(item.dueAt) : item.status}</Text></View><Pill text={item.status} tone="gold" /></Card></Pressable>)}</Section>
  </Screen>;

  const classes = timetable[selected];
  const clockMessage = currentWeekday !== selected
    ? `Showing ${selected}’s timetable.`
    : status?.current
      ? `${status.current.code} now · ends ${periodTime(status.current.end)}`
      : status?.next
        ? `Next: ${status.next.code} at ${periodTime(status.next.start)}`
        : currentWeekday ? 'Classes are complete for today.' : 'No college timetable today.';

  return <Screen title="My calendar" subtitle="CSE · Section D · V Semester">
    <ClockCard now={now} message={clockMessage} />
    <View style={c.days}>{weekdays.map((day, index) => {
      const active = selected === day;
      const today = currentWeekday === day;
      return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`${day}, ${formatCalendarDate(weekDates[index])}`} key={day} onPress={() => setSelected(day)} style={[c.day, active && c.dayActive]}>
        <View style={c.dayLabel}><Text style={[c.dayShort, active && c.activeText]}>{day.slice(0, 3).toUpperCase()}</Text>{today && <View style={[c.todayDot, active && c.todayDotActive]} />}</View>
        <Text style={[c.dayCount, active && c.activeText]}>{weekDates[index].getDate()}</Text>
      </Pressable>;
    })}</View>
    <Section title={`${selected} · ${classes.length} periods`}><Card style={c.timeline}>{classes.map((item, index) => {
      const time = periods.find((period) => period.period === item.period);
      const previous = classes[index - 1];
      const isContinuation = previous?.code === item.code;
      const isNow = status?.current?.period === item.period;
      return <View key={`${item.period}-${item.code}`} style={[c.slot, isNow && c.slotNow]}><View style={c.time}><Text style={c.start}>{time?.start}</Text><Text style={c.end}>{time?.end}</Text></View><View style={[c.line, { backgroundColor: isNow ? colors.coral : item.code.includes('LAB') || item.code === 'PDL-I' ? colors.green : colors.blue }]} /><View style={{ flex: 1 }}><View style={s.row}><Text style={c.title}>{item.code}</Text>{isNow ? <Pill text="Now" tone="coral" /> : isContinuation && <Pill text="Continued" tone="green" />}</View><Text style={s.body}>{item.title}</Text><Text style={c.period}>Period {item.period}</Text></View></View>;
    })}</Card></Section>
    <Section title="Breaks"><View style={c.breaks}><Card style={c.break}><Text style={c.breakTitle}>Short break</Text><Text style={s.body}>10:40–10:55</Text></Card><Card style={c.break}><Text style={c.breakTitle}>Lunch</Text><Text style={s.body}>12:35–13:25</Text></Card><Card style={c.break}><Text style={c.breakTitle}>Short break</Text><Text style={s.body}>15:05–15:20</Text></Card></View></Section>
    <Section title="Academic calendar · Odd 2026–27">{academicMilestones.map((item) => <Card key={`${item.date}-${item.title}`} style={c.milestone}><Pill text={item.date} tone={item.tone} /><Text style={c.milestoneTitle}>{item.title}</Text></Card>)}</Section>
    {upcomingEvents.length > 0 && <Section title="College events">{upcomingEvents.slice(0, 3).map((event) => <Card key={event.id}><Text style={c.title}>{event.title}</Text><Text style={s.body}>{formatDateTime(event.startsAt)} · {event.location || event.kind}</Text></Card>)}</Section>}
    <Section title="Upcoming work">{assignments.length === 0 ? <Card><Text style={s.body}>No pending assignments are currently published.</Text></Card> : assignments.slice(0, 3).map((item) => <Pressable key={item.id} onPress={() => router.push(`/assignment/${item.id}`)}><Card style={c.assignment}><View style={{ flex: 1 }}><Text style={c.title}>{item.title}</Text><Text style={s.body}>{item.course} · {item.dueAt ? formatDateTime(item.dueAt) : item.status}</Text></View><Pill text={item.status} tone="gold" /></Card></Pressable>)}</Section>
  </Screen>;
}

function ClockCard({ now, message }: { now: Date; message: string }) {
  return <Card style={c.clock}><View style={c.clockTop}><View><View style={c.clockLabel}><Ionicons name="time-outline" size={15} color="#BFDBFE" /><Text style={c.clockEyebrow}>DEVICE TIME</Text></View><Text style={c.clockTime}>{formatClockTime(now)}</Text><Text style={c.clockDate}>{formatCalendarDate(now)}</Text></View><View style={c.live}><View style={c.liveDot} /><Text style={c.liveText}>LIVE</Text></View></View><Text style={c.clockMessage}>{message}</Text></Card>;
}

const c = StyleSheet.create({
  clock: { backgroundColor: colors.blue, borderColor: colors.blue, marginBottom: 7, gap: 13 }, clockTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, clockLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 }, clockEyebrow: { color: '#BFDBFE', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, clockTime: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -0.6, marginTop: 5 }, clockDate: { color: '#DBEAFE', fontSize: 12, fontWeight: '700', marginTop: 2 }, live: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF20', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#5EEAD4' }, liveText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, clockMessage: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: '800', borderTopWidth: 1, borderTopColor: '#FFFFFF25', paddingTop: 12 },
  days: { flexDirection: 'row', gap: 7 }, day: { flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 15, paddingVertical: 9, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, dayActive: { backgroundColor: colors.navy, borderColor: colors.navy }, dayLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 }, dayShort: { color: colors.muted, fontSize: 9, fontWeight: '900' }, dayCount: { color: colors.ink, fontSize: 19, fontWeight: '900', marginTop: 4 }, activeText: { color: colors.white }, todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.blue }, todayDotActive: { backgroundColor: '#5EEAD4' },
  timeline: { paddingVertical: 7 }, slot: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 8, alignItems: 'flex-start', borderRadius: 12 }, slotNow: { backgroundColor: colors.sky }, time: { width: 48 }, start: { color: colors.ink, fontSize: 12, fontWeight: '900' }, end: { color: colors.muted, fontSize: 9, marginTop: 2 }, line: { width: 3, height: 48, borderRadius: 4, marginHorizontal: 11 }, title: { color: colors.ink, fontSize: 14, fontWeight: '900', marginRight: 8 }, period: { color: colors.muted, fontSize: 10, marginTop: 4 },
  breaks: { flexDirection: 'row', gap: 7 }, break: { flex: 1, padding: 11 }, breakTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' }, milestone: { flexDirection: 'row', alignItems: 'center', gap: 12 }, milestoneTitle: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' }, assignment: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
