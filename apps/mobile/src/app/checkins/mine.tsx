import { router } from 'expo-router';
import { CheckInFeed } from '@/components/check-in-feed';
import { useMyCheckInFeed } from '@/lib/api/checkins';

export default function MyVisitsScreen() {
  const feed = useMyCheckInFeed();
  return (
    <CheckInFeed
      feed={feed}
      emptyTitle="Aún no has hecho check-in"
      title={(checkIn) => checkIn.cafe.name}
      subtitle={(checkIn) => checkIn.cafe.city}
      onPress={(checkIn) =>
        router.push({ pathname: '/checkin', params: { checkInId: checkIn.id } })
      }
    />
  );
}
