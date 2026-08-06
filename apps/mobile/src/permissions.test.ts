import { expect, test } from '@jest/globals';
import { can } from './domain';

test('students can submit learning work', () => {
  expect(can('student', 'submit')).toBe(true);
});

test('faculty cannot submit work on behalf of students', () => {
  expect(can('faculty', 'submit')).toBe(false);
});

test('department admins can manage their department', () => {
  expect(can('department_admin', 'manage_department')).toBe(true);
});

test('department admins cannot manage the platform', () => {
  expect(can('department_admin', 'manage_platform')).toBe(false);
});
