import { type FieldValues, type Path, type UseFormSetError } from 'react-hook-form';
import { toApiError } from './api/errors';

/** Maps API field errors onto the form; returns the general message for anything else. */
export function applyApiErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): string {
  const apiError = toApiError(error);
  for (const [field, message] of Object.entries(apiError.fieldErrors ?? {})) {
    setError(field as Path<T>, { message });
  }
  return apiError.message;
}
