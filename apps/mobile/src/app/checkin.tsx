import { zodResolver } from '@hookform/resolvers/zod';
import {
  BREW_METHOD_LABELS,
  type BrewMethod,
  type CheckIn,
  createCheckInSchema,
  MAX_CHECKIN_NOTES_LENGTH,
} from '@coffeeroute/shared';
import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { FormError } from '@/components/form-error';
import { RatingInput } from '@/components/rating-input';
import { Section } from '@/components/section';
import { EmptyState, LoadingState } from '@/components/states';
import { TextField } from '@/components/text-field';
import { useCafe } from '@/lib/api/cafes';
import {
  useCheckIn,
  useCreateCheckIn,
  useDeleteCheckIn,
  useUpdateCheckIn,
} from '@/lib/api/checkins';
import { toApiError } from '@/lib/api/errors';
import { formatPrice, parsePrice, sortBrewMethods } from '@/lib/checkins';
import { applyApiErrors } from '@/lib/forms';
import { useSession } from '@/lib/store/session';

// Notes and price are edited as text; they are converted when submitting.
const formSchema = createCheckInSchema.omit({ cafeId: true, notes: true, pricePaid: true }).extend({
  notes: z.string().max(MAX_CHECKIN_NOTES_LENGTH, `Máximo ${MAX_CHECKIN_NOTES_LENGTH} caracteres`),
  price: z
    .string()
    .refine(
      (text) => parsePrice(text) !== undefined,
      'Escribe un precio entre 0 y 100 €, p. ej. 3,50',
    ),
});
type CheckInForm = z.input<typeof formSchema>;
type CheckInValues = z.output<typeof formSchema>;

const RATING_FIELDS = [
  ['ratingCoffee', 'Café'],
  ['ratingService', 'Servicio'],
  ['ratingAmbiance', 'Ambiente'],
] as const;

export default function CheckInScreen() {
  const { cafeId, checkInId } = useLocalSearchParams<{ cafeId?: string; checkInId?: string }>();
  const status = useSession((s) => s.status);
  if (status !== 'authenticated') {
    return (
      <EmptyState icon="lock-closed-outline" title="Inicia sesión para hacer check-in">
        <Button label="Iniciar sesión" onPress={() => router.replace('/login')} />
      </EmptyState>
    );
  }
  return checkInId ? <EditCheckIn id={checkInId} /> : <NewCheckIn cafeId={cafeId} />;
}

function NewCheckIn({ cafeId }: { cafeId: string | undefined }) {
  const cafe = useCafe(cafeId);
  if (!cafeId) return <EmptyState icon="cafe-outline" title="Café no encontrado" />;
  if (cafe.isPending) return <LoadingState />;
  if (cafe.isError) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="No se ha podido cargar"
        message={toApiError(cafe.error).message}
      />
    );
  }
  return (
    <CheckInFormView
      cafeId={cafeId}
      cafeName={cafe.data.name}
      cafeMethods={cafe.data.brewMethods}
    />
  );
}

function EditCheckIn({ id }: { id: string }) {
  const checkIn = useCheckIn(id);
  const cafe = useCafe(checkIn.data?.cafe.id);
  if (checkIn.isPending) return <LoadingState />;
  if (checkIn.isError) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="No se ha podido cargar"
        message={toApiError(checkIn.error).message}
      />
    );
  }
  return (
    <CheckInFormView
      cafeId={checkIn.data.cafe.id}
      cafeName={checkIn.data.cafe.name}
      cafeMethods={cafe.data?.brewMethods ?? []}
      existing={checkIn.data}
    />
  );
}

interface CheckInFormViewProps {
  cafeId: string;
  cafeName: string;
  cafeMethods: BrewMethod[];
  existing?: CheckIn;
}

function CheckInFormView({ cafeId, cafeName, cafeMethods, existing }: CheckInFormViewProps) {
  const create = useCreateCheckIn();
  const update = useUpdateCheckIn(existing?.id ?? '');
  const remove = useDeleteCheckIn(existing?.id ?? '');
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<
    CheckInForm,
    unknown,
    CheckInValues
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ratingCoffee: existing?.ratingCoffee,
      ratingService: existing?.ratingService,
      ratingAmbiance: existing?.ratingAmbiance,
      brewMethods: existing?.brewMethods ?? [],
      notes: existing?.notes ?? '',
      price: existing?.pricePaid != null ? formatPrice(existing.pricePaid) : '',
    },
  });
  const methods = sortBrewMethods(cafeMethods);

  const onSubmit = handleSubmit(async ({ price, notes, ...ratings }) => {
    setFormError(null);
    const pricePaid = parsePrice(price) ?? null;
    try {
      if (existing) {
        await update.mutateAsync({ ...ratings, notes: notes.trim() || null, pricePaid });
      } else {
        await create.mutateAsync({
          cafeId,
          ...ratings,
          notes: notes.trim() || undefined,
          pricePaid: pricePaid ?? undefined,
        });
      }
      router.back();
    } catch (error) {
      if (toApiError(error).code === 'CHECKIN_ALREADY_TODAY') {
        queryClient.invalidateQueries({ queryKey: ['cafes', 'detail', cafeId] });
      }
      setFormError(applyApiErrors(error, setError));
    }
  });

  const confirmDelete = () =>
    Alert.alert('Eliminar check-in', 'Se borrarán esta visita y su valoración.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(undefined, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert('No se pudo eliminar', toApiError(error).message),
          }),
      },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: existing ? 'Editar check-in' : 'Check-in' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-crema-50 dark:bg-night-950"
      >
        <ScrollView contentContainerClassName="gap-7 p-5 pb-12" keyboardShouldPersistTaps="handled">
          <Text
            accessibilityRole="header"
            className="text-2xl font-bold text-espresso-900 dark:text-crema-100"
          >
            {cafeName}
          </Text>

          <Section title="Tu valoración">
            {RATING_FIELDS.map(([name, label]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field, fieldState }) => (
                  <RatingInput
                    label={label}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            ))}
          </Section>

          <Section title="Métodos probados">
            <Controller
              control={control}
              name="brewMethods"
              render={({ field }) => {
                const selected = field.value ?? [];
                const toggle = (method: BrewMethod) =>
                  field.onChange(
                    selected.includes(method)
                      ? selected.filter((m) => m !== method)
                      : [...selected, method],
                  );
                const chips = (list: BrewMethod[]) => (
                  <View className="flex-row flex-wrap gap-2">
                    {list.map((m) => (
                      <Chip
                        key={m}
                        label={BREW_METHOD_LABELS[m]}
                        selected={selected.includes(m)}
                        onPress={() => toggle(m)}
                      />
                    ))}
                  </View>
                );
                return (
                  <View className="gap-3">
                    {methods.cafe.length ? chips(methods.cafe) : null}
                    {methods.cafe.length ? (
                      <Text className="text-sm text-espresso-500 dark:text-crema-200">Otros</Text>
                    ) : null}
                    {chips(methods.others)}
                  </View>
                );
              }}
            />
          </Section>

          <Section title="Nota de tasting">
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <TextField
                  label="Qué notaste (opcional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  maxLength={MAX_CHECKIN_NOTES_LENGTH}
                  textAlignVertical="top"
                  style={{ minHeight: 96, paddingTop: 12 }}
                  placeholder="Chocolate, acidez media, cuerpo alto…"
                  error={fieldState.error?.message}
                  hint={`${field.value.length}/${MAX_CHECKIN_NOTES_LENGTH}`}
                />
              )}
            />
          </Section>

          <Section title="Precio">
            <Controller
              control={control}
              name="price"
              render={({ field, fieldState }) => (
                <TextField
                  label="Precio pagado en € (opcional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="decimal-pad"
                  placeholder="3,50"
                  error={fieldState.error?.message}
                  hint="Solo lo ves tú."
                />
              )}
            />
          </Section>

          <FormError message={formError} />
          <Button
            label={existing ? 'Guardar cambios' : 'Hacer check-in'}
            loading={formState.isSubmitting}
            onPress={() => void onSubmit()}
          />
          {existing ? (
            <>
              <Button
                label="Ver café"
                variant="ghost"
                onPress={() => router.push({ pathname: '/cafe/[id]', params: { id: cafeId } })}
              />
              <Button
                label="Eliminar check-in"
                variant="danger"
                loading={remove.isPending}
                onPress={confirmDelete}
              />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
