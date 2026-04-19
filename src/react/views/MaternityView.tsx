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
                  className="maternity-page-dial"
                  href={telHref}
                  aria-label={`Appeler ${destName} au ${phone}`}
                >
                  <span className="maternity-page-dial-ring" aria-hidden="true">
                    <svg
                      className="maternity-page-dial-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </span>
                  <span className="maternity-page-dial-label">Appeler</span>
                </a>
              </div>
            </>
          ) : (
            <p className="maternity-page-phone-placeholder">
              Aucun numéro enregistré. Indiquez-le dans les{' '}
              <a href="#/parametres">paramètres</a>.
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
              <a href="#/parametres">paramètres</a>.
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
        <a href="#/parametres" className="btn btn-secondary settings-back-link">
          Paramètres
        </a>
        <a href="#/" className="btn btn-ghost settings-back-link">
          Accueil
        </a>
      </p>
    </div>
  );
}
