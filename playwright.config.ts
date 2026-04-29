import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/, // Exclure les fichiers helpers, pages, etc.
  
  // Parallélisation
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4, // 4 workers local, 1 en CI pour stabilité

  // Retry et timeout
  retries: process.env.CI ? 2 : 1, // 1 retry local pour détecter les flaky tests
  timeout: 30 * 1000, // 30s par test
  expect: { timeout: 10 * 1000 },
  
  // Rapports multi-format
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'], // Console output
    process.env.CI ? ['github'] : [],
  ].filter(Boolean) as any,

  use: {
    baseURL: 'http://localhost:5173',
    
    // Artefacts
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Accessibilité
    reducedMotion: 'reduce', // Respecter les préférences utilisateur
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Configuration pour snapshots visuels
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-{platform}{ext}',
  snapshotDir: 'e2e/__snapshots__',
});
