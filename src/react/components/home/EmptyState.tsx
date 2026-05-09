import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../../i18n';
/**
 * Empty state shown when no contraction has been recorded yet.
 */
export function EmptyState() {
  const language = useAppStore(state => state.settings.language);
  return (
    <div className="card empty-state">
      <div className="empty-state-illustration">
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
      <h3>{t(language, 'empty.title')}</h3>
      <p>{t(language, 'empty.text')}</p>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Link to="/parametres" className="btn btn-secondary btn-small">
          {t(language, 'empty.configure')}
        </Link>
        <Link to="/valise" className="btn btn-secondary btn-small">
          {t(language, 'empty.checklist')}
        </Link>
      </div>
    </div>
  );
}
