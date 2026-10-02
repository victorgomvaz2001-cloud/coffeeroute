import { type InputHTMLAttributes, type TextareaHTMLAttributes, useId } from 'react';

const control =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-espresso-900 placeholder:text-espresso-500 dark:bg-night-900 dark:text-crema-100';
const border = (error?: string) =>
  error ? 'border-cherry-600 dark:border-cherry-300' : 'border-crema-200 dark:border-night-800';

interface Shared {
  label: string;
  error?: string;
}

export function Field({ label, error, ...props }: Shared & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-espresso-700 dark:text-crema-200">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${control} ${border(error)}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-cherry-600 dark:text-cherry-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({ label, error, ...props }: Shared & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-espresso-700 dark:text-crema-200">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${control} ${border(error)} min-h-24`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-cherry-600 dark:text-cherry-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
