import { localVisitDate, toIsoDate } from './visit-date';

describe('localVisitDate', () => {
  it("uses the café's timezone, not UTC", () => {
    // 22:30 UTC on 2 Oct = 00:30 on 3 Oct in Madrid (CEST) but 23:30 on 2 Oct in Lisbon (WEST).
    const lateUtc = new Date('2026-10-02T22:30:00Z');
    expect(toIsoDate(localVisitDate('Europe/Madrid', lateUtc))).toBe('2026-10-03');
    expect(toIsoDate(localVisitDate('Europe/Lisbon', lateUtc))).toBe('2026-10-02');
  });

  it('returns midnight UTC so a Postgres DATE keeps the same day', () => {
    // 03:00 UTC on 3 Oct = 21:00 on 2 Oct in Mexico City (UTC-6, no DST).
    expect(
      localVisitDate('America/Mexico_City', new Date('2026-10-03T03:00:00Z')).toISOString(),
    ).toBe('2026-10-02T00:00:00.000Z');
  });
});
