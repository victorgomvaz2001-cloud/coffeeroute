import { type RouteDetail } from '@coffeeroute/shared';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Button } from '@/components/button';
import { LegRow, StopCard, StopNumber } from '@/components/route-stop-list';
import { Section } from '@/components/section';
import { EmptyState, LoadingState } from '@/components/states';
import { usePalette } from '@/hooks/use-palette';
import { toApiError } from '@/lib/api/errors';
import { useDeleteRoute, useRoute } from '@/lib/api/routes';
import { formatMinutes } from '@/lib/format';
import { googleRouteUrl, openDirections } from '@/lib/maps';
import { useRouteDraft } from '@/lib/store/route-draft';
import { useSession } from '@/lib/store/session';

export default function RouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const route = useRoute(id);

  if (route.isPending) return <LoadingState label="Cargando ruta…" />;
  if (route.isError) {
    const error = toApiError(route.error);
    return (
      <EmptyState
        icon={error.statusCode === 404 ? 'trail-sign-outline' : 'cloud-offline-outline'}
        title={error.statusCode === 404 ? 'Ruta no disponible' : 'No se ha podido cargar'}
        message={error.message}
      >
        {error.statusCode !== 404 ? (
          <Button label="Reintentar" onPress={() => void route.refetch()} />
        ) : null}
      </EmptyState>
    );
  }
  return <RouteView route={route.data} />;
}

function RouteView({ route }: { route: RouteDetail }) {
  const palette = usePalette();
  const map = useRef<MapView>(null);
  const userId = useSession((s) => s.user?.id);
  const loadRoute = useRouteDraft((s) => s.loadRoute);
  const draftCount = useRouteDraft((s) => s.cafes.length);
  const remove = useDeleteRoute();
  const isAuthor = userId === route.authorId;

  const coords = route.stops.map((s) => ({
    latitude: s.cafe.latitude,
    longitude: s.cafe.longitude,
  }));
  const legByFrom = new Map(route.legs.map((leg) => [leg.fromCafeId, leg]));
  const unavailable = route.stops.filter((s) => !s.available).length;
  const first = route.stops[0]?.cafe;

  const startNavigation = () => {
    const openGoogle = () => void Linking.openURL(googleRouteUrl(coords));
    if (Platform.OS !== 'ios' || !first) return openGoogle();
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Iniciar ruta',
        message: 'Google Maps abre la ruta completa; Apple Maps solo admite el primer café.',
        options: ['Google Maps (ruta completa)', 'Apple Maps (primer café)', 'Cancelar'],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) openGoogle();
        if (index === 1) void openDirections(first, 'apple');
      },
    );
  };

  const edit = () => {
    const doEdit = () => {
      loadRoute(route);
      router.push('/route-editor');
    };
    if (draftCount === 0) return doEdit();
    Alert.alert(
      'Tienes otra ruta a medias',
      'Si editas esta, se descartará la que estabas creando.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Editar esta', style: 'destructive', onPress: doEdit },
      ],
    );
  };

  const confirmDelete = () =>
    Alert.alert('Eliminar ruta', `¿Seguro que quieres eliminar «${route.name}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(route.id, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert('No se pudo eliminar', toApiError(error).message),
          }),
      },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: route.name }} />
      <ScrollView
        className="flex-1 bg-crema-50 dark:bg-night-950"
        contentContainerClassName="pb-12"
      >
        <MapView
          ref={map}
          style={{ height: 280 }}
          accessibilityLabel={`Mapa de la ruta con ${route.stops.length} cafés`}
          onMapReady={() =>
            map.current?.fitToCoordinates(coords, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: false,
            })
          }
        >
          <Polyline
            coordinates={coords}
            strokeColor={palette.accent}
            strokeWidth={3}
            lineDashPattern={[6, 6]}
          />
          {route.stops.map((stop, index) => (
            <Marker
              key={stop.cafe.id}
              coordinate={{ latitude: stop.cafe.latitude, longitude: stop.cafe.longitude }}
              title={`${index + 1}. ${stop.cafe.name}`}
              tracksViewChanges={false}
            >
              <StopNumber n={index + 1} muted={!stop.available} />
            </Marker>
          ))}
        </MapView>

        <View className="gap-6 p-5">
          <View className="gap-1">
            <Text
              accessibilityRole="header"
              className="text-3xl font-bold text-espresso-900 dark:text-crema-100"
            >
              {route.name}
            </Text>
            <Text className="text-base text-espresso-700 dark:text-crema-200">
              {route.city} · {route.stops.length} cafés · {formatMinutes(route.totalMinutes)} en
              total
            </Text>
            <Text className="text-sm text-espresso-500 dark:text-crema-200">
              {formatMinutes(route.travelMinutes)} andando (
              {route.totalDistanceKm.toFixed(1).replace('.', ',')} km) + {route.visitMinutes} min
              por café
              {route.travelSource === 'estimate' ? ' · tiempos aproximados' : ''}
            </Text>
          </View>

          {unavailable ? (
            <View accessibilityRole="alert" className="rounded-2xl bg-cherry-600/10 p-4">
              <Text className="text-base text-cherry-600 dark:text-cherry-300">
                {unavailable === 1
                  ? 'Un café de esta ruta ya no está disponible.'
                  : `${unavailable} cafés de esta ruta ya no están disponibles.`}
                {isAuthor ? ' Edita la ruta para quitarlo.' : ''}
              </Text>
            </View>
          ) : null}

          <Button label="Iniciar ruta en Mapas" onPress={startNavigation} />

          <Section title="Paradas">
            <View>
              {route.stops.map((stop, index) => (
                <View key={stop.cafe.id}>
                  {index > 0 ? (
                    <LegRow leg={legByFrom.get(route.stops[index - 1]!.cafe.id)} />
                  ) : null}
                  <Link href={{ pathname: '/cafe/[id]', params: { id: stop.cafe.id } }} asChild>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityHint="Abre la ficha del café"
                      className="active:opacity-80"
                    >
                      <StopCard index={index} cafe={stop.cafe} unavailable={!stop.available}>
                        {stop.notes ? (
                          <Text className="text-base italic text-espresso-700 dark:text-crema-200">
                            “{stop.notes}”
                          </Text>
                        ) : null}
                      </StopCard>
                    </Pressable>
                  </Link>
                </View>
              ))}
            </View>
          </Section>

          {isAuthor ? (
            <View className="gap-3">
              <Button label="Editar ruta" variant="secondary" onPress={edit} />
              <Button
                label="Eliminar ruta"
                variant="danger"
                loading={remove.isPending}
                onPress={confirmDelete}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
