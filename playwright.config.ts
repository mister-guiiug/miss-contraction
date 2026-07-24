import { defineConfig, devices } from '@playwright/test';
import { definePwaPlaywrightConfig } from '@mister-guiiug/dev-wpa-config/playwright-base';

// La factory fournit la matrice 5 navigateurs, les reporters multi-format,
// le snapshotPathTemplate, reducedMotion et le webServer (cf. dev-wpa-config 1.3.0).
// Port 4173 : ne pas réutiliser par erreur un AUTRE dev server déjà lancé
// sur 5173 (reuseExistingServer est actif hors CI).
export default defineConfig(
  definePwaPlaywrightConfig({
    devices,
    testMatch: /.*\.spec\.ts$/,
    port: 4173,
    command: 'npm run dev -- --port 4173 --strictPort',
  })
);
