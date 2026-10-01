import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/** Rate-limits per authenticated user (RNF23), falling back to client IP. */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Request): Promise<string> {
    return Promise.resolve(req.user ? `user:${req.user.id}` : `ip:${req.ip}`);
  }
}
