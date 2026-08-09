import { completeMutation, quarantineMutation, queuedMutations, type QueuedMutation } from './offline';
import { supabase } from './supabase';

export type SyncResult = { synced: number; pending: number; error?: string };
export const mutationsForActor = (items: QueuedMutation[], actorId: string) => items.filter((item) => item.actorId === actorId);

export async function syncOutbox(): Promise<SyncResult> {
  const items = await queuedMutations();
  if (!supabase) return { synced: 0, pending: items.length };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { synced: 0, pending: (await queuedMutations()).length, error: 'Sign in to sync.' };
  for (const item of items.filter((candidate) => candidate.actorId !== user.id)) await quarantineMutation(item, 'cross_account');
  let synced = 0;
  let firstError: string | undefined;
  for (const item of mutationsForActor(items, user.id)) {
    try {
      if (item.action !== 'upsert' || !['submission', 'lesson_progress'].includes(item.entity)) throw new Error(`Unsupported offline operation: ${item.entity}/${item.action}`);
      if (item.entity === 'submission') {
        const assignmentId = String(item.payload.assignmentId ?? '');
        const content = String(item.payload.content ?? item.payload.notes ?? '');
        if (!assignmentId) throw new Error('Submission draft is incomplete.');
        const { error } = await supabase.from('submissions').upsert({ assignment_id: assignmentId, student_id: user.id, content, status: 'draft' }, { onConflict: 'assignment_id,student_id' });
        if (error) throw error;
      } else {
        const lessonId = String(item.payload.lesson_id ?? '');
        const positionSeconds = Number(item.payload.position_seconds);
        if (!lessonId || !Number.isFinite(positionSeconds)) throw new Error('Lesson progress is incomplete.');
        const { error } = await supabase.from('lesson_progress').upsert({ ...item.payload, lesson_id: lessonId, student_id: user.id, position_seconds: Math.max(0, Math.floor(positionSeconds)) }, { onConflict: 'lesson_id,student_id' });
        if (error) throw error;
      }
      await completeMutation(item.id);
      synced += 1;
    } catch (error) {
      firstError ??= error instanceof Error ? error.message : 'Sync failed.';
      await quarantineMutation(item, firstError);
    }
  }
  return { synced, pending: (await queuedMutations()).length, error: firstError };
}
