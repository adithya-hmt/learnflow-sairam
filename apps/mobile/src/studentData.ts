export const student = {
  name: 'ADITHYA S', rollNo: 'SECL25CS08', branch: 'Computer Science and Engineering',
  section: 'D', year: 'III Year', semester: 'V Semester', attendance: 87.28,
};

export const periods = [
  { period: 1, start: '09:00', end: '09:50' }, { period: 2, start: '09:50', end: '10:40' },
  { period: 3, start: '10:55', end: '11:45' }, { period: 4, start: '11:45', end: '12:35' },
  { period: 6, start: '13:25', end: '14:15' }, { period: 7, start: '14:15', end: '15:05' },
  { period: 8, start: '15:20', end: '16:10' },
] as const;

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export const weekdays: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const isWeekday = (value: string): value is Weekday => weekdays.includes(value as Weekday);
export type PeriodNumber = typeof periods[number]['period'];
export type ClassSlot = { period: PeriodNumber; code: string; title: string; room?: string };
export const timetable: Record<Weekday, ClassSlot[]> = {
  Monday: [
    { period: 1, code: 'SE / HABITS', title: 'Skill Enhancement / 7 Habits' }, { period: 2, code: 'OE', title: 'Fundamentals of Cyber Security' },
    { period: 3, code: 'PE-I', title: 'Human Centered Computing' }, { period: 4, code: 'PE-I', title: 'Human Centered Computing' },
    { period: 6, code: 'COI', title: 'Constitution of India' }, { period: 7, code: 'AI', title: 'Artificial Intelligence' },
    { period: 8, code: 'CN', title: 'Computer Networks' },
  ],
  Tuesday: [
    { period: 1, code: 'AI LAB', title: 'Artificial Intelligence Laboratory' }, { period: 2, code: 'AI LAB', title: 'Artificial Intelligence Laboratory' },
    { period: 3, code: 'AI LAB', title: 'Artificial Intelligence Laboratory' }, { period: 4, code: 'PE-II', title: 'Learning Analytics Tools' },
    { period: 6, code: 'CN', title: 'Computer Networks' }, { period: 7, code: 'AI', title: 'Artificial Intelligence' },
    { period: 8, code: 'COI', title: 'Constitution of India' },
  ],
  Wednesday: [
    { period: 1, code: 'OE', title: 'Fundamentals of Cyber Security' }, { period: 2, code: 'CN', title: 'Computer Networks' },
    { period: 3, code: 'PE-I', title: 'Human Centered Computing' }, { period: 4, code: 'PE-I', title: 'Human Centered Computing' },
    { period: 6, code: 'AI', title: 'Artificial Intelligence' }, { period: 7, code: 'OE', title: 'Fundamentals of Cyber Security' },
    { period: 8, code: 'SE / HABITS', title: 'Skill Enhancement / 7 Habits' },
  ],
  Thursday: [
    { period: 1, code: 'PE-II', title: 'Learning Analytics Tools' }, { period: 2, code: 'CN', title: 'Computer Networks' },
    { period: 3, code: 'PDL-I', title: 'Prototype Development Lab I' }, { period: 4, code: 'PDL-I', title: 'Prototype Development Lab I' },
    { period: 6, code: 'CN LAB', title: 'Computer Networks Laboratory' }, { period: 7, code: 'CN LAB', title: 'Computer Networks Laboratory' },
    { period: 8, code: 'CN LAB', title: 'Computer Networks Laboratory' },
  ],
  Friday: [
    { period: 1, code: 'CN', title: 'Computer Networks' }, { period: 2, code: 'OE', title: 'Fundamentals of Cyber Security' },
    { period: 3, code: 'AI', title: 'Artificial Intelligence' }, { period: 4, code: 'OE', title: 'Fundamentals of Cyber Security' },
    { period: 6, code: 'PE-II', title: 'Learning Analytics Tools' }, { period: 7, code: 'PE-II', title: 'Learning Analytics Tools' },
    { period: 8, code: 'MENTOR', title: 'Mentor Counselling' },
  ],
};

const minutes = (value: string) => { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute; };
export function getScheduleStatus(day: Weekday, now: Date) {
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const schedule = timetable[day].flatMap((slot) => { const time = periods.find((item) => item.period === slot.period); return time ? [{ ...slot, start: time.start, end: time.end }] : []; });
  return {
    current: schedule.find((slot) => minutes(slot.start) <= currentMinute && currentMinute < minutes(slot.end)) ?? null,
    next: schedule.find((slot) => minutes(slot.start) > currentMinute) ?? null,
  };
}

export const subjectAttendance = [
  { code: '20CSTP501', name: 'Skill Enhancement', percentage: 90 },
  { code: '24AIEL503', name: 'Human Centered Computing', percentage: 90 },
  { code: '24CSID501', name: 'Prototype Development Lab I', percentage: 100 },
  { code: '24CSPW501', name: 'Artificial Intelligence with Laboratory', percentage: 95.12 },
  { code: '24ITEL516', name: 'Learning Analytics Tools', percentage: 83.33 },
  { code: '24ITPC501', name: 'Computer Networks', percentage: 86.96 },
  { code: '24ITPL501', name: 'Computer Networks Laboratory', percentage: 80 },
  { code: '24MGMC501', name: 'Constitution of India', percentage: 100 },
  { code: '24SCOE901', name: 'Fundamentals of Cyber Security', percentage: 75 },
  { code: 'MC', name: 'Mentor Counselling', percentage: 50 },
];

export const recentAttendance = [
  { date: '06 Aug', status: ['AB', 'AB', '—', '—', 'AB', 'AB', 'AB'] },
  { date: '05 Aug', status: ['P', 'P', 'P', 'P', 'P', 'P', 'P'] },
  { date: '04 Aug', status: ['OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD'] },
  { date: '03 Aug', status: ['OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD'] },
  { date: '31 Jul', status: ['OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD'] },
  { date: '30 Jul', status: ['OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD'] },
  { date: '29 Jul', status: ['AB', 'AB', 'AB', 'AB', 'AB', 'AB', 'AB'] },
];

export const academicMilestones = [
  { date: '27 Aug – 2 Sep', title: 'CAT I', tone: 'coral' as const },
  { date: '8 Sep', title: 'CAT I marks published', tone: 'blue' as const },
  { date: '22–29 Oct', title: 'CAT II', tone: 'coral' as const },
  { date: '29 Oct', title: 'Last working day', tone: 'gold' as const },
  { date: '30 Oct – 6 Nov', title: 'End-semester practicals', tone: 'blue' as const },
  { date: '10–24 Nov', title: 'End-semester theory exams', tone: 'coral' as const },
  { date: '10 Dec', title: 'Even semester begins', tone: 'green' as const },
  { date: '2 Jan 2027', title: 'PGPA calculation deadline', tone: 'gold' as const },
];
