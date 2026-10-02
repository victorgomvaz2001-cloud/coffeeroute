import {
  type AuthResponse,
  type LoginInput,
  type MeResponse,
  type SignupInput,
} from '@coffeeroute/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../store/session';
import { api } from './client';

export const meQueryKey = ['me'] as const;

export function useLogin() {
  const setSession = useSession((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) =>
      (await api.post<AuthResponse>('/auth/login', input)).data,
    onSuccess: (data) => {
      setSession(data);
      queryClient.invalidateQueries({ queryKey: ['cafes', 'detail'] });
      queryClient.removeQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useSignup() {
  const setSession = useSession((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SignupInput) =>
      (await api.post<AuthResponse>('/auth/signup', input)).data,
    onSuccess: (data) => {
      setSession(data);
      queryClient.invalidateQueries({ queryKey: ['cafes', 'detail'] });
      queryClient.removeQueries({ queryKey: ['checkins'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useSession.getState().tokens?.refreshToken;
      // Best effort: the local session is cleared even if the server can't be reached.
      if (refreshToken) await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    },
    onSettled: async () => {
      await useSession.getState().clear();
      queryClient.clear();
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete('/users/me');
    },
    onSuccess: async () => {
      await useSession.getState().clear();
      queryClient.clear();
    },
  });
}

export function useMe() {
  const status = useSession((s) => s.status);
  const setUser = useSession((s) => s.setUser);
  return useQuery({
    queryKey: meQueryKey,
    enabled: status === 'authenticated',
    queryFn: async () => {
      const { data } = await api.get<MeResponse>('/users/me');
      const { stats: _stats, ...user } = data;
      setUser(user);
      return data;
    },
  });
}
