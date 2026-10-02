import { type AdminCafe, type Paginated, BREW_METHOD_LABELS } from '@coffeeroute/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, formatDate, Notice, Pill } from '@/components/ui';
import { api } from '@/lib/api';

export const metadata: Metadata = { title: 'Cafés pendientes' };

const PAGE_SIZE = 20;

export default async function PendingCafesPage({ searchParams }: PageProps<'/cafes/pending'>) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await api<Paginated<AdminCafe>>(`/admin/cafes/pending?page=${page}&limit=${PAGE_SIZE}`);
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cafés pendientes</h1>
          <p className="text-espresso-700 dark:text-crema-200">
            {result.total === 1 ? '1 café espera revisión' : `${result.total} cafés esperan revisión`}, del más antiguo al más reciente.
          </p>
        </div>
      </div>

      {params.verified ? <Notice tone="success">«{params.verified}» verificado: ya aparece en las búsquedas.</Notice> : null}
      {params.rejected ? <Notice tone="info">«{params.rejected}» rechazado. El motivo ha quedado registrado.</Notice> : null}

      {result.items.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-lg font-semibold">No hay cafés pendientes</p>
          <p className="text-espresso-700 dark:text-crema-200">Las nuevas propuestas aparecerán aquí.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-crema-200 text-xs uppercase tracking-wider text-espresso-500 dark:border-night-800 dark:text-crema-200">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Café</th>
                <th scope="col" className="px-5 py-3 font-semibold">Ubicación</th>
                <th scope="col" className="px-5 py-3 font-semibold">Métodos</th>
                <th scope="col" className="px-5 py-3 font-semibold">Propuesto por</th>
                <th scope="col" className="px-5 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crema-200 dark:divide-night-800">
              {result.items.map((cafe) => (
                <tr key={cafe.id} className="hover:bg-crema-50 dark:hover:bg-night-800/50">
                  <td className="px-5 py-4">
                    <Link href={`/cafes/${cafe.id}`} className="font-semibold text-roast-600 hover:underline dark:text-roast-300">
                      {cafe.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-espresso-700 dark:text-crema-200">
                    {[cafe.neighborhood, cafe.city].filter(Boolean).join(', ')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {cafe.brewMethods.length ? (
                        cafe.brewMethods.map((m) => <Pill key={m}>{BREW_METHOD_LABELS[m]}</Pill>)
                      ) : (
                        <span className="text-espresso-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-espresso-700 dark:text-crema-200">
                    {cafe.proposedBy ? (cafe.proposedBy.name ?? cafe.proposedBy.email) : 'Usuario eliminado'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-espresso-700 dark:text-crema-200">{formatDate(cafe.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {pages > 1 ? (
        <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={`?page=${page - 1}`} className="font-medium text-roast-600 dark:text-roast-300">← Anterior</Link> : <span />}
          <span className="text-espresso-700 dark:text-crema-200">Página {page} de {pages}</span>
          {page < pages ? <Link href={`?page=${page + 1}`} className="font-medium text-roast-600 dark:text-roast-300">Siguiente →</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
