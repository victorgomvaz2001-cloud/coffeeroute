import { router } from 'expo-router';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { Section } from '@/components/section';
import { EmptyState } from '@/components/states';
import { useDeleteAccount, useLogout, useMe } from '@/lib/api/auth';
import { toApiError } from '@/lib/api/errors';
import { useSession } from '@/lib/store/session';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const status = useSession((s) => s.status);

  return (
    <View className="flex-1 bg-crema-50 dark:bg-night-950" style={{ paddingTop: insets.top }}>
      {status === 'authenticated' ? (
        <SignedInProfile />
      ) : (
        <EmptyState
          icon="person-circle-outline"
          title="Tu perfil cafetero"
          message="Crea una cuenta para guardar rutas, hacer check-in y proponer cafés.">
          <Button label="Crear cuenta" onPress={() => router.push('/signup')} />
          <Button label="Ya tengo cuenta" variant="secondary" onPress={() => router.push('/login')} />
        </EmptyState>
      )}
    </View>
  );
}

function SignedInProfile() {
  const user = useSession((s) => s.user);
  const me = useMe();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const stats = me.data?.stats;

  const confirmDelete = () =>
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán tu perfil, rutas y check-ins. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              onError: (error) => Alert.alert('No se pudo eliminar', toApiError(error).message),
            }),
        },
      ],
    );

  return (
    <ScrollView contentContainerClassName="gap-7 p-5 pb-12">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-3xl font-bold text-espresso-900 dark:text-crema-100">
          {user?.name ?? 'Tu perfil'}
        </Text>
        <Text className="text-base text-espresso-700 dark:text-crema-200">{user?.email}</Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Stat label="Cafés visitados" value={stats?.cafesVisited} />
        <Stat label="Ciudades" value={stats?.citiesVisited} />
        <Stat label="Rutas" value={stats?.routesCreated} />
        <Stat label="Check-ins" value={stats?.checkIns} />
      </View>

      <Section title="Contribuye">
        <Text className="text-base text-espresso-700 dark:text-crema-200">
          ¿Conoces un café de especialidad que no está en CoffeeRoute? Propónlo y lo revisaremos.
        </Text>
        <Button label="Proponer un café" variant="secondary" onPress={() => router.push('/propose')} />
      </Section>

      <Section title="Privacidad">
        <Button label="Permisos de ubicación" variant="secondary" onPress={() => void Linking.openSettings()} />
        <Button label="Privacidad y términos" variant="secondary" onPress={() => router.push('/legal')} />
      </Section>

      <View className="gap-3">
        <Button label="Cerrar sesión" variant="secondary" loading={logout.isPending} onPress={() => logout.mutate()} />
        <Button label="Eliminar cuenta" variant="danger" loading={deleteAccount.isPending} onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value ?? 'cargando'}`}
      className="min-w-[46%] flex-1 gap-1 rounded-2xl bg-white p-4 dark:bg-night-900">
      <Text className="text-2xl font-bold text-espresso-900 dark:text-crema-100">{value ?? '–'}</Text>
      <Text className="text-sm text-espresso-700 dark:text-crema-200">{label}</Text>
    </View>
  );
}
