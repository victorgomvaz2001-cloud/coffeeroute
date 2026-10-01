import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import Redis from 'ioredis';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';

type Status = 'up' | 'down';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [database, redis] = await Promise.all([
      this.probe(() => this.prisma.$queryRaw`SELECT 1`),
      this.probe(() => this.redis.ping()),
    ]);
    const body = { status: database === 'up' && redis === 'up' ? 'ok' : 'error', database, redis };
    if (body.status !== 'ok') {
      throw new ServiceUnavailableException({
        message: 'Servicio degradado',
        code: 'UNHEALTHY',
        ...body,
      });
    }
    return body;
  }

  private async probe(fn: () => Promise<unknown>): Promise<Status> {
    try {
      await fn();
      return 'up';
    } catch {
      return 'down';
    }
  }
}
