import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Shell } from './Shell';

/**
 * Les repères de la coque, et le lien qui les saute.
 *
 * `<main id="main-content">` enveloppait la barre du haut ET la barre du bas.
 * Rien ne plantait, rien ne s'affichait de travers : le lien d'évitement
 * menait simplement au bouton de thème — celui qu'il devait passer — et le
 * `<header>`, placé dans `<main>`, ne comptait pas comme repère `banner`.
 *
 * C'est le genre de régression qu'un rendu qui « compile » ne montre pas, et
 * qu'un déplacement d'accolade réintroduit sans qu'on le voie.
 */

function renderShell() {
  return render(
    <MemoryRouter>
      <Shell>
        <div data-testid="contenu-de-vue">La vue</div>
      </Shell>
    </MemoryRouter>
  );
}

afterEach(cleanup);

describe('repères de la coque', () => {
  /*
   * On vérifie l'IMBRICATION, pas le rôle rendu : jsdom annonce `banner` pour
   * un `<header>` même à l'intérieur de `<main>`, là où un navigateur le
   * dégrade en `generic`. Le test passerait donc sur la structure fautive. Ce
   * qui se mesure des deux côtés, c'est qu'ils ne soient pas imbriqués.
   */
  it('sort la barre du haut de main, pour qu’elle compte comme banner', () => {
    renderShell();
    const main = screen.getByRole('main');
    const barre = document.querySelector('.top-bar');

    expect(barre).not.toBeNull();
    expect(main.contains(barre)).toBe(false);
  });

  it('ne place ni la barre du haut ni celle du bas dans le contenu', () => {
    renderShell();
    const main = screen.getByRole('main');

    expect(main.querySelector('.top-bar')).toBeNull();
    expect(main.querySelector('[data-dwc="bottom-nav"]')).toBeNull();
    expect(main.querySelector('nav')).toBeNull();
  });

  it('ne garde que la vue dans le contenu principal', () => {
    renderShell();

    expect(
      screen.getByRole('main').contains(screen.getByTestId('contenu-de-vue'))
    ).toBe(true);
  });

  /*
   * LE CŒUR DU LIEN D'ÉVITEMENT : sa cible ne doit contenir aucun des
   * contrôles qu'il sert à passer. Le bouton de thème et le hamburger étaient
   * tous deux dedans.
   */
  it('vise une cible qui ne contient pas les contrôles à éviter', () => {
    renderShell();
    const lien = screen.getByRole('link', { name: /contenu principal|main/i });
    const cible = document.querySelector(
      lien.getAttribute('href') ?? '#introuvable'
    );

    expect(cible).not.toBeNull();
    expect(cible).toBe(screen.getByRole('main'));
    expect(cible?.querySelector('#btn-theme')).toBeNull();
    expect(cible?.querySelector('#btn-menu')).toBeNull();
  });

  it('rend la cible focalisable pour que le saut aboutisse', () => {
    renderShell();
    // Sans `tabindex="-1"`, Safari et Firefox posent l'ancre sans déplacer le
    // focus : le lecteur d'écran continue de lire depuis le haut.
    expect(screen.getByRole('main').getAttribute('tabindex')).toBe('-1');
  });
});
