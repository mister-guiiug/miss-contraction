# Déploiement Netlify - Miss Contraction React Preview

## 📱 Environnements

| Type                    | URL                                                 | Branche           | Platform     |
| ----------------------- | --------------------------------------------------- | ----------------- | ------------ |
| **Production**          | `https://mister-guiiug.github.io/miss-contraction/` | `main`            | GitHub Pages |
| **Développement React** | `https://miss-contraction-dev.netlify.app`          | `react-migration` | Netlify      |

## 🚀 Configuration Netlify

### Site : miss-contraction-dev

- **Nom du projet** : `miss-contraction-dev`
- **URL** : `https://miss-contraction-dev.netlify.app`
- **Branche déployée** : `react-migration`
- **Build command** : `npm run build`
- **Publish directory** : `dist`

### Variables d'environnement

Dans Site settings → Environment variables :

```
REACT_PREVIEW = true
```

## 🔄 Déploiement automatique

Chaque push sur la branche `react-migration` déclenche automatiquement un déploiement sur :

- **https://miss-contraction-dev.netlify.app**

## 🛠️ Commandes utiles

```bash
# Build local pour tester
npm run build

# Build spécifique Netlify
npm run build:netlify

# Preview local avec Netlify CLI
npm install -g netlify-cli
netlify deploy
```

## 🧪 Tester la preview React

L'application est désormais **entièrement React 19 + react-router-dom 7 + Zustand 5 + Tailwind 4** sur les deux environnements (main / react-migration). Netlify reste utilisé comme **environnement de pré-production** pour valider les évolutions avant publication sur GitHub Pages.

1. Allez sur **https://miss-contraction-dev.netlify.app**
2. Vérifiez les routes : `/#/`, `/#/maternite`, `/#/parametres`, `/#/historique`, `/#/sage-femme`, `/#/message`
3. Testez les notifications, alertes, export JSON et le mode hors-ligne (PWA)

## 📊 Différences entre les environnements

| Critère                     | Production (GitHub Pages, branche `main`) | Dev (Netlify, branche `react-migration`)    |
| --------------------------- | ----------------------------------------- | ------------------------------------------- |
| Base path                   | `/miss-contraction/`                      | `/` (racine du sous-domaine)                |
| Build script                | `npm run build`                           | `npm run build:netlify` (`REACT_PREVIEW=1`) |
| Manifest PWA `id` / `scope` | `/miss-contraction/`                      | `/`                                         |
| Stack applicative           | identique                                 | identique                                   |
| Backend                     | aucun (localStorage)                      | aucun (localStorage)                        |
