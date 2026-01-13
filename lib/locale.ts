import type { Locale, ContentLocale } from '@/lib/types';
import { CONTENT_LOCALES, LOCALE_FLAGS as CONTENT_LOCALE_FLAGS, LOCALE_NAMES as CONTENT_LOCALE_NAMES } from '@/lib/types';

// UI locales with full translation files
export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'vi'];

// Content locales - The Global Twelve
export const SUPPORTED_CONTENT_LOCALES: ContentLocale[] = CONTENT_LOCALES;

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  vi: 'Tiếng Việt',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  vi: '🇻🇳',
};

// Re-export content locale maps for convenience
export const CONTENT_LOCALE_NAMES_MAP = CONTENT_LOCALE_NAMES;
export const CONTENT_LOCALE_FLAGS_MAP = CONTENT_LOCALE_FLAGS;

export function detectBrowserLocale(): ContentLocale {
  if (typeof navigator === 'undefined') return 'en';

  const browserLang = navigator.language.split('-')[0].toLowerCase();

  // Check if browser language matches any content locale
  if (SUPPORTED_CONTENT_LOCALES.includes(browserLang as ContentLocale)) {
    return browserLang as ContentLocale;
  }

  // Map some common language codes to our supported locales
  const langMap: Record<string, ContentLocale> = {
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

export function isValidContentLocale(locale: string): locale is ContentLocale {
  return SUPPORTED_CONTENT_LOCALES.includes(locale as ContentLocale);
}
