import { Text, View } from 'react-native';

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      className="rounded-xl bg-cherry-600/10 p-3 dark:bg-cherry-300/15"
    >
      <Text className="text-base text-cherry-600 dark:text-cherry-300">{message}</Text>
    </View>
  );
}
