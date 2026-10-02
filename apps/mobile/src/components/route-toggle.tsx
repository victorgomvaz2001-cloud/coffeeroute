import { Ionicons } from '@expo/vector-icons';
import { type CafeSummary, MAX_ROUTE_CAFES } from '@coffeeroute/shared';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, Text } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { useRouteDraft } from '@/lib/store/route-draft';

/** Adds/removes a café from the route being built. */
export function useToggleInRoute(cafe: CafeSummary) {
  const inRoute = useRouteDraft((s) => s.cafes.some((c) => c.id === cafe.id));
  const toggle = useRouteDraft((s) => s.toggle);
  const onToggle = () => {
    if (!toggle(cafe)) {
      Alert.alert('Ruta completa', `Una ruta admite como máximo ${MAX_ROUTE_CAFES} cafés.`);
      return;
    }
    void Haptics.selectionAsync();
  };
  return { inRoute, onToggle };
}

/** Compact round button for cards. */
export function RouteToggleIcon({ cafe }: { cafe: CafeSummary }) {
  const palette = usePalette();
  const { inRoute, onToggle } = useToggleInRoute(cafe);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        inRoute ? `Quitar ${cafe.name} de la ruta` : `Añadir ${cafe.name} a la ruta`
      }
      accessibilityState={{ selected: inRoute }}
      onPress={onToggle}
      hitSlop={8}
      className="size-10 items-center justify-center rounded-full active:opacity-70"
    >
      <Ionicons
        name={inRoute ? 'checkmark-circle' : 'add-circle-outline'}
        size={28}
        color={inRoute ? '#2f7d4f' : palette.accent}
      />
    </Pressable>
  );
}

/** Full-width button for the café detail screen. */
export function RouteToggleButton({ cafe }: { cafe: CafeSummary }) {
  const palette = usePalette();
  const { inRoute, onToggle } = useToggleInRoute(cafe);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: inRoute }}
      onPress={onToggle}
      className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-crema-200 bg-white px-5 active:opacity-80 dark:border-night-800 dark:bg-night-900"
    >
      <Ionicons
        name={inRoute ? 'checkmark-circle' : 'add-circle-outline'}
        size={20}
        color={inRoute ? '#2f7d4f' : palette.accent}
      />
      <Text className="text-base font-semibold text-espresso-900 dark:text-crema-100">
        {inRoute ? 'En tu ruta · Quitar' : 'Añadir a una ruta'}
      </Text>
    </Pressable>
  );
}
