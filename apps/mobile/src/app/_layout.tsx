import '@/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { z } from 'zod';
import { usePalette } from '@/hooks/use-palette';
import { toApiError } from '@/lib/api/errors';
import { useSession } from '@/lib/store/session';

z.config(z.locales.es());
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network hiccups (RNF27) but not answers like 404/401.
      retry: (failureCount, error) => {
        const { statusCode } = toApiError(error);
        return failureCount < 3 && (statusCode === 0 || statusCode >= 500);
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

export default function RootLayout() {
  const scheme = useColorScheme();
  const palette = usePalette();
  const status = useSession((s) => s.status);
  const hydrate = useSession((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  const theme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.background,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
      },
    };
  }, [scheme, palette]);

  if (status === 'loading') return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={theme}>
        <Stack
          screenOptions={{
            headerTintColor: palette.accent,
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="cafe/[id]" options={{ title: '' }} />
          <Stack.Screen
            name="filters"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.75, 1],
              sheetGrabberVisible: true,
              headerShown: false,
            }}
          />
          <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Iniciar sesión' }} />
          <Stack.Screen name="signup" options={{ presentation: 'modal', title: 'Crear cuenta' }} />
          <Stack.Screen
            name="propose"
            options={{ presentation: 'modal', title: 'Proponer un café' }}
          />
          <Stack.Screen name="checkin" options={{ presentation: 'modal', title: 'Check-in' }} />
          <Stack.Screen name="checkins/cafe/[id]" options={{ title: 'Visitas' }} />
          <Stack.Screen name="checkins/mine" options={{ title: 'Mis visitas' }} />
          <Stack.Screen name="legal" options={{ title: 'Privacidad y términos' }} />
          <Stack.Screen name="route-editor" options={{ presentation: 'modal' }} />
          <Stack.Screen name="routes/[id]" options={{ title: '' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
