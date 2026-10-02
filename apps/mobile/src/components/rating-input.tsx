import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

const STAR = '#c98a2b';

interface RatingInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
}

/** 1–5 stars. Screen readers get one adjustable control instead of five buttons. */
export function RatingInput({ label, value, onChange, error }: RatingInputProps) {
  const current = value ?? 0;
  return (
    <View className="gap-1.5">
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: current ? `${current} de 5` : 'Sin valorar' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === 'increment') onChange(Math.min(5, current + 1));
          if (nativeEvent.actionName === 'decrement') onChange(Math.max(1, current - 1));
        }}
        className="flex-row items-center justify-between gap-3"
      >
        <Text className="text-base text-espresso-900 dark:text-crema-100">{label}</Text>
        <View className="flex-row gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
              <Ionicons name={n <= current ? 'star' : 'star-outline'} size={30} color={STAR} />
            </Pressable>
          ))}
        </View>
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-cherry-600 dark:text-cherry-300">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
