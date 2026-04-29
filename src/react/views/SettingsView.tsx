import { Link } from 'react-router-dom';
/**
 * Vue Paramètres - Migration progressive vers React
 * Cette version React coexiste avec la version vanilla
 */

import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { setSnoozeUntilMs, clearSnoozeUntil, loadSettings } from '../../storage';
import { HighContrastToggle } from '../components/settings/HighContrastToggle';
import { ViewLayout } from '../components/layout/ViewLayout';

export function SettingsView() {
  const { settings, updateSettings, saveSettings } = useAppStore();
  const [formData, setFormData] = useState(settings);
  const [saveStatus, setSaveStatus] = useState('');
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission>('default');

  // Recharger les settings depuis localStorage au montage
  // pour synchroniser avec les modifications faits par le code vanilla
  useEffect(() => {
    const freshSettings = loadSettings();
    updateSettings(freshSettings);
    setFormData(freshSettings);
  }, [updateSettings]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    saveSettings();
    setSaveStatus('Paramètres enregistrés !');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifyPermission(permission);
    }
  };

  const handleSnooze = (minutes: number) => {
    const until = Date.now() + minutes * 60 * 1000;
    setSnoozeUntilMs(until);
    setSaveStatus(`Alertes suspendues pendant ${minutes} min`);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleClearSnooze = () => {
    clearSnoozeUntil();
    setSaveStatus('Alertes réactivées');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <ViewLayout
      className="settings-page"
      dataTestId="settings-view"
      title="Parametres et alertes"
      lead={
        <>
          Ajustez l'alerte, le numero de la maternite et l'affichage.{' '}
          <strong className="settings-page-hint">Pensez a enregistrer</strong> pour appliquer les
          changements.
        </>
      }
    >

      <nav className="settings-toc" aria-label="Aller à une section">
        <ul className="settings-toc-list">
          <li>
            <a className="settings-toc-link" href="#settings-section-alertes">
              Alertes
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-maternite">
              Maternité
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-stats">
              Statistiques
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-confort">
              Confort
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-modules">
              Options du menu
            </a>
          </li>
        </ul>
      </nav>

      <form className="form settings-form" id="form-settings" onSubmit={handleSubmit} data-testid="settings-form">
        {/* Section Alertes */}
        <section
          className="card settings-card"
          id="settings-section-alertes"
          aria-labelledby="settings-heading"
          data-testid="settings-section-alerts"
        >
          <h2 id="settings-heading" className="section-title">
            Alertes
          </h2>
          <p className="settings-intro">
            L'alerte se déclenche lorsque les <strong id="lbl-n">{formData.consecutiveCount}</strong>{' '}
            dernières contractions sont espacées d'au plus{' '}
            <strong id="lbl-interval">{formData.maxIntervalMin}</strong> minutes et durent chacune au
            moins <strong id="lbl-dur">{formData.minDurationSec}</strong> secondes — à valider avec
            votre sage-femme.
          </p>
          <h3 className="settings-subheading">Seuil</h3>
          <div className="settings-field-grid">
            <label className="field">
              <span>Écart max. entre débuts (min)</span>
              <input
                type="number"
                name="maxIntervalMin"
                data-testid="max-interval-input"
                min={1}
                max={30}
                step={1}
                required
                value={formData.maxIntervalMin}
                onChange={handleChange}
              />
            </label>
            <label className="field">
              <span>Durée min. par contraction (s)</span>
              <input
                type="number"
                name="minDurationSec"
                data-testid="min-duration-input"
                min={10}
                max={180}
                step={5}
                required
                value={formData.minDurationSec}
                onChange={handleChange}
              />
            </label>
            <label className="field">
              <span>Contractions consécutives</span>
              <input
                type="number"
                name="consecutiveCount"
                data-testid="consecutive-count-input"
                min={2}
                max={12}
                step={1}
                required
                value={formData.consecutiveCount}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className="settings-subsection">
            <h3 className="settings-subheading">Notifications</h3>
            <label className="field field-check">
              <input
                type="checkbox"
                name="preAlertEnabled"
                id="pre-alert-check"
                data-testid="pre-alert-check"
                checked={formData.preAlertEnabled}
                onChange={handleChange}
              />
              <span>Pré-alerte si le rythme se resserre (avant le seuil complet)</span>
            </label>
            <div className="field row settings-notify-row">
              <button
                type="button"
                className="btn btn-secondary"
                data-testid="request-notification-btn"
                onClick={requestNotificationPermission}
              >
                Autoriser les notifications
              </button>
              <span className="notify-status" data-testid="notification-status">
                {notifyPermission === 'granted'
                  ? '✓ Autorisées'
                  : notifyPermission === 'denied'
                    ? '✗ Bloquées'
                    : 'Non définies'}
              </span>
            </div>
            <div className="field snooze-block">
              <span className="snooze-label">Reporter les alertes</span>
              <div className="snooze-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  data-testid="snooze-30min-btn"
                  onClick={() => handleSnooze(30)}
                >
                  30 min
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  data-testid="snooze-60min-btn"
                  onClick={() => handleSnooze(60)}
                >
                  1 h
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  data-testid="clear-snooze-btn"
                  onClick={handleClearSnooze}
                >
                  Annuler le report
                </button>
              </div>
              <p className="snooze-status" id="snooze-status" data-testid="snooze-status">
                {saveStatus}
              </p>
            </div>
          </div>
        </section>

        {/* Section Maternité */}
        <section
          className="card settings-card"
          id="settings-section-maternite"
          aria-labelledby="maternity-settings-heading"
          data-testid="settings-section-maternity"
        >
          <h2 id="maternity-settings-heading" className="section-title">
            Maternité
          </h2>
          <p className="settings-intro settings-intro--tight">
            Utilisés sur la page dédiée « Maternité » et sur le bandeau d'appel rapide en bas de
            l'écran lorsque le numéro est renseigné.
          </p>
          <label className="field field--wide">
            <span>Libellé de la maternité</span>
            <input
              type="text"
              name="maternityLabel"
              data-testid="maternity-label-input"
              maxLength={120}
              autoComplete="organization"
              placeholder="ex. Maternité — CHU de Nantes"
              value={formData.maternityLabel}
              onChange={handleChange}
            />
          </label>
          <label className="field field--wide">
            <span>Numéro de téléphone</span>
            <input
              type="tel"
              name="maternityPhone"
              data-testid="maternity-phone-input"
              inputMode="tel"
              autoComplete="tel"
              placeholder="ex. 0123456789"
              maxLength={20}
              value={formData.maternityPhone}
              onChange={handleChange}
            />
          </label>
          <label className="field field--wide">
            <span>Adresse de la maternité</span>
            <textarea
              name="maternityAddress"
              id="maternity-address-field"
              data-testid="maternity-address-textarea"
              className="settings-textarea"
              rows={3}
              maxLength={800}
              placeholder="Adresse, accès parking, service…"
              autoComplete="street-address"
              value={formData.maternityAddress}
              onChange={handleChange}
            />
          </label>
        </section>

        {/* Section Statistiques */}
        <section className="card settings-card" id="settings-section-stats" aria-labelledby="stats-heading" data-testid="settings-section-stats">
          <h2 id="stats-heading" className="section-title">
            Statistiques et affichage
          </h2>
          <label className="field field--wide">
            <span>Fenêtre pour moyennes et graphique (accueil)</span>
            <select
              name="statsWindowMinutes"
              id="stats-window-select"
              data-testid="stats-window-select"
              value={formData.statsWindowMinutes}
              onChange={handleChange}
            >
              <option value="all">Toutes les données</option>
              <option value="30">30 dernières minutes</option>
              <option value="60">1 dernière heure</option>
              <option value="120">2 dernières heures</option>
            </select>
          </label>
          <label className="field field-check field-check--spaced">
            <input
              type="checkbox"
              name="largeMode"
              id="large-mode-check"
              data-testid="large-mode-check"
              checked={formData.largeMode}
              onChange={handleChange}
            />
            <span>Mode grandes tailles (texte et boutons plus lisibles)</span>
          </label>
          <HighContrastToggle />
        </section>

        {/* Section Confort */}
        <section className="card settings-card" id="settings-section-confort" aria-labelledby="comfort-heading" data-testid="settings-section-comfort">
          <h2 id="comfort-heading" className="section-title">
            Confort et saisie
          </h2>
          <label className="field">
            <span>Rappel si « fin » non pressée après (minutes)</span>
            <input
              type="number"
              name="openContractionReminderMin"
              data-testid="reminder-delay-input"
              min={2}
              max={30}
              step={1}
              required
              value={formData.openContractionReminderMin}
              onChange={handleChange}
            />
          </label>
          <label className="field field-check">
            <input
              type="checkbox"
              name="keepAwakeDuringContraction"
              id="keep-awake-check"
              data-testid="keep-awake-check"
              checked={formData.keepAwakeDuringContraction}
              onChange={handleChange}
            />
            <span>Garder l'écran allumé pendant une contraction en cours</span>
          </label>
          <label className="field field-check">
            <input
              type="checkbox"
              name="vibrationEnabled"
              id="vibration-check"
              data-testid="vibration-check"
              checked={formData.vibrationEnabled}
              onChange={handleChange}
            />
            <span>Vibration courte au début et à la fin (mobile)</span>
          </label>
          <label className="field field-check" id="voice-option-field">
            <input
              type="checkbox"
              name="voiceCommandsEnabled"
              id="voice-check"
              data-testid="voice-commands-check"
              checked={formData.voiceCommandsEnabled}
              onChange={handleChange}
            />
            <span>Afficher le bouton de commande vocale sur l'accueil (expérimental)</span>
          </label>
        </section>

        {/* Section Modules */}
        <section className="card settings-card" id="settings-section-modules" aria-labelledby="features-heading" data-testid="settings-section-modules">
          <h2 id="features-heading" className="section-title">
            Options du menu
          </h2>
          <p className="settings-intro settings-intro--tight">
            Masquez ce que vous n'utilisez pas : les entrées disparaissent du menu latéral.
          </p>
          <label className="field field-check">
            <input
              type="checkbox"
              name="moduleVoiceCommands"
              id="module-voice-check"
              data-testid="module-voice-commands-check"
              checked={formData.moduleVoiceCommands}
              onChange={handleChange}
            />
            <span>Module commande vocale (réglages dans « Confort et saisie »)</span>
          </label>
          <label className="field field-check">
            <input
              type="checkbox"
              name="moduleMaternityMessage"
              id="module-message-check"
              data-testid="module-maternity-message-check"
              checked={formData.moduleMaternityMessage}
              onChange={handleChange}
            />
            <span>Message à la maternité / proches (SMS, WhatsApp)</span>
          </label>
        </section>
      </form>

      {saveStatus && (
        <p className="settings-save-feedback" role="status" aria-live="polite" data-testid="settings-save-feedback">
          {saveStatus}
        </p>
      )}

      <div className="settings-sticky-actions" aria-label="Enregistrer ou quitter">
        <div className="settings-sticky-row">
          <button type="submit" form="form-settings" className="btn btn-primary settings-save-btn" data-testid="settings-save-btn">
            Enregistrer
          </button>
          <Link to="/" className="settings-back-inline mobile-home-link" data-testid="settings-back-link">
            Accueil
          </Link>
        </div>
      </div>
    </ViewLayout>
  );
}
