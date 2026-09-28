# Miss Contraction

[![Production](https://img.shields.io/badge/Production-GitHub%20Pages-brightgreen?style=for-the-badge)](https://mister-guiiug.github.io/miss-contraction/)
[![License](https://img.shields.io/badge/Licence-MIT-blue?style=for-the-badge)](https://github.com/mister-guiiug/miss-contraction/blob/main/LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Soutenir-%E2%98%95-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

> Chronomètre les contractions, suit leur fréquence et vous alerte quand les seuils que vous avez choisis sont atteints.

**[▶ Ouvrir l'application (GitHub Pages)](https://mister-guiiug.github.io/miss-contraction/)**

> ⚠️ **Avertissement médical** : cet outil est un aide-mémoire. Il ne remplace en aucun cas un avis médical. En cas de doute ou d'urgence, contactez immédiatement un professionnel de santé ou le 15 (SAMU).

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Comment utiliser l'application](#comment-utiliser-lapplication)
- [Installation sur votre téléphone (PWA)](#installation-sur-votre-téléphone-pwa)
- [Confidentialité](#confidentialité)
- [Développement](#développement)
- [Licence](#licence)

---

## Fonctionnalités

### Suivi des contractions

| Fonctionnalité            | Description                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Chronomètre               | Lance / arrête un chronomètre à chaque contraction en cours                                          |
| Indicateur de seuil       | Affichage visuel : calme, rythme soutenu, ou seuil atteint                                           |
| Pré-alerte                | Bandeau d'avertissement quand le rythme se resserre, avant le seuil complet (désactivable)           |
| Début oublié              | Une contraction restée ouverte plus de 5 minutes n'est pas reprise à la réouverture de l'application |
| Graphique des intervalles | Visualisation des derniers intervalles entre contractions                                            |
| Chronologie               | Historique des contractions avec note personnalisée par événement                                    |
| Annulation                | Annuler le dernier enregistrement dans les ~30 secondes                                              |

### Alertes

| Fonctionnalité          | Description                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Seuils personnalisables | Intervalle max (min), durée min (sec), nombre de contractions consécutives                                                    |
| Seuil atteint           | Badge « seuil atteint » à l'écran et trois vibrations longues (si les vibrations sont activées)                               |
| Report de la pré-alerte | Masque le bandeau de pré-alerte pendant 30 min ou 1 h, ou annule le report ; le badge et la vibration du seuil restent actifs |

**L'application n'envoie pas de notification système** : les alertes s'affichent à l'écran et se sentent par vibration. Gardez-la ouverte pendant le suivi.

### Paramètres et personnalisation

| Fonctionnalité          | Description                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| Fenêtre de statistiques | Toutes les données ou les 30 / 60 / 120 dernières minutes                  |
| Fiche maternité         | Nom, numéro de téléphone (appel rapide) et consignes d'admission           |
| Grand confort           | Textes et boutons agrandis ; écran maintenu allumé pendant une contraction |
| Vibrations              | Retour haptique au début et à la fin de chaque contraction                 |

### Autres écrans

| Écran                    | Description                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Tableau des contractions | Vue détaillée (heure, durée, intervalle, fréquence, notes) avec modification et suppression |
| Message maternité        | Texte pré-rempli prêt à copier ou partager par SMS / WhatsApp                               |
| Écran maternité          | Récapitulatif des infos + appel en un geste                                                 |

### Sauvegarde et export

| Fonctionnalité       | Description                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Export JSON          | Téléchargement ou partage natif de l'historique et des réglages                                       |
| Rappel de sauvegarde | Bandeau dans l'application, tous les 7 jours, pour penser à exporter avant un changement de téléphone |
| Effacement           | Suppression complète de l'historique sur l'appareil (avec confirmation)                               |

---

## Comment utiliser l'application

1. **Ouvrez l'application** sur votre téléphone : [miss-contraction](https://mister-guiiug.github.io/miss-contraction/)
2. **Configurez votre maternité** dans les paramètres (nom, numéro, consignes).
3. **Appuyez sur « Début »** au début d'une contraction, puis **« Fin »** quand elle se termine.
4. L'application calcule automatiquement les intervalles et la durée.
5. **L'écran vous alerte** quand le rythme se resserre (bandeau), puis quand les seuils sont atteints (badge et vibrations). Aucune notification n'est envoyée : gardez l'application ouverte.
6. **Appelez la maternité** directement depuis l'écran dédié.

---

## Installation sur votre téléphone (PWA)

Miss Contraction est une application web progressive (PWA) : elle s'installe directement sur votre écran d'accueil, sans passer par un store.

**Sur Android (Chrome) :**

1. Ouvrez le site dans Chrome.
2. Appuyez sur les trois points en haut à droite → **« Ajouter à l'écran d'accueil »**.

**Sur iPhone (Safari) :**

1. Ouvrez le site dans Safari.
2. Appuyez sur le bouton Partager → **« Sur l'écran d'accueil »**.

Une fois installée, l'application fonctionne **hors ligne** pour les fonctions de base.

---

## Développement

### Environnements

| Environnement           | URL                                                                                           | Branche                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Production**          | [mister-guiiug.github.io/miss-contraction](https://mister-guiiug.github.io/miss-contraction/) | `main`                                                  |
| **Ancienne préversion** | [miss-contraction-dev.netlify.app](https://miss-contraction-dev.netlify.app)                  | `react-migration` (branche supprimée), plus mise à jour |

La préversion Netlify a servi pendant la migration vers React ; sa configuration reste dans [`netlify.toml`](netlify.toml).

### Stack

| Couche            | Technologie                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework         | [React 19](https://react.dev/) + [react-router-dom 7](https://reactrouter.com/)                                                                                                                       |
| Build             | [Vite 8](https://vitejs.dev/)                                                                                                                                                                         |
| Style             | [Tailwind CSS 4](https://tailwindcss.com/) + CSS classique                                                                                                                                            |
| State             | [Zustand 5](https://zustand-demo.pmnd.rs/)                                                                                                                                                            |
| Validation        | [Zod 4](https://zod.dev/)                                                                                                                                                                             |
| Tests             | [Vitest 5](https://vitest.dev/) (jsdom) + [Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/) + [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) |
| Monitoring        | [@sentry/react](https://docs.sentry.io/platforms/javascript/guides/react/) + [web-vitals 6](https://web.dev/vitals/) + [PostHog](https://posthog.com/) (mesure d'audience, avec consentement)         |
| Configs partagées | [`@mister-guiiug/dev-pwa-config`](../dev-pwa-config/README.md) (ESLint, Prettier, TS, Vitest)                                                                                                         |
| PWA               | [`vite-plugin-pwa 1.3`](https://vite-pwa-org.netlify.app/) (Workbox)                                                                                                                                  |

### Scripts utiles

```bash
npm run dev                # Vite dev server
npm run build              # tsc -b && vite build && pwa-bundle-budget (budget de poids)
npm run build:analyze      # avec rollup-plugin-visualizer (dist/stats.html)
npm run build:netlify      # build pour Netlify (REACT_PREVIEW=1, base /)
npm run preview            # prévisualisation locale
npm run lint               # ESLint flat config
npm run format             # Prettier --write
npm run type-check         # tsc -b (strict)
npm run test               # Vitest (jsdom + Testing Library)
npm run test:e2e           # Playwright (24+ tests catégorisés via tags @critical, @smoke, @a11y, @performance, etc.)
npm run test:e2e:a11y      # tests d'accessibilité avec @axe-core/playwright
```

---

## Confidentialité

Votre suivi reste sur votre appareil : l'historique, les notes et les réglages n'en sortent que si vous les exportez ou les partagez vous-même.

| Donnée                      | Traitement                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Historique des contractions | Stocké **uniquement sur votre appareil** (localStorage du navigateur)                                                                                                                             |
| Paramètres                  | Stockés **uniquement sur votre appareil**                                                                                                                                                         |
| Mesure d'audience           | Seulement si vous l'acceptez dans le bandeau de consentement : pages vues et indicateurs de performance (Web Vitals), envoyés à PostHog (hébergement européen), sans cookie ni profil de personne |
| Erreurs techniques          | Rapports d'erreur envoyés à Sentry, pour corriger les pannes                                                                                                                                      |

L'application ne nécessite pas de compte ni d'inscription, et fonctionne sans connexion internet une fois installée.

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Guillaume GUERIN.
