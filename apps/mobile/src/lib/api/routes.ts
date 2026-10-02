import {
  type CreateRouteInput,
  type PlanRouteInput,
  type RouteDetail,
  type RoutePlan,
  type RouteSummary,
  type UpdateRouteInput,
} from '@coffeeroute/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../store/session';
import { meQueryKey } from './auth';
import { api } from './client';

const planRoute = async (input: PlanRouteInput) =>
  (await api.post<RoutePlan>('/routes/plan', input)).data;

/** Legs and totals for the cafés in their current order (needs a session: it may call Mapbox). */
export function useRoutePlan(cafeIds: string[], visitMinutes: number) {
  const authenticated = useSession((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: ['routes', 'plan', cafeIds, visitMinutes],
    enabled: authenticated && cafeIds.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    queryFn: () => planRoute({ cafeIds, visitMinutes }),
  });
}

export function useOptimizeRoute() {
  return useMutation({
    mutationFn: (input: Omit<PlanRouteInput, 'optimize'>) =>
      planRoute({ ...input, optimize: true }),
  });
}

export function useMyRoutes() {
  const authenticated = useSession((s) => s.status === 'authenticated');
  return useQuery({
    queryKey: ['routes', 'mine'],
    enabled: authenticated,
    queryFn: async () => (await api.get<RouteSummary[]>('/routes/mine')).data,
  });
}

export function useRoute(id: string | undefined) {
  return useQuery({
    queryKey: ['routes', 'detail', id],
    enabled: !!id,
    queryFn: async () => (await api.get<RouteDetail>(`/routes/${id}`)).data,
  });
}

function useInvalidateRoutes() {
  const queryClient = useQueryClient();
  return (route?: RouteDetail) => {
    void queryClient.invalidateQueries({ queryKey: ['routes', 'mine'] });
    void queryClient.invalidateQueries({ queryKey: meQueryKey });
    if (route) queryClient.setQueryData(['routes', 'detail', route.id], route);
  };
}

export function useSaveRoute() {
  const invalidate = useInvalidateRoutes();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string | null;
      input: CreateRouteInput & UpdateRouteInput;
    }) =>
      id
        ? (await api.patch<RouteDetail>(`/routes/${id}`, input)).data
        : (await api.post<RouteDetail>('/routes', input)).data,
    onSuccess: (route) => invalidate(route),
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateRoutes();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/routes/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: ['routes', 'detail', id] });
      invalidate();
    },
  });
}
