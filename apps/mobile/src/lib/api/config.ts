import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the API base URL. In development the API runs on the same machine as Metro,
 * so we reuse Metro's host (LAN IP) — this works on simulators and physical devices alike.
 */
export function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (metroHost) return `http://${metroHost}:3000/api/v1`;

  // Android emulators reach the host machine through 10.0.2.2.
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1';
}

export const API_URL = resolveApiUrl();
