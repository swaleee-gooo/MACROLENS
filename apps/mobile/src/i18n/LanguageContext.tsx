import { createContext, useContext, type ReactNode } from 'react';

export type Lang = 'en' | 'fr';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue>({ lang: 'en', setLang: () => {} });

/**
 * App-wide language — LOCKED to English (US-market app). The per-screen `{ en, fr }`
 * strings stay in the codebase, but only the English copy is ever shown. `setLang`
 * is kept as a no-op so existing callers don't break.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <LanguageContext.Provider value={{ lang: 'en', setLang: () => {} }}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}

/** Pick a value by current language. Usage: `const t = pick(lang, STR);` */
export function pick<T>(lang: Lang, dict: { en: T; fr: T }): T {
  return dict[lang];
}
