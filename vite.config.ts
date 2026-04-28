import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';

const GTM_ID = 'GTM-M2GSG3V4';
const GA_ID = 'G-B44CK4VR08';
const GSC_VERIFICATION = 'iUfQ7_dOztC3XoSGesC2b7IkxyNL2O9fegKXECoOg30';

// Domaine racine pour les cookies GA (GitHub Pages utilise un sous-chemin,
// pas un sous-domaine — le cookie doit être ancré sur le domaine réel).
const GA_COOKIE_DOMAIN = 'mister-guiiug.github.io';

// Dépôt GitHub Pages : https://<user>.github.io/miss-contraction/
// Preview React : https://<user>.github.io/miss-contraction-react/
// Netlify Dev : https://miss-contraction-dev.netlify.app
export default defineConfig(({ command }) => {
  // Détection de l'environnement de build
  const isNetlify = process.env.NETLIFY === 'true' || process.env.NETLIFY_BUILD_BASE !== undefined;
  const isReactPreview = process.env.REACT_PREVIEW === '1';

  // Base path selon l'environnement
  let basePath = '/';
  if (command === 'build') {
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
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            const norm = id.replace(/\\/g, '/');

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

            return 'vendor';
          },
        },
      },
    },
    plugins: [
      react(),
      {
        name: 'google-tag-manager',
        transformIndexHtml() {
          if (command !== 'build') return [];
          return [
            {
              tag: 'meta',
              injectTo: 'head',
              attrs: {
                name: 'google-site-verification',
                content: GSC_VERIFICATION,
              },
            },
            {
              tag: 'script',
              injectTo: 'head',
              children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+i:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            },
            {
              tag: 'noscript',
              injectTo: 'body-prepend',
              children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            },
            {
              tag: 'script',
              injectTo: 'head',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
              },
            },
            {
              tag: 'script',
              injectTo: 'head',
              children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{'cookie_domain':'${GA_COOKIE_DOMAIN}'});`,
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
            const targetPath = isReactPreview ? '/miss-contraction-react' : '/miss-contraction';
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
            const targetPath = isReactPreview ? '/miss-contraction-react' : '/miss-contraction';
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
        registerType: 'prompt',
        includeAssets: [
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/apple-touch-icon.png',
          'robots.txt',
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2,webmanifest}'],
        },
        manifest: {
          id: isNetlify ? '/' : isReactPreview ? '/miss-contraction-react/' : '/miss-contraction/',
          name: 'Miss Contraction',
          short_name: 'Miss Contraction',
          description:
            'Comptez la fréquence des contractions et recevez une alerte pour vous rendre à la maternité.',
          theme_color: '#5c1f5c',
          background_color: '#fdf4fb',
          display: 'standalone',
          orientation: 'portrait',
          scope: isNetlify ? '/' : isReactPreview ? '/miss-contraction-react/' : '/miss-contraction/',
          start_url: isNetlify ? '/' : isReactPreview ? '/miss-contraction-react/' : '/miss-contraction/',
          lang: 'fr',
          dir: 'ltr',
          categories: ['health', 'lifestyle'],
          shortcuts: [
            {
              name: 'Accueil',
              short_name: 'Accueil',
              description: 'Saisie des contractions et historique',
              url: isNetlify ? '/#/' : isReactPreview ? '/miss-contraction-react/#/' : '/miss-contraction/#/',
            },
            {
              name: 'Appeler la maternité',
              short_name: 'Maternité',
              description: 'Numéro, adresse et appel rapide',
              url: isNetlify ? '/#/maternite' : isReactPreview ? '/miss-contraction-react/#/maternite' : '/miss-contraction/#/maternite',
            },
            {
              name: 'Paramètres et alerte',
              short_name: 'Réglages',
              description: "Seuils d'alerte et notifications",
              url: isNetlify ? '/#/parametres' : isReactPreview ? '/miss-contraction-react/#/parametres' : '/miss-contraction/#/parametres',
            },
            {
              name: 'Message maternité',
              short_name: 'Message',
              description: 'Modèle SMS / WhatsApp pour prévenir',
              url: isNetlify ? '/#/message' : isReactPreview ? '/miss-contraction-react/#/message' : '/miss-contraction/#/message',
            },
            {
              name: 'Tableau des contractions',
              short_name: 'Tableau',
              description: 'Durée, intervalle et fréquence',
              url: isNetlify ? '/#/historique' : isReactPreview ? '/miss-contraction-react/#/historique' : '/miss-contraction/#/historique',
            },
            {
              name: 'Résumé sage-femme',
              short_name: 'Résumé SF',
              description: 'Synthèse imprimable pour la maternité',
              url: isNetlify ? '/#/sage-femme' : isReactPreview ? '/miss-contraction-react/#/sage-femme' : '/miss-contraction/#/sage-femme',
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
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
  };
});
