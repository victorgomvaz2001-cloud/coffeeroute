import { type UserRole } from '@coffeeroute/shared';

/** The authenticated principal attached to `request.user` by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
}
