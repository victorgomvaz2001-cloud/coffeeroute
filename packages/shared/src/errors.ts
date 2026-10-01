/** Shape of every error response returned by the API. */
export interface ApiErrorBody {
  statusCode: number;
  /** Human-readable message, safe to show to end users. */
  message: string;
  /** Machine-readable code, e.g. `VALIDATION_ERROR`, `EMAIL_TAKEN`. */
  code: string;
  /** Field-level validation messages keyed by dotted path. */
  fieldErrors?: Record<string, string>;
}
