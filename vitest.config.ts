import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { baseTestOptions } from '@mister-guiiug/dev-pwa-config/vitest-base';

export default defineConfig({
  plugins: [react()],
  // Les constantes de build injectées par `vite.config.ts`. Sans elles,
  // `src/appVersion.ts` — importé par l'écran « À propos » — ne s'évalue pas
  // sous Vitest.
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
    __APP_BUILD_ID__: JSON.stringify('test'),
    __APP_DEPLOYMENT_VERSION__: JSON.stringify('test'),
  },
  test: {
    ...baseTestOptions,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
