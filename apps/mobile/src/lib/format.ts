/** 75 → "1 h 15 min", 40 → "40 min". */
export function formatMinutes(total: number): string {
  const minutes = Math.round(total);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** 850 → "850 m", 1240 → "1,2 km". */
export function formatMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}
