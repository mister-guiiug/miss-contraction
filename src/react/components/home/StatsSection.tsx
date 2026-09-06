import { useAppStore } from '../../store/useAppStore';
import { useStats } from '../../hooks/useStats';
import { t } from '../../../i18n';

/**
 * Les indicateurs de l'accueil : trois moyennes et trois repères bruts.
 *
 * Le verdict de seuil n'est plus ici — il est remonté sous le chronomètre,
 * dans `ThresholdBadge`. Les intervalles détaillés non plus : la colonne
 * « Écart » du tableau de `/historique` les donne déjà, avec la date et la
 * fréquence en prime.
 */
export function StatsSection() {
  const { records, settings } = useAppStore();
  const language = settings.language;
  const { data, windowLabel, isEmpty } = useStats(records, settings);

  return (
    <section
      className="card"
      aria-labelledby="summary-heading"
      data-testid="stats-section"
    >
      <h2 id="summary-heading" className="section-title">
        {t(language, 'stats.title')}
      </h2>
      <div
        className="stats-enhanced"
        role="group"
        aria-label={t(language, 'stats.summaryAria')}
        data-testid="stats-cards"
      >
        <div className="stat-card" data-testid="stat-card-quantity">
          <span className="stat-card-icon" aria-hidden="true" />
          <span className="stat-card-value" data-testid="stat-value-qty">
            {data.qtyPerHour}
          </span>
          <span className="stat-card-label">{t(language, 'stats.qty')}</span>
        </div>
        <div className="stat-card" data-testid="stat-card-duration">
          <span className="stat-card-icon" aria-hidden="true" />
          <span className="stat-card-value" data-testid="stat-value-duration">
            {data.avgDuration}
          </span>
          <span className="stat-card-label">
            {t(language, 'stats.avgDuration')}
          </span>
        </div>
        <div className="stat-card" data-testid="stat-card-frequency">
          <span className="stat-card-icon" aria-hidden="true" />
          <span className="stat-card-value" data-testid="stat-value-frequency">
            {data.avgFrequency}
          </span>
          <span className="stat-card-label">
            {t(language, 'stats.avgFrequency')}
          </span>
        </div>
      </div>
      <p
        className="stats-window-label"
        id="stats-window-label"
        data-testid="stats-window-label"
      >
        {windowLabel}
      </p>
      {!isEmpty && (
        <dl
          className="summary summary-extra"
          id="summary-extra"
          data-testid="stats-details"
        >
          <dt>{t(language, 'stats.lastHour')}</dt>
          <dd>{data.lastHourCount}</dd>
          <dt>{t(language, 'stats.lastInterval')}</dt>
          <dd>{data.lastInterval}</dd>
          <dt>{t(language, 'stats.lastDuration')}</dt>
          <dd>{data.lastDuration}</dd>
        </dl>
      )}
    </section>
  );
}
