import type { TimetableSlot } from './data';

export function localTimeToday(value: string, now = new Date()) {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const result = new Date(now);
  result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return result;
}

export function currentTimetableSlot(slots: TimetableSlot[], now = new Date()) {
  const weekday = now.getDay() || 7;
  return slots.filter((slot) => slot.weekday === weekday).find((slot) => {
    const start = localTimeToday(slot.startsAt, now); const end = localTimeToday(slot.endsAt, now);
    return Boolean(start && end && now >= start && now < end);
  }) ?? null;
}

export function nextTimetableSlot(slots: TimetableSlot[], now = new Date()) {
  const weekday = now.getDay() || 7;
  return slots.filter((slot) => slot.weekday === weekday).map((slot) => ({ slot, start: localTimeToday(slot.startsAt, now) })).filter((item): item is { slot: TimetableSlot; start: Date } => Boolean(item.start && item.start > now)).sort((a, b) => a.start.getTime() - b.start.getTime())[0]?.slot ?? null;
}
