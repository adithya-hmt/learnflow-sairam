import { readCache, cacheValue } from './lib/offline';

export type AttendanceReceipt = { id: string; classCode: string; tokenFingerprint: string; scannedAt: string; status: 'pending' | 'duplicate' | 'outside-window'; schedule: string };
const key = 'attendance:receipts';
export const fingerprint = (value: string) => Array.from(value).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7).toString(16);

export async function recordAttendanceScan(input: { classCode: string; token: string; schedule: string; inWindow: boolean }) {
  const receipts = (await readCache<AttendanceReceipt[]>(key)) ?? [];
  const duplicate = receipts.some((item) => item.tokenFingerprint === fingerprint(input.token));
  const receipt: AttendanceReceipt = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, classCode: input.classCode, tokenFingerprint: fingerprint(input.token), scannedAt: new Date().toISOString(), status: duplicate ? 'duplicate' : input.inWindow ? 'pending' : 'outside-window', schedule: input.schedule };
  await cacheValue(key, [receipt, ...receipts].slice(0, 50));
  return receipt;
}

export async function getAttendanceReceipts() { return (await readCache<AttendanceReceipt[]>(key)) ?? []; }
