import { Linking, Platform } from 'react-native';

interface Destination {
  latitude: number;
  longitude: number;
  name: string;
}

/** Walking directions URLs for the external maps apps (UC3/UC7, RF6). */
export function directionsUrls({ latitude, longitude, name }: Destination) {
  const coords = `${latitude},${longitude}`;
  return {
    apple: `https://maps.apple.com/?daddr=${coords}&q=${encodeURIComponent(name)}&dirflg=w`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=walking`,
  };
}

export async function openDirections(destination: Destination, app?: 'apple' | 'google') {
  const urls = directionsUrls(destination);
  const target = app ?? (Platform.OS === 'ios' ? 'apple' : 'google');
  await Linking.openURL(urls[target]);
}

/**
 * Whole route in Google Maps, walking, starting from the user's current location (RF6).
 * Apple Maps URLs only accept one destination, so iOS users navigate stop by stop instead.
 */
export function googleRouteUrl(stops: { latitude: number; longitude: number }[]): string {
  const coords = stops.map((s) => `${s.latitude},${s.longitude}`);
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(0, -1).join('|');
  const params = [`api=1`, `destination=${destination}`, `travelmode=walking`];
  if (waypoints) params.push(`waypoints=${encodeURIComponent(waypoints)}`);
  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}
