import {
  type CafeDetail,
  type CafeSearchParams,
  type CafeSummary,
  type Paginated,
  type ProposeCafeInput,
} from '@coffeeroute/shared';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { api } from './client';

export function useCafeSearch(params: CafeSearchParams | null) {
  return useQuery({
    queryKey: ['cafes', 'search', params],
    enabled: params !== null,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      (await api.get<Paginated<CafeSummary>>('/cafes', { params, signal })).data,
  });
}

export function useCafe(id: string | undefined) {
  return useQuery({
    queryKey: ['cafes', 'detail', id],
    enabled: !!id,
    queryFn: async ({ signal }) => (await api.get<CafeDetail>(`/cafes/${id}`, { signal })).data,
  });
}

export function useProposeCafe() {
  return useMutation({
    mutationFn: async (input: ProposeCafeInput) => (await api.post<CafeDetail>('/cafes', input)).data,
  });
}
