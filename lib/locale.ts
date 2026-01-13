import type { Locale } from '@/lib/types';
import { LOCALES, LOCALE_FLAGS as TYPE_LOCALE_FLAGS, LOCALE_NAMES as TYPE_LOCALE_NAMES } from '@/lib/types';

// The Global Twelve - all supported locales
export const SUPPORTED_LOCALES: Locale[] = LOCALES;

// Re-export for convenience
export const LOCALE_NAMES = TYPE_LOCALE_NAMES;
export const LOCALE_FLAGS = TYPE_LOCALE_FLAGS;

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';

  const browserLang = navigator.language.split('-')[0].toLowerCase();

  // Check if browser language matches any supported locale
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // Map some common language codes to our supported locales
  const langMap: Record<string, Locale> = {
    'zh-cn': 'zh',
    'zh-tw': 'zh',
    'zh-hk': 'zh',
    'ms-my': 'ms',
    'id-id': 'id',
  };

  const fullLang = navigator.language.toLowerCase();
  if (langMap[fullLang]) {
    return langMap[fullLang];
  }

  return 'en';
}

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}
