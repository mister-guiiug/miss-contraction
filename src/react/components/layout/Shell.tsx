import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import {
  cycleThemePreference,
  getStoredThemePreference,
  type ThemePreference,
} from '../../../theme';
import type { AppRoute } from '../../../routes';
import { getBreadcrumbLabel } from '../../../routes';

interface ShellProps {
  children: ReactNode;
}

const iconSrc = `${import.meta.env.BASE_URL}icons/icon-192.png`;

const NAV_SECTIONS = [
  {
    id: 'drawer-lbl-suivi',
    label: 'Suivi des contractions',
    links: [
      { route: 'home', href: '/', label: 'Accueil', icon: 'home' },
      { route: 'table', href: '/historique', label: 'Tableau des contractions', icon: 'table' },
      { route: 'midwife', href: '/sage-femme', label: 'Résumé sage-femme', icon: 'document' },
    ],
  },
  {
    id: 'drawer-lbl-mat',
    label: 'Maternité',
    links: [
      { route: 'maternity', href: '/maternite', label: 'Appeler la maternité', icon: 'phone' },
      { route: 'message', href: '/message', label: 'Message à la maternité', icon: 'message' },
    ],
  },
  {
    id: 'drawer-lbl-app',
    label: 'Application',
    links: [
      { route: 'settings', href: '/parametres', label: 'Paramètres et alerte', icon: 'settings' },
    ],
  },
];

function DrawerLink({ route, href, label }: { route: AppRoute; href: string; label: string }) {
  const location = useLocation();
  const isCurrentRoute = location.pathname === href;

  return (
    <Link
      to={href}
      className={`drawer-link ${isCurrentRoute ? 'drawer-link--current' : ''}`}
      aria-current={isCurrentRoute ? 'page' : undefined}
      data-drawer-route={route}
    >
      <span className="drawer-link-icon" aria-hidden="true">
        {route === 'home' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        )}
        {route === 'table' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
        )}
        {route === 'midwife' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
        )}
        {route === 'maternity' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 2.7A2 2 0 0 1 22 16.92z"/></svg>
        )}
        {route === 'message' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
        {route === 'settings' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        )}
      </span>
      <span className="drawer-link-label">{label}</span>
      <span className="drawer-link-arrow" aria-hidden="true">›</span>
    </Link>
  );
}

function Breadcrumb() {
  const location = useLocation();
  const routeMap: Record<string, AppRoute> = {
    '/': 'home',
    '/historique': 'table',
    '/sage-femme': 'midwife',
    '/maternite': 'maternity',
    '/message': 'message',
    '/parametres': 'settings',
  };

  const route = routeMap[location.pathname] || 'home';
  const homeLabel = getBreadcrumbLabel('home');
  const currentLabel = getBreadcrumbLabel(route);

  return (
    <nav className="top-bar-bc" id="top-bar-bc-nav" aria-label="Fil d'Ariane">
      {route === 'home' ? (
        <ol className="top-bar-bc-list top-bar-bc-list--home">
          <li className="top-bar-bc-step" aria-current="page">
            <span className="top-bar-bc-text">{homeLabel}</span>
          </li>
        </ol>
      ) : (
        <ol className="top-bar-bc-list">
          <li className="top-bar-bc-step">
            <Link className="top-bar-bc-link" to="/">
              {homeLabel}
            </Link>
          </li>
          <li className="top-bar-bc-step" aria-current="page">
            <span className="top-bar-bc-text">{currentLabel}</span>
          </li>
        </ol>
      )}
    </nav>
  );
}

function ThemeIcon({ preference }: { preference: ThemePreference }) {
  if (preference === 'light') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }

  if (preference === 'dark') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Thème clair',
  dark: 'Thème sombre',
  system: 'Thème automatique',
};

export function Shell({ children }: ShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [themePreference, setThemePreference] =
    useState<ThemePreference>('system');
  const [themeAnim, setThemeAnim] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleThemeClick = () => {
    const next = cycleThemePreference();
    setThemePreference(next);
    setThemeAnim(false);
    requestAnimationFrame(() => setThemeAnim(true));
  };

  useEffect(() => {
    setThemePreference(getStoredThemePreference());
  }, []);

  useEffect(() => {
    if (!themeAnim) return;
    const timeoutId = window.setTimeout(() => setThemeAnim(false), 250);
    return () => window.clearTimeout(timeoutId);
  }, [themeAnim]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        e.preventDefault();
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  return (
    <>
      <a className="skip-to-content" href="#main-content">
        Aller au contenu principal
      </a>

      <div
        className={`nav-backdrop ${isDrawerOpen ? 'is-open' : ''}`}
        id="nav-backdrop"
        aria-hidden="true"
        onClick={closeDrawer}
      />

      <nav
        className={`app-drawer ${isDrawerOpen ? 'is-open' : ''}`}
        id="app-drawer"
        aria-label="Menu principal"
        aria-hidden={!isDrawerOpen}
      >
        <div className="drawer-header">
          <div className="drawer-header-brand">
            <img
              className="drawer-header-logo"
              src={iconSrc}
              width="40"
              height="40"
              alt=""
              decoding="async"
            />
            <span className="drawer-header-title">Menu</span>
          </div>
          <button
            type="button"
            className="drawer-close"
            id="btn-drawer-close"
            aria-label="Fermer le menu"
            onClick={closeDrawer}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="drawer-scroll">
          {NAV_SECTIONS.map(section => (
            <div key={section.id}>
              <p className="drawer-section-label" id={section.id}>
                {section.label}
              </p>
              <ul className="drawer-nav" aria-labelledby={section.id}>
                {section.links.map(link => (
                  <li key={link.route}>
                    <DrawerLink
                      route={link.route as AppRoute}
                      href={link.href}
                      label={link.label}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <main className="app" id="main-content" tabIndex={-1}>
        <header className="top-bar">
          <div className="top-bar-brand">
            <h1 className="top-bar-h1">
              <span className="top-bar-app-line">
                <img
                  className="top-bar-logo"
                  src={iconSrc}
                  width="48"
                  height="48"
                  alt=""
                  decoding="async"
                />
                <span className="top-bar-app-name">Miss Contraction</span>
              </span>
            </h1>
            <Breadcrumb />
          </div>
          <button
            type="button"
            className={`btn-theme ${themeAnim ? 'btn-theme--anim' : ''}`}
            id="btn-theme"
            aria-label={THEME_LABELS[themePreference]}
            title={THEME_LABELS[themePreference]}
            onClick={handleThemeClick}
          >
            <ThemeIcon preference={themePreference} />
          </button>
          <button
            type="button"
            className={`hamburger ${isDrawerOpen ? 'hamburger--open' : ''}`}
            id="btn-menu"
            aria-expanded={isDrawerOpen}
            aria-controls="app-drawer"
            aria-label="Ouvrir le menu"
            onClick={toggleDrawer}
          >
            <span className="hamburger-box" aria-hidden="true">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </span>
          </button>
        </header>

        {children}

        <BottomNav />
      </main>
    </>
  );
}
