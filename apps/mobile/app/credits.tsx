import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card, Screen, Section, s } from '@/components';
import { colors } from '@/theme';
import { openExternalUrl } from '@/lib/links';

const icons = [
  ['Campus', 'Vector Stall', 'https://www.flaticon.com/free-icon/campus_5411596'],
  ['University campus', 'Magnific', 'https://www.flaticon.com/free-icon/university-campus_68286'],
  ['Lesson', 'Paul J.', 'https://www.flaticon.com/free-icon/lesson_8980099'],
  ['Classroom', 'Freepik', 'https://www.flaticon.com/free-icon/classroom_12404215'],
  ['Drive', 'Freepik', 'https://www.flaticon.com/free-icon/google-drive_2959403'],
] as const;

export default function Credits() {
  const open = async (url: string) => { try { await openExternalUrl(url); } catch { Alert.alert('Link unavailable', 'The attribution page could not be opened.'); } };
  return <Screen title="Credits" subtitle="Open-source notices and visual attributions"><Section title="Flaticon icons"><Card><Text style={s.body}>Used under the Flaticon free license with attribution.</Text>{icons.map(([name, author, url]) => <Pressable accessibilityRole="link" key={name} onPress={() => void open(url)} style={c.row}><View><Text style={c.name}>{name}</Text><Text style={c.author}>{author} · Flaticon</Text></View><Ionicons name="open-outline" size={16} color={colors.blue} /></Pressable>)}</Card></Section></Screen>;
}

const c = StyleSheet.create({ row: { minHeight: 52, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, name: { color: colors.ink, fontWeight: '800' }, author: { color: colors.blue, fontSize: 11, marginTop: 3 } });
