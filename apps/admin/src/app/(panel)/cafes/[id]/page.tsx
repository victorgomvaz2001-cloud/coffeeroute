import {
  type AdminCafe,
  AMENITY_LABELS,
  BREW_METHOD_LABELS,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from '@coffeeroute/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { type ReactNode } from 'react';
import { Card, formatDate, Pill, StatusBadge } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { ReviewActions } from './review-actions';

async function loadCafe(id: string): Promise<AdminCafe> {
  try {
    return await api<AdminCafe>(`/admin/cafes/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.body.statusCode === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<'/cafes/[id]'>): Promise<Metadata> {
  const { id } = await params;
  return { title: (await loadCafe(id)).name };
}

export default async function CafeReviewPage({ params }: PageProps<'/cafes/[id]'>) {
  const { id } = await params;
  const cafe = await loadCafe(id);
  const mapUrl = `https://www.openstreetmap.org/?mlat=${cafe.latitude}&mlon=${cafe.longitude}#map=18/${cafe.latitude}/${cafe.longitude}`;
  const instagram = cafe.instagram?.replace(/^@/, '');

  return (
    <div className="space-y-6">
      <Link href="/cafes/pending" className="text-sm font-medium text-roast-600 dark:text-roast-300">
        ← Volver a pendientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{cafe.name}</h1>
            <StatusBadge status={cafe.status} />
          </div>
          <p className="text-espresso-700 dark:text-crema-200">
            {[cafe.neighborhood, cafe.city, cafe.country].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Ubicación</h2>
            <Detail label="Dirección">{cafe.address}</Detail>
            <Detail label="Coordenadas">
              <a href={mapUrl} target="_blank" rel="noreferrer" className="font-mono text-roast-600 hover:underline dark:text-roast-300">
                {cafe.latitude.toFixed(5)}, {cafe.longitude.toFixed(5)} ↗
              </a>
            </Detail>
            <Detail label="Zona horaria">{cafe.timezone}</Detail>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Café de especialidad</h2>
            <Detail label="Tostadores">{cafe.roasters.length ? cafe.roasters.join(', ') : <Missing />}</Detail>
            <Detail label="Métodos">
              {cafe.brewMethods.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {cafe.brewMethods.map((m) => <Pill key={m}>{BREW_METHOD_LABELS[m]}</Pill>)}
                </div>
              ) : (
                <Missing />
              )}
            </Detail>
            <Detail label="Máquina">{cafe.equipment?.machine ?? <Missing />}</Detail>
            <Detail label="Molino">{cafe.equipment?.grinder ?? <Missing />}</Detail>
            <Detail label="Servicios">
              {cafe.amenities.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {cafe.amenities.map((a) => <Pill key={a}>{AMENITY_LABELS[a]}</Pill>)}
                </div>
              ) : (
                <Missing />
              )}
            </Detail>
            <Detail label="Precio">{cafe.priceRange}</Detail>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Horario</h2>
            {cafe.openingHours ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                {WEEKDAYS.map((day) => {
                  const hours = cafe.openingHours?.[day];
                  return (
                    <div key={day} className="contents">
                      <dt className="text-espresso-700 dark:text-crema-200">{WEEKDAY_LABELS[day]}</dt>
                      <dd>{hours ? `${hours.open} – ${hours.close}` : 'Cerrado'}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <Missing>Sin horario. Complétalo al contactar con el café.</Missing>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Verificación</h2>
            <ReviewActions cafeId={cafe.id} status={cafe.status} />
            {cafe.status === 'REJECTED' && cafe.rejectionReason ? (
              <Detail label="Motivo de rechazo">{cafe.rejectionReason}</Detail>
            ) : null}
            {cafe.verifiedAt ? <Detail label="Verificado">{formatDate(cafe.verifiedAt)}</Detail> : null}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Contacto y fuentes</h2>
            <Detail label="Web">
              {cafe.website ? (
                <a href={cafe.website} target="_blank" rel="noreferrer" className="break-all text-roast-600 hover:underline dark:text-roast-300">
                  {cafe.website}
                </a>
              ) : (
                <Missing />
              )}
            </Detail>
            <Detail label="Instagram">
              {instagram ? (
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="text-roast-600 hover:underline dark:text-roast-300">
                  @{instagram}
                </a>
              ) : (
                <Missing />
              )}
            </Detail>
            <Detail label="Teléfono">{cafe.phone ? <a href={`tel:${cafe.phone}`}>{cafe.phone}</a> : <Missing />}</Detail>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">Propuesta</h2>
            <Detail label="Por">
              {cafe.proposedBy ? (
                <a href={`mailto:${cafe.proposedBy.email}`} className="text-roast-600 hover:underline dark:text-roast-300">
                  {cafe.proposedBy.name ?? cafe.proposedBy.email}
                </a>
              ) : (
                'Usuario eliminado o carga inicial'
              )}
            </Detail>
            <Detail label="Fecha">{formatDate(cafe.createdAt)}</Detail>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-espresso-500 dark:text-crema-200">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Missing({ children = 'No indicado' }: { children?: ReactNode }) {
  return <span className="italic text-espresso-500 dark:text-crema-200/70">{children}</span>;
}
