// Basic i18n configuration for Next.js 15 App Router
// This is a simplified setup - can be expanded with next-intl or similar

export const supportedLocales = ['en', 'es', 'fr', 'de'] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

// Currency conversion rates (simplified - should use OpenExchangeRates API in production)
export const currencyRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
};

export const defaultCurrency = 'USD';

