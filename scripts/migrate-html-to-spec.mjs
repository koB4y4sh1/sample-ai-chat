/**
 * Maintenance: HTML with `<main>` → Markdown under docs/spec/.
 * Default reads flat `docs/*.html`. Pass one argv to override the source directory (e.g. `docs/html`).
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const docsDir = join(root, process.argv[2] ?? 'docs');
const specDir = join(root, 'docs', 'spec');

mkdirSync(specDir, { recursive: true });

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});
td.use(gfm);

const files = readdirSync(docsDir).filter((f) => f.endsWith('.html'));

for (const file of files) {
  const html = readFileSync(join(docsDir, file), 'utf8');
  const $ = cheerio.load(html);
  const mainHtml = $('main').html();
  if (!mainHtml) {
    console.warn(`skip ${file}: no <main>`);
    continue;
  }
  const md = td.turndown(mainHtml).trim();
  const base = file.replace(/\.html$/i, '');
  writeFileSync(join(specDir, `${base}.md`), `${md}\n`, 'utf8');
  console.log(`wrote docs/spec/${base}.md`);
}
