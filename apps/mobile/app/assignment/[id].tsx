import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, EmptyState, Pill, Screen, Section, s } from '@/components';
import { colors } from '@/theme';
import { formatDateTime } from '@/domain';
import { useAssignments } from '@/data/hooks';
import { repository, queryKeys } from '@/data';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store';

const answer = z.object({ notes: z.string().trim().min(10, 'Write at least 10 characters').max(2000) });
type Answer = z.infer<typeof answer>;

export default function Assignment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: items = [] } = useAssignments();
  const online = useAppStore((state) => state.online);
  const item = items.find((x) => x.id === id);
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm<Answer>({ defaultValues: { notes: '' } });

  useEffect(() => { if (item) void repository.restoreSubmissionDraft(item.id).then((draft) => { if (draft?.content) { reset({ notes: draft.content }); setSaved(true); } }); }, [item?.id, reset]);
  if (!item) return <Screen title="Assignment"><EmptyState icon="document-text-outline" title="Assignment unavailable" text="It may not be assigned to your course." /></Screen>;

  const save = handleSubmit(async (values) => {
    try { setError(null); const result = await repository.saveSubmissionDraft(item.id, answer.parse(values).notes); setSaved(true); Alert.alert(result.offline ? 'Saved offline' : 'Draft synced', result.offline ? 'Your draft will sync when connected.' : 'Your draft is saved to LearnFlow.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save draft.'); }
  });
  const submit = () => {
    if (!online) { setError('Connect to the internet before submitting.'); return; }
    Alert.alert('Submit assignment?', 'Final submission cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', style: 'destructive', onPress: async () => { try { setError(null); await repository.submitAssignment(item.id, answer.parse(getValues()).notes); await queryClient.invalidateQueries({ queryKey: queryKeys.assignments }); Alert.alert('Submitted', 'Your assignment was submitted to LearnFlow.'); } catch (e) { setError(e instanceof Error ? e.message : 'Submission failed.'); } } },
    ]);
  };
  return <Screen title={item.title} subtitle={`${item.course} · ${item.dueAt ? formatDateTime(item.dueAt) : item.status}`}>
    <Card style={a.hero}><View style={s.between}><Pill text={item.status} tone="coral" /><Text style={a.points}>{item.maxScore} points</Text></View><Text style={a.title}>What to submit</Text><Text style={s.body}>{item.instructions || 'Explain your approach, key trade-offs, and the result.'}</Text></Card>
    <Section title="Your response"><Card><Controller control={control} name="notes" render={({ field: { onChange, value } }) => <TextInput accessibilityLabel="Assignment response" multiline value={value} onChangeText={onChange} placeholder="Write your response or working notes…" placeholderTextColor="#8A97A3" style={a.input} textAlignVertical="top" />} />{errors.notes && <Text style={a.error}>{errors.notes.message}</Text>}{error && <Text style={a.error}>{error}</Text>}<View style={{ marginTop: 12, gap: 8 }}><Button label={saved ? 'Draft saved' : 'Save draft offline'} onPress={save} /><Button label="Submit final (online)" secondary onPress={submit} /></View></Card></Section>
    <Section title="Submission checklist"><Card>{['Response answers the prompt', 'Sources are cited', 'Files contain no sensitive data'].map((x) => <View key={x} style={a.check}><View style={a.box} /><Text style={a.checkText}>{x}</Text></View>)}</Card></Section>
  </Screen>;
}
const a = StyleSheet.create({ hero: { gap: 12 }, points: { color: colors.muted, fontWeight: '800', fontSize: 12 }, title: { color: colors.ink, fontSize: 19, fontWeight: '900' }, input: { minHeight: 180, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, color: colors.ink, backgroundColor: colors.paper, fontSize: 14, lineHeight: 20 }, error: { color: colors.coral, fontSize: 12, fontWeight: '700', marginTop: 7 }, check: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 }, box: { width: 20, height: 20, borderWidth: 2, borderColor: colors.line, borderRadius: 6 }, checkText: { color: colors.ink, fontSize: 13, fontWeight: '600' } });
