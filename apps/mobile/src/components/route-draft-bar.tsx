import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useRouteDraft } from '@/lib/store/route-draft';

/** Floating summary of the route being built; opens the editor (UC2 step 1). */
export function RouteDraftBar() {
  const count = useRouteDraft((s) => s.cafes.length);
  const editing = useRouteDraft((s) => s.routeId !== null);
  if (count === 0) return null;

  const hint = count < 2 ? 'Añade al menos otro café' : 'Revisa el orden y guárdala';
  return (
    <View pointerEvents="box-none" className="absolute bottom-4 left-4 right-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${editing ? 'Ruta en edición' : 'Nueva ruta'} con ${count} ${count === 1 ? 'café' : 'cafés'}. ${hint}`}
        onPress={() => router.push('/route-editor')}
        className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-espresso-900 px-4 py-3 active:opacity-90 dark:bg-crema-100"
      >
        <View className="size-9 items-center justify-center rounded-full bg-roast-500 dark:bg-roast-600">
          <Text className="text-base font-bold text-white">{count}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-crema-50 dark:text-espresso-900">
            {editing ? 'Editando ruta' : 'Tu ruta'}
          </Text>
          <Text className="text-sm text-crema-200 dark:text-espresso-700">{hint}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#e3a17c" />
      </Pressable>
    </View>
  );
}
