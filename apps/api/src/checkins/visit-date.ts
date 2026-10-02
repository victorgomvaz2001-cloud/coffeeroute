/**
 * Calendar day of `now` in the café's timezone, as midnight UTC — the value Prisma
 * writes to a Postgres DATE column without shifting the day.
 */
export function localVisitDate(timezone: string, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
}

/** DATE column value → `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
