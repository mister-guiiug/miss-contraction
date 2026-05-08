/**
 * Fonctions utilitaires pour synchroniser les langues entre Zustand (AppSettings) et i18next
 */

import i18n from './i18n.config';
import type { AppLanguage } from './i18n';

/**
 * Synchroniser la langue entre AppSettings et i18next
 * Appel cette fonction quand la langue change dans les paramètres
 */
export function syncLanguageWithI18next(language: AppLanguage): void {
  if (language && language !== i18n.language) {
    i18n.changeLanguage(language).catch(console.error);
  }
}

/**
 * Obtenir la langue actuelle depuis i18next
 */
export function getCurrentI18nLanguage(): AppLanguage {
  return (i18n.language as AppLanguage) || 'fr';
}

/**
 * Listener pour synchroniser les changements de langue i18next vers localStorage/Zustand
 * À appeler après la création du store
 */
export function setupLanguageSyncListener(
  callback: (language: AppLanguage) => void
): () => void {
  const handler = (language: string) => {
    callback(language as AppLanguage);
  };

  i18n.on('languageChanged', handler);

  // Retourner une fonction pour nettoyer le listener
  return () => {
    i18n.off('languageChanged', handler);
  };
}
