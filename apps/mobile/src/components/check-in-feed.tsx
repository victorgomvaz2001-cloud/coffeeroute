import { type Paginated, type PublicCheckIn } from '@coffeeroute/shared';
import { type InfiniteData, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { ActivityIndicator, FlatList } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { toApiError } from '@/lib/api/errors';
import { Button } from './button';
import { CheckInCard } from './check-in-card';
import { EmptyState, LoadingState } from './states';

interface CheckInFeedProps<T extends PublicCheckIn> {
  feed: UseInfiniteQueryResult<InfiniteData<Paginated<T>, number>>;
  emptyTitle: string;
  title: (checkIn: T) => string;
  subtitle?: (checkIn: T) => string;
  onPress?: (checkIn: T) => void;
}

/** Infinite list of check-ins, loading the next page near the end. */
export function CheckInFeed<T extends PublicCheckIn>({
  feed,
  emptyTitle,
  title,
  subtitle,
  onPress,
}: CheckInFeedProps<T>) {
  const palette = usePalette();
  if (feed.isPending) return <LoadingState />;
  if (feed.isError) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="No se ha podido cargar"
        message={toApiError(feed.error).message}
      >
        <Button label="Reintentar" onPress={() => void feed.refetch()} />
      </EmptyState>
    );
  }
  const items = feed.data.pages.flatMap((page) => page.items);
  return (
    <FlatList
      className="flex-1 bg-crema-50 dark:bg-night-950"
      contentContainerClassName="gap-3 p-5 pb-12"
      data={items}
      keyExtractor={(checkIn) => checkIn.id}
      renderItem={({ item }) => (
        <CheckInCard
          checkIn={item}
          title={title(item)}
          subtitle={subtitle?.(item)}
          onPress={onPress ? () => onPress(item) : undefined}
        />
      )}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
      }}
      ListEmptyComponent={<EmptyState icon="cafe-outline" title={emptyTitle} />}
      ListFooterComponent={
        feed.isFetchingNextPage ? <ActivityIndicator color={palette.accent} /> : null
      }
    />
  );
}
