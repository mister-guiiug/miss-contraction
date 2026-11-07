import { permissionState } from '@mister-guiiug/dev-pwa-config/push';
import { interpolate, t, type AppLanguage } from './i18n';
import type { ThresholdBadgeKind } from './statsHelpers';
import type { AppSettings } from './storage';

/**
 * Les notifications des alertes : seuil atteint, et rythme soutenu.
 *
 * ELLES PARTENT DE LA PAGE, PAS D'UN SERVEUR. Il n'y a aucun push ici : la
 * notification est émise au moment où l'application constate l'alerte, donc
 * quand une contraction est enregistrée, l'application ouverte. Les textes des
 * réglages le disent ; n'en promettre pas davantage tant qu'aucun serveur
 * n'existe.
 */

export type AlertNotificationKind = 'threshold' | 'preAlert';

/**
 * Trois pulsations longues, le dernier échelon du vocabulaire haptique de
 * l'app (1 = début, 2 = fin, 3 = seuil atteint). Motif explicite plutôt qu'un
 * `HAPTIC_PATTERNS` nommé : c'est l'alerte « il est temps de partir à la
 * maternité », ressentie pendant une contraction, et aucun motif du socle ne
 * tape aussi fort (`error` plafonne à 70 ms par pulsation). Partagé entre la
 * vibration de la page et celle de la notification, pour qu'elles ne
 * divergent pas.
 */
export const THRESHOLD_VIBRATION: number[] = [100, 50, 100, 50, 100];

/**
 * Une étiquette par alerte : une nouvelle notification REMPLACE la précédente
 * du même genre au lieu de s'empiler — y compris quand deux onglets ouverts
 * constatent la même alerte.
 */
const TAGS: Record<AlertNotificationKind, string> = {
  threshold: 'mc-threshold',
  preAlert: 'mc-prealert',
};

/**
 * `ready` ne se résout JAMAIS sans worker enregistré — en développement,
 * `main.tsx` les désinscrit tous. On ne l'attend que si un enregistrement
 * existe, et pas plus longtemps que ceci : au-delà, la notification de la
 * page vaut mieux que pas de notification.
 */
const READY_TIMEOUT_MS = 3000;

/**
 * Faut-il notifier, et quoi, en passant de `previous` à `next` ?
 *
 * Seul un CHANGEMENT d'état notifie : le même verdict recalculé (une note
 * ajoutée, un réglage sans effet) ne doit pas renvoyer la notification.
 *
 * Le report (« Reporter les alertes ») ne coupe que la pré-alerte, comme il
 * ne masque que son bandeau : le seuil atteint passe toujours. Et revenir du
 * seuil au rythme soutenu n'est pas une pré-alerte — on vient d'au-delà.
 */
export function alertToNotify(
  previous: ThresholdBadgeKind,
  next: ThresholdBadgeKind,
  settings: Pick<AppSettings, 'notificationsEnabled' | 'preAlertEnabled'>,
  snoozed: boolean
): AlertNotificationKind | null {
  if (!settings.notificationsEnabled || previous === next) return null;
  if (next === 'match') return 'threshold';
  if (
    next === 'approaching' &&
    previous !== 'match' &&
    settings.preAlertEnabled &&
    !snoozed
  ) {
    return 'preAlert';
  }
  return null;
}

/** `vibrate` et `renotify` manquent à lib.dom : Chrome pour Android les lit. */
export interface AlertNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  renotify?: boolean;
}

export interface AlertNotification {
  title: string;
  options: AlertNotificationOptions;
}

export function buildAlertNotification(
  kind: AlertNotificationKind,
  {
    language,
    consecutiveCount,
    vibrationEnabled,
  }: {
    language: AppLanguage;
    consecutiveCount: number;
    vibrationEnabled: boolean;
  }
): AlertNotification {
  const options: AlertNotificationOptions = {
    body: interpolate(t(language, `notification.${kind}.body`), {
      count: consecutiveCount,
    }),
    tag: TAGS[kind],
    lang: language,
    icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
  };
  if (kind === 'threshold') {
    // Elle reste affichée jusqu'à un geste : c'est le message à ne pas
    // manquer en reprenant le téléphone.
    options.requireInteraction = true;
    // Un seuil atteint de nouveau, après être retombé, doit sonner encore —
    // la même étiquette remplacerait sinon l'ancienne en silence.
    options.renotify = true;
    if (vibrationEnabled) options.vibrate = THRESHOLD_VIBRATION;
  }
  return { title: t(language, `notification.${kind}.title`), options };
}

type WorkerRegistration = Pick<ServiceWorkerRegistration, 'showNotification'>;

/** Ce que la fonction lit du navigateur — injectable pour les tests. */
export interface NotificationEnv {
  navigator?: {
    serviceWorker?: {
      getRegistration(): Promise<unknown>;
      ready: Promise<WorkerRegistration>;
    };
  };
  Notification?: {
    new (title: string, options?: NotificationOptions): Notification;
    readonly permission: NotificationPermission;
  };
  focus?: () => void;
}

export type NotifyOutcome = 'worker' | 'page' | 'not-allowed' | 'failed';

/**
 * Affiche la notification : par le service worker d'abord, par la page sinon.
 *
 * Le worker d'abord parce que Chrome pour Android REFUSE `new Notification()`
 * (« Illegal constructor ») : c'est `registration.showNotification` ou rien.
 * La page en repli pour le développement et pour un premier chargement dont
 * le worker n'est pas encore actif. Ne lève jamais : une notification
 * manquée ne doit pas casser l'écran qui l'a demandée.
 */
export async function showAlertNotification(
  { title, options }: AlertNotification,
  env: NotificationEnv = globalThis
): Promise<NotifyOutcome> {
  if (permissionState(env) !== 'granted') return 'not-allowed';

  const registration = await activeRegistration(env);
  if (registration) {
    try {
      await registration.showNotification(title, options);
      return 'worker';
    } catch {
      // Le worker a refusé (pas encore actif) : la page peut encore essayer.
    }
  }

  const PageNotification = env.Notification;
  if (!PageNotification) return 'failed';
  try {
    const notification = new PageNotification(title, options);
    notification.onclick = () => {
      env.focus?.();
      notification.close();
    };
    return 'page';
  } catch {
    return 'failed';
  }
}

async function activeRegistration(
  env: NotificationEnv
): Promise<WorkerRegistration | null> {
  const container = env.navigator?.serviceWorker;
  if (!container) return null;
  try {
    if (!(await container.getRegistration())) return null;
    return await Promise.race([
      container.ready,
      new Promise<null>(resolve =>
        setTimeout(() => resolve(null), READY_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return null;
  }
}
