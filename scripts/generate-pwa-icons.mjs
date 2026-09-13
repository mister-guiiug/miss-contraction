/**
 * Génère les PNG PWA à partir de `public/icon.svg`.
 * Exécuter : npm run icons
 *
 * LA SOURCE EST REDEVENUE VECTORIELLE, ET IL N'Y EN A PLUS QU'UNE. Ce script
 * partait d'une illustration matricielle de 1,6 Mo rangée dans `docs/assets/`,
 * pendant que `vite.config.ts` désignait `public/icon.svg` pour l'og:image :
 * deux images sans rapport l'une avec l'autre servaient la même identité, et
 * rien ne le signalait. L'illustration a été retirée avec ce changement ;
 * elle reste dans l'historique git si quelqu'un la cherche.
 *
 * Tout ce que l'ancien script reconstruisait — rognage, extraction du centre,
 * flou pour remplir la toile du `maskable` — n'existait que pour rattraper une
 * source matricielle à fond transparent. Un SVG n'a besoin d'aucun de ces
 * détours : on l'aplatit sur la couleur de la tuile, et le fond est plein par
 * construction.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(racine, 'public', 'icon.svg');
const sortie = join(racine, 'public', 'icons');

/** La couleur de la tuile, celle du `rect` de `icon.svg`. */
const TUILE = { r: 0x3d, g: 0x24, b: 0x38, alpha: 1 };

/**
 * Le SVG est rasterisé à 2048 avant d'être réduit : rendre directement à 180
 * laisse des bords durs sur les arcs, réduire depuis quatre fois la taille
 * donne un lissage propre.
 */
const rendre = (taille, { aplati = false } = {}) => {
  const image = sharp(source, { density: 288 });
  return (aplati ? image.flatten({ background: TUILE }) : image)
    .resize(taille, taille)
    .png();
};

await mkdir(sortie, { recursive: true });

// `purpose: any` — le navigateur montre l'image telle quelle, coins arrondis
// compris : on garde donc la transparence autour de la tuile.
await rendre(192).toFile(join(sortie, 'icon-192.png'));
await rendre(512).toFile(join(sortie, 'icon-512.png'));

// iOS pose SON masque par-dessus. Une tuile déjà arrondie y serait arrondie
// deux fois, et les coins transparents viraient au noir : on aplatit.
await rendre(180, { aplati: true }).toFile(
  join(sortie, 'apple-touch-icon.png')
);

// Android rogne à sa guise dans les 20 % de bord. La toile doit donc être
// pleine, et le motif tenir dans le disque central — c'est la contrainte que
// `icon.svg` documente sur le rayon de son disque.
await rendre(512, { aplati: true }).toFile(join(sortie, 'icon-maskable.png'));

console.log(
  'Icônes écrites dans public/icons/ (192, 512, apple-touch 180, maskable 512).'
);
