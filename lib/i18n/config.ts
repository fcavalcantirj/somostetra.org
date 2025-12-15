export const locales = ['pt', 'en', 'es'] as const;
export const defaultLocale = 'pt' as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  pt: 'Portugues',
  en: 'English',
  es: 'Espanol'
};

export const localeFlags: Record<Locale, string> = {
  pt: 'BR',
  en: 'US',
  es: 'ES'
};
