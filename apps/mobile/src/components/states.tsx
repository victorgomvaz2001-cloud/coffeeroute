import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { usePalette } from '@/hooks/use-palette';

interface StateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, message, children }: StateProps) {
  const palette = usePalette();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      <Ionicons name={icon} size={40} color={palette.muted} />
      <Text className="text-center text-lg font-semibold text-espresso-900 dark:text-crema-100">{title}</Text>
      {message ? (
        <Text className="text-center text-base text-espresso-700 dark:text-crema-200">{message}</Text>
      ) : null}
      {children ? <View className="mt-2 w-full gap-2">{children}</View> : null}
    </View>
  );
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  const palette = usePalette();
  return (
    <View className="flex-1 items-center justify-center gap-3 py-12" accessibilityLabel={label}>
      <ActivityIndicator color={palette.accent} />
      <Text className="text-base text-espresso-700 dark:text-crema-200">{label}</Text>
    </View>
  );
}
