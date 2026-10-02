import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginSchema } from '@coffeeroute/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';
import { useLogin } from '@/lib/api/auth';
import { applyApiErrors } from '@/lib/forms';

export default function LoginScreen() {
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      router.dismissAll();
    } catch (error) {
      setFormError(applyApiErrors(error, setError));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-crema-50 dark:bg-night-950">
      <ScrollView contentContainerClassName="gap-5 p-5" keyboardShouldPersistTaps="handled">
        <Text className="text-base text-espresso-700 dark:text-crema-200">
          Inicia sesión para guardar rutas, hacer check-in y proponer cafés.
        </Text>
        <FormError message={formError} />
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
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={onSubmit}
            />
          )}
        />
        <Button label="Iniciar sesión" loading={formState.isSubmitting} onPress={onSubmit} />
        <Link href="/signup" replace asChild>
          <Button label="¿No tienes cuenta? Crea una" variant="ghost" />
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
