import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { type ApiErrorBody } from '@coffeeroute/shared';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client';

const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  503: 'UNAVAILABLE',
};

const GENERIC_ERROR = 'Ha ocurrido un error inesperado. Inténtalo de nuevo en unos minutos.';

/** Normalises every error into ApiErrorBody so clients can show actionable messages (RNF14). */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof ZodValidationException) {
      const error = exception.getZodError();
      const fieldErrors: Record<string, string> = {};
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          const key = issue.path.join('.') || '_';
          fieldErrors[key] ??= issue.message;
        }
      }
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Revisa los datos introducidos.',
        code: 'VALIDATION_ERROR',
        fieldErrors,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Demasiadas peticiones. Espera un momento y vuelve a intentarlo.',
        code: 'RATE_LIMITED',
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();
      const payload = typeof res === 'string' ? { message: res } : (res as Record<string, unknown>);
      const message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
      return {
        statusCode,
        message: typeof message === 'string' ? message : exception.message,
        code:
          typeof payload.code === 'string' ? payload.code : (DEFAULT_CODES[statusCode] ?? 'ERROR'),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { statusCode: 409, message: 'Ese recurso ya existe.', code: 'CONFLICT' };
      }
      if (exception.code === 'P2025') {
        return { statusCode: 404, message: 'El recurso no existe.', code: 'NOT_FOUND' };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: GENERIC_ERROR,
      code: 'INTERNAL_ERROR',
    };
  }
}
