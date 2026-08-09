import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card, Pill, Progress, Screen, Section, s } from '@/components';
import { recentAttendance, student, subjectAttendance } from '@/studentData';
import { colors } from '@/theme';
import { formatDateTime } from '@/domain';
import { useAuth } from '@/auth';
import { useAttendance, useAttendanceSummaries, useProfile } from '@/data/hooks';
import { getAttendanceReceipts, type AttendanceReceipt } from '@/attendance-receipts';

const toneFor = (value: number) => value < 75 ? colors.coral : value < 85 ? colors.gold : value < 95 ? colors.blue : colors.green;
const labelFor = (value: number) => value < 75 ? 'Needs attention' : value < 85 ? 'Watch' : value < 95 ? 'Good' : 'Excellent';

export default function Attendance() {
  const auth = useAuth();
  const { data: profile } = useProfile();
  const { data: records = [] } = useAttendance();
  const { data: summaries = [] } = useAttendanceSummaries();
  const [receipts, setReceipts] = useState<AttendanceReceipt[]>([]);
  useFocusEffect(useCallback(() => { void getAttendanceReceipts().then(setReceipts); }, []));
  if (auth.configured) { const overall = summaries.length ? summaries.reduce((sum, item) => sum + item.percentage, 0) / summaries.length : null; return <Screen title="My attendance" subtitle={profile?.fullName || 'Signed-in student'}>
    <Pressable accessibilityRole="button" onPress={() => router.push('/scan-attendance')}><Card style={a.scan}><View><Text style={a.scanTitle}>Scan classroom QR</Text><Text style={a.scanBody}>Read the current attendance token</Text></View><Text style={a.scanArrow}>›</Text></Card></Pressable>
    <Card style={a.hero}><View><Text style={a.percent}>{overall == null ? '—' : `${overall.toFixed(1)}%`}</Text><Text style={a.heroLabel}>Overall attendance</Text></View><View style={a.heroSide}><Pill text="IMPORTED SUMMARY" tone="green" /><Text style={a.heroText}>{profile?.department || 'Department not set'}</Text><Text style={a.heroMeta}>Percentages are sourced from the latest published attendance summary.</Text></View></Card>
    <Section title="Course attendance">{summaries.length === 0 ? <Card><Text style={s.body}>No attendance summary is available for this account yet.</Text></Card> : summaries.map((summary) => <Card key={summary.id} style={a.subject}><View style={s.between}><View style={{ flex: 1 }}><Text style={a.code}>{summary.courseCode || 'Course'}</Text><Text style={s.body}>{summary.attendedCount == null || summary.heldCount == null ? 'Session totals unavailable' : `${summary.attendedCount} of ${summary.heldCount} sessions attended`}</Text></View><Text style={[a.subjectPercent, { color: toneFor(summary.percentage) }]}>{summary.percentage.toFixed(1)}%</Text></View><Progress value={summary.percentage} color={toneFor(summary.percentage)} /></Card>)}</Section>
    <Card style={a.source}><Text style={a.sourceTitle}>Imported source</Text><Text style={s.body}>{summaries[0] ? `${summaries[0].source || 'Attendance system'} · ${formatDateTime(summaries[0].sourceAt)}` : 'Source timestamp unavailable until a summary is published.'}</Text></Card>
    <ReceiptSection receipts={receipts} />
  </Screen>; }
  const belowMinimum = subjectAttendance.filter((subject) => subject.percentage < 75).length;
  const watchlist = subjectAttendance.filter((subject) => subject.percentage >= 75 && subject.percentage < 85).length;
  return <Screen title="My attendance" subtitle={`${student.name} · ${student.rollNo}`}>
    <Pressable accessibilityRole="button" onPress={() => router.push('/scan-attendance')}><Card style={a.scan}><View><Text style={a.scanTitle}>Scan classroom QR</Text><Text style={a.scanBody}>Read the current attendance token</Text></View><Text style={a.scanArrow}>›</Text></Card></Pressable>
    <Card style={a.hero}><View><Text style={a.percent}>{student.attendance.toFixed(2)}%</Text><Text style={a.heroLabel}>Overall attendance</Text></View><View style={a.heroSide}><Pill text="ABOVE 75%" tone="green" /><Text style={a.heroText}>{student.branch}</Text><Text style={a.heroMeta}>{student.year} · {student.semester} · Section {student.section}</Text></View></Card>
    <View style={a.stats}><Card style={a.stat}><Text style={a.statValue}>{subjectAttendance.length}</Text><Text style={s.body}>Subjects</Text></Card><Card style={a.stat}><Text style={[a.statValue, { color: colors.gold }]}>{watchlist}</Text><Text style={s.body}>Watchlist</Text></Card><Card style={a.stat}><Text style={[a.statValue, { color: colors.coral }]}>{belowMinimum}</Text><Text style={s.body}>Below 75%</Text></Card></View>
    <Section title="Subject attendance">{subjectAttendance.map((subject) => <Card key={subject.code} style={a.subject}><View style={s.between}><View style={{ flex: 1, marginRight: 12 }}><Text style={a.code}>{subject.code}</Text><Text style={a.subjectName}>{subject.name}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={[a.subjectPercent, { color: toneFor(subject.percentage) }]}>{subject.percentage}%</Text><Text style={a.status}>{labelFor(subject.percentage)}</Text></View></View><View style={{ marginTop: 12 }}><Progress value={subject.percentage} color={toneFor(subject.percentage)} /></View></Card>)}</Section>
    <Section title="Recent day-wise record"><Card><View style={a.legend}><Legend color={colors.green} label="Present" /><Legend color={colors.blue} label="On duty" /><Legend color={colors.coral} label="Absent" /></View>{recentAttendance.map((day) => <View key={day.date} style={a.dayRow}><Text style={a.date}>{day.date}</Text><View style={a.marks}>{day.status.map((status, index) => <View key={`${day.date}-${index}`} style={[a.mark, status === 'P' ? a.present : status === 'OD' ? a.od : status === 'AB' ? a.absent : a.empty]}><Text style={[a.markText, status === '—' && { color: colors.muted }]}>{status}</Text></View>)}</View></View>)}</Card></Section>
    <ReceiptSection receipts={receipts} />
    <Card style={a.source}><Text style={a.sourceTitle}>Attendance report</Text><Text style={s.body}>Imported from your EDUMATE report generated on 6 August 2026 at 4:25 PM. Refresh it when a newer report is available.</Text></Card>
  </Screen>;
}

function Legend({ color, label }: { color: string; label: string }) { return <View style={s.row}><View style={[a.legendDot, { backgroundColor: color }]} /><Text style={a.legendText}>{label}</Text></View>; }
function ReceiptSection({ receipts }: { receipts: AttendanceReceipt[] }) { return <Section title="Scan receipts"><Card>{receipts.length === 0 ? <Text style={s.body}>Your live QR scans will appear here.</Text> : receipts.slice(0, 5).map((receipt) => <View key={receipt.id} style={a.receipt}><View style={{ flex: 1 }}><Text style={a.receiptTitle}>Class {receipt.classCode}</Text><Text style={s.body}>{new Date(receipt.scannedAt).toLocaleString('en-IN')} · {receipt.schedule}</Text></View><Pill text={receipt.status.replace('-', ' ').toUpperCase()} tone={receipt.status === 'confirmed' ? 'green' : receipt.status === 'rejected' || receipt.status === 'outside-window' ? 'coral' : receipt.status === 'pending' || receipt.status === 'unverified' ? 'gold' : 'blue'} /></View>)}</Card></Section>; }

const a = StyleSheet.create({
  scan: { backgroundColor: colors.mint, borderColor: '#B7E4D8', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, scanTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, scanBody: { color: colors.green, fontSize: 12, marginTop: 3 }, scanArrow: { color: colors.green, fontSize: 30, fontWeight: '300' }, hero: { backgroundColor: colors.navy, borderColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: 18 }, percent: { color: colors.white, fontSize: 39, fontWeight: '900', letterSpacing: -1 }, heroLabel: { color: '#BFD0D9', fontSize: 11, fontWeight: '700' }, heroSide: { flex: 1, gap: 5 }, heroText: { color: colors.white, fontSize: 13, fontWeight: '800', marginTop: 3 }, heroMeta: { color: '#BFD0D9', fontSize: 10, lineHeight: 15 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 8 }, stat: { flex: 1, padding: 12 }, statValue: { color: colors.ink, fontSize: 21, fontWeight: '900' }, subject: { gap: 2 }, code: { color: colors.blue, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, subjectName: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 3 }, subjectPercent: { fontSize: 20, fontWeight: '900' }, status: { color: colors.muted, fontSize: 9, marginTop: 2 }, receipt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }, receiptTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  legend: { flexDirection: 'row', gap: 13, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, legendDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 }, legendText: { color: colors.muted, fontSize: 9, fontWeight: '700' }, dayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line }, date: { color: colors.ink, width: 48, fontSize: 11, fontWeight: '900' }, marks: { flex: 1, flexDirection: 'row', gap: 4 }, mark: { flex: 1, minWidth: 27, height: 27, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, present: { backgroundColor: colors.mint }, od: { backgroundColor: colors.sky }, absent: { backgroundColor: '#F8E3DF' }, empty: { backgroundColor: colors.paper }, markText: { color: colors.ink, fontSize: 8, fontWeight: '900' }, source: { backgroundColor: colors.sky, marginTop: 15 }, sourceTitle: { color: colors.navy, fontSize: 15, fontWeight: '900', marginBottom: 4 },
});
