import { type CafeDetail } from '@coffeeroute/shared';
import { Text, View } from 'react-native';

type Props = { cafe: Pick<CafeDetail, 'averageRating' | 'totalReviews' | 'ratings'> };

export function RatingSummary({ cafe }: Props) {
  if (!cafe.ratings) {
    return (
      <Text className="text-base text-espresso-700 dark:text-crema-200">
        Aún no hay valoraciones. Sé el primero en valorar.
      </Text>
    );
  }
  const rows = [
    ['Café', cafe.ratings.coffee],
    ['Servicio', cafe.ratings.service],
    ['Ambiente', cafe.ratings.ambiance],
  ] as const;
  return (
    <View className="gap-3 rounded-2xl bg-white p-4 dark:bg-night-900">
      <View className="flex-row items-end gap-2">
        <Text className="text-4xl font-bold text-espresso-900 dark:text-crema-100">
          {cafe.averageRating.toFixed(1)}
        </Text>
        <Text className="pb-1.5 text-sm text-espresso-500 dark:text-crema-200">
          {cafe.totalReviews === 1 ? '1 valoración' : `${cafe.totalReviews} valoraciones`}
        </Text>
      </View>
      {rows.map(([label, value]) => (
        <View
          key={label}
          accessible
          accessibilityLabel={`${label}: ${value.toFixed(1)} de 5`}
          className="flex-row items-center gap-3"
        >
          <Text className="w-20 text-sm text-espresso-700 dark:text-crema-200">{label}</Text>
          <View className="h-2 flex-1 overflow-hidden rounded-full bg-crema-100 dark:bg-night-800">
            <View
              className="h-full rounded-full bg-roast-500 dark:bg-roast-300"
              style={{ width: `${(value / 5) * 100}%` }}
            />
          </View>
          <Text className="w-8 text-right text-sm font-semibold text-espresso-900 dark:text-crema-100">
            {value.toFixed(1)}
          </Text>
        </View>
      ))}
    </View>
  );
}
