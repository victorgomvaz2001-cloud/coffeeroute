'use server';

import {
  type AdminCafe,
  type AuthResponse,
  loginSchema,
  rejectCafeSchema,
} from '@coffeeroute/shared';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { ACCESS_COOKIE, REFRESH_COOKIE, writeSessionCookies } from '@/lib/session';

z.config(z.locales.es());

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values echoed back, since React resets uncontrolled forms after an action. */
  values?: Record<string, string>;
}

const fieldErrorsOf = (error: z.ZodError) =>
  Object.fromEntries(error.issues.map((issue) => [issue.path.join('.'), issue.message]));

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get('email') ?? '') };
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  let auth: AuthResponse;
  try {
    auth = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: parsed.data,
      anonymous: true,
    });
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : 'No se pudo iniciar sesión.',
      values,
    };
  }

  if (auth.user.role !== 'ADMIN') {
    // Don't leave a usable session behind for non-curators.
    await api('/auth/logout', {
      method: 'POST',
      body: { refreshToken: auth.tokens.refreshToken },
      anonymous: true,
    }).catch(() => undefined);
    return { error: 'Esta cuenta no tiene permisos de curador.', values };
  }

  writeSessionCookies(await cookies(), auth.tokens);
  redirect('/cafes/pending');
}

export async function logoutAction() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await api('/auth/logout', { method: 'POST', body: { refreshToken }, anonymous: true }).catch(
      () => undefined,
    );
  }
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  redirect('/login');
}

export async function verifyCafeAction(id: string): Promise<FormState> {
  let cafe: AdminCafe;
  try {
    cafe = await api<AdminCafe>(`/admin/cafes/${id}/verify`, { method: 'PATCH' });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'No se pudo verificar el café.' };
  }
  revalidatePath('/cafes/pending');
  redirect(`/cafes/pending?verified=${encodeURIComponent(cafe.name)}`);
}

export async function rejectCafeAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = rejectCafeSchema.safeParse(Object.fromEntries(formData));
  const values = { reason: String(formData.get('reason') ?? '') };
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  let cafe: AdminCafe;
  try {
    cafe = await api<AdminCafe>(`/admin/cafes/${id}/reject`, {
      method: 'PATCH',
      body: parsed.data,
    });
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : 'No se pudo rechazar el café.',
      values,
    };
  }
  revalidatePath('/cafes/pending');
  redirect(`/cafes/pending?rejected=${encodeURIComponent(cafe.name)}`);
}
