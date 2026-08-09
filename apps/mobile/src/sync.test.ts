import { expect, jest, test } from '@jest/globals';

jest.mock('./lib/offline', () => ({ completeMutation: jest.fn(), queuedMutations: jest.fn(async () => []), quarantineMutation: jest.fn(async () => undefined) }));
jest.mock('./lib/supabase', () => ({ supabase: null }));

import { mutationsForActor, syncOutbox } from './lib/sync';
const mockQueued = (jest.requireMock('./lib/offline') as { queuedMutations: jest.Mock }).queuedMutations;

test('a previous account draft is skipped for the current account', () => {
  const stale = { id: 'a1', actorId: 'student-a', entity: 'submission', action: 'upsert' as const, payload: { assignmentId: 'one', notes: 'private' } };
  const current = { id: 'b1', actorId: 'student-b', entity: 'submission', action: 'upsert' as const, payload: { assignmentId: 'two', notes: 'ready' } };
  expect(mutationsForActor([stale, current], 'student-b')).toEqual([current]);
});

test('demo sync reports local pending count', async () => {
  (mockQueued as any).mockResolvedValueOnce([{ id: 'm1', actorId: 'student-a', entity: 'lesson_progress', action: 'upsert', payload: { lesson_id: 'l1' } }]);
  await expect(syncOutbox()).resolves.toEqual({ synced: 0, pending: 1 });
});
