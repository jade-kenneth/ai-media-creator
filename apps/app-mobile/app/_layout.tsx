import '../global.css';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { NetworkErrorBanner } from '@/components/ui/network-error-banner';
import { ToastHost } from '@/components/ui/toast';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { AppProviders } from '@/providers/app-providers';
import { getSession } from '@/providers/AuthProvider';
import { useTenant } from '@/providers/TenantProvider';
import { getCurrentUser } from '@/react-query/auth/auth-operations';

export const unstable_settings = {
  anchor: '(main)',
};

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore when native splash is already handled or unavailable for this view.
});

function RootNavigator() {
  const [fontsLoaded] = useFonts(MaterialIcons.font);
  const { tenant, isLoading: isTenantLoading } = useTenant();
  const [authState, setAuthState] = useState<
    'loading' | 'authenticated' | 'unauthenticated'
  >('loading');
  const hasNavigated = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const session = await getSession();

        if (!isMounted) return;

        if (session.status !== 'authenticated') {
          setAuthState('unauthenticated');
          return;
        }

        const response = await getCurrentUser();

        if (!isMounted) return;

        setAuthState(response.ok ? 'authenticated' : 'unauthenticated');
      } catch {
        if (!isMounted) return;

        setAuthState('unauthenticated');
      }
    }

    void bootstrap();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void bootstrap();
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const isReady = fontsLoaded && authState !== 'loading' && !isTenantLoading;

  useEffect(() => {
    if (!isReady) return;
    void SplashScreen.hideAsync().catch(() => {
      // Ignore "no native splash screen registered for given view controller".
    });
  }, [isReady]);

  useEffect(() => {
    if (
      !isReady ||
      authState !== 'unauthenticated' ||
      hasNavigated.current
    )
      return;
    hasNavigated.current = true;
    router.replace('/(auth)/onboarding');
  }, [isReady, authState, tenant]);

  if (!isReady) {
    return (
      <LoadingScreen
        organizationName={tenant?.organizationName}
        logoUrl={tenant?.organizationLogoUrl}
        message="Preparing your member dashboard..."
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {authState === 'authenticated' ? (
        <Stack.Screen name="(main)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

function RootShell() {
  const { isDark } = useThemeColors();

  return (
    <ErrorBoundary>
      <RootNavigator />
      <NetworkErrorBanner />
      <ToastHost />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootShell />
    </AppProviders>
  );
}
