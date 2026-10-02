import type { Metadata } from 'next';
import { Notice } from '@/components/ui';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Acceso curadores' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-widest text-roast-600 dark:text-roast-300">
            CoffeeRoute
          </p>
          <h1 className="text-3xl font-bold">Panel de curación</h1>
          <p className="text-espresso-700 dark:text-crema-200">Acceso solo para curadores.</p>
        </div>
        {params.expired ? (
          <Notice tone="info">Tu sesión ha caducado. Vuelve a iniciar sesión.</Notice>
        ) : null}
        {params.forbidden ? (
          <Notice tone="error">Esta cuenta no tiene permisos de curador.</Notice>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
