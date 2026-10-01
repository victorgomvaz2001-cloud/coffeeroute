import { z } from 'zod';
import { WEEKDAYS, type Weekday } from './constants';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM');

export const dayHoursSchema = z.object({ open: timeSchema, close: timeSchema });
export type DayHours = z.infer<typeof dayHoursSchema>;

/**
 * Weekly opening hours. A missing or null day means closed.
 * `close` earlier than or equal to `open` means the café closes after midnight.
 */
export const openingHoursSchema = z.partialRecord(z.enum(WEEKDAYS), dayHoursSchema.nullable());
export type OpeningHours = z.infer<typeof openingHoursSchema>;

const toMinutes = (hhmm: string): number => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Weekday and minutes since midnight of `date` as seen in `timeZone`. */
export function localTime(date: Date, timeZone: string): { weekday: Weekday; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday').toLowerCase() as Weekday;
  return { weekday, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Whether a café with `hours` is open at `date` in its own `timeZone`. */
export function isOpenNow(
  hours: OpeningHours | null | undefined,
  timeZone: string,
  date: Date = new Date(),
): boolean {
  if (!hours) return false;
  const { weekday, minutes } = localTime(date, timeZone);
  const dayIndex = WEEKDAYS.indexOf(weekday);
  const previousDay = WEEKDAYS[(dayIndex + 6) % 7] as Weekday;

  const today = hours[weekday];
  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open ? minutes >= open && minutes < close : minutes >= open) return true;
  }

  // Overnight spill-over from the previous day (e.g. Fri 18:00–02:00 seen on Sat 01:00).
  const yesterday = hours[previousDay];
  if (yesterday) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close <= open && minutes < close) return true;
  }
  return false;
}
