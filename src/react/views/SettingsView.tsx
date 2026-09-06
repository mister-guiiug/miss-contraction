import { Link } from 'react-router-dom';
/**
 * Vue Paramètres - Migration progressive vers React
 * Cette version React coexiste avec la version vanilla
 */

import { useEffect, useRef, useState } from 'react';
import { downloadText } from '@mister-guiiug/dev-pwa-config/download';
import { shareOrCopy } from '@mister-guiiug/dev-pwa-config/share';
import { useAppStore } from '../store/useAppStore';
import {
  backupFileName,
  exportSnapshotJson,
  importSnapshotJson,
  setSnoozeUntilMs,
  clearSnoozeUntil,
  loadSettings,
} from '../../storage';
import { LANGUAGE_LABELS, interpolate, t, type AppLanguage } from '../../i18n';
import { HighContrastToggle } from '../components/settings/HighContrastToggle';
import { ViewLayout } from '../components/layout/ViewLayout';
import { BACKUP_SECTION_ID } from './backupSection';

/**
 * Le message d'un import refusé, dit à quelqu'un et non à un journal.
 *
 * `versioned-store.import()` lève une phrase préfixée de son propre nom et
 * range la vraie raison dans `cause` — c'est la garde de l'application qui
 * sait dire « fichier d'une autre application », le socle ne sait dire que
 * « le format ne correspond pas ». On préfère donc la cause quand elle existe,
 * et l'on retire le préfixe technique sinon : « version 3 inconnue — fichier
 * exporté par une version plus récente de l'app ? » se lit très bien.
 */
function importErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  if (cause instanceof Error && cause.message) return cause.message;
  return error.message.replace(/^versioned-store:\s*/, '');
}

const SETTINGS_COPY = {
  fr: {
    saved: 'Paramètres enregistrés !',
    leadPrefix:
      "Ajustez les alertes, les coordonnées de la maternité et l'affichage.",
    leadHint: 'Pensez à enregistrer',
    leadSuffix: 'pour appliquer les changements.',
    tocAria: 'Aller à une section',
    sectionAlerts: 'Alertes',
    sectionMaternity: 'Maternité',
    sectionStats: 'Statistiques',
    sectionComfort: 'Confort',
    sectionModules: 'Options du menu',
    home: 'Accueil',
    save: 'Enregistrer',
  },
  en: {
    saved: 'Settings saved!',
    leadPrefix: 'Adjust alerts, maternity contacts, and display preferences.',
    leadHint: 'Remember to save',
    leadSuffix: 'to apply your changes.',
    tocAria: 'Go to a section',
    sectionAlerts: 'Alerts',
    sectionMaternity: 'Maternity',
    sectionStats: 'Statistics',
    sectionComfort: 'Comfort',
    sectionModules: 'Menu options',
    home: 'Home',
    save: 'Save',
  },
} as const;

export function SettingsView() {
  const { settings, records, updateSettings, saveSettings, adoptSnapshot } =
    useAppStore();
  const language = settings.language;
  const copy = language === 'fr' ? SETTINGS_COPY.fr : SETTINGS_COPY.en;
  const [formData, setFormData] = useState(() => loadSettings());
  const [saveStatus, setSaveStatus] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<{
    tone: 'ok' | 'error';
    text: string;
  } | null>(null);
  const [notifyPermission, setNotifyPermission] =
    useState<NotificationPermission>(() => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission;
      }
      return 'default';
    });

  // Recharger les settings depuis localStorage au montage
  // pour synchroniser avec les modifications faits par le code vanilla
  useEffect(() => {
    const freshSettings = loadSettings();
    updateSettings(freshSettings);
  }, [updateSettings]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...(name === 'moduleVoiceCommands' && !checked
        ? { ...prev, moduleVoiceCommands: false, voiceCommandsEnabled: false }
        : {
            ...prev,
            [name]:
              type === 'checkbox'
                ? checked
                : type === 'number'
                  ? Number(value)
                  : value,
          }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    saveSettings();
    setSaveStatus(copy.saved);
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
    setSaveStatus(
      language === 'fr'
        ? `Alertes suspendues pendant ${minutes} min`
        : `Alerts snoozed for ${minutes} min`
    );
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleClearSnooze = () => {
    clearSnoozeUntil();
    setSaveStatus(
      language === 'fr' ? 'Alertes réactivées' : 'Alerts re-enabled'
    );
    setTimeout(() => setSaveStatus(''), 3000);
  };

  /* ── Sauvegarde : exporter, partager, réimporter ───────────────────────── */

  const download = (json: string) => {
    const filename = backupFileName();
    const ok = downloadText(json, filename, 'application/json');
    setBackupStatus(
      ok
        ? {
            tone: 'ok',
            text: interpolate(t(language, 'backup.exported'), {
              file: filename,
            }),
          }
        : { tone: 'error', text: t(language, 'backup.failed') }
    );
  };

  const handleExport = () => {
    const json = exportSnapshotJson();
    if (json === null) {
      setBackupStatus({ tone: 'error', text: t(language, 'backup.failed') });
      return;
    }
    download(json);
  };

  /**
   * Le partage natif d'abord, le téléchargement en repli.
   *
   * L'app est faite pour TRANSMETTRE — tout un écran ne sert qu'à composer le
   * message pour la maternité. Envoyer le fichier depuis la feuille de partage
   * du téléphone est donc le geste attendu, et non un raffinement.
   *
   * `navigator.share` est interrogé AVANT `shareOrCopy` : sans lui, le socle
   * se rabat sur le presse-papiers, et un journal de contractions dans le
   * presse-papiers n'est pas une sauvegarde. Là où le partage n'existe pas, un
   * fichier téléchargé, lui, en est une.
   */
  const handleShare = async () => {
    const json = exportSnapshotJson();
    if (json === null) {
      setBackupStatus({ tone: 'error', text: t(language, 'backup.failed') });
      return;
    }
    const canShare =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    if (!canShare) {
      download(json);
      return;
    }
    const result = await shareOrCopy({
      title: `${t(language, 'app.name')} — ${backupFileName()}`,
      text: json,
    });
    if (result === 'shared') {
      setBackupStatus({ tone: 'ok', text: t(language, 'backup.shared') });
    } else if (result === 'copied') {
      setBackupStatus({ tone: 'ok', text: t(language, 'backup.copied') });
    } else if (result === 'failed') {
      download(json);
    }
    // « cancelled » : elle a fermé la feuille de partage. Ne rien afficher.
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Remis à zéro tout de suite : rechoisir DEUX fois le même fichier doit
    // relancer l'import, et un `<input type=file>` ne signale pas un choix
    // identique au précédent.
    e.target.value = '';
    if (!file) return;

    // L'import REMPLACE. On ne le demande que s'il y a quelque chose à perdre.
    if (
      records.length > 0 &&
      !confirm(
        interpolate(t(language, 'backup.confirmReplace'), {
          count: records.length,
        })
      )
    ) {
      return;
    }

    try {
      const text = await file.text();
      const snapshot = importSnapshotJson(text);
      adoptSnapshot(snapshot);
      setFormData(snapshot.settings);
      setBackupStatus({
        tone: 'ok',
        text: interpolate(t(language, 'backup.imported'), {
          count: snapshot.records.length,
        }),
      });
    } catch (error) {
      setBackupStatus({
        tone: 'error',
        text: interpolate(t(language, 'backup.importFailed'), {
          error: importErrorMessage(error),
        }),
      });
    }
  };

  return (
    <ViewLayout
      className="settings-page"
      dataTestId="settings-view"
      title={t(language, 'route.settings')}
      lead={
        <>
          {copy.leadPrefix}{' '}
          <strong className="settings-page-hint">{copy.leadHint}</strong>{' '}
          {copy.leadSuffix}
        </>
      }
    >
      <nav className="settings-toc" aria-label={copy.tocAria}>
        <ul className="settings-toc-list">
          <li>
            <a className="settings-toc-link" href="#settings-section-language">
              {t(language, 'settings.language.title')}
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-alertes">
              {copy.sectionAlerts}
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-maternite">
              {copy.sectionMaternity}
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-stats">
              {copy.sectionStats}
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-confort">
              {copy.sectionComfort}
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href="#settings-section-modules">
              {copy.sectionModules}
            </a>
          </li>
          <li>
            <a className="settings-toc-link" href={`#${BACKUP_SECTION_ID}`}>
              {t(language, 'backup.title')}
            </a>
          </li>
        </ul>
      </nav>

      <form
        className="form settings-form"
        id="form-settings"
        onSubmit={handleSubmit}
        data-testid="settings-form"
      >
        <section
          className="card settings-card"
          id="settings-section-language"
          aria-labelledby="settings-language-heading"
          data-testid="settings-section-language"
        >
          <h2 id="settings-language-heading" className="section-title">
            {t(language, 'settings.language.title')}
          </h2>
          <label className="field field--wide">
            <span>{t(language, 'settings.language.label')}</span>
            <select
              name="language"
              data-testid="language-select"
              value={formData.language}
              onChange={e => {
                const newLanguage = e.target.value as AppLanguage;
                setFormData(prev => ({
                  ...prev,
                  language: newLanguage,
                }));
                updateSettings({ language: newLanguage });
                saveSettings();
                setSaveStatus(t(newLanguage, 'settings.language.changed'));
                setTimeout(() => setSaveStatus(''), 2000);
              }}
            >
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="settings-intro settings-intro--tight">
            {t(language, 'settings.language.help')}
          </p>
        </section>

        {/* Section Alertes */}
        <section
          className="card settings-card"
          id="settings-section-alertes"
          aria-labelledby="settings-heading"
          data-testid="settings-section-alerts"
        >
          <h2 id="settings-heading" className="section-title">
            {copy.sectionAlerts}
          </h2>
          <p className="settings-intro">
            L'alerte se déclenche lorsque les{' '}
            <strong id="lbl-n">{formData.consecutiveCount}</strong> dernières
            contractions sont espacées d'au plus{' '}
            <strong id="lbl-interval">{formData.maxIntervalMin}</strong> minutes
            et durent chacune au moins{' '}
            <strong id="lbl-dur">{formData.minDurationSec}</strong> secondes — à
            valider avec votre sage-femme.
          </p>
          <h3 className="settings-subheading">
            {language === 'fr' ? 'Seuil' : 'Threshold'}
          </h3>
          <div className="settings-field-grid">
            <label className="field">
              <span>
                {language === 'fr'
                  ? 'Écart max. entre débuts (min)'
                  : 'Max gap between starts (min)'}
              </span>
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
              <span>
                {language === 'fr'
                  ? 'Durée min. par contraction (s)'
                  : 'Minimum duration per contraction (s)'}
              </span>
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
              <span>
                {language === 'fr'
                  ? 'Contractions consécutives'
                  : 'Consecutive contractions'}
              </span>
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
            <h3 className="settings-subheading">
              {language === 'fr' ? 'Notifications' : 'Notifications'}
            </h3>
            <label className="field field-check">
              <input
                type="checkbox"
                name="preAlertEnabled"
                id="pre-alert-check"
                data-testid="pre-alert-check"
                checked={formData.preAlertEnabled}
                onChange={handleChange}
              />
              <span>
                {language === 'fr'
                  ? 'Pré-alerte si le rythme se resserre (avant le seuil complet)'
                  : 'Pre-alert when rhythm tightens (before full threshold)'}
              </span>
            </label>
            <div className="field row settings-notify-row">
              <button
                type="button"
                className="btn btn-secondary"
                data-testid="request-notification-btn"
                onClick={requestNotificationPermission}
              >
                {language === 'fr'
                  ? 'Autoriser les notifications'
                  : 'Allow notifications'}
              </button>
              <span className="notify-status" data-testid="notification-status">
                {notifyPermission === 'granted'
                  ? language === 'fr'
                    ? 'Allowed'
                    : 'Allowed'
                  : notifyPermission === 'denied'
                    ? language === 'fr'
                      ? 'Blocked'
                      : 'Blocked'
                    : language === 'fr'
                      ? 'Not set'
                      : 'Not set'}
              </span>
            </div>
            <div className="field snooze-block">
              <span className="snooze-label">
                {language === 'fr' ? 'Reporter les alertes' : 'Snooze alerts'}
              </span>
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
                  {language === 'fr' ? 'Annuler le report' : 'Clear snooze'}
                </button>
              </div>
              <p
                className="snooze-status"
                id="snooze-status"
                data-testid="snooze-status"
              >
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
            {copy.sectionMaternity}
          </h2>
          <p className="settings-intro settings-intro--tight">
            Utilisés sur la page dédiée « Maternité » et sur le bandeau d'appel
            rapide en bas de l'écran lorsque le numéro est renseigné.
          </p>
          <label className="field field--wide">
            <span>
              {language === 'fr'
                ? 'Libellé de la maternité'
                : 'Maternity label'}
            </span>
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
            <span>
              {language === 'fr' ? 'Numéro de téléphone' : 'Phone number'}
            </span>
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
            <span>
              {language === 'fr'
                ? 'Adresse de la maternité'
                : 'Maternity address'}
            </span>
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
        <section
          className="card settings-card"
          id="settings-section-stats"
          aria-labelledby="stats-heading"
          data-testid="settings-section-stats"
        >
          <h2 id="stats-heading" className="section-title">
            {language === 'fr'
              ? 'Statistiques et affichage'
              : 'Statistics and display'}
          </h2>
          <label className="field field--wide">
            <span>
              {language === 'fr'
                ? 'Fenêtre pour moyennes et graphique (accueil)'
                : 'Window for averages and chart (home)'}
            </span>
            <select
              name="statsWindowMinutes"
              id="stats-window-select"
              data-testid="stats-window-select"
              value={formData.statsWindowMinutes}
              onChange={handleChange}
            >
              <option value="all">
                {language === 'fr' ? 'Toutes les données' : 'All data'}
              </option>
              <option value="30">
                {language === 'fr' ? '30 dernières minutes' : 'Last 30 minutes'}
              </option>
              <option value="60">
                {language === 'fr' ? 'Dernière heure' : 'Last hour'}
              </option>
              <option value="120">
                {language === 'fr' ? 'Dernières 2 heures' : 'Last 2 hours'}
              </option>
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
            <span>
              {language === 'fr'
                ? 'Mode grandes tailles (texte et boutons plus lisibles)'
                : 'Large mode (larger text and buttons)'}
            </span>
          </label>
          <HighContrastToggle />
        </section>

        {/* Section Confort */}
        <section
          className="card settings-card"
          id="settings-section-confort"
          aria-labelledby="comfort-heading"
          data-testid="settings-section-comfort"
        >
          <h2 id="comfort-heading" className="section-title">
            {language === 'fr' ? 'Confort et saisie' : 'Comfort and input'}
          </h2>
          <label className="field">
            <span>
              {language === 'fr'
                ? 'Rappel si fin non pressée après (minutes)'
                : 'Reminder if end is not pressed after (minutes)'}
            </span>
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
            <span>
              {language === 'fr'
                ? "Garder l'écran allumé pendant une contraction en cours"
                : 'Keep screen awake during an active contraction'}
            </span>
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
            <span>
              {language === 'fr'
                ? 'Vibration courte au début et à la fin (mobile)'
                : 'Short vibration at start and end (mobile)'}
            </span>
          </label>
          <label className="field field-check">
            <input
              type="checkbox"
              name="voiceAnnounceDuration"
              id="voice-announce-check"
              data-testid="voice-announce-check"
              checked={formData.voiceAnnounceDuration}
              onChange={handleChange}
            />
            <span>Annoncer la durée vocalement à la fin d'une contraction</span>
          </label>
          <label
            className="field field-check"
            id="voice-option-field"
            hidden={!formData.moduleVoiceCommands}
          >
            <input
              type="checkbox"
              name="voiceCommandsEnabled"
              id="voice-check"
              data-testid="voice-commands-check"
              checked={formData.voiceCommandsEnabled}
              onChange={handleChange}
            />
            <span>
              {language === 'fr'
                ? "Afficher le bouton de commande vocale sur l'accueil (expérimental)"
                : 'Show voice command button on home screen (experimental)'}
            </span>
          </label>
        </section>

        {/* Section Modules */}
        <section
          className="card settings-card"
          id="settings-section-modules"
          aria-labelledby="features-heading"
          data-testid="settings-section-modules"
        >
          <h2 id="features-heading" className="section-title">
            {copy.sectionModules}
          </h2>
          <p className="settings-intro settings-intro--tight">
            Masquez ce que vous n'utilisez pas : les entrées disparaissent du
            menu latéral.
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
            <span>
              {language === 'fr'
                ? 'Module commande vocale (réglages dans Confort et saisie)'
                : 'Voice command module (settings in Comfort and input)'}
            </span>
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
            <span>
              {language === 'fr'
                ? 'Message à la maternité / proches (SMS, WhatsApp)'
                : 'Message to maternity or contacts (SMS, WhatsApp)'}
            </span>
          </label>
        </section>

        {/*
          Section Sauvegarde.

          LA PROMESSE DU README EXISTE ENFIN. « Export JSON — téléchargement ou
          partage natif de l'historique et des réglages » était écrit depuis le
          premier jour, et le bandeau de l'accueil l'a répété tous les sept
          jours à des utilisatrices qui n'ont jamais trouvé le bouton : il n'y
          avait aucun code d'export dans `src/`.

          Les boutons ne sont PAS `type="submit"` : ils vivent dans le
          formulaire des réglages pour hériter de sa mise en page, mais aucun
          d'eux n'enregistre les réglages.
        */}
        <section
          className="card settings-card"
          id={BACKUP_SECTION_ID}
          aria-labelledby="backup-heading"
          data-testid="settings-section-backup"
        >
          <h2 id="backup-heading" className="section-title">
            {t(language, 'backup.title')}
          </h2>
          <p className="settings-intro settings-intro--tight">
            {t(language, 'backup.intro')}
          </p>
          <div className="snooze-actions">
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="export-backup-btn"
              onClick={handleExport}
            >
              {t(language, 'backup.export')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="share-backup-btn"
              onClick={() => void handleShare()}
            >
              {t(language, 'backup.share')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="import-backup-btn"
              onClick={() => fileInput.current?.click()}
            >
              {t(language, 'backup.import')}
            </button>
          </div>
          {/*
            Le vrai champ est masqué visuellement, pas retiré de l'arbre : il
            garde son nom accessible, et un test peut lui donner un fichier
            sans passer par la boîte de dialogue du système.
          */}
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label={t(language, 'backup.import')}
            data-testid="import-backup-input"
            onChange={e => void handleImportFile(e)}
          />
          <p className="settings-intro settings-intro--tight">
            {t(language, 'backup.importHelp')}
          </p>
          {backupStatus && (
            <p
              className="settings-save-feedback"
              role={backupStatus.tone === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              data-testid="backup-feedback"
            >
              {backupStatus.text}
            </p>
          )}
        </section>
      </form>

      {saveStatus && (
        <p
          className="settings-save-feedback"
          role="status"
          aria-live="polite"
          data-testid="settings-save-feedback"
        >
          {saveStatus}
        </p>
      )}

      <div
        className="settings-sticky-actions"
        aria-label={
          language === 'fr' ? 'Enregistrer ou quitter' : 'Save or quit'
        }
      >
        <div className="settings-sticky-row">
          <button
            type="submit"
            form="form-settings"
            className="btn btn-primary settings-save-btn"
            data-testid="settings-save-btn"
          >
            {copy.save}
          </button>
          <Link
            to="/"
            className="settings-back-inline mobile-home-link"
            data-testid="settings-back-link"
          >
            {copy.home}
          </Link>
        </div>
      </div>
    </ViewLayout>
  );
}
