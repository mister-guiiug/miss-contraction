import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { resetAnalytics } from '@mister-guiiug/dev-pwa-config/analytics';
import { writeConsentChoice } from '@mister-guiiug/dev-pwa-config/react/consent-banner';
import { MARQUEUR_MOTIF } from '@mister-guiiug/dev-pwa-config/react/privacy-notice';
import { CLE_DE_TEST } from '@mister-guiiug/dev-pwa-config/testing/posthog';
import { AppLabelsProvider } from '../providers/AppLabelsProvider';
import { useAppStore } from '../store/useAppStore';
import { AboutView } from './AboutView';

/**
 * Le bandeau demande un accord ; ce panneau dit à quoi. Ces tests tiennent les
 * deux choses qu'un oubli rendrait fausses sans bruit : une mention de
 * l'exploitant qui ne parviendrait pas au panneau, et un panneau qui
 * décrirait une mesure absente du build.
 */

// L'accord rejoué au montage de `ConsentSection` charge la bibliothèque : la
// vraie partirait interroger PostHog depuis jsdom.
vi.mock('posthog-js/dist/module.slim.js', async () => {
  const { fauxPosthog } =
    await import('@mister-guiiug/dev-pwa-config/testing/posthog');
  return { default: fauxPosthog() };
});

// `FamilyApps` va chercher le catalogue de la famille : hors sujet ici.
vi.mock('@mister-guiiug/dev-pwa-config/react', () => ({
  FamilyApps: () => null,
}));

const BASE_SETTINGS = useAppStore.getState().settings;

const MENTIONS = {
  VITE_PRIVACY_CONTROLLER: 'Exploitant de test',
  VITE_PRIVACY_CONTACT: 'droits@exemple.test',
  VITE_PRIVACY_RETENTION_MONTHS: '12',
  VITE_PRIVACY_ERROR_BASIS: 'Fondement de test',
};

function poser(variables: Record<string, string>) {
  for (const [nom, valeur] of Object.entries(variables)) {
    vi.stubEnv(nom, valeur);
  }
}

function rendre() {
  useAppStore.setState({ settings: { ...BASE_SETTINGS, language: 'fr' } });
  return render(
    <AppLabelsProvider>
      <AboutView />
    </AppLabelsProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  resetAnalytics();
  vi.stubEnv('VITE_POSTHOG_KEY', CLE_DE_TEST);
  vi.stubEnv('VITE_SENTRY_DSN', 'https://cle-publique@sentry.exemple.test/1');
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ settings: BASE_SETTINGS });
  vi.unstubAllEnvs();
});

describe('« À propos » - le panneau « Vos données »', () => {
  it('affiche les quatre mentions de l’exploitant, sans trou', () => {
    poser(MENTIONS);
    rendre();

    const panneau = screen.getByRole('region', { name: 'Vos données' });
    expect(panneau).toHaveTextContent('Exploitant de test');
    expect(panneau).toHaveTextContent('droits@exemple.test');
    expect(panneau).toHaveTextContent('12 mois');
    expect(panneau).toHaveTextContent('Fondement de test');
    const details = panneau.querySelectorAll(
      '[data-dwc="privacy-notice-detail"]'
    );
    expect(details.length).toBeGreaterThan(0);
    for (const detail of details) {
      expect(detail.textContent?.trim()).not.toMatch(MARQUEUR_MOTIF);
    }
  });

  it('une durée posée vide se voit manquante, au lieu de « 0 mois »', () => {
    poser({ ...MENTIONS, VITE_PRIVACY_RETENTION_MONTHS: '' });
    rendre();

    const panneau = screen.getByRole('region', { name: 'Vos données' });
    expect(panneau).not.toHaveTextContent('0 mois');
    expect(panneau).toHaveTextContent('[À compléter]');
  });

  it('n’ajoute pas de second endroit où décider', () => {
    poser(MENTIONS);
    writeConsentChoice('granted');
    rendre();

    const panneau = screen.getByRole('region', { name: 'Vos données' });
    expect(within(panneau).queryByRole('button')).toBeNull();
    // Le retrait reste possible, dans la section voisine.
    expect(
      screen.getByRole('button', { name: 'Retirer mon consentement' })
    ).toBeInTheDocument();
  });

  it('se tait quand le build n’envoie rien, ni mesure ni erreur', () => {
    poser(MENTIONS);
    vi.stubEnv('VITE_POSTHOG_KEY', '');
    vi.stubEnv('VITE_SENTRY_DSN', '');
    rendre();

    expect(screen.queryByRole('region', { name: 'Vos données' })).toBeNull();
  });

  // Le socle refuse une clé mal formée et ne mesure rien : la section de
  // consentement disparaît, et le panneau ne décrit plus la mesure. Les
  // rapports d'erreur, eux, partent toujours : il continue de les dire.
  it('sur une clé que le socle refuse, ne parle plus que des erreurs', () => {
    poser(MENTIONS);
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_trop_courte');
    rendre();

    const panneau = screen.getByRole('region', { name: 'Vos données' });
    expect(panneau).not.toHaveTextContent('PostHog');
    expect(panneau).toHaveTextContent('Sentry');
    expect(
      screen.queryByRole('heading', { name: 'Mesure d’audience' })
    ).toBeNull();
  });

  it('a le niveau et l’allure des titres de section voisins', () => {
    poser(MENTIONS);
    rendre();

    const titre = screen.getByRole('heading', { name: 'Vos données' });
    expect(titre.tagName).toBe('H3');
    expect(titre).toHaveClass('about-section__title');
  });
});
