import { completeMutation, queuedMutations, type QueuedMutation } from './offline';
import { supabase } from './supabase';

export type SyncResult = { synced: number; pending: number; error?: string };
export const mutationsForActor = (items: QueuedMutation[], actorId: string) => items.filter((item) => item.actorId === actorId);

export async function syncOutbox(): Promise<SyncResult> {
  if (!supabase) return { synced: 0, pending: 0 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { synced: 0, pending: (await queuedMutations()).length, error: 'Sign in to sync.' };
  const items = await queuedMutations();
  let synced = 0;
  let firstError: string | undefined;
  for (const item of mutationsForActor(items, user.id)) {
    try {
      if (item.entity !== 'submission' || item.action !== 'upsert') throw new Error(`Unsupported offline operation: ${item.entity}/${item.action}`);
      const assignmentId = String(item.payload.assignmentId ?? '');
      const content = String(item.payload.notes ?? '');
      if (!assignmentId || !content) throw new Error('Submission draft is incomplete.');
      const { error } = await supabase.from('submissions').upsert({ assignment_id: assignmentId, student_id: user.id, content, status: 'draft' }, { onConflict: 'assignment_id,student_id' });
      if (error) throw error;
      await completeMutation(item.id);
      synced += 1;
    } catch (error) {
      firstError ??= error instanceof Error ? error.message : 'Sync failed.';
    }
  }
  return { synced, pending: (await queuedMutations()).length, error: firstError };
}
