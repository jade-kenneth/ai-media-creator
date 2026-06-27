import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { colorScheme as nativewindColorScheme } from 'nativewind';

export type ThemePreference = 'system' | 'light' | 'dark';

type ResolvedScheme = 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  resolvedScheme: ResolvedScheme;
};

const THEME_PREFERENCE_STORAGE_KEY = 'theme_preference';

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(
  null,
);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

async function loadStoredThemePreference(): Promise<ThemePreference> {
  const storedPreference = await SecureStore.getItemAsync(
    THEME_PREFERENCE_STORAGE_KEY,
  );

  return isThemePreference(storedPreference) ? storedPreference : 'system';
}

async function persistThemePreference(preference: ThemePreference) {
  if (preference === 'system') {
    await SecureStore.deleteItemAsync(THEME_PREFERENCE_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(THEME_PREFERENCE_STORAGE_KEY, preference);
}

export function ThemePreferenceProvider({
  children,
}: PropsWithChildren) {
  const systemScheme = useNativeColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let isMounted = true;

    void loadStoredThemePreference().then((storedPreference) => {
      if (!isMounted) return;
      setPreferenceState(storedPreference);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    nativewindColorScheme.set(preference);
  }, [preference]);

  const resolvedScheme: ResolvedScheme =
    preference === 'system' ? systemScheme : preference;

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    void persistThemePreference(nextPreference);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
    }),
    [preference, resolvedScheme, setPreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useOptionalThemePreference() {
  return useContext(ThemePreferenceContext);
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useOptionalThemePreference();

  if (!context) {
    throw new Error(
      'useThemePreference must be used within ThemePreferenceProvider',
    );
  }

  return context;
}
