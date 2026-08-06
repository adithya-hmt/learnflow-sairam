export const roles = ['student', 'faculty', 'mentor', 'club_coordinator', 'department_admin', 'super_admin'] as const;
export type Role = typeof roles[number];

export const roleLabels: Record<Role, string> = {
  student: 'Student', faculty: 'Faculty', mentor: 'Mentor',
  club_coordinator: 'Club coordinator', department_admin: 'Department admin', super_admin: 'Super admin',
};

export type Capability = 'learn' | 'submit' | 'grade' | 'mentor' | 'publish_social' | 'manage_department' | 'manage_platform';
const grants: Record<Role, Capability[]> = {
  student: ['learn', 'submit'],
  faculty: ['learn', 'grade'],
  mentor: ['learn', 'mentor'],
  club_coordinator: ['learn', 'publish_social'],
  department_admin: ['learn', 'grade', 'mentor', 'publish_social', 'manage_department'],
  super_admin: ['learn', 'submit', 'grade', 'mentor', 'publish_social', 'manage_department', 'manage_platform'],
};
export const can = (role: Role, capability: Capability) => grants[role].includes(capability);

export const courses = [
  { id: 'ai', code: 'CS3491', title: 'Artificial Intelligence', faculty: 'Dr. Priya Raman', progress: 68, color: '#176B87', lessons: 12 },
  { id: 'networks', code: 'CS3591', title: 'Computer Networks', faculty: 'Prof. Arun Kumar', progress: 42, color: '#23745A', lessons: 10 },
  { id: 'design', code: 'GE3451', title: 'Design Thinking', faculty: 'Dr. Meena S', progress: 81, color: '#D9634C', lessons: 8 },
];

export const assignments = [
  { id: 'a1', course: 'Artificial Intelligence', title: 'Search strategies lab', due: 'Today · 5:00 PM', status: 'Due today' },
  { id: 'a2', course: 'Computer Networks', title: 'Subnetting quiz', due: 'Tomorrow · 10:00 AM', status: 'Quiz' },
  { id: 'a3', course: 'Design Thinking', title: 'User interview notes', due: 'Fri · 11:59 PM', status: 'Draft saved' },
];

export const events = [
  { time: '09:00', title: 'Artificial Intelligence', meta: 'Lab 3 · Block B' },
  { time: '11:15', title: 'Mentor check-in', meta: 'Innovation Centre' },
  { time: '14:00', title: 'Coding Club meetup', meta: 'Seminar Hall 2' },
];

export function eventTimeToday(time: string, now = new Date()) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Invalid event time: ${time}`);
  const result = new Date(now);
  result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return result.toISOString();
}

export function parseDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isUpcomingEvent(startsAt: string, endsAt: string | null, now = new Date()): boolean {
  const lastMoment = parseDate(endsAt || startsAt);
  return Boolean(lastMoment && lastMoment >= now);
}

export function formatDateTime(value: string | Date): string {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date) : 'Date unavailable';
}

export function formatClockTime(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(value);
}

export function formatCalendarDate(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(value);
}

export function getWeekDates(value: Date): Date[] {
  const monday = new Date(value);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
  return Array.from({ length: 5 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return date; });
}

export const posts = [
  { id: 'p1', author: 'Sairam Coding Club', badge: 'Official', time: '24 min', text: 'Registrations are open for Build Night 2026. Bring a problem worth solving — teams form at the venue.', likes: 128, comments: 18, color: '#176B87' },
  { id: 'p2', author: 'Department of CSE', badge: 'Department', time: '2 hr', text: 'Congratulations to the student teams selected for the Smart India Hackathon internal round.', likes: 214, comments: 31, color: '#23745A' },
];
