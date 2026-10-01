import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../../types/auth-user';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(request);

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token);
        request.user = { id: payload.sub, role: payload.role };
      } catch {
        if (!isPublic) {
          throw new UnauthorizedException({
            message: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
            code: 'TOKEN_INVALID',
          });
        }
      }
    }

    if (!isPublic && !request.user) {
      throw new UnauthorizedException({
        message: 'Necesitas iniciar sesión para hacer esto.',
        code: 'UNAUTHENTICATED',
      });
    }
    return true;
  }

  private extractBearer(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
