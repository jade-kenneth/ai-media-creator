import { useColorScheme as useNativeColorScheme } from 'react-native';

import { useOptionalThemePreference } from '@/providers/ThemePreferenceProvider';

export function useColorScheme() {
  const themePreference = useOptionalThemePreference();
  const nativeColorScheme = useNativeColorScheme();

  return themePreference?.resolvedScheme ?? nativeColorScheme ?? 'light';
}
