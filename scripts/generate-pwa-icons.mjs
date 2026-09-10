/**
 * Génère les PNG PWA à partir de docs/assets/Designer.png
 * Exécuter : npm run icons
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
// Le fichier a déménagé dans docs/assets/ sans que ce chemin suive : le
// script échouait sur « Input file is missing ». Personne ne s'en apercevait,
// puisque les PNG produits sont versionnés et qu'on ne les régénère jamais.
const input = join(root, 'docs', 'assets', 'Designer.png');
const outDir = join(root, 'public', 'icons');

await mkdir(outDir, { recursive: true });

const sizes = [
  { w: 192, h: 192, name: 'icon-192.png' },
  { w: 512, h: 512, name: 'icon-512.png' },
  { w: 180, h: 180, name: 'apple-touch-icon.png' },
];

for (const { w, h, name } of sizes) {
  await sharp(input)
    .resize(w, h, { fit: 'cover', position: 'center' })
    .png()
    .toFile(join(outDir, name));
}

/**
 * LE MASKABLE EST UNE AUTRE IMAGE, PAS LA MÊME.
 *
 * Le manifeste déclarait DEUX FOIS icon-512.png, une fois en `any`, une fois
 * en `maskable`. C'est la même image pour deux usages qui n'ont pas les mêmes
 * règles : le navigateur la montre telle quelle, Android la rogne à son
 * masque. Or cette image est une TUILE ARRONDIE sur fond blanc — le masque lui
 * coupait les coins, et le blanc formait un liseré autour du rose.
 *
 * Ici la toile est remplie EN ENTIER, et par l'illustration elle-même : un
 * carré pris au centre de la tuile, agrandi et fondu. Il n'y a pas de blanc
 * dedans, et ses couleurs sont, à la place près, celles de la tuile posée
 * par-dessus — le raccord n'a donc rien à cacher.
 *
 * La tuile occupe 88 % de la toile : ses coins arrondis se fondent dans le
 * fond, et l'illustration tient dans la zone de sécurité, le disque de 80 %.
 */
const rogne = await sharp(input).trim().png().toBuffer();
const { width: largeurTuile } = await sharp(rogne).metadata();
const cote = Math.round(largeurTuile * 0.5);
const fond = await sharp(rogne)
  .extract({
    left: Math.round(largeurTuile * 0.25),
    top: Math.round(largeurTuile * 0.25),
    width: cote,
    height: cote,
  })
  .resize(512, 512, { fit: 'cover' })
  .blur(34)
  .png()
  .toBuffer();
const tuile = await sharp(rogne)
  .resize(448, 448, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();
await sharp(fond)
  .composite([{ input: tuile, top: 32, left: 32 }])
  .png()
  .toFile(join(outDir, 'icon-maskable.png'));

console.log(
  'Icônes écrites dans public/icons/ (192, 512, apple-touch 180, maskable 512).'
);
