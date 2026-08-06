import { expect, jest, test } from '@jest/globals';

jest.mock('./lib/offline', () => ({ completeMutation: jest.fn(), queuedMutations: jest.fn() }));
jest.mock('./lib/supabase', () => ({ supabase: null }));

import { mutationsForActor } from './lib/sync';

test('a previous account draft is skipped for the current account', () => {
  const stale = { id: 'a1', actorId: 'student-a', entity: 'submission', action: 'upsert' as const, payload: { assignmentId: 'one', notes: 'private' } };
  const current = { id: 'b1', actorId: 'student-b', entity: 'submission', action: 'upsert' as const, payload: { assignmentId: 'two', notes: 'ready' } };
  expect(mutationsForActor([stale, current], 'student-b')).toEqual([current]);
});
