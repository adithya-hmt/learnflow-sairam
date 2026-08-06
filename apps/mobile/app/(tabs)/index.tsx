import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Pill, Progress, Screen, Section, s } from '@/components';
import { formatClockTime, formatDateTime, parseDate, roleLabels } from '@/domain';
import { useAppStore } from '@/store';
import { colors } from '@/theme';
import { useAssignments, useCourseProgress, useCourses, useEvents, useProfile } from '@/data/hooks';
import { useAuth } from '@/auth';

export default function Home() {
  const auth = useAuth();
  const { role, online } = useAppStore();
  const { data: profile } = useProfile();
  const { data: courseRows = [] } = useCourses();
  const { data: progressRows = [] } = useCourseProgress();
  const { data: assignmentRows = [] } = useAssignments();
  const { data: eventRows = [] } = useEvents();
  const palette = [colors.blue, colors.green, colors.coral];
  const courses = courseRows.map((item, index) => ({ ...item, progress: progressRows.find((progress) => progress.courseId === item.id)?.percent ?? 0, color: palette[index % palette.length] }));
  const assignments = assignmentRows.map((item) => ({ id: item.id, course: item.course, title: item.title, due: item.dueAt ? formatDateTime(item.dueAt) : item.status, status: item.status }));
  const events = eventRows.map((item) => { const startsAt = parseDate(item.startsAt); return { id: item.id, time: startsAt ? formatClockTime(startsAt) : 'Time unavailable', title: item.title, meta: item.location || item.description || item.kind }; });
  const activeRole = profile?.role ?? role;
  const fallbackName = auth.configured ? 'Student' : 'Adithya Kumar';
  const firstName = profile?.fullName?.split(' ')[0] || fallbackName.split(' ')[0];
  const initials = (profile?.fullName || fallbackName).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <Screen title={`Good morning, ${firstName}`} subtitle={`${roleLabels[activeRole]} · ${profile?.department || (auth.configured ? 'Department not set' : 'Computer Science')}`} action={<Pressable accessibilityLabel="Open profile" onPress={() => router.push('/(tabs)/profile')} style={h.avatar}><Text style={h.avatarText}>{initials}</Text></Pressable>}>
    {!online && <View style={h.offline}><Text style={h.offlineText}>Offline mode · changes will sync later</Text></View>}
    <Card style={h.hero}><View style={s.between}><Pill text="TODAY'S FOCUS" tone="green" />{!auth.configured && <View style={h.streakRow}><Ionicons name="flame" size={15} color="#FBBF24" /><Text style={h.streak}>12 day streak</Text></View>}</View><Text style={h.heroTitle}>Finish strong.</Text><Text style={h.heroBody}>{auth.configured ? `${events.length} upcoming events and ${assignments.length} assignments are available.` : '3 classes and 2 tasks are waiting. Your next lesson takes 18 minutes.'}</Text>{!auth.configured && <><Progress value={72} color={colors.green} /><View style={s.between}><Text style={h.heroMeta}>Daily goal</Text><Text style={h.heroMeta}>43 / 60 min</Text></View></>}</Card>
    <Section title="Continue learning" action="See all" onAction={() => router.push('/(tabs)/learn')}>{courses.slice(0, 2).map((course) => <Pressable key={course.id} onPress={() => router.push(`/course/${course.id}`)}><Card><View style={s.between}><View style={{ flex: 1, marginRight: 12 }}><Text style={h.code}>{course.code}</Text><Text style={h.cardTitle}>{course.title}</Text><Text style={s.body}>Next · Knowledge representation</Text></View><Text style={[h.percent, { color: course.color }]}>{course.progress}%</Text></View><View style={{ marginTop: 14 }}><Progress value={course.progress} color={course.color} /></View></Card></Pressable>)}</Section>
    <Section title="Due soon" action="Open planner" onAction={() => router.push('/(tabs)/plan')}>{assignments.slice(0, 2).map((a, i) => <Pressable key={a.id} onPress={() => router.push(`/assignment/${a.id}`)}><Card style={h.assignment}><View style={[h.dueBar, { backgroundColor: i ? colors.gold : colors.coral }]} /><View style={{ flex: 1 }}><Text style={h.cardTitle}>{a.title}</Text><Text style={s.body}>{a.course} · {a.due}</Text></View><Pill text={a.status} tone={i ? 'gold' : 'coral'} /></Card></Pressable>)}</Section>
    <Section title="Up next">{events.slice(0, 2).map((e) => <View key={e.id} style={h.event}><Text style={h.time}>{e.time}</Text><View style={h.eventLine} /><View><Text style={h.cardTitle}>{e.title}</Text><Text style={s.body}>{e.meta}</Text></View></View>)}</Section>
    <Pressable onPress={() => router.push('/social')}><Card style={h.social}><View style={{ flex: 1 }}><Text style={h.socialTitle}>Sairam Social</Text><Text style={h.socialBody}>Clubs, departments and campus stories — in one trusted feed.</Text></View><Ionicons name="chevron-forward" size={22} color={colors.green} /></Card></Pressable>
  </Screen>;
}
const h = StyleSheet.create({ avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: 'white', fontWeight: '900' }, offline: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 10, marginBottom: 5 }, offlineText: { color: '#92400E', textAlign: 'center', fontWeight: '700', fontSize: 12 }, hero: { backgroundColor: colors.blue, borderColor: colors.blue, gap: 10 }, streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, streak: { color: '#DBEAFE', fontSize: 12, fontWeight: '700' }, heroTitle: { color: 'white', fontSize: 26, fontWeight: '800', marginTop: 3 }, heroBody: { color: '#DBEAFE', lineHeight: 20 }, heroMeta: { color: '#BFDBFE', fontSize: 11, fontWeight: '700' }, code: { color: colors.blue, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 }, cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginVertical: 3 }, percent: { fontSize: 21, fontWeight: '900' }, assignment: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 11 }, dueBar: { width: 4, height: 42, borderRadius: 8 }, event: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 54 }, time: { color: colors.blue, fontSize: 12, fontWeight: '800', width: 48, paddingTop: 2 }, eventLine: { width: 2, height: 48, backgroundColor: colors.line, marginRight: 14 }, social: { backgroundColor: colors.mint, borderColor: '#99F6E4', marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, socialTitle: { color: '#0F766E', fontSize: 18, fontWeight: '900' }, socialBody: { color: '#0F766E', fontSize: 13, lineHeight: 18, maxWidth: 260, marginTop: 3 } });
