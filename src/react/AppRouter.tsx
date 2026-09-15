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
import { getDocumentTitle } from '../routes';
import { getRouteFromPath, getRoutePath } from '../routes-i18n';
import { useAppStore } from './store/useAppStore';
import { AppLabelsProvider } from './providers/AppLabelsProvider';
import { ConsentBanner } from '@mister-guiiug/dev-pwa-config/react/consent-banner';
import { usePageViews } from '@mister-guiiug/dev-pwa-config/react/use-page-views';

function DocumentTitle() {
  const location = useLocation();

  /*
   * LA VUE DE PAGE VIT ICI, avec le titre du document : ce composant est déjà
   * celui qui écoute la route et ne rend rien. GA4 n'envoie `page_view` qu'au
   * chargement du document, et `initAnalytics` pose en plus
   * `send_page_view: false` pour que la première vue passe par ce hook comme
   * les autres — sinon l'écran d'entrée serait compté deux fois.
   *
   * Ne fait rien tant que le consentement n'est pas accordé.
   */
  usePageViews(location.pathname);
  const language = useAppStore(state => state.settings.language);

  useEffect(() => {
    const route = getRouteFromPath(location.pathname, language);
    document.title = getDocumentTitle(route, language);
  }, [language, location.pathname]);

  return null;
}

function AppRoutes() {
  const settings = useAppStore(state => state.settings);
  const language = settings.language;

  return (
    <Shell>
      <DocumentTitle />
      {/* Une `region`, pas une boîte modale : elle ne recouvre rien et ne
          piège pas le focus. Ne rend RIEN tant que `VITE_GA_MEASUREMENT_ID`
          n'est pas posée — sans identifiant, il n'y a rien à demander. */}
      <ConsentBanner
        gtmContainerId={import.meta.env.VITE_GTM_CONTAINER_ID}
        gaMeasurementId={import.meta.env.VITE_GA_MEASUREMENT_ID}
      />
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
        <Route
          path="/tableau"
          element={<Navigate to="/historique" replace />}
        />
        <Route path="/table" element={<Navigate to="/historique" replace />} />

        {/* Midwife - all language variants */}
        <Route
          path="/sage-femme"
          element={
            settings.moduleVoiceCommands ? (
              <MidwifeView />
            ) : (
              <Navigate to={getRoutePath('home', language)} replace />
            )
          }
        />
        <Route
          path="/midwife"
          element={
            settings.moduleVoiceCommands ? (
              <MidwifeView />
            ) : (
              <Navigate to={getRoutePath('home', language)} replace />
            )
          }
        />
        <Route
          path="/comadrona"
          element={
            settings.moduleVoiceCommands ? (
              <MidwifeView />
            ) : (
              <Navigate to={getRoutePath('home', language)} replace />
            )
          }
        />
        <Route
          path="/hebamme"
          element={
            settings.moduleVoiceCommands ? (
              <MidwifeView />
            ) : (
              <Navigate to={getRoutePath('home', language)} replace />
            )
          }
        />
        <Route
          path="/ostetrica"
          element={
            settings.moduleVoiceCommands ? (
              <MidwifeView />
            ) : (
              <Navigate to={getRoutePath('home', language)} replace />
            )
          }
        />
        <Route
          path="/parteira"
          element={
            settings.moduleVoiceCommands ? (
              <MidwifeView />
            ) : (
              <Navigate to={getRoutePath('home', language)} replace />
            )
          }
        />
        <Route
          path="/vroedvrouw"
          element={
            settings.moduleVoiceCommands ? (
              <MidwifeView />
            ) : (
              <Navigate to={getRoutePath('home', language)} replace />
            )
          }
        />
        {/* Legacy aliases */}
        <Route
          path="/sagefemme"
          element={<Navigate to="/sage-femme" replace />}
        />

        {/* Maternity - all language variants */}
        <Route path="/maternite" element={<MaternityView />} />
        <Route path="/maternity" element={<MaternityView />} />
        <Route path="/maternidad" element={<MaternityView />} />
        <Route path="/mutterschaft" element={<MaternityView />} />
        <Route path="/maternita" element={<MaternityView />} />
        <Route path="/maternidade" element={<MaternityView />} />
        <Route path="/materniteit" element={<MaternityView />} />

        {/* Message - all language variants */}
        <Route
          path="/message"
          element={
            settings.moduleMaternityMessage ? (
              <MessageView />
            ) : (
              <Navigate to={getRoutePath('maternity', language)} replace />
            )
          }
        />
        <Route
          path="/messages"
          element={
            settings.moduleMaternityMessage ? (
              <MessageView />
            ) : (
              <Navigate to={getRoutePath('maternity', language)} replace />
            )
          }
        />
        <Route
          path="/mensaje"
          element={
            settings.moduleMaternityMessage ? (
              <MessageView />
            ) : (
              <Navigate to={getRoutePath('maternity', language)} replace />
            )
          }
        />
        <Route
          path="/nachricht"
          element={
            settings.moduleMaternityMessage ? (
              <MessageView />
            ) : (
              <Navigate to={getRoutePath('maternity', language)} replace />
            )
          }
        />
        <Route
          path="/messaggio"
          element={
            settings.moduleMaternityMessage ? (
              <MessageView />
            ) : (
              <Navigate to={getRoutePath('maternity', language)} replace />
            )
          }
        />
        <Route
          path="/mensagem"
          element={
            settings.moduleMaternityMessage ? (
              <MessageView />
            ) : (
              <Navigate to={getRoutePath('maternity', language)} replace />
            )
          }
        />
        <Route
          path="/bericht"
          element={
            settings.moduleMaternityMessage ? (
              <MessageView />
            ) : (
              <Navigate to={getRoutePath('maternity', language)} replace />
            )
          }
        />
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
        <AppLabelsProvider>
          <AppRoutes />
        </AppLabelsProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
