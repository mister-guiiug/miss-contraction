import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const GTM_ID = "GTM-M2GSG3V4";
const GA_ID = "G-B44CK4VR08";
const GSC_VERIFICATION = "iUfQ7_dOztC3XoSGesC2b7IkxyNL2O9fegKXECoOg30";

// Dépôt GitHub Pages : https://<user>.github.io/miss-contraction/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/miss-contraction/" : "/",
  plugins: [
    {
      name: "google-tag-manager",
      transformIndexHtml() {
        if (command !== "build") return [];
        return [
          {
            tag: "meta",
            injectTo: "head",
            attrs: { name: "google-site-verification", content: GSC_VERIFICATION },
          },
          {
            tag: "script",
            injectTo: "head",
            children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          },
          {
            tag: "noscript",
            injectTo: "body-prepend",
            children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          },
          {
            tag: "script",
            injectTo: "head",
            attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` },
          },
          {
            tag: "script",
            injectTo: "head",
            children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
          },
        ];
      },
    },
    {
      name: "miss-contraction-trailing-slash",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const raw = req.originalUrl ?? "";
          const pathOnly = raw.split("?")[0] ?? "";
          if (pathOnly === "/miss-contraction") {
            const qs = raw.includes("?") ? `?${raw.split("?")[1]}` : "";
            res.statusCode = 302;
            res.setHeader("Location", `/miss-contraction/${qs}`);
            res.end();
            return;
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const raw = req.originalUrl ?? "";
          const pathOnly = raw.split("?")[0] ?? "";
          if (pathOnly === "/miss-contraction") {
            const qs = raw.includes("?") ? `?${raw.split("?")[1]}` : "";
            res.statusCode = 302;
            res.setHeader("Location", `/miss-contraction/${qs}`);
            res.end();
            return;
          }
          next();
        });
      },
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/apple-touch-icon.png",
        "robots.txt",
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2,webmanifest}"],
      },
      manifest: {
        id: "/miss-contraction/",
        name: "Miss Contraction",
        short_name: "Miss Contraction",
        description:
          "Comptez la fréquence des contractions et recevez une alerte pour vous rendre à la maternité.",
        theme_color: "#5c1f5c",
        background_color: "#fdf4fb",
        display: "standalone",
        orientation: "portrait",
        scope: "/miss-contraction/",
        start_url: "/miss-contraction/",
        lang: "fr",
        dir: "ltr",
        categories: ["health", "lifestyle"],
        shortcuts: [
          {
            name: "Accueil",
            short_name: "Accueil",
            description: "Saisie des contractions et historique",
            url: "/miss-contraction/#/",
          },
          {
            name: "Appeler la maternité",
            short_name: "Maternité",
            description: "Numéro, adresse et appel rapide",
            url: "/miss-contraction/#/maternite",
          },
          {
            name: "Paramètres et alerte",
            short_name: "Réglages",
            description: "Seuils d’alerte et notifications",
            url: "/miss-contraction/#/parametres",
          },
          {
            name: "Message maternité",
            short_name: "Message",
            description: "Modèle SMS / WhatsApp pour prévenir",
            url: "/miss-contraction/#/message",
          },
          {
            name: "Tableau des contractions",
            short_name: "Tableau",
            description: "Durée, intervalle et fréquence",
            url: "/miss-contraction/#/historique",
          },
          {
            name: "Résumé sage-femme",
            short_name: "Résumé SF",
            description: "Synthèse imprimable pour la maternité",
            url: "/miss-contraction/#/sage-femme",
          },
        ],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
}));
