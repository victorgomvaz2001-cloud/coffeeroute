import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function OpenBadge({ open }: { open: boolean }) {
  return (
    <View className="flex-row items-center gap-1">
      <View
        className={`size-2 rounded-full ${open ? 'bg-leaf-600 dark:bg-leaf-300' : 'bg-cherry-600 dark:bg-cherry-300'}`}
      />
      <Text
        className={`text-sm font-medium ${open ? 'text-leaf-600 dark:text-leaf-300' : 'text-cherry-600 dark:text-cherry-300'}`}
      >
        {open ? 'Abierto' : 'Cerrado'}
      </Text>
    </View>
  );
}

export function RatingBadge({ rating, reviews }: { rating: number; reviews: number }) {
  if (reviews === 0) {
    return <Text className="text-sm text-espresso-500 dark:text-crema-200">Sin valoraciones</Text>;
  }
  return (
    <View
      className="flex-row items-center gap-1"
      accessible
      accessibilityLabel={`Valoración ${rating.toFixed(1)} de 5, ${reviews} valoraciones`}
    >
      <Ionicons name="star" size={14} color="#c98a2b" />
      <Text className="text-sm font-semibold text-espresso-900 dark:text-crema-100">
        {rating.toFixed(1)}
      </Text>
      <Text className="text-sm text-espresso-500 dark:text-crema-200">({reviews})</Text>
    </View>
  );
}

export function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
