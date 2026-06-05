import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'en' | 'fr';

const STORAGE_KEY = 'macrolens.language';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue>({ lang: 'en', setLang: () => {} });

/**
 * App-wide language. Default English; user can switch to French (persisted).
 * Screens read it via `useLang()` and pick from a local `{ en, fr }` strings object,
 * so each screen stays self-contained (no central dictionary).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'fr' || stored === 'en') {
          setLangState(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}

/** Pick a value by current language. Usage: `const t = pick(lang, STR);` */
export function pick<T>(lang: Lang, dict: { en: T; fr: T }): T {
  return dict[lang];
}
