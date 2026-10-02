import { type AuthResponse } from '@coffeeroute/shared';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useSession } from '../store/session';
import { API_URL } from './config';

// eslint-disable-next-line import/no-named-as-default-member -- axios.create is the documented API
export const api = axios.create({ baseURL: API_URL, timeout: 15_000 });

// Arrays travel as `brewMethods=a,b`, which the API's schemas accept.
api.defaults.paramsSerializer = (params: Record<string, unknown>) =>
  Object.entries(params)
    .filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(Array.isArray(value) ? value.join(',') : String(value))}`,
    )
    .join('&');

api.interceptors.request.use((config) => {
  const token = useSession.getState().tokens?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s wait for the same refresh call. */
function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const { tokens, setSession, clear } = useSession.getState();
    if (!tokens) return null;
    try {
      const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, {
        refreshToken: tokens.refreshToken,
      });
      await setSession(data);
      return data.tokens.accessToken;
    } catch {
      await clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError<{ code?: string }>) => {
  const original = error.config as RetriableConfig | undefined;
  const expired = error.response?.status === 401 && error.response.data?.code === 'TOKEN_INVALID';
  if (!original || original._retried || !expired) throw error;

  original._retried = true;
  const token = await refreshAccessToken();
  if (!token) throw error;
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});
