import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Toggleable pill used for filters; read-only when `onPress` is omitted. */
export function Chip({ label, selected, onPress }: ChipProps) {
  const base = 'min-h-9 justify-center rounded-full border px-3.5';
  const tone = selected
    ? 'border-roast-500 bg-roast-500 dark:border-roast-300 dark:bg-roast-300'
    : 'border-crema-200 bg-white dark:border-night-800 dark:bg-night-900';
  const text = selected
    ? 'text-white dark:text-espresso-900'
    : 'text-espresso-700 dark:text-crema-200';

  if (!onPress) {
    return (
      <Text
        className={`overflow-hidden rounded-full bg-crema-100 px-3 py-1 text-sm text-espresso-700 dark:bg-night-800 dark:text-crema-200`}
      >
        {label}
      </Text>
    );
  }
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      onPress={onPress}
      hitSlop={4}
      className={`${base} ${tone} active:opacity-80`}
    >
      <Text className={`text-sm font-medium ${text}`}>{label}</Text>
    </Pressable>
  );
}
