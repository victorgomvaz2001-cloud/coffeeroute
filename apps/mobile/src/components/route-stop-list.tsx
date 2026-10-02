import { Ionicons } from '@expo/vector-icons';
import { type CafeSummary, type RouteLeg } from '@coffeeroute/shared';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { formatMeters, formatMinutes } from '@/lib/format';

export function StopNumber({ n, muted }: { n: number; muted?: boolean }) {
  return (
    <View
      className={`size-8 items-center justify-center rounded-full ${
        muted ? 'bg-crema-200 dark:bg-night-800' : 'bg-roast-500 dark:bg-roast-300'
      }`}
    >
      <Text
        className={`font-bold ${muted ? 'text-espresso-700 dark:text-crema-200' : 'text-white dark:text-espresso-900'}`}
      >
        {n}
      </Text>
    </View>
  );
}

/** "↓ 9 min · 700 m" between two stops. */
export function LegRow({ leg }: { leg: RouteLeg | undefined }) {
  const palette = usePalette();
  return (
    <View
      className="flex-row items-center gap-2 py-1 pl-2"
      accessible
      accessibilityLabel={
        leg
          ? `${formatMinutes(leg.durationSeconds / 60)} andando, ${formatMeters(leg.distanceMeters)}`
          : 'Calculando trayecto'
      }
    >
      <View className="h-6 w-0.5 bg-crema-200 dark:bg-night-800" />
      <Ionicons name="walk-outline" size={16} color={palette.muted} />
      <Text className="text-sm text-espresso-700 dark:text-crema-200">
        {leg
          ? `${formatMinutes(leg.durationSeconds / 60)} · ${formatMeters(leg.distanceMeters)}`
          : '…'}
      </Text>
    </View>
  );
}

interface StopCardProps {
  index: number;
  cafe: CafeSummary;
  unavailable?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
}

export function StopCard({ index, cafe, unavailable, children, actions }: StopCardProps) {
  return (
    <View className="gap-3 rounded-2xl border border-crema-200 bg-white p-3 dark:border-night-800 dark:bg-night-900">
      <View className="flex-row items-center gap-3">
        <StopNumber n={index + 1} muted={unavailable} />
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-espresso-900 dark:text-crema-100"
            numberOfLines={1}
          >
            {cafe.name}
          </Text>
          <Text className="text-sm text-espresso-700 dark:text-crema-200" numberOfLines={1}>
            {unavailable
              ? 'Ya no está disponible'
              : [cafe.neighborhood, cafe.city].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {actions}
      </View>
      {children}
    </View>
  );
}

export function IconAction({
  icon,
  label,
  onPress,
  disabled,
  danger,
}: {
  icon: 'chevron-up' | 'chevron-down' | 'trash-outline';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      className={`size-10 items-center justify-center rounded-full active:opacity-60 ${disabled ? 'opacity-30' : ''}`}
    >
      <Ionicons name={icon} size={22} color={danger ? '#b3261e' : palette.text} />
    </Pressable>
  );
}
