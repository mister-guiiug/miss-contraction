/**
 * Corrige les apostrophes ASCII (U+0027) à l'intérieur de strings single-quoted
 * dans les tests Playwright. Stratégie : convertir la string entière en
 * double-quoted en remplaçant les apostrophes par U+2019 (typographique).
 *
 * Pattern : 'mot mot d'autremot ...' → "mot mot d'autremot ..."
 *
 * Exécution unique : `node scripts/fix-e2e-apostrophes.mjs`
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const E2E_DIR = 'e2e';

function fixLine(line) {
  // Cherche des single-quoted strings problématiques.
  // Idée : on tokenize basique et on transforme les strings dont la fermeture
  // n'est pas correcte (un alpha suit la première apostrophe interne).
  const result = [];
  let i = 0;
  let changed = false;
  while (i < line.length) {
    const ch = line[i];
    if (ch === "'") {
      // Lire jusqu'à la prochaine quote, en s'arrêtant sur \\ ou newline
      let j = i + 1;
      let segments = [''];
      while (j < line.length) {
        if (line[j] === '\\') {
          segments[segments.length - 1] += line[j] + (line[j + 1] ?? '');
          j += 2;
          continue;
        }
        if (line[j] === "'") {
          // Vérifier si c'est une apostrophe interne (suivie d'une lettre)
          const next = line[j + 1];
          if (next && /[a-zA-Zàâäéèêëïîôöùûüçœæ]/.test(next)) {
            segments.push('');
            j++;
            continue;
          }
          break;
        }
        segments[segments.length - 1] += line[j];
        j++;
      }
      if (j >= line.length) {
        // Pas de fermeture → on ne touche pas
        result.push(line.slice(i));
        break;
      }
      if (segments.length > 1) {
        // String avec apostrophes internes → convertir en double-quoted
        const merged = segments.join('’');
        // Si la string contient des " littérales, on les escape
        const escaped = merged.replace(/"/g, '\\"');
        result.push('"' + escaped + '"');
        changed = true;
      } else {
        // String single-quoted normale → laisser
        result.push(line.slice(i, j + 1));
      }
      i = j + 1;
    } else {
      result.push(ch);
      i++;
    }
  }
  return { line: result.join(''), changed };
}

const files = readdirSync(E2E_DIR).filter(f => f.endsWith('.spec.ts'));
let totalChanged = 0;
for (const file of files) {
  const path = join(E2E_DIR, file);
  const content = readFileSync(path, 'utf8');
  const lines = content.split(/\r?\n/);
  let fileChanged = 0;
  for (let i = 0; i < lines.length; i++) {
    const { line, changed } = fixLine(lines[i]);
    if (changed) {
      lines[i] = line;
      fileChanged++;
    }
  }
  if (fileChanged > 0) {
    writeFileSync(path, lines.join('\n'));
    console.log(`Fixed ${fileChanged} line(s) in ${file}`);
    totalChanged += fileChanged;
  }
}
console.log(
  `\nTotal: ${totalChanged} lines fixed across ${files.length} files.`
);
