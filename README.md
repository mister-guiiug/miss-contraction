# Miss Contraction

Application web (PWA) pour **noter les contractions**, suivre la **fréquence et les intervalles**, et **recevoir une alerte** lorsque les seuils configurés suggèrent de contacter la maternité. Interface en français, pensée pour mobile.

**[Accéder à l'application](https://mister-guiiug.github.io/miss-contraction/)**

> **Avertissement** : cet outil est un aide-mémoire. Il ne remplace pas un avis médical. En cas de doute ou d’urgence, contactez un professionnel de santé ou les services d’urgence.

## Fonctionnalités

### Accueil

- **Début / fin de contraction** : chronomètre pendant une contraction en cours.
- **Indicateur de seuil** : état visuel selon la régularité récente (calme, en approche du seuil, ou critères remplis sur les **N dernières** contractions : intervalle max entre débuts, durée min, nombre de contractions consécutives — tout est réglable).
- **Pré-alerte** (optionnelle) : bandeau « rythme soutenu » avant le déclenchement strict des notifications.
- **Rappel** si une contraction est restée « ouverte » (début sans fin) trop longtemps (durée configurable).
- **Graphique** des intervalles entre débuts des derniers enregistrements (selon la fenêtre de stats choisie).
- **Chronologie** des contractions avec **note** optionnelle par événement.
- **Annuler** l’ajout de la dernière contraction pendant ~30 secondes.
- **Exporter / partager** l’historique et les réglages dans un **fichier JSON** (téléchargement ou partage natif si disponible) ; rappel périodique pour penser à sauvegarder avant un changement de téléphone.
- **Effacer tout l’historique** sur l’appareil (avec confirmation).

### Paramètres

- Seuils d’alerte : **intervalle max** (minutes), **durée min** (secondes), **nombre de contractions** consécutives à analyser.
- **Notifications** navigateur (demande de permission) ; **reporter les alertes** 30 min / 1 h ou annuler le report.
- **Fenêtre de temps** pour moyennes et graphique sur l’accueil : toutes les données ou **30 / 60 / 120** dernières minutes.
- **Fiche maternité** : libellé, **numéro** (appel rapide depuis l’écran dédié), **adresse / consignes**.
- **Accessibilité / confort** : textes et boutons plus grands ; **garder l’écran allumé** pendant une contraction en cours ; **vibrations** courtes au début / fin si l’appareil le permet.
- **Commande vocale** (expérimentale, activable) : début / fin de contraction à la voix ; le module peut être masqué dans le menu.
- **Module « message maternité »** : affichage de l’écran et de l’entrée de menu (désactivable).

### Autres écrans

- **Tableau des contractions** : tableau détaillé (horaires, durée, intervalle, fréquence, notes) avec **modification** (dates/heures + note) et **suppression** ligne par ligne.
- **Message maternité** : texte modifiable (modèle par défaut fourni), prêt à copier ou partager (SMS / WhatsApp / etc. selon le système).
- **Maternité** : rappel des infos saisies + **appel** en un geste.
- Navigation par **hash** (`#/`, `#/parametres`, `#/historique`, `#/maternite`, `#/message`), **menu latéral** et **fil d’Ariane**.

### PWA

- Installation sur l’**écran d’accueil**, raccourcis vers les sections principales (selon le manifeste), **mise à jour** automatique du service worker, mise en cache des ressources pour un usage **hors ligne** limité aux assets de l’app.

## Prérequis

- [Node.js](https://nodejs.org/) (version LTS recommandée)

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrir l’URL affichée dans le terminal (souvent `http://localhost:5173`).

## Scripts

| Commande | Description |
| -------- | ----------- |
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build (base `/miss-contraction/`, comme sur GitHub Pages) |
| `npm run icons` | Régénère les icônes PWA à partir de `public/icon.svg` (Sharp) |

## Déploiement (GitHub Pages)

Le dépôt est configuré avec la base Vite `/miss-contraction/`, adaptée à une URL du type :

`https://<utilisateur>.github.io/miss-contraction/`

Le workflow dans `.github/workflows/deploy-pages.yml` peut déployer le site automatiquement après un push sur la branche configurée.

## Technique

- **Vite** + **TypeScript**
- **PWA** (`vite-plugin-pwa`) : installation sur l’écran d’accueil, mode hors ligne pour les assets mis en cache
- Données stockées **localement** dans le navigateur (pas de compte serveur dans cette app)

## Licence

[MIT](LICENSE) — Copyright (c) 2026 Guillaume GUERIN.

Le champ `private` dans `package.json` évite une publication accidentelle sur le registre npm ; il ne change pas les droits sur le code hébergé ici.
