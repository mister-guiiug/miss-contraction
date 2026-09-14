/**
 * Rend les deux images sans coin transparent : le maskable Android (512) et
 * l'icône d'accueil iOS (180), depuis `public/icon-maskable.svg`.
 *
 * POURQUOI UN SVG À PART. L'ancien script fabriquait ces deux images en
 * APLATISSANT `icon.svg` sur `#3d2438`, la couleur de sa tuile. Le résultat
 * était juste — la tuile est un aplat, l'aplatissement lui rend exactement sa
 * teinte — mais la couleur était alors écrite DEUX FOIS : dans le `rect` du SVG
 * et dans une constante du script. Qui changeait l'une ne savait rien de
 * l'autre, et le raccord serait revenu sans bruit. Une source à fond perdu n'a
 * aucun coin à combler, donc aucune couleur à répéter.
 *
 * POURQUOI L'ICÔNE APPLE EST ICI, ET PLUS DANS `npm run icons`. iOS n'accepte
 * pas la transparence pour l'icône d'accueil : il comble lui-même ce qui en
 * porte, historiquement par du noir. Le générateur du socle écrit
 * `apple-touch-icon.png` PAR DÉFAUT et l'aplatirait sur son `--bg`, un bleu
 * nuit `12,18,34` qui n'appartient pas à ce dépôt. D'où `--no-apple`.
 *
 * Aucune réduction ici : le disque de `icon-maskable.svg` fait 168 de rayon
 * pour une zone sûre à 204,8. L'icône Apple en sort donc à taille pleine.
 *
 * Exécuter : npm run icons:maskable
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Le SVG est rasterisé à 288 ppp avant d'être réduit : rendre directement à
 * 180 laisse des bords durs sur les arcs, réduire depuis quatre fois la taille
 * donne un lissage propre. C'est le réglage que portait l'ancien script.
 */
const rend = (taille, nom) =>
  sharp(join(racine, 'public', 'icon-maskable.svg'), { density: 288 })
    .resize(taille, taille)
    .png()
    .toFile(join(racine, 'public', 'icons', nom));

await rend(512, 'icon-maskable.png');
await rend(180, 'apple-touch-icon.png');

console.log(
  'public/icons/icon-maskable.png (512×512) et public/icons/apple-touch-icon.png (180×180) écrits, à fond perdu.'
);
