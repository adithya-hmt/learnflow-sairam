import { expect, test } from '@jest/globals';
import { can, eventTimeToday, formatDateTime, getWeekDates, isUpcomingEvent, roles } from './domain';
import { socialPostInput, validateHardwareSignal } from './lib/integrations';

test('role capabilities stay least-privilege', () => {
  expect(can('student', 'grade')).toBe(false);
  expect(can('faculty', 'grade')).toBe(true);
  expect(can('club_coordinator', 'publish_social')).toBe(true);
  expect(can('super_admin', 'manage_platform')).toBe(true);
  expect(roles).toHaveLength(6);
});

test('integration boundaries reject unsafe payloads', () => {
  expect(() => socialPostInput.parse({ text: '' })).toThrow();
  expect(() => validateHardwareSignal({ kind: 'nfc', deviceId: 'x' })).toThrow();
});

test('demo event times become valid local timestamps', () => {
  const value = new Date(eventTimeToday('09:30', new Date('2026-08-06T00:00:00')));
  expect(Number.isNaN(value.getTime())).toBe(false);
  expect([value.getHours(), value.getMinutes()]).toEqual([9, 30]);
});

test('calendar dates stay valid and use the active Monday-to-Friday week', () => {
  const week = getWeekDates(new Date(2026, 7, 6, 9));
  expect(week.map((date) => date.getDate())).toEqual([3, 4, 5, 6, 7]);
  expect(formatDateTime('not-a-date')).toBe('Date unavailable');
  expect(formatDateTime(new Date(2026, 7, 6, 9))).toContain('6 Aug 2026');
});

test('upcoming calendar keeps ongoing events and excludes finished events', () => {
  const now = new Date('2026-08-06T10:00:00+05:30');
  expect(isUpcomingEvent('2026-08-05T09:00:00+05:30', '2026-08-06T16:10:00+05:30', now)).toBe(true);
  expect(isUpcomingEvent('2026-08-05T09:00:00+05:30', null, now)).toBe(false);
});
