import { ReactNode, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  syncLanguageWithI18next,
  setupLanguageSyncListener,
} from '../../i18nUtils';

/**
 * Provider pour synchroniser la langue entre Zustand (AppSettings) et i18next
 */
export function I18nSyncProvider({ children }: { children: ReactNode }) {
  const settings = useAppStore(state => state.settings);
  const updateSettings = useAppStore(state => state.updateSettings);
  const saveSettings = useAppStore(state => state.saveSettings);

  // Synchroniser la langue actuelle d'AppSettings vers i18next au montage
  useEffect(() => {
    syncLanguageWithI18next(settings.language);
  }, []);

  // Écouter les changements de langue dans i18next et les reporter à AppSettings
  useEffect(() => {
    const unsubscribe = setupLanguageSyncListener(language => {
      if (language !== settings.language) {
        updateSettings({ language });
        saveSettings();
      }
    });

    return unsubscribe;
  }, [settings.language, updateSettings, saveSettings]);

  return <>{children}</>;
}
