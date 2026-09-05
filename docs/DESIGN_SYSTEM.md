# Design system — miss-contraction

Ce document décrit ce qui existe, pas ce qu'on aimerait avoir. Quand il ment,
c'est lui qu'il faut corriger.

---

## Le socle

L'application dépend de `@mister-guiiug/dev-pwa-config`, qui expose trois
feuilles de style. **Une seule est importée.**

| Feuille du socle      | Importée ? | Pourquoi                                                                   |
| --------------------- | ---------- | -------------------------------------------------------------------------- |
| `tailwind-preset.css` | ✅         | Breakpoints en rem, échelles fluides, utilitaires de zone sûre iOS         |
| `tokens.css`          | ❌         | Poserait un second contrat de couleur (`--dwc-*`) à côté de celui de l'app |
| `components.css`      | ❌         | Restylerait `EmptyState` et `ErrorBoundary`, déjà habillés ici             |

Le socle habille ses composants React par des attributs `[data-dwc="…"]` —
134 crochets, 2 012 lignes. L'application en restyle **23** dans ses propres
feuilles : pied de page, liste des applications de la famille, état vide,
barre de navigation, `ErrorBoundary`.

**Le coût, à connaître.** Une montée de version du socle peut renommer ou
déplacer un `[data-dwc]` sans rien casser de visible : la règle de l'app cesse
simplement de s'appliquer. Après chaque bump de `dev-pwa-config`, passer sur
les écrans « À propos » et « accueil vide ».

### Tailwind

Tailwind est chargé **pour son preflight, pas pour ses utilitaires**. Aucune
classe utilitaire n'est employée : les 249 classes du JSX sont maison. Mais les
trois feuilles de l'app ne déclarent aucun style d'élément à part `html` et
`body` — sans preflight, tous les titres reprennent les marges du navigateur et
les boutons la police système. Le retirer casserait chaque écran.

On n'écrit donc pas `class="flex gap-2"` à côté d'une classe BEM. Le jour où on
adopte les utilitaires, ce sera une migration décidée.

---

## Trois feuilles

`src/main.tsx` les charge dans cet ordre, et cet ordre fait loi :

| #   | Feuille               | Rôle                                                      |
| --- | --------------------- | --------------------------------------------------------- |
| 1   | `styles.css`          | **Tokens**, mise en page, composants de base              |
| 2   | `enhanced-styles.css` | Animation, décor, règles d'accessibilité globales         |
| 3   | `enhanced-ui.css`     | Habillage des composants d'écran ; **gagne les conflits** |

**35 sélecteurs sont déclarés dans deux de ces feuilles à la fois.** À
spécificité égale, la dernière chargée l'emporte — mais seulement pour les
propriétés qu'elle redéclare. C'est exactement ce qui rendait le chiffre
sélectionné du sélecteur d'intensité blanc sur fond presque blanc :
`enhanced-ui.css` reprenait le fond, `styles.css` gardait le `color: #fff`.

**Avant de redéclarer un sélecteur existant**, regarder ce que l'autre
déclaration laisse passer. Mieux : corriger là où il est déjà défini.

**Pourquoi les trois ne sont pas fondues.** 5 300 lignes à fusionner produiraient
un diff illisible pour un gain invisible à l'écran. Le vrai déclencheur serait
une refonte visuelle ; d'ici là, l'ordre documenté suffit. Les quatre conflits
de couleur qui restent (`.timer-pulse`, `.rest-timer-value`, `.stat-card`,
`.btn-clear-note`) ont été vérifiés : dans les quatre cas la feuille gagnante
pose une valeur de token valide, sans piège de contraste.

---

## Tokens

### Ce qui est tokenisé

**Les couleurs, entièrement.** Deux blocs dans `styles.css` — `:root,
html[data-theme='light']` et `html[data-theme='dark']` — sont la seule
définition. Les deux autres feuilles n'ont pas le droit d'écrire un hex.

| Famille             | Tokens                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Surfaces et texte   | `--bg` `--surface` `--surface-input` `--surface-highlight` `--text` `--muted` `--border` |
| Action              | `--primary` `--primary-hover` `--primary-light` `--primary-deep` `--primary-contrast`    |
| Danger              | `--danger` `--danger-hover` `--danger-contrast`                                          |
| Canaux RGB          | `--accent-rgb` `--ink-rgb` `--depth-rgb` `--danger-rgb`                                  |
| Statuts             | `--warn-*` `--info-*` `--badge-*`                                                        |
| Accents de pastille | `--accent-cyan` `--accent-violet` `--accent-orange` `--accent-red` `--accent-green`      |
| Intensité           | `--intensity-1-bg` … `--intensity-5-bg`, `--intensity-ink`                               |
| Fonds composés      | `--body-bg` `--drawer-bg` `--sticky-bar-bg` `--chrome-*` …                               |
| Forme               | `--chrome-radius`, `--shadow`, `--chrome-shadow`                                         |
| Typographie         | `--font-brand`                                                                           |

### Ce qui ne l'est pas

| Catégorie   | État                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| Espacement  | **Aucun token.** 394 déclarations, 56 valeurs distinctes, mélange rem/px/em |
| Typographie | **Aucune échelle.** 163 déclarations `font-size`, 41 valeurs distinctes     |
| Rayons      | `--chrome-radius` seul, utilisé 3 fois sur 89 déclarations                  |
| Mouvement   | **Aucun token.** 8 durées, 9 fonctions d'assouplissement                    |

Le preset du socle fournit déjà `--text-fluid-xs` … `--text-fluid-2xl` et
`--spacing-fluid-sm/md/lg`. C'est la base toute prête le jour où on s'y met.
Ce n'est pas fait : 557 déclarations à migrer, sans filet visuel automatique.

---

## Les couleurs à ne pas toucher sans mesurer

`src/designTokens.test.ts` calcule les ratios WCAG à partir des feuilles de
style et échoue sous 4,5:1. **Il lit les fichiers réels** : il n'y a pas de
copie de valeurs à tenir à jour.

Ce qu'il couvre :

- les cinq fonds d'intensité contre `--intensity-ink` ;
- `--primary-contrast` sur `--primary` et `--danger-contrast` sur `--danger`,
  dans les deux thèmes ;
- les cinq teintes d'accent sur leur propre fond, dans les deux thèmes ;
- le plafond de densité des fonds de pastille (12 %), dans les trois feuilles.

### L'échelle d'intensité

`--intensity-1-bg` … `--intensity-5-bg` sont **hors des blocs de thème**, à
dessein : vert = léger, rouge = très fort est une convention, pas une teinte
d'interface. Le fond ne bascule donc pas en sombre, et l'encre
(`--intensity-ink`) doit rester sombre dans les deux thèmes.

Les cinq couleurs ont vécu recopiées à cinq endroits ; le correctif de
contraste du niveau 3 n'en avait atteint que deux. Aujourd'hui :

- `styles.css` les définit et fournit **le seul** mappage niveau → couleur, par
  `[data-intensity='N']` ;
- `src/utils/intensity.ts` pointe dessus (`var(--intensity-3-bg)`), sans hex ;
- les trois composants qui affichent une pastille posent `data-intensity` ;
  leur classe ne porte plus que la forme.

**Pour ajouter ou changer un niveau :** modifier le bloc de `styles.css`, puis
`npm run test`.

### Les accents de pastille

Les notes rapides, l'indicateur de tendance et les badges de maturité ne posent
que leur **teinte** ; fond et bordure se dérivent par `color-mix(in srgb,
currentColor N%, transparent)`. Une seule valeur à tenir par thème, et le fond
ne peut plus diverger de son texte.

**Plafond : 12 %.** Plus le fond est teinté, plus il se rapproche du texte et
plus le contraste baisse. À 14 %, le cyan tombait à 4,4:1. Le test refuse tout
`background` au-dessus de ce plafond, dans les trois feuilles.

---

## Composants

Nommage BEM-ish : `bloc__élément`, `bloc--variante`. Pas de préfixe.

### Boutons

Base `.btn`, à combiner avec une variante.

| Variante                         | Usage                                          |
| -------------------------------- | ---------------------------------------------- |
| `.btn-primary`                   | Action principale de l'écran                   |
| `.btn-danger`                    | Suppression, arrêt                             |
| `.btn-secondary`                 | Action de soutien                              |
| `.btn-ghost`                     | Action discrète en ligne ; annule `min-height` |
| `.btn-cta` / `.btn-cta-enhanced` | Le grand bouton de l'accueil                   |
| `.btn-small` / `.btn-tiny`       | Tailles réduites                               |
| `.btn-theme`                     | Bascule de thème                               |

| État                     | Traitement                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| `:hover`                 | Par variante                                                             |
| `:active`                | `scale(0.98)`                                                            |
| `:focus-visible`         | Anneau de 3 px, `outline-offset: 4px`                                    |
| `:disabled`              | `opacity: 0.45`, `cursor: not-allowed`, `pointer-events: none`           |
| `[aria-disabled='true']` | Idem, **mais reste focusable** — le lecteur d'écran doit l'annoncer      |
| `[aria-busy='true']`     | `cursor: progress`, rien de grisé : l'action est en cours, pas interdite |

### L'anneau de focus

**Une seule règle**, dans `enhanced-ui.css` : `*:focus-visible`, 3 px,
`outline-offset: 3px`. Il y en a eu trois — une jumelle de 2 px dans
`enhanced-styles.css` et celle du preset du socle. Les deux ne s'appliquaient
jamais : la jumelle perdait sur l'ordre d'import, celle du socle parce qu'elle
est dans `@layer base`, que toute règle non calquée l'emporte.

### Cible tactile

44 px minimum sous `@media (pointer: coarse)` — pas sous une largeur de
viewport. La règle vivait sous `max-width: 768px` : une tablette en paysage ou
un portable tactile n'était pas couvert, alors que le doigt ne rétrécit pas
quand la fenêtre s'élargit. `.btn-ghost` en est exclu.

Elle vise `.btn`, `button`, `a.btn` et `a.bottom-nav-item`. Un contrôle bâti
sur un autre élément — `label.btn-intensity`, par exemple — doit porter sa
taille lui-même.

**Le sélecteur est enveloppé dans `:where()`, et ce n'est pas cosmétique.**
44 px est un **plancher**, pas une taille. Sans `:where()`, la règle pèse plus
lourd qu'une classe de composant et devient un plafond : elle ramenait le
grand bouton de l'accueil de 88 px à 44 px sur tout écran tactile. À
spécificité nulle, elle habille ce qui ne demande rien et s'efface devant tout
composant qui veut plus grand.

### Mouvement

Huit blocs `prefers-reduced-motion` couvrent le tiroir, le chronomètre, les
badges de seuil et le mode focus. C'est la partie la mieux tenue du système :
**toute animation nouvelle doit y être ajoutée.**

---

## Ce que l'audit a laissé de côté

Connu, non corrigé, par ordre de valeur :

1. **557 déclarations d'espacement et de taille de police** à faire passer sur
   une échelle. Le plus gros gain de cohérence restant.
2. **86 déclarations `border-radius`** hors token, 21 valeurs distinctes.
3. **Les trois feuilles** à fondre en une.
4. **15 `style={{…}}` inline** dans le JSX portant des valeurs de mise en page.
5. **6 composants sur 22** exposent un type `*Props` explicite.
