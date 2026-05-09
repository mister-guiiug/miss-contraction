import { useI18n } from './useI18n';
import type { AppRoute } from '../routes';

/**
 * Hook pour accéder aux métadonnées de route (labels traduits)
 */
export function useRouteMeta() {
  const { t } = useI18n();

  return {
    /**
     * Obtenir les labels traduits pour une route
     */
    getRouteLabel: (route: AppRoute): string => {
      return t(`route.${route}`);
    },

    /**
     * Obtenir les sections du menu avec les labels traduits
     */
    getNavSections: () => [
      {
        id: 'drawer-lbl-suivi',
        label: t('shell.section.tracking'),
        links: [
          {
            route: 'home' as AppRoute,
            href: '/',
            label: t('shell.nav.home'),
            icon: 'home',
          },
          {
            route: 'table' as AppRoute,
            href: '/historique',
            label: t('shell.nav.table'),
            icon: 'table',
          },
          {
            route: 'midwife' as AppRoute,
            href: '/sage-femme',
            label: t('shell.nav.midwife'),
            icon: 'document',
          },
          {
            route: 'checklist' as AppRoute,
            href: '/valise',
            label: t('shell.nav.checklist'),
            icon: 'checklist',
          },
        ],
      },
      {
        id: 'drawer-lbl-maternite',
        label: t('shell.section.maternity'),
        links: [
          {
            route: 'maternity' as AppRoute,
            href: '/maternite',
            label: t('shell.nav.maternity'),
            icon: 'phone',
          },
          {
            route: 'message' as AppRoute,
            href: '/message',
            label: t('shell.nav.message'),
            icon: 'message',
          },
        ],
      },
      {
        id: 'drawer-lbl-app',
        label: t('shell.section.application'),
        links: [
          {
            route: 'settings' as AppRoute,
            href: '/parametres',
            label: t('shell.nav.settings'),
            icon: 'settings',
          },
          {
            route: 'about' as AppRoute,
            href: '/a-propos',
            label: t('shell.nav.about'),
            icon: 'info',
          },
        ],
      },
    ],
  };
}
