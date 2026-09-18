import { defineConfig, type PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { LS_THEME } from './src/themeKey';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { pwaSeoPlugin } from '@mister-guiiug/dev-pwa-config/vite-pwa-base';
import { visualizer } from 'rollup-plugin-visualizer';
import { readFileSync } from 'node:fs';
import { versionPlugin } from '@mister-guiiug/dev-pwa-config/vite-version';

const analyze = process.env.ANALYZE === '1';
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string;
};

// `GTM-M2GSG3V4` et `G-B44CK4VR08` ont quitté ce fichier ; écrits ici, ils
// partaient au build sans condition. Seul GA4 subsiste, en variable de dépôt
// `VITE_GA_MEASUREMENT_ID` lue par `ConsentBanner` : le conteneur GTM est
// abandonné, une voie de mesure valant mieux que deux qui se doublent.
//
// `GA_COOKIE_DOMAIN` a quitté ce fichier lui aussi — mais ce qui était écrit
// ici de son remplacement était FAUX, et la mesure l'a dit.
//
// On lisait : « le défaut `auto` de GA4 y aboutit déjà, le navigateur refuse
// tout cookie posé plus haut et `auto` retombe sur l'hôte complet ». Il ne
// retombe pas proprement. Mesuré en production le 18/09/2026 : `auto` vise
// d'abord le domaine enregistrable, donc `github.io`, qui est sur la Public
// Suffix List — et Firefox annonçait le refus dans la console de CHAQUE
// visiteur des dix-neuf sites (« Le cookie « _ga » a été rejeté car le domaine
// est invalide »).
//
// C'est le socle qui le traite depuis la 4.21.3, et il le MESURE au lieu de le
// deviner : `domaineDeCookie()` pose un cookie jetable par candidat, du plus
// large au plus étroit, et garde le premier qui tient. Une liste de suffixes
// publics ne se calcule pas en lisant un nom d'hôte.
const GSC_VERIFICATION = 'iUfQ7_dOztC3XoSGesC2b7IkxyNL2O9fegKXECoOg30';

// Dépôt GitHub Pages : https://<user>.github.io/miss-contraction/
// Preview React : https://<user>.github.io/miss-contraction-react/
// Netlify Dev : https://miss-contraction-dev.netlify.app
export default defineConfig(({ command }) => {
  // Détection de l'environnement de build
  const isNetlify =
    process.env.NETLIFY === 'true' ||
    process.env.NETLIFY_BUILD_BASE !== undefined;
  const isReactPreview = process.env.REACT_PREVIEW === '1';
  const buildId =
    process.env.DEPLOY_ID ||
    process.env.NETLIFY_BUILD_ID ||
    process.env.GITHUB_RUN_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.COMMIT_REF?.slice(0, 7) ||
    process.env.GITHUB_SHA?.slice(0, 7) ||
    (command === 'build' ? String(Date.now()) : 'dev');
  const deploymentVersion = `${version}+${buildId}`;

  // Base path selon l'environnement. `VITE_BASE_PATH` (défini par le déploiement
  // famille et par la CI Lighthouse avec « / ») est prioritaire sur la détection.
  let basePath = '/';
  if (process.env.VITE_BASE_PATH) {
    basePath = process.env.VITE_BASE_PATH;
  } else if (command === 'build') {
    if (isNetlify) {
      // Netlify : déploiement à la racine
      basePath = '/';
    } else if (isReactPreview) {
      // GitHub Pages React preview
      basePath = '/miss-contraction-react/';
    } else {
      // GitHub Pages production
      basePath = '/miss-contraction/';
    }
  }

  return {
    base: basePath,
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __APP_BUILD_ID__: JSON.stringify(buildId),
      __APP_DEPLOYMENT_VERSION__: JSON.stringify(deploymentVersion),
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            const norm = id.replace(/\\/g, '/');

            /*
             * SENTRY DANS SON PROPRE MORCEAU, ET C'EST UNE CORRECTION, PAS UN
             * RÉGLAGE FIN.
             *
             * `react/observability` du socle charge `@sentry/react` par un
             * `import()` DYNAMIQUE : il ne doit partir que si un DSN existe.
             * Mais `manualChunks` a le dernier mot sur Rollup, et la ligne
             * `return 'vendor'` en bas de cette fonction attrapait Sentry au
             * passage — dans un morceau STATIQUE, préchargé par `index.html`.
             *
             * Mesuré le 15/09/2026 : `vendor` pesait 144,4 kB gzip, `captureException`
             * dedans. Or ce dépôt n'a AUCUN `VITE_SENTRY_DSN` — ni en secret, ni
             * en variable. `initSentry` sort donc sur `if (!dsn) return null`
             * sans jamais toucher au SDK : ces kilo-octets étaient téléchargés
             * par chaque visiteur pour un Sentry qui ne s'allume jamais.
             *
             * Le jour où un DSN sera posé, ce morceau se chargera à la demande,
             * après le premier rendu, au lieu de bloquer avec le reste.
             */
            if (norm.includes('/@sentry/')) return 'sentry';

            // Séparer les librairies principales
            if (
              norm.includes('/vite-plugin-pwa/') ||
              norm.includes('/workbox-')
            ) {
              return 'pwa';
            }

            // Sharp pour les images
            if (norm.includes('/sharp/')) {
              return 'image-processing';
            }

            // React séparé
            if (
              norm.includes('/react-dom/') ||
              norm.includes('/node_modules/react/') ||
              norm.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            // Router séparé
            if (norm.includes('/react-router/')) {
              return 'router';
            }

            // Zustand séparé
            if (norm.includes('/zustand/')) {
              return 'zustand';
            }

            // Tailwind runtime
            if (
              norm.includes('/tailwindcss/') ||
              norm.includes('/@tailwindcss/')
            ) {
              return 'tailwind';
            }

            return 'vendor';
          },
        },
      },
    },
    plugins: [
      // AVANT cspPlugin : il pose un script inline dans le <head>, que la
      // CSP doit hacher après coup ; et il écrit version.json au build.
      versionPlugin({ manifest: true, define: false }),
      react(),
      tailwindcss(),
      // SEO partagé famille : canonical via placeholder index.html +
      // sitemap.xml/robots.txt générés au build. La MESURE, elle, n'est plus
      // ici du tout : `ConsentBanner` la monte à l'exécution, après accord.
      // Le plugin local ci-dessous ne pose plus que la balise de vérification
      // de propriété Google, qui ne dépose rien chez le visiteur.
      pwaSeoPlugin({
        // Deux <meta name="theme-color"> par schéma : la barre du navigateur suit
        // le mode sombre dès le premier rendu (relevé du 02/09/2026 : 5 apps sur 16).
        themeColor: { light: '#f8f2fc', dark: '#160b1c' },
        siteName: 'Miss Contraction',
        basePath,
        logoPath: '/icon.svg',
        // Script anti-FOUC engendré au lieu d'être recopié dans `index.html`.
        // `storageKey` est passée explicitement : le défaut du socle est
        // `dwc_theme`, partagée par la famille, et l'adopter donnerait à cette
        // app le thème réglé dans une autre. Voir `src/theme.ts`.
        themeBoot: { storageKey: LS_THEME },
      }),
      {
        name: 'google-tag-manager',
        transformIndexHtml() {
          if (command !== 'build') return [];
          return [
            /*
             * SEULE LA VÉRIFICATION DE PROPRIÉTÉ RESTE ICI.
             *
             * Ce plugin injectait aussi, au build et SANS AUCUNE CONDITION, le
             * bootstrap de Google Tag Manager, son iframe `noscript`, le script
             * `gtag/js` et un `gtag('config', …)`. Tout partait dans le `<head>`,
             * donc AVANT le premier rendu : avant que quiconque ait pu accepter,
             * et avant même que le mode consentement de Google ait pu déclarer
             * son état par défaut — lequel n'a aucun effet rétroactif une fois le
             * tag évalué.
             *
             * La mesure passe désormais par `ConsentBanner`, et les identifiants
             * viennent des variables du dépôt. La balise ci-dessous, elle, ne
             * dépose rien chez l'utilisateur : elle prouve à Google que le
             * domaine est à nous, et n'a pas à attendre un consentement.
             */
            {
              tag: 'meta',
              injectTo: 'head',
              attrs: {
                name: 'google-site-verification',
                content: GSC_VERIFICATION,
              },
            },
          ];
        },
      },
      {
        name: 'miss-contraction-trailing-slash',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Pas de redirection sur Netlify (déjà à la racine)
            if (isNetlify) {
              next();
              return;
            }
            const raw = req.originalUrl ?? '';
            const pathOnly = raw.split('?')[0] ?? '';
            const targetPath = isReactPreview
              ? '/miss-contraction-react'
              : '/miss-contraction';
            if (pathOnly === targetPath) {
              const qs = raw.includes('?') ? `?${raw.split('?')[1]}` : '';
              res.statusCode = 302;
              res.setHeader('Location', `${targetPath}/${qs}`);
              res.end();
              return;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            // Pas de redirection sur Netlify (déjà à la racine)
            if (isNetlify) {
              next();
              return;
            }
            const raw = req.originalUrl ?? '';
            const pathOnly = raw.split('?')[0] ?? '';
            const targetPath = isReactPreview
              ? '/miss-contraction-react'
              : '/miss-contraction';
            if (pathOnly === targetPath) {
              const qs = raw.includes('?') ? `?${raw.split('?')[1]}` : '';
              res.statusCode = 302;
              res.setHeader('Location', `${targetPath}/${qs}`);
              res.end();
              return;
            }
            next();
          });
        },
      },
      VitePWA({
        // `prompt`, pas `autoUpdate` : un déploiement tombant pendant un
        // chronométrage ne recharge plus la page tout seul ; le bandeau du
        // socle (AppUpdates, main.tsx) laisse l'utilisatrice choisir le moment.
        registerType: 'prompt',
        includeAssets: [
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/apple-touch-icon.png',
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2,webmanifest}'],
          /*
           * LE MORCEAU SENTRY HORS DU PRÉCACHE, ET C'EST TOUT L'INTÉRÊT DE
           * L'AVOIR SORTI DE `vendor` plus haut.
           *
           * `manualChunks` le range dans son propre morceau, que le socle ne
           * charge que si un DSN est posé — mais `globPatterns` ci-dessus
           * ramasse TOUT le JS émis, `import()` ou pas. Mesuré le 16/09/2026
           * sur la production : `sw.js` listait `sentry-CwaqS02s.js`, 345 KiB
           * bruts, téléchargés par chaque visiteur à l'installation du service
           * worker, alors qu'aucune variable `VITE_SENTRY_DSN` n'est posée sur
           * ce dépôt. Le découpage paresseux était vrai, et entièrement défait
           * un cran plus loin.
           *
           * Hors précache, il est cherché sur le réseau à la première erreur —
           * et jamais si l'observabilité reste éteinte. Ne pas l'avoir hors
           * ligne est sans conséquence : rapporter une erreur demande le réseau.
           */
          globIgnores: ['**/sentry-*.js'],
        },
        manifest: {
          id: isNetlify
            ? '/'
            : isReactPreview
              ? '/miss-contraction-react/'
              : '/miss-contraction/',
          name: 'Miss Contraction',
          short_name: 'Miss Contraction',
          description:
            'Comptez la fréquence des contractions et recevez une alerte pour vous rendre à la maternité.',
          theme_color: '#5c1f5c',
          background_color: '#fdf4fb',
          display: 'standalone',
          orientation: 'portrait',
          scope: isNetlify
            ? '/'
            : isReactPreview
              ? '/miss-contraction-react/'
              : '/miss-contraction/',
          start_url: isNetlify
            ? '/'
            : isReactPreview
              ? '/miss-contraction-react/'
              : '/miss-contraction/',
          lang: 'fr',
          dir: 'ltr',
          categories: ['health', 'lifestyle'],
          shortcuts: [
            {
              name: 'Accueil',
              short_name: 'Accueil',
              description: 'Saisie des contractions et historique',
              url: isNetlify
                ? '/#/'
                : isReactPreview
                  ? '/miss-contraction-react/#/'
                  : '/miss-contraction/#/',
            },
            {
              name: 'Appeler la maternité',
              short_name: 'Maternité',
              description: 'Numéro, adresse et appel rapide',
              url: isNetlify
                ? '/#/maternite'
                : isReactPreview
                  ? '/miss-contraction-react/#/maternite'
                  : '/miss-contraction/#/maternite',
            },
            {
              name: 'Paramètres et alerte',
              short_name: 'Réglages',
              description: "Seuils d'alerte et notifications",
              url: isNetlify
                ? '/#/parametres'
                : isReactPreview
                  ? '/miss-contraction-react/#/parametres'
                  : '/miss-contraction/#/parametres',
            },
            {
              name: 'Message maternité',
              short_name: 'Message',
              description: 'Modèle SMS / WhatsApp pour prévenir',
              url: isNetlify
                ? '/#/message'
                : isReactPreview
                  ? '/miss-contraction-react/#/message'
                  : '/miss-contraction/#/message',
            },
            {
              name: 'Tableau des contractions',
              short_name: 'Tableau',
              description: 'Durée, intervalle et fréquence',
              url: isNetlify
                ? '/#/historique'
                : isReactPreview
                  ? '/miss-contraction-react/#/historique'
                  : '/miss-contraction/#/historique',
            },
            {
              name: 'Résumé sage-femme',
              short_name: 'Résumé SF',
              description: 'Synthèse imprimable pour la maternité',
              url: isNetlify
                ? '/#/sage-femme'
                : isReactPreview
                  ? '/miss-contraction-react/#/sage-femme'
                  : '/miss-contraction/#/sage-femme',
            },
          ],
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            // UNE IMAGE PAR USAGE. icon-512.png était déclaré ICI UNE
            // SECONDE FOIS, en `maskable` : la même tuile arrondie sur fond
            // blanc servait au navigateur, qui la montre telle quelle, et à
            // Android, qui la rogne — coins coupés, liseré blanc autour du
            // rose.
            {
              src: 'icons/icon-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: 'screenshots/mobile.png',
              sizes: '824x1830',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Écran d’accueil sur mobile',
            },
            {
              src: 'screenshots/wide.png',
              sizes: '2560x1600',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Écran d’accueil sur ordinateur',
            },
          ],
        },
      }),
      ...(analyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
              open: !process.env.CI,
            }) as PluginOption,
          ]
        : []),
    ],
  };
});
