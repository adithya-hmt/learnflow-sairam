import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Pill, Screen, Section, s } from '@/components';
import { buildConnectionUrl, buildObsidianDailyUrl, connections, type ConnectionCategory, type ConnectionId } from '@/lib/connections';
import { isWeekday, student, timetable } from '@/studentData';
import { colors } from '@/theme';
import { openExternalUrl } from '@/lib/links';
import { useAuth } from '@/auth';
import { useEvents, useProfile } from '@/data/hooks';

const groups: { id: ConnectionCategory; title: string }[] = [
  { id: 'workspace', title: 'Google Workspace' }, { id: 'learning', title: 'College & coding' }, { id: 'workflow', title: 'Personal workflow' },
];

export default function Connections() {
  const auth = useAuth();
  const { data: profile } = useProfile();
  const { data: events = [] } = useEvents();
  const accountEmail = profile?.email || auth.session?.user.email || 'secl25cs08@sairamtap.edu.in';
  const firstName = profile?.fullName?.split(' ')[0] || (auth.configured ? 'Your' : 'Adithya');
  const open = async (id: ConnectionId) => {
    try {
      if (id === 'obsidian') {
        const today = new Date();
        const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);
        const classes = auth.configured
          ? events.filter((event) => new Date(event.startsAt).toDateString() === today.toDateString()).map((event) => `- ${event.title}${event.location ? ` · ${event.location}` : ''}`).join('\n') || '- No classes scheduled'
          : isWeekday(weekday) ? timetable[weekday].map((item) => `- P${item.period} ${item.code}: ${item.title}`).join('\n') : '- No classes scheduled';
        const attendance = auth.configured ? '' : `\nAttendance: ${student.attendance}%\n`;
        await openExternalUrl(buildObsidianDailyUrl(`# LearnFlow\n${attendance}\n## Classes\n${classes}\n`));
      } else await openExternalUrl(buildConnectionUrl(id, { accountEmail }));
    } catch {
      Alert.alert('Could not open connection', id === 'obsidian' ? 'Install Obsidian, enable Daily Notes, and keep the mobile vault name as UltronVault.' : 'Check that the app or browser is available.');
    }
  };
  return <Screen title="Connections" subtitle="Sairam Workspace, college portals and your study tools">
    <Card style={c.hero}><Pill text={`${firstName.toUpperCase()}'S WORKSPACE`} tone="gold" /><Text style={c.heroTitle}>Everything you use, one clean launchpad.</Text><Text style={c.heroBody}>{accountEmail}</Text><View style={c.safeRow}><Ionicons name="shield-checkmark-outline" size={15} color="#A7F3D0" /><Text style={c.safeText}>Official destinations · no third-party passwords stored</Text></View></Card>
    {groups.map((group) => <Section key={group.id} title={group.title}>{connections.filter((item) => item.category === group.id).map((connection) => <Card key={connection.id} style={c.card}>
      <View style={[c.icon, { backgroundColor: `${connection.color}18` }]}><Ionicons name={connection.icon} size={23} color={connection.color} /></View>
      <View style={c.detail}><View style={c.titleRow}><Text style={c.name}>{connection.label}</Text><Ionicons name="open-outline" size={15} color={colors.muted} /></View><Text style={c.limit}>{connection.limitation}</Text><Pressable accessibilityRole="button" onPress={() => void open(connection.id)} style={c.action}><Text style={c.actionText}>{connection.action}</Text><Ionicons name="arrow-forward" size={15} color={colors.blue} /></Pressable></View>
    </Card>)}</Section>)}
    <View style={c.note}><Text style={c.noteTitle}>Designed for the real college workflow</Text><Text style={s.body}>SkillRack and SAIL are PGPA essentials in the institution best-practices guide. LearnFlow opens their official portals and never scrapes them or saves their passwords.</Text></View>
  </Screen>;
}

const c = StyleSheet.create({
  hero: { backgroundColor: colors.navy, borderColor: colors.navy }, heroTitle: { color: 'white', fontSize: 23, fontWeight: '900', marginTop: 13 }, heroBody: { color: '#D4E2E9', lineHeight: 20, marginTop: 6 }, safeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }, safeText: { color: '#C8F7E7', fontSize: 11, fontWeight: '700' },
  card: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' }, icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, detail: { flex: 1 }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, name: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '900' }, limit: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  action: { minHeight: 42, marginTop: 5, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9 }, actionText: { color: colors.blue, fontSize: 13, fontWeight: '900' }, note: { backgroundColor: colors.sky, padding: 16, borderRadius: 17, marginTop: 14 }, noteTitle: { color: colors.blue, fontWeight: '900', marginBottom: 5 },
});
