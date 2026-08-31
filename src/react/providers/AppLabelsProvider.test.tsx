import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useLabels } from '@mister-guiiug/dev-wpa-config/react/labels';
import { AppLabelsProvider } from './AppLabelsProvider';
import { useAppStore } from '../store/useAppStore';
import { SUPPORTED_LANGUAGES, t, type AppLanguage } from '../../i18n';

/**
 * LA FRONTIÈRE ENTRE NOS SEPT LANGUES ET LES DEUX DU SOCLE.
 *
 * `AppLabelsProvider` relaie `settings.language` à `LabelsProvider`, ce qui
 * fait suivre la langue aux libellés que les composants du paquet portent
 * eux-mêmes. Mais `react/labels.js` ne livre QUE `fr` et `en`, et résout par
 * `LABELS[locale] ?? LABELS['fr']` : les cinq autres langues de l'app
 * retombent en français, sans erreur ni avertissement.
 *
 * Ce test fige donc les deux moitiés du contrat, parce que la seconde est un
 * piège silencieux :
 *
 *  - ce que l'app écrit (`t()`) est juste dans les SEPT langues ;
 *  - ce que le socle écrit n'est juste que dans DEUX.
 *
 * Conséquence pratique pour toute adoption future d'un composant du paquet :
 * tout texte visible doit lui être passé en prop depuis `t()`. S'en remettre
 * au dictionnaire du socle, c'est livrer du français à une utilisatrice
 * néerlandophone — pendant un accouchement.
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
  it('fait suivre la langue aux libellés du socle, pour les deux qu’il couvre', () => {
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

  it('affiche le libellé de l’app dans une langue que le socle ne couvre pas', () => {
    renderIn('nl');

    // Ce que l'app écrit : du néerlandais.
    expect(screen.getByTestId('app')).toHaveTextContent(t('nl', 'bottom.home'));
    expect(screen.getByTestId('app')).not.toHaveTextContent(
      t('fr', 'bottom.home')
    );

    // Ce que le socle écrit : le repli français, et il faut le savoir.
    expect(screen.getByTestId('socle')).toHaveTextContent(
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

  it('documente le repli silencieux : cinq langues sur sept lisent le français', () => {
    const replis = SUPPORTED_LANGUAGES.filter(language => {
      renderIn(language);
      const socle = screen.getByTestId('socle').textContent;
      cleanup();
      return socle === 'Navigation principale';
    });

    // fr (légitime) + es, de, it, pt, nl (repli). Seul `en` s'en sort.
    expect(replis).toEqual(['fr', 'es', 'de', 'it', 'pt', 'nl']);
  });
});
