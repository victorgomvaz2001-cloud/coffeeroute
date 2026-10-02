import { Ionicons } from '@expo/vector-icons';
import { BREW_METHOD_LABELS, type PublicCheckIn } from '@coffeeroute/shared';
import { Pressable, Text, View } from 'react-native';
import { formatVisitDate } from '@/lib/checkins';
import { Chip } from './chip';

interface CheckInCardProps {
  checkIn: PublicCheckIn;
  /** The author on a café page; the café on the user's own list. */
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function CheckInCard({ checkIn, title, subtitle, onPress }: CheckInCardProps) {
  const card = (
    <View className="gap-2 rounded-2xl bg-white p-4 dark:bg-night-900">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className="text-base font-semibold text-espresso-900 dark:text-crema-100"
          >
            {title}
          </Text>
          <Text className="text-sm text-espresso-500 dark:text-crema-200">
            {[subtitle, formatVisitDate(checkIn.visitedOn)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={`Puntuación ${checkIn.overallRating.toFixed(1)} de 5`}
          className="flex-row items-center gap-1"
        >
          <Ionicons name="star" size={14} color="#c98a2b" />
          <Text className="text-sm font-semibold text-espresso-900 dark:text-crema-100">
            {checkIn.overallRating.toFixed(1)}
          </Text>
        </View>
      </View>
      {checkIn.brewMethods.length ? (
        <View className="flex-row flex-wrap gap-2">
          {checkIn.brewMethods.map((m) => (
            <Chip key={m} label={BREW_METHOD_LABELS[m]} />
          ))}
        </View>
      ) : null}
      {checkIn.notes ? (
        <Text className="text-base text-espresso-700 dark:text-crema-200">{checkIn.notes}</Text>
      ) : null}
    </View>
  );
  if (!onPress) return card;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      {card}
    </Pressable>
  );
}
