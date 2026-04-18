# Déploiement Netlify - Miss Contraction React Preview

## 📱 Environnements

| Type | URL | Branche | Platform |
|------|-----|---------|----------|
| **Production** | `https://mister-guiiug.github.io/miss-contraction/` | `main` | GitHub Pages |
| **Développement React** | `https://miss-contraction-dev.netlify.app` | `react-migration` | Netlify |

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

1. Allez sur **https://miss-contraction-dev.netlify.app**
2. Naviguez vers **/#/parametres** pour voir la vue Settings en React
3. Les autres vues restent en vanilla (Home, Table, Maternity, etc.)

## 📊 Comparaison Vanilla vs React

| Fonctionnalité | Vanilla (GitHub Pages) | React (Netlify) |
|----------------|------------------------|-----------------|
| Vue Settings | ✅ Template strings | ✅ Composants React |
| État global | localStorage | Zustand + localStorage |
| Routing | Hash routing maison | React Router + Hash |
| CSS | Identique | Identique |
| PWA | ✅ Oui | ✅ Oui |
