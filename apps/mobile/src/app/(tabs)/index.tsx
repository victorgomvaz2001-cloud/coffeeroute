import { Ionicons } from '@expo/vector-icons';
import { type CafeSearchParams, type CafeSummary, MAX_RADIUS_KM } from '@coffeeroute/shared';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, Text, TextInput, View } from 'react-native';
import type { Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { CafeCard } from '@/components/cafe-card';
import { CafeMap } from '@/components/cafe-map';
import { EmptyState, LoadingState } from '@/components/states';
import { usePalette } from '@/hooks/use-palette';
import { useUserLocation } from '@/hooks/use-user-location';
import { useCafeSearch } from '@/lib/api/cafes';
import { toApiError } from '@/lib/api/errors';
import { activeFilterCount, useFilters } from '@/lib/store/filters';

type SearchTarget =
  | { kind: 'near'; latitude: number; longitude: number; label: string }
  | { kind: 'text'; q: string };

type ViewMode = 'list' | 'map';

const POPULAR_CITIES = ['Málaga', 'Madrid', 'Lisboa'];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const location = useUserLocation();
  const filters = useFilters();
  const filterCount = activeFilterCount(filters);

  const [mode, setMode] = useState<ViewMode>('list');
  const [text, setText] = useState('');
  const [target, setTarget] = useState<SearchTarget | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [mapMoved, setMapMoved] = useState(false);

  // Until the user searches, follow their location.
  const effectiveTarget = useMemo<SearchTarget | null>(
    () => target ?? (location.coords ? { kind: 'near', ...location.coords, label: 'Cerca de ti' } : null),
    [target, location.coords],
  );

  const params = useMemo<CafeSearchParams | null>(() => {
    if (!effectiveTarget) return null;
    const shared = {
      openNow: filters.openNow || undefined,
      brewMethods: filters.brewMethods,
      amenities: filters.amenities,
      priceRange: filters.priceRange,
      limit: 100,
    };
    return effectiveTarget.kind === 'near'
      ? { ...shared, lat: effectiveTarget.latitude, lng: effectiveTarget.longitude, radiusKm: filters.radiusKm }
      : { ...shared, q: effectiveTarget.q };
  }, [effectiveTarget, filters.openNow, filters.brewMethods, filters.amenities, filters.priceRange, filters.radiusKm]);

  const search = useCafeSearch(params);
  const cafes = useMemo(() => search.data?.items ?? [], [search.data]);
  const fitKey = JSON.stringify(params);

  const submitText = (value = text) => {
    const q = value.trim();
    if (!q) return;
    setText(q);
    setTarget({ kind: 'text', q });
    setMapMoved(false);
  };

  const searchNearMe = () => {
    setText('');
    setTarget(null);
    setMapMoved(false);
    if (location.status === 'ready') void location.refresh();
    else void location.request();
  };

  const searchThisArea = () => {
    if (!mapRegion) return;
    // Visible map height in km, halved, as the radius.
    const radius = Math.min(MAX_RADIUS_KM, Math.max(0.5, (mapRegion.latitudeDelta * 111) / 2));
    filters.setRadius(Math.round(radius * 10) / 10);
    setTarget({ kind: 'near', latitude: mapRegion.latitude, longitude: mapRegion.longitude, label: 'Esta zona' });
    setText('');
    setMapMoved(false);
  };

  const subtitle = !effectiveTarget
    ? null
    : effectiveTarget.kind === 'near'
      ? `${effectiveTarget.label} · ${filters.radiusKm} km`
      : `Resultados para “${effectiveTarget.q}”`;

  return (
    <View className="flex-1 bg-crema-50 dark:bg-night-950" style={{ paddingTop: insets.top }}>
      <View className="gap-3 px-4 pb-3 pt-2">
        <Text accessibilityRole="header" className="text-3xl font-bold text-espresso-900 dark:text-crema-100">
          Explorar
        </Text>

        <View className="min-h-12 flex-row items-center gap-2 rounded-2xl border border-crema-200 bg-white px-3 dark:border-night-800 dark:bg-night-900">
          <Ionicons name="search" size={20} color={palette.muted} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submitText()}
            placeholder="Ciudad, barrio o café"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar por ciudad, barrio o nombre del café"
            className="flex-1 py-3 text-base text-espresso-900 dark:text-crema-100"
          />
          {text ? (
            <Pressable accessibilityLabel="Borrar búsqueda" hitSlop={8} onPress={() => setText('')}>
              <Ionicons name="close-circle" size={20} color={palette.muted} />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <View className="flex-1" />
          <IconButton
            icon="locate"
            label="Usar mi ubicación"
            onPress={searchNearMe}
            active={effectiveTarget?.kind === 'near' && effectiveTarget.label === 'Cerca de ti'}
          />
          <Link href="/filters" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={filterCount ? `Filtros, ${filterCount} activos` : 'Filtros'}
              className="min-h-11 flex-row items-center gap-1.5 rounded-full border border-crema-200 bg-white px-4 active:opacity-80 dark:border-night-800 dark:bg-night-900">
              <Ionicons name="options-outline" size={18} color={palette.text} />
              <Text className="font-medium text-espresso-900 dark:text-crema-100">Filtros</Text>
              {filterCount ? (
                <View className="min-w-5 items-center rounded-full bg-roast-500 px-1.5 dark:bg-roast-300">
                  <Text className="text-xs font-bold text-white dark:text-espresso-900">{filterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
        </View>

        {subtitle ? (
          <Text className="text-sm text-espresso-700 dark:text-crema-200">
            {subtitle}
            {search.data ? ` · ${search.data.total} ${search.data.total === 1 ? 'café' : 'cafés'}` : ''}
          </Text>
        ) : null}
      </View>

      {!effectiveTarget ? (
        <Onboarding
          locationStatus={location.status}
          onUseLocation={searchNearMe}
          onPickCity={(city) => submitText(city)}
        />
      ) : search.isError && !search.data ? (
        <EmptyState icon="cloud-offline-outline" title="No hemos podido cargar los cafés" message={toApiError(search.error).message}>
          <Button label="Reintentar" onPress={() => void search.refetch()} />
        </EmptyState>
      ) : search.isPending ? (
        <LoadingState label="Buscando cafés…" />
      ) : mode === 'map' ? (
        <View className="flex-1">
          <CafeMap
            cafes={cafes}
            fitKey={fitKey}
            showsUserLocation={location.status === 'ready'}
            initialRegion={
              effectiveTarget.kind === 'near'
                ? { latitude: effectiveTarget.latitude, longitude: effectiveTarget.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
                : undefined
            }
            onRegionChangeComplete={(region, isGesture) => {
              setMapRegion(region);
              if (isGesture) setMapMoved(true);
            }}
          />
          {mapMoved ? (
            <View className="absolute left-0 right-0 top-3 items-center">
              <Button label="Buscar en esta zona" onPress={searchThisArea} className="shadow-md" />
            </View>
          ) : null}
          {cafes.length === 0 ? (
            <View className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white p-4 dark:bg-night-900">
              <Text className="text-center text-base text-espresso-900 dark:text-crema-100">
                No hay cafés con estos criterios en esta zona.
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <CafeList
          cafes={cafes}
          groupByNeighborhood={effectiveTarget.kind === 'text'}
          refreshing={search.isRefetching}
          onRefresh={() => void search.refetch()}
          empty={
            <NoResults
              canWiden={effectiveTarget.kind === 'near' && filters.radiusKm < MAX_RADIUS_KM}
              onWiden={() => filters.setRadius(Math.min(MAX_RADIUS_KM, filters.radiusKm * 2))}
              canClearFilters={filterCount > 0}
              onClearFilters={filters.reset}
            />
          }
        />
      )}
    </View>
  );
}

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  const options: { value: ViewMode; label: string }[] = [
    { value: 'list', label: 'Lista' },
    { value: 'map', label: 'Mapa' },
  ];
  return (
    <View accessibilityRole="tablist" className="flex-row rounded-full bg-crema-100 p-1 dark:bg-night-900">
      {options.map((option) => {
        const selected = option.value === mode;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-9 justify-center rounded-full px-4 ${selected ? 'bg-white dark:bg-night-800' : ''}`}>
            <Text className={`font-medium ${selected ? 'text-espresso-900 dark:text-crema-100' : 'text-espresso-700 dark:text-crema-200'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  active,
}: {
  icon: 'locate';
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-11 items-center justify-center rounded-full border border-crema-200 bg-white active:opacity-80 dark:border-night-800 dark:bg-night-900">
      <Ionicons name={active ? icon : `${icon}-outline`} size={20} color={active ? palette.accent : palette.text} />
    </Pressable>
  );
}

function CafeList({
  cafes,
  groupByNeighborhood,
  refreshing,
  onRefresh,
  empty,
}: {
  cafes: CafeSummary[];
  groupByNeighborhood: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  empty: React.ReactElement;
}) {
  // UC3: when exploring a city, group cafés by neighbourhood.
  const sections = useMemo(() => {
    if (!groupByNeighborhood) return [{ title: '', data: cafes }];
    const groups = new Map<string, CafeSummary[]>();
    for (const cafe of cafes) {
      const key = [cafe.neighborhood ?? 'Otros', cafe.city].join(', ');
      groups.set(key, [...(groups.get(key) ?? []), cafe]);
    }
    return [...groups.entries()]
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([title, data]) => ({ title, data }));
  }, [cafes, groupByNeighborhood]);

  return (
    <SectionList
      sections={cafes.length ? sections : []}
      keyExtractor={(cafe) => cafe.id}
      renderItem={({ item }) => <CafeCard cafe={item} />}
      renderSectionHeader={({ section }) =>
        section.title ? (
          <Text accessibilityRole="header" className="bg-crema-50 pb-1 pt-3 text-sm font-semibold uppercase tracking-wider text-espresso-500 dark:bg-night-950 dark:text-crema-200">
            {section.title}
          </Text>
        ) : null
      }
      ItemSeparatorComponent={() => <View className="h-3" />}
      contentContainerClassName="px-4 pb-8 grow"
      ListEmptyComponent={empty}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboardDismissMode="on-drag"
      stickySectionHeadersEnabled
    />
  );
}

function NoResults({
  canWiden,
  onWiden,
  canClearFilters,
  onClearFilters,
}: {
  canWiden: boolean;
  onWiden: () => void;
  canClearFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <EmptyState
      icon="cafe-outline"
      title="No hay cafés que encajen"
      message="Prueba a ampliar el radio de búsqueda o a quitar algún filtro.">
      {canWiden ? <Button label="Ampliar radio" onPress={onWiden} /> : null}
      {canClearFilters ? <Button label="Quitar filtros" variant="secondary" onPress={onClearFilters} /> : null}
    </EmptyState>
  );
}

function Onboarding({
  locationStatus,
  onUseLocation,
  onPickCity,
}: {
  locationStatus: ReturnType<typeof useUserLocation>['status'];
  onUseLocation: () => void;
  onPickCity: (city: string) => void;
}) {
  if (locationStatus === 'checking' || locationStatus === 'locating') {
    return <LoadingState label="Buscando tu ubicación…" />;
  }
  const denied = locationStatus === 'denied' || locationStatus === 'unavailable';
  return (
    <EmptyState
      icon="cafe-outline"
      title="Encuentra café de especialidad"
      message={
        denied
          ? 'No tenemos acceso a tu ubicación. Busca una ciudad o actívala en Ajustes.'
          : 'Usa tu ubicación para ver cafés cerca de ti, o busca una ciudad para planificar tu viaje.'
      }>
      {!denied ? <Button label="Usar mi ubicación" onPress={onUseLocation} /> : null}
      <Text className="mt-2 text-center text-sm font-medium text-espresso-700 dark:text-crema-200">
        Ciudades populares
      </Text>
      <View className="flex-row flex-wrap justify-center gap-2">
        {POPULAR_CITIES.map((city) => (
          <Button key={city} label={city} variant="secondary" onPress={() => onPickCity(city)} />
        ))}
      </View>
    </EmptyState>
  );
}
