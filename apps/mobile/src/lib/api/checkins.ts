import {
  type CheckIn,
  type CreateCheckInInput,
  type Paginated,
  type PublicCheckIn,
  type UpdateCheckInInput,
} from '@coffeeroute/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../store/session';
import { meQueryKey } from './auth';
import { api } from './client';

const FEED_PAGE_SIZE = 20;

const nextPage = (last: Paginated<unknown>) =>
  last.page * last.limit < last.total ? last.page + 1 : undefined;

async function fetchPage<T>(path: string, page: number, limit: number, signal?: AbortSignal) {
  return (await api.get<Paginated<T>>(path, { params: { page, limit }, signal })).data;
}

/** The latest `limit` visits of a café, for its page. */
export function useCafeCheckIns(cafeId: string, limit: number) {
  return useQuery({
    queryKey: ['checkins', 'cafe', cafeId, limit],
    queryFn: ({ signal }) =>
      fetchPage<PublicCheckIn>(`/cafes/${cafeId}/checkins`, 1, limit, signal),
  });
}

export function useCafeCheckInFeed(cafeId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['checkins', 'cafe', cafeId, 'feed'],
    enabled: !!cafeId,
    initialPageParam: 1,
    getNextPageParam: nextPage,
    queryFn: ({ pageParam, signal }) =>
      fetchPage<PublicCheckIn>(`/cafes/${cafeId}/checkins`, pageParam, FEED_PAGE_SIZE, signal),
  });
}

export function useMyCheckIns(limit: number) {
  const authenticated = useSession((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: ['checkins', 'mine', limit],
    enabled: authenticated,
    queryFn: ({ signal }) => fetchPage<CheckIn>('/checkins/me', 1, limit, signal),
  });
}

export function useMyCheckInFeed() {
  const authenticated = useSession((s) => s.status === 'authenticated');
  return useInfiniteQuery({
    queryKey: ['checkins', 'mine', 'feed'],
    enabled: authenticated,
    initialPageParam: 1,
    getNextPageParam: nextPage,
    queryFn: ({ pageParam, signal }) =>
      fetchPage<CheckIn>('/checkins/me', pageParam, FEED_PAGE_SIZE, signal),
  });
}

export function useCheckIn(id: string | undefined) {
  return useQuery({
    queryKey: ['checkins', 'detail', id],
    enabled: !!id,
    queryFn: async ({ signal }) => (await api.get<CheckIn>(`/checkins/${id}`, { signal })).data,
  });
}

/**
 * A check-in moves the café's averages and visit list, the search order and the profile
 * stats. Single check-ins are left alone: the one being edited or deleted is still on screen.
 */
function useInvalidateAfterCheckIn() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['checkins'],
        predicate: (query) => query.queryKey[1] !== 'detail',
      }),
      queryClient.invalidateQueries({ queryKey: ['cafes'] }),
      queryClient.invalidateQueries({ queryKey: meQueryKey }),
    ]);
}

export function useCreateCheckIn() {
  const invalidate = useInvalidateAfterCheckIn();
  return useMutation({
    mutationFn: async (input: CreateCheckInInput) =>
      (await api.post<CheckIn>('/checkins', input)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateCheckIn(id: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAfterCheckIn();
  return useMutation({
    mutationFn: async (input: UpdateCheckInInput) =>
      (await api.patch<CheckIn>(`/checkins/${id}`, input)).data,
    onSuccess: (checkIn) => {
      queryClient.setQueryData(['checkins', 'detail', id], checkIn);
      return invalidate();
    },
  });
}

export function useDeleteCheckIn(id: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAfterCheckIn();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/checkins/${id}`);
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['checkins', 'detail', id] });
      return invalidate();
    },
  });
}
