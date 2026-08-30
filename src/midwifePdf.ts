/**
 * Export PDF du résumé sage-femme — générateur zéro-dépendance du socle.
 *
 * Le générateur (`@mister-guiiug/dev-wpa-config/pdf`) encode le texte en
 * WinAnsi et remplace tout caractère au-delà de Latin-1 par « ? ». Le résumé
 * contient justement des caractères typographiques hors Latin-1 (— ≤ ≥ ≈) et
 * les notes libres peuvent en apporter d'autres (’ … → émojis) : `toPdfText`
 * les transcrit EN AMONT vers un équivalent Latin-1 lisible, et omet ce qui
 * n'a pas d'équivalent, plutôt que de laisser apparaître des « ? ».
 */

import { dateSlug } from '@mister-guiiug/dev-wpa-config/download';
import {
  PAGE,
  PdfContent,
  buildPdf,
  downloadPdf,
  textWidth,
} from '@mister-guiiug/dev-wpa-config/pdf';
import {
  buildMidwifeSummaryLines,
  type MidwifeSummaryInput,
} from './midwifeSummary';

/** Transcriptions Latin-1 des caractères hors WinAnsi présents ou probables. */
const PDF_CHAR_MAP: Readonly<Record<string, string>> = {
  '—': '-', // tiret cadratin (titre, puces, valeurs absentes)
  '–': '-', // tiret demi-cadratin
  '≤': '<=', // seuil d'écart entre débuts
  '≥': '>=', // seuil de durée
  '≈': '~', // quantité estimée par heure
  '→': '->',
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '…': '...',
  '•': '-',
  œ: 'oe',
  Œ: 'OE',
  '€': 'EUR',
  '™': 'TM',
  ' ': ' ', // espace fine insécable (formats Intl)
  ' ': ' ', // espace fine
  ' ': ' ', // espace insécable
};

/**
 * Rend une ligne sûre pour l'encodage WinAnsi du générateur : caractères
 * Latin-1 conservés, caractères connus transcrits, le reste (émojis…) omis.
 */
export function toPdfText(text: string): string {
  let out = '';
  for (const ch of text) {
    const mapped = PDF_CHAR_MAP[ch];
    if (mapped != null) {
      out += mapped;
      continue;
    }
    if ((ch.codePointAt(0) ?? 0) <= 0xff) out += ch;
  }
  return out;
}

/**
 * Les lignes du PDF : exactement celles du résumé texte, transcrites.
 * C'est LA fonction pure testée « mêmes données → mêmes lignes ».
 */
export function buildMidwifePdfLines(input: MidwifeSummaryInput): string[] {
  return buildMidwifeSummaryLines(input).map(toPdfText);
}

const MARGIN_X = 48;
const MARGIN_TOP = 64;
const MARGIN_BOTTOM = 52;
const TITLE_SIZE = 14;
const META_SIZE = 9;
const BODY_SIZE = 10;
const LEADING = 14;

/** Coupe une ligne trop large en morceaux tenant dans `maxWidth` points. */
function wrapPdfLine(text: string, size: number, maxWidth: number): string[] {
  if (textWidth(text, size) <= maxWidth) return [text];
  const out: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const candidate = current === '' ? word : `${current} ${word}`;
    if (current !== '' && textWidth(candidate, size) > maxWidth) {
      out.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current !== '') out.push(current);
  return out;
}

/**
 * Met en page le résumé — titre, date de génération, lignes du résumé (les
 * en-têtes de section en gras) — sur autant de pages A4 que nécessaire.
 */
export function renderMidwifePdf(input: MidwifeSummaryInput): Uint8Array {
  const [title = '', meta = '', ...body] = buildMidwifePdfLines(input);
  const maxWidth = PAGE.w - MARGIN_X * 2;

  const pages: PdfContent[] = [];
  let page = new PdfContent();
  pages.push(page);
  let y = MARGIN_TOP;

  page.text(MARGIN_X, y, TITLE_SIZE, title, { bold: true });
  y += 16;
  page.text(MARGIN_X, y, META_SIZE, meta, { color: [0.4, 0.4, 0.4] });
  y += 8;
  page.line(MARGIN_X, y, PAGE.w - MARGIN_X, y, 0.8, 0.75);
  y += 20;

  for (const line of body) {
    if (line === '') {
      y += LEADING / 2;
      continue;
    }
    // Règle sobre : les lignes se terminant par « : » sont les têtes de section.
    const bold = line.endsWith(':');
    for (const chunk of wrapPdfLine(line, BODY_SIZE, maxWidth)) {
      if (y > PAGE.h - MARGIN_BOTTOM) {
        page = new PdfContent();
        pages.push(page);
        y = MARGIN_TOP;
      }
      page.text(MARGIN_X, y, BODY_SIZE, chunk, { bold });
      y += LEADING;
    }
  }

  return buildPdf(pages);
}

/** Nom du fichier téléchargé, daté du jour : `contractions-AAAA-MM-JJ.pdf`. */
export function midwifePdfFilename(date?: Date | number): string {
  return `contractions-${dateSlug(date)}.pdf`;
}

/** Génère puis télécharge le PDF ; `false` si aucun DOM n'est disponible. */
export function downloadMidwifePdf(input: MidwifeSummaryInput): boolean {
  return downloadPdf(renderMidwifePdf(input), midwifePdfFilename());
}
