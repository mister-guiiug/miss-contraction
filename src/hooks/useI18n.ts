import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency, formatNumber } from '../i18n.config';

/**
 * Hook personnalisé pour utiliser i18n avec formatters intégrés
 */
export function useI18n() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as any;

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
