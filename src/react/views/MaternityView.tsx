import { Link } from 'react-router-dom';
/**
 * Vue Maternité - Coordonnées et contact
 */

import { useEffect } from 'react';
import { useAppStore, useRefreshSettings } from '../store/useAppStore';
import { loadSettings } from '../../storage';

export function MaternityView() {
  const { settings } = useAppStore();
  const updateSettings = useRefreshSettings();
  const { maternityLabel, maternityPhone, maternityAddress } = settings;

  // Recharger les settings au montage (synchronisation vanilla ↔ React)
  useEffect(() => {
    updateSettings(loadSettings());
  }, [updateSettings]);

  const phone = maternityPhone.trim();
  const label = maternityLabel.trim();
  const addr = maternityAddress.trim();
  const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : '#';

  useEffect(() => {
    document.title = 'Maternité - Contractions';
  }, []);

  const hasPhone = phone.length > 0;
  const hasLabel = label.length > 0;
  const hasAddress = addr.length > 0;
  const destName = hasLabel ? label : 'la maternité';
  const mapsDest = hasLabel ? `${label} - ${addr}` : addr;
  const mapsHref = hasAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`
    : '#';

  return (
    <div className="maternity-page">
      <p className="subtitle maternity-page-lead">
        Libellé, numéro et adresse sont modifiables dans les paramètres. Appel
        et itinéraire en un geste.
      </p>

      <section
        className="card card--maternity-call"
        aria-labelledby="maternity-call-heading"
      >
        <h2 id="maternity-call-heading" className="section-title">
          Contacter la maternité
        </h2>

        {hasLabel && (
          <p className="maternity-page-venue">{label}</p>
        )}

        <div className="maternity-page-phone-block">
          <div className="maternity-page-phone-head">
            <p className="maternity-page-subheading">Numéro</p>
            <span className="maternity-page-readonly-badge">
              Lecture seule
            </span>
          </div>

          {hasPhone ? (
            <>
              <p className="maternity-page-phone-line">{phone}</p>
              <div className="maternity-page-dial-wrap">
                <a
                  className={`maternity-page-dial${hasPhone ? ' maternity-page-dial--ready' : ''}`}
                  href={telHref}
                  aria-label={`Appeler ${destName} au ${phone}`}
                >
                  <span className="maternity-page-dial-ring" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 2.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <span className="maternity-page-dial-label">Appeler {destName}</span>
                </a>
              </div>
            </>
          ) : (
            <p className="maternity-page-phone-placeholder">
              Aucun numéro enregistré. Indiquez-le dans les{' '}
              <Link to="/parametres">paramètres</Link>.
            </p>
          )}
        </div>

        {/* Bloc Adresse */}
        <div className="maternity-page-address-block">
          <div className="maternity-page-address-head">
            <p className="maternity-page-address-heading">Adresse</p>
            <span className="maternity-page-readonly-badge">
              Lecture seule
            </span>
          </div>

          {hasAddress ? (
            <p className="maternity-page-address">{addr}</p>
          ) : (
            <p className="maternity-page-address-placeholder">
              Aucune adresse enregistrée. Indiquez-la dans les{' '}
              <Link to="/parametres">paramètres</Link>.
            </p>
          )}
        </div>

        {/* Itinéraire Maps - même carte, en dehors du bloc Adresse */}
        {hasAddress && (
          <div className="maternity-page-maps">
            <a
              className="btn btn-secondary maternity-page-maps-btn"
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ouvrir Google Maps : itinéraire vers ${mapsDest}`}
            >
              <span className="maternity-page-maps-icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>Itinéraire dans Maps</span>
            </a>
            <p className="maternity-page-maps-hint">
              Ouvre Google Maps dans un nouvel onglet pour un itinéraire
              vers l&apos;adresse ci-dessus (position actuelle →
              destination).
            </p>
          </div>
        )}
      </section>

      {/* Boutons footer */}
      <p className="settings-back-wrap maternity-page-actions">
        <Link to="/parametres" className="btn btn-secondary settings-back-link">
          Paramètres
        </Link>
        <Link to="/" className="btn btn-ghost settings-back-link">
          Accueil
        </Link>
      </p>
    </div>
  );
}
