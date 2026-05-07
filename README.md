# Miss Contraction

[![Production](https://img.shields.io/badge/Production-GitHub%20Pages-brightgreen?style=for-the-badge)](https://mister-guiiug.github.io/miss-contraction/)
[![Development](https://img.shields.io/badge/Développement-Netlify-blue?style=for-the-badge)](https://miss-contraction-dev.netlify.app)
[![License](https://img.shields.io/badge/Licence-MIT-blue?style=for-the-badge)](https://github.com/mister-guiiug/miss-contraction/blob/main/LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Soutenir-%E2%98%95-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

> Chronomètre les contractions, suit leur fréquence et vous alerte quand il est temps d'appeler la maternité.

**[▶ Production (GitHub Pages)](https://mister-guiiug.github.io/miss-contraction/)** | **[▶ Développement React (Netlify)](https://miss-contraction-dev.netlify.app)**

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

| Fonctionnalité             | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| Chronomètre                | Lance / arrête un chronomètre à chaque contraction en cours       |
| Indicateur de seuil        | Affichage visuel : calme, rythme soutenu, ou seuil atteint        |
| Pré-alerte                 | Bandeau d'avertissement avant le déclenchement des notifications  |
| Rappel contraction ouverte | Alerte si une contraction a été démarrée mais jamais terminée     |
| Graphique des intervalles  | Visualisation des derniers intervalles entre contractions         |
| Chronologie                | Historique des contractions avec note personnalisée par événement |
| Annulation                 | Annuler le dernier enregistrement dans les ~30 secondes           |

### Alertes et notifications

| Fonctionnalité           | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| Seuils personnalisables  | Intervalle max (min), durée min (sec), nombre de contractions consécutives |
| Notifications navigateur | Alerte dès que les seuils sont atteints                                    |
| Report d'alerte          | Snooze 30 min ou 1 h, ou annulation du report                              |

### Paramètres et personnalisation

| Fonctionnalité                   | Description                                                                |
| -------------------------------- | -------------------------------------------------------------------------- |
| Fenêtre de statistiques          | Toutes les données ou les 30 / 60 / 120 dernières minutes                  |
| Fiche maternité                  | Nom, numéro de téléphone (appel rapide) et consignes d'admission           |
| Grand confort                    | Textes et boutons agrandis ; écran maintenu allumé pendant une contraction |
| Vibrations                       | Retour haptique au début et à la fin de chaque contraction                 |
| Commande vocale _(expérimental)_ | Début / fin de contraction à la voix (activable dans les réglages)         |

### Autres écrans

| Écran                    | Description                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Tableau des contractions | Vue détaillée (heure, durée, intervalle, fréquence, notes) avec modification et suppression |
| Message maternité        | Texte pré-rempli prêt à copier ou partager par SMS / WhatsApp                               |
| Écran maternité          | Récapitulatif des infos + appel en un geste                                                 |

### Sauvegarde et export

| Fonctionnalité       | Description                                                                     |
| -------------------- | ------------------------------------------------------------------------------- |
| Export JSON          | Téléchargement ou partage natif de l'historique et des réglages                 |
| Rappel de sauvegarde | Notification périodique pour penser à exporter avant un changement de téléphone |
| Effacement           | Suppression complète de l'historique sur l'appareil (avec confirmation)         |

---

## Comment utiliser l'application

1. **Ouvrez l'application** sur votre téléphone : [miss-contraction](https://mister-guiiug.github.io/miss-contraction/)
2. **Configurez votre maternité** dans les paramètres (nom, numéro, consignes).
3. **Appuyez sur « Début »** au début d'une contraction, puis **« Fin »** quand elle se termine.
4. L'application calcule automatiquement les intervalles et la durée.
5. **Une notification s'affiche** dès que les seuils configurés sont atteints.
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

| Environnement     | URL                                                                                           | Branche           |
| ----------------- | --------------------------------------------------------------------------------------------- | ----------------- |
| **Production**    | [mister-guiiug.github.io/miss-contraction](https://mister-guiiug.github.io/miss-contraction/) | `main`            |
| **Développement** | [miss-contraction-dev.netlify.app](https://miss-contraction-dev.netlify.app)                  | `react-migration` |

Voir [NETLIFY.md](NETLIFY.md) pour les détails du déploiement Netlify.

### Stack

| Couche            | Technologie                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework         | [React 19](https://react.dev/) + [react-router-dom 7](https://reactrouter.com/)                                                                                                                       |
| Build             | [Vite 7](https://vitejs.dev/) (cible ES2025)                                                                                                                                                          |
| Style             | [Tailwind CSS 4](https://tailwindcss.com/) + CSS classique                                                                                                                                            |
| State             | [Zustand 5](https://zustand-demo.pmnd.rs/)                                                                                                                                                            |
| Validation        | [Zod 3](https://zod.dev/)                                                                                                                                                                             |
| Tests             | [Vitest 3](https://vitest.dev/) (jsdom) + [Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/) + [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) |
| Monitoring        | [@sentry/react](https://docs.sentry.io/platforms/javascript/guides/react/) + [web-vitals 4](https://web.dev/vitals/)                                                                                  |
| Configs partagées | [`@mister-guiiug/dev-wpa-config`](../dev-wpa-config/README.md) (ESLint, Prettier, TS, Vitest)                                                                                                                  |
| PWA               | [`vite-plugin-pwa 1.2`](https://vite-pwa-org.netlify.app/) (Workbox)                                                                                                                                  |

### Scripts utiles

```bash
npm run dev                # Vite dev server
npm run build              # tsc -b && vite build
npm run build:analyze      # avec rollup-plugin-visualizer (dist/stats.html)
npm run build:netlify      # build pour Netlify (REACT_PREVIEW=1, base /)
npm run preview            # prévisualisation locale
npm run lint               # ESLint flat config
npm run format             # Prettier --write
npm run type-check         # tsc --noEmit (strict)
npm run test               # Vitest (jsdom + Testing Library)
npm run test:e2e           # Playwright (24+ tests catégorisés via tags @critical, @smoke, @a11y, @performance, etc.)
npm run test:e2e:a11y      # tests d'accessibilité avec @axe-core/playwright
```

---

## Confidentialité

Miss Contraction ne collecte **aucune donnée personnelle**.

| Donnée                      | Traitement                                                            |
| --------------------------- | --------------------------------------------------------------------- |
| Historique des contractions | Stocké **uniquement sur votre appareil** (localStorage du navigateur) |
| Paramètres                  | Stockés **uniquement sur votre appareil**                             |
| Données réseau              | Aucune donnée n'est envoyée à un serveur externe                      |

L'application ne nécessite pas de compte, pas d'inscription et pas de connexion internet une fois installée.

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Guillaume GUERIN.
