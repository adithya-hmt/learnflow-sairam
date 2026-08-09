import { beforeEach, expect, jest, test } from '@jest/globals';

const mockSupabase = { auth: { getUser: jest.fn() }, from: jest.fn() };
let mockConfiguredSupabase: any = null;
jest.mock('./lib/offline', () => ({ completeMutation: jest.fn(), queuedMutations: jest.fn(async () => []), quarantineMutation: jest.fn(async () => undefined) }));
jest.mock('./lib/supabase', () => ({ get supabase() { return mockConfiguredSupabase; } }));

import { mutationsForActor, syncOutbox } from './lib/sync';
const mockOffline: any = jest.requireMock('./lib/offline');
const mockQueued: any = mockOffline.queuedMutations;

const mutation = (id: string, actorId: string, entity: string, payload: Record<string, unknown>) => ({ id, actorId, entity, action: 'upsert' as const, payload });
beforeEach(() => { mockConfiguredSupabase = null; mockOffline.completeMutation.mockClear(); mockOffline.quarantineMutation.mockClear(); mockQueued.mockReset().mockResolvedValue([]); mockSupabase.auth.getUser.mockReset(); mockSupabase.from.mockReset(); });

test('a previous account draft is skipped for the current account', () => {
  const stale = { id: 'a1', actorId: 'student-a', entity: 'submission', action: 'upsert' as const, payload: { assignmentId: 'one', notes: 'private' } };
  const current = { id: 'b1', actorId: 'student-b', entity: 'submission', action: 'upsert' as const, payload: { assignmentId: 'two', notes: 'ready' } };
  expect(mutationsForActor([stale, current], 'student-b')).toEqual([current]);
});

test('demo sync reports local pending count', async () => {
  (mockQueued as any).mockResolvedValueOnce([{ id: 'm1', actorId: 'student-a', entity: 'lesson_progress', action: 'upsert', payload: { lesson_id: 'l1' } }]);
  await expect(syncOutbox()).resolves.toEqual({ synced: 0, pending: 1 });
});

test('cross-account and deterministic invalid mutations are quarantined', async () => {
  mockConfiguredSupabase = mockSupabase;
  (mockSupabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'student-a' } } });
  mockQueued.mockResolvedValueOnce([
    mutation('cross', 'student-b', 'submission', { assignmentId: 'a', content: 'x' }),
    mutation('unsupported', 'student-a', 'calendar', {}),
    mutation('invalid', 'student-a', 'lesson_progress', { lesson_id: '' }),
  ] as any);
  await expect(syncOutbox()).resolves.toEqual(expect.objectContaining({ synced: 0, error: expect.any(String) }));
  expect(mockOffline.quarantineMutation).toHaveBeenCalledTimes(3);
  expect(mockOffline.completeMutation).not.toHaveBeenCalled();
});

test('transient Supabase failure remains pending and valid mutations complete', async () => {
  mockConfiguredSupabase = mockSupabase;
  (mockSupabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'student-a' } } });
  mockSupabase.from.mockImplementation(() => ({ upsert: async () => { throw new TypeError('fetch failed'); } }));
  mockQueued.mockResolvedValueOnce([mutation('transient', 'student-a', 'submission', { assignmentId: 'a', content: 'x' })] as any)
    .mockResolvedValueOnce([mutation('transient', 'student-a', 'submission', { assignmentId: 'a', content: 'x' })] as any);
  const result = await syncOutbox();
  expect(result).toEqual(expect.objectContaining({ synced: 0, pending: 1, error: 'fetch failed' }));
  expect(mockOffline.quarantineMutation).not.toHaveBeenCalled();
  expect(mockOffline.completeMutation).not.toHaveBeenCalled();
});

test('valid queued draft and progress mutations complete', async () => {
  mockConfiguredSupabase = mockSupabase;
  (mockSupabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'student-a' } } });
  mockSupabase.from.mockImplementation(() => ({ upsert: async () => ({ error: null }) }));
  const items = [mutation('draft', 'student-a', 'submission', { assignmentId: 'a', content: 'x' }), mutation('progress', 'student-a', 'lesson_progress', { lesson_id: 'l', position_seconds: 5 })];
  mockQueued.mockResolvedValueOnce(items as any).mockResolvedValueOnce([]);
  await expect(syncOutbox()).resolves.toEqual({ synced: 2, pending: 0 });
  expect(mockOffline.completeMutation).toHaveBeenCalledTimes(2);
});
