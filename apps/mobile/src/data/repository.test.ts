import { expect, jest, test, beforeEach } from '@jest/globals';

const mockRows: Record<string, unknown[]> = {};
const mockIn = jest.fn();
const mockSupabase = { auth: { getSession: jest.fn(), getUser: jest.fn() }, from: jest.fn() };
let mockConfigured: any = mockSupabase;
const mockCache = { cacheValue: jest.fn(), readCache: jest.fn(), removeCache: jest.fn(), queueMutation: jest.fn(), readDraft: jest.fn(), saveDraft: jest.fn() };
jest.mock('../lib/supabase', () => ({ get supabase() { return mockConfigured; } }));
jest.mock('../lib/offline', () => ({ cacheValue: (...args: unknown[]) => mockCache.cacheValue(...args), readCache: (...args: unknown[]) => mockCache.readCache(...args), removeCache: (...args: unknown[]) => mockCache.removeCache(...args), queueMutation: (...args: unknown[]) => mockCache.queueMutation(...args), readDraft: (...args: unknown[]) => mockCache.readDraft(...args), saveDraft: (...args: unknown[]) => mockCache.saveDraft(...args) }));

function query(table: string) {
  const result = { data: mockRows[table] ?? [], error: null };
  const chain: any = { eq: () => chain, in: (...args: unknown[]) => { mockIn(...args); return chain; }, order: () => chain, limit: () => chain, maybeSingle: async () => ({ data: result.data[0] ?? null, error: null }), then: (resolve: (value: unknown) => unknown) => resolve(result) };
  return chain;
}
(mockSupabase.from as any).mockImplementation((table: string) => ({ select: () => query(table), update: () => query(table), upsert: () => query(table) }));

import { getAssignments, getAttendanceSummaries, getCurrentProfile, getTimetable, restoreSubmissionDraft, saveLessonProgress, saveSubmissionDraft, submitAssignment } from './index';

const profile = { id: 'student-a', full_name: 'A', email: 'a@example.com', role: 'student', department: 'CSE', year_of_study: 3, semester: 5, section: 'D' };
beforeEach(() => { mockConfigured = mockSupabase; Object.keys(mockRows).forEach(key => delete mockRows[key]); mockIn.mockClear(); (mockSupabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'student-a' } } } }); });

test('maps timetable and attendance rows using the pilot schema', async () => {
  mockRows.profiles = [profile];
  mockRows.timetable_slots = [{ id: 'slot', department: 'CSE', year_of_study: 3, semester: 5, section: 'D', weekday: 1, period: 2, course_id: null, course_code: 'CN', display_title: 'Networks', starts_at: '09:50', ends_at: '10:40', room: 'B1' }];
  mockRows.attendance_summaries = [{ id: 'att', student_id: 'student-a', course_id: null, course_code: 'CN', percentage: '86.5', held_count: 10, attended_count: 9, source: 'EDUMATE', source_at: '2026-08-06' }];
  await expect(getCurrentProfile()).resolves.toEqual(expect.objectContaining({ id: 'student-a', section: 'D' }));
  await expect(getTimetable()).resolves.toEqual([expect.objectContaining({ weekday: 1, courseCode: 'CN', room: 'B1' })]);
  await expect(getAttendanceSummaries()).resolves.toEqual([expect.objectContaining({ percentage: 86.5, heldCount: 10, attendedCount: 9 })]);
});

test('scopes assignments to active enrollments and derives exact status', async () => {
  mockRows.profiles = [profile];
  mockRows.enrollments = [{ course_id: 'course-a', status: 'active' }];
  mockRows.assignments = ['pending', 'draft', 'submitted', 'graded', 'late'].map((status, index) => ({ id: `assignment-${index}`, course_id: 'course-a', courses: [{ title: 'Networks' }], title: 'Lab', instructions: '', max_score: 10 }));
  mockRows.submissions = ['pending', 'draft', 'submitted', 'graded', 'late'].map((status, index) => ({ assignment_id: `assignment-${index}`, status }));
  const assignments = await getAssignments();
  expect(assignments.map(item => item.status)).toEqual(['pending', 'draft', 'submitted', 'graded', 'late']);
  expect(mockIn).toHaveBeenCalledWith('course_id', ['course-a']);
  expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
});

test('missing cohort fields fail closed for timetable reads', async () => {
  mockRows.profiles = [{ ...profile, section: null }];
  await expect(getTimetable()).resolves.toEqual([]);
});

test('draft ownership comes only from the current profile', async () => {
  mockRows.profiles = [profile];
  await saveSubmissionDraft('assignment-a', 'private draft');
  expect(mockCache.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'student-a', assignmentId: 'assignment-a' }));
  expect(mockSupabase.from).toHaveBeenCalledWith('submissions');
});

test('draft restoration reads only the current profile account', async () => {
  mockRows.profiles = [profile];
  (mockCache.readDraft as any).mockResolvedValueOnce({ actorId: 'student-a', assignmentId: 'assignment-a', content: 'saved', updatedAt: 'now' });
  await expect(restoreSubmissionDraft('assignment-a')).resolves.toEqual(expect.objectContaining({ actorId: 'student-a', content: 'saved' }));
  expect(mockCache.readDraft).toHaveBeenCalledWith('student-a', 'assignment-a');
});

test('final submission rejects when there is no authenticated user', async () => {
  (mockSupabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null } });
  await expect(submitAssignment('assignment-a', 'answer')).rejects.toThrow('Sign in');
});

test('demo lesson progress queues an account-bound mutation', async () => {
  mockConfigured = null;
  mockRows.profiles = [profile];
  await expect(saveLessonProgress('lesson-a', 12)).resolves.toEqual({ offline: true });
  expect(mockCache.queueMutation).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'demo-student', entity: 'lesson_progress' }));
});

test('connected lesson progress queues a network TypeError', async () => {
  (mockSupabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'student-a' } } });
  (mockSupabase.from as any).mockImplementationOnce(() => ({ upsert: async () => { throw new TypeError('Network request failed'); } }));
  await expect(saveLessonProgress('lesson-a', 12)).resolves.toEqual({ offline: true });
  expect(mockCache.queueMutation).toHaveBeenCalledWith(expect.objectContaining({ entity: 'lesson_progress', actorId: 'student-a' }));
});

test('final submission preserves Supabase errors', async () => {
  (mockSupabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'student-a' } } });
  (mockSupabase.from as any).mockImplementationOnce(() => ({ upsert: async () => ({ error: new Error('server rejected') }) }));
  await expect(submitAssignment('assignment-a', 'answer')).rejects.toThrow('server rejected');
});
