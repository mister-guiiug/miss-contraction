/**
 * Navigation inférieure pour mobile (PWA)
 * Remplace le hamburger sur les petits écrans
 */
import { Link, useLocation } from 'react-router-dom';

interface BottomNavProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export function BottomNav({ onMenuClick, isMenuOpen = false }: BottomNavProps) {
  const location = useLocation();

  const navItems = [
    { href: '/', label: 'Accueil', icon: HomeIcon },
    { href: '/historique', label: 'Historique', icon: ListIcon },
    { href: '/maternite', label: 'Maternité', icon: PhoneIcon, isCta: true },
    { href: '/parametres', label: 'Réglages', icon: SettingsIcon },
  ];

  const isMenuRoute = location.pathname === '/message' || location.pathname === '/sage-femme';

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
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
        aria-label="Menu"
        aria-expanded={isMenuOpen}
        aria-controls="app-drawer"
        onClick={onMenuClick}
      >
        <span className="bottom-nav-icon" aria-hidden="true">{MenuIcon()}</span>
        <span>Menu</span>
      </button>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6" />
      <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24M1 12h6m6 0h6" />
      <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}
