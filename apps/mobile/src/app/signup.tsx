import { zodResolver } from '@hookform/resolvers/zod';
import { type SignupInput, signupSchema } from '@coffeeroute/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { type z } from 'zod';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';
import { useSignup } from '@/lib/api/auth';
import { applyApiErrors } from '@/lib/forms';

type SignupForm = z.input<typeof signupSchema>;

export default function SignupScreen() {
  const signup = useSignup();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<SignupForm, unknown, SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', acceptTerms: false as unknown as true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signup.mutateAsync({ ...values, name: values.name || undefined });
      router.dismissAll();
    } catch (error) {
      setFormError(applyApiErrors(error, setError));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-crema-50 dark:bg-night-950">
      <ScrollView contentContainerClassName="gap-5 p-5" keyboardShouldPersistTaps="handled">
        <FormError message={formError} />
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label="Nombre (opcional)"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoComplete="name"
              textContentType="name"
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Contraseña"
              hint="Mínimo 8 caracteres"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
          )}
        />
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <>
              <Checkbox
                checked={field.value === true}
                onChange={field.onChange}
                accessibilityLabel="Acepto los términos de uso y la política de privacidad">
                <Text className="text-base text-espresso-900 dark:text-crema-100">
                  Acepto los{' '}
                  <Link href="/legal" className="font-semibold text-roast-600 underline dark:text-roast-300">
                    términos de uso y la política de privacidad
                  </Link>
                </Text>
              </Checkbox>
              {fieldState.error ? (
                <Text accessibilityRole="alert" className="text-sm text-cherry-600 dark:text-cherry-300">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </>
          )}
        />
        <Button label="Crear cuenta" loading={formState.isSubmitting} onPress={onSubmit} />
        <Link href="/login" replace asChild>
          <Button label="Ya tengo cuenta" variant="ghost" />
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
