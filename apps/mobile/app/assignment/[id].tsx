import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, EmptyState, Pill, Screen, Section, s } from '@/components';
import { queueMutation } from '@/lib/offline';
import { syncOutbox } from '@/lib/sync';
import { colors } from '@/theme';
import { formatDateTime } from '@/domain';
import { useAssignments, useProfile } from '@/data/hooks';
import { useAppStore } from '@/store';
const answer = z.object({ notes: z.string().trim().min(10, 'Write at least 10 characters').max(2000) });
type Answer = z.infer<typeof answer>;
export default function Assignment() { const { id } = useLocalSearchParams<{ id: string }>(); const { data: items = [] } = useAssignments(); const { data: profile } = useProfile(); const online = useAppStore((state) => state.online); const item = items.find((x) => x.id === id); const [saved, setSaved] = useState(false); const { control, handleSubmit, formState: { errors } } = useForm<Answer>({ defaultValues: { notes: '' } }); if (!item) return <Screen title="Assignment"><EmptyState icon="document-text-outline" title="Assignment unavailable" text="It may not be assigned to your course." /></Screen>; const save = handleSubmit(async (values) => { const clean = answer.parse(values); if (!profile) throw new Error('A profile is required to save this draft.'); await queueMutation({ id: globalThis.crypto.randomUUID(), actorId: profile.id, entity: 'submission', action: 'upsert', payload: { assignmentId: item.id, ...clean } }); const result = online ? await syncOutbox() : { synced: 0, pending: 1 }; setSaved(true); Alert.alert(result.synced ? 'Draft synced' : 'Saved offline', result.error || (result.synced ? 'Your draft is saved to LearnFlow.' : 'Your draft will sync safely when a connection is available.')); }); return <Screen title={item.title} subtitle={`${item.course} · ${item.dueAt ? formatDateTime(item.dueAt) : item.status}`}>
  <Card style={a.hero}><View style={s.between}><Pill text={item.status} tone="coral" /><Text style={a.points}>{item.maxScore} points</Text></View><Text style={a.title}>What to submit</Text><Text style={s.body}>{item.instructions || 'Explain your approach, key trade-offs, and the result.'}</Text></Card>
  <Section title="Your response"><Card><Controller control={control} name="notes" render={({ field: { onChange, value } }) => <TextInput accessibilityLabel="Assignment response" multiline value={value} onChangeText={onChange} placeholder="Write your response or working notes…" placeholderTextColor="#8A97A3" style={a.input} textAlignVertical="top" />} />{errors.notes && <Text style={a.error}>{errors.notes.message}</Text>}<View style={{ marginTop: 12 }}><Button label={saved ? 'Draft saved' : 'Save draft offline'} onPress={save} /></View></Card></Section>
  <Section title="Submission checklist"><Card>{['Response answers the prompt', 'Sources are cited', 'Files contain no sensitive data'].map((x) => <View key={x} style={a.check}><View style={a.box} /><Text style={a.checkText}>{x}</Text></View>)}</Card></Section>
</Screen>; }
const a = StyleSheet.create({ hero: { gap: 12 }, points: { color: colors.muted, fontWeight: '800', fontSize: 12 }, title: { color: colors.ink, fontSize: 19, fontWeight: '900' }, input: { minHeight: 180, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, color: colors.ink, backgroundColor: colors.paper, fontSize: 14, lineHeight: 20 }, error: { color: colors.coral, fontSize: 12, fontWeight: '700', marginTop: 7 }, check: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 }, box: { width: 20, height: 20, borderWidth: 2, borderColor: colors.line, borderRadius: 6 }, checkText: { color: colors.ink, fontSize: 13, fontWeight: '600' } });
