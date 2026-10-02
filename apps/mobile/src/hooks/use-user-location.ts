import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export interface Coords {
  latitude: number;
  longitude: number;
}

type Status = 'checking' | 'undetermined' | 'locating' | 'ready' | 'denied' | 'unavailable';

/**
 * Foreground location with explicit consent (RNF46). We only *check* the permission on mount;
 * the system prompt appears when the user taps "Usar mi ubicación".
 */
export function useUserLocation() {
  const [status, setStatus] = useState<Status>('checking');
  const [coords, setCoords] = useState<Coords | null>(null);

  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const fix =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      setCoords({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
      setStatus('ready');
    } catch {
      setStatus('unavailable');
    }
  }, []);

  const request = useCallback(async () => {
    const { status: permission } = await Location.requestForegroundPermissionsAsync();
    if (permission === 'granted') await locate();
    else setStatus('denied');
  }, [locate]);

  useEffect(() => {
    void (async () => {
      const { status: permission, canAskAgain } = await Location.getForegroundPermissionsAsync();
      if (permission === 'granted') await locate();
      else setStatus(canAskAgain ? 'undetermined' : 'denied');
    })();
  }, [locate]);

  return { status, coords, request, refresh: locate };
}
