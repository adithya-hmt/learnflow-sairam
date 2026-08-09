import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Button, Card, EmptyState, Pill, Screen, Section, s } from '@/components';
import { useLesson } from '@/data/hooks';
import { repository, queryKeys } from '@/data';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '@/theme';
import { openExternalUrl } from '@/lib/links';

export default function LessonScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { data: lesson, isLoading } = useLesson(id);
  const queryClient = useQueryClient();
  const player = useVideoPlayer(lesson?.videoUrl ?? null, (instance) => { instance.loop = false; });
  const complete = async () => {
    if (!lesson) return;
    try { const result = await repository.saveLessonProgress(lesson.id, player.currentTime, new Date().toISOString()); await queryClient.invalidateQueries({ queryKey: queryKeys.progress }); Alert.alert(result.offline ? 'Progress queued' : 'Lesson complete', result.offline ? 'It will sync when connected.' : 'Your progress has been updated.'); } catch (error) { Alert.alert('Could not save progress', error instanceof Error ? error.message : 'Please try again.'); }
  };
  const openResource = async (url: string) => { try { await openExternalUrl(url); } catch { Alert.alert('Resource unavailable', 'This resource link is invalid or could not be opened.'); } };
  if (isLoading) return <Screen title="Lesson"><Text style={s.body}>Loading lesson…</Text></Screen>;
  if (!lesson) return <Screen title="Lesson"><EmptyState icon="document-text-outline" title="Lesson unavailable" text="It may not be published for your account yet." /></Screen>;
  return <Screen title={lesson.title} subtitle={`Lesson ${lesson.position + 1}`}>
    {lesson.videoUrl ? <VideoView player={player} style={v.video} nativeControls /> : <Card style={v.reading}><Pill text="READING" tone="blue" /><Text style={v.readingTitle}>{lesson.title}</Text><Text style={s.body}>{lesson.summary || 'Your faculty will add lesson content here.'}</Text></Card>}
    <Section title="About this lesson"><Card><Text style={v.body}>{lesson.summary || 'Complete the lesson materials, then record your progress.'}</Text></Card></Section>
    {lesson.resourceUrls.length > 0 && <Section title="Resources">{lesson.resourceUrls.map((url, index) => <Pressable accessibilityRole="link" key={url} onPress={() => void openResource(url)}><Card><View style={v.resourceRow}><View style={{ flex: 1 }}><Text style={v.resource}>Resource {index + 1}</Text><Text numberOfLines={1} style={s.body}>{url}</Text></View><Ionicons name="open-outline" size={19} color={colors.blue} /></View></Card></Pressable>)}</Section>}
    <Button label="Mark lesson complete" onPress={complete} />
  </Screen>;
}
const v = StyleSheet.create({ video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18, backgroundColor: colors.ink }, reading: { minHeight: 180, justifyContent: 'center', gap: 12, backgroundColor: colors.sky }, readingTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' }, body: { color: colors.ink, fontSize: 15, lineHeight: 23 }, resourceRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 }, resource: { color: colors.ink, fontWeight: '900', marginBottom: 4 } });
