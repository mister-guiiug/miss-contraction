# Déploiement Netlify - Miss Contraction React Preview

## 🚀 Configuration rapide

### 1. Connecter le dépôt à Netlify

1. Allez sur [netlify.com](https://netlify.com)
2. Cliquez sur "Add new site" → "Import an existing project"
3. Sélectionnez GitHub
4. Recherchez et sélectionnez `mister-guiiug/miss-contraction`

### 2. Configuration du build

Dans les paramètres du site Netlify :

| Paramètre | Valeur |
|-----------|--------|
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Branches to deploy** | `All` (ou `react-migration` uniquement) |

### 3. Variables d'environnement

Ajoutez dans Site settings → Environment variables :

```
REACT_PREVIEW = true
```

## 📱 URLs de déploiement

| Type | URL |
|------|-----|
| **Production** | `https://miss-contraction.netlify.app` |
| **Preview react-migration** | `https://deploy-preview-1--miss-contraction.netlify.app` |

## 🔄 Déploiement automatique

Chaque push sur `react-migration` déclenche un déploiement avec une URL unique :
- Format : `https://deploy-preview-PR_NUMBER--miss-contraction.netlify.app`
- Ou pour les branches : `https://BRANCH_NAME--miss-contraction.netlify.app`

## 🛠️ Commandes utiles

```bash
# Build local pour tester
npm run build

# Preview local avec Netlify CLI
npm install -g netlify-cli
netlify deploy
```

## ⚠️ Note importante

La branche `main` (production) reste sur GitHub Pages :
- Production : `https://mister-guiiug.github.io/miss-contraction/`
- Preview React : Netlify
