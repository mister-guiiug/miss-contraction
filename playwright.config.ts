import { defineConfig, devices } from '@playwright/test';
import { definePwaPlaywrightConfig } from '@mister-guiiug/dev-wpa-config/playwright-base';

// La factory fournit la matrice 5 navigateurs, les reporters multi-format,
// le snapshotPathTemplate, reducedMotion et le webServer (cf. dev-wpa-config 1.3.0).
export default defineConfig(
  definePwaPlaywrightConfig({
    devices,
    testMatch: /.*\.spec\.ts$/,
  })
);
