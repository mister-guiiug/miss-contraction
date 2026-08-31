import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../../i18n';
import { appVersion } from '../../../appVersion';

/**
 * POURQUOI CETTE COPIE RESTE, alors que `react/app-footer` du socle existe.
 *
 * Le pied de page du socle rend deux liens EXTERNES — code source et sponsor —
 * et, en option, le numéro de version. Sur les quatre éléments d'ici, il n'en
 * couvre qu'un :
 *
 * | Élément                         | `react/app-footer`                      |
 * |---------------------------------|-----------------------------------------|
 * | L'AVERTISSEMENT MÉDICAL         | aucun emplacement, et pas de `children` |
 * | Lien « À propos et version »    | `repoUrl` part vers GitHub, pas vers    |
 * |                                 | `/a-propos` : un `<a target=_blank>`,   |
 * |                                 | pas un `Link` de routeur — on QUITTE    |
 * |                                 | l'app                                   |
 * | Lien « Buy me a coffee »        | couvert (`sponsorUrl`)                  |
 * | Version (`data-testid`)         | `AppVersion`, autre balisage            |
 *
 * Et il rend lui-même un `<footer>` : l'imbriquer dans le nôtre est interdit
 * par la spécification HTML (`footer` ne peut pas descendre d'un `footer`).
 * Le remplacer sortirait l'avertissement médical du repère de pied de page.
 *
 * Sur une app qu'on ouvre pendant un accouchement, la phrase « cet outil ne
 * remplace pas un avis médical » n'est pas décorative. Elle reste, et le pied
 * de page avec elle.
 *
 * À DEMANDER AU SOCLE : un `children` avant les liens suffirait à rendre ce
 * pied de page migrable.
 */
export function AppFooter() {
  const language = useAppStore(state => state.settings.language);

  return (
    <footer className="footer footer--app">
      <p className="footer__disclaimer">{t(language, 'footer.disclaimer')}</p>
      <div className="footer__links">
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
        <a
          className="footer-link"
          href="https://buymeacoffee.com/mister.guiiug"
          target="_blank"
          rel="noopener noreferrer"
        >
          ☕ {t(language, 'footer.coffee')}
        </a>
      </div>
      <p className="footer__version" data-testid="footer-version">
        {appVersion.deploymentVersion}
      </p>
    </footer>
  );
}
