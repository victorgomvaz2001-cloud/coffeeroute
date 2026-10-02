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
