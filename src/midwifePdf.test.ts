import { describe, expect, it } from 'vitest';
import {
  buildMidwifePdfLines,
  midwifePdfFilename,
  renderMidwifePdf,
  toPdfText,
} from './midwifePdf';
import {
  buildMidwifeSummaryLines,
  buildMidwifeSummaryText,
  type MidwifeSummaryInput,
} from './midwifeSummary';
import type { ContractionRecord } from './storage';

const MIN = 60000;
const T0 = Date.UTC(2026, 7, 29, 10, 0, 0);

function rec(
  i: number,
  startMin: number,
  durSec: number,
  extra: Partial<ContractionRecord> = {}
): ContractionRecord {
  const start = T0 + startMin * MIN;
  return { id: `r${i}`, start, end: start + durSec * 1000, ...extra };
}

/** 3 contractions de 60 s, débuts espacés de 5 min → 12/h, moyennes 01:00 / 05:00. */
const baseInput: MidwifeSummaryInput = {
  selectedRecords: [
    rec(1, 0, 60),
    rec(2, 5, 60, { intensity: 4 }),
    rec(3, 10, 60, { note: 'plus intense → repos 💧' }),
  ],
  settings: { consecutiveCount: 3, maxIntervalMin: 5, minDurationSec: 45 },
  mode: '12',
  firstThresholdEndMs: T0 + 11 * MIN,
  generatedAtMs: T0 + 30 * MIN,
};

describe('buildMidwifePdfLines', () => {
  it('mêmes données → mêmes lignes que le résumé texte, transcrites', () => {
    const summaryLines = buildMidwifeSummaryLines(baseInput);
    const pdfLines = buildMidwifePdfLines(baseInput);

    expect(pdfLines).toHaveLength(summaryLines.length);
    expect(pdfLines).toEqual(summaryLines.map(toPdfText));
    // Le texte du presse-papiers est bien la jointure de ces mêmes lignes.
    expect(buildMidwifeSummaryText(baseInput)).toBe(summaryLines.join('\n'));
  });

  it('reste dans la plage Latin-1 du générateur (aucun « ? » induit)', () => {
    for (const line of buildMidwifePdfLines(baseInput)) {
      for (const ch of line) {
        expect(ch.codePointAt(0) ?? 0).toBeLessThanOrEqual(0xff);
      }
      expect(line).not.toContain('?');
    }
  });

  it('transcrit les caractères typographiques du résumé réel', () => {
    const pdfLines = buildMidwifePdfLines(baseInput);

    expect(pdfLines[0]).toBe('Miss Contraction - Résumé pour la sage-femme');
    expect(pdfLines[4]).toBe(
      '- 3 contractions consécutives, écart entre débuts <= 5 min, durée >= 45 s chacune.'
    );
    expect(pdfLines).toContain(
      '- Quantité estimée : ~ 12 contraction(s) / h (si le rythme restait constant).'
    );
    expect(pdfLines).toContain('- Durée moyenne : 01:00 (mm:ss).');
    expect(pdfLines).toContain(
      '- Intervalle moyen entre débuts : 05:00 (mm:ss).'
    );

    const detail1 = pdfLines.find(l => l.startsWith('1. '));
    expect(detail1).toMatch(
      /^1\. .+ - durée 1:00 - écart depuis précédente : -$/
    );
    const detail2 = pdfLines.find(l => l.startsWith('2. '));
    expect(detail2).toContain(' - intensité : 4');
    const detail3 = pdfLines.find(l => l.startsWith('3. '));
    expect(detail3).toContain('- note : plus intense -> repos');
    expect(detail3).not.toContain('💧');
  });

  it('couvre aussi la sélection vide et l’absence de premier seuil', () => {
    const lines = buildMidwifePdfLines({
      ...baseInput,
      selectedRecords: [],
      firstThresholdEndMs: null,
      mode: 'all',
    });

    expect(lines).toContain(
      "Aucun groupe de contractions consécutives n'a encore rempli ces critères dans l'historique enregistré."
    );
    expect(lines).toContain('Aucune contraction dans cette sélection.');
    expect(lines.at(-1)).toBe(
      'Données indicatives - ne remplacent pas un avis médical.'
    );
  });
});

describe('toPdfText', () => {
  it('remplace en amont ce qui deviendrait « ? » en WinAnsi', () => {
    expect(toPdfText('— – ≤ ≥ ≈ → … •')).toBe('- - <= >= ~ -> ... -');
    expect(toPdfText('l’œuf du cœur — « ça va »')).toBe(
      "l'oeuf du coeur - « ça va »"
    );
  });

  it('conserve tel quel le français Latin-1 (accents, « », NBSP WinAnsi)', () => {
    expect(toPdfText('Généré le samedi 29 août à 12:00')).toBe(
      'Généré le samedi 29 août à 12:00'
    );
    expect(toPdfText('12\u202f:\u00a005')).toBe('12 : 05');
  });

  it('omet les caractères sans équivalent (émojis) plutôt que « ? »', () => {
    expect(toPdfText('ça pousse 😀!')).toBe('ça pousse !');
    expect(toPdfText('👶')).toBe('');
  });
});

describe('renderMidwifePdf', () => {
  it('produit un binaire PDF une page pour un résumé court', () => {
    const bytes = renderMidwifePdf(baseInput);
    const text = new TextDecoder('latin1').decode(bytes);

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/Count 1');
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('pagine un long historique sur plusieurs pages A4', () => {
    const many = Array.from({ length: 120 }, (_, i) =>
      rec(i + 1, i * 5, 60, { note: `contraction n° ${i + 1}` })
    );
    const bytes = renderMidwifePdf({
      ...baseInput,
      selectedRecords: many,
      mode: 'all',
    });
    const text = new TextDecoder('latin1').decode(bytes);

    expect(text).toMatch(/\/Count [2-9]/);
  });
});

describe('midwifePdfFilename', () => {
  it('nomme le fichier contractions-AAAA-MM-JJ.pdf', () => {
    expect(midwifePdfFilename(new Date(2026, 7, 30))).toBe(
      'contractions-2026-08-30.pdf'
    );
    expect(midwifePdfFilename()).toMatch(
      /^contractions-\d{4}-\d{2}-\d{2}\.pdf$/
    );
  });
});
