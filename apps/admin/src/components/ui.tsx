import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const variants: Record<Variant, string> = {
  primary:
    'bg-roast-500 text-white hover:bg-roast-600 dark:bg-roast-300 dark:text-espresso-900 dark:hover:bg-roast-300/90',
  secondary:
    'border border-crema-200 bg-white text-espresso-900 hover:bg-crema-100 dark:border-night-800 dark:bg-night-900 dark:text-crema-100 dark:hover:bg-night-800',
  danger:
    'border border-cherry-600 text-cherry-600 hover:bg-cherry-600/10 dark:border-cherry-300 dark:text-cherry-300',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-crema-200 bg-white p-5 dark:border-night-800 dark:bg-night-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: 'success' | 'error' | 'info';
  children: ReactNode;
}) {
  const tones = {
    success: 'border-leaf-600/30 bg-leaf-600/10 text-leaf-600 dark:text-leaf-300',
    error: 'border-cherry-600/30 bg-cherry-600/10 text-cherry-600 dark:text-cherry-300',
    info: 'border-crema-200 bg-crema-100 text-espresso-700 dark:border-night-800 dark:bg-night-900 dark:text-crema-200',
  };
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-crema-100 px-2.5 py-0.5 text-xs font-medium text-espresso-700 dark:bg-night-800 dark:text-crema-200">
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: 'PENDING' | 'VERIFIED' | 'REJECTED' }) {
  const styles = {
    PENDING: 'bg-roast-500/10 text-roast-600 dark:text-roast-300',
    VERIFIED: 'bg-leaf-600/10 text-leaf-600 dark:text-leaf-300',
    REJECTED: 'bg-cherry-600/10 text-cherry-600 dark:text-cherry-300',
  };
  const labels = { PENDING: 'Pendiente', VERIFIED: 'Verificado', REJECTED: 'Rechazado' };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid',
  }).format(new Date(iso));
