/**
 * Navigation inférieure pour mobile (PWA). Remplace le hamburger sur les
 * petits écrans.
 *
 * MIGRÉE VERS `react/bottom-nav` DU SOCLE. Cette copie avait refusé de migrer,
 * et son en-tête nommait les deux blocages : la cinquième cellule n'est pas
 * une destination (c'est un `<button>` qui ouvre le tiroir de l'app, avec
 * `aria-expanded` et `aria-controls`), et l'appel maternité est un bouton
 * d'action, pas un onglet — or `key` ne descend pas dans le DOM et les chemins
 * sont traduits dans sept langues, donc aucune accroche d'habillage.
 *
 * Le socle 3.31.0 répond aux deux : `trailing` pour la cellule libre,
 * `item.className` pour l'habillage par élément. La demande écrite ici
 * — « À DEMANDER AU SOCLE… » — a été honorée telle quelle.
 *
 * CE QUE LA MIGRATION APPORTE, et que cette copie n'avait pas :
 *
 *   · une mention « Page actuelle » lue mais non vue sur l'onglet courant.
 *     L'état actif ne tenait qu'à la couleur (WCAG 1.4.1) ;
 *   · `aria-hidden` sur les icônes des liens — seul le bouton menu l'avait.
 *
 * `currentPath` EST PASSÉ EXPLICITEMENT. Le socle retombe sinon sur
 * `location.pathname` du navigateur, qui inclut la base `/miss-contraction/`
 * en production, là où `useLocation()` de react-router la retire : aucun
 * onglet ne serait jamais actif en ligne, et tout le serait en local.
 *
 * `end: true` PARTOUT. Le socle compare par préfixe hors de la racine ; cette
 * barre comparait à l'identique. Sans ce drapeau, un chemin plus profond
 * allumerait son parent.
 *
 * L'HABILLAGE RESTE LOCAL, comme pour `EmptyState` : cette app n'importe pas
 * `components.css` (elle restylerait `EmptyState` et `ErrorBoundary`), donc
 * `enhanced-ui.css` cible les `[data-dwc]` du socle.
 */
import { Link, useLocation } from 'react-router-dom';
import { BottomNav as SocleBottomNav } from '@mister-guiiug/dev-pwa-config/react/bottom-nav';
import { useAppStore } from '../../store/useAppStore';
import { getRoutePath } from '../../../routes-i18n';
import { t } from '../../../i18n';

interface BottomNavProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export function BottomNav({ onMenuClick, isMenuOpen = false }: BottomNavProps) {
  const location = useLocation();
  const language = useAppStore(state => state.settings.language);

  const navItems = [
    {
      href: getRoutePath('home', language),
      label: t(language, 'bottom.home'),
      icon: <HomeIcon />,
      end: true,
      className: 'bottom-nav-item',
    },
    {
      href: getRoutePath('table', language),
      label: t(language, 'bottom.history'),
      icon: <ListIcon />,
      end: true,
      className: 'bottom-nav-item',
    },
    {
      href: getRoutePath('maternity', language),
      label: t(language, 'bottom.maternity'),
      icon: <PhoneIcon />,
      end: true,
      // `cta` : gros disque en relief, libellé masqué visuellement. C'est
      // l'accroche par élément que cette barre réclamait au socle.
      className: 'bottom-nav-item cta',
    },
    {
      href: getRoutePath('settings', language),
      label: t(language, 'bottom.settings'),
      icon: <SettingsIcon />,
      end: true,
      className: 'bottom-nav-item',
    },
  ];

  const isMenuRoute =
    location.pathname === getRoutePath('message', language) ||
    location.pathname === getRoutePath('midwife', language);

  return (
    <SocleBottomNav
      className="bottom-nav"
      label={t(language, 'shell.bottomNav')}
      currentPath={location.pathname}
      // Le socle 3.32.0 a élargi `linkComponent` à `ComponentType<any>` : le
      // type refusait jusque-là tout composant à prop OBLIGATOIRE, donc
      // précisément `Link` et son `to` — l'usage que sa propre documentation
      // donne en exemple. Cinq apps portaient la même conversion ; elle n'a
      // plus lieu d'être.
      linkComponent={Link}
      hrefProp="to"
      items={navItems}
      trailing={
        <button
          type="button"
          className={`bottom-nav-item ${isMenuOpen || isMenuRoute ? 'active' : ''}`}
          aria-label={t(language, 'bottom.menu')}
          aria-expanded={isMenuOpen}
          aria-controls="app-drawer"
          onClick={onMenuClick}
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {MenuIcon()}
          </span>
          <span>{t(language, 'bottom.menu')}</span>
        </button>
      }
    />
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}
