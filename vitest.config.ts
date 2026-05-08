import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { baseTestOptions } from '@mister-guiiug/dev-wpa-config/vitest-base';

export default defineConfig({
  plugins: [react()],
  test: {
    ...baseTestOptions,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
