import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useLabels } from '@mister-guiiug/dev-pwa-config/react/labels';
import { AppLabelsProvider } from './AppLabelsProvider';
import { useAppStore } from '../store/useAppStore';
import { SUPPORTED_LANGUAGES, t, type AppLanguage } from '../../i18n';

/**
 * NOS SEPT LANGUES ET CELLES DU SOCLE : LA FRONTIÈRE A DISPARU.
 *
 * `AppLabelsProvider` relaie `settings.language` à `LabelsProvider`, ce qui
 * fait suivre la langue aux libellés que les composants du paquet portent
 * eux-mêmes. Jusqu'à 3.32, `react/labels.js` ne livrait QUE `fr` et `en` et
 * résolvait par `LABELS[locale] ?? LABELS['fr']` : les cinq autres langues de
 * l'app retombaient en français, sans erreur ni avertissement — du français
 * à une utilisatrice néerlandophone, pendant un accouchement.
 *
 * Depuis 3.33.0, le socle porte les sept mêmes langues que l'app. Ces tests
 * figent donc la nouvelle vérité : les deux moitiés du contrat disent juste,
 * dans les sept langues.
 *
 * LA RÈGLE QU'ILS ONT INSPIRÉE RESTE BONNE : ce qui est propre à l'app se
 * passe en prop depuis `t()`. Un dictionnaire partagé ne saura jamais dire
 * « contraction » à la place de l'app.
 */

const BASE_SETTINGS = useAppStore.getState().settings;

/** Sonde : à gauche ce que dit l'app, à droite ce que dit le socle. */
function Sonde({ language }: { language: AppLanguage }) {
  const nav = useLabels('nav');
  return (
    <>
      <span data-testid="app">{t(language, 'bottom.home')}</span>
      <span data-testid="socle">{nav.label}</span>
    </>
  );
}

function renderIn(language: AppLanguage) {
  useAppStore.setState({ settings: { ...BASE_SETTINGS, language } });
  return render(
    <AppLabelsProvider>
      <Sonde language={language} />
    </AppLabelsProvider>
  );
}

afterEach(() => {
  cleanup();
  useAppStore.setState({ settings: BASE_SETTINGS });
});

describe('AppLabelsProvider', () => {
  it('fait suivre la langue aux libellés du socle', () => {
    renderIn('fr');
    expect(screen.getByTestId('socle')).toHaveTextContent(
      'Navigation principale'
    );
    cleanup();

    renderIn('en');
    // Sans le fournisseur, `useLabels` rendrait ici le français.
    expect(screen.getByTestId('socle')).not.toHaveTextContent(
      'Navigation principale'
    );
  });

  it('en néerlandais, l’app ET le socle parlent néerlandais', () => {
    renderIn('nl');

    // Ce que l'app écrit.
    expect(screen.getByTestId('app')).toHaveTextContent(t('nl', 'bottom.home'));
    expect(screen.getByTestId('app')).not.toHaveTextContent(
      t('fr', 'bottom.home')
    );

    // Ce que le socle écrit : plus le repli français (socle 3.33.0).
    expect(screen.getByTestId('socle')).not.toHaveTextContent(
      'Navigation principale'
    );
  });

  it('rend un libellé de l’app juste dans chacune des sept langues', () => {
    const rendus = SUPPORTED_LANGUAGES.map(language => {
      renderIn(language);
      const texte = screen.getByTestId('app').textContent ?? '';
      cleanup();
      return { language, texte };
    });

    for (const { language, texte } of rendus) {
      expect(texte).toBe(t(language, 'bottom.home'));
    }
  });

  it('plus aucun repli silencieux : seul le français lit le français', () => {
    const replis = SUPPORTED_LANGUAGES.filter(language => {
      renderIn(language);
      const socle = screen.getByTestId('socle').textContent;
      cleanup();
      return socle === 'Navigation principale';
    });

    // Le socle 3.33.0 porte nos sept langues : `fr` seul rend le français, et
    // c'est le sien. Avant, es, de, it, pt et nl le lisaient par défaut.
    expect(replis).toEqual(['fr']);
  });
});
