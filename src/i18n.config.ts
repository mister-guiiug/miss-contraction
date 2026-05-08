import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AppLanguage } from './i18n';
import { MESSAGES as oldMessages } from './i18n';

type TranslationResources = Record<string, string>;

/**
 * Configuration i18next avec gestion des dates et devises
 * Migré de la solution maison vers i18next
 */

// Convertir la structure existante en ressources i18next
const resources: Record<string, { translation: Record<string, string> }> = {
  fr: { translation: oldMessages.fr as TranslationResources },
  en: { translation: oldMessages.en as TranslationResources },
  es: { translation: oldMessages.es as TranslationResources },
  de: { translation: oldMessages.de as TranslationResources },
  it: { translation: oldMessages.it as TranslationResources },
  pt: { translation: oldMessages.pt as TranslationResources },
  nl: { translation: oldMessages.nl as TranslationResources },
};

// Formatters natifs pour dates et devises
const dateFormatters: Record<AppLanguage, Intl.DateTimeFormat> = {
  fr: new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
  en: new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
  es: new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
  de: new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
  it: new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
  pt: new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
  nl: new Intl.DateTimeFormat('nl-NL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
};

const localeMap: Record<AppLanguage, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  nl: 'nl-NL',
};

/**
 * Formate une date selon la langue avec Intl API
 */
export function formatDate(date: Date | number, language: AppLanguage): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateFormatters[language]?.format(dateObj) ?? dateObj.toISOString();
}

/**
 * Formate une devise selon la langue
 * EUR est la devise par défaut, adaptable selon les besoins
 */
export function formatCurrency(
  amount: number,
  language: AppLanguage,
  currency: string = 'EUR'
): string {
  try {
    const formatter = new Intl.NumberFormat(localeMap[language], {
      style: 'currency',
      currency,
    });
    return formatter.format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * Formate un nombre selon la langue
 */
export function formatNumber(value: number, language: AppLanguage): string {
  try {
    const formatter = new Intl.NumberFormat(localeMap[language]);
    return formatter.format(value);
  } catch {
    return String(value);
  }
}

// Initialiser i18next
i18n.use(initReactI18next).init({
  resources,
  fallbackLng: false, // Pas de fallback - strict mode
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false, // Désactiver l'échappement car React l'gère
  },
  react: {
    useSuspense: false, // Désactiver Suspense pour la SSR
  },
});

export default i18n;
