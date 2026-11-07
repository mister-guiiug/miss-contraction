import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  alertToNotify,
  buildAlertNotification,
  showAlertNotification,
  THRESHOLD_VIBRATION,
  type NotificationEnv,
} from './alertNotifications';

const ON = { notificationsEnabled: true, preAlertEnabled: true };

describe('alertToNotify', () => {
  it('notifie le seuil quand on y entre', () => {
    expect(alertToNotify('approaching', 'match', ON, false)).toBe('threshold');
    expect(alertToNotify('calm', 'match', ON, false)).toBe('threshold');
  });

  it('ne renotifie pas un état inchangé', () => {
    expect(alertToNotify('match', 'match', ON, false)).toBeNull();
    expect(alertToNotify('approaching', 'approaching', ON, false)).toBeNull();
  });

  it('ne notifie rien quand la case est décochée', () => {
    const off = { ...ON, notificationsEnabled: false };
    expect(alertToNotify('approaching', 'match', off, false)).toBeNull();
    expect(alertToNotify('calm', 'approaching', off, false)).toBeNull();
  });

  it('notifie la pré-alerte en venant du calme, si elle est active', () => {
    expect(alertToNotify('calm', 'approaching', ON, false)).toBe('preAlert');
    expect(alertToNotify('empty', 'approaching', ON, false)).toBe('preAlert');
    expect(
      alertToNotify(
        'calm',
        'approaching',
        { ...ON, preAlertEnabled: false },
        false
      )
    ).toBeNull();
  });

  it('le report coupe la pré-alerte, pas le seuil', () => {
    expect(alertToNotify('calm', 'approaching', ON, true)).toBeNull();
    expect(alertToNotify('approaching', 'match', ON, true)).toBe('threshold');
  });

  it('retomber du seuil au rythme soutenu ne fait pas une pré-alerte', () => {
    expect(alertToNotify('match', 'approaching', ON, false)).toBeNull();
    expect(alertToNotify('match', 'calm', ON, false)).toBeNull();
  });
});

describe('buildAlertNotification', () => {
  it('seuil : texte traduit, étiquette, reste affichée, vibre', () => {
    const fr = buildAlertNotification('threshold', {
      language: 'fr',
      consecutiveCount: 3,
      vibrationEnabled: true,
    });
    expect(fr.title).toBe('Seuil d’alerte atteint');
    expect(fr.options.body).toContain('Les 3 dernières contractions');
    expect(fr.options).toMatchObject({
      tag: 'mc-threshold',
      requireInteraction: true,
      renotify: true,
      vibrate: THRESHOLD_VIBRATION,
      lang: 'fr',
    });

    const en = buildAlertNotification('threshold', {
      language: 'en',
      consecutiveCount: 4,
      vibrationEnabled: false,
    });
    expect(en.title).toBe('Alert threshold reached');
    expect(en.options.body).toContain('last 4 contractions');
    expect(en.options.vibrate).toBeUndefined();
  });

  it('pré-alerte : sa propre étiquette, et elle ne s’impose pas', () => {
    const { title, options } = buildAlertNotification('preAlert', {
      language: 'fr',
      consecutiveCount: 3,
      vibrationEnabled: true,
    });
    expect(title).toBe('Rythme soutenu');
    expect(options.tag).toBe('mc-prealert');
    expect(options.requireInteraction).toBeUndefined();
    expect(options.vibrate).toBeUndefined();
  });
});

describe('showAlertNotification', () => {
  const notification = buildAlertNotification('threshold', {
    language: 'fr',
    consecutiveCount: 3,
    vibrationEnabled: true,
  });

  /** Un navigateur simulé : permission, worker facultatif, constructeur espion. */
  function fakeEnv({
    permission = 'granted' as NotificationPermission,
    worker = true,
    workerFails = false,
    pageThrows = false,
  } = {}) {
    const showNotification = vi.fn(() =>
      workerFails
        ? Promise.reject(new TypeError('No active registration'))
        : Promise.resolve()
    );
    const registration = { showNotification };
    const constructed: Array<{ title: string; options?: NotificationOptions }> =
      [];
    const PageNotification = vi.fn(function (
      this: { close: () => void; onclick: unknown },
      title: string,
      options?: NotificationOptions
    ) {
      if (pageThrows) throw new TypeError('Illegal constructor');
      constructed.push({ title, options });
      this.close = vi.fn();
      this.onclick = null;
    });
    Object.defineProperty(PageNotification, 'permission', {
      get: () => permission,
    });
    const env = {
      navigator: {
        serviceWorker: {
          getRegistration: () =>
            Promise.resolve(worker ? registration : undefined),
          ready: worker
            ? Promise.resolve(registration)
            : new Promise<never>(() => {}),
        },
      },
      Notification: PageNotification,
      focus: vi.fn(),
    } as unknown as NotificationEnv;
    return { env, showNotification, constructed, PageNotification };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passe par le service worker quand il est là', async () => {
    const { env, showNotification, PageNotification } = fakeEnv();
    await expect(showAlertNotification(notification, env)).resolves.toBe(
      'worker'
    );
    expect(showNotification).toHaveBeenCalledWith(
      'Seuil d’alerte atteint',
      expect.objectContaining({ tag: 'mc-threshold', requireInteraction: true })
    );
    expect(PageNotification).not.toHaveBeenCalled();
  });

  it('se rabat sur la page sans worker, sans attendre `ready`', async () => {
    const { env, constructed } = fakeEnv({ worker: false });
    await expect(showAlertNotification(notification, env)).resolves.toBe(
      'page'
    );
    expect(constructed).toEqual([
      {
        title: 'Seuil d’alerte atteint',
        options: expect.objectContaining({ tag: 'mc-threshold' }),
      },
    ]);
  });

  it('se rabat sur la page quand le worker refuse', async () => {
    const { env, showNotification, constructed } = fakeEnv({
      workerFails: true,
    });
    await expect(showAlertNotification(notification, env)).resolves.toBe(
      'page'
    );
    expect(showNotification).toHaveBeenCalledOnce();
    expect(constructed).toHaveLength(1);
  });

  it('n’attend pas indéfiniment un worker qui ne devient jamais actif', async () => {
    vi.useFakeTimers();
    const { env, constructed } = fakeEnv();
    (env.navigator!.serviceWorker as { ready: Promise<unknown> }).ready =
      new Promise(() => {});
    const pending = showAlertNotification(notification, env);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(pending).resolves.toBe('page');
    expect(constructed).toHaveLength(1);
  });

  it('n’affiche rien sans permission', async () => {
    for (const permission of ['default', 'denied'] as const) {
      const { env, showNotification, PageNotification } = fakeEnv({
        permission,
      });
      await expect(showAlertNotification(notification, env)).resolves.toBe(
        'not-allowed'
      );
      expect(showNotification).not.toHaveBeenCalled();
      expect(PageNotification).not.toHaveBeenCalled();
    }
  });

  it('n’affiche rien là où l’API n’existe pas (Safari iOS en onglet)', async () => {
    await expect(showAlertNotification(notification, {})).resolves.toBe(
      'not-allowed'
    );
  });

  it('ne lève pas quand la page refuse le constructeur (Chrome Android)', async () => {
    const { env } = fakeEnv({ worker: false, pageThrows: true });
    await expect(showAlertNotification(notification, env)).resolves.toBe(
      'failed'
    );
  });
});
