import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVE_START_MAX_AGE_MS, KEY_ACTIVE_START } from '../../storage';

/**
 * La contraction en cours survit-elle au redémarrage du store ?
 *
 * `storage.test.ts` prouve la lecture et l'écriture, seuil d'expiration
 * compris. Ce qui reste à prouver est ailleurs : que le store LISE cette clé au
 * démarrage, et que la durée enregistrée après un rechargement soit la vraie —
 * celle qui commence au « Début » d'origine, pas au rechargement.
 *
 * `vi.resetModules()` est ce qui rend le rechargement observable : le store est
 * un singleton créé à l'import, et son état initial n'est calculé qu'une fois.
 * Le réimporter est la seule façon de rejouer le démarrage de l'app.
 */

async function freshStore() {
  vi.resetModules();
  const module = await import('./useAppStore');
  return module.useAppStore;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('contraction en cours au démarrage du store', () => {
  it('persiste l’horodatage dès le « Début »', async () => {
    const store = await freshStore();

    store.getState().startContraction();

    const persisted = localStorage.getItem(KEY_ACTIVE_START);
    expect(persisted).toBe(String(store.getState().activeStart));
  });

  it('restaure une contraction commencée juste avant le rechargement', async () => {
    const start = Date.now() - 20_000;
    localStorage.setItem(KEY_ACTIVE_START, String(start));

    const store = await freshStore();

    expect(store.getState().activeStart).toBe(start);
  });

  it('ignore un « début » périmé', async () => {
    localStorage.setItem(
      KEY_ACTIVE_START,
      String(Date.now() - ACTIVE_START_MAX_AGE_MS - 1_000)
    );

    const store = await freshStore();

    expect(store.getState().activeStart).toBeNull();
  });

  it('enregistre la durée réelle, et non le temps depuis le rechargement', async () => {
    // Quarante secondes de contraction, puis le rechargement : celui que le
    // module `virtual:pwa-register` déclenche seul quand un déploiement
    // atterrit, en `registerType: 'autoUpdate'`.
    const start = Date.now() - 40_000;
    localStorage.setItem(KEY_ACTIVE_START, String(start));
    const store = await freshStore();

    store.getState().endContraction();

    const records = store.getState().records;
    expect(records).toHaveLength(1);
    expect(records[0]?.start).toBe(start);
    expect((records[0]?.end ?? 0) - start).toBeGreaterThanOrEqual(40_000);
  });

  it('n’enregistre rien tant que « Fin » n’est pas appuyé', async () => {
    // L'invariant que couvrait déjà `e2e/error-handling.spec.ts` : une
    // contraction restaurée est EN COURS, pas ENREGISTRÉE. Rien n'entre dans
    // l'historique avant l'appui sur « Fin ».
    localStorage.setItem(KEY_ACTIVE_START, String(Date.now() - 20_000));

    const store = await freshStore();

    expect(store.getState().records).toHaveLength(0);
  });

  it('efface la clé au « Fin »', async () => {
    const store = await freshStore();
    store.getState().startContraction();

    store.getState().endContraction();

    expect(localStorage.getItem(KEY_ACTIVE_START)).toBeNull();
    expect(store.getState().activeStart).toBeNull();
  });
});
