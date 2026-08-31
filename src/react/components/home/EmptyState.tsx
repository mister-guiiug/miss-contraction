import { Link } from 'react-router-dom';
import { EmptyState as DwcEmptyState } from '@mister-guiiug/dev-wpa-config/react/empty-state';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../../i18n';

/**
 * L'écran d'accueil tant qu'aucune contraction n'a été enregistrée.
 *
 * La coque vient du socle (`react/empty-state`) — sept apps de la famille en
 * portaient une copie. Elle n'est pas habillée : ses attributs
 * `[data-dwc="empty-state-*"]` sont repris dans `enhanced-ui.css`, comme le
 * dépôt le fait déjà pour `FamilyApps` et `ErrorBoundary`. On n'importe PAS
 * `components.css` : elle restylerait ces deux composants-là, déjà habillés à
 * la main sur l'écran « À propos ».
 *
 * TOUS LES TEXTES SONT PASSÉS EN PROP. Le dictionnaire du socle ne couvre que
 * `fr` et `en` ; l'app en porte sept. Rien ici ne doit dépendre de ses
 * libellés.
 *
 * L'illustration reste locale : c'est l'horloge de miss-contraction, pas une
 * icône de la famille.
 */
const Illustration = (
  <div className="empty-state-illustration">
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cercle de fond avec dégradé */}
      <circle cx="60" cy="60" r="55" fill="rgba(160, 48, 154, 0.08)" />
      <circle cx="60" cy="60" r="45" fill="rgba(160, 48, 154, 0.05)" />

      {/* Horloge stylisée */}
      <circle
        cx="60"
        cy="60"
        r="35"
        stroke="rgba(160, 48, 154, 0.3)"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="40"
        stroke="rgba(160, 48, 154, 0.6)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="60"
        x2="75"
        y2="65"
        stroke="rgba(160, 48, 154, 0.6)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="3" fill="rgba(160, 48, 154, 0.8)" />

      {/* Petits indicateurs autour */}
      <circle cx="60" cy="22" r="2" fill="rgba(160, 48, 154, 0.4)" />
      <circle cx="60" cy="98" r="2" fill="rgba(160, 48, 154, 0.4)" />
      <circle cx="22" cy="60" r="2" fill="rgba(160, 48, 154, 0.4)" />
      <circle cx="98" cy="60" r="2" fill="rgba(160, 48, 154, 0.4)" />

      {/* Points décoratifs */}
      <circle cx="35" cy="35" r="1.5" fill="rgba(160, 48, 154, 0.2)" />
      <circle cx="85" cy="35" r="1.5" fill="rgba(160, 48, 154, 0.2)" />
      <circle cx="35" cy="85" r="1.5" fill="rgba(160, 48, 154, 0.2)" />
      <circle cx="85" cy="85" r="1.5" fill="rgba(160, 48, 154, 0.2)" />
    </svg>
  </div>
);

export function EmptyState() {
  const language = useAppStore(state => state.settings.language);

  return (
    <DwcEmptyState
      className="card empty-state"
      icon={Illustration}
      title={t(language, 'empty.title')}
      description={t(language, 'empty.text')}
      action={
        <>
          <Link to="/parametres" className="btn btn-secondary btn-small">
            {t(language, 'empty.configure')}
          </Link>
          <Link to="/valise" className="btn btn-secondary btn-small">
            {t(language, 'empty.checklist')}
          </Link>
        </>
      }
    />
  );
}
