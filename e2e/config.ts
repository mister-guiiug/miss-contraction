/**
 * Configuration centralisée pour les tests E2E
 * Timeouts, constantes, et chemins
 */

export const TIMEOUTS = {
  SHORT: 300,           // Animations rapides
  NORMAL: 1000,         // Interactions standard
  LONG: 5000,          // Chargement réseau
  ELEMENT_READY: 2000,  // Attendre qu'un élément soit prêt
  PAGE_LOAD: 3000,     // Attendre le chargement page
} as const;

export const SELECTORS = {
  // Boutons communs
  START_BTN: '[data-testid="start-contraction-btn"]',
  STOP_BTN: '[data-testid="stop-contraction-btn"]',
  SAVE_BTN: '[data-testid="save-settings-btn"]',
  DELETE_BTN: '[data-testid="delete-btn"]',
  EDIT_BTN: '[data-testid="edit-btn"]',
  EXPORT_BTN: '[data-testid="export-btn"]',
  IMPORT_BTN: '[data-testid="import-btn"]',

  // Vues
  HOME_VIEW: '[data-testid="view-home"]',
  SETTINGS_VIEW: '[data-testid="view-settings"]',
  TABLE_VIEW: '[data-testid="view-table"]',
  MATERNITY_VIEW: '[data-testid="view-maternity"]',
  MESSAGE_VIEW: '[data-testid="view-message"]',

  // Éléments affichage
  TIMER_DISPLAY: '[data-testid="timer-display"]',
  STATS_SECTION: '[data-testid="stats-section"]',
  THRESHOLD_BADGE: '[data-testid="threshold-badge"]',
  HISTORY_LIST: '[data-testid="history-list"]',
  CONTRACTION_ENTRY: '[data-testid="contraction-entry"]',

  // Formulaires
  MATERNITY_NAME_INPUT: '[data-testid="maternity-name-input"]',
  MATERNITY_PHONE_INPUT: '[data-testid="maternity-phone-input"]',
  MATERNITY_ADDRESS_INPUT: '[data-testid="maternity-address-input"]',
  MAX_INTERVAL_INPUT: '[data-testid="max-interval-input"]',
  MIN_DURATION_INPUT: '[data-testid="min-duration-input"]',
  CONSECUTIVE_COUNT_INPUT: '[data-testid="consecutive-count-input"]',
  MESSAGE_TEXTAREA: '[data-testid="message-textarea"]',

  // Navigation
  NAV_HOME: '[data-testid="nav-home"]',
  NAV_SETTINGS: '[data-testid="nav-settings"]',
  NAV_TABLE: '[data-testid="nav-table"]',
  NAV_MATERNITY: '[data-testid="nav-maternity"]',
  NAV_MESSAGE: '[data-testid="nav-message"]',
} as const;

export const ROUTES = {
  HOME: '/',
  SETTINGS: '/parametres',
  TABLE: '/historique',
  MATERNITY: '/maternite',
  MESSAGE: '/message',
  MIDWIFE: '/sage-femme',
} as const;

export const TEST_DATA = {
  maternity: {
    name: 'Maternité Test Saint-Louis',
    phone: '01 23 45 67 89',
    address: '123 Rue de la Santé, 75000 Paris',
    instructions: 'Arriver avec dossier complet\nAppeler avant d\'arriver'
  },
  settings: {
    maxIntervalMin: 3,
    minDurationSec: 30,
    consecutiveCount: 3,
  },
  contractionDurations: [500, 450, 520, 480],
  message: 'Test message pour WhatsApp et SMS'
} as const;
