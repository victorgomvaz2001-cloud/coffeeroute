import { z } from 'zod';
import { USER_ROLES } from './constants';

const email = z.email('Introduce un email válido').trim().toLowerCase();
// bcrypt only uses the first 72 bytes of a password.
const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres');

export const signupSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1).max(80).optional(),
  acceptTerms: z.literal(true, { error: 'Debes aceptar los términos y la política de privacidad' }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Introduce tu contraseña'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const userProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  role: z.enum(USER_ROLES),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const publicUserProfileSchema = userProfileSchema.omit({ email: true, role: true });
export type PublicUserProfile = z.infer<typeof publicUserProfileSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(280).optional(),
  avatarUrl: z.url().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}
