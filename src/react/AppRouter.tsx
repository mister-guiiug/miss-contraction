import { StrictMode, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { HomeView } from './views/HomeView';
import { SettingsView } from './views/SettingsView';
import { MaternityView } from './views/MaternityView';
import { MessageView } from './views/MessageView';
import { TableView } from './views/TableView';
import { MidwifeView } from './views/MidwifeView';
import { ChecklistView } from './views/ChecklistView';
import { AboutView } from './views/AboutView';
import { getDocumentTitle, type AppRoute } from '../routes';
import { getRouteFromPath, legacyPathMap } from '../routes-i18n';
import { useAppStore } from './store/useAppStore';
import { I18nSyncProvider } from './providers/I18nSyncProvider';

function DocumentTitle() {
  const location = useLocation();
  const language = useAppStore(state => state.settings.language);

  useEffect(() => {
    const route = getRouteFromPath(location.pathname, language);
    document.title = getDocumentTitle(route, language);
  }, [language, location.pathname]);

  return null;
}

export function AppRoutes() {
  return (
    <Shell>
      <DocumentTitle />
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomeView />} />

        {/* Settings - all language variants */}
        <Route path="/parametres" element={<SettingsView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/configuracion" element={<SettingsView />} />
        <Route path="/einstellungen" element={<SettingsView />} />
        <Route path="/impostazioni" element={<SettingsView />} />
        <Route path="/configuracoes" element={<SettingsView />} />
        <Route path="/instellingen" element={<SettingsView />} />

        {/* Table/History - all language variants */}
        <Route path="/historique" element={<TableView />} />
        <Route path="/history" element={<TableView />} />
        <Route path="/historial" element={<TableView />} />
        <Route path="/verlauf" element={<TableView />} />
        <Route path="/cronologia" element={<TableView />} />
        <Route path="/historico" element={<TableView />} />
        <Route path="/geschiedenis" element={<TableView />} />
        {/* Legacy aliases */}
        <Route path="/tableau" element={<Navigate to="/historique" replace />} />
        <Route path="/table" element={<Navigate to="/historique" replace />} />

        {/* Midwife - all language variants */}
        <Route path="/sage-femme" element={<MidwifeView />} />
        <Route path="/midwife" element={<MidwifeView />} />
        <Route path="/comadrona" element={<MidwifeView />} />
        <Route path="/hebamme" element={<MidwifeView />} />
        <Route path="/ostetrica" element={<MidwifeView />} />
        <Route path="/parteira" element={<MidwifeView />} />
        <Route path="/vroedvrouw" element={<MidwifeView />} />
        {/* Legacy aliases */}
        <Route path="/sagefemme" element={<Navigate to="/sage-femme" replace />} />

        {/* Maternity - all language variants */}
        <Route path="/maternite" element={<MaternityView />} />
        <Route path="/maternity" element={<MaternityView />} />
        <Route path="/maternidad" element={<MaternityView />} />
        <Route path="/mutterschaft" element={<MaternityView />} />
        <Route path="/maternita" element={<MaternityView />} />
        <Route path="/maternidade" element={<MaternityView />} />
        <Route path="/materniteit" element={<MaternityView />} />

        {/* Message - all language variants */}
        <Route path="/message" element={<MessageView />} />
        <Route path="/messages" element={<MessageView />} />
        <Route path="/mensaje" element={<MessageView />} />
        <Route path="/nachricht" element={<MessageView />} />
        <Route path="/messaggio" element={<MessageView />} />
        <Route path="/mensagem" element={<MessageView />} />
        <Route path="/bericht" element={<MessageView />} />
        {/* Legacy alias */}
        <Route path="/sms" element={<Navigate to="/message" replace />} />

        {/* Checklist - all language variants */}
        <Route path="/valise" element={<ChecklistView />} />
        <Route path="/checklist" element={<ChecklistView />} />
        <Route path="/lista" element={<ChecklistView />} />
        <Route path="/checkliste" element={<ChecklistView />} />
        <Route path="/lista-de-verificacao" element={<ChecklistView />} />

        {/* About - all language variants */}
        <Route path="/a-propos" element={<AboutView />} />
        <Route path="/about" element={<AboutView />} />
        <Route path="/acerca-de" element={<AboutView />} />
        <Route path="/uber-uns" element={<AboutView />} />
        <Route path="/chi-siamo" element={<AboutView />} />
        <Route path="/sobre-nos" element={<AboutView />} />
        <Route path="/over-ons" element={<AboutView />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export function App() {
  return (
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <I18nSyncProvider>
          <AppRoutes />
        </I18nSyncProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
