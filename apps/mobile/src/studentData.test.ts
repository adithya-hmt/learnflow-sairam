import { expect, test } from '@jest/globals';
import { getScheduleStatus, isWeekday, periods, student, subjectAttendance, timetable } from './studentData';

test('the imported timetable covers all five college days and seven teaching periods', () => {
  expect(Object.keys(timetable)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  expect(periods.map((item) => item.period)).toEqual([1, 2, 3, 4, 6, 7, 8]);
  expect(Object.values(timetable).every((day) => day.length === 7)).toBe(true);
});

test('the attendance summary matches the imported EDUMATE report', () => {
  expect(student.attendance).toBe(87.28);
  expect(subjectAttendance).toHaveLength(10);
  expect(subjectAttendance.find((item) => item.code === 'MC')?.percentage).toBe(50);
});

test('the live timetable reports current and next periods without weekday casts', () => {
  const duringLab = getScheduleStatus('Thursday', new Date(2026, 7, 6, 13, 30));
  expect(duringLab.current?.code).toBe('CN LAB');
  expect(duringLab.next?.period).toBe(7);
  expect(getScheduleStatus('Thursday', new Date(2026, 7, 6, 16, 30)).next).toBeNull();
  expect(isWeekday('Thursday')).toBe(true);
  expect(isWeekday('Sunday')).toBe(false);
});
