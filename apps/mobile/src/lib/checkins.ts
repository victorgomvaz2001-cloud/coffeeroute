import { BREW_METHODS, type BrewMethod, MAX_PRICE_PAID } from '@coffeeroute/shared';

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
];

/** The café's own methods first, then the rest; both in catalogue order. */
export function sortBrewMethods(cafeMethods: readonly BrewMethod[]): {
  cafe: BrewMethod[];
  others: BrewMethod[];
} {
  return {
    cafe: BREW_METHODS.filter((m) => cafeMethods.includes(m)),
    others: BREW_METHODS.filter((m) => !cafeMethods.includes(m)),
  };
}

/** `2026-10-02` → "hoy" / "ayer" / "2 oct 2026", relative to the device's day. */
export function formatVisitDate(isoDay: string, now = new Date()): string {
  const [year, month, day] = isoDay.split('-').map(Number) as [number, number, number];
  const daysAgo = Math.round(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(year, month - 1, day)) /
      86_400_000,
  );
  if (daysAgo === 0) return 'hoy';
  if (daysAgo === 1) return 'ayer';
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "3,50" or "3.5" → 3.5; blank → null (no price); anything else → undefined (invalid). */
export function parsePrice(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(trimmed)) return undefined;
  const value = Number(trimmed.replace(',', '.'));
  return value <= MAX_PRICE_PAID ? value : undefined;
}

/** 3.5 → "3,50", the way it is typed back into the price field. */
export function formatPrice(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
