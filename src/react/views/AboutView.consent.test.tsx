import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  isAnalyticsLoaded,
  resetAnalytics,
} from '@mister-guiiug/dev-pwa-config/analytics';
import {
  readConsentChoice,
  writeConsentChoice,
} from '@mister-guiiug/dev-pwa-config/react/consent-banner';
import { LABELS } from '@mister-guiiug/dev-pwa-config/react/labels';
import { CLE_DE_TEST } from '@mister-guiiug/dev-pwa-config/testing/posthog';
import { AppLabelsProvider } from '../providers/AppLabelsProvider';
import { useAppStore } from '../store/useAppStore';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { AboutView } from './AboutView';

/**
 * RETIRER SON CONSENTEMENT DOIT ÊTRE AUSSI SIMPLE QUE LE DONNER (RGPD, art.
 * 7.3). Au relevé du 29/09/2026, une fois le bandeau répondu, plus rien dans
 * l'app ne permettait de revenir sur son choix. Ces tests tiennent le chemin
 * du retour, de l'écran « À propos » jusqu'à la bibliothèque de mesure — et
 * dans les sept langues de l'app, puisque ses libellés viennent du socle.
 */

// L'accord rejoué au montage charge la bibliothèque : la vraie partirait
// interroger PostHog depuis jsdom. Le double du socle se souvient du retrait.
vi.mock('posthog-js/dist/module.slim.js', async () => {
  const { fauxPosthog } =
    await import('@mister-guiiug/dev-pwa-config/testing/posthog');
  return { default: fauxPosthog() };
});

// `FamilyApps` va chercher le catalogue de la famille : hors sujet ici, et il
// tirerait une requête réseau dans jsdom.
vi.mock('@mister-guiiug/dev-pwa-config/react', () => ({
  FamilyApps: () => null,
}));

type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const BASE_SETTINGS = useAppStore.getState().settings;

/** L'écran sous le pont de libellés d'`AppRouter`, dans la langue voulue. */
function renderIn(language: AppLanguage) {
  useAppStore.setState({ settings: { ...BASE_SETTINGS, language } });
  return render(
    <AppLabelsProvider>
      <AboutView />
    </AppLabelsProvider>
  );
}

beforeEach(() => {
  // Le setup partagé ne vide pas le stockage : un choix laissé par un test
  // serait relu par le suivant.
  localStorage.clear();
  vi.stubEnv('VITE_POSTHOG_KEY', CLE_DE_TEST);
  // L'état de la mesure est celui d'un module : sans remise à zéro, la
  // bibliothèque resterait « chargée » d'un test à l'autre.
  resetAnalytics();
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ settings: BASE_SETTINGS });
  vi.unstubAllEnvs();
});

describe('« À propos » - mesure d’audience', () => {
  it('l’écran permet de retirer son consentement, en un clic', async () => {
    writeConsentChoice('granted');
    renderIn('fr');

    const titre = await screen.findByRole('heading', {
      name: 'Mesure d’audience',
    });
    const section = titre.closest('section') as HTMLElement;
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez accepté cette mesure.'
    );
    // L'accord rejoué au montage a chargé la bibliothèque - le double.
    await waitFor(() => expect(isAnalyticsLoaded()).toBe(true));
    const posthog = (await import('posthog-js/dist/module.slim.js')).default;
    expect(posthog.has_opted_out_capturing()).toBe(false);

    fireEvent.click(
      within(section).getByRole('button', {
        name: 'Retirer mon consentement',
      })
    );

    expect(readConsentChoice()).toBe('denied');
    // Le clic est PARVENU à la bibliothèque, pas seulement au libellé.
    expect(posthog.has_opted_out_capturing()).toBe(true);
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez refusé cette mesure.'
    );
  });

  it('parle anglais quand l’app parle anglais', async () => {
    writeConsentChoice('granted');
    renderIn('en');

    const titre = await screen.findByRole('heading', {
      name: 'Audience measurement',
    });
    const section = titre.closest('section') as HTMLElement;
    expect(
      within(section).getByRole('button', { name: 'Withdraw my consent' })
    ).toBeInTheDocument();
  });

  it('suit chacune des sept langues, sans repli sur le français', async () => {
    for (const language of SUPPORTED_LANGUAGES) {
      writeConsentChoice('granted');
      renderIn(language);
      const { title, withdraw } = libellesDuSocle(language);
      const titre = await screen.findByRole('heading', { name: title });
      expect(
        within(titre.closest('section') as HTMLElement).getByRole('button', {
          name: withdraw,
        })
      ).toBeInTheDocument();
      cleanup();
    }

    // Sept titres distincts : un dictionnaire du socle qui recopierait le
    // français passerait le rendu ci-dessus sans se faire voir.
    const titres = SUPPORTED_LANGUAGES.map(l => libellesDuSocle(l).title);
    expect(new Set(titres).size).toBe(SUPPORTED_LANGUAGES.length);
  });
});

function libellesDuSocle(language: AppLanguage) {
  const consent = LABELS[language]?.consent;
  if (!consent) throw new Error(`le socle ne parle pas « ${language} »`);
  return consent;
}
