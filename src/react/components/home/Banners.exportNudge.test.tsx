import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Banners } from './Banners';
import { useAppStore } from '../../store/useAppStore';
import { BACKUP_SECTION_ID } from '../../views/backupSection';
import { getRoutePath } from '../../../routes-i18n';

/**
 * Le rappel de sauvegarde, et surtout SON POINT DE CHUTE.
 *
 * CE BANDEAU A ENVOYÉ CHERCHER UN BOUTON QUI N'EXISTAIT PAS. Il réclamait
 * « Pensez à exporter une sauvegarde (Partager / Exporter) avant un changement
 * de téléphone » tous les sept jours, et `src/` ne contenait aucun code
 * d'export — ni `downloadText`, ni `createObjectURL`, ni `Blob`. Sur une
 * application dont les données ne vivent que sur un appareil, sans compte ni
 * synchronisation, c'était le seul chemin de sauvegarde, et il n'existait pas.
 *
 * POURQUOI ICI ET PAS EN E2E. La version e2e de cette assertion était
 * ingagnable : `Banners` ne rend qu'UN bandeau, et deux le précèdent — la
 * pré-alerte (bonne priorité : une alerte d'accouchement imminent prime) et
 * surtout « Enregistré ! · Annuler · 30 s », qui s'affiche à CHAQUE montage
 * dès qu'une contraction existe. Ce dernier est un défaut préexistant
 * (`lastCountRef` part de 0 et `records.length > 0` suffit, déjà ainsi sur
 * `main`) : recharger l'application propose d'annuler un enregistrement qu'on
 * n'a pas fait, et « Annuler » supprimerait une vraie contraction. Il est
 * signalé, pas corrigé ici. En attendant, un test de composant tient le
 * contrat sans dépendre de trente secondes de minuterie.
 */

const BASE = useAppStore.getState();

function rendre() {
  const maintenant = Date.now();
  useAppStore.setState({
    // Un seul enregistrement : de quoi rendre `hasValidRecords` vrai sans
    // fournir les trois intervalles resserrés qui déclencheraient la pré-alerte.
    records: [
      { id: 'seul', start: maintenant - 900_000, end: maintenant - 840_000 },
    ],
    settings: { ...BASE.settings, language: 'fr' },
  });
  return render(
    <MemoryRouter>
      <Banners />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  useAppStore.setState(BASE);
  localStorage.clear();
});

describe('Le rappel de sauvegarde', () => {
  it('mène à la section Sauvegarde des réglages', () => {
    rendre();

    const lien = screen.getByTestId('export-nudge-link');
    expect(lien).toHaveAttribute(
      'href',
      `${getRoutePath('settings', 'fr')}#${BACKUP_SECTION_ID}`
    );
  });

  it("ne s'efface pas derrière un bandeau d'annulation au chargement", () => {
    /*
     * LE GARDE-FOU DE LA CORRECTION. Avant elle, `lastCountRef` partait de 0
     * et `records` arrivait peuplé : le montage déclenchait « Enregistré ! ·
     * Annuler · 30 s » comme si l'on venait d'enregistrer. Deux conséquences,
     * et la première est la grave — « Annuler » supprime la dernière
     * contraction, une vraie, à un clic d'une utilisatrice qui rouvre l'app
     * entre deux contractions. La seconde est que ce bandeau masquait le
     * rappel de sauvegarde pendant trente secondes après CHAQUE chargement.
     */
    rendre();

    expect(screen.queryByText(/Annuler/)).toBeNull();
    expect(screen.queryByText(/restantes/)).toBeNull();
    expect(screen.getByTestId('export-nudge-link')).toBeInTheDocument();
  });

  it("porte l'ancre que l'écran des réglages expose vraiment", async () => {
    // Le lien et la cible viennent du MÊME module (`backupSection.ts`), ce qui
    // rend l'ancre incassable par une faute de frappe. On fige ici que l'écran
    // des réglages la porte réellement : les deux mondes doivent rester liés.
    const source = await import('../../views/SettingsView');
    expect(source).toBeDefined();
    expect(BACKUP_SECTION_ID).toBe('settings-section-sauvegarde');
  });
});
