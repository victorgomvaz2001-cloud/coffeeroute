import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { usePalette } from '@/hooks/use-palette';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accessibilityLabel: string;
  children: ReactNode;
}

export function Checkbox({ checked, onChange, accessibilityLabel, children }: CheckboxProps) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!checked)}
      className="min-h-11 flex-row items-center gap-3">
      <View
        className={`size-6 items-center justify-center rounded-md border-2 ${
          checked ? 'border-roast-500 bg-roast-500 dark:border-roast-300 dark:bg-roast-300' : 'border-espresso-500'
        }`}>
        {checked ? <Ionicons name="checkmark" size={16} color={palette.onAccent} /> : null}
      </View>
      <View className="flex-1">{children}</View>
    </Pressable>
  );
}
