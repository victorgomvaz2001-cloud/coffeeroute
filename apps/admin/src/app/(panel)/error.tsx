'use client';

import { Button, Card } from '@/components/ui';

export default function PanelError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="text-xl font-bold">No se ha podido cargar esta página</h1>
      <p className="text-espresso-700 dark:text-crema-200">{error.message}</p>
      <Button onClick={reset}>Reintentar</Button>
    </Card>
  );
}
