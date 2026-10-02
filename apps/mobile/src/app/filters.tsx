import {
  AMENITIES,
  AMENITY_LABELS,
  BREW_METHOD_LABELS,
  BREW_METHODS,
  PRICE_RANGES,
} from '@coffeeroute/shared';
import { router } from 'expo-router';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Section } from '@/components/section';
import { usePalette } from '@/hooks/use-palette';
import { activeFilterCount, useFilters } from '@/lib/store/filters';

const RADII = [1, 2, 5, 10, 25];

/** Filters apply live (UC1 step 4); this sheet only collects them. */
export default function FiltersSheet() {
  const palette = usePalette();
  const filters = useFilters();
  const count = activeFilterCount(filters);

  // The ScrollView must be the screen's root: react-native-screens only sizes a form sheet's
  // ScrollView when it is a direct child (software-mansion/react-native-screens#3634).
  return (
    <ScrollView
      className="flex-1 bg-crema-50 dark:bg-night-950"
      contentContainerClassName="gap-7 p-5 pb-10"
    >
      <View className="flex-row items-center justify-between">
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold text-espresso-900 dark:text-crema-100"
        >
          Filtros
        </Text>
        {count ? <Button label="Quitar todos" variant="ghost" onPress={filters.reset} /> : null}
      </View>

      <View className="flex-row items-center justify-between rounded-2xl bg-white p-4 dark:bg-night-900">
        <Text className="text-base font-medium text-espresso-900 dark:text-crema-100">
          Abierto ahora
        </Text>
        <Switch
          accessibilityLabel="Mostrar solo cafés abiertos ahora"
          value={filters.openNow}
          onValueChange={filters.setOpenNow}
          trackColor={{ true: palette.accent }}
        />
      </View>

      <Section title="Métodos de preparación">
        <View className="flex-row flex-wrap gap-2">
          {BREW_METHODS.map((method) => (
            <Chip
              key={method}
              label={BREW_METHOD_LABELS[method]}
              selected={filters.brewMethods.includes(method)}
              onPress={() => filters.toggle('brewMethods', method)}
            />
          ))}
        </View>
      </Section>

      <Section title="Servicios">
        <View className="flex-row flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <Chip
              key={amenity}
              label={AMENITY_LABELS[amenity]}
              selected={filters.amenities.includes(amenity)}
              onPress={() => filters.toggle('amenities', amenity)}
            />
          ))}
        </View>
      </Section>

      <Section title="Precio">
        <View className="flex-row gap-2">
          {PRICE_RANGES.map((price) => (
            <Chip
              key={price}
              label={price}
              selected={filters.priceRange.includes(price)}
              onPress={() => filters.toggle('priceRange', price)}
            />
          ))}
        </View>
      </Section>

      <Section title="Radio de búsqueda">
        <View className="flex-row flex-wrap gap-2">
          {RADII.map((km) => (
            <Chip
              key={km}
              label={`${km} km`}
              selected={filters.radiusKm === km}
              onPress={() => filters.setRadius(km)}
            />
          ))}
        </View>
      </Section>

      <Button label="Ver resultados" onPress={() => router.back()} />
    </ScrollView>
  );
}
