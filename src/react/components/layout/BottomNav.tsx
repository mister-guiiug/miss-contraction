/**
 * Navigation inférieure pour mobile (PWA).
 * Remplace le hamburger sur les petits écrans.
 *
 * POURQUOI CETTE COPIE RESTE, alors que `react/bottom-nav` du socle existe et
 * cite nommément miss-contraction parmi les sept apps à migrer. Deux éléments
 * de cette barre ne peuvent pas s'exprimer avec son API, et ce ne sont pas des
 * détails : ce sont les deux qu'on voit en premier.
 *
 * 1. LA CINQUIÈME CELLULE N'EST PAS UNE DESTINATION. C'est un `<button>` qui
 *    ouvre le tiroir de l'app (`#app-drawer`), avec `aria-expanded` et
 *    `aria-controls` — et il s'allume aussi sur les routes « message » et
 *    « sage-femme », que le tiroir contient. Le socle ne prend que des `items`
 *    à `href`. Son bouton « Plus » ressemble au nôtre mais fait autre chose :
 *    il déplie SON propre tiroir d'onglets en surnombre. (Son en-tête indique
 *    d'ailleurs que le motif `aria-expanded`/`aria-controls` a été repris
 *    D'ICI ; c'est la mécanique, pas le balisage, qui diffère.)
 *
 * 2. L'APPEL MATERNITÉ EST UN BOUTON D'ACTION, pas un onglet : gros disque
 *    violet en relief, libellé masqué visuellement (`sr-only`). Le socle rend
 *    tous les `items` à l'identique et n'émet aucune accroche par élément —
 *    ni `className`, ni `data-*` propre, et `key` ne descend pas dans le DOM.
 *    La classe `.cta` n'aurait plus rien à quoi se raccrocher. Un sélecteur
 *    sur le `href` ne tiendrait pas non plus : les chemins sont traduits dans
 *    les sept langues (`routes-i18n.ts`).
 *
 * Migrer coûterait donc soit le bouton menu, soit le bouton d'appel — sur un
 * écran qu'on regarde pendant un accouchement. Ce que le socle apporterait de
 * neuf (le nom du repère `<nav>`) est repris ici directement, à un coût nul.
 *
 * À DEMANDER AU SOCLE si la migration doit un jour aboutir : un emplacement
 * libre en fin de barre (`trailing`), et une accroche d'habillage par élément.
 */
import { Link, useLocation } from 'react-router-dom';
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
      icon: HomeIcon,
    },
    {
      href: getRoutePath('table', language),
      label: t(language, 'bottom.history'),
      icon: ListIcon,
    },
    {
      href: getRoutePath('maternity', language),
      label: t(language, 'bottom.maternity'),
      icon: PhoneIcon,
      isCta: true,
    },
    {
      href: getRoutePath('settings', language),
      label: t(language, 'bottom.settings'),
      icon: SettingsIcon,
    },
  ];

  const isMenuRoute =
    location.pathname === getRoutePath('message', language) ||
    location.pathname === getRoutePath('midwife', language);

  return (
    // Le repère porte un nom : deux `<nav>` anonymes sont indiscernables dans
    // la liste des repères d'un lecteur d'écran. C'est le seul défaut que
    // `react/bottom-nav` relevait ici, et il n'exige pas de migrer.
    <nav className="bottom-nav" aria-label={t(language, 'shell.bottomNav')}>
      {navItems.map(item => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`bottom-nav-item ${item.isCta ? 'cta' : ''} ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav-icon">{item.icon()}</span>
            <span className={item.isCta ? 'sr-only' : ''}>{item.label}</span>
          </Link>
        );
      })}

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
    </nav>
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
