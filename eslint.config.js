import baseConfig from '@mister-guiiug/dev-wpa-config/eslint-react';

/**
 * Override : pour les tests Playwright (e2e/) on autorise `any` et on relâche
 * complètement la règle no-unused-vars (les tests ont souvent des variables
 * de setup intentionnelles non utilisées et le pattern fixture { page } qui
 * n'est pas toujours consommé).
 */
export default [
  ...baseConfig,
  {
    files: ['e2e/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
