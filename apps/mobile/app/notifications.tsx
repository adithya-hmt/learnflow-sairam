import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Card, EmptyState, Pill, Screen, Section, s } from '@/components';
import { useNotifications } from '@/data/hooks';
import { queryKeys } from '@/data';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';
import { formatDateTime } from '@/domain';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useNotifications();
  const markRead = async (id: string) => { if (!supabase) return; const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id); if (!error) await queryClient.invalidateQueries({ queryKey: queryKeys.notifications }); };
  return <Screen title="Notifications" subtitle="Deadlines, course updates and campus activity"><Section title={isLoading ? 'Loading…' : `${data.filter((item) => !item.readAt).length} unread`}>{data.length === 0 ? <EmptyState image={require('../assets/brand/notifications-empty.png')} title="You’re all caught up" text="New learning and campus updates will appear here." /> : data.map((item) => <Pressable key={item.id} onPress={() => void markRead(item.id)}><Card style={[n.card, !item.readAt && n.unread]}><View style={{ flex: 1 }}><View style={s.between}><Text style={n.title}>{item.title}</Text>{!item.readAt && <Pill text="New" tone="blue" />}</View><Text style={[s.body, { marginTop: 5 }]}>{item.body}</Text><Text style={n.time}>{formatDateTime(item.createdAt)}</Text></View></Card></Pressable>)}</Section></Screen>;
}
const n = StyleSheet.create({ card: { flexDirection: 'row' }, unread: { borderLeftWidth: 4, borderLeftColor: colors.blue }, title: { color: colors.ink, fontWeight: '900', fontSize: 15, flex: 1 }, time: { color: colors.muted, fontSize: 10, marginTop: 8 } });
