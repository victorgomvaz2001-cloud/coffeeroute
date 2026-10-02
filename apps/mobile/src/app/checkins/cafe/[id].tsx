import { useLocalSearchParams } from 'expo-router';
import { CheckInFeed } from '@/components/check-in-feed';
import { useCafeCheckInFeed } from '@/lib/api/checkins';

export default function CafeVisitsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const feed = useCafeCheckInFeed(id);
  return (
    <CheckInFeed
      feed={feed}
      emptyTitle="Todavía no hay visitas"
      title={(checkIn) => checkIn.author.name ?? 'Cafetero anónimo'}
    />
  );
}
