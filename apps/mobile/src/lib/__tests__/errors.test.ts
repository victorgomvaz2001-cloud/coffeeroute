import { AxiosError, AxiosHeaders } from 'axios';
import { toApiError } from '../api/errors';

const axiosError = (status?: number, data?: unknown) => {
  const config = { headers: new AxiosHeaders() };
  const response = status
    ? { status, data, statusText: '', headers: {}, config }
    : undefined;
  return new AxiosError('boom', 'ERR', config, undefined, response);
};

describe('toApiError', () => {
  it('keeps the API error body', () => {
    const body = { statusCode: 409, message: 'Ya existe', code: 'EMAIL_TAKEN', fieldErrors: { email: 'x' } };
    expect(toApiError(axiosError(409, body))).toEqual(body);
  });

  it('explains network failures in plain language', () => {
    expect(toApiError(axiosError())).toMatchObject({ statusCode: 0, code: 'NETWORK_ERROR' });
  });

  it('never leaks unknown errors', () => {
    expect(toApiError(new Error('stack trace…'))).toMatchObject({ code: 'UNKNOWN_ERROR' });
    expect(toApiError(axiosError(502, '<html>Bad gateway</html>')).code).toBe('UNKNOWN_ERROR');
  });
});
