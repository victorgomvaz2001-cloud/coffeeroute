import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as reachable without authentication.
 * A valid bearer token is still decoded so handlers can personalise the response.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
