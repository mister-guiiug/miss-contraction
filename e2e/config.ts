/**
 * Configuration centralisée pour les tests E2E
 * Timeouts, constantes, et chemins
 *
 * ── LA RÈGLE, ET POURQUOI ELLE EXISTE ────────────────────────────────────────
 *
 * Chaque sélecteur ci-dessous DOIT exister dans `src/`. Ça paraît évident ; ça
 * ne l'était pas. Quarante-huit des soixante `data-testid` visés ici n'ont
 * jamais existé dans l'application : ils venaient de
 * `DATA_TESTID_IMPLEMENTATION.md`, un plan de 458 lignes décrivant les
 * attributs « à ajouter aux composants », jamais suivi d'effet. Le harnais a
 * donc été écrit contre un balisage imaginaire, et vingt et un tests
 * échouaient depuis avril 2026 sans que personne le voie — `run-e2e: false`
 * dans la CI.
 *
 * `src/e2eSelectors.test.ts` verrouille la règle : il tourne avec les tests
 * unitaires, donc DANS la CI, et échoue si un sélecteur d'ici ne se retrouve
 * pas dans les sources. Le harnais ne peut plus dériver en silence.
 */

export const TIMEOUTS = {
  SHORT: 300, // Animations rapides
  NORMAL: 1000, // Interactions standard
  LONG: 5000, // Chargement réseau
  ELEMENT_READY: 2000, // Attendre qu'un élément soit prêt
  PAGE_LOAD: 3000, // Attendre le chargement page
} as const;

export const SELECTORS = {
  /*
   * UN SEUL BOUTON, PAS DEUX. L'application bascule début / fin sur le même
   * contrôle (`TimerSectionWithIntensity`). Le harnais visait
   * `start-contraction-btn` et `stop-contraction-btn` : ce n'était pas un
   * renommage, ces deux boutons n'ont jamais coexisté. `data-recording` sur le
   * conteneur ne suffit pas à distinguer l'état — c'est la classe `recording`
   * portée par le bouton qui le dit.
   */
  TOGGLE_BTN: '[data-testid="toggle-contraction-btn"]',
  TOGGLE_BTN_RECORDING: '[data-testid="toggle-contraction-btn"].recording',

  SAVE_SETTINGS_BTN: '[data-testid="settings-save-btn"]',
  CLEAR_HISTORY_BTN: '[data-testid="clear-history-btn"]',

  // Vues. Le suffixe `-view` est la convention réelle ; seule l'accueil porte
  // `view-home`, et on ne la renomme pas pour si peu.
  HOME_VIEW: '[data-testid="view-home"]',
  SETTINGS_VIEW: '[data-testid="settings-view"]',
  TABLE_VIEW: '[data-testid="table-view"]',
  MATERNITY_VIEW: '[data-testid="maternity-view"]',
  MESSAGE_VIEW: '[data-testid="message-view"]',

  // Éléments affichage
  TIMER_DISPLAY: '[data-testid="timer-display"]',
  TIMER_VALUE: '[data-testid="timer-value"]',
  STATS_SECTION: '[data-testid="stats-section"]',
  STAT_VALUE_QTY: '[data-testid="stat-value-qty"]',
  STAT_VALUE_DURATION: '[data-testid="stat-value-duration"]',
  STAT_VALUE_FREQUENCY: '[data-testid="stat-value-frequency"]',

  /*
   * DEUX BADGES DE SEUIL, ET ILS NE DISENT PAS LA MÊME CHOSE.
   * `threshold-badge` est le bandeau autonome de l'accueil ;
   * `stats-threshold-badge` est la ligne de synthèse au bas des statistiques.
   * Les deux portent `data-state`. Le harnais n'en connaissait qu'un.
   */
  THRESHOLD_BADGE: '[data-testid="threshold-badge"]',
  STATS_THRESHOLD_BADGE: '[data-testid="stats-threshold-badge"]',

  // Historique
  HISTORY_LIST: '[data-testid="history-list"]',
  HISTORY_ITEMS: '[data-testid="history-items"]',

  /*
   * DEUX « ÉTATS VIDES », ET UN SEUL SE VOIT. `HomeView` ne monte
   * `HistoryList` que lorsqu'il y a des contractions : sans aucune, c'est
   * `EmptyState` — le composant du socle — qui occupe la place.
   * `history-empty` est donc une branche défensive, atteignable seulement si
   * des enregistrements existent mais qu'aucun n'est valide. Les tests qui
   * vérifient « la liste est vide » doivent viser `EMPTY_STATE`.
   */
  EMPTY_STATE: '[data-dwc="empty-state"]',
  HISTORY_EMPTY: '[data-testid="history-empty"]',

  // Tableau
  TABLE_SECTION: '[data-testid="table-section"]',
  CONTRACTIONS_TABLE: '[data-testid="contractions-table"]',
  TABLE_EMPTY: '[data-testid="table-empty"]',

  // Dialogue d'édition d'une contraction
  EDIT_DIALOG: '[data-testid="edit-dialog"]',
  EDIT_DIALOG_SAVE_BTN: '[data-testid="edit-dialog-save-btn"]',
  EDIT_DIALOG_CANCEL_BTN: '[data-testid="edit-dialog-cancel-btn"]',
  EDIT_NOTE_TEXTAREA: '[data-testid="edit-note-textarea"]',
  EDIT_START_INPUT: '[data-testid="edit-start-input"]',
  EDIT_END_INPUT: '[data-testid="edit-end-input"]',

  // Formulaires — réglages
  MATERNITY_LABEL_INPUT: '[data-testid="maternity-label-input"]',
  MATERNITY_PHONE_INPUT: '[data-testid="maternity-phone-input"]',
  MATERNITY_ADDRESS_TEXTAREA: '[data-testid="maternity-address-textarea"]',
  MAX_INTERVAL_INPUT: '[data-testid="max-interval-input"]',
  MIN_DURATION_INPUT: '[data-testid="min-duration-input"]',
  CONSECUTIVE_COUNT_INPUT: '[data-testid="consecutive-count-input"]',
  STATS_WINDOW_SELECT: '[data-testid="stats-window-select"]',
  SETTINGS_SAVE_FEEDBACK: '[data-testid="settings-save-feedback"]',

  // Maternité
  MATERNITY_LABEL: '[data-testid="maternity-label"]',
  MATERNITY_CALL_BTN: '[data-testid="maternity-call-btn"]',
  MATERNITY_MAPS_BTN: '[data-testid="maternity-maps-btn"]',

  // Message
  MESSAGE_TEXTAREA: '[data-testid="message-textarea"]',
  MESSAGE_COPY_BTN: '[data-testid="message-copy-btn"]',
  MESSAGE_SMS_BTN: '[data-testid="message-sms-btn"]',
  MESSAGE_WHATSAPP_BTN: '[data-testid="message-whatsapp-btn"]',
  MESSAGE_FEEDBACK: '[data-testid="message-feedback"]',

  /*
   * NAVIGATION : PAS DE `data-testid`, ET ON NE VA PAS EN INVENTER.
   * La barre basse vient de `react/bottom-nav` du socle, qui expose ses
   * crochets en `[data-dwc]`. Le socle ne descend pas `key` dans le DOM et
   * l'application donne la même `className` à tous les onglets : il n'y a
   * aucune prise par onglet. Les tests naviguent donc par URL (`ROUTES`), et
   * ne cliquent un onglet que lorsque c'est la navigation elle-même qu'ils
   * éprouvent — auquel cas ils le désignent par son `href`.
   */
  BOTTOM_NAV: '[data-dwc="bottom-nav"]',
  BOTTOM_NAV_ITEM: '[data-dwc="bottom-nav-item"]',
} as const;

/*
 * ── Les clés `localStorage`, importées de l'application ──────────────────────
 *
 * PAS RECOPIÉES. Le harnais en tenait sa propre version — `mc_records`,
 * `mc_settings`, `mc_snooze_until_ms` — et les trois étaient fausses. Sur
 * quarante-deux occurrences, les tests semaient et relisaient un stockage que
 * l'application n'ouvre jamais : ils passaient ou échouaient sans rapport avec
 * son comportement réel. On importe la source.
 */
export {
  KEY_RECORDS,
  KEY_SETTINGS,
  KEY_ACTIVE_START,
  KEY_SNOOZE_UNTIL,
  KEY_EXPORT_NUDGE_DISMISSED,
} from '../src/storage';

/*
 * La clé du thème vit à part : le script anti-FOUC engendré au build la lit en
 * contexte Node, elle ne pouvait donc pas rester dans `storage.ts`.
 */
export { LS_THEME } from '../src/themeKey';

/** Les chemins français, ceux que sert l'application par défaut. */
export const ROUTES = {
  HOME: '/',
  SETTINGS: '/parametres',
  TABLE: '/historique',
  MATERNITY: '/maternite',
  MESSAGE: '/message',
  MIDWIFE: '/sage-femme',
} as const;

/** Les cinq notes rapides de `QuickNotes`, désignées par leur classe. */
export const QUICK_NOTES = {
  waters: '.note-tag--waters',
  shower: '.note-tag--shower',
  ball: '.note-tag--ball',
  medication: '.note-tag--medication',
  rest: '.note-tag--rest',
} as const;

export const TEST_DATA = {
  maternity: {
    name: 'Maternité Test Saint-Louis',
    phone: '01 23 45 67 89',
    address: '123 Rue de la Santé, 75000 Paris',
    instructions: "Arriver avec dossier complet\nAppeler avant d'arriver",
  },
  settings: {
    maxIntervalMin: 3,
    minDurationSec: 30,
    consecutiveCount: 3,
  },
  contractionDurations: [500, 450, 520, 480],
  message: 'Test message pour WhatsApp et SMS',
} as const;
