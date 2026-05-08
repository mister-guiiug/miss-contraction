import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency, formatNumber } from '../i18n.config';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '../i18n';

function isAppLanguage(language: string): language is AppLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

/**
 * Hook personnalisé pour utiliser i18n avec formatters intégrés
 */
export function useI18n() {
  const { t, i18n } = useTranslation();
  const language = isAppLanguage(i18n.language) ? i18n.language : 'en';

  return {
    /**
     * Traduire une clé
     */
    t,
    /**
     * Langue actuelle
     */
    language,
    /**
     * Changer la langue
     */
    setLanguage: (lang: string) => i18n.changeLanguage(lang),
    /**
     * Formater une date selon la langue
     */
    formatDate: (date: Date | number) => formatDate(date, language),
    /**
     * Formater une devise selon la langue
     */
    formatCurrency: (amount: number, currency?: string) =>
      formatCurrency(amount, language, currency),
    /**
     * Formater un nombre selon la langue
     */
    formatNumber: (value: number) => formatNumber(value, language),
  };
}
