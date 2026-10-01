import { describe, expect, it } from 'vitest';
import { isOpenNow, type OpeningHours } from './opening-hours';

const tz = 'Europe/Madrid';
// 2026-10-07 is a Wednesday; Madrid is UTC+2 (CEST) on that date.
const at = (isoLocal: string) => new Date(`${isoLocal}+02:00`);

describe('isOpenNow', () => {
  const hours: OpeningHours = {
    wednesday: { open: '08:00', close: '20:00' },
    friday: { open: '18:00', close: '02:00' },
    sunday: null,
  };

  it('is open inside the interval', () => {
    expect(isOpenNow(hours, tz, at('2026-10-07T08:00:00'))).toBe(true);
    expect(isOpenNow(hours, tz, at('2026-10-07T19:59:00'))).toBe(true);
  });

  it('is closed at and after closing time', () => {
    expect(isOpenNow(hours, tz, at('2026-10-07T20:00:00'))).toBe(false);
    expect(isOpenNow(hours, tz, at('2026-10-07T07:59:00'))).toBe(false);
  });

  it('is closed on days without hours', () => {
    expect(isOpenNow(hours, tz, at('2026-10-08T10:00:00'))).toBe(false); // thursday missing
    expect(isOpenNow(hours, tz, at('2026-10-11T10:00:00'))).toBe(false); // sunday null
  });

  it('handles hours that cross midnight', () => {
    expect(isOpenNow(hours, tz, at('2026-10-09T23:30:00'))).toBe(true); // friday night
    expect(isOpenNow(hours, tz, at('2026-10-10T01:30:00'))).toBe(true); // saturday early
    expect(isOpenNow(hours, tz, at('2026-10-10T02:00:00'))).toBe(false);
  });

  it('uses the café timezone, not the device timezone', () => {
    // 06:30 UTC is 08:30 in Madrid.
    expect(isOpenNow(hours, tz, new Date('2026-10-07T06:30:00Z'))).toBe(true);
    expect(isOpenNow(hours, 'Europe/Lisbon', new Date('2026-10-07T06:30:00Z'))).toBe(false);
  });

  it('returns false without hours', () => {
    expect(isOpenNow(null, tz)).toBe(false);
  });
});
