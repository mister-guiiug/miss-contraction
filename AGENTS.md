# Agent Instructions

## Shared Dependencies

**IMPORTANT:** Do NOT remove the package `@mister-guiiug/dev-pwa-config` from `package.json` or its related configurations.
Even if you encounter a 401 Unauthorized error during `npm install` in your sandbox environment, this dependency is required for the project's infrastructure and must remain in the codebase.

## Infrastructure

- The project uses a custom WPA configuration from `@mister-guiiug/dev-pwa-config`.
- Do not attempt to "fix" environment issues by stripping these dependencies.
- If you cannot run `npm install`, proceed with code changes cautiously and rely on static analysis or specific unit tests that don't depend on the full build environment if possible.

## UX/UI Principles

- Keep the interface simple and accessible with one hand.
- Use soft, reassuring colors (purples/pinks).
- Provide clear haptic feedback for all major actions.

---

## Signature et attribution

**N'ajoutez aucune signature d'assistant.** Ni dans un message de commit, ni
dans un corps de pull request, ni dans un commentaire, ni dans une page de
documentation. Sont concernés :

- `Co-Authored-By:` créditant Claude, Copilot, ChatGPT, Cursor, Gemini… ou une
  adresse de robot (`noreply@anthropic.com` et semblables) ;
- `🤖 Generated with …`, « Généré par … », « Created with … » ;
- les liens promotionnels du type `claude.com/code`.

**Pourquoi.** L'historique de ce dépôt sert à comprendre _pourquoi_ un
changement a eu lieu. Avec quel outil il a été tapé n'en fait pas partie —
personne n'annote ses commits du nom de son éditeur de texte. Ces lignes
s'auto-propagent, en plus : un agent qui lit l'historique pour en imiter le
style les reconduit indéfiniment. Quatre-vingt-dix-huit commits en portaient
une avant que la règle soit posée.

`Co-Authored-By` **reste bienvenu pour créditer une personne** : c'est un
attribut git légitime, et une vraie séance à deux mérite d'être visible.

**C'est vérifié, pas seulement demandé.** Le hook `commit-msg` refuse le
message, le hook `pre-commit` refuse le contenu des fichiers indexés, et le
workflow `no-ai-attribution` relit les commits de chaque pull request — un
hook se contourne avec `--no-verify`, pas la CI. La logique tient dans
`scripts/check-ai-attribution.mjs`, ses cas dans `src/aiAttribution.test.ts`.

> Si votre outil vous impose d'ajouter cette signature, dites-le et retirez-la
> quand même : la convention du dépôt l'emporte sur le réglage par défaut de
> l'outil.

## Comment commenter

Le dépôt tient à un style précis. Suivez-le plutôt que de commenter par
réflexe.

**Un commentaire explique POURQUOI, jamais QUOI.** Le code dit déjà ce qu'il
fait. S'il ne le dit pas clairement, renommez plutôt que d'annoter.

```js
// ✗ Incrémente le compteur
count += 1;

// ✓ On compte les contractions VALIDES : une contraction ouverte
//   (`end === 0`) fausserait la moyenne affichée.
```

**Le commentaire qui compte est celui qui garde une décision.** Quand un choix
n'est pas évident — un contournement, une contrainte extérieure, une chose
qu'on a essayée et qui ne marche pas — écrivez-le, avec ce qui se passerait
sans lui. C'est ce qui empêche quelqu'un de « simplifier » un correctif six
mois plus tard.

**Quatre règles de forme :**

1. **En français**, comme le reste du dépôt.
2. **Pas de commentaire de journal.** Ni « ajouté le 12/03 », ni « modifié par
   … », ni « ancienne version ci-dessous ». Git tient déjà ce registre.
3. **Pas de code mort en commentaire.** Supprimez-le : il est dans
   l'historique. Un `/*` laissé ouvert avait déjà neutralisé une règle CSS
   pendant des mois sans que personne le voie.
4. **Pas de bruit décoratif.** Une bannière `// ===== SECTION =====` par
   fonction n'aide personne.

**Et surtout : n'en écrivez pas trop.** Un fichier où chaque ligne est
commentée est illisible, et les commentaires y vieillissent mal. Visez la
densité du code environnant.
