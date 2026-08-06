import { assignments as demoAssignments, courses as demoCourses, events as demoEvents, eventTimeToday, posts as demoPosts } from '../domain';
import { supabase } from '../lib/supabase';
import type { Role } from '../domain';
import { cacheValue, readCache, removeCache } from '../lib/offline';

export type Profile = { id: string; fullName: string; email: string | null; rollNo: string | null; role: Role; department: string | null; yearOfStudy: number | null; semester: number | null; section: string | null; avatarUrl: string | null };
export type Course = { id: string; code: string; title: string; description: string; department: string | null; facultyId: string | null; status: string; startsOn: string | null; endsOn: string | null };
export type Enrollment = { courseId: string; studentId: string; status: string; enrolledAt: string };
export type Lesson = { id: string; courseId: string; title: string; summary: string; position: number; videoUrl: string | null; resourceUrls: string[]; published: boolean };
export type Assignment = { id: string; courseId: string | null; course: string; title: string; instructions: string; dueAt: string | null; maxScore: number; status: string };
export type CalendarEvent = { id: string; title: string; description: string; kind: string; startsAt: string; endsAt: string | null; location: string | null; courseId: string | null };
export type Notification = { id: string; title: string; body: string; data: Record<string, unknown>; readAt: string | null; createdAt: string };
export type SocialPost = { id: string; authorId: string; body: string; mediaUrls: string[]; clubName: string | null; publishedAt: string };
export type AttendanceRecord = { id: string; eventId: string | null; courseId: string | null; studentId: string; attendedAt: string; method: string; deviceRef: string | null };
export type Achievement = { id: string; studentId: string; slug: string; title: string; description: string; awardedAt: string; metadata: Record<string, unknown> };
export type CourseProgress = { courseId: string; completed: number; total: number; percent: number };

const emptyProfile: Profile = { id: 'demo-student', fullName: 'ADITHYA S', email: 'secl25cs08@sairamtap.edu.in', rollNo: 'SECL25CS08', role: 'student', department: 'Computer Science and Engineering', yearOfStudy: 3, semester: 5, section: 'D', avatarUrl: null };
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const nullableText = (value: unknown) => typeof value === 'string' ? value : null;
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const isNetworkError = (error: unknown) => error instanceof TypeError && /network|fetch/i.test(error.message);

async function rows<T>(table: string, select = '*', configure?: (query: any) => any, cacheName = table): Promise<T[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const cacheKey = `${sessionData.session?.user.id ?? 'signed-out'}:${cacheName}`;
  let query = supabase.from(table).select(select);
  if (configure) query = configure(query);
  try {
    const result = await query;
    if (result.error) throw result.error;
    const data = result.data ? result.data as T[] : [];
    await cacheValue(cacheKey, data);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      const cached = await readCache<T[]>(cacheKey);
      if (cached) return cached;
    } else await removeCache(cacheKey);
    throw error;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabase) return emptyProfile;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const cacheKey = `${session.user.id}:profile`;
  let row: any;
  try {
    const result = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (result.error) throw result.error;
    row = result.data;
  } catch (error) {
    if (isNetworkError(error)) return readCache<Profile>(cacheKey);
    await removeCache(cacheKey);
    throw error;
  }
  const profile = row ? { id: row.id, fullName: text(row.full_name), email: nullableText(row.email), rollNo: nullableText(row.roll_no), role: row.role as Role, department: nullableText(row.department), yearOfStudy: typeof row.year_of_study === 'number' ? row.year_of_study : null, semester: typeof row.semester === 'number' ? row.semester : null, section: nullableText(row.section), avatarUrl: nullableText(row.avatar_url) } : null;
  if (profile) await cacheValue(cacheKey, profile);
  return profile;
}

export async function getCurrentRole(): Promise<Role | null> {
  return (await getCurrentProfile())?.role ?? null;
}

export async function getCourses(): Promise<Course[]> {
  if (!supabase) return demoCourses.map(course => ({ id: course.id, code: course.code, title: course.title, description: '', department: null, facultyId: null, status: 'published', startsOn: null, endsOn: null }));
  const data = await rows<any>('courses', '*', query => query.order('title'));
  return data.map(row => ({ id: row.id, code: text(row.code), title: text(row.title), description: text(row.description), department: nullableText(row.department), facultyId: nullableText(row.faculty_id), status: text(row.status), startsOn: nullableText(row.starts_on), endsOn: nullableText(row.ends_on) }));
}

export async function getEnrollments(studentId?: string): Promise<Enrollment[]> {
  const id = studentId ?? (await getCurrentProfile())?.id;
  if (!id || !supabase) return [];
  const data = await rows<any>('enrollments', '*', query => query.eq('student_id', id), `enrollments:${id}`);
  return data.map(row => ({ courseId: row.course_id, studentId: row.student_id, status: text(row.status), enrolledAt: text(row.enrolled_at) }));
}

export async function getLessons(courseId?: string): Promise<Lesson[]> {
  if (!supabase || !courseId) return [];
  const data = await rows<any>('lessons', '*', query => query.eq('course_id', courseId).order('position'), `lessons:${courseId}`);
  return data.map(row => ({ id: row.id, courseId: row.course_id, title: text(row.title), summary: text(row.summary), position: Number(row.position) || 0, videoUrl: nullableText(row.video_url), resourceUrls: strings(row.resource_urls), published: Boolean(row.published) }));
}

export async function getLesson(id: string): Promise<Lesson | null> {
  if (!supabase) return null;
  const [row] = await rows<any>('lessons', '*', (query) => query.eq('id', id).limit(1), `lesson:${id}`);
  if (!row) return null;
  return { id: row.id, courseId: row.course_id, title: text(row.title), summary: text(row.summary), position: Number(row.position) || 0, videoUrl: nullableText(row.video_url), resourceUrls: strings(row.resource_urls), published: Boolean(row.published) };
}

export async function getAssignments(): Promise<Assignment[]> {
  if (!supabase) return demoAssignments.map(item => ({ id: item.id, courseId: null, course: item.course, title: item.title, instructions: '', dueAt: null, maxScore: 100, status: item.status }));
  const data = await rows<any>('assignments', '*, courses(title)', query => query.order('due_at', { ascending: true, nullsFirst: false }));
  return data.map(row => ({ id: row.id, courseId: nullableText(row.course_id), course: text(row.courses?.title), title: text(row.title), instructions: text(row.instructions), dueAt: nullableText(row.due_at), maxScore: Number(row.max_score) || 0, status: 'Pending' }));
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  if (!supabase) return demoEvents.map((event, index) => ({ id: `demo-event-${index}`, title: event.title, description: event.meta, kind: 'class', startsAt: eventTimeToday(event.time), endsAt: null, location: event.meta, courseId: null }));
  const data = await rows<any>('calendar_events', '*', query => query.order('starts_at'));
  return data.map(row => ({ id: row.id, title: text(row.title), description: text(row.description), kind: text(row.kind), startsAt: text(row.starts_at), endsAt: nullableText(row.ends_at), location: nullableText(row.location), courseId: nullableText(row.course_id) }));
}

export async function getNotifications(): Promise<Notification[]> {
  const profile = await getCurrentProfile();
  if (!supabase || !profile) return [];
  const data = await rows<any>('notifications', '*', query => query.eq('recipient_id', profile.id).order('created_at', { ascending: false }));
  return data.map(row => ({ id: row.id, title: text(row.title), body: text(row.body), data: record(row.data), readAt: nullableText(row.read_at), createdAt: text(row.created_at) }));
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  if (!supabase) return demoPosts.map(post => ({ id: post.id, authorId: 'demo', body: post.text, mediaUrls: [], clubName: post.author, publishedAt: new Date().toISOString() }));
  const data = await rows<any>('social_posts', '*', query => query.order('published_at', { ascending: false }));
  return data.map(row => ({ id: row.id, authorId: row.author_id, body: text(row.body), mediaUrls: strings(row.media_urls), clubName: nullableText(row.club_name), publishedAt: text(row.published_at) }));
}

export async function getAttendance(studentId?: string): Promise<AttendanceRecord[]> {
  const id = studentId ?? (await getCurrentProfile())?.id;
  if (!supabase || !id) return [];
  const data = await rows<any>('attendance_records', '*', query => query.eq('student_id', id).order('attended_at', { ascending: false }), `attendance:${id}`);
  return data.map(row => ({ id: row.id, eventId: nullableText(row.event_id), courseId: nullableText(row.course_id), studentId: row.student_id, attendedAt: text(row.attended_at), method: text(row.method), deviceRef: nullableText(row.device_ref) }));
}

export async function getAchievements(studentId?: string): Promise<Achievement[]> {
  const id = studentId ?? (await getCurrentProfile())?.id;
  if (!supabase || !id) return [];
  const data = await rows<any>('achievements', '*', query => query.eq('student_id', id).order('awarded_at', { ascending: false }), `achievements:${id}`);
  return data.map(row => ({ id: row.id, studentId: row.student_id, slug: text(row.slug), title: text(row.title), description: text(row.description), awardedAt: text(row.awarded_at), metadata: record(row.metadata) }));
}

export async function getCourseProgress(): Promise<CourseProgress[]> {
  if (!supabase) return demoCourses.map((course) => ({ courseId: course.id, completed: Math.round(course.lessons * course.progress / 100), total: course.lessons, percent: course.progress }));
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const lessons = await rows<{ id: string; course_id: string }>('lessons', 'id,course_id');
  const progress = await rows<{ lesson_id: string; completed_at: string | null }>('lesson_progress', 'lesson_id,completed_at', (query) => query.eq('student_id', profile.id));
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const byCourse = new Map<string, { total: number; completed: number }>();
  for (const lesson of lessons) { const value = byCourse.get(lesson.course_id) ?? { total: 0, completed: 0 }; value.total += 1; if (completed.has(lesson.id)) value.completed += 1; byCourse.set(lesson.course_id, value); }
  return [...byCourse].map(([courseId, value]) => ({ courseId, ...value, percent: value.total ? Math.round(value.completed * 100 / value.total) : 0 }));
}

export const queryKeys = {
  profile: ['learnflow', 'profile'] as const,
  courses: ['learnflow', 'courses'] as const,
  enrollments: (studentId?: string) => ['learnflow', 'enrollments', studentId ?? 'current'] as const,
  lessons: (courseId: string) => ['learnflow', 'lessons', courseId] as const,
  lesson: (id: string) => ['learnflow', 'lesson', id] as const,
  assignments: ['learnflow', 'assignments'] as const,
  events: ['learnflow', 'events'] as const,
  notifications: ['learnflow', 'notifications'] as const,
  socialPosts: ['learnflow', 'social-posts'] as const,
  attendance: (studentId?: string) => ['learnflow', 'attendance', studentId ?? 'current'] as const,
  achievements: (studentId?: string) => ['learnflow', 'achievements', studentId ?? 'current'] as const,
  progress: ['learnflow', 'progress'] as const,
};

export const repository = { getCurrentProfile, getCurrentRole, getCourses, getEnrollments, getLessons, getLesson, getAssignments, getCalendarEvents, getNotifications, getSocialPosts, getAttendance, getAchievements, getCourseProgress };
