/**
 * Vue Maternité - Coordonnées et contact
 */

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function MaternityView() {
  const { settings } = useAppStore();
  const { maternityLabel, maternityPhone, maternityAddress } = settings;

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
      </section>

      <section
        className="card"
        aria-labelledby="maternity-maps-heading"
        hidden={!hasAddress}
      >
        <h2 id="maternity-maps-heading" className="section-title">
          Itinéraire
        </h2>

        <div className="maternity-page-address-block">
          {hasAddress ? (
            <>
              <p className="maternity-page-address">{addr}</p>
              <div className="maternity-page-maps-wrap">
                <a
                  className="maternity-page-maps-link"
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ouvrir Google Maps : itinéraire vers ${mapsDest}`}
                >
                  <svg
                    className="maternity-page-maps-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span className="maternity-page-maps-label">Itinéraire</span>
                </a>
              </div>
            </>
          ) : (
            <p className="maternity-page-address-placeholder">
              Aucune adresse enregistrée. Indiquez-la dans les{' '}
              <a href="#/parametres">paramètres</a>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
