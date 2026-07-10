import '../global.css';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { NetworkErrorBanner } from '@/components/ui/network-error-banner';
import { ToastHost } from '@/components/ui/toast';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { AppProviders } from '@/providers/app-providers';
import { useSession } from '@/providers/AuthProvider';
import { useTenant } from '@/providers/TenantProvider';

export const unstable_settings = {
  anchor: '(main)',
};

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore when native splash is already handled or unavailable for this view.
});

function RootNavigator() {
  const [fontsLoaded] = useFonts(MaterialIcons.font);
  const { tenant, isLoading: isTenantLoading } = useTenant();
  const session = useSession();

  const isReady =
    fontsLoaded && session.status !== 'loading' && !isTenantLoading;

  useEffect(() => {
    if (!isReady) return;
    void SplashScreen.hideAsync().catch(() => {
      // Ignore "no native splash screen registered for given view controller".
    });
  }, [isReady]);

  if (!isReady) {
    return (
      <LoadingScreen
        organizationName={tenant?.organizationName}
        logoUrl={tenant?.organizationLogoUrl}
        message="Preparing your workspace..."
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {session.status === 'authenticated' ? (
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
