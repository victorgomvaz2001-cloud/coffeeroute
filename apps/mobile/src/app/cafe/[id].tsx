import { Ionicons } from '@expo/vector-icons';
import {
  AMENITY_LABELS,
  BREW_METHOD_LABELS,
  localTime,
  WEEKDAY_LABELS,
  WEEKDAYS,
  type CafeDetail,
} from '@coffeeroute/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { type ComponentProps } from 'react';
import { ActionSheetIOS, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { OpenBadge, RatingBadge } from '@/components/badges';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Section } from '@/components/section';
import { EmptyState, LoadingState } from '@/components/states';
import { usePalette } from '@/hooks/use-palette';
import { useCafe } from '@/lib/api/cafes';
import { toApiError } from '@/lib/api/errors';
import { openDirections } from '@/lib/maps';

export default function CafeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cafe = useCafe(id);

  if (cafe.isPending) return <LoadingState />;
  if (cafe.isError) {
    const error = toApiError(cafe.error);
    return (
      <EmptyState
        icon={error.statusCode === 404 ? 'cafe-outline' : 'cloud-offline-outline'}
        title={error.statusCode === 404 ? 'Café no disponible' : 'No se ha podido cargar'}
        message={error.message}
      >
        {error.statusCode !== 404 ? (
          <Button label="Reintentar" onPress={() => void cafe.refetch()} />
        ) : null}
      </EmptyState>
    );
  }
  return <CafeDetailView cafe={cafe.data} />;
}

function CafeDetailView({ cafe }: { cafe: CafeDetail }) {
  const place = [cafe.neighborhood, cafe.city, cafe.country].filter(Boolean).join(' · ');

  const chooseMapsApp = () => {
    if (Platform.OS !== 'ios') return void openDirections(cafe, 'google');
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Cómo llegar',
        options: ['Apple Maps', 'Google Maps', 'Cancelar'],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) void openDirections(cafe, 'apple');
        if (index === 1) void openDirections(cafe, 'google');
      },
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: cafe.name }} />
      <ScrollView
        className="flex-1 bg-crema-50 dark:bg-night-950"
        contentContainerClassName="gap-7 p-5 pb-12"
      >
        {cafe.status !== 'VERIFIED' ? (
          <View className="rounded-2xl bg-crema-100 p-4 dark:bg-night-900">
            <Text className="text-base text-espresso-900 dark:text-crema-100">
              {cafe.status === 'PENDING'
                ? 'Pendiente de verificación: solo tú puedes verlo hasta que lo revise un curador.'
                : `Rechazado: ${cafe.rejectionReason ?? 'sin motivo'}`}
            </Text>
          </View>
        ) : null}

        <View className="gap-2">
          <Text
            accessibilityRole="header"
            className="text-3xl font-bold text-espresso-900 dark:text-crema-100"
          >
            {cafe.name}
          </Text>
          <Text className="text-base text-espresso-700 dark:text-crema-200">{place}</Text>
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 pt-1">
            <OpenBadge open={cafe.isOpenNow} />
            <RatingBadge rating={cafe.averageRating} reviews={cafe.totalReviews} />
            <Text className="text-sm font-semibold text-espresso-700 dark:text-crema-200">
              {cafe.priceRange}
            </Text>
          </View>
        </View>

        <View className="gap-3 rounded-3xl bg-white p-4 dark:bg-night-900">
          <View className="flex-row items-start gap-3">
            <Ionicons name="location-outline" size={20} color="#a4522b" />
            <Text className="flex-1 text-base text-espresso-900 dark:text-crema-100">
              {cafe.address}
            </Text>
          </View>
          <Button label="Cómo llegar" onPress={chooseMapsApp} />
        </View>

        {cafe.brewMethods.length ? (
          <Section title="Métodos de preparación">
            <View className="flex-row flex-wrap gap-2">
              {cafe.brewMethods.map((m) => (
                <Chip key={m} label={BREW_METHOD_LABELS[m]} />
              ))}
            </View>
          </Section>
        ) : null}

        {cafe.roasters.length ? (
          <Section title="Tostadores">
            <Text className="text-base text-espresso-900 dark:text-crema-100">
              {cafe.roasters.join(' · ')}
            </Text>
          </Section>
        ) : null}

        {cafe.equipment?.machine || cafe.equipment?.grinder ? (
          <Section title="Equipamiento">
            <View className="gap-1">
              {cafe.equipment.machine ? (
                <InfoRow label="Máquina" value={cafe.equipment.machine} />
              ) : null}
              {cafe.equipment.grinder ? (
                <InfoRow label="Molino" value={cafe.equipment.grinder} />
              ) : null}
            </View>
          </Section>
        ) : null}

        {cafe.amenities.length ? (
          <Section title="Servicios">
            <View className="flex-row flex-wrap gap-2">
              {cafe.amenities.map((a) => (
                <Chip key={a} label={AMENITY_LABELS[a]} />
              ))}
            </View>
          </Section>
        ) : null}

        <OpeningHoursTable cafe={cafe} />

        {cafe.website || cafe.instagram || cafe.phone ? (
          <Section title="Contacto">
            <View className="gap-1">
              {cafe.website ? (
                <LinkRow icon="globe-outline" label="Web" url={cafe.website} />
              ) : null}
              {cafe.instagram ? (
                <LinkRow
                  icon="logo-instagram"
                  label={`@${cafe.instagram.replace(/^@/, '')}`}
                  url={`https://instagram.com/${cafe.instagram.replace(/^@/, '')}`}
                />
              ) : null}
              {cafe.phone ? (
                <LinkRow icon="call-outline" label={cafe.phone} url={`tel:${cafe.phone}`} />
              ) : null}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-1">
      <Text className="text-base text-espresso-700 dark:text-crema-200">{label}</Text>
      <Text className="flex-1 text-right text-base font-medium text-espresso-900 dark:text-crema-100">
        {value}
      </Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  url,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  url: string;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(url)}
      className="min-h-11 flex-row items-center gap-3 active:opacity-70"
    >
      <Ionicons name={icon} size={20} color={palette.accent} />
      <Text className="text-base text-roast-600 dark:text-roast-300">{label}</Text>
    </Pressable>
  );
}

function OpeningHoursTable({ cafe }: { cafe: CafeDetail }) {
  if (!cafe.openingHours) return null;
  const today = localTime(new Date(), cafe.timezone).weekday;
  return (
    <Section title="Horario">
      <View className="rounded-2xl bg-white px-4 py-2 dark:bg-night-900">
        {WEEKDAYS.map((day) => {
          const hours = cafe.openingHours?.[day];
          const isToday = day === today;
          const weight = isToday ? 'font-bold' : '';
          return (
            <View key={day} className="flex-row justify-between py-1.5">
              <Text className={`text-base text-espresso-900 dark:text-crema-100 ${weight}`}>
                {WEEKDAY_LABELS[day]}
                {isToday ? ' (hoy)' : ''}
              </Text>
              <Text className={`text-base text-espresso-700 dark:text-crema-200 ${weight}`}>
                {hours ? `${hours.open} – ${hours.close}` : 'Cerrado'}
              </Text>
            </View>
          );
        })}
      </View>
    </Section>
  );
}
