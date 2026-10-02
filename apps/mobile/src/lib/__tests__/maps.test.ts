import { directionsUrls } from '../maps';

describe('directionsUrls', () => {
  it('builds walking directions for Apple and Google Maps', () => {
    const urls = directionsUrls({ latitude: 36.72, longitude: -4.42, name: 'Café & Co' });
    expect(urls.apple).toBe('https://maps.apple.com/?daddr=36.72,-4.42&q=Caf%C3%A9%20%26%20Co&dirflg=w');
    expect(urls.google).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=36.72,-4.42&travelmode=walking',
    );
  });
});
