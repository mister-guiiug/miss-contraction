/**
 * Pose des variables d'environnement puis lance une commande.
 *
 * `cross-env` faisait ça, et son dépôt est archivé. npm, sous Windows, lance
 * les scripts dans cmd.exe, qui refuse la syntaxe POSIX `VAR=valeur commande`.
 * Ce fichier reprend le geste sans dépendance : les affectations précèdent
 * `--`, le reste est la commande, les arguments ajoutés par `npm run --` sont
 * transmis.
 *
 * Usage : node scripts/with-env.mjs VAR=valeur -- commande [args]
 */
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const dash = argv.indexOf('--');
if (dash < 1 || dash === argv.length - 1) {
  process.stderr.write(
    'usage: node scripts/with-env.mjs VAR=valeur ... -- commande [args]\n'
  );
  process.exit(1);
}

const env = { ...process.env };
for (const assignment of argv.slice(0, dash)) {
  const eq = assignment.indexOf('=');
  if (eq <= 0) {
    process.stderr.write(`affectation invalide : ${assignment}\n`);
    process.exit(1);
  }
  env[assignment.slice(0, eq)] = assignment.slice(eq + 1);
}

const command = argv.slice(dash + 1);
// Les commandes du parc sont des jetons (`npm`, `vite`, `--port`, `4173`).
// Un espace ou un métacaractère de shell serait interprété : on refuse plutôt
// que de quoter, le jour où une valeur en porterait.
if (command.some(part => /[\s"'$&|<>^%!]/.test(part))) {
  process.stderr.write('argument refusé : métacaractère de shell\n');
  process.exit(1);
}
// Une seule chaîne, pas un tableau d'arguments : sous Windows `npm` et `vite`
// sont des `.cmd` (EINVAL sans shell), et passer des arguments à côté de
// `shell: true` déclenche DEP0190.
const child = spawn(command.join(' '), {
  stdio: 'inherit',
  env,
  shell: true,
  windowsHide: true,
});

child.on('error', error => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
