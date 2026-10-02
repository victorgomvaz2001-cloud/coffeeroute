import { zodResolver } from '@hookform/resolvers/zod';
import {
  AMENITIES,
  AMENITY_LABELS,
  BREW_METHOD_LABELS,
  BREW_METHODS,
  PRICE_RANGES,
  proposeCafeSchema,
} from '@coffeeroute/shared';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { FormError } from '@/components/form-error';
import { Section } from '@/components/section';
import { EmptyState } from '@/components/states';
import { TextField } from '@/components/text-field';
import { useProposeCafe } from '@/lib/api/cafes';
import { applyApiErrors } from '@/lib/forms';
import { useSession } from '@/lib/store/session';

// Coordinates come from geocoding the address (or the device), not from the user.
const formSchema = proposeCafeSchema
  .omit({
    latitude: true,
    longitude: true,
    roasters: true,
    timezone: true,
    openingHours: true,
    equipment: true,
  })
  .extend({
    roasters: z.string().max(400),
    website: z.union([z.url('URL no válida'), z.literal('')]).optional(),
  });
type ProposeForm = z.input<typeof formSchema>;
type ProposeValues = z.output<typeof formSchema>;

type Coords = { latitude: number; longitude: number };

export default function ProposeCafeScreen() {
  const status = useSession((s) => s.status);
  if (status !== 'authenticated') {
    return (
      <EmptyState icon="lock-closed-outline" title="Inicia sesión para proponer cafés">
        <Button label="Iniciar sesión" onPress={() => router.replace('/login')} />
      </EmptyState>
    );
  }
  return <ProposeCafeForm />;
}

function ProposeCafeForm() {
  const propose = useProposeCafe();
  const [formError, setFormError] = useState<string | null>(null);
  const [deviceCoords, setDeviceCoords] = useState<Coords | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<
    ProposeForm,
    unknown,
    ProposeValues
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      country: 'España',
      neighborhood: '',
      instagram: '',
      website: '',
      roasters: '',
      brewMethods: [],
      amenities: [],
      priceRange: '€€',
    },
  });

  const pickDeviceLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sin acceso a la ubicación', 'Escribe la dirección completa del café.');
      return;
    }
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setDeviceCoords({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
  };

  const geocode = async ({ address, city, country }: ProposeValues): Promise<Coords | null> => {
    try {
      const [match] = await Location.geocodeAsync(`${address}, ${city}, ${country}`);
      return match ? { latitude: match.latitude, longitude: match.longitude } : null;
    } catch {
      return null;
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const coords = deviceCoords ?? (await geocode(values));
    if (!coords) {
      setFormError(
        'No encontramos esa dirección. Revísala o, si estás en el café, usa tu ubicación actual.',
      );
      return;
    }
    try {
      const cafe = await propose.mutateAsync({
        ...values,
        ...coords,
        neighborhood: values.neighborhood || undefined,
        instagram: values.instagram || undefined,
        website: values.website || undefined,
        roasters: values.roasters
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      Alert.alert('¡Gracias!', 'Un curador revisará el café antes de publicarlo.');
      router.replace({ pathname: '/cafe/[id]', params: { id: cafe.id } });
    } catch (error) {
      setFormError(applyApiErrors(error, setError));
    }
  });

  const text = (
    name:
      | 'name'
      | 'address'
      | 'city'
      | 'country'
      | 'neighborhood'
      | 'roasters'
      | 'website'
      | 'instagram',
    label: string,
    extra: object = {},
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          value={(field.value as string | undefined) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          {...extra}
        />
      )}
    />
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-crema-50 dark:bg-night-950"
    >
      <ScrollView contentContainerClassName="gap-6 p-5 pb-12" keyboardShouldPersistTaps="handled">
        <Text className="text-base text-espresso-700 dark:text-crema-200">
          Cuéntanos lo que sepas. Un curador completará horario y equipamiento al verificarlo.
        </Text>
        <FormError message={formError} />

        <Section title="El café">
          {text('name', 'Nombre')}
          {text('roasters', 'Tostadores', { hint: 'Separados por comas' })}
        </Section>

        <Section title="Dónde está">
          {text('address', 'Dirección', { textContentType: 'streetAddressLine1' })}
          <View className="flex-row gap-3">
            <View className="flex-1">
              {text('city', 'Ciudad', { textContentType: 'addressCity' })}
            </View>
            <View className="flex-1">
              {text('country', 'País', { textContentType: 'countryName' })}
            </View>
          </View>
          {text('neighborhood', 'Barrio (opcional)')}
          <Button
            label={
              deviceCoords ? 'Ubicación actual guardada ✓' : 'Estoy en el café: usar mi ubicación'
            }
            variant="secondary"
            onPress={() => void pickDeviceLocation()}
          />
        </Section>

        <Section title="Métodos de preparación">
          <Controller
            control={control}
            name="brewMethods"
            render={({ field }) => (
              <View className="flex-row flex-wrap gap-2">
                {BREW_METHODS.map((method) => {
                  const selected = field.value?.includes(method) ?? false;
                  return (
                    <Chip
                      key={method}
                      label={BREW_METHOD_LABELS[method]}
                      selected={selected}
                      onPress={() =>
                        field.onChange(
                          selected
                            ? field.value?.filter((m) => m !== method)
                            : [...(field.value ?? []), method],
                        )
                      }
                    />
                  );
                })}
              </View>
            )}
          />
        </Section>

        <Section title="Servicios">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <View className="flex-row flex-wrap gap-2">
                {AMENITIES.map((amenity) => {
                  const selected = field.value?.includes(amenity) ?? false;
                  return (
                    <Chip
                      key={amenity}
                      label={AMENITY_LABELS[amenity]}
                      selected={selected}
                      onPress={() =>
                        field.onChange(
                          selected
                            ? field.value?.filter((a) => a !== amenity)
                            : [...(field.value ?? []), amenity],
                        )
                      }
                    />
                  );
                })}
              </View>
            )}
          />
        </Section>

        <Section title="Precio">
          <Controller
            control={control}
            name="priceRange"
            render={({ field }) => (
              <View className="flex-row gap-2">
                {PRICE_RANGES.map((price) => (
                  <Chip
                    key={price}
                    label={price}
                    selected={field.value === price}
                    onPress={() => field.onChange(price)}
                  />
                ))}
              </View>
            )}
          />
        </Section>

        <Section title="En internet (opcional)">
          {text('website', 'Web', {
            autoCapitalize: 'none',
            keyboardType: 'url',
            placeholder: 'https://',
          })}
          {text('instagram', 'Instagram', { autoCapitalize: 'none', placeholder: '@usuario' })}
        </Section>

        <Button label="Enviar propuesta" loading={formState.isSubmitting} onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
