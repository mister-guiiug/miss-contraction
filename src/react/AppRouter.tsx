import { StrictMode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { HomeView } from './views/HomeView';
import { SettingsView } from './views/SettingsView';
import { MaternityView } from './views/MaternityView';
import { MessageView } from './views/MessageView';
import { TableView } from './views/TableView';
import { MidwifeView } from './views/MidwifeView';
import { ROUTE_META } from '../routes';

function DocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    const routeMap: Record<string, keyof typeof ROUTE_META> = {
      '/': 'home',
      '/parametres': 'settings',
      '/historique': 'table',
      '/sage-femme': 'midwife',
      '/maternite': 'maternity',
      '/message': 'message',
    };

    const route = routeMap[location.pathname] || 'home';
    document.title = ROUTE_META[route].documentTitle;
  }, [location.pathname]);

  return null;
}

export function AppRoutes() {
  return (
    <Shell>
      <DocumentTitle />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/parametres" element={<SettingsView />} />
        <Route path="/settings" element={<Navigate to="/parametres" replace />} />
        <Route path="/historique" element={<TableView />} />
        <Route path="/tableau" element={<Navigate to="/historique" replace />} />
        <Route path="/table" element={<Navigate to="/historique" replace />} />
        <Route path="/sage-femme" element={<MidwifeView />} />
        <Route path="/sagefemme" element={<Navigate to="/sage-femme" replace />} />
        <Route path="/midwife" element={<Navigate to="/sage-femme" replace />} />
        <Route path="/maternite" element={<MaternityView />} />
        <Route path="/maternity" element={<Navigate to="/maternite" replace />} />
        <Route path="/message" element={<MessageView />} />
        <Route path="/messages" element={<Navigate to="/message" replace />} />
        <Route path="/sms" element={<Navigate to="/message" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export function App() {
  return (
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </StrictMode>
  );
}
