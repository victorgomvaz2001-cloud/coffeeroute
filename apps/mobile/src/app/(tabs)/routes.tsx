import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/states';

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-crema-50 dark:bg-night-950" style={{ paddingTop: insets.top }}>
      <EmptyState
        icon="trail-sign-outline"
        title="Rutas, muy pronto"
        message="Podrás crear rutas con varios cafés, calcular el orden óptimo y llevarlas offline."
      />
    </View>
  );
}
