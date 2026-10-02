import { formatMeters, formatMinutes } from '../format';
import { googleRouteUrl } from '../maps';

describe('formatMinutes', () => {
  it.each([
    [40, '40 min'],
    [60, '1 h'],
    [75, '1 h 15 min'],
    [288, '4 h 48 min'],
  ])('%i → %s', (input, expected) => expect(formatMinutes(input)).toBe(expected));
});

describe('formatMeters', () => {
  it.each([
    [847, '850 m'],
    [1240, '1,2 km'],
  ])('%i → %s', (input, expected) => expect(formatMeters(input)).toBe(expected));
});

describe('googleRouteUrl', () => {
  it('uses the last stop as destination and the rest as waypoints', () => {
    const url = googleRouteUrl([
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
      { latitude: 5, longitude: 6 },
    ]);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=5,6&travelmode=walking&waypoints=1%2C2%7C3%2C4',
    );
  });
});
