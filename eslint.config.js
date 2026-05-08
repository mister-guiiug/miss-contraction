import { defineConfig } from 'eslint/config';
import baseConfig from '@mister-guiiug/dev-wpa-config/eslint-react';

const sharedConfig = Array.isArray(baseConfig) ? baseConfig : [baseConfig];

export default defineConfig([
  ...sharedConfig,
  {
    files: ['e2e/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);
