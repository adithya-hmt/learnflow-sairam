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

import { fingerprint, recordAttendanceScan, updateAttendanceReceipt } from './attendance-receipts';

beforeEach(() => cache.clear());

test('fingerprint is stable without storing the raw attendance token', () => {
  expect(fingerprint('IJPHFU')).toBe(fingerprint('IJPHFU'));
  expect(fingerprint('IJPHFU')).not.toBe(fingerprint('OTHER'));
});

test('college confirmation updates the matching scan without storing its raw token', async () => {
  await recordAttendanceScan({ classCode: 'G4104', token: 'IJPHFU', schedule: 'Hour 7', inWindow: true });

  const receipt = await updateAttendanceReceipt('IJPHFU', 'confirmed');

  expect(receipt?.status).toBe('confirmed');
  expect(cache.get('attendance:receipts')).not.toContain('IJPHFU');
});
