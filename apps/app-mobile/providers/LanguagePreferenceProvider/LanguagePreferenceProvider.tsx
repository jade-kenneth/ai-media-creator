import * as Localization from 'expo-localization';
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

import i18n, {
  isSupportedLocale,
  resolveSupportedLocale,
  type SupportedLocale,
} from '@/i18n';

export type LanguagePreference = 'system' | SupportedLocale;

type LanguagePreferenceContextValue = {
  preference: LanguagePreference;
  resolvedLocale: SupportedLocale;
  setPreference: (preference: LanguagePreference) => void;
};

const LANGUAGE_PREFERENCE_STORAGE_KEY = 'language_preference';

const LanguagePreferenceContext =
  createContext<LanguagePreferenceContextValue | null>(null);

function isLanguagePreference(
  value: string | null,
): value is LanguagePreference {
  return value === 'system' || isSupportedLocale(value);
}

function resolveLanguage(preference: LanguagePreference): SupportedLocale {
  if (preference !== 'system') return preference;

  const languageCode = Localization.getLocales()[0]?.languageCode;
  return resolveSupportedLocale(languageCode);
}

async function loadStoredLanguagePreference(): Promise<LanguagePreference> {
  const storedPreference = await SecureStore.getItemAsync(
    LANGUAGE_PREFERENCE_STORAGE_KEY,
  );

  return isLanguagePreference(storedPreference) ? storedPreference : 'system';
}

async function persistLanguagePreference(preference: LanguagePreference) {
  if (preference === 'system') {
    await SecureStore.deleteItemAsync(LANGUAGE_PREFERENCE_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(LANGUAGE_PREFERENCE_STORAGE_KEY, preference);
}

export function LanguagePreferenceProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] =
    useState<LanguagePreference>('system');
  const resolvedLocale = resolveLanguage(preference);

  useEffect(() => {
    let isMounted = true;

    void loadStoredLanguagePreference().then((storedPreference) => {
      if (!isMounted) return;
      setPreferenceState(storedPreference);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(resolvedLocale);
  }, [resolvedLocale]);

  const setPreference = useCallback((nextPreference: LanguagePreference) => {
    setPreferenceState(nextPreference);
    void persistLanguagePreference(nextPreference);
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedLocale, setPreference }),
    [preference, resolvedLocale, setPreference],
  );

  return (
    <LanguagePreferenceContext.Provider value={value}>
      {children}
    </LanguagePreferenceContext.Provider>
  );
}

export function useLanguagePreference(): LanguagePreferenceContextValue {
  const context = useContext(LanguagePreferenceContext);

  if (!context) {
    throw new Error(
      'useLanguagePreference must be used within LanguagePreferenceProvider',
    );
  }

  return context;
}
