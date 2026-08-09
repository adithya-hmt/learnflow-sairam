import { expect, test } from '@jest/globals';
import { currentTimetableSlot, localTimeToday, nextTimetableSlot } from './timetable';
const slots = [{ id: 'a', weekday: 1, startsAt: '09:00:00', endsAt: '09:50:00', courseCode: 'AI' }, { id: 'b', weekday: 1, startsAt: '10:00:00', endsAt: '10:50:00', courseCode: 'CN' }] as any;
test('parses SQL time values into local today', () => { const now = new Date(2026, 7, 10, 8, 0); expect(localTimeToday('09:00:00', now)?.getHours()).toBe(9); });
test('selects current slot at boundaries and next slot', () => { const before = new Date(2026, 7, 10, 8, 59); const during = new Date(2026, 7, 10, 9, 25); const after = new Date(2026, 7, 10, 9, 50); expect(currentTimetableSlot(slots, before)).toBeNull(); expect(currentTimetableSlot(slots, during)?.courseCode).toBe('AI'); expect(currentTimetableSlot(slots, after)).toBeNull(); expect(nextTimetableSlot(slots, after)?.courseCode).toBe('CN'); });
