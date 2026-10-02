'use client';

import { type CafeStatus } from '@coffeeroute/shared';
import { useActionState, useState } from 'react';
import { type FormState, rejectCafeAction, verifyCafeAction } from '@/app/actions';
import { TextArea } from '@/components/field';
import { Button, Notice } from '@/components/ui';

export function ReviewActions({ cafeId, status }: { cafeId: string; status: CafeStatus }) {
  const [verifyState, verify, verifying] = useActionState<FormState>(() => verifyCafeAction(cafeId), {});
  const [rejectState, reject, rejecting] = useActionState<FormState, FormData>(rejectCafeAction.bind(null, cafeId), {});
  const [rejectOpen, setRejectOpen] = useState(false);
  const busy = verifying || rejecting;

  return (
    <div className="space-y-3">
      {verifyState.error ? <Notice tone="error">{verifyState.error}</Notice> : null}
      {rejectState.error ? <Notice tone="error">{rejectState.error}</Notice> : null}

      {status !== 'VERIFIED' ? (
        <form action={verify}>
          <Button type="submit" disabled={busy} className="w-full">
            {verifying ? 'Verificando…' : 'Verificar café'}
          </Button>
        </form>
      ) : null}

      {status !== 'REJECTED' &&
        (rejectOpen || rejectState.fieldErrors ? (
          <form action={reject} className="space-y-3">
            <TextArea
              label="Motivo del rechazo"
              name="reason"
              placeholder="Ej. no sirve café de especialidad, información insuficiente…"
              defaultValue={rejectState.values?.reason}
              error={rejectState.fieldErrors?.reason}
              autoFocus
              required
            />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" disabled={busy} className="flex-1">
                {rejecting ? 'Rechazando…' : 'Confirmar rechazo'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="danger" onClick={() => setRejectOpen(true)} disabled={busy} className="w-full">
            Rechazar…
          </Button>
        ))}
    </div>
  );
}
