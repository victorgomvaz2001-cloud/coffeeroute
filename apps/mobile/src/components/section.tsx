import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text
        accessibilityRole="header"
        className="text-xs font-semibold uppercase tracking-widest text-espresso-500 dark:text-crema-200"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
