/**
 * La clé `localStorage` du thème.
 *
 * ISOLÉE PARCE QUE DEUX MONDES LA LISENT : le script anti-FOUC engendré au
 * build (`vite.config.ts`, contexte Node) et le hook `useTheme` au runtime
 * (`src/theme.ts`, contexte React). Le socle est explicite là-dessus — les
 * deux doivent partager la même clé, « sans quoi les deux divergent et le
 * flash revient par la bande ». Un seul export les empêche de dériver.
 *
 * ELLE NE BOUGE PAS, ET C'EST DÉLIBÉRÉ. Le socle propose `dwc_theme`, partagée
 * par toute la famille : les apps servent d'une même origine sur GitHub Pages,
 * donc le thème choisi dans l'une suivrait l'utilisatrice dans les autres.
 * `useTheme` lit `storageKey` AVANT `legacyKeys` — prendre la clé du socle
 * ferait donc gagner à miss-contraction le thème réglé ailleurs, et changerait
 * l'apparence de l'écran au premier chargement suivant le déploiement. Sur une
 * app qu'on ouvre pendant un accouchement, un écran qui change de couleur sans
 * qu'on l'ait demandé n'a aucune contrepartie.
 *
 * À SIGNALER AU SOCLE : sa liste des six clés de la famille mentionne
 * `'mc-theme'` (tiret). La clé réelle de cette app est `'mc_theme'`
 * (souligné) — une migration qui se fierait à cette liste perdrait la
 * préférence de toutes les utilisatrices.
 */
export const LS_THEME = 'mc_theme';
