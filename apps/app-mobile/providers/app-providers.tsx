import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import type { PropsWithChildren } from "react";

import "@/i18n";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LanguagePreferenceProvider } from "@/providers/LanguagePreferenceProvider";
import { ThemePreferenceProvider } from "@/providers/ThemePreferenceProvider";

import { AuthProvider } from "./AuthProvider";
import { PushNotificationsProvider } from "./push-notifications-provider";
import { QueryProvider } from "./query-provider";
import { TenantProvider } from "./TenantProvider";

function NavigationThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {children}
    </ThemeProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <LanguagePreferenceProvider>
      <ThemePreferenceProvider>
        <NavigationThemeProvider>
          <QueryProvider>
            <TenantProvider>
              <AuthProvider>
                <PushNotificationsProvider>{children}</PushNotificationsProvider>
              </AuthProvider>
            </TenantProvider>
          </QueryProvider>
        </NavigationThemeProvider>
      </ThemePreferenceProvider>
    </LanguagePreferenceProvider>
  );
}
