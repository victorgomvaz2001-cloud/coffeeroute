import { Ionicons } from '@expo/vector-icons';
import { type RouteSummary } from '@coffeeroute/shared';
import { Link, router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { EmptyState, LoadingState } from '@/components/states';
import { usePalette } from '@/hooks/use-palette';
import { toApiError } from '@/lib/api/errors';
import { useMyRoutes } from '@/lib/api/routes';
import { formatMinutes } from '@/lib/format';
import { useRouteDraft } from '@/lib/store/route-draft';
import { useSession } from '@/lib/store/session';

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const status = useSession((s) => s.status);
  const routes = useMyRoutes();
  const draftCount = useRouteDraft((s) => s.cafes.length);

  let content: React.ReactNode;
  if (status !== 'authenticated') {
    content = (
      <EmptyState
        icon="trail-sign-outline"
        title="Planifica rutas de café"
        message="Inicia sesión para guardar rutas con varios cafés, calcular el mejor orden y llevarlas en tu viaje."
      >
        <Button label="Iniciar sesión" onPress={() => router.push('/login')} />
        <Button label="Crear cuenta" variant="secondary" onPress={() => router.push('/signup')} />
      </EmptyState>
    );
  } else if (routes.isPending) {
    content = <LoadingState label="Cargando tus rutas…" />;
  } else if (routes.isError) {
    content = (
      <EmptyState
        icon="cloud-offline-outline"
        title="No se han podido cargar tus rutas"
        message={toApiError(routes.error).message}
      >
        <Button label="Reintentar" onPress={() => void routes.refetch()} />
      </EmptyState>
    );
  } else {
    content = (
      <FlatList
        data={routes.data}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RouteCard route={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerClassName="grow px-4 pb-8"
        refreshing={routes.isRefetching}
        onRefresh={() => void routes.refetch()}
        ListEmptyComponent={
          <EmptyState
            icon="trail-sign-outline"
            title="Aún no tienes rutas"
            message="Añade cafés con el botón + desde Explorar y crea tu primera ruta."
          >
            <Button label="Explorar cafés" onPress={() => router.navigate('/')} />
          </EmptyState>
        }
      />
    );
  }

  return (
    <View className="flex-1 bg-crema-50 dark:bg-night-950" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <Text
          accessibilityRole="header"
          className="text-3xl font-bold text-espresso-900 dark:text-crema-100"
        >
          Mis rutas
        </Text>
        {draftCount > 0 ? (
          <Button
            label={`Continuar ruta (${draftCount})`}
            variant="ghost"
            onPress={() => router.push('/route-editor')}
          />
        ) : null}
      </View>
      {content}
    </View>
  );
}

function RouteCard({ route }: { route: RouteSummary }) {
  const palette = usePalette();
  return (
    <Link href={{ pathname: '/routes/[id]', params: { id: route.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        className="gap-1 rounded-3xl border border-crema-200 bg-white p-4 active:opacity-90 dark:border-night-800 dark:bg-night-900"
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className="flex-1 text-lg font-bold text-espresso-900 dark:text-crema-100"
            numberOfLines={1}
          >
            {route.name}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={palette.muted} />
        </View>
        <Text className="text-sm text-espresso-700 dark:text-crema-200">
          {route.city} · {route.cafeCount} cafés ·{' '}
          {route.totalDistanceKm.toFixed(1).replace('.', ',')} km ·{' '}
          {formatMinutes(route.totalMinutes)}
        </Text>
      </Pressable>
    </Link>
  );
}
