import type { AppSettings, ContractionRecord } from "./storage";
import {
  KEY_EXPORT_NUDGE_DISMISSED,
  clearSnoozeUntil,
  loadRecords,
  loadSettings,
  loadSnoozeUntil,
  saveRecords,
  saveSettings,
  setSnoozeUntilMs,
} from "./storage";
import {
  computeThresholdBadge,
  filterRecordsByStatsWindow,
  findFirstThresholdMatchEndMs,
  getRecentIntervalsMs,
} from "./statsHelpers";
import type { AppRoute } from "./router";
import { parseRoute, getBreadcrumbLabel, getDocumentTitle } from "./router";
import { focusMainContent } from "./focus-utils";
import { cycleThemePreference, getStoredThemePreference } from "./theme";

type State = {
  records: ContractionRecord[];
  settings: AppSettings;
  activeStart: number | null;
  /** Évite de renvoyer la même alerte tant que le rythme reste « dans les clous ». */
  alertLatch: boolean;
};

const state: State = {
  records: loadRecords(),
  settings: loadSettings(),
  activeStart: null,
  alertLatch: false,
};

let tickHandle: ReturnType<typeof setInterval> | null = null;

let settingsSaveFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

let editingRecordId: string | null = null;

/** Wake Lock API (écran allumé). */
let wakeLockSentinel: WakeLockSentinel | null = null;

let openSessionReminderTimer: ReturnType<typeof setInterval> | null = null;
let longOpenNotified = false;

let pendingUndo: { id: string; timeoutId: ReturnType<typeof setTimeout> } | null =
  null;

let preAlertLatch = false;

/** Bandeau pré-alerte masqué manuellement jusqu’à la prochaine contraction enregistrée. */
let preAlertBannerDismissed = false;

let recognitionInstance: SpeechRecognitionInstance | null = null;

const MATERNITY_MESSAGE_STORAGE_KEY = "mc_maternity_message_v1";

const EXPORT_NUDGE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

const UNDO_MS = 30_000;

const DEFAULT_MATERNITY_MESSAGE =
  "Coucou,\n\n" +
  "C’est le grand jour pour nous : je pars à la maternité. Les contractions se suivent bien, et c’est cohérent avec ce qu’on s’était dit avec la sage-femme.\n\n" +
  "J’ai un peu les papillons, mais je me sens prête. Pense fort à nous — je t’envoie des nouvelles dès que je peux.\n\n" +
  "Je t’embrasse";

export function mountApp(root: HTMLDivElement): void {
  root.innerHTML = shellHtml();
  bind(root);
  applyRoute(root);
  render(root);
}



function updateDrawerNavActive(root: HTMLElement, route: AppRoute): void {
  root.querySelectorAll<HTMLAnchorElement>("a.drawer-link[data-drawer-route]").forEach((a) => {
    const r = a.dataset.drawerRoute as AppRoute | undefined;
    const current = r === route;
    a.classList.toggle("drawer-link--current", current);
    if (current) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function renderTopBreadcrumb(root: HTMLElement, route: AppRoute): void {
  const nav = root.querySelector<HTMLElement>("#top-bar-bc-nav");
  if (!nav) return;
  const acc = getBreadcrumbLabel("home");
  const cur = getBreadcrumbLabel(route);
  if (route === "home") {
    nav.innerHTML = `<ol class="top-bar-bc-list">
      <li class="top-bar-bc-step" aria-current="page"><span class="top-bar-bc-text">${acc}</span></li>
    </ol>`;
  } else {
    nav.innerHTML = `<ol class="top-bar-bc-list">
      <li class="top-bar-bc-step"><a class="top-bar-bc-link" href="#/">${acc}</a></li>
      <li class="top-bar-bc-step" aria-current="page"><span class="top-bar-bc-text">${cur}</span></li>
    </ol>`;
  }
}

function applyRoute(root: HTMLElement): void {
  let route = parseRoute();
  if (route === "message" && !state.settings.moduleMaternityMessage) {
    history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#/`
    );
    route = "home";
  }
  const home = root.querySelector<HTMLElement>("#view-home")!;
  const settings = root.querySelector<HTMLElement>("#view-settings")!;
  const message = root.querySelector<HTMLElement>("#view-message")!;
  const table = root.querySelector<HTMLElement>("#view-table")!;
  const maternity = root.querySelector<HTMLElement>("#view-maternity")!;
  const midwife = root.querySelector<HTMLElement>("#view-midwife")!;
  home.hidden = route !== "home";
  settings.hidden = route !== "settings";
  message.hidden = route !== "message";
  table.hidden = route !== "table";
  maternity.hidden = route !== "maternity";
  midwife.hidden = route !== "midwife";
  if (route === "settings") {
    window.scrollTo(0, 0);
    if (settingsSaveFeedbackTimer !== null) {
      clearTimeout(settingsSaveFeedbackTimer);
      settingsSaveFeedbackTimer = null;
    }
    const fb = root.querySelector<HTMLElement>("#settings-save-feedback");
    if (fb) {
      fb.textContent = "";
      fb.hidden = true;
    }
  }
  if (route === "maternity" || route === "midwife") {
    window.scrollTo(0, 0);
  }
  renderTopBreadcrumb(root, route);
  updateDrawerNavActive(root, route);
  document.title = getDocumentTitle(route);
  closeEditDialogIfOpen(root);
  closeDrawer(root);
}

function closeDrawer(root: HTMLElement): void {
  const bd = root.querySelector<HTMLElement>("#nav-backdrop")!;
  const dr = root.querySelector<HTMLElement>("#app-drawer")!;
  const btn = root.querySelector<HTMLButtonElement>("#btn-menu")!;
  bd.classList.remove("is-open");
  dr.classList.remove("is-open");
  bd.setAttribute("aria-hidden", "true");
  dr.setAttribute("aria-hidden", "true");
  btn.setAttribute("aria-expanded", "false");
  btn.classList.remove("hamburger--open");
  document.body.style.overflow = "";
}

function openDrawer(root: HTMLElement): void {
  const bd = root.querySelector<HTMLElement>("#nav-backdrop")!;
  const dr = root.querySelector<HTMLElement>("#app-drawer")!;
  const btn = root.querySelector<HTMLButtonElement>("#btn-menu")!;
  bd.classList.add("is-open");
  dr.classList.add("is-open");
  bd.setAttribute("aria-hidden", "false");
  dr.setAttribute("aria-hidden", "false");
  btn.setAttribute("aria-expanded", "true");
  btn.classList.add("hamburger--open");
  document.body.style.overflow = "hidden";
}

function syncThemeButton(btn: HTMLButtonElement): void {
  const pref = getStoredThemePreference();
  const labels: Record<typeof pref, string> = {
    light: "Thème clair",
    dark: "Thème sombre",
    system: "Thème automatique",
  };
  const icons: Record<typeof pref, string> = { light: "☀", dark: "🌙", system: "🖥" };
  btn.textContent = icons[pref];
  btn.setAttribute("aria-label", labels[pref]);
  btn.title = labels[pref];
}

function toggleDrawer(root: HTMLElement): void {
  const dr = root.querySelector<HTMLElement>("#app-drawer")!;
  if (dr.classList.contains("is-open")) closeDrawer(root);
  else openDrawer(root);
}

function shellHtml(): string {
  const iconSrc = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  return `
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
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

    <main class="app">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
          <span class="maternity-quick__body">
            <span class="maternity-quick__title" id="maternity-quick-title">Appeler la maternité</span>
            <span class="maternity-quick__tel" id="maternity-quick-tel"></span>
          </span>
        </a>
      </div>

      <div id="view-home" class="view">
        <p class="subtitle home-intro">
          Suivez la fréquence des contractions et recevez une alerte selon les seuils définis dans les paramètres
          (à valider avec votre sage-femme).
        </p>

        <div class="app-banners" id="app-banners">
          <div class="app-banner app-banner--warn" id="banner-long-open" hidden>
            <p class="app-banner-text" id="banner-long-open-text"></p>
            <button type="button" class="btn btn-ghost btn-small" id="btn-dismiss-long-open">OK</button>
          </div>
          <div class="app-banner app-banner--info" id="banner-undo" hidden>
            <span class="app-banner-text">Dernière contraction enregistrée — vous pouvez annuler.</span>
            <button type="button" class="btn btn-ghost btn-small" id="btn-undo-add">Annuler</button>
          </div>
          <div class="app-banner app-banner--accent" id="banner-pre-alert" hidden>
            <p class="app-banner-text" id="banner-pre-alert-text"></p>
            <button type="button" class="btn btn-ghost btn-small" id="btn-dismiss-pre">Fermer</button>
          </div>
          <div class="app-banner app-banner--muted" id="banner-export-nudge" hidden>
            <span class="app-banner-text">Pensez à exporter une sauvegarde (Partager / Exporter) avant un changement de téléphone.</span>
            <button type="button" class="btn btn-ghost btn-small" id="btn-dismiss-export-nudge">Plus tard</button>
          </div>
        </div>

        <section class="card panel panel-cta" aria-labelledby="action-heading">
          <h2 id="action-heading" class="cta-heading">Enregistrer une contraction</h2>
          <p class="cta-hint">
            Touchez le gros bouton au <strong>début</strong> d’une contraction, puis à nouveau à la <strong>fin</strong>.
          </p>
          <div class="timer" id="timer-block" hidden>
            <p class="timer-label">Contraction en cours</p>
            <p class="timer-value" id="timer-value">0:00</p>
          </div>
          <div class="actions actions-cta">
            <button type="button" class="btn btn-primary btn-cta" id="btn-toggle" aria-live="polite">
              Début de contraction
            </button>
          </div>
          <div class="cta-extras">
            <button type="button" class="btn btn-secondary btn-small" id="btn-voice" hidden>
              Commande vocale (début / fin)
            </button>
          </div>
          <p class="hint" id="status-hint"></p>
        </section>

        <section class="card" aria-labelledby="summary-heading">
          <h2 id="summary-heading" class="section-title">Indicateurs récents</h2>
          <div class="stats-strip" role="group" aria-label="Synthèse des contractions">
            <div class="stats-cell">
              <p class="stats-label">Quantité / h</p>
              <p class="stats-value" id="stat-qty-hour" aria-live="polite">—</p>
            </div>
            <div class="stats-cell">
              <p class="stats-label">Durée moyenne</p>
              <p class="stats-value stats-value-mono" id="stat-avg-duration" aria-live="polite">—</p>
            </div>
            <div class="stats-cell">
              <p class="stats-label">Fréquence moyenne</p>
              <p class="stats-value stats-value-mono" id="stat-avg-frequency" aria-live="polite">—</p>
            </div>
          </div>
          <p class="stats-window-label" id="stats-window-label"></p>
          <p class="threshold-badge" id="threshold-badge" data-state="empty"></p>
          <dl class="summary summary-extra" id="summary-extra"></dl>
          <div class="chart-block" id="chart-block" hidden>
            <h3 class="chart-title">Intervalles entre débuts (derniers enregistrements)</h3>
            <div class="chart-bars" id="chart-bars" role="img" aria-label="Barres proportionnelles aux intervalles"></div>
          </div>
        </section>

        <section class="card" aria-labelledby="history-heading">
          <div class="section-head">
            <h2 id="history-heading" class="section-title">Historique</h2>
            <div class="section-actions" role="group" aria-label="Partage et historique">
              <button type="button" class="btn btn-ghost btn-small" id="btn-share" disabled>
                Partager
              </button>
              <button type="button" class="btn btn-ghost btn-small" id="btn-export" disabled>
                Exporter
              </button>
              <button type="button" class="btn btn-ghost btn-small" id="btn-clear-history">
                Effacer l’historique
              </button>
            </div>
          </div>
          <p class="share-export-feedback" id="share-export-feedback" hidden></p>
          <ul class="timeline" id="history-list" role="list"></ul>
          <p class="empty" id="history-empty">Aucune contraction enregistrée pour le moment.</p>
        </section>

        <footer class="footer">
          <p>Cet outil ne remplace pas un avis médical. Appelez la maternité ou le 15 en cas de doute.</p>
          <p>
            <a class="footer-link" href="https://github.com/mister-guiiug/miss-contraction" target="_blank" rel="noopener noreferrer">Code source sur GitHub</a>
            &nbsp;·&nbsp;
            <a class="footer-link" href="https://buymeacoffee.com/mister.guiiug" target="_blank" rel="noopener noreferrer">☕ Buy me a coffee</a>
          </p>
        </footer>
      </div>

      <div id="view-settings" class="view" hidden>
        <div class="settings-page">
          <p class="subtitle settings-page-lead">
            Ajustez l’alerte, le numéro de la maternité et l’affichage. <strong class="settings-page-hint">Pensez à
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
                L’alerte se déclenche lorsque les <strong id="lbl-n">3</strong> dernières contractions sont espacées
                d’au plus <strong id="lbl-interval">5</strong> minutes et durent chacune au moins
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
                Utilisés sur la page dédiée « Maternité » et sur le bandeau d’appel rapide en bas de l’écran lorsque le
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
                <span>Garder l’écran allumé pendant une contraction en cours</span>
              </label>
              <label class="field field-check">
                <input type="checkbox" name="vibrationEnabled" id="vibration-check" />
                <span>Vibration courte au début et à la fin (mobile)</span>
              </label>
              <label class="field field-check" id="voice-option-field">
                <input type="checkbox" name="voiceCommandsEnabled" id="voice-check" />
                <span>Afficher le bouton de commande vocale sur l’accueil (expérimental)</span>
              </label>
            </section>

            <section class="card settings-card" id="settings-section-modules" aria-labelledby="features-heading">
              <h2 id="features-heading" class="section-title">Options du menu</h2>
              <p class="settings-intro settings-intro--tight">
                Masquez ce que vous n’utilisez pas : les entrées disparaissent du menu latéral.
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
        <p class="subtitle maternity-page-lead">
          Libellé, numéro et adresse sont modifiables dans les paramètres. Appel et itinéraire en un geste.
        </p>
        <section class="card card--maternity-call" aria-labelledby="maternity-call-heading">
          <h2 id="maternity-call-heading" class="section-title">Contacter la maternité</h2>
          <p class="maternity-page-venue" id="maternity-page-venue" hidden></p>
          <div class="maternity-page-phone-block">
            <div class="maternity-page-phone-head">
              <p class="maternity-page-subheading">Numéro</p>
              <span class="maternity-page-readonly-badge">Lecture seule</span>
            </div>
            <p class="maternity-page-phone-line" id="maternity-page-phone-line" hidden></p>
            <p class="maternity-page-phone-placeholder" id="maternity-page-phone-placeholder">
              Aucun numéro enregistré. Indiquez-le dans les
              <a href="#/parametres">paramètres</a>.
            </p>
            <div class="maternity-page-dial-wrap">
              <a class="maternity-page-dial" id="maternity-page-dial-link" href="#/parametres">
                <span class="maternity-page-dial-ring" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <span class="maternity-page-dial-label" id="maternity-page-dial-label">Renseigner le numéro</span>
              </a>
            </div>
            <p class="maternity-page-hint" id="maternity-page-hint"></p>
          </div>
          <div class="maternity-page-address-block" id="maternity-page-address-block">
            <div class="maternity-page-address-head">
              <p class="maternity-page-address-heading">Adresse</p>
              <span class="maternity-page-readonly-badge">Lecture seule</span>
            </div>
            <p class="maternity-page-address" id="maternity-page-address" hidden></p>
            <p class="maternity-page-address-placeholder" id="maternity-page-address-placeholder">
              Aucune adresse enregistrée. Indiquez-la dans les
              <a href="#/parametres">paramètres</a>.
            </p>
          </div>
          <div class="maternity-page-maps" id="maternity-page-maps-wrap" hidden>
            <a
              class="btn btn-secondary maternity-page-maps-btn"
              id="maternity-page-maps-link"
              target="_blank"
              rel="noopener noreferrer"
              href="#"
            >
              <span class="maternity-page-maps-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <span>Itinéraire dans Maps</span>
            </a>
            <p class="maternity-page-maps-hint">
              Ouvre Google Maps dans un nouvel onglet pour un itinéraire vers l’adresse ci-dessus (position actuelle →
              destination).
            </p>
          </div>
        </section>
        <p class="settings-back-wrap maternity-page-actions">
          <a href="#/parametres" class="btn btn-secondary settings-back-link">Paramètres</a>
          <a href="#/" class="btn btn-ghost settings-back-link">Accueil</a>
        </p>
      </div>

      <div id="view-message" class="view" hidden>
        <p class="subtitle message-page-lead">
          Modèle de SMS ou WhatsApp pour prévenir vos proches que vous partez à la maternité. Adaptez le texte,
          puis copiez-le ou ouvrez directement une application.
        </p>
        <section class="card" aria-labelledby="message-heading">
          <h2 id="message-heading" class="section-title">Votre message</h2>
          <label class="field">
            <span>Personnalisez le texte avant envoi</span>
            <textarea
              id="msg-template"
              class="msg-textarea"
              rows="10"
              spellcheck="true"
              autocomplete="off"
              aria-describedby="msg-hint-block"
            ></textarea>
          </label>
          <p class="msg-feedback" id="msg-feedback" role="status" aria-live="polite"></p>
          <div class="msg-actions" role="group" aria-label="Envoyer ou copier le message">
            <button type="button" class="btn btn-secondary" id="btn-msg-reset">
              Réinitialiser le modèle
            </button>
            <button type="button" class="btn btn-secondary" id="btn-msg-copy">Copier</button>
            <button type="button" class="btn btn-primary" id="btn-msg-whatsapp">
              Ouvrir WhatsApp
            </button>
            <button type="button" class="btn btn-secondary" id="btn-msg-sms">Ouvrir SMS</button>
          </div>
          <p class="msg-hint" id="msg-hint-block">
            WhatsApp et SMS ouvrent l’application par défaut sur téléphone ; sur ordinateur, WhatsApp Web peut
            s’ouvrir dans un nouvel onglet. Si le lien SMS échoue (message très long), utilisez « Copier ».
            Vous pouvez aussi coller le texte dans Signal, e-mail, etc.
          </p>
        </section>
        <p class="settings-back-wrap">
          <a href="#/" class="btn btn-secondary settings-back-link">Retour à l’accueil</a>
        </p>
      </div>

      <div id="view-table" class="view" hidden>
        <p class="subtitle table-page-lead">
          Historique détaillé : pour chaque contraction, la <strong>durée</strong>, l’<strong>intervalle</strong> depuis le
          début de la précédente, et la <strong>fréquence</strong> estimée (contractions par heure) dérivée de cet intervalle.
        </p>
        <section class="card" aria-labelledby="table-heading">
          <h2 id="table-heading" class="section-title">Contractions (ordre chronologique)</h2>
          <div
            class="history-table-wrap"
            role="region"
            aria-label="Tableau défilant sur petit écran"
            tabindex="0"
            hidden
          >
            <table class="history-table">
              <thead>
                <tr>
                  <th scope="col">N°</th>
                  <th scope="col">Début</th>
                  <th scope="col">Durée</th>
                  <th scope="col">Intervalle</th>
                  <th scope="col">Fréquence</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody id="history-table-body"></tbody>
            </table>
          </div>
          <p class="empty" id="history-table-empty">Aucune contraction à afficher.</p>
          <p class="table-footnote">
            <strong>Intervalle</strong> : écart entre le début de cette contraction et celui de la ligne précédente.
            <strong>Fréquence</strong> : ≈ nombre de contractions par heure si le rythme restait identique à cet intervalle.
          </p>
        </section>
        <p class="settings-back-wrap">
          <a href="#/" class="btn btn-secondary settings-back-link">Retour à l’accueil</a>
        </p>
      </div>

      <div id="view-midwife" class="view" hidden>
        <p class="subtitle midwife-page-lead no-print">
          Synthèse courte des <strong>dernières contractions</strong>, des <strong>moyennes</strong> sur la période choisie et,
          si elle a eu lieu, l’<strong>heure à laquelle les seuils d’alerte ont été atteints pour la première fois</strong>
          dans tout l’historique. À imprimer ou enregistrer en PDF depuis le navigateur.
        </p>
        <section class="card midwife-card">
          <h2 class="section-title no-print">Contenu du résumé</h2>
          <label class="field field--wide midwife-field no-print">
            <span>Contractions listées (ordre chronologique)</span>
            <select id="midwife-count-select" class="midwife-select" aria-describedby="midwife-count-hint">
              <option value="6">6 dernières</option>
              <option value="10">10 dernières</option>
              <option value="12" selected>12 dernières</option>
              <option value="20">20 dernières</option>
              <option value="all">Tout l’historique</option>
            </select>
          </label>
          <p class="midwife-hint no-print" id="midwife-count-hint">
            Les moyennes (durée, intervalle, quantité / h) sont calculées <strong>uniquement</strong> sur cette sélection.
            Le « premier seuil atteint » utilise <strong>tout</strong> l’historique enregistré.
          </p>
          <div id="midwife-print-root" class="midwife-print-root" aria-live="polite"></div>
          <p class="midwife-copy-feedback no-print" id="midwife-copy-feedback" role="status" aria-live="polite" hidden></p>
          <div class="midwife-actions no-print" role="group" aria-label="Copier ou imprimer le résumé">
            <button type="button" class="btn btn-secondary" id="btn-midwife-copy">
              Copier le texte
            </button>
            <button type="button" class="btn btn-primary" id="btn-midwife-print">
              Imprimer ou PDF
            </button>
          </div>
          <p class="midwife-print-hint no-print">
            Dans la boîte d’impression, choisissez <strong>Enregistrer au format PDF</strong> si vous voulez un fichier.
          </p>
        </section>
        <p class="settings-back-wrap no-print">
          <a href="#/historique" class="btn btn-ghost settings-back-link">Tableau détaillé</a>
          <a href="#/" class="btn btn-secondary settings-back-link">Accueil</a>
        </p>
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
          <label class="field">
            <span>Note (optionnelle)</span>
            <textarea id="edit-note" name="note" rows="2" maxlength="240" placeholder="Ex. plus intense, repos…"></textarea>
          </label>
          <p class="edit-dialog-error" id="edit-dialog-error" role="alert"></p>
          <div class="edit-dialog-buttons">
            <button type="button" class="btn btn-secondary" id="edit-dialog-cancel">Annuler</button>
            <button type="submit" class="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </dialog>
    </main>
  `;
}

function bind(root: HTMLElement): void {
  const btnToggle = root.querySelector<HTMLButtonElement>("#btn-toggle")!;
  const btnClear = root.querySelector<HTMLButtonElement>("#btn-clear-history")!;
  const btnShare = root.querySelector<HTMLButtonElement>("#btn-share")!;
  const btnExport = root.querySelector<HTMLButtonElement>("#btn-export")!;
  const form = root.querySelector<HTMLFormElement>("#form-settings")!;
  const btnNotify = root.querySelector<HTMLButtonElement>("#btn-notify")!;

  btnToggle.addEventListener("click", () => {
    if (state.activeStart === null) startContraction(root);
    else endContraction(root);
  });

  btnClear.addEventListener("click", () => {
    if (!confirm("Effacer tout l’historique sur cet appareil ?")) return;
    state.records = [];
    state.alertLatch = false;
    preAlertLatch = false;
    dismissUndoBanner(root);
    saveRecords(state.records);
    closeEditDialogIfOpen(root);
    render(root);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    state.settings.maxIntervalMin = Number(fd.get("maxIntervalMin"));
    state.settings.minDurationSec = Number(fd.get("minDurationSec"));
    state.settings.consecutiveCount = Number(fd.get("consecutiveCount"));
    const sw = fd.get("statsWindowMinutes");
    state.settings.statsWindowMinutes =
      sw === "30" || sw === "60" || sw === "120" || sw === "all" ? sw : "all";
    state.settings.openContractionReminderMin = Number(fd.get("openContractionReminderMin"));
    state.settings.maternityLabel = String(fd.get("maternityLabel") ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    state.settings.maternityPhone = String(fd.get("maternityPhone") ?? "").replace(
      /[^\d+]/g,
      ""
    ).slice(0, 20);
    state.settings.maternityAddress = String(fd.get("maternityAddress") ?? "")
      .replace(/\r\n/g, "\n")
      .trim()
      .slice(0, 800);
    state.settings.preAlertEnabled = root.querySelector<HTMLInputElement>("#pre-alert-check")!.checked;
    state.settings.largeMode = root.querySelector<HTMLInputElement>("#large-mode-check")!.checked;
    state.settings.keepAwakeDuringContraction =
      root.querySelector<HTMLInputElement>("#keep-awake-check")!.checked;
    state.settings.vibrationEnabled = root.querySelector<HTMLInputElement>("#vibration-check")!.checked;
    state.settings.moduleVoiceCommands =
      root.querySelector<HTMLInputElement>("#module-voice-check")!.checked;
    state.settings.moduleMaternityMessage =
      root.querySelector<HTMLInputElement>("#module-message-check")!.checked;
    state.settings.voiceCommandsEnabled =
      root.querySelector<HTMLInputElement>("#voice-check")!.checked;
    if (!state.settings.moduleVoiceCommands) {
      state.settings.voiceCommandsEnabled = false;
    }
    saveSettings(state.settings);
    render(root);
    showSettingsSavedFeedback(root);
  });

  root.querySelector<HTMLButtonElement>("#btn-dismiss-long-open")!.addEventListener("click", () => {
    hideLongOpenBanner(root);
  });

  root.querySelector<HTMLButtonElement>("#btn-undo-add")!.addEventListener("click", () => {
    if (!pendingUndo) return;
    const last = state.records[state.records.length - 1];
    if (last?.id === pendingUndo.id) {
      state.records.pop();
      state.alertLatch = false;
      preAlertLatch = false;
      saveRecords(state.records);
    }
    dismissUndoBanner(root);
    render(root);
  });

  root.querySelector<HTMLButtonElement>("#btn-dismiss-pre")!.addEventListener("click", () => {
    preAlertBannerDismissed = true;
    root.querySelector<HTMLElement>("#banner-pre-alert")!.hidden = true;
  });

  root.querySelector<HTMLButtonElement>("#btn-dismiss-export-nudge")!.addEventListener("click", () => {
    try {
      localStorage.setItem(KEY_EXPORT_NUDGE_DISMISSED, String(Date.now()));
    } catch {
      /* ignore */
    }
    root.querySelector<HTMLElement>("#banner-export-nudge")!.hidden = true;
  });

  root.querySelector<HTMLButtonElement>("#btn-snooze-30")!.addEventListener("click", () => {
    setSnoozeUntilMs(Date.now() + 30 * 60 * 1000);
    render(root);
  });
  root.querySelector<HTMLButtonElement>("#btn-snooze-60")!.addEventListener("click", () => {
    setSnoozeUntilMs(Date.now() + 60 * 60 * 1000);
    render(root);
  });
  root.querySelector<HTMLButtonElement>("#btn-snooze-clear")!.addEventListener("click", () => {
    clearSnoozeUntil();
    render(root);
  });

  root.querySelector<HTMLButtonElement>("#btn-voice")!.addEventListener("click", () => {
    const hint = root.querySelector<HTMLElement>("#status-hint")!;
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      hint.textContent = "Commande vocale non disponible sur ce navigateur.";
      return;
    }
    try {
      recognitionInstance?.stop();
    } catch {
      /* ignore */
    }
    recognitionInstance = null;
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: Event) => {
      const results = (ev as unknown as { results: { [i: number]: { 0: { transcript: string } } } })
        .results;
      const alt = results[0]?.[0]?.transcript ?? "";
      const t = alt.toLowerCase();
      if (t.includes("début") || t.includes("debut")) {
        if (state.activeStart === null) startContraction(root);
      } else if (t.includes("fin")) {
        if (state.activeStart !== null) endContraction(root);
      } else {
        hint.textContent = `Entendu : « ${alt.trim() || "…"} » — dites « début » ou « fin ».`;
      }
    };
    rec.onerror = () => {
      hint.textContent = "Micro refusé ou erreur — vérifiez les permissions.";
    };
    rec.onend = () => {
      recognitionInstance = null;
    };
    recognitionInstance = rec;
    try {
      rec.start();
      hint.textContent = "Écoute… dites « début » ou « fin ».";
    } catch {
      hint.textContent = "Impossible de démarrer l’écoute.";
    }
  });

  btnNotify.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      setNotifyStatus(root, "Non supporté sur ce navigateur.");
      return;
    }
    const perm = await Notification.requestPermission();
    state.settings.notificationsEnabled = perm === "granted";
    saveSettings(state.settings);
    setNotifyStatus(root, permLabel(perm));
    render(root);
  });

  btnShare.addEventListener("click", () => {
    void shareHistory(root);
  });

  btnExport.addEventListener("click", () => {
    downloadExportJson();
    flashShareExportFeedback(root, "Fichier JSON téléchargé.");
  });

  root.querySelector<HTMLSelectElement>("#midwife-count-select")!.addEventListener("change", () => {
    renderMidwifePanel(root);
  });
  root.querySelector<HTMLButtonElement>("#btn-midwife-copy")!.addEventListener("click", () => {
    void copyMidwifeSummary(root);
  });
  root.querySelector<HTMLButtonElement>("#btn-midwife-print")!.addEventListener("click", () => {
    window.print();
  });

  bindHistoryActions(root);
  bindEditDialog(root);

  const btnMenu = root.querySelector<HTMLButtonElement>("#btn-menu")!;
  const navBackdrop = root.querySelector<HTMLElement>("#nav-backdrop")!;
  const appDrawer = root.querySelector<HTMLElement>("#app-drawer")!;
  btnMenu.addEventListener("click", () => toggleDrawer(root));
  navBackdrop.addEventListener("click", () => closeDrawer(root));
  root.querySelector<HTMLButtonElement>("#btn-drawer-close")!.addEventListener("click", () => {
    closeDrawer(root);
    btnMenu.focus();
  });

  const btnTheme = root.querySelector<HTMLButtonElement>("#btn-theme")!;
  syncThemeButton(btnTheme);
  btnTheme.addEventListener("click", () => {
    cycleThemePreference();
    syncThemeButton(btnTheme);
  });

  appDrawer.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a.drawer-link");
    if (!a) return;
    closeDrawer(root);
  });

  window.addEventListener("hashchange", () => {
    applyRoute(root);
    render(root);
    requestAnimationFrame(() => focusMainContent());
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const dr = root.querySelector<HTMLElement>("#app-drawer");
    if (dr?.classList.contains("is-open")) {
      e.preventDefault();
      closeDrawer(root);
    }
  });

  bindMaternityMessage(root);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (state.activeStart !== null && state.settings.keepAwakeDuringContraction) {
      void acquireWakeLock();
    }
  });
}

function getMaternityMessageText(root: HTMLElement): string {
  return root.querySelector<HTMLTextAreaElement>("#msg-template")?.value ?? "";
}

function setMaternityMessageFeedback(root: HTMLElement, text: string): void {
  const el = root.querySelector<HTMLElement>("#msg-feedback");
  if (el) el.textContent = text;
}

function persistMaternityMessage(text: string): void {
  try {
    localStorage.setItem(MATERNITY_MESSAGE_STORAGE_KEY, text);
  } catch {
    /* ignore quota */
  }
}

function loadMaternityMessageDraft(): string {
  try {
    const s = localStorage.getItem(MATERNITY_MESSAGE_STORAGE_KEY);
    if (s != null && s.trim() !== "") return s;
  } catch {
    /* ignore */
  }
  return DEFAULT_MATERNITY_MESSAGE;
}

function bindMaternityMessage(root: HTMLElement): void {
  const ta = root.querySelector<HTMLTextAreaElement>("#msg-template");
  if (!ta) return;
  ta.value = loadMaternityMessageDraft();

  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  ta.addEventListener("input", () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persistMaternityMessage(ta.value);
    }, 400);
  });

  root.querySelector<HTMLButtonElement>("#btn-msg-reset")!.addEventListener("click", () => {
    ta.value = DEFAULT_MATERNITY_MESSAGE;
    persistMaternityMessage(ta.value);
    setMaternityMessageFeedback(root, "Modèle par défaut restauré.");
  });

  root.querySelector<HTMLButtonElement>("#btn-msg-copy")!.addEventListener("click", async () => {
    const text = getMaternityMessageText(root);
    if (!text.trim()) {
      setMaternityMessageFeedback(root, "Le message est vide.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setMaternityMessageFeedback(root, "Message copié dans le presse-papiers.");
    } catch {
      setMaternityMessageFeedback(root, "Copie impossible — sélectionnez le texte manuellement.");
    }
  });

  root.querySelector<HTMLButtonElement>("#btn-msg-whatsapp")!.addEventListener("click", () => {
    const text = getMaternityMessageText(root);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setMaternityMessageFeedback(root, "WhatsApp ouvert dans un nouvel onglet (ou l’app sur mobile).");
  });

  root.querySelector<HTMLButtonElement>("#btn-msg-sms")!.addEventListener("click", () => {
    const text = getMaternityMessageText(root);
    const url = `sms:?body=${encodeURIComponent(text)}`;
    window.location.href = url;
    setMaternityMessageFeedback(root, "Si rien ne s’ouvre, utilisez « Copier » puis collez dans votre app SMS.");
  });
}

function sortRecordsByStart(): void {
  state.records.sort((a, b) => a.start - b.start);
}

function bindHistoryActions(root: HTMLElement): void {
  const list = root.querySelector<HTMLUListElement>("#history-list")!;
  list.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-action][data-id]"
    );
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id || (action !== "delete" && action !== "edit")) return;

    if (action === "delete") {
      if (!confirm("Supprimer cette contraction de l’historique ?")) return;
      const idx = state.records.findIndex((r) => r.id === id);
      if (idx === -1) return;
      state.records.splice(idx, 1);
      state.alertLatch = false;
      saveRecords(state.records);
      render(root);
      return;
    }

    const rec = state.records.find((r) => r.id === id);
    if (!rec) return;
    openEditDialog(root, id, rec);
  });
}

function bindEditDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>("#edit-contraction-dialog")!;
  const form = root.querySelector<HTMLFormElement>("#edit-contraction-form")!;
  const inpStart = root.querySelector<HTMLInputElement>("#edit-start")!;
  const inpEnd = root.querySelector<HTMLInputElement>("#edit-end")!;
  const inpNote = root.querySelector<HTMLTextAreaElement>("#edit-note")!;
  const err = root.querySelector<HTMLElement>("#edit-dialog-error")!;
  const btnCancel = root.querySelector<HTMLButtonElement>("#edit-dialog-cancel")!;

  btnCancel.addEventListener("click", () => {
    editingRecordId = null;
    dialog.close();
  });

  dialog.addEventListener("close", () => {
    editingRecordId = null;
    err.textContent = "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    err.textContent = "";
    if (!editingRecordId) return;
    const start = new Date(inpStart.value).getTime();
    const end = new Date(inpEnd.value).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) {
      err.textContent = "Vérifiez les dates saisies.";
      return;
    }
    if (end < start) {
      err.textContent = "La fin doit être après le début.";
      return;
    }
    const rec = state.records.find((r) => r.id === editingRecordId);
    if (!rec) {
      dialog.close();
      return;
    }
    rec.start = start;
    rec.end = end;
    const noteRaw = inpNote.value.trim();
    if (noteRaw) rec.note = noteRaw.slice(0, 240);
    else delete rec.note;
    sortRecordsByStart();
    state.alertLatch = false;
    saveRecords(state.records);
    editingRecordId = null;
    dialog.close();
    render(root);
  });
}

function closeEditDialogIfOpen(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>("#edit-contraction-dialog");
  if (dialog?.open) {
    editingRecordId = null;
    dialog.close();
  }
}

function openEditDialog(
  root: HTMLElement,
  id: string,
  rec: ContractionRecord
): void {
  const dialog = root.querySelector<HTMLDialogElement>("#edit-contraction-dialog")!;
  const inpStart = root.querySelector<HTMLInputElement>("#edit-start")!;
  const inpEnd = root.querySelector<HTMLInputElement>("#edit-end")!;
  const inpNote = root.querySelector<HTMLTextAreaElement>("#edit-note")!;
  const err = root.querySelector<HTMLElement>("#edit-dialog-error")!;
  editingRecordId = id;
  err.textContent = "";
  inpStart.value = toDatetimeLocalValue(rec.start);
  inpEnd.value = toDatetimeLocalValue(rec.end);
  inpNote.value = rec.note ?? "";
  dialog.showModal();
}

function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function isSnoozed(): boolean {
  return Date.now() < loadSnoozeUntil();
}

function maybeVibrate(pattern: number | number[]): void {
  if (!state.settings.vibrationEnabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

async function acquireWakeLock(): Promise<void> {
  if (!state.settings.keepAwakeDuringContraction || !navigator.wakeLock) return;
  try {
    wakeLockSentinel = await navigator.wakeLock.request("screen");
    wakeLockSentinel.addEventListener("release", () => {
      wakeLockSentinel = null;
    });
  } catch {
    /* ignore */
  }
}

async function releaseWakeLockSafe(): Promise<void> {
  try {
    await wakeLockSentinel?.release();
  } catch {
    /* ignore */
  }
  wakeLockSentinel = null;
}

function clearOpenSessionMonitors(): void {
  if (openSessionReminderTimer) {
    clearInterval(openSessionReminderTimer);
    openSessionReminderTimer = null;
  }
}

function startOpenSessionMonitoring(root: HTMLElement): void {
  clearOpenSessionMonitors();
  longOpenNotified = false;
  const tick = (): void => {
    if (state.activeStart === null) return;
    const elapsedMin = (Date.now() - state.activeStart) / 60_000;
    const limit = state.settings.openContractionReminderMin;
    if (elapsedMin >= limit && !longOpenNotified) {
      longOpenNotified = true;
      const el = root.querySelector<HTMLElement>("#banner-long-open");
      const txt = root.querySelector<HTMLElement>("#banner-long-open-text");
      if (el && txt) {
        txt.textContent = `Une contraction semble toujours en cours depuis plus de ${limit} min. Avez-vous oublié d’appuyer sur « Fin » ?`;
        el.hidden = false;
      }
      maybeVibrate([70, 35, 70]);
      if (
        state.settings.notificationsEnabled &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification("Miss Contraction", {
          body: "Pensez à indiquer la fin de la contraction si elle est terminée.",
          tag: "mc-open-reminder",
        });
      }
    }
  };
  openSessionReminderTimer = setInterval(tick, 15_000);
  tick();
}

function hideLongOpenBanner(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>("#banner-long-open");
  if (el) el.hidden = true;
  longOpenNotified = false;
}

function showUndoBanner(root: HTMLElement, recordId: string): void {
  if (pendingUndo) clearTimeout(pendingUndo.timeoutId);
  const banner = root.querySelector<HTMLElement>("#banner-undo");
  if (banner) banner.hidden = false;
  const tid = setTimeout(() => {
    pendingUndo = null;
    const b = root.querySelector<HTMLElement>("#banner-undo");
    if (b) b.hidden = true;
  }, UNDO_MS);
  pendingUndo = { id: recordId, timeoutId: tid };
}

function dismissUndoBanner(root: HTMLElement): void {
  if (pendingUndo) clearTimeout(pendingUndo.timeoutId);
  pendingUndo = null;
  const b = root.querySelector<HTMLElement>("#banner-undo");
  if (b) b.hidden = true;
}

function getSpeechCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function startContraction(root: HTMLElement): void {
  state.activeStart = Date.now();
  void acquireWakeLock();
  hideLongOpenBanner(root);
  maybeVibrate(40);
  const btn = root.querySelector<HTMLButtonElement>("#btn-toggle")!;
  btn.textContent = "Fin de contraction";
  btn.classList.add("btn-danger");
  btn.classList.remove("btn-primary");
  const timerBlock = root.querySelector<HTMLElement>("#timer-block")!;
  timerBlock.hidden = false;
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(() => updateTimer(root), 1000);
  updateTimer(root);
  root.querySelector<HTMLElement>("#status-hint")!.textContent =
    "Appuyez à nouveau à la fin de la contraction.";
  startOpenSessionMonitoring(root);
}

function endContraction(root: HTMLElement): void {
  if (state.activeStart === null) return;
  const end = Date.now();
  const rec: ContractionRecord = {
    id: crypto.randomUUID(),
    start: state.activeStart,
    end,
  };
  state.activeStart = null;
  void releaseWakeLockSafe();
  clearOpenSessionMonitors();
  hideLongOpenBanner(root);
  maybeVibrate([35, 50, 35]);
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
  state.records.push(rec);
  saveRecords(state.records);
  preAlertBannerDismissed = false;
  evaluatePreAlert();
  evaluateAlert();
  const btn = root.querySelector<HTMLButtonElement>("#btn-toggle")!;
  btn.textContent = "Début de contraction";
  btn.classList.add("btn-primary");
  btn.classList.remove("btn-danger");
  root.querySelector<HTMLElement>("#timer-block")!.hidden = true;
  root.querySelector<HTMLElement>("#status-hint")!.textContent = "";
  showUndoBanner(root, rec.id);
  render(root);
}

function updateTimer(root: HTMLElement): void {
  if (state.activeStart === null) return;
  const sec = Math.floor((Date.now() - state.activeStart) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const el = root.querySelector<HTMLElement>("#timer-value");
  if (el) el.textContent = `${m}:${String(s).padStart(2, "0")}`;
}

function evaluatePreAlert(): void {
  if (isSnoozed()) return;
  if (!state.settings.preAlertEnabled) return;
  if (computeThresholdBadge(state.records, state.settings) === "match") {
    preAlertLatch = false;
    return;
  }
  const done = state.records.filter((r) => r.end > r.start);
  if (done.length < 2) return;
  const a = done[done.length - 2]!;
  const b = done[done.length - 1]!;
  const diffMin = (b.start - a.start) / 60_000;
  if (diffMin > state.settings.maxIntervalMin * 1.25) preAlertLatch = false;
  if (diffMin <= 0 || diffMin > state.settings.maxIntervalMin * 1.2) return;
  if (!state.settings.notificationsEnabled) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted")
    return;
  if (preAlertLatch) return;
  preAlertLatch = true;
  new Notification("Miss Contraction", {
    body: "Rythme soutenu : vous vous rapprochez des repères définis avec votre sage-femme.",
    tag: "mc-prealert",
  });
}

function evaluateAlert(): void {
  if (isSnoozed()) return;
  const { records, settings } = state;
  const n = settings.consecutiveCount;
  if (records.length < n) {
    maybeResetLatch(records);
    return;
  }
  const slice = records.slice(-n);
  const intervalsOk = slice.slice(1).every((r, i) => {
    const prev = slice[i]!;
    const diffMin = (r.start - prev.start) / 60_000;
    return diffMin <= settings.maxIntervalMin;
  });
  const durationsOk = slice.every(
    (r) => (r.end - r.start) / 1000 >= settings.minDurationSec
  );

  maybeResetLatch(records);

  if (!intervalsOk || !durationsOk || !settings.notificationsEnabled) return;
  if (state.alertLatch) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted")
    return;

  state.alertLatch = true;
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  new Notification("Miss Contraction", {
    body: `Les ${n} dernières contractions respectent vos critères. Contactez la maternité selon vos consignes.`,
    icon,
    tag: "mc-threshold",
    renotify: true,
  } as NotificationOptions);
}

/** Si l’écart entre les deux dernières contractions dépasse le seuil, on peut à nouveau alerter plus tard. */
function maybeResetLatch(records: ContractionRecord[]): void {
  if (records.length < 2) return;
  const a = records[records.length - 2]!;
  const b = records[records.length - 1]!;
  const diffMin = (b.start - a.start) / 60_000;
  if (diffMin > state.settings.maxIntervalMin) state.alertLatch = false;
}

function stopVoiceRecognition(): void {
  try {
    recognitionInstance?.stop();
  } catch {
    /* ignore */
  }
  recognitionInstance = null;
}

function updateMaternityUi(root: HTMLElement, s: AppSettings): void {
  const phone = s.maternityPhone.trim();
  const label = s.maternityLabel.trim();
  const telHref = phone ? `tel:${phone.replace(/\s/g, "")}` : "";
  const addr = s.maternityAddress.trim();

  const venueEl = root.querySelector<HTMLElement>("#maternity-page-venue");
  if (venueEl) {
    if (label) {
      venueEl.textContent = label;
      venueEl.hidden = false;
    } else {
      venueEl.textContent = "";
      venueEl.hidden = true;
    }
  }

  const wrap = root.querySelector<HTMLElement>("#maternity-quick");
  const link = root.querySelector<HTMLAnchorElement>("#maternity-quick-link");
  const telEl = root.querySelector<HTMLElement>("#maternity-quick-tel");
  const quickTitle = root.querySelector<HTMLElement>("#maternity-quick-title");
  const main = root.querySelector<HTMLElement>("main.app");

  if (wrap && link && telEl && main) {
    if (phone) {
      wrap.hidden = false;
      main.classList.add("app--maternity-quick");
      link.href = telHref;
      const destName = label || "la maternité";
      link.setAttribute("aria-label", `Appeler ${destName} au ${phone}`);
      telEl.textContent = phone;
      if (quickTitle) {
        quickTitle.textContent = label ? `Appeler ${label}` : "Appeler la maternité";
      }
    } else {
      wrap.hidden = true;
      main.classList.remove("app--maternity-quick");
      link.href = "tel:";
      link.removeAttribute("aria-label");
      telEl.textContent = "";
      if (quickTitle) quickTitle.textContent = "Appeler la maternité";
    }
  }

  const addrBlock = root.querySelector<HTMLElement>("#maternity-page-address-block");
  const addrText = root.querySelector<HTMLElement>("#maternity-page-address");
  const addrPlaceholder = root.querySelector<HTMLElement>("#maternity-page-address-placeholder");
  const mapsWrap = root.querySelector<HTMLElement>("#maternity-page-maps-wrap");
  const mapsLink = root.querySelector<HTMLAnchorElement>("#maternity-page-maps-link");
  if (addrBlock && addrText && addrPlaceholder) {
    if (addr) {
      addrText.hidden = false;
      addrText.textContent = addr;
      addrPlaceholder.hidden = true;
    } else {
      addrText.textContent = "";
      addrText.hidden = true;
      addrPlaceholder.hidden = false;
    }
  }
  if (mapsWrap && mapsLink) {
    if (addr) {
      mapsWrap.hidden = false;
      const dest = encodeURIComponent(addr);
      mapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
      const mapsDest = label || addr;
      mapsLink.setAttribute(
        "aria-label",
        `Ouvrir Google Maps : itinéraire vers ${mapsDest}`
      );
    } else {
      mapsWrap.hidden = true;
      mapsLink.href = "#";
      mapsLink.removeAttribute("aria-label");
    }
  }

  const phoneLine = root.querySelector<HTMLElement>("#maternity-page-phone-line");
  const phonePh = root.querySelector<HTMLElement>("#maternity-page-phone-placeholder");
  if (phoneLine && phonePh) {
    if (phone) {
      phoneLine.hidden = false;
      phoneLine.textContent = phone;
      phonePh.hidden = true;
    } else {
      phoneLine.textContent = "";
      phoneLine.hidden = true;
      phonePh.hidden = false;
    }
  }

  const pageLink = root.querySelector<HTMLAnchorElement>("#maternity-page-dial-link");
  const pageLbl = root.querySelector<HTMLElement>("#maternity-page-dial-label");
  const pageHint = root.querySelector<HTMLElement>("#maternity-page-hint");
  if (pageLink && pageLbl && pageHint) {
    pageLink.classList.toggle("maternity-page-dial--ready", Boolean(phone));
    const dialCallText = label ? `Appeler ${label}` : "Appeler la maternité";
    if (phone) {
      pageLink.href = telHref;
      pageLbl.textContent = dialCallText;
      pageLink.setAttribute(
        "aria-label",
        label ? `Appeler ${label} au ${phone}` : `Appeler la maternité au ${phone}`
      );
      pageHint.textContent = "";
    } else {
      pageLink.href = "#/parametres";
      pageLbl.textContent = "Renseigner le numéro";
      pageLink.setAttribute(
        "aria-label",
        "Ouvrir les paramètres pour renseigner le numéro de la maternité"
      );
      pageHint.textContent =
        "Enregistrez un numéro dans les paramètres pour lancer l’appel depuis ce bouton.";
    }
  }
}

function showSettingsSavedFeedback(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>("#settings-save-feedback");
  if (!el) return;
  if (settingsSaveFeedbackTimer !== null) {
    clearTimeout(settingsSaveFeedbackTimer);
    settingsSaveFeedbackTimer = null;
  }
  el.hidden = false;
  el.textContent = "Modifications enregistrées.";
  settingsSaveFeedbackTimer = window.setTimeout(() => {
    el.textContent = "";
    el.hidden = true;
    settingsSaveFeedbackTimer = null;
  }, 3800);
}

function render(root: HTMLElement): void {
  const s = state.settings;
  document.documentElement.classList.toggle("mc-large-mode", s.largeMode);

  if (!s.moduleVoiceCommands || !s.voiceCommandsEnabled) {
    stopVoiceRecognition();
  }

  root.querySelector<HTMLElement>("#lbl-n")!.textContent = String(s.consecutiveCount);
  root.querySelector<HTMLElement>("#lbl-interval")!.textContent = String(
    s.maxIntervalMin
  );
  root.querySelector<HTMLElement>("#lbl-dur")!.textContent = String(s.minDurationSec);

  const form = root.querySelector<HTMLFormElement>("#form-settings");
  if (form) {
    (form.elements.namedItem("maxIntervalMin") as HTMLInputElement).value = String(
      s.maxIntervalMin
    );
    (form.elements.namedItem("minDurationSec") as HTMLInputElement).value = String(
      s.minDurationSec
    );
    (form.elements.namedItem("consecutiveCount") as HTMLInputElement).value = String(
      s.consecutiveCount
    );
    (form.elements.namedItem("statsWindowMinutes") as HTMLSelectElement).value =
      s.statsWindowMinutes;
    (form.elements.namedItem("openContractionReminderMin") as HTMLInputElement).value =
      String(s.openContractionReminderMin);
    (form.elements.namedItem("maternityLabel") as HTMLInputElement).value =
      s.maternityLabel;
    (form.elements.namedItem("maternityPhone") as HTMLInputElement).value =
      s.maternityPhone;
    (form.elements.namedItem("maternityAddress") as HTMLTextAreaElement).value =
      s.maternityAddress;
    root.querySelector<HTMLInputElement>("#pre-alert-check")!.checked = s.preAlertEnabled;
    root.querySelector<HTMLInputElement>("#large-mode-check")!.checked = s.largeMode;
    root.querySelector<HTMLInputElement>("#keep-awake-check")!.checked =
      s.keepAwakeDuringContraction;
    root.querySelector<HTMLInputElement>("#vibration-check")!.checked = s.vibrationEnabled;
    root.querySelector<HTMLInputElement>("#module-voice-check")!.checked = s.moduleVoiceCommands;
    root.querySelector<HTMLInputElement>("#module-message-check")!.checked =
      s.moduleMaternityMessage;
    root.querySelector<HTMLInputElement>("#voice-check")!.checked = s.voiceCommandsEnabled;
  }

  const voiceOpt = root.querySelector<HTMLElement>("#voice-option-field");
  if (voiceOpt) voiceOpt.hidden = !s.moduleVoiceCommands;

  const drawerMsg = root.querySelector<HTMLElement>("#drawer-item-message");
  if (drawerMsg) drawerMsg.hidden = !s.moduleMaternityMessage;

  const voiceBtn = root.querySelector<HTMLButtonElement>("#btn-voice");
  if (voiceBtn) {
    voiceBtn.hidden =
      !s.moduleVoiceCommands ||
      !s.voiceCommandsEnabled ||
      getSpeechCtor() === null;
  }

  updateMaternityUi(root, s);

  updateSnoozeStatus(root);
  updateExportNudgeBanner(root);
  updatePreAlertBanner(root);
  updateThresholdBadge(root);

  setNotifyStatus(root, notifyStatusText());

  updateShareExportButtons(root);

  renderSummary(root);
  renderIntervalChart(root);
  renderHistory(root);
  renderHistoryTable(root);
  renderMidwifePanel(root);
}

function updateShareExportButtons(root: HTMLElement): void {
  const hasData = state.records.length > 0;
  root.querySelector<HTMLButtonElement>("#btn-share")!.disabled = !hasData;
  root.querySelector<HTMLButtonElement>("#btn-export")!.disabled = !hasData;
}

function setNotifyStatus(root: HTMLElement, text: string): void {
  const el = root.querySelector<HTMLElement>("#notify-status");
  if (el) el.textContent = text;
}

function notifyStatusText(): string {
  if (!("Notification" in window)) return "Notifications non disponibles.";
  if (Notification.permission === "granted")
    return state.settings.notificationsEnabled
      ? "Notifications activées."
      : "Permission accordée — touchez « Activer les notifications » pour confirmer.";
  if (Notification.permission === "denied") return "Notifications refusées dans le navigateur.";
  return "Notifications non encore demandées.";
}

function permLabel(p: NotificationPermission): string {
  if (p === "granted") return "Notifications activées.";
  if (p === "denied") return "Refusé — activez-les dans les paramètres du navigateur.";
  return "Permission non accordée.";
}

function countContractionsStartingInLastHour(
  done: ContractionRecord[],
  nowMs: number
): number {
  const t0 = nowMs - 60 * 60 * 1000;
  return done.filter((r) => r.start >= t0).length;
}

/** Moyenne des écarts entre débuts consécutifs (ms). */
function meanStartIntervalMs(done: ContractionRecord[]): number | null {
  if (done.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < done.length; i++) {
    sum += done[i]!.start - done[i - 1]!.start;
  }
  return sum / (done.length - 1);
}

function meanContractionDurationMs(done: ContractionRecord[]): number | null {
  if (done.length === 0) return null;
  let sum = 0;
  for (const r of done) {
    sum += r.end - r.start;
  }
  return sum / done.length;
}

/** Contractions par heure à partir d’un intervalle moyen entre débuts (ms). */
function formatContractionsPerHour(meanIntervalMs: number): string {
  if (meanIntervalMs <= 0 || !Number.isFinite(meanIntervalMs)) return "—";
  const n = 3600000 / meanIntervalMs;
  if (!Number.isFinite(n) || n <= 0) return "—";
  const dec = n >= 12 ? 0 : 1;
  const s = n.toFixed(dec).replace(".", ",");
  return `≈ ${s} / h`;
}

/** Affichage type 01:05 (minutes : secondes) pour les moyennes du bandeau. */
function formatStatsClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function statsWindowLabelText(): string {
  const k = state.settings.statsWindowMinutes;
  if (k === "all") return "Moyennes sur toutes les données enregistrées.";
  const n = k === "30" ? 30 : k === "60" ? 60 : 120;
  return `Moyennes sur les ${n} dernières minutes (début de contraction).`;
}

function updateThresholdBadge(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>("#threshold-badge");
  if (!el) return;
  const kind = computeThresholdBadge(state.records, state.settings);
  el.dataset.state = kind;
  const labels: Record<string, string> = {
    match: "Les dernières contractions correspondent à vos seuils d’alerte.",
    approaching: "Rythme soutenu — restez attentive aux consignes de votre sage-femme.",
    calm: "En dehors du schéma d’alerte configuré (pour l’instant).",
    empty: "Pas encore assez de données pour comparer aux seuils.",
  };
  el.textContent = labels[kind] ?? "";
}

function updatePreAlertBanner(root: HTMLElement): void {
  const banner = root.querySelector<HTMLElement>("#banner-pre-alert");
  const txt = root.querySelector<HTMLElement>("#banner-pre-alert-text");
  if (!banner || !txt) return;
  const kind = computeThresholdBadge(state.records, state.settings);
  if (
    state.settings.preAlertEnabled &&
    kind === "approaching" &&
    !preAlertBannerDismissed
  ) {
    txt.textContent =
      "Le rythme se resserre par rapport à vos repères. En cas de doute, contactez la maternité selon vos consignes.";
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

function updateExportNudgeBanner(root: HTMLElement): void {
  const banner = root.querySelector<HTMLElement>("#banner-export-nudge");
  if (!banner) return;
  const all = state.records.filter((r) => r.end > r.start);
  if (all.length === 0) {
    banner.hidden = true;
    return;
  }
  let dismissedAt = 0;
  try {
    dismissedAt = Number(localStorage.getItem(KEY_EXPORT_NUDGE_DISMISSED)) || 0;
  } catch {
    dismissedAt = 0;
  }
  banner.hidden = Date.now() - dismissedAt < EXPORT_NUDGE_INTERVAL_MS;
}

function updateSnoozeStatus(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>("#snooze-status");
  if (!el) return;
  const until = loadSnoozeUntil();
  if (until <= Date.now()) {
    el.textContent = "Aucun report actif.";
    return;
  }
  const d = new Date(until);
  el.textContent = `Alertes reportées jusqu’à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`;
}

function renderIntervalChart(root: HTMLElement): void {
  const block = root.querySelector<HTMLElement>("#chart-block");
  const bars = root.querySelector<HTMLElement>("#chart-bars");
  const label = root.querySelector<HTMLElement>("#stats-window-label");
  if (label) label.textContent = statsWindowLabelText();
  if (!block || !bars) return;

  const now = Date.now();
  const allValid = state.records.filter((r) => r.end > r.start);
  const sorted = [...allValid].sort((a, b) => a.start - b.start);
  const done = filterRecordsByStatsWindow(sorted, state.settings.statsWindowMinutes, now);
  const intervals = getRecentIntervalsMs(done, 14);
  bars.textContent = "";
  if (intervals.length === 0) {
    block.hidden = true;
    return;
  }
  block.hidden = false;
  const max = Math.max(...intervals, 1);
  intervals.forEach((ms) => {
    const pct = Math.min(100, Math.round((ms / max) * 100));
    const wrap = document.createElement("div");
    wrap.className = "chart-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${pct}%`;
    bar.title = formatDuration(ms);
    wrap.appendChild(bar);
    bars.appendChild(wrap);
  });
}

function renderSummary(root: HTMLElement): void {
  const qtyEl = root.querySelector<HTMLElement>("#stat-qty-hour");
  const durEl = root.querySelector<HTMLElement>("#stat-avg-duration");
  const freqEl = root.querySelector<HTMLElement>("#stat-avg-frequency");
  const dl = root.querySelector<HTMLElement>("#summary-extra")!;
  const now = Date.now();
  const allValid = state.records.filter((r) => r.end > r.start);
  const sorted = [...allValid].sort((a, b) => a.start - b.start);
  const done = filterRecordsByStatsWindow(sorted, state.settings.statsWindowMinutes, now);

  const dash = "—";
  if (!qtyEl || !durEl || !freqEl) return;

  if (done.length === 0) {
    qtyEl.textContent = dash;
    durEl.textContent = dash;
    freqEl.textContent = dash;
    dl.innerHTML = "";
    return;
  }

  const meanInterval = meanStartIntervalMs(done);
  const meanDur = meanContractionDurationMs(done);

  const qtyHour =
    meanInterval != null && meanInterval > 0
      ? String(Math.round(3600000 / meanInterval))
      : dash;
  qtyEl.textContent = qtyHour;
  durEl.textContent =
    meanDur != null ? formatStatsClock(meanDur) : dash;
  freqEl.textContent =
    meanInterval != null ? formatStatsClock(meanInterval) : dash;

  const lastHourCount = countContractionsStartingInLastHour(allValid, now);
  const perHourFromMean =
    meanInterval != null ? formatContractionsPerHour(meanInterval) : dash;

  const last = sorted.length > 0 ? sorted[sorted.length - 1]! : null;
  const lastDur = last ? formatDuration(last.end - last.start) : dash;
  let lastInterval = dash;
  if (sorted.length >= 2 && last) {
    const prev = sorted[sorted.length - 2]!;
    lastInterval = formatDuration(last.start - prev.start);
  }

  dl.innerHTML = `
    <dt>Contractions (dernière heure)</dt><dd>${lastHourCount}</dd>
    <dt>Estimation détaillée</dt><dd>${perHourFromMean}</dd>
    <dt>Dernier intervalle</dt><dd>${lastInterval}</dd>
    <dt>Dernière durée</dt><dd>${lastDur}</dd>
  `;
}

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFmtLong = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
});

type MidwifeMode = "6" | "10" | "12" | "20" | "all";

function parseMidwifeMode(val: string): MidwifeMode {
  if (val === "6" || val === "10" || val === "12" || val === "20" || val === "all") return val;
  return "12";
}

function sliceForMidwife(sorted: ContractionRecord[], mode: MidwifeMode): ContractionRecord[] {
  if (mode === "all" || sorted.length === 0) return sorted;
  const n = Number(mode);
  if (!Number.isFinite(n) || n < 1) return sorted;
  return sorted.slice(-Math.min(n, sorted.length));
}

function chronologicalValidRecords(): ContractionRecord[] {
  return [...state.records]
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);
}

function renderHistoryTable(root: HTMLElement): void {
  const tbody = root.querySelector<HTMLTableSectionElement>("#history-table-body");
  const emptyEl = root.querySelector<HTMLElement>("#history-table-empty");
  const wrap = root.querySelector<HTMLElement>(".history-table-wrap");
  if (!tbody || !emptyEl) return;

  const rows = chronologicalValidRecords();
  tbody.textContent = "";

  if (rows.length === 0) {
    emptyEl.hidden = false;
    if (wrap) wrap.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  if (wrap) wrap.hidden = false;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    const tr = document.createElement("tr");

    const intervalMs =
      i > 0 ? r.start - rows[i - 1]!.start : null;
    const intervalStr =
      intervalMs != null ? formatDuration(intervalMs) : "—";
    const freqStr =
      intervalMs != null && intervalMs > 0
        ? formatContractionsPerHour(intervalMs)
        : "—";

    const thNum = document.createElement("th");
    thNum.scope = "row";
    thNum.textContent = String(i + 1);

    const tdStart = document.createElement("td");
    tdStart.textContent = dateTimeFmt.format(r.start);

    const tdDur = document.createElement("td");
    tdDur.textContent = formatDuration(r.end - r.start);

    const tdInt = document.createElement("td");
    tdInt.textContent = intervalStr;

    const tdFreq = document.createElement("td");
    tdFreq.textContent = freqStr;

    const tdNote = document.createElement("td");
    tdNote.className = "history-table-note";
    const nt = r.note?.trim();
    tdNote.textContent = nt ?? "—";

    tr.append(thNum, tdStart, tdDur, tdInt, tdFreq, tdNote);
    tbody.appendChild(tr);
  }
}

function buildMidwifePlainText(root: HTMLElement): string {
  const sel = root.querySelector<HTMLSelectElement>("#midwife-count-select");
  const mode = parseMidwifeMode(sel?.value ?? "12");
  const sorted = chronologicalValidRecords();
  const done = sliceForMidwife(sorted, mode);
  const s = state.settings;
  const lines: string[] = [];
  const headerFmt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  lines.push("Miss Contraction — Résumé pour la sage-femme");
  lines.push(`Généré le ${headerFmt.format(new Date())}`);
  lines.push("");
  lines.push("Seuils configurés dans l’application :");
  lines.push(
    `— ${s.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${s.maxIntervalMin} min, durée ≥ ${s.minDurationSec} s chacune.`
  );
  lines.push("");
  const firstEnd = findFirstThresholdMatchEndMs(state.records, s);
  if (firstEnd != null) {
    lines.push(
      `Première fois où ces critères ont été remplis (sur tout l’historique) : ${dateTimeFmtLong.format(firstEnd)}.`
    );
  } else {
    lines.push(
      "Aucun groupe de contractions consécutives n’a encore rempli ces critères dans l’historique enregistré."
    );
  }
  lines.push("");
  const modeLabel =
    mode === "all" ? "tout l’historique" : `les ${mode} dernières contractions`;
  lines.push(`Période du tableau et des moyennes : ${modeLabel} (${done.length} contraction(s)).`);
  lines.push("");
  if (done.length === 0) {
    lines.push("Aucune contraction dans cette sélection.");
    lines.push("");
    lines.push("—");
    lines.push("Données indicatives — ne remplacent pas un avis médical.");
    return lines.join("\n");
  }
  const meanInterval = meanStartIntervalMs(done);
  const meanDur = meanContractionDurationMs(done);
  const qtyHour =
    meanInterval != null && meanInterval > 0
      ? String(Math.round(3600000 / meanInterval))
      : "—";
  lines.push("Moyennes sur cette sélection :");
  lines.push(
    `— Quantité estimée : ≈ ${qtyHour} contraction(s) / h (si le rythme restait constant).`
  );
  lines.push(
    `— Durée moyenne : ${meanDur != null ? formatStatsClock(meanDur) : "—"} (mm:ss).`
  );
  lines.push(
    `— Intervalle moyen entre débuts : ${meanInterval != null ? formatStatsClock(meanInterval) : "—"} (mm:ss).`
  );
  lines.push("");
  lines.push("Détail (ordre chronologique) :");
  for (let i = 0; i < done.length; i++) {
    const r = done[i]!;
    const intervalMs = i > 0 ? r.start - done[i - 1]!.start : null;
    const intervalStr = intervalMs != null ? formatDuration(intervalMs) : "—";
    const note = r.note?.trim();
    lines.push(
      `${i + 1}. ${dateTimeFmt.format(r.start)} — durée ${formatDuration(r.end - r.start)} — écart depuis précédente : ${intervalStr}${note ? ` — note : ${note}` : ""}`
    );
  }
  lines.push("");
  lines.push("—");
  lines.push("Données indicatives — ne remplacent pas un avis médical.");
  return lines.join("\n");
}

function renderMidwifePanel(root: HTMLElement): void {
  const mount = root.querySelector<HTMLElement>("#midwife-print-root");
  if (!mount) return;
  const sel = root.querySelector<HTMLSelectElement>("#midwife-count-select");
  const mode = parseMidwifeMode(sel?.value ?? "12");
  const sorted = chronologicalValidRecords();
  const done = sliceForMidwife(sorted, mode);
  const s = state.settings;
  const firstEnd = findFirstThresholdMatchEndMs(state.records, s);
  const modeLabel =
    mode === "all" ? "Tout l’historique" : `Les ${mode} dernières contractions`;
  const headerFmt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (done.length === 0) {
    mount.innerHTML = `
      <div class="midwife-doc">
        <p class="midwife-doc-title">Miss Contraction — Résumé</p>
        <p class="midwife-doc-meta">Généré le ${escapeHtml(headerFmt.format(new Date()))}</p>
        <section class="midwife-doc-section">
          <h3 class="midwife-doc-h">Seuils (réglages actuels)</h3>
          <p>${s.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${s.maxIntervalMin} min, durée ≥ ${s.minDurationSec} s chacune.</p>
        </section>
        <section class="midwife-doc-section">
          <h3 class="midwife-doc-h">Premier seuil atteint (tout l’historique)</h3>
          <p>${
            firstEnd != null
              ? escapeHtml(dateTimeFmtLong.format(firstEnd))
              : "Aucun groupe enregistré ne remplit encore ces critères."
          }</p>
        </section>
        <section class="midwife-doc-section">
          <h3 class="midwife-doc-h">${escapeHtml(modeLabel)}</h3>
          <p class="midwife-empty">Aucune contraction dans cette sélection.</p>
        </section>
        <p class="midwife-doc-disclaimer">Données indicatives — ne remplacent pas un avis médical.</p>
      </div>`;
    return;
  }

  const meanInterval = meanStartIntervalMs(done);
  const meanDur = meanContractionDurationMs(done);
  const qtyHour =
    meanInterval != null && meanInterval > 0
      ? String(Math.round(3600000 / meanInterval))
      : "—";

  const rows = done
    .map((r, i) => {
      const intervalMs = i > 0 ? r.start - done[i - 1]!.start : null;
      const intervalStr = intervalMs != null ? formatDuration(intervalMs) : "—";
      const note = r.note?.trim();
      return `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(dateTimeFmt.format(r.start))}</td>
        <td>${escapeHtml(formatDuration(r.end - r.start))}</td>
        <td>${escapeHtml(intervalStr)}</td>
        <td>${note ? escapeHtml(note) : "—"}</td>
      </tr>`;
    })
    .join("");

  mount.innerHTML = `
    <div class="midwife-doc">
      <p class="midwife-doc-title">Miss Contraction — Résumé pour la sage-femme</p>
      <p class="midwife-doc-meta">Généré le ${escapeHtml(headerFmt.format(new Date()))}</p>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Seuils (réglages actuels)</h3>
        <p>${s.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${s.maxIntervalMin} min, durée ≥ ${s.minDurationSec} s chacune.</p>
      </section>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Premier seuil atteint (tout l’historique)</h3>
        <p>${
          firstEnd != null
            ? escapeHtml(dateTimeFmtLong.format(firstEnd))
            : "Aucun groupe enregistré ne remplit encore ces critères."
        }</p>
        <p class="midwife-doc-note">Instant retenu : fin de la dernière contraction du premier groupe qui satisfait simultanément l’intervalle et la durée configurés.</p>
      </section>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Moyennes — ${escapeHtml(modeLabel)} (${done.length})</h3>
        <ul class="midwife-doc-stats">
          <li>Quantité estimée : ≈ ${escapeHtml(qtyHour)} contraction(s) / h (rythme constant)</li>
          <li>Durée moyenne : ${meanDur != null ? escapeHtml(formatStatsClock(meanDur)) : "—"} (mm:ss)</li>
          <li>Intervalle moyen entre débuts : ${meanInterval != null ? escapeHtml(formatStatsClock(meanInterval)) : "—"} (mm:ss)</li>
        </ul>
      </section>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Détail (ordre chronologique)</h3>
        <div class="midwife-table-wrap">
          <table class="midwife-table">
            <thead>
              <tr>
                <th scope="col">N°</th>
                <th scope="col">Début</th>
                <th scope="col">Durée</th>
                <th scope="col">Écart</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <p class="midwife-doc-disclaimer">Données indicatives — ne remplacent pas un avis médical.</p>
    </div>`;
}

async function copyMidwifeSummary(root: HTMLElement): Promise<void> {
  const text = buildMidwifePlainText(root);
  const fb = root.querySelector<HTMLElement>("#midwife-copy-feedback");
  try {
    await navigator.clipboard.writeText(text);
    if (fb) {
      fb.hidden = false;
      fb.textContent = "Texte copié dans le presse-papiers.";
      window.setTimeout(() => {
        fb.hidden = true;
        fb.textContent = "";
      }, 3500);
    }
  } catch {
    if (fb) {
      fb.hidden = false;
      fb.textContent = "Copie impossible — utilisez « Imprimer ou PDF » ou copiez le texte affiché.";
      window.setTimeout(() => {
        fb.hidden = true;
        fb.textContent = "";
      }, 4500);
    }
  }
}

function renderHistory(root: HTMLElement): void {
  const list = root.querySelector<HTMLUListElement>("#history-list")!;
  const empty = root.querySelector<HTMLElement>("#history-empty")!;
  const done = [...state.records].reverse();
  list.innerHTML = "";
  if (done.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  const total = done.length;
  for (let i = 0; i < done.length; i++) {
    const r = done[i]!;
    const li = document.createElement("li");
    li.className = "timeline-item";
    if (i === 0) li.classList.add("timeline-item--latest");
    /** Numéro chronologique : 1 = plus ancienne, N = plus récente (liste affichée du récent au plus ancien). */
    const occurrenceNum = total - i;
    const intervalPrev =
      i < done.length - 1
        ? formatDuration(r.start - done[i + 1]!.start)
        : "—";
    const iso = new Date(r.start).toISOString();
    li.innerHTML = `
      <div class="timeline-marker" aria-hidden="true"></div>
      <div class="timeline-body">
        <div class="timeline-time-row">
          <span class="timeline-num" title="Contraction n°${occurrenceNum}">${occurrenceNum}</span>
          <time class="timeline-time" datetime="${iso}">${dateTimeFmt.format(r.start)}</time>
        </div>
        <p class="timeline-meta">
          <span class="timeline-stat">Durée <strong>${formatDuration(r.end - r.start)}</strong></span>
          <span class="timeline-sep" aria-hidden="true">·</span>
          <span class="timeline-stat">Écart <strong>${intervalPrev}</strong></span>
        </p>
        ${
          r.note?.trim()
            ? `<p class="timeline-note">${escapeHtml(r.note.trim())}</p>`
            : ""
        }
        <div class="timeline-actions">
          <button type="button" class="btn btn-ghost btn-tiny" data-action="edit" data-id="${r.id}" aria-label="Modifier cette contraction">
            Modifier
          </button>
          <button type="button" class="btn btn-ghost btn-tiny timeline-action-danger" data-action="delete" data-id="${r.id}" aria-label="Supprimer cette contraction">
            Supprimer
          </button>
        </div>
      </div>
    `;
    list.appendChild(li);
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const sec = Math.round(ms / 1000);
  if (sec < 120) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} min ${s} s`;
}

type ExportPayload = {
  version: 1;
  app: string;
  exportedAt: string;
  records: ContractionRecord[];
  settings: AppSettings;
};

function buildExportPayload(): ExportPayload {
  return {
    version: 1,
    app: "Miss Contraction",
    exportedAt: new Date().toISOString(),
    records: state.records.map((r) => ({ ...r })),
    settings: { ...state.settings },
  };
}

function exportFilenameJson(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `miss-contraction-${y}-${m}-${day}.json`;
}

function downloadExportJson(): void {
  const payload = buildExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFilenameJson();
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildShareText(): string {
  const recs = [...state.records].sort((a, b) => a.start - b.start);
  const n = recs.length;
  if (n === 0) return "";
  const headerFmt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const lines: string[] = [];
  lines.push(`Miss Contraction — résumé (${headerFmt.format(new Date())})`);
  lines.push(`${n} contraction(s) enregistrée(s).`);
  lines.push("");
  lines.push("Contractions (ordre chronologique) :");
  const startIdx = Math.max(0, recs.length - 12);
  for (let idx = startIdx; idx < recs.length; idx++) {
    const r = recs[idx]!;
    const interval =
      idx > 0 ? formatDuration(r.start - recs[idx - 1]!.start) : "—";
    const notePart = r.note?.trim() ? ` — note : ${r.note.trim()}` : "";
    lines.push(
      `• ${dateTimeFmt.format(r.start)} — durée ${formatDuration(r.end - r.start)} — écart : ${interval}${notePart}`
    );
  }
  const s = state.settings;
  lines.push("");
  lines.push(
    `Seuils d’alerte : ${s.consecutiveCount} contractions, écart ≤ ${s.maxIntervalMin} min, durée ≥ ${s.minDurationSec} s.`
  );
  lines.push("");
  lines.push(
    "Données à titre informatif — ne remplacent pas un avis médical."
  );
  return lines.join("\n");
}

function makeExportFile(): File | null {
  try {
    const json = JSON.stringify(buildExportPayload(), null, 2);
    return new File([json], exportFilenameJson(), {
      type: "application/json",
    });
  } catch {
    return null;
  }
}

async function shareHistory(root: HTMLElement): Promise<void> {
  if (state.records.length === 0) return;
  const text = buildShareText();
  const file = makeExportFile();

  if (navigator.share) {
    try {
      if (
        file &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Miss Contraction",
          text: "Historique des contractions (fichier JSON joint).",
          files: [file],
        });
        flashShareExportFeedback(root, "Partage effectué.");
        return;
      }
      await navigator.share({
        title: "Miss Contraction",
        text,
      });
      flashShareExportFeedback(root, "Partage effectué.");
      return;
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "AbortError") return;
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      flashShareExportFeedback(root, "Résumé copié dans le presse-papiers.");
      return;
    }
  } catch {
    /* fallback export */
  }

  downloadExportJson();
  flashShareExportFeedback(
    root,
    "Partage indisponible — fichier JSON téléchargé."
  );
}

let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

function flashShareExportFeedback(root: HTMLElement, message: string): void {
  const el = root.querySelector<HTMLElement>("#share-export-feedback");
  if (!el) return;
  if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer);
  el.textContent = message;
  el.hidden = false;
  shareFeedbackTimer = setTimeout(() => {
    el.hidden = true;
    el.textContent = "";
    shareFeedbackTimer = null;
  }, 4500);
}
