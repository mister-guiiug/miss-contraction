import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { AppLanguage } from '../../i18n';
import { loadSettings, saveSettings } from '../../storage';
import { AppLabelsProvider } from '../providers/AppLabelsProvider';
import { useAppStore } from '../store/useAppStore';
import { SettingsView } from './SettingsView';

/**
 * La case « notification quand une alerte se déclenche » : elle demande la
 * permission sur le geste, ne se coche que si elle est accordée, et
 * s'enregistre sans attendre le bouton « Enregistrer ».
 */

const BASE_SETTINGS = useAppStore.getState().settings;

function navigateur(
  permission: NotificationPermission,
  answer: NotificationPermission = permission
) {
  const requestPermission = vi.fn(() => Promise.resolve(answer));
  vi.stubGlobal(
    'Notification',
    Object.assign(function () {}, { permission, requestPermission })
  );
  return requestPermission;
}

function rendre(language: AppLanguage = 'fr', notificationsEnabled = false) {
  const settings = { ...BASE_SETTINGS, language, notificationsEnabled };
  // L'écran relit le stockage au montage : on y écrit ce qu'il doit trouver.
  saveSettings(settings);
  useAppStore.setState({ settings, records: [] });
  return render(
    <MemoryRouter>
      <AppLabelsProvider>
        <SettingsView />
      </AppLabelsProvider>
    </MemoryRouter>
  );
}

const caseNotifications = () =>
  screen.getByTestId('notifications-check') as HTMLInputElement;
const statut = () => screen.getByTestId('notification-status');

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useAppStore.setState({ settings: BASE_SETTINGS, records: [] });
});

describe('SettingsView — notifications', () => {
  it('accordée sur le geste : la case se coche et s’enregistre aussitôt', async () => {
    const requestPermission = navigateur('default', 'granted');
    rendre();

    fireEvent.click(caseNotifications());

    expect(await screen.findByText('Autorisées par le navigateur.')).toBe(
      statut()
    );
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(caseNotifications().checked).toBe(true);
    expect(useAppStore.getState().settings.notificationsEnabled).toBe(true);
    expect(loadSettings().notificationsEnabled).toBe(true);
  });

  it('refusée : la case reste décochée, et l’écran dit où réautoriser', async () => {
    navigateur('default', 'denied');
    rendre();

    fireEvent.click(caseNotifications());

    expect(
      await screen.findByText(
        'Bloquées par le navigateur — réautorisez-les dans ses réglages.'
      )
    ).toBe(statut());
    expect(caseNotifications().checked).toBe(false);
    expect(loadSettings().notificationsEnabled).toBe(false);
  });

  it('déjà refusée : ne redemande pas', async () => {
    const requestPermission = navigateur('denied');
    rendre();

    fireEvent.click(caseNotifications());

    await screen.findByText(
      'Bloquées par le navigateur — réautorisez-les dans ses réglages.'
    );
    expect(requestPermission).not.toHaveBeenCalled();
    expect(caseNotifications().checked).toBe(false);
  });

  it('décocher éteint et s’enregistre', async () => {
    navigateur('granted');
    rendre('fr', true);
    expect(caseNotifications().checked).toBe(true);

    fireEvent.click(caseNotifications());

    await vi.waitFor(() =>
      expect(loadSettings().notificationsEnabled).toBe(false)
    );
    expect(caseNotifications().checked).toBe(false);
  });

  it('sans API Notification, la case est désactivée et le dit', () => {
    rendre();
    expect(caseNotifications().disabled).toBe(true);
    expect(statut()).toHaveTextContent('Non disponibles dans ce navigateur.');
  });

  it('les états de la permission sont traduits, plus en anglais en dur', () => {
    navigateur('default');
    rendre('fr');
    expect(statut()).toHaveTextContent('Pas encore demandées.');
    cleanup();

    navigateur('granted');
    rendre('en');
    expect(statut()).toHaveTextContent('Allowed by the browser.');
    expect(
      screen.getByText('Show a notification when an alert fires')
    ).toBeInTheDocument();
  });

  it('dit que la notification part de l’application, pas d’un serveur', () => {
    navigateur('granted');
    rendre('fr');
    expect(
      screen.getByText(/Aucun serveur ne l’envoie : application fermée/)
    ).toBeInTheDocument();
  });
});
