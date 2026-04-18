import type { AppSettings, ContractionRecord } from './storage';
import {
  KEY_EXPORT_NUDGE_DISMISSED,
  clearSnoozeUntil,
  loadRecords,
  loadSettings,
  loadSnoozeUntil,
  saveRecords,
  saveSettings,
  setSnoozeUntilMs,
} from './storage';
import {
  computeThresholdBadge,
  filterRecordsByStatsWindow,
  findFirstThresholdMatchEndMs,
  getRecentIntervalsMs,
} from './statsHelpers';
import type { AppRoute } from './router';
import {
  parseRoute,
  getBreadcrumbLabel,
  getDocumentTitle,
  startRouter,
} from './router';
import { focusMainContent } from './focus-utils';
import { cycleThemePreference, syncThemeButton } from './theme';
import { shellHtml } from './shell-html';
import { escapeHtml } from './html-utils';
import { isReactRoute } from './react/reactRoutes';

// Marqueur global pour indiquer que Vanilla gère une route
declare global {
  interface Window {
    __VANILLA_ROUTE__: string | null;
    __REACT_ROUTE__: string | null;
  }
}

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

let pendingUndo: {
  id: string;
  timeoutId: ReturnType<typeof setTimeout>;
} | null = null;

let preAlertLatch = false;

/** Bandeau pré-alerte masqué manuellement jusqu’à la prochaine contraction enregistrée. */
let preAlertBannerDismissed = false;

let recognitionInstance: SpeechRecognitionInstance | null = null;

const MATERNITY_MESSAGE_STORAGE_KEY = 'mc_maternity_message_v1';

const EXPORT_NUDGE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

const UNDO_MS = 30_000;

const DEFAULT_MATERNITY_MESSAGE =
  'Coucou,\n\n' +
  'C’est le grand jour pour nous : je pars à la maternité. Les contractions se suivent bien, et c’est cohérent avec ce qu’on s’était dit avec la sage-femme.\n\n' +
  'J’ai un peu les papillons, mais je me sens prête. Pense fort à nous — je t’envoie des nouvelles dès que je peux.\n\n' +
  'Je t’embrasse';

export function mountApp(root: HTMLDivElement): void {
  root.innerHTML = shellHtml();
  bind(root);
  applyRoute(root);
  render(root);
}

/**
 * Affiche un badge indiquant le renderer actif (Vanilla ou React)
 */
function updateRendererBadge(root: HTMLElement, isReact: boolean): void {
  let badge = root.querySelector<HTMLElement>('#renderer-badge');
  if (!badge) {
    // Créer le badge s'il n'existe pas
    badge = document.createElement('div');
    badge.id = 'renderer-badge';
    badge.style.cssText = 'position:fixed;top:60px;right:8px;z-index:9999;padding:4px 8px;font-size:10px;border-radius:4px;font-weight:bold;opacity:0.8;';
    document.body.appendChild(badge);
  }
  if (isReact) {
    badge.textContent = '🟦 React';
    badge.style.backgroundColor = '#61dafb';
    badge.style.color = '#000';
  } else {
    badge.textContent = '🟩 Vanilla';
    badge.style.backgroundColor = '#4caf50';
    badge.style.color = '#fff';
  }
}

function updateDrawerNavActive(root: HTMLElement, route: AppRoute): void {
  root
    .querySelectorAll<HTMLAnchorElement>('a.drawer-link[data-drawer-route]')
    .forEach(a => {
      const r = a.dataset.drawerRoute as AppRoute | undefined;
      const current = r === route;
      a.classList.toggle('drawer-link--current', current);
      if (current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
}

function renderTopBreadcrumb(root: HTMLElement, route: AppRoute): void {
  const nav = root.querySelector<HTMLElement>('#top-bar-bc-nav');
  if (!nav) return;
  const acc = getBreadcrumbLabel('home');
  const cur = getBreadcrumbLabel(route);
  if (route === 'home') {
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
  if (route === 'message' && !state.settings.moduleMaternityMessage) {
    history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#/`
    );
    route = 'home';
  }
  const home = root.querySelector<HTMLElement>('#view-home')!;
  const settings = root.querySelector<HTMLElement>('#view-settings')!;
  const message = root.querySelector<HTMLElement>('#view-message')!;
  const table = root.querySelector<HTMLElement>('#view-table')!;
  const maternity = root.querySelector<HTMLElement>('#view-maternity')!;
  const midwife = root.querySelector<HTMLElement>('#view-midwife')!;

  home.hidden = route !== 'home';
  settings.hidden = route !== 'settings';
  message.hidden = route !== 'message';
  table.hidden = route !== 'table';
  maternity.hidden = route !== 'maternity';
  midwife.hidden = route !== 'midwife';

  // Marqueur Vanilla pour le débogage
  window.__VANILLA_ROUTE__ = route;
  console.log('🟩 Vanilla: Route changed to', route);

  // Mettre à jour le badge de renderer
  updateRendererBadge(root, isReactRoute(route));
  if (route === 'settings') {
    window.scrollTo(0, 0);
    if (settingsSaveFeedbackTimer !== null) {
      clearTimeout(settingsSaveFeedbackTimer);
      settingsSaveFeedbackTimer = null;
    }
    const fb = root.querySelector<HTMLElement>('#settings-save-feedback');
    if (fb) {
      fb.textContent = '';
      fb.hidden = true;
    }
  }
  if (route === 'maternity' || route === 'midwife') {
    window.scrollTo(0, 0);
  }
  renderTopBreadcrumb(root, route);
  updateDrawerNavActive(root, route);
  document.title = getDocumentTitle(route);
  closeEditDialogIfOpen(root);
  closeDrawer(root);
}

function closeDrawer(root: HTMLElement): void {
  const bd = root.querySelector<HTMLElement>('#nav-backdrop')!;
  const dr = root.querySelector<HTMLElement>('#app-drawer')!;
  const btn = root.querySelector<HTMLButtonElement>('#btn-menu')!;
  bd.classList.remove('is-open');
  dr.classList.remove('is-open');
  bd.setAttribute('aria-hidden', 'true');
  dr.setAttribute('aria-hidden', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.classList.remove('hamburger--open');
  document.body.style.overflow = '';
}

function openDrawer(root: HTMLElement): void {
  const bd = root.querySelector<HTMLElement>('#nav-backdrop')!;
  const dr = root.querySelector<HTMLElement>('#app-drawer')!;
  const btn = root.querySelector<HTMLButtonElement>('#btn-menu')!;
  bd.classList.add('is-open');
  dr.classList.add('is-open');
  bd.setAttribute('aria-hidden', 'false');
  dr.setAttribute('aria-hidden', 'false');
  btn.setAttribute('aria-expanded', 'true');
  btn.classList.add('hamburger--open');
  document.body.style.overflow = 'hidden';
}

function toggleDrawer(root: HTMLElement): void {
  const dr = root.querySelector<HTMLElement>('#app-drawer')!;
  if (dr.classList.contains('is-open')) closeDrawer(root);
  else openDrawer(root);
}

function bind(root: HTMLElement): void {
  const btnToggle = root.querySelector<HTMLButtonElement>('#btn-toggle')!;
  const btnClear = root.querySelector<HTMLButtonElement>('#btn-clear-history')!;
  const btnShare = root.querySelector<HTMLButtonElement>('#btn-share')!;
  const btnExport = root.querySelector<HTMLButtonElement>('#btn-export')!;
  const form = root.querySelector<HTMLFormElement>('#form-settings')!;
  const btnNotify = root.querySelector<HTMLButtonElement>('#btn-notify')!;

  btnToggle.addEventListener('click', () => {
    if (state.activeStart === null) startContraction(root);
    else endContraction(root);
  });

  btnClear.addEventListener('click', () => {
    if (!confirm('Effacer tout l’historique sur cet appareil ?')) return;
    state.records = [];
    state.alertLatch = false;
    preAlertLatch = false;
    dismissUndoBanner(root);
    saveRecords(state.records);
    closeEditDialogIfOpen(root);
    render(root);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    state.settings.maxIntervalMin = Number(fd.get('maxIntervalMin'));
    state.settings.minDurationSec = Number(fd.get('minDurationSec'));
    state.settings.consecutiveCount = Number(fd.get('consecutiveCount'));
    const sw = fd.get('statsWindowMinutes');
    state.settings.statsWindowMinutes =
      sw === '30' || sw === '60' || sw === '120' || sw === 'all' ? sw : 'all';
    state.settings.openContractionReminderMin = Number(
      fd.get('openContractionReminderMin')
    );
    state.settings.maternityLabel = String(fd.get('maternityLabel') ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    state.settings.maternityPhone = String(fd.get('maternityPhone') ?? '')
      .replace(/[^\d+]/g, '')
      .slice(0, 20);
    state.settings.maternityAddress = String(fd.get('maternityAddress') ?? '')
      .replace(/\r\n/g, '\n')
      .trim()
      .slice(0, 800);
    state.settings.preAlertEnabled =
      root.querySelector<HTMLInputElement>('#pre-alert-check')!.checked;
    state.settings.largeMode =
      root.querySelector<HTMLInputElement>('#large-mode-check')!.checked;
    state.settings.keepAwakeDuringContraction =
      root.querySelector<HTMLInputElement>('#keep-awake-check')!.checked;
    state.settings.vibrationEnabled =
      root.querySelector<HTMLInputElement>('#vibration-check')!.checked;
    state.settings.moduleVoiceCommands = root.querySelector<HTMLInputElement>(
      '#module-voice-check'
    )!.checked;
    state.settings.moduleMaternityMessage =
      root.querySelector<HTMLInputElement>('#module-message-check')!.checked;
    state.settings.voiceCommandsEnabled =
      root.querySelector<HTMLInputElement>('#voice-check')!.checked;
    if (!state.settings.moduleVoiceCommands) {
      state.settings.voiceCommandsEnabled = false;
    }
    saveSettings(state.settings);
    render(root);
    showSettingsSavedFeedback(root);
  });

  root
    .querySelector<HTMLButtonElement>('#btn-dismiss-long-open')!
    .addEventListener('click', () => {
      hideLongOpenBanner(root);
    });

  root
    .querySelector<HTMLButtonElement>('#btn-undo-add')!
    .addEventListener('click', () => {
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

  root
    .querySelector<HTMLElement>('#undo-intensity-area')!
    .addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        'button[data-intensity]'
      );
      if (!btn || !pendingUndo) return;
      const val = Number(btn.dataset.intensity);
      const last = state.records[state.records.length - 1];
      if (last?.id === pendingUndo.id) {
        last.intensity = val;
        saveRecords(state.records);
        dismissUndoBanner(root);
        render(root);
      }
    });

  root
    .querySelector<HTMLButtonElement>('#btn-dismiss-pre')!
    .addEventListener('click', () => {
      preAlertBannerDismissed = true;
      root.querySelector<HTMLElement>('#banner-pre-alert')!.hidden = true;
    });

  root
    .querySelector<HTMLButtonElement>('#btn-dismiss-export-nudge')!
    .addEventListener('click', () => {
      try {
        localStorage.setItem(KEY_EXPORT_NUDGE_DISMISSED, String(Date.now()));
      } catch {
        /* ignore */
      }
      root.querySelector<HTMLElement>('#banner-export-nudge')!.hidden = true;
    });

  root
    .querySelector<HTMLButtonElement>('#btn-snooze-30')!
    .addEventListener('click', () => {
      setSnoozeUntilMs(Date.now() + 30 * 60 * 1000);
      render(root);
    });
  root
    .querySelector<HTMLButtonElement>('#btn-snooze-60')!
    .addEventListener('click', () => {
      setSnoozeUntilMs(Date.now() + 60 * 60 * 1000);
      render(root);
    });
  root
    .querySelector<HTMLButtonElement>('#btn-snooze-clear')!
    .addEventListener('click', () => {
      clearSnoozeUntil();
      render(root);
    });

  root
    .querySelector<HTMLButtonElement>('#btn-voice')!
    .addEventListener('click', () => {
      const hint = root.querySelector<HTMLElement>('#status-hint')!;
      const Ctor = getSpeechCtor();
      if (!Ctor) {
        hint.textContent = 'Commande vocale non disponible sur ce navigateur.';
        return;
      }
      try {
        recognitionInstance?.stop();
      } catch {
        /* ignore */
      }
      recognitionInstance = null;
      const rec = new Ctor();
      rec.lang = 'fr-FR';
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev: Event) => {
        const results = (
          ev as unknown as {
            results: { [i: number]: { 0: { transcript: string } } };
          }
        ).results;
        const alt = results[0]?.[0]?.transcript ?? '';
        const t = alt.toLowerCase();
        if (t.includes('début') || t.includes('debut')) {
          if (state.activeStart === null) startContraction(root);
        } else if (t.includes('fin')) {
          if (state.activeStart !== null) endContraction(root);
        } else {
          hint.textContent = `Entendu : « ${alt.trim() || '…'} » — dites « début » ou « fin ».`;
        }
      };
      rec.onerror = () => {
        hint.textContent = 'Micro refusé ou erreur — vérifiez les permissions.';
      };
      rec.onend = () => {
        recognitionInstance = null;
      };
      recognitionInstance = rec;
      try {
        rec.start();
        hint.textContent = 'Écoute… dites « début » ou « fin ».';
      } catch {
        hint.textContent = 'Impossible de démarrer l’écoute.';
      }
    });

  btnNotify.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      setNotifyStatus(root, 'Non supporté sur ce navigateur.');
      return;
    }
    const perm = await Notification.requestPermission();
    state.settings.notificationsEnabled = perm === 'granted';
    saveSettings(state.settings);
    setNotifyStatus(root, permLabel(perm));
    render(root);
  });

  btnShare.addEventListener('click', () => {
    void shareHistory(root);
  });

  btnExport.addEventListener('click', () => {
    downloadExportJson();
    flashShareExportFeedback(root, 'Fichier JSON téléchargé.');
  });

  root
    .querySelector<HTMLSelectElement>('#midwife-count-select')!
    .addEventListener('change', () => {
      renderMidwifePanel(root);
    });
  root
    .querySelector<HTMLButtonElement>('#btn-midwife-copy')!
    .addEventListener('click', () => {
      void copyMidwifeSummary(root);
    });
  root
    .querySelector<HTMLButtonElement>('#btn-midwife-print')!
    .addEventListener('click', () => {
      window.print();
    });

  bindHistoryActions(root);
  bindEditDialog(root);

  const btnMenu = root.querySelector<HTMLButtonElement>('#btn-menu')!;
  const navBackdrop = root.querySelector<HTMLElement>('#nav-backdrop')!;
  const appDrawer = root.querySelector<HTMLElement>('#app-drawer')!;
  btnMenu.addEventListener('click', () => toggleDrawer(root));
  navBackdrop.addEventListener('click', () => closeDrawer(root));
  root
    .querySelector<HTMLButtonElement>('#btn-drawer-close')!
    .addEventListener('click', () => {
      closeDrawer(root);
      btnMenu.focus();
    });

  const btnTheme = root.querySelector<HTMLButtonElement>('#btn-theme')!;
  syncThemeButton(btnTheme);
  btnTheme.addEventListener('click', () => {
    cycleThemePreference();
    syncThemeButton(btnTheme, true);
  });

  appDrawer.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(
      'a.drawer-link'
    );
    if (!a) return;
    closeDrawer(root);
  });

  startRouter(() => {
    applyRoute(root);
    render(root);
    requestAnimationFrame(() => focusMainContent());
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    const dr = root.querySelector<HTMLElement>('#app-drawer');
    if (dr?.classList.contains('is-open')) {
      e.preventDefault();
      closeDrawer(root);
    }
  });

  bindMaternityMessage(root);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (
      state.activeStart !== null &&
      state.settings.keepAwakeDuringContraction
    ) {
      void acquireWakeLock();
    }
  });
}

function getMaternityMessageText(root: HTMLElement): string {
  return root.querySelector<HTMLTextAreaElement>('#msg-template')?.value ?? '';
}

function setMaternityMessageFeedback(root: HTMLElement, text: string): void {
  const el = root.querySelector<HTMLElement>('#msg-feedback');
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
    if (s != null && s.trim() !== '') return s;
  } catch {
    /* ignore */
  }
  return DEFAULT_MATERNITY_MESSAGE;
}

function bindMaternityMessage(root: HTMLElement): void {
  const ta = root.querySelector<HTMLTextAreaElement>('#msg-template');
  if (!ta) return;
  ta.value = loadMaternityMessageDraft();

  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  ta.addEventListener('input', () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persistMaternityMessage(ta.value);
    }, 400);
  });

  root
    .querySelector<HTMLButtonElement>('#btn-msg-reset')!
    .addEventListener('click', () => {
      ta.value = DEFAULT_MATERNITY_MESSAGE;
      persistMaternityMessage(ta.value);
      setMaternityMessageFeedback(root, 'Modèle par défaut restauré.');
    });

  root
    .querySelector<HTMLButtonElement>('#btn-msg-copy')!
    .addEventListener('click', async () => {
      const text = getMaternityMessageText(root);
      if (!text.trim()) {
        setMaternityMessageFeedback(root, 'Le message est vide.');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        setMaternityMessageFeedback(
          root,
          'Message copié dans le presse-papiers.'
        );
      } catch {
        setMaternityMessageFeedback(
          root,
          'Copie impossible — sélectionnez le texte manuellement.'
        );
      }
    });

  root
    .querySelector<HTMLButtonElement>('#btn-msg-whatsapp')!
    .addEventListener('click', () => {
      const text = getMaternityMessageText(root);
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      setMaternityMessageFeedback(
        root,
        'WhatsApp ouvert dans un nouvel onglet (ou l’app sur mobile).'
      );
    });

  root
    .querySelector<HTMLButtonElement>('#btn-msg-sms')!
    .addEventListener('click', () => {
      const text = getMaternityMessageText(root);
      const url = `sms:?body=${encodeURIComponent(text)}`;
      window.location.href = url;
      setMaternityMessageFeedback(
        root,
        'Si rien ne s’ouvre, utilisez « Copier » puis collez dans votre app SMS.'
      );
    });
}

function sortRecordsByStart(): void {
  state.records.sort((a, b) => a.start - b.start);
}

function bindHistoryActions(root: HTMLElement): void {
  const list = root.querySelector<HTMLUListElement>('#history-list')!;
  list.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      'button[data-action][data-id]'
    );
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id || (action !== 'delete' && action !== 'edit')) return;

    if (action === 'delete') {
      if (!confirm('Supprimer cette contraction de l’historique ?')) return;
      const idx = state.records.findIndex(r => r.id === id);
      if (idx === -1) return;
      state.records.splice(idx, 1);
      state.alertLatch = false;
      saveRecords(state.records);
      render(root);
      return;
    }

    const rec = state.records.find(r => r.id === id);
    if (!rec) return;
    openEditDialog(root, id, rec);
  });
}

function bindEditDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>(
    '#edit-contraction-dialog'
  )!;
  const form = root.querySelector<HTMLFormElement>('#edit-contraction-form')!;
  const inpStart = root.querySelector<HTMLInputElement>('#edit-start')!;
  const inpEnd = root.querySelector<HTMLInputElement>('#edit-end')!;
  const inpNote = root.querySelector<HTMLTextAreaElement>('#edit-note')!;
  const err = root.querySelector<HTMLElement>('#edit-dialog-error')!;
  const btnCancel = root.querySelector<HTMLButtonElement>(
    '#edit-dialog-cancel'
  )!;

  btnCancel.addEventListener('click', () => {
    editingRecordId = null;
    dialog.close();
  });

  dialog.addEventListener('close', () => {
    editingRecordId = null;
    err.textContent = '';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    err.textContent = '';
    if (!editingRecordId) return;
    const start = new Date(inpStart.value).getTime();
    const end = new Date(inpEnd.value).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) {
      err.textContent = 'Vérifiez les dates saisies.';
      return;
    }
    if (end < start) {
      err.textContent = 'La fin doit être après le début.';
      return;
    }
    const rec = state.records.find(r => r.id === editingRecordId);
    if (!rec) {
      dialog.close();
      return;
    }
    rec.start = start;
    rec.end = end;
    const noteRaw = inpNote.value.trim();
    if (noteRaw) rec.note = noteRaw.slice(0, 240);
    else delete rec.note;

    const fd = new FormData(form);
    const intensity = fd.get('intensity');
    if (intensity) rec.intensity = Number(intensity);
    else delete rec.intensity;

    sortRecordsByStart();
    state.alertLatch = false;
    saveRecords(state.records);
    editingRecordId = null;
    dialog.close();
    render(root);
  });

  root
    .querySelector<HTMLButtonElement>('#btn-edit-intensity-clear')!
    .addEventListener('click', () => {
      form
        .querySelectorAll<HTMLInputElement>('input[name="intensity"]')
        .forEach(rad => {
          rad.checked = false;
        });
    });

  root
    .querySelector<HTMLElement>('#edit-quick-notes')!
    .addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        'button[data-note]'
      );
      if (!btn) return;
      const tag = btn.dataset.note || '';
      const cur = inpNote.value.trim();
      if (!cur) {
        inpNote.value = tag;
      } else if (!cur.includes(tag)) {
        inpNote.value = `${cur}, ${tag}`;
      }
    });
}

function closeEditDialogIfOpen(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>(
    '#edit-contraction-dialog'
  );
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
  const dialog = root.querySelector<HTMLDialogElement>(
    '#edit-contraction-dialog'
  )!;
  const inpStart = root.querySelector<HTMLInputElement>('#edit-start')!;
  const inpEnd = root.querySelector<HTMLInputElement>('#edit-end')!;
  const inpNote = root.querySelector<HTMLTextAreaElement>('#edit-note')!;
  const err = root.querySelector<HTMLElement>('#edit-dialog-error')!;
  editingRecordId = id;
  err.textContent = '';
  inpStart.value = toDatetimeLocalValue(rec.start);
  inpEnd.value = toDatetimeLocalValue(rec.end);
  inpNote.value = rec.note ?? '';

  const radios = root.querySelectorAll<HTMLInputElement>(
    'input[name="intensity"]'
  );
  radios.forEach(r => {
    r.checked = Number(r.value) === rec.intensity;
  });

  dialog.showModal();
}

function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
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
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
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
      const el = root.querySelector<HTMLElement>('#banner-long-open');
      const txt = root.querySelector<HTMLElement>('#banner-long-open-text');
      if (el && txt) {
        txt.textContent = `Une contraction semble toujours en cours depuis plus de ${limit} min. Avez-vous oublié d’appuyer sur « Fin » ?`;
        el.hidden = false;
      }
      maybeVibrate([70, 35, 70]);
      if (
        state.settings.notificationsEnabled &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        new Notification('Miss Contraction', {
          body: 'Pensez à indiquer la fin de la contraction si elle est terminée.',
          tag: 'mc-open-reminder',
        });
      }
    }
  };
  openSessionReminderTimer = setInterval(tick, 15_000);
  tick();
}

function hideLongOpenBanner(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>('#banner-long-open');
  if (el) el.hidden = true;
  longOpenNotified = false;
}

function showUndoBanner(root: HTMLElement, recordId: string): void {
  if (pendingUndo) clearTimeout(pendingUndo.timeoutId);
  const banner = root.querySelector<HTMLElement>('#banner-undo');
  if (banner) banner.hidden = false;
  const tid = setTimeout(() => {
    pendingUndo = null;
    const b = root.querySelector<HTMLElement>('#banner-undo');
    if (b) b.hidden = true;
  }, UNDO_MS);
  pendingUndo = { id: recordId, timeoutId: tid };
}

function dismissUndoBanner(root: HTMLElement): void {
  if (pendingUndo) clearTimeout(pendingUndo.timeoutId);
  pendingUndo = null;
  const b = root.querySelector<HTMLElement>('#banner-undo');
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
  const btn = root.querySelector<HTMLButtonElement>('#btn-toggle')!;
  btn.textContent = 'Fin de contraction';
  btn.classList.add('btn-danger', 'recording');
  btn.classList.remove('btn-primary');
  const timerBlock = root.querySelector<HTMLElement>('#timer-block')!;
  timerBlock.hidden = false;
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(() => updateTimer(root), 1000);
  updateTimer(root);
  root.querySelector<HTMLElement>('#status-hint')!.textContent =
    'Appuyez à nouveau à la fin de la contraction.';
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
  const btn = root.querySelector<HTMLButtonElement>('#btn-toggle')!;
  btn.textContent = 'Début de contraction';
  btn.classList.add('btn-primary');
  btn.classList.remove('btn-danger', 'recording');
  root.querySelector<HTMLElement>('#timer-block')!.hidden = true;
  root.querySelector<HTMLElement>('#status-hint')!.textContent = '';
  showUndoBanner(root, rec.id);
  render(root);
}

function updateTimer(root: HTMLElement): void {
  if (state.activeStart === null) return;
  const sec = Math.floor((Date.now() - state.activeStart) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const el = root.querySelector<HTMLElement>('#timer-value');
  if (el) el.textContent = `${m}:${String(s).padStart(2, '0')}`;

  // Mettre à jour le cercle de progression
  const circle = root.querySelector<HTMLElement>('#timer-circle-progress');
  if (circle) {
    // Calculer la progression (60 secondes = cercle complet)
    const maxSeconds = 60;
    const progress = Math.min(sec / maxSeconds, 1);
    const circumference = 2 * Math.PI * 90; // r = 90
    const offset = circumference * (1 - progress);
    circle.style.strokeDashoffset = String(offset);
  }
}

function evaluatePreAlert(): void {
  if (isSnoozed()) return;
  if (!state.settings.preAlertEnabled) return;
  if (computeThresholdBadge(state.records, state.settings) === 'match') {
    preAlertLatch = false;
    return;
  }
  const done = state.records.filter(r => r.end > r.start);
  if (done.length < 2) return;
  const a = done[done.length - 2]!;
  const b = done[done.length - 1]!;
  const diffMin = (b.start - a.start) / 60_000;
  if (diffMin > state.settings.maxIntervalMin * 1.25) preAlertLatch = false;
  if (diffMin <= 0 || diffMin > state.settings.maxIntervalMin * 1.2) return;
  if (!state.settings.notificationsEnabled) return;
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  )
    return;
  if (preAlertLatch) return;
  preAlertLatch = true;
  new Notification('Miss Contraction', {
    body: 'Rythme soutenu : vous vous rapprochez des repères définis avec votre sage-femme.',
    tag: 'mc-prealert',
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
    r => (r.end - r.start) / 1000 >= settings.minDurationSec
  );

  maybeResetLatch(records);

  if (!intervalsOk || !durationsOk || !settings.notificationsEnabled) return;
  if (state.alertLatch) return;
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  )
    return;

  state.alertLatch = true;
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  new Notification('Miss Contraction', {
    body: `Les ${n} dernières contractions respectent vos critères. Contactez la maternité selon vos consignes.`,
    icon,
    tag: 'mc-threshold',
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
  const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : '';
  const addr = s.maternityAddress.trim();

  const venueEl = root.querySelector<HTMLElement>('#maternity-page-venue');
  if (venueEl) {
    if (label) {
      venueEl.textContent = label;
      venueEl.hidden = false;
    } else {
      venueEl.textContent = '';
      venueEl.hidden = true;
    }
  }

  const wrap = root.querySelector<HTMLElement>('#maternity-quick');
  const link = root.querySelector<HTMLAnchorElement>('#maternity-quick-link');
  const telEl = root.querySelector<HTMLElement>('#maternity-quick-tel');
  const quickTitle = root.querySelector<HTMLElement>('#maternity-quick-title');
  const main = root.querySelector<HTMLElement>('main.app');

  if (wrap && link && telEl && main) {
    if (phone) {
      wrap.hidden = false;
      main.classList.add('app--maternity-quick');
      link.href = telHref;
      const destName = label || 'la maternité';
      link.setAttribute('aria-label', `Appeler ${destName} au ${phone}`);
      telEl.textContent = phone;
      if (quickTitle) {
        quickTitle.textContent = label
          ? `Appeler ${label}`
          : 'Appeler la maternité';
      }
    } else {
      wrap.hidden = true;
      main.classList.remove('app--maternity-quick');
      link.href = 'tel:';
      link.removeAttribute('aria-label');
      telEl.textContent = '';
      if (quickTitle) quickTitle.textContent = 'Appeler la maternité';
    }
  }

  const addrBlock = root.querySelector<HTMLElement>(
    '#maternity-page-address-block'
  );
  const addrText = root.querySelector<HTMLElement>('#maternity-page-address');
  const addrPlaceholder = root.querySelector<HTMLElement>(
    '#maternity-page-address-placeholder'
  );
  const mapsWrap = root.querySelector<HTMLElement>('#maternity-page-maps-wrap');
  const mapsLink = root.querySelector<HTMLAnchorElement>(
    '#maternity-page-maps-link'
  );
  if (addrBlock && addrText && addrPlaceholder) {
    if (addr) {
      addrText.hidden = false;
      addrText.textContent = addr;
      addrPlaceholder.hidden = true;
    } else {
      addrText.textContent = '';
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
        'aria-label',
        `Ouvrir Google Maps : itinéraire vers ${mapsDest}`
      );
    } else {
      mapsWrap.hidden = true;
      mapsLink.href = '#';
      mapsLink.removeAttribute('aria-label');
    }
  }

  const phoneLine = root.querySelector<HTMLElement>(
    '#maternity-page-phone-line'
  );
  const phonePh = root.querySelector<HTMLElement>(
    '#maternity-page-phone-placeholder'
  );
  if (phoneLine && phonePh) {
    if (phone) {
      phoneLine.hidden = false;
      phoneLine.textContent = phone;
      phonePh.hidden = true;
    } else {
      phoneLine.textContent = '';
      phoneLine.hidden = true;
      phonePh.hidden = false;
    }
  }

  const pageLink = root.querySelector<HTMLAnchorElement>(
    '#maternity-page-dial-link'
  );
  const pageLbl = root.querySelector<HTMLElement>('#maternity-page-dial-label');
  const pageHint = root.querySelector<HTMLElement>('#maternity-page-hint');
  if (pageLink && pageLbl && pageHint) {
    pageLink.classList.toggle('maternity-page-dial--ready', Boolean(phone));
    const dialCallText = label ? `Appeler ${label}` : 'Appeler la maternité';
    if (phone) {
      pageLink.href = telHref;
      pageLbl.textContent = dialCallText;
      pageLink.setAttribute(
        'aria-label',
        label
          ? `Appeler ${label} au ${phone}`
          : `Appeler la maternité au ${phone}`
      );
      pageHint.textContent = '';
    } else {
      pageLink.href = '#/parametres';
      pageLbl.textContent = 'Renseigner le numéro';
      pageLink.setAttribute(
        'aria-label',
        'Ouvrir les paramètres pour renseigner le numéro de la maternité'
      );
      pageHint.textContent =
        'Enregistrez un numéro dans les paramètres pour lancer l’appel depuis ce bouton.';
    }
  }
}

function showSettingsSavedFeedback(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>('#settings-save-feedback');
  if (!el) return;
  if (settingsSaveFeedbackTimer !== null) {
    clearTimeout(settingsSaveFeedbackTimer);
    settingsSaveFeedbackTimer = null;
  }
  el.hidden = false;
  el.textContent = 'Modifications enregistrées.';
  settingsSaveFeedbackTimer = window.setTimeout(() => {
    el.textContent = '';
    el.hidden = true;
    settingsSaveFeedbackTimer = null;
  }, 3800);
}

function render(root: HTMLElement): void {
  const s = state.settings;
  const currentRoute = parseRoute();

  // Ne pas mettre à jour les éléments vanilla si React gère la vue actuelle
  if (isReactRoute(currentRoute)) {
    // Appliquer uniquement les styles globaux
    document.documentElement.classList.toggle('mc-large-mode', s.largeMode);
    if (!s.moduleVoiceCommands || !s.voiceCommandsEnabled) {
      stopVoiceRecognition();
    }
    return;
  }

  document.documentElement.classList.toggle('mc-large-mode', s.largeMode);

  if (!s.moduleVoiceCommands || !s.voiceCommandsEnabled) {
    stopVoiceRecognition();
  }

  const lblN = root.querySelector<HTMLElement>('#lbl-n');
  const lblInterval = root.querySelector<HTMLElement>('#lbl-interval');
  const lblDur = root.querySelector<HTMLElement>('#lbl-dur');

  if (lblN) lblN.textContent = String(s.consecutiveCount);
  if (lblInterval) lblInterval.textContent = String(s.maxIntervalMin);
  if (lblDur) lblDur.textContent = String(s.minDurationSec);

  const form = root.querySelector<HTMLFormElement>('#form-settings');
  if (form) {
    (form.elements.namedItem('maxIntervalMin') as HTMLInputElement).value =
      String(s.maxIntervalMin);
    (form.elements.namedItem('minDurationSec') as HTMLInputElement).value =
      String(s.minDurationSec);
    (form.elements.namedItem('consecutiveCount') as HTMLInputElement).value =
      String(s.consecutiveCount);
    (form.elements.namedItem('statsWindowMinutes') as HTMLSelectElement).value =
      s.statsWindowMinutes;
    (
      form.elements.namedItem('openContractionReminderMin') as HTMLInputElement
    ).value = String(s.openContractionReminderMin);
    (form.elements.namedItem('maternityLabel') as HTMLInputElement).value =
      s.maternityLabel;
    (form.elements.namedItem('maternityPhone') as HTMLInputElement).value =
      s.maternityPhone;
    (form.elements.namedItem('maternityAddress') as HTMLTextAreaElement).value =
      s.maternityAddress;
    root.querySelector<HTMLInputElement>('#pre-alert-check')!.checked =
      s.preAlertEnabled;
    root.querySelector<HTMLInputElement>('#large-mode-check')!.checked =
      s.largeMode;
    root.querySelector<HTMLInputElement>('#keep-awake-check')!.checked =
      s.keepAwakeDuringContraction;
    root.querySelector<HTMLInputElement>('#vibration-check')!.checked =
      s.vibrationEnabled;
    root.querySelector<HTMLInputElement>('#module-voice-check')!.checked =
      s.moduleVoiceCommands;
    root.querySelector<HTMLInputElement>('#module-message-check')!.checked =
      s.moduleMaternityMessage;
    root.querySelector<HTMLInputElement>('#voice-check')!.checked =
      s.voiceCommandsEnabled;
  }

  const voiceOpt = root.querySelector<HTMLElement>('#voice-option-field');
  if (voiceOpt) voiceOpt.hidden = !s.moduleVoiceCommands;

  const drawerMsg = root.querySelector<HTMLElement>('#drawer-item-message');
  if (drawerMsg) drawerMsg.hidden = !s.moduleMaternityMessage;

  const voiceBtn = root.querySelector<HTMLButtonElement>('#btn-voice');
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
  root.querySelector<HTMLButtonElement>('#btn-share')!.disabled = !hasData;
  root.querySelector<HTMLButtonElement>('#btn-export')!.disabled = !hasData;
}

function setNotifyStatus(root: HTMLElement, text: string): void {
  const el = root.querySelector<HTMLElement>('#notify-status');
  if (el) el.textContent = text;
}

function notifyStatusText(): string {
  if (!('Notification' in window)) return 'Notifications non disponibles.';
  if (Notification.permission === 'granted')
    return state.settings.notificationsEnabled
      ? 'Notifications activées.'
      : 'Permission accordée — touchez « Activer les notifications » pour confirmer.';
  if (Notification.permission === 'denied')
    return 'Notifications refusées dans le navigateur.';
  return 'Notifications non encore demandées.';
}

function permLabel(p: NotificationPermission): string {
  if (p === 'granted') return 'Notifications activées.';
  if (p === 'denied')
    return 'Refusé — activez-les dans les paramètres du navigateur.';
  return 'Permission non accordée.';
}

function countContractionsStartingInLastHour(
  done: ContractionRecord[],
  nowMs: number
): number {
  const t0 = nowMs - 60 * 60 * 1000;
  return done.filter(r => r.start >= t0).length;
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
  if (meanIntervalMs <= 0 || !Number.isFinite(meanIntervalMs)) return '—';
  const n = 3600000 / meanIntervalMs;
  if (!Number.isFinite(n) || n <= 0) return '—';
  const dec = n >= 12 ? 0 : 1;
  const s = n.toFixed(dec).replace('.', ',');
  return `≈ ${s} / h`;
}

/** Affichage type 01:05 (minutes : secondes) pour les moyennes du bandeau. */
function formatStatsClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function statsWindowLabelText(): string {
  const k = state.settings.statsWindowMinutes;
  if (k === 'all') return 'Moyennes sur toutes les données enregistrées.';
  const n = k === '30' ? 30 : k === '60' ? 60 : 120;
  return `Moyennes sur les ${n} dernières minutes (début de contraction).`;
}

function updateThresholdBadge(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>('#threshold-badge');
  if (!el) return;
  const kind = computeThresholdBadge(state.records, state.settings);

  // Retirer toutes les classes de badge
  el.classList.remove(
    'threshold-badge-empty',
    'threshold-badge-calm',
    'threshold-badge-approaching',
    'threshold-badge-match'
  );

  // Ajouter la classe appropriée et l’icône
  const icons: Record<string, string> = {
    match: '🏥',
    approaching: '🎯',
    calm: '😌',
    empty: '📊',
  };

  const labels: Record<string, string> = {
    match: 'Les dernières contractions correspondent à vos seuils d’alerte.',
    approaching:
      'Rythme soutenu — restez attentive aux consignes de votre sage-femme.',
    calm: 'En dehors du schéma d’alerte configuré (pour l’instant).',
    empty: 'Pas encore assez de données pour comparer aux seuils.',
  };

  el.dataset.state = kind;
  el.classList.add(`threshold-badge-${kind}`);
  el.innerHTML = `<span class="badge-icon">${icons[kind] ?? ''}</span> ${labels[kind] ?? ''}`;
}

function updatePreAlertBanner(root: HTMLElement): void {
  const banner = root.querySelector<HTMLElement>('#banner-pre-alert');
  const txt = root.querySelector<HTMLElement>('#banner-pre-alert-text');
  if (!banner || !txt) return;
  const kind = computeThresholdBadge(state.records, state.settings);
  if (
    state.settings.preAlertEnabled &&
    kind === 'approaching' &&
    !preAlertBannerDismissed
  ) {
    txt.textContent =
      'Le rythme se resserre par rapport à vos repères. En cas de doute, contactez la maternité selon vos consignes.';
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

function updateExportNudgeBanner(root: HTMLElement): void {
  const banner = root.querySelector<HTMLElement>('#banner-export-nudge');
  if (!banner) return;
  const all = state.records.filter(r => r.end > r.start);
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
  const el = root.querySelector<HTMLElement>('#snooze-status');
  if (!el) return;
  const until = loadSnoozeUntil();
  if (until <= Date.now()) {
    el.textContent = 'Aucun report actif.';
    return;
  }
  const d = new Date(until);
  el.textContent = `Alertes reportées jusqu’à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`;
}

function renderIntervalChart(root: HTMLElement): void {
  const block = root.querySelector<HTMLElement>('#chart-block');
  const bars = root.querySelector<HTMLElement>('#chart-bars');
  const label = root.querySelector<HTMLElement>('#stats-window-label');
  if (label) label.textContent = statsWindowLabelText();
  if (!block || !bars) return;

  const now = Date.now();
  const allValid = state.records.filter(r => r.end > r.start);
  const sorted = [...allValid].sort((a, b) => a.start - b.start);
  const done = filterRecordsByStatsWindow(
    sorted,
    state.settings.statsWindowMinutes,
    now
  );
  const intervals = getRecentIntervalsMs(done, 14);
  bars.textContent = '';
  if (intervals.length === 0) {
    block.hidden = true;
    return;
  }
  block.hidden = false;
  const max = Math.max(...intervals, 1);
  // On récupère les records correspondants aux intervalles (on en a N records, N-1 intervalles)
  const recordsForChart = done.slice(-intervals.length - 1);

  intervals.forEach((ms, i) => {
    const pct = Math.min(100, Math.round((ms / max) * 100));
    const wrap = document.createElement('div');
    wrap.className = 'chart-bar-container';

    // Label avec l'heure de début de la contraction
    const record = recordsForChart[i + 1];
    const labelDiv = document.createElement('div');
    labelDiv.className = 'chart-bar-label';
    if (record) {
      const date = new Date(record.start);
      labelDiv.textContent = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      labelDiv.textContent = '—';
    }
    wrap.appendChild(labelDiv);

    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.width = `${pct}%`;

    // Couleur basée sur l'intensité de la contraction qui "clôt" l'intervalle
    const intensity = recordsForChart[i + 1]?.intensity;
    if (intensity) {
      bar.classList.add(`chart-bar--intensity-${intensity}`);
    }

    bar.title = formatDuration(ms);
    wrap.appendChild(bar);

    // Badge d'intensité
    if (intensity) {
      const intensityBadge = document.createElement('div');
      intensityBadge.className = 'chart-bar-intensity';
      intensityBadge.textContent = String(intensity);
      intensityBadge.title = `Intensité ${intensity}`;
      wrap.appendChild(intensityBadge);
    }

    // Label de durée
    const durationLabel = document.createElement('div');
    durationLabel.textContent = formatDuration(ms);
    wrap.appendChild(durationLabel);

    bars.appendChild(wrap);
  });
}

function renderSummary(root: HTMLElement): void {
  const qtyEl = root.querySelector<HTMLElement>('#stat-qty-hour');
  const durEl = root.querySelector<HTMLElement>('#stat-avg-duration');
  const freqEl = root.querySelector<HTMLElement>('#stat-avg-frequency');
  const dl = root.querySelector<HTMLElement>('#summary-extra')!;
  const now = Date.now();
  const allValid = state.records.filter(r => r.end > r.start);
  const sorted = [...allValid].sort((a, b) => a.start - b.start);
  const done = filterRecordsByStatsWindow(
    sorted,
    state.settings.statsWindowMinutes,
    now
  );

  const dash = '—';
  if (!qtyEl || !durEl || !freqEl) return;

  if (done.length === 0) {
    qtyEl.textContent = dash;
    durEl.textContent = dash;
    freqEl.textContent = dash;
    dl.innerHTML = '';
    return;
  }

  const meanInterval = meanStartIntervalMs(done);
  const meanDur = meanContractionDurationMs(done);

  const qtyHour =
    meanInterval != null && meanInterval > 0
      ? String(Math.round(3600000 / meanInterval))
      : dash;
  qtyEl.textContent = qtyHour;
  durEl.textContent = meanDur != null ? formatStatsClock(meanDur) : dash;
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

const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFmtLong = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

type MidwifeMode = '6' | '10' | '12' | '20' | 'all';

function parseMidwifeMode(val: string): MidwifeMode {
  if (
    val === '6' ||
    val === '10' ||
    val === '12' ||
    val === '20' ||
    val === 'all'
  )
    return val;
  return '12';
}

function sliceForMidwife(
  sorted: ContractionRecord[],
  mode: MidwifeMode
): ContractionRecord[] {
  if (mode === 'all' || sorted.length === 0) return sorted;
  const n = Number(mode);
  if (!Number.isFinite(n) || n < 1) return sorted;
  return sorted.slice(-Math.min(n, sorted.length));
}

function chronologicalValidRecords(): ContractionRecord[] {
  return [...state.records]
    .filter(r => r.end > r.start)
    .sort((a, b) => a.start - b.start);
}

function renderHistoryTable(root: HTMLElement): void {
  const tbody = root.querySelector<HTMLTableSectionElement>(
    '#history-table-body'
  );
  const emptyEl = root.querySelector<HTMLElement>('#history-table-empty');
  const wrap = root.querySelector<HTMLElement>('.history-table-wrap');
  if (!tbody || !emptyEl) return;

  const rows = chronologicalValidRecords();
  tbody.textContent = '';

  if (rows.length === 0) {
    emptyEl.hidden = false;
    if (wrap) wrap.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  if (wrap) wrap.hidden = false;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    const tr = document.createElement('tr');

    const intervalMs = i > 0 ? r.start - rows[i - 1]!.start : null;
    const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
    const freqStr =
      intervalMs != null && intervalMs > 0
        ? formatContractionsPerHour(intervalMs)
        : '—';

    const thNum = document.createElement('th');
    thNum.scope = 'row';
    thNum.textContent = String(i + 1);

    const tdStart = document.createElement('td');
    tdStart.textContent = dateTimeFmt.format(r.start);

    const tdDur = document.createElement('td');
    tdDur.textContent = formatDuration(r.end - r.start);

    const tdInt = document.createElement('td');
    tdInt.textContent = intervalStr;

    const tdFreq = document.createElement('td');
    tdFreq.textContent = freqStr;

    const tdNote = document.createElement('td');
    tdNote.className = 'history-table-note';
    const nt = r.note?.trim();
    const intensity = r.intensity ? ` [Int. ${r.intensity}]` : '';
    tdNote.textContent = (nt || '—') + intensity;

    tr.append(thNum, tdStart, tdDur, tdInt, tdFreq, tdNote);
    tbody.appendChild(tr);
  }
}

function buildMidwifePlainText(root: HTMLElement): string {
  const sel = root.querySelector<HTMLSelectElement>('#midwife-count-select');
  const mode = parseMidwifeMode(sel?.value ?? '12');
  const sorted = chronologicalValidRecords();
  const done = sliceForMidwife(sorted, mode);
  const s = state.settings;
  const lines: string[] = [];
  const headerFmt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  lines.push('Miss Contraction — Résumé pour la sage-femme');
  lines.push(`Généré le ${headerFmt.format(new Date())}`);
  lines.push('');
  lines.push('Seuils configurés dans l’application :');
  lines.push(
    `— ${s.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${s.maxIntervalMin} min, durée ≥ ${s.minDurationSec} s chacune.`
  );
  lines.push('');
  const firstEnd = findFirstThresholdMatchEndMs(state.records, s);
  if (firstEnd != null) {
    lines.push(
      `Première fois où ces critères ont été remplis (sur tout l’historique) : ${dateTimeFmtLong.format(firstEnd)}.`
    );
  } else {
    lines.push(
      'Aucun groupe de contractions consécutives n’a encore rempli ces critères dans l’historique enregistré.'
    );
  }
  lines.push('');
  const modeLabel =
    mode === 'all' ? 'tout l’historique' : `les ${mode} dernières contractions`;
  lines.push(
    `Période du tableau et des moyennes : ${modeLabel} (${done.length} contraction(s)).`
  );
  lines.push('');
  if (done.length === 0) {
    lines.push('Aucune contraction dans cette sélection.');
    lines.push('');
    lines.push('—');
    lines.push('Données indicatives — ne remplacent pas un avis médical.');
    return lines.join('\n');
  }
  const meanInterval = meanStartIntervalMs(done);
  const meanDur = meanContractionDurationMs(done);
  const qtyHour =
    meanInterval != null && meanInterval > 0
      ? String(Math.round(3600000 / meanInterval))
      : '—';
  lines.push('Moyennes sur cette sélection :');
  lines.push(
    `— Quantité estimée : ≈ ${qtyHour} contraction(s) / h (si le rythme restait constant).`
  );
  lines.push(
    `— Durée moyenne : ${meanDur != null ? formatStatsClock(meanDur) : '—'} (mm:ss).`
  );
  lines.push(
    `— Intervalle moyen entre débuts : ${meanInterval != null ? formatStatsClock(meanInterval) : '—'} (mm:ss).`
  );
  lines.push('');
  lines.push('Détail (ordre chronologique) :');
  for (let i = 0; i < done.length; i++) {
    const r = done[i]!;
    const intervalMs = i > 0 ? r.start - done[i - 1]!.start : null;
    const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
    const note = r.note?.trim();
    const intensity = r.intensity ? ` — intensité : ${r.intensity}` : '';
    lines.push(
      `${i + 1}. ${dateTimeFmt.format(r.start)} — durée ${formatDuration(r.end - r.start)} — écart depuis précédente : ${intervalStr}${intensity}${note ? ` — note : ${note}` : ''}`
    );
  }
  lines.push('');
  lines.push('—');
  lines.push('Données indicatives — ne remplacent pas un avis médical.');
  return lines.join('\n');
}

function renderMidwifePanel(root: HTMLElement): void {
  const mount = root.querySelector<HTMLElement>('#midwife-print-root');
  if (!mount) return;
  const sel = root.querySelector<HTMLSelectElement>('#midwife-count-select');
  const mode = parseMidwifeMode(sel?.value ?? '12');
  const sorted = chronologicalValidRecords();
  const done = sliceForMidwife(sorted, mode);
  const s = state.settings;
  const firstEnd = findFirstThresholdMatchEndMs(state.records, s);
  const modeLabel =
    mode === 'all' ? 'Tout l’historique' : `Les ${mode} dernières contractions`;
  const headerFmt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
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
              : 'Aucun groupe enregistré ne remplit encore ces critères.'
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
      : '—';

  const rows = done
    .map((r, i) => {
      const intervalMs = i > 0 ? r.start - done[i - 1]!.start : null;
      const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
      const note = r.note?.trim();
      const intensity = r.intensity ? `[Int. ${r.intensity}] ` : '';
      return `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(dateTimeFmt.format(r.start))}</td>
        <td>${escapeHtml(formatDuration(r.end - r.start))}</td>
        <td>${escapeHtml(intervalStr)}</td>
        <td>${intensity}${note ? escapeHtml(note) : '—'}</td>
      </tr>`;
    })
    .join('');

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
            : 'Aucun groupe enregistré ne remplit encore ces critères.'
        }</p>
        <p class="midwife-doc-note">Instant retenu : fin de la dernière contraction du premier groupe qui satisfait simultanément l’intervalle et la durée configurés.</p>
      </section>
      <section class="midwife-doc-section">
        <h3 class="midwife-doc-h">Moyennes — ${escapeHtml(modeLabel)} (${done.length})</h3>
        <ul class="midwife-doc-stats">
          <li>Quantité estimée : ≈ ${escapeHtml(qtyHour)} contraction(s) / h (rythme constant)</li>
          <li>Durée moyenne : ${meanDur != null ? escapeHtml(formatStatsClock(meanDur)) : '—'} (mm:ss)</li>
          <li>Intervalle moyen entre débuts : ${meanInterval != null ? escapeHtml(formatStatsClock(meanInterval)) : '—'} (mm:ss)</li>
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
  const fb = root.querySelector<HTMLElement>('#midwife-copy-feedback');
  try {
    await navigator.clipboard.writeText(text);
    if (fb) {
      fb.hidden = false;
      fb.textContent = 'Texte copié dans le presse-papiers.';
      window.setTimeout(() => {
        fb.hidden = true;
        fb.textContent = '';
      }, 3500);
    }
  } catch {
    if (fb) {
      fb.hidden = false;
      fb.textContent =
        'Copie impossible — utilisez « Imprimer ou PDF » ou copiez le texte affiché.';
      window.setTimeout(() => {
        fb.hidden = true;
        fb.textContent = '';
      }, 4500);
    }
  }
}

function renderHistory(root: HTMLElement): void {
  const list = root.querySelector<HTMLUListElement>('#history-list')!;
  const empty = root.querySelector<HTMLElement>('#history-empty')!;
  const done = [...state.records].reverse();
  list.innerHTML = '';
  if (done.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  const total = done.length;
  for (let i = 0; i < done.length; i++) {
    const r = done[i]!;
    const li = document.createElement('li');
    li.className = 'timeline-item';
    if (i === 0) li.classList.add('timeline-item--latest');
    /** Numéro chronologique : 1 = plus ancienne, N = plus récente (liste affichée du récent au plus ancien). */
    const occurrenceNum = total - i;
    const intervalPrev =
      i < done.length - 1 ? formatDuration(r.start - done[i + 1]!.start) : '—';
    const iso = new Date(r.start).toISOString();
    const intensityHtml = r.intensity
      ? `<span class="timeline-intensity timeline-intensity--${r.intensity}" title="Intensité ${r.intensity}">
           <span class="sr-only">Intensité</span> ${r.intensity}
         </span>`
      : '';

    li.innerHTML = `
      <div class="timeline-marker" aria-hidden="true"></div>
      <div class="timeline-body">
        <div class="timeline-time-row">
          <span class="timeline-num" title="Contraction n°${occurrenceNum}">${occurrenceNum}</span>
          <time class="timeline-time" datetime="${iso}">${dateTimeFmt.format(r.start)}</time>
          ${intensityHtml}
        </div>
        <p class="timeline-meta">
          <span class="timeline-stat">Durée <strong>${formatDuration(r.end - r.start)}</strong></span>
          <span class="timeline-sep" aria-hidden="true">·</span>
          <span class="timeline-stat">Écart <strong>${intervalPrev}</strong></span>
        </p>
        ${
          r.note?.trim()
            ? `<p class="timeline-note">${escapeHtml(r.note.trim())}</p>`
            : ''
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

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
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
    app: 'Miss Contraction',
    exportedAt: new Date().toISOString(),
    records: state.records.map(r => ({ ...r })),
    settings: { ...state.settings },
  };
}

function exportFilenameJson(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `miss-contraction-${y}-${m}-${day}.json`;
}

function downloadExportJson(): void {
  const payload = buildExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFilenameJson();
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildShareText(): string {
  const recs = [...state.records].sort((a, b) => a.start - b.start);
  const n = recs.length;
  if (n === 0) return '';
  const headerFmt = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const lines: string[] = [];
  lines.push(`Miss Contraction — résumé (${headerFmt.format(new Date())})`);
  lines.push(`${n} contraction(s) enregistrée(s).`);
  lines.push('');
  lines.push('Contractions (ordre chronologique) :');
  const startIdx = Math.max(0, recs.length - 12);
  for (let idx = startIdx; idx < recs.length; idx++) {
    const r = recs[idx]!;
    const interval =
      idx > 0 ? formatDuration(r.start - recs[idx - 1]!.start) : '—';
    const notePart = r.note?.trim() ? ` — note : ${r.note.trim()}` : '';
    const intensityPart = r.intensity ? ` — intensité : ${r.intensity}` : '';
    lines.push(
      `• ${dateTimeFmt.format(r.start)} — durée ${formatDuration(r.end - r.start)} — écart : ${interval}${intensityPart}${notePart}`
    );
  }
  const s = state.settings;
  lines.push('');
  lines.push(
    `Seuils d’alerte : ${s.consecutiveCount} contractions, écart ≤ ${s.maxIntervalMin} min, durée ≥ ${s.minDurationSec} s.`
  );
  lines.push('');
  lines.push('Données à titre informatif — ne remplacent pas un avis médical.');
  return lines.join('\n');
}

function makeExportFile(): File | null {
  try {
    const json = JSON.stringify(buildExportPayload(), null, 2);
    return new File([json], exportFilenameJson(), {
      type: 'application/json',
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
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: 'Miss Contraction',
          text: 'Historique des contractions (fichier JSON joint).',
          files: [file],
        });
        flashShareExportFeedback(root, 'Partage effectué.');
        return;
      }
      await navigator.share({
        title: 'Miss Contraction',
        text,
      });
      flashShareExportFeedback(root, 'Partage effectué.');
      return;
    } catch (err) {
      const e = err as DOMException;
      if (e.name === 'AbortError') return;
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      flashShareExportFeedback(root, 'Résumé copié dans le presse-papiers.');
      return;
    }
  } catch {
    /* fallback export */
  }

  downloadExportJson();
  flashShareExportFeedback(
    root,
    'Partage indisponible — fichier JSON téléchargé.'
  );
}

let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

function flashShareExportFeedback(root: HTMLElement, message: string): void {
  const el = root.querySelector<HTMLElement>('#share-export-feedback');
  if (!el) return;
  if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer);
  el.textContent = message;
  el.hidden = false;
  shareFeedbackTimer = setTimeout(() => {
    el.hidden = true;
    el.textContent = '';
    shareFeedbackTimer = null;
  }, 4500);
}
