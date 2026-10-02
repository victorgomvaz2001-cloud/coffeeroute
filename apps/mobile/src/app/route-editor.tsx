import { DEFAULT_VISIT_MINUTES, MIN_ROUTE_CAFES, type RoutePlan } from '@coffeeroute/shared';
import { useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { FormError } from '@/components/form-error';
import { IconAction, LegRow, StopCard } from '@/components/route-stop-list';
import { Section } from '@/components/section';
import { EmptyState } from '@/components/states';
import { TextField } from '@/components/text-field';
import { usePalette } from '@/hooks/use-palette';
import { useUserLocation } from '@/hooks/use-user-location';
import { toApiError } from '@/lib/api/errors';
import { useOptimizeRoute, useRoutePlan, useSaveRoute } from '@/lib/api/routes';
import { formatMinutes } from '@/lib/format';
import { useRouteDraft } from '@/lib/store/route-draft';
import { useSession } from '@/lib/store/session';

const VISIT_OPTIONS = [20, 30, DEFAULT_VISIT_MINUTES, 60, 90];

export default function RouteEditorScreen() {
  const palette = usePalette();
  const queryClient = useQueryClient();
  const authenticated = useSession((s) => s.status === 'authenticated');
  const location = useUserLocation();
  const draft = useRouteDraft();
  const ids = useMemo(() => draft.cafes.map((c) => c.id), [draft.cafes]);

  const plan = useRoutePlan(ids, draft.visitMinutes);
  const optimize = useOptimizeRoute();
  const save = useSaveRoute();
  const [startFromHere, setStartFromHere] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Placeholder data may belong to the previous order; only trust legs that match.
  const currentPlan = plan.data && plan.data.cafeIds.join() === ids.join() ? plan.data : null;
  const legByFrom = new Map(currentPlan?.legs.map((leg) => [leg.fromCafeId, leg]));
  const defaultName = suggestName(draft.cafes);
  const canPlan = ids.length >= MIN_ROUTE_CAFES;

  const discard = () =>
    Alert.alert('¿Descartar la ruta?', 'Se perderán los cambios.', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          draft.reset();
          router.back();
        },
      },
    ]);

  const runOptimize = () => {
    setFeedback(null);
    const before = currentPlan?.travelMinutes;
    const start = startFromHere && location.coords ? location.coords : undefined;
    optimize.mutate(
      { cafeIds: ids, visitMinutes: draft.visitMinutes, start },
      {
        onSuccess: (result: RoutePlan) => {
          draft.setOrder(result.cafeIds);
          // Seed the plan cache so totals for the new order show immediately.
          queryClient.setQueryData(['routes', 'plan', result.cafeIds, draft.visitMinutes], result);
          const saved = before === undefined ? 0 : before - result.travelMinutes;
          setFeedback(
            saved > 0
              ? `Orden optimizado: ${formatMinutes(saved)} menos andando.`
              : 'Ya estaba en el mejor orden posible.',
          );
        },
        onError: (error) => setFeedback(toApiError(error).message),
      },
    );
  };

  const submit = () => {
    setFormError(null);
    if (!authenticated) {
      router.push('/login');
      return;
    }
    save.mutate(
      {
        id: draft.routeId,
        input: {
          name: draft.name.trim() || defaultName,
          visitMinutes: draft.visitMinutes,
          stops: draft.cafes.map((c) => ({
            cafeId: c.id,
            notes: draft.notes[c.id]?.trim() || undefined,
          })),
        },
      },
      {
        onSuccess: (route) => {
          draft.reset();
          router.replace({ pathname: '/routes/[id]', params: { id: route.id } });
        },
        onError: (error) => setFormError(toApiError(error).message),
      },
    );
  };

  const header = (
    <Stack.Screen
      options={{
        title: draft.routeId ? 'Editar ruta' : 'Nueva ruta',
        headerLeft: () => <Button label="Descartar" variant="ghost" onPress={discard} />,
      }}
    />
  );

  if (draft.cafes.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon="trail-sign-outline"
          title="Tu ruta está vacía"
          message="Añade cafés desde Explorar o desde la ficha de cada café."
        >
          <Button label="Explorar cafés" onPress={() => router.back()} />
        </EmptyState>
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-crema-50 dark:bg-night-950"
    >
      {header}
      <ScrollView contentContainerClassName="gap-6 p-5 pb-12" keyboardShouldPersistTaps="handled">
        <TextField
          label="Nombre"
          value={draft.name}
          onChangeText={draft.setName}
          placeholder={defaultName}
          maxLength={80}
        />

        <Summary
          plan={currentPlan}
          loading={plan.isFetching && !currentPlan}
          error={plan.isError ? toApiError(plan.error).message : null}
          authenticated={authenticated}
          cafeCount={ids.length}
        />

        {canPlan ? (
          <View className="gap-3">
            <Button
              label="Optimizar orden"
              variant="secondary"
              loading={optimize.isPending}
              disabled={!authenticated}
              onPress={runOptimize}
            />
            {location.status === 'ready' ? (
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base text-espresso-900 dark:text-crema-100">
                  Empezar por el café más cercano a mí
                </Text>
                <Switch
                  accessibilityLabel="Empezar por el café más cercano a mi ubicación"
                  value={startFromHere}
                  onValueChange={setStartFromHere}
                  trackColor={{ true: palette.accent }}
                />
              </View>
            ) : null}
            {feedback ? (
              <Text
                accessibilityRole="alert"
                className="text-base text-leaf-600 dark:text-leaf-300"
              >
                {feedback}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Section title="Tiempo en cada café">
          <View className="flex-row flex-wrap gap-2">
            {VISIT_OPTIONS.map((minutes) => (
              <Chip
                key={minutes}
                label={`${minutes} min`}
                selected={draft.visitMinutes === minutes}
                onPress={() => draft.setVisitMinutes(minutes)}
              />
            ))}
          </View>
        </Section>

        <Section title={`Paradas (${draft.cafes.length})`}>
          <View>
            {draft.cafes.map((cafe, index) => (
              <View key={cafe.id}>
                {index > 0 ? <LegRow leg={legByFrom.get(draft.cafes[index - 1]!.id)} /> : null}
                <StopCard
                  index={index}
                  cafe={cafe}
                  actions={
                    <View className="flex-row">
                      <IconAction
                        icon="chevron-up"
                        label={`Subir ${cafe.name}`}
                        disabled={index === 0}
                        onPress={() => draft.move(cafe.id, -1)}
                      />
                      <IconAction
                        icon="chevron-down"
                        label={`Bajar ${cafe.name}`}
                        disabled={index === draft.cafes.length - 1}
                        onPress={() => draft.move(cafe.id, 1)}
                      />
                      <IconAction
                        icon="trash-outline"
                        label={`Quitar ${cafe.name}`}
                        danger
                        onPress={() => draft.remove(cafe.id)}
                      />
                    </View>
                  }
                >
                  <TextInput
                    value={draft.notes[cafe.id] ?? ''}
                    onChangeText={(text) => draft.setNote(cafe.id, text)}
                    placeholder="Nota: p. ej. probar el flat white"
                    placeholderTextColor={palette.muted}
                    maxLength={280}
                    accessibilityLabel={`Nota para ${cafe.name}`}
                    className="min-h-10 rounded-xl bg-crema-50 px-3 py-2 text-base text-espresso-900 dark:bg-night-950 dark:text-crema-100"
                  />
                </StopCard>
              </View>
            ))}
          </View>
          <Button label="Añadir más cafés" variant="ghost" onPress={() => router.back()} />
        </Section>

        <FormError message={formError} />
        <Button
          label={
            authenticated
              ? draft.routeId
                ? 'Guardar cambios'
                : 'Guardar ruta'
              : 'Inicia sesión para guardar'
          }
          disabled={!canPlan}
          loading={save.isPending}
          onPress={submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Summary({
  plan,
  loading,
  error,
  authenticated,
  cafeCount,
}: {
  plan: RoutePlan | null;
  loading: boolean;
  error: string | null;
  authenticated: boolean;
  cafeCount: number;
}) {
  let body: React.ReactNode;
  if (cafeCount < MIN_ROUTE_CAFES)
    body = <Muted>Añade al menos {MIN_ROUTE_CAFES} cafés para calcular la ruta.</Muted>;
  else if (!authenticated)
    body = <Muted>Inicia sesión para calcular tiempos y guardar la ruta.</Muted>;
  else if (error)
    body = <Text className="text-base text-cherry-600 dark:text-cherry-300">{error}</Text>;
  else if (!plan || loading) body = <Muted>Calculando tiempos…</Muted>;
  else
    body = (
      <View className="gap-1">
        <Text className="text-2xl font-bold text-espresso-900 dark:text-crema-100">
          {formatMinutes(plan.totalMinutes)}
        </Text>
        <Text className="text-base text-espresso-700 dark:text-crema-200">
          {formatMinutes(plan.travelMinutes)} andando (
          {plan.totalDistanceKm.toFixed(1).replace('.', ',')} km) +{' '}
          {formatMinutes(plan.visitMinutes)} en los cafés
        </Text>
        {plan.travelSource === 'estimate' ? (
          <Text className="text-sm text-espresso-500 dark:text-crema-200">Tiempos aproximados</Text>
        ) : null}
      </View>
    );
  return (
    <View accessibilityLiveRegion="polite" className="rounded-2xl bg-white p-4 dark:bg-night-900">
      {body}
    </View>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <Text className="text-base text-espresso-700 dark:text-crema-200">{children}</Text>;
}

/** "Ruta por Málaga · 4 cafés" from the city most stops are in. */
function suggestName(cafes: { city: string }[]): string {
  const counts = new Map<string, number>();
  for (const { city } of cafes) counts.set(city, (counts.get(city) ?? 0) + 1);
  const city = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return city
    ? `Ruta por ${city} · ${cafes.length} ${cafes.length === 1 ? 'café' : 'cafés'}`
    : 'Mi ruta';
}
