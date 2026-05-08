#!/usr/bin/env node

import { writeFile, readFile } from 'node:fs/promises';

const TEMPLATE_URL =
  'https://raw.githubusercontent.com/mister-guiiug/dev-wpa-config/main/templates/vscode/tasks.json';
const TARGET_FILE = '.vscode/tasks.json';

function normalizeEol(value) {
  return value.replace(/\r\n/g, '\n');
}

async function fetchTemplate() {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download template (${response.status} ${response.statusText})`
    );
  }

  const content = await response.text();
  return content.endsWith('\n') ? content : `${content}\n`;
}

async function run() {
  const checkMode = process.argv.includes('--check');
  const template = normalizeEol(await fetchTemplate());

  if (checkMode) {
    const current = normalizeEol(await readFile(TARGET_FILE, 'utf8'));
    if (current === template) {
      console.log(
        'OK: .vscode/tasks.json is synchronized with dev-wpa-config.'
      );
      return;
    }

    console.error(
      'OUTDATED: .vscode/tasks.json differs from dev-wpa-config template.'
    );
    process.exitCode = 1;
    return;
  }

  await writeFile(TARGET_FILE, template, 'utf8');
  console.log('Updated .vscode/tasks.json from dev-wpa-config template.');
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
