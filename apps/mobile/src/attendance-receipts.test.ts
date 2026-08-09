import { beforeEach, expect, jest, test } from '@jest/globals';

const cache = new Map<string, string>();
const mockDatabase = {
  execAsync: jest.fn(async () => undefined),
  runAsync: jest.fn(async (sql: string, ...args: string[]) => { if (sql.includes('cache')) cache.set(args[0], args[1]); }),
  getFirstAsync: jest.fn(async <T>(_sql: string, key?: string) => {
    const value = key === undefined ? undefined : cache.get(key);
    return (value === undefined ? null : { value }) as T;
  }),
  getAllAsync: jest.fn(async <T>() => [{ name: 'actor_id' }] as T),
};

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(async () => mockDatabase) }));

import { fingerprint, getAttendanceReceipts, recordAttendanceScan, updateAttendanceReceipt } from './attendance-receipts';

beforeEach(() => cache.clear());

test('fingerprint is stable without storing the raw attendance token', () => {
  expect(fingerprint('IJPHFU')).toBe(fingerprint('IJPHFU'));
  expect(fingerprint('IJPHFU')).not.toBe(fingerprint('OTHER'));
});

test('college confirmation updates the matching scan without storing its raw token', async () => {
  await recordAttendanceScan({ actorId: 'student-a', classCode: 'G4104', token: 'IJPHFU', schedule: 'Hour 7', inWindow: true });

  const receipt = await updateAttendanceReceipt('student-a', 'IJPHFU', 'confirmed');

  expect(receipt?.status).toBe('confirmed');
  expect(cache.get('attendance:receipts:student-a')).not.toContain('IJPHFU');
});
test('receipts are isolated by actor', async () => {
  await recordAttendanceScan({ actorId: 'student-a', classCode: 'A', token: 'TOKEN-A', schedule: 'Hour 1', inWindow: true });
  await recordAttendanceScan({ actorId: 'student-b', classCode: 'B', token: 'TOKEN-B', schedule: 'Hour 1', inWindow: true });
  expect((await getAttendanceReceipts('student-a')).map((item) => item.classCode)).toEqual(['A']);
  expect((await getAttendanceReceipts('student-b')).map((item) => item.classCode)).toEqual(['B']);
});
