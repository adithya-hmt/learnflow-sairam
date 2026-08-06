import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Pill, Screen, Section, s } from '@/components';
import { student } from '@/studentData';
import { colors } from '@/theme';
import { useAuth } from '@/auth';
import { useProfile } from '@/data/hooks';
import { openExternalUrl } from '@/lib/links';

const links = [
  { label: 'Route map', image: require('../../assets/icons/campus-color.png'), url: 'https://sairam.edu.in/route-map/' },
  { label: 'Facilities', image: require('../../assets/icons/lesson.png'), url: 'https://sairam.edu.in/category/facilities/' },
  { label: 'Clubs', image: require('../../assets/icons/classroom.png'), url: 'https://sairam.edu.in/clubs-and-cells/' },
] as const;

export default function Campus() {
  const auth = useAuth();
  const { data: profile } = useProfile();
  const identity = auth.configured ? {
    name: profile?.fullName || 'Student',
    rollNo: profile?.rollNo || profile?.email || 'Campus account',
    branch: profile?.department || 'Department not set',
    year: profile?.yearOfStudy ? `Year ${profile.yearOfStudy}${profile.semester ? ` · Semester ${profile.semester}` : ''}` : 'Profile linked',
    section: profile?.section || '',
  } : student;
  const openCampusLink = async (url: string) => { try { await openExternalUrl(url); } catch { Alert.alert('Link unavailable', 'The Sairam page could not be opened. Check your connection and try again.'); } };
  return <Screen title="Campus" subtitle="Services, community and your digital wellbeing">
    <Card style={c.idCard}>
      <View style={c.idTop}><View><Text style={c.idEyebrow}>STUDENT PASS</Text><Text style={c.idName}>{identity.name}</Text></View><Pill text="ACTIVE" tone="green" /></View>
      <Text style={c.roll}>{identity.rollNo}</Text>
      <Text style={c.idMeta}>{identity.branch}{'\n'}{identity.year}{identity.section ? ` · Section ${identity.section}` : ''}</Text>
    </Card>

    <Pressable accessibilityRole="button" onPress={() => router.push('/activity')}>
      <Card style={c.activity}><View style={c.activityIcon}><Ionicons name="phone-portrait-outline" size={23} color={colors.white} /></View><View style={{ flex: 1 }}><Text style={c.activityTitle}>Phone activity</Text><Text style={c.activityBody}>See today’s screen time and most-used apps. Data stays on this device.</Text></View><Ionicons name="chevron-forward" size={21} color={colors.blue} /></Card>
    </Pressable>

    <Section title="Quick links"><View style={c.linkGrid}>{links.map((link) => <Pressable accessibilityRole="link" key={link.label} onPress={() => void openCampusLink(link.url)} style={c.link}><Image source={link.image} style={c.linkIcon} /><View style={c.linkLabel}><Text style={c.linkText}>{link.label}</Text><Ionicons name="open-outline" size={13} color={colors.blue} /></View></Pressable>)}</View></Section>

    <Pressable accessibilityRole="button" onPress={() => router.push('/connections')}><Card style={c.connections}><View style={{ flex: 1 }}><Text style={c.rowTitle}>Workspace & portals</Text><Text style={s.body}>Google Workspace · SAIL · SkillRack · HackerRank</Text></View><Ionicons name="chevron-forward" size={21} color={colors.blue} /></Card></Pressable>

    <Section title="Campus life">
      <Pressable onPress={() => router.push('/social')}><Card style={c.row}><View style={{ flex: 1 }}><Text style={c.rowTitle}>Sairam Social</Text><Text style={s.body}>College stories, trusted announcements and clubs</Text></View><Ionicons name="chevron-forward" size={21} color={colors.blue} /></Card></Pressable>
      <Card><Text style={c.rowTitle}>Popular facilities</Text><Text style={[s.body, { marginTop: 7 }]}>Abdul Kalam Digital Library · Computer Centres · Innovation Ecosystem · Cafeteria · Transport</Text></Card>
    </Section>
  </Screen>;
}

const c = StyleSheet.create({
  idCard: { backgroundColor: colors.navy, borderColor: colors.navy }, idTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idEyebrow: { color: '#9DC2D2', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, idName: { color: 'white', fontSize: 23, fontWeight: '900', marginTop: 6 },
  roll: { color: colors.gold, fontSize: 13, fontWeight: '900', marginTop: 18 }, idMeta: { color: '#D6E4EB', fontSize: 12, lineHeight: 18, marginTop: 3 },
  activity: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.mint, borderColor: '#C5E2D7', marginTop: 11 },
  activityIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 }, activityBody: { color: '#0F766E', fontSize: 12, lineHeight: 17, marginTop: 3 },
  linkGrid: { flexDirection: 'row', gap: 9 }, link: { flex: 1, minHeight: 96, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 17, padding: 12, justifyContent: 'space-between' },
  linkIcon: { width: 32, height: 32, resizeMode: 'contain' }, linkLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 }, linkText: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: '800' }, connections: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, rowTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
});
