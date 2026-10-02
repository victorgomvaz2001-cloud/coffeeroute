import { type CafeSummary } from '@coffeeroute/shared';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import MapView, { Marker, type Region } from 'react-native-maps';
import { usePalette } from '@/hooks/use-palette';

interface CafeMapProps {
  cafes: CafeSummary[];
  /** Change it to re-frame the map around the current results (e.g. after a new search). */
  fitKey: string;
  initialRegion?: Region;
  showsUserLocation?: boolean;
  onRegionChangeComplete?: (region: Region, isGesture: boolean) => void;
}

const SPAIN: Region = { latitude: 40.0, longitude: -3.7, latitudeDelta: 8, longitudeDelta: 8 };

export function CafeMap({
  cafes,
  fitKey,
  initialRegion,
  showsUserLocation,
  onRegionChangeComplete,
}: CafeMapProps) {
  const ref = useRef<MapView>(null);
  const palette = usePalette();

  useEffect(() => {
    if (cafes.length === 0) return;
    ref.current?.fitToCoordinates(
      cafes.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
      { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: true },
    );
    // Re-frame only when the search changes, not when the user pans.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return (
    <MapView
      ref={ref}
      style={{ flex: 1 }}
      initialRegion={initialRegion ?? SPAIN}
      showsUserLocation={showsUserLocation}
      showsPointsOfInterests={false}
      onRegionChangeComplete={(region, details) =>
        onRegionChangeComplete?.(region, !!details?.isGesture)
      }
      accessibilityLabel="Mapa de cafés"
    >
      {cafes.map((cafe) => (
        <Marker
          key={cafe.id}
          coordinate={{ latitude: cafe.latitude, longitude: cafe.longitude }}
          title={cafe.name}
          description={[cafe.neighborhood, cafe.isOpenNow ? 'Abierto' : 'Cerrado']
            .filter(Boolean)
            .join(' · ')}
          pinColor={palette.accent}
          onCalloutPress={() => router.push({ pathname: '/cafe/[id]', params: { id: cafe.id } })}
        />
      ))}
    </MapView>
  );
}
