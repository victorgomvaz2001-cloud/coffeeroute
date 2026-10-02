import { type ApiErrorBody } from '@coffeeroute/shared';
import { isAxiosError } from 'axios';

/** Turns any thrown value into a message that is safe and useful to show (RNF14). */
export function toApiError(error: unknown): ApiErrorBody {
  if (isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiErrorBody> | undefined;
    if (error.response && body?.message) {
      return {
        statusCode: error.response.status,
        message: body.message,
        code: body.code ?? 'ERROR',
        fieldErrors: body.fieldErrors,
      };
    }
    if (!error.response) {
      return {
        statusCode: 0,
        message: 'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
        code: 'NETWORK_ERROR',
      };
    }
  }
  return {
    statusCode: 500,
    message: 'Algo ha salido mal. Inténtalo de nuevo.',
    code: 'UNKNOWN_ERROR',
  };
}
