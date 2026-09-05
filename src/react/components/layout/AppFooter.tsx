import { Link } from 'react-router-dom';
import { AppFooter as SocleFooter } from '@mister-guiiug/dev-pwa-config/react/app-footer';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../../i18n';
import { appVersion } from '../../../appVersion';

/**
 * Pied de page de l'app, monté sur `react/app-footer` du socle.
 *
 * CETTE COPIE AVAIT REFUSÉ DE MIGRER, et son en-tête dressait le tableau : sur
 * ses quatre éléments, le pied de page du socle n'en couvrait qu'un. Il en
 * aura fallu deux versions pour lever les trois autres, et la seconde n'a été
 * vue qu'EN MIGRANT.
 *
 *   `children` (3.31.0) — L'AVERTISSEMENT MÉDICAL. Il n'avait aucun
 *   emplacement, et l'imbrication était interdite : la spécification refuse un
 *   `<footer>` descendant d'un `<footer>`. Sur une app qu'on ouvre pendant un
 *   accouchement, « ne remplace pas un avis médical » n'est pas décoratif.
 *
 *   `links` (3.31.0) — LA DESTINATION INTERNE. `repoUrl` rend un
 *   `<a target=_blank>` vers GitHub ; notre lien « À propos » est un `Link` de
 *   routeur, et on ne quitte pas l'app.
 *
 *   `after` (3.32.0) — LE NUMÉRO DE DÉPLOIEMENT, et c'est celui qu'aucun
 *   tableau de besoins n'avait vu venir. `version` semblait suffire : il ne
 *   suffit pas. Notre numéro est `deploymentVersion`, de la forme
 *   `1.2.3+1756…`, et `AppVersion` passe par `formatVersion`, qui SUPPRIME le
 *   `+buildId` — or c'est lui, et lui seul, qui permet de vérifier qu'un
 *   déploiement a pris. Deux bundles différents afficheraient la même chaîne.
 *
 * LE LIEN SPONSOR VIENT DU SOCLE, avec son icône de rôle. L'émoji `☕` cède la
 * place au SVG de `DEFAULT_ICONS.sponsor`, qui suit `currentColor` et ne
 * dépend pas de la police d'emoji du système.
 *
 * L'HABILLAGE RESTE LOCAL, comme pour `EmptyState` et `BottomNav` : cette app
 * n'importe pas `components.css` — elle restylerait `EmptyState` et
 * `ErrorBoundary`. `styles.css` cible donc les `[data-dwc]` du socle.
 */
export function AppFooter() {
  const language = useAppStore(state => state.settings.language);

  return (
    <SocleFooter
      className="footer footer--app"
      sponsorLabel={t(language, 'footer.coffee')}
      links={
        <>
          <Link to="/a-propos" className="footer-link footer-link--about">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {t(language, 'footer.about')}
          </Link>
          <span className="footer__sep" aria-hidden="true">
            ·
          </span>
        </>
      }
      after={
        <p className="footer__version" data-testid="footer-version">
          {appVersion.deploymentVersion}
        </p>
      }
    >
      <p className="footer__disclaimer">{t(language, 'footer.disclaimer')}</p>
    </SocleFooter>
  );
}
