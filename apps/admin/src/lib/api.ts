import 'server-only';

import { type ApiErrorBody } from '@coffeeroute/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE, API_URL } from './session';

export class ApiError extends Error {
  constructor(readonly body: ApiErrorBody) {
    super(body.message);
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the session cookie (login/refresh/logout). */
  anonymous?: boolean;
}

/** Server-side fetch to the CoffeeRoute API with the curator's access token. */
export async function api<T>(
  path: string,
  { method = 'GET', body, anonymous }: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!anonymous) {
    const token = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError({
      statusCode: 503,
      code: 'API_UNREACHABLE',
      message: 'No se puede conectar con la API de CoffeeRoute. Comprueba que está en marcha.',
    });
  }

  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    // The proxy refreshes sessions before rendering, so a 401 here means it was revoked.
    if (response.status === 401 && !anonymous) redirect('/login?expired=1');
    const error = data as Partial<ApiErrorBody> | null;
    throw new ApiError({
      statusCode: response.status,
      code: error?.code ?? 'ERROR',
      message: error?.message ?? 'La API devolvió un error inesperado.',
      fieldErrors: error?.fieldErrors,
    });
  }
  return data as T;
}
