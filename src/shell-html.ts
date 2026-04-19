/**
 * Template HTML de l'application.
 * Fonction pure : ne dépend que de Vite env, pas de l'état applicatif.
 * Toute chaîne dynamique doit être échappée via `escapeHtml` de `html-utils`.
 */
export function shellHtml(): string {
  const iconSrc = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  return `
    <a class="skip-to-content" href="#main-content">Aller au contenu principal</a>
    <div class="nav-backdrop" id="nav-backdrop" aria-hidden="true"></div>
    <nav class="app-drawer" id="app-drawer" aria-label="Menu principal" aria-hidden="true">
      <div class="drawer-header">
        <div class="drawer-header-brand">
          <img class="drawer-header-logo" src="${iconSrc}" width="40" height="40" alt="" decoding="async" />
          <span class="drawer-header-title">Menu</span>
        </div>
        <button type="button" class="drawer-close" id="btn-drawer-close" aria-label="Fermer le menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="drawer-scroll">
        <p class="drawer-section-label" id="drawer-lbl-suivi">Suivi des contractions</p>
        <ul class="drawer-nav" aria-labelledby="drawer-lbl-suivi">
          <li>
            <a class="drawer-link" data-drawer-route="home" href="#/">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
              <span class="drawer-link-label">Accueil</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
          <li>
            <a class="drawer-link" data-drawer-route="table" href="#/historique">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
              </span>
              <span class="drawer-link-label">Tableau des contractions</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
          <li>
            <a class="drawer-link" data-drawer-route="midwife" href="#/sage-femme">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              </span>
              <span class="drawer-link-label">Résumé sage-femme</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
        </ul>
        <p class="drawer-section-label" id="drawer-lbl-mat">Maternité</p>
        <ul class="drawer-nav" aria-labelledby="drawer-lbl-mat">
          <li>
            <a class="drawer-link" data-drawer-route="maternity" href="#/maternite">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 2.7A2 2 0 0 1 22 16.92z"/></svg>
              </span>
              <span class="drawer-link-label">Appeler la maternité</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
          <li id="drawer-item-message">
            <a class="drawer-link" data-drawer-route="message" href="#/message">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <span class="drawer-link-label">Message à la maternité</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
        </ul>
        <p class="drawer-section-label" id="drawer-lbl-app">Application</p>
        <ul class="drawer-nav" aria-labelledby="drawer-lbl-app">
          <li>
            <a class="drawer-link" data-drawer-route="settings" href="#/parametres">
              <span class="drawer-link-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </span>
              <span class="drawer-link-label">Paramètres et alerte</span>
              <span class="drawer-link-arrow" aria-hidden="true">›</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <main class="app" id="main-content" tabindex="-1">
      <header class="top-bar">
        <div class="top-bar-brand">
          <h1 class="top-bar-h1">
            <span class="top-bar-app-line">
              <img
                class="top-bar-logo"
                src="${iconSrc}"
                width="48"
                height="48"
                alt=""
                decoding="async"
              />
              <span class="top-bar-app-name">Miss Contraction</span>
            </span>
          </h1>
          <nav class="top-bar-bc" id="top-bar-bc-nav" aria-label="Fil d'Ariane"></nav>
        </div>
        <button
          type="button"
          class="btn-theme"
          id="btn-theme"
          aria-label="Thème automatique"
          title="Thème automatique"
        >🖥</button>
        <button
          type="button"
          class="hamburger"
          id="btn-menu"
          aria-expanded="false"
          aria-controls="app-drawer"
          aria-label="Ouvrir le menu"
        >
          <span class="hamburger-box" aria-hidden="true">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </span>
        </button>
      </header>

      <div class="maternity-quick" id="maternity-quick" hidden>
        <a class="maternity-quick__link" id="maternity-quick-link" href="tel:">
          <span class="maternity-quick__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81 2.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
          <span class="maternity-quick__body">
            <span class="maternity-quick__title" id="maternity-quick-title">Appeler la maternité</span>
            <span class="maternity-quick__tel" id="maternity-quick-tel"></span>
          </span>
        </a>
      </div>

      <div id="view-home" class="view">
        <!-- Contenu géré par React -->
      </div>

      <div id="view-settings" class="view" hidden>
        <div class="settings-page">
          <p class="subtitle settings-page-lead">
            Ajustez l'alerte, le numéro de la maternité et l'affichage. <strong class="settings-page-hint">Pensez à
            enregistrer</strong> pour appliquer les changements.
          </p>

          <nav class="settings-toc" aria-label="Aller à une section">
            <ul class="settings-toc-list">
              <li><a class="settings-toc-link" href="#settings-section-alertes">Alertes</a></li>
              <li><a class="settings-toc-link" href="#settings-section-maternite">Maternité</a></li>
              <li><a class="settings-toc-link" href="#settings-section-stats">Statistiques</a></li>
              <li><a class="settings-toc-link" href="#settings-section-confort">Confort</a></li>
              <li><a class="settings-toc-link" href="#settings-section-modules">Options du menu</a></li>
            </ul>
          </nav>

          <form class="form settings-form" id="form-settings">
            <section
              class="card settings-card"
              id="settings-section-alertes"
              aria-labelledby="settings-heading"
            >
              <h2 id="settings-heading" class="section-title">Alertes</h2>
              <p class="settings-intro">
                L'alerte se déclenche lorsque les <strong id="lbl-n">3</strong> dernières contractions sont espacées
                d'au plus <strong id="lbl-interval">5</strong> minutes et durent chacune au moins
                <strong id="lbl-dur">45</strong> secondes — à valider avec votre sage-femme.
              </p>
              <h3 class="settings-subheading">Seuil</h3>
              <div class="settings-field-grid">
                <label class="field">
                  <span>Écart max. entre débuts (min)</span>
                  <input type="number" name="maxIntervalMin" min="1" max="30" step="1" required />
                </label>
                <label class="field">
                  <span>Durée min. par contraction (s)</span>
                  <input type="number" name="minDurationSec" min="10" max="180" step="5" required />
                </label>
                <label class="field">
                  <span>Contractions consécutives</span>
                  <input type="number" name="consecutiveCount" min="2" max="12" step="1" required />
                </label>
              </div>
              <div class="settings-subsection">
                <h3 class="settings-subheading">Notifications</h3>
                <label class="field field-check">
                  <input type="checkbox" name="preAlertEnabled" id="pre-alert-check" />
                  <span>Pré-alerte si le rythme se resserre (avant le seuil complet)</span>
                </label>
                <div class="field row settings-notify-row">
                  <button type="button" class="btn btn-secondary" id="btn-notify">
                    Autoriser les notifications
                  </button>
                  <span class="notify-status" id="notify-status"></span>
                </div>
                <div class="field snooze-block">
                  <span class="snooze-label">Reporter les alertes</span>
                  <div class="snooze-actions">
                    <button type="button" class="btn btn-secondary btn-small" id="btn-snooze-30" formnovalidate>
                      30 min
                    </button>
                    <button type="button" class="btn btn-secondary btn-small" id="btn-snooze-60" formnovalidate>
                      1 h
                    </button>
                    <button type="button" class="btn btn-ghost btn-small" id="btn-snooze-clear" formnovalidate>
                      Annuler le report
                    </button>
                  </div>
                  <p class="snooze-status" id="snooze-status"></p>
                </div>
              </div>
            </section>

            <section
              class="card settings-card"
              id="settings-section-maternite"
              aria-labelledby="maternity-settings-heading"
            >
              <h2 id="maternity-settings-heading" class="section-title">Maternité</h2>
              <p class="settings-intro settings-intro--tight">
                Utilisés sur la page dédiée « Maternité » et sur le bandeau d'appel rapide en bas de l'écran lorsque le
                numéro est renseigné.
              </p>
              <label class="field field--wide">
                <span>Libellé de la maternité</span>
                <input
                  type="text"
                  name="maternityLabel"
                  maxlength="120"
                  autocomplete="organization"
                  placeholder="ex. Maternité — CHU de Nantes"
                />
              </label>
              <label class="field field--wide">
                <span>Numéro de téléphone</span>
                <input
                  type="tel"
                  name="maternityPhone"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder="ex. 0123456789"
                  maxlength="20"
                />
              </label>
              <label class="field field--wide">
                <span>Adresse de la maternité</span>
                <textarea
                  name="maternityAddress"
                  id="maternity-address-field"
                  class="settings-textarea"
                  rows="3"
                  maxlength="800"
                  placeholder="Adresse, accès parking, service…"
                  autocomplete="street-address"
                ></textarea>
              </label>
            </section>

            <section class="card settings-card" id="settings-section-stats" aria-labelledby="stats-heading">
              <h2 id="stats-heading" class="section-title">Statistiques et affichage</h2>
              <label class="field field--wide">
                <span>Fenêtre pour moyennes et graphique (accueil)</span>
                <select name="statsWindowMinutes" id="stats-window-select">
                  <option value="all">Toutes les données</option>
                  <option value="30">30 dernières minutes</option>
                  <option value="60">1 dernière heure</option>
                  <option value="120">2 dernières heures</option>
                </select>
              </label>
              <label class="field field-check field-check--spaced">
                <input type="checkbox" name="largeMode" id="large-mode-check" />
                <span>Mode grandes tailles (texte et boutons plus lisibles)</span>
              </label>
            </section>

            <section class="card settings-card" id="settings-section-confort" aria-labelledby="comfort-heading">
              <h2 id="comfort-heading" class="section-title">Confort et saisie</h2>
              <label class="field">
                <span>Rappel si « fin » non pressée après (minutes)</span>
                <input type="number" name="openContractionReminderMin" min="2" max="30" step="1" required />
              </label>
              <label class="field field-check">
                <input type="checkbox" name="keepAwakeDuringContraction" id="keep-awake-check" />
                <span>Garder l'écran allumé pendant une contraction en cours</span>
              </label>
              <label class="field field-check">
                <input type="checkbox" name="vibrationEnabled" id="vibration-check" />
                <span>Vibration courte au début et à la fin (mobile)</span>
              </label>
              <label class="field field-check" id="voice-option-field">
                <input type="checkbox" name="voiceCommandsEnabled" id="voice-check" />
                <span>Afficher le bouton de commande vocale sur l'accueil (expérimental)</span>
              </label>
            </section>

            <section class="card settings-card" id="settings-section-modules" aria-labelledby="features-heading">
              <h2 id="features-heading" class="section-title">Options du menu</h2>
              <p class="settings-intro settings-intro--tight">
                Masquez ce que vous n'utilisez pas : les entrées disparaissent du menu latéral.
              </p>
              <label class="field field-check">
                <input type="checkbox" name="moduleVoiceCommands" id="module-voice-check" />
                <span>Module commande vocale (réglages dans « Confort et saisie »)</span>
              </label>
              <label class="field field-check">
                <input type="checkbox" name="moduleMaternityMessage" id="module-message-check" />
                <span>Message à la maternité / proches (SMS, WhatsApp)</span>
              </label>
            </section>
          </form>

          <p class="settings-save-feedback" id="settings-save-feedback" role="status" aria-live="polite" hidden></p>

          <div class="settings-sticky-actions" aria-label="Enregistrer ou quitter">
            <div class="settings-sticky-row">
              <button type="submit" class="btn btn-primary settings-save-btn" form="form-settings">
                Enregistrer
              </button>
              <a href="#/" class="settings-back-inline">Accueil</a>
            </div>
          </div>
        </div>
      </div>
      <div id="view-maternity" class="view" hidden>
        <!-- Contenu géré par React -->
      </div>

      <div id="view-message" class="view" hidden>
        <!-- Contenu géré par React -->
      </div>

      <div id="view-table" class="view" hidden>
        <!-- Contenu géré par React -->
      </div>

      <div id="view-midwife" class="view" hidden>
        <!-- Contenu géré par React -->
      </div>

      <dialog class="edit-dialog" id="edit-contraction-dialog" aria-labelledby="edit-dialog-title">
        <form id="edit-contraction-form" class="edit-dialog-form">
          <h3 id="edit-dialog-title" class="edit-dialog-title">Modifier la contraction</h3>
          <label class="field">
            <span>Début</span>
            <input type="datetime-local" id="edit-start" name="start" step="1" required />
          </label>
          <label class="field">
            <span>Fin</span>
            <input type="datetime-local" id="edit-end" name="end" step="1" required />
          </label>
          <div class="field">
            <span class="field-label">Intensité de la douleur</span>
            <div class="intensity-picker" id="edit-intensity-picker">
              <input type="radio" name="intensity" value="1" id="int-1" class="sr-only" />
              <label for="int-1" class="btn-intensity" title="Très faible">1</label>
              <input type="radio" name="intensity" value="2" id="int-2" class="sr-only" />
              <label for="int-2" class="btn-intensity" title="Faible">2</label>
              <input type="radio" name="intensity" value="3" id="int-3" class="sr-only" />
              <label for="int-3" class="btn-intensity" title="Moyenne">3</label>
              <input type="radio" name="intensity" value="4" id="int-4" class="sr-only" />
              <label for="int-4" class="btn-intensity" title="Forte">4</label>
              <input type="radio" name="intensity" value="5" id="int-5" class="sr-only" />
              <label for="int-5" class="btn-intensity" title="Très forte">5</label>
              <button type="button" class="btn btn-ghost btn-tiny" id="btn-edit-intensity-clear">Effacer</button>
            </div>
          </div>
          <label class="field">
            <span>Note (optionnelle)</span>
            <textarea id="edit-note" name="note" rows="2" maxlength="240" placeholder="Ex. plus intense, repos…"></textarea>
          </label>
          <div class="quick-notes" id="edit-quick-notes">
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Ballon">🎈 Ballon</button>
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Marche">🚶 Marche</button>
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Repos">🛌 Repos</button>
            <button type="button" class="btn btn-ghost btn-tiny" data-note="Douche">🚿 Douche</button>
          </div>
          <p class="edit-dialog-error" id="edit-dialog-error" role="alert"></p>
          <div class="edit-dialog-buttons">
            <button type="button" class="btn btn-secondary" id="edit-dialog-cancel">Annuler</button>
            <button type="submit" class="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </dialog>

      <!-- Vagues décoratives apaisantes -->
      <div class="wave-container" aria-hidden="true">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
      </div>
    </main>
  `;
}
