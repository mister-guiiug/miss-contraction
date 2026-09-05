import type { ReactNode } from 'react';
import { LabelsProvider } from '@mister-guiiug/dev-pwa-config/react/labels';
import { useAppStore } from '../store/useAppStore';
import { t } from '../../i18n';

/**
 * Donne aux composants du socle la langue choisie dans les réglages.
 *
 * Les libellés que le paquet porte lui-même (« Fermer », « Réessayer »,
 * « Navigation principale »…) vivent dans un contexte séparé de notre
 * dictionnaire : sans ce fournisseur, ils resteraient en français quelle que
 * soit la langue de l'application.
 *
 * ATTENTION AUX SEPT LANGUES. Le socle n'en livre que deux, `fr` et `en`, et
 * retombe silencieusement sur le français pour les cinq autres. Nos propres
 * textes, eux, viennent de `src/i18n.ts` et couvrent bien les sept : tout ce
 * qui doit être traduit en espagnol, allemand, italien, portugais ou
 * néerlandais doit donc être passé EXPLICITEMENT en prop aux composants du
 * socle, jamais laissé à leur dictionnaire. `src/react/providers/
 * AppLabelsProvider.test.tsx` fige cette frontière.
 *
 * La langue reste stockée là où elle l'a toujours été : `settings.language`,
 * dans `mc_settings_v1`. Ce fournisseur ne la persiste pas et ne la détecte
 * pas — il ne fait que la relayer.
 */
export function AppLabelsProvider({ children }: { children: ReactNode }) {
  const language = useAppStore(state => state.settings.language);

  return (
    <LabelsProvider
      locale={language}
      // `nav.current` est le seul libellé du socle qu'un composant ne laisse
      // pas passer en prop : `BottomNav` le lit dans son dictionnaire pour la
      // mention « Page actuelle », masquée visuellement mais lue à voix haute
      // sur l'onglet courant. Sans cette surcharge, cinq de nos sept langues
      // l'entendraient en français — exactement la frontière que cet en-tête
      // décrit. `overrides` est la porte prévue pour ça.
      overrides={{ nav: { current: t(language, 'bottom.current') } }}
    >
      {children}
    </LabelsProvider>
  );
}
