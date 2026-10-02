import { BREW_METHOD_LABELS, type CafeSummary } from '@coffeeroute/shared';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { formatDistance, OpenBadge, RatingBadge } from './badges';

export function CafeCard({ cafe }: { cafe: CafeSummary }) {
  const distance = formatDistance(cafe.distanceKm);
  const place = [cafe.neighborhood, cafe.city].filter(Boolean).join(' · ');
  return (
    <Link href={{ pathname: '/cafe/[id]', params: { id: cafe.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Abre la ficha del café"
        className="gap-2 rounded-3xl border border-crema-200 bg-white p-4 active:opacity-90 dark:border-night-800 dark:bg-night-900"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text
              className="text-lg font-bold text-espresso-900 dark:text-crema-100"
              numberOfLines={1}
            >
              {cafe.name}
            </Text>
            <Text className="text-sm text-espresso-700 dark:text-crema-200" numberOfLines={1}>
              {place}
            </Text>
          </View>
          <Text className="text-base font-semibold text-espresso-700 dark:text-crema-200">
            {cafe.priceRange}
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <OpenBadge open={cafe.isOpenNow} />
          <RatingBadge rating={cafe.averageRating} reviews={cafe.totalReviews} />
          {distance ? (
            <Text className="text-sm text-espresso-700 dark:text-crema-200">{distance}</Text>
          ) : null}
        </View>

        {cafe.brewMethods.length > 0 ? (
          <Text className="text-sm text-espresso-500 dark:text-crema-200" numberOfLines={1}>
            {cafe.brewMethods.map((m) => BREW_METHOD_LABELS[m]).join(' · ')}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}
