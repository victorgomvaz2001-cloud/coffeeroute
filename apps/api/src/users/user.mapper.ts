import { type PublicUserProfile, type UserProfile } from '@coffeeroute/shared';
import { User } from '../generated/prisma/client';

export const toUserProfile = (user: User): UserProfile => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});

export const toPublicUserProfile = (user: User): PublicUserProfile => ({
  id: user.id,
  name: user.name,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  createdAt: user.createdAt.toISOString(),
});
