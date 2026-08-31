import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from './EmptyState';
import { useAppStore } from '../../store/useAppStore';
import { SUPPORTED_LANGUAGES, t, type AppLanguage } from '../../../i18n';

/**
 * L'état vide, après le passage à `react/empty-state` du socle.
 *
 * DEUX RISQUES, et aucun des deux ne se voit dans un rendu qui « compile ».
 *
 * 1. L'ÉCRAN NU. Le composant du socle n'est pas habillé : il n'émet que des
 *    attributs `[data-dwc="empty-state-*"]`, et c'est `enhanced-ui.css` qui
 *    les peint. Si le socle renomme un attribut à la prochaine version, la
 *    feuille se détache EN SILENCE — le texte reste, la mise en forme part.
 *    Ce test fige les quatre accroches dont dépend l'habillage.
 * 2. LA LANGUE. Le dictionnaire du socle ne couvre que `fr` et `en` ; l'app en
 *    porte sept. Tous les textes lui sont donc passés en prop. Le test le
 *    vérifie dans les sept.
 */

const BASE_SETTINGS = useAppStore.getState().settings;

function renderIn(language: AppLanguage) {
  useAppStore.setState({ settings: { ...BASE_SETTINGS, language } });
  return render(
    <MemoryRouter>
      <EmptyState />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  useAppStore.setState({ settings: BASE_SETTINGS });
});

describe('EmptyState', () => {
  it('garde les accroches d’habillage dont dépend `enhanced-ui.css`', () => {
    const { container } = renderIn('fr');

    // Les quatre sélecteurs écrits dans la feuille, plus la classe locale de
    // l'illustration et la classe `card` de la coque.
    for (const selector of [
      '[data-dwc="empty-state"]',
      '[data-dwc="empty-state-title"]',
      '[data-dwc="empty-state-desc"]',
      '[data-dwc="empty-state-action"]',
      '.empty-state-illustration',
    ]) {
      expect(container.querySelector(selector), selector).not.toBeNull();
    }

    // `.empty-state` sert aussi de sélecteur aux tests E2E.
    expect(container.querySelector('.card.empty-state')).not.toBeNull();
  });

  it('propose toujours les deux chemins de sortie', () => {
    renderIn('fr');

    expect(
      screen.getByRole('link', { name: t('fr', 'empty.configure') })
    ).toHaveAttribute('href', '/parametres');
    expect(
      screen.getByRole('link', { name: t('fr', 'empty.checklist') })
    ).toHaveAttribute('href', '/valise');
  });

  it('affiche les textes de l’app dans les sept langues', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const { container } = renderIn(language);
      const texte = container.textContent ?? '';

      expect(texte, language).toContain(t(language, 'empty.title'));
      expect(texte, language).toContain(t(language, 'empty.text'));
      cleanup();
    }
  });

  it('reste lisible dans une langue que le socle ne couvre pas', () => {
    // Le néerlandais n'existe pas dans `react/labels.js`. Aucun texte de cet
    // écran ne doit venir de là : tout est passé en prop.
    renderIn('nl');

    expect(screen.getByText(t('nl', 'empty.title'))).toBeInTheDocument();
    expect(screen.queryByText(t('fr', 'empty.title'))).not.toBeInTheDocument();
  });
});
