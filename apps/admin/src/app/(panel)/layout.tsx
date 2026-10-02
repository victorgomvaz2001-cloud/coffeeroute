import Link from 'next/link';
import { logoutAction } from '@/app/actions';
import { Button } from '@/components/ui';

export default function PanelLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-crema-200 bg-white/80 backdrop-blur dark:border-night-800 dark:bg-night-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link href="/cafes/pending" className="font-bold">
            <span className="text-roast-600 dark:text-roast-300">Coffee</span>Route
            <span className="ml-2 text-sm font-medium text-espresso-500 dark:text-crema-200">Curación</span>
          </Link>
          <nav aria-label="Principal" className="flex-1">
            <Link
              href="/cafes/pending"
              className="rounded-lg px-3 py-2 text-sm font-medium text-espresso-700 hover:bg-crema-100 dark:text-crema-200 dark:hover:bg-night-800">
              Pendientes
            </Link>
          </nav>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
