'use client';

import { useActionState } from 'react';
import { type FormState, loginAction } from '@/app/actions';
import { Button, Notice } from '@/components/ui';
import { Field } from '@/components/field';

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field label="Email" name="email" type="email" autoComplete="username" defaultValue={state.values?.email} error={state.fieldErrors?.email} required />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
