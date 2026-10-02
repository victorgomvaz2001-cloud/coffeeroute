import { formatPrice, formatVisitDate, parsePrice, sortBrewMethods } from '../checkins';

describe('sortBrewMethods', () => {
  it("puts the café's methods first, both groups in catalogue order", () => {
    expect(sortBrewMethods(['cold-brew', 'espresso'])).toEqual({
      cafe: ['espresso', 'cold-brew'],
      others: ['pour-over', 'aeropress', 'chemex', 'batch-brew', 'siphon', 'french-press'],
    });
  });
});

describe('formatVisitDate', () => {
  const now = new Date(2026, 9, 2, 10, 0); // 2 Oct 2026, device-local
  it.each([
    ['2026-10-02', 'hoy'],
    ['2026-10-01', 'ayer'],
    ['2026-09-12', '12 sept 2026'],
    ['2025-12-31', '31 dic 2025'],
  ])('%s → %s', (day, expected) => expect(formatVisitDate(day, now)).toBe(expected));
});

describe('parsePrice', () => {
  it.each([
    ['', null],
    ['  ', null],
    ['3,50', 3.5],
    ['3.5', 3.5],
    ['12', 12],
    ['100', 100],
    ['100,01', undefined],
    ['3,555', undefined],
    ['-2', undefined],
    ['abc', undefined],
  ])('%j → %p', (text, expected) => expect(parsePrice(text)).toBe(expected));
});

describe('formatPrice', () => {
  it('uses a decimal comma and two decimals', () => expect(formatPrice(3.5)).toBe('3,50'));
});
