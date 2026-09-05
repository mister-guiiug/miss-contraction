import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useAppStore } from '../store/useAppStore';
import { MESSAGES, SUPPORTED_LANGUAGES } from '../../i18n';

/**
 * Le bouton « Recharger l'application » de l'écran « À propos », après
 * l'adoption de `@mister-guiiug/dev-pwa-config/sw-update`.
 *
 * DEUX CHOSES À PROUVER, et une seule appartient à cette app.
 *
 * 1. QUE LE BOUTON FASSE QUELQUE CHOSE. Il appelait `forceSwUpdate()`, qui
 *    appelait `updateSW(true)` de `virtual:pwa-register`. Or ce module, en
 *    `registerType: 'autoUpdate'`, termine sur
 *    `if (!auto) sendSkipWaitingMessage?.()` : en mode auto, l'appel n'est
 *    qu'un `await` sur la promesse d'enregistrement. Le bouton ne mettait rien
 *    à jour ; seul le `setTimeout(reload, 1000)` de l'app faisait bouger
 *    l'écran, à l'aveugle. Ce test vérifie que le clic passe désormais par
 *    `applyUpdate`, qui, lui, revérifie l'enregistrement et purge.
 *    La mécanique de `applyUpdate` (activation, purge, échelle de navigation,
 *    minuterie de secours) appartient au socle et s'y prouve : rien de tout
 *    cela n'est retesté ici.
 *
 * 2. QUE LES SEPT LANGUES SURVIVENT. `react/labels.js` du socle ne livre que
 *    `fr` et `en`, et sa résolution est `LABELS[locale] ?? LABELS['fr']` :
 *    toute locale inconnue retombe en FRANÇAIS, en silence. miss-contraction
 *    en porte sept (fr, en, es, de, it, pt, nl). C'est la raison pour laquelle
 *    cette adoption ne prend AUCUN composant React du socle — ni
 *    `UpdatePromptBanner`, ni `AppUpdates` — et garde son propre bouton, donc
 *    son propre `t()`. Le test l'ancre : en néerlandais, l'écran affiche le
 *    libellé néerlandais de l'app, pas le repli français du socle.
 */

const applyUpdate = vi.hoisted(() => vi.fn(() => Promise.resolve('purged')));

vi.mock('@mister-guiiug/dev-pwa-config/sw-update', () => ({ applyUpdate }));

// `FamilyApps` va chercher le catalogue de la famille : hors sujet ici, et il
// tirerait une requête réseau dans jsdom.
vi.mock('@mister-guiiug/dev-pwa-config/react', () => ({
  FamilyApps: () => null,
}));

const { AboutView } = await import('./AboutView');

type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const BASE_SETTINGS = useAppStore.getState().settings;

function renderIn(language: AppLanguage) {
  useAppStore.setState({ settings: { ...BASE_SETTINGS, language } });
  return render(<AboutView />);
}

beforeEach(() => {
  applyUpdate.mockClear();
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ settings: BASE_SETTINGS });
});

describe('bouton « recharger l’application »', () => {
  it('délègue la mise à jour au socle au lieu de recharger à l’aveugle', () => {
    renderIn('fr');

    fireEvent.click(
      screen.getByRole('button', { name: MESSAGES.fr['about.forceReload'] })
    );

    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('affiche le libellé de l’app dans une langue que le socle ne couvre pas', () => {
    // Le néerlandais n'existe pas dans `react/labels.js` : un composant du
    // socle afficherait ici du français.
    renderIn('nl');

    expect(
      screen.getByRole('button', { name: MESSAGES.nl['about.forceReload'] })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: MESSAGES.fr['about.forceReload'] })
    ).not.toBeInTheDocument();
  });

  it('rend un libellé distinct dans chacune des sept langues', () => {
    // Le repli silencieux du socle se verrait ici : cinq des sept langues
    // rendraient la chaîne française.
    const rendus = SUPPORTED_LANGUAGES.map(language => {
      renderIn(language);
      const texte = screen.getByTestId('about-view').textContent ?? '';
      cleanup();
      return { language, texte };
    });

    for (const { language, texte } of rendus) {
      expect(texte).toContain(MESSAGES[language]['about.forceReload']);
    }

    const libelles = SUPPORTED_LANGUAGES.map(
      language => MESSAGES[language]['about.forceReload']
    );
    expect(new Set(libelles).size).toBe(SUPPORTED_LANGUAGES.length);
  });
});
