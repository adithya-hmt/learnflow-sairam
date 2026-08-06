import { beforeEach, expect, jest, test } from '@jest/globals';

const outbox = new Map<string, { actorId: string | null; entity: string; action: string; payload: string }>();
const cache = new Map<string, string>();

const mockDatabase = {
  execAsync: jest.fn(async () => undefined),
  runAsync: jest.fn(async (sql: string, ...args: string[]) => {
    if (sql.includes('outbox')) outbox.set(args[0], { actorId: args[1], entity: args[2], action: args[3], payload: args[4] });
    if (sql.startsWith('DELETE FROM cache')) cache.delete(args[0]);
    else if (sql.includes('cache')) cache.set(args[0], args[1]);
  }),
  getFirstAsync: jest.fn(async <T>(sql: string, key?: string) => {
    if (sql.includes('COUNT')) return { count: outbox.size } as T;
    const value = key === undefined ? undefined : cache.get(key);
    return (value === undefined ? null : { value }) as T;
  }),
  getAllAsync: jest.fn(async <T>(sql: string) => (sql.includes('PRAGMA') ? [{ name: 'actor_id' }] : [...outbox].map(([id, item]) => ({ id, actor_id: item.actorId, entity: item.entity, action: item.action, payload: item.payload }))) as T),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDatabase),
}));

import { cacheValue, pendingCount, queueMutation, queuedMutations, readCache, removeCache } from './lib/offline';

beforeEach(() => {
  outbox.clear();
  cache.clear();
  jest.clearAllMocks();
});

test('queueMutation increases pending count for a valid mutation', async () => {
  await queueMutation({ id: 'm1', actorId: 'student-a', entity: 'assignment', action: 'upsert', payload: { done: true } });

  expect(await pendingCount()).toBe(1);
});

test('queueMutation replaces a mutation with the same id', async () => {
  await queueMutation({ id: 'm1', actorId: 'student-a', entity: 'assignment', action: 'upsert', payload: { done: false } });
  await queueMutation({ id: 'm1', actorId: 'student-a', entity: 'assignment', action: 'upsert', payload: { done: true } });

  expect(await pendingCount()).toBe(1);
});

test('queueMutation rejects an empty mutation id', async () => {
  await expect(queueMutation({ id: '', actorId: 'student-a', entity: 'assignment', action: 'upsert', payload: {} })).rejects.toThrow();
});

test('queued mutations remain bound to the account that created them', async () => {
  await queueMutation({ id: 'm1', actorId: 'student-a', entity: 'submission', action: 'upsert', payload: { notes: 'private draft' } });
  await expect(queuedMutations()).resolves.toEqual([expect.objectContaining({ actorId: 'student-a' })]);
});

test('legacy drafts without an owner are not exposed as current-account mutations', async () => {
  outbox.set('legacy', { actorId: null, entity: 'submission', action: 'upsert', payload: '{}' });
  await expect(queuedMutations()).resolves.toEqual([]);
});

test('queueMutation rejects an unowned mutation', async () => {
  await expect(queueMutation({ id: 'm2', actorId: '', entity: 'submission', action: 'upsert', payload: {} })).rejects.toThrow();
});

test('readCache returns the value most recently cached', async () => {
  await cacheValue('progress', { completed: 3 });

  await expect(readCache<{ completed: number }>('progress')).resolves.toEqual({ completed: 3 });
});

test('readCache returns null for a missing key', async () => {
  await expect(readCache('missing')).resolves.toBeNull();
});

test('removeCache clears a stale value', async () => {
  await cacheValue('profile', { role: 'student' });
  await removeCache('profile');
  await expect(readCache('profile')).resolves.toBeNull();
});
