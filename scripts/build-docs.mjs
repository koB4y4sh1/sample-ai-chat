/**
 * Build docs/html/*.html from docs/spec/*.md.
 * Uses docs/template/article.html; docs/template/index.html for index.md.
 * Optional YAML frontmatter: title, description (for <meta name="description">).
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const specDir = join(root, 'docs', 'spec');
const htmlDir = join(root, 'docs', 'html');
mkdirSync(htmlDir, { recursive: true });

/** @param {string} md */
function parseFrontmatter(md) {
  const fence = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const m = md.match(fence);
  if (!m) {
    return { meta: {}, body: md };
  }
  const raw = m[1];
  const body = m[2].trimStart();
  /** @type {Record<string, string>} */
  const meta = {};
  for (const line of raw.split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) {
      meta[kv[1]] = kv[2].trim();
    }
  }
  return { meta, body };
}

/** @param {string} body */
function inferTitle(body) {
  const h = body.match(/^#\s+(.+)$/m);
  return h ? h[1].trim() : 'Documentation';
}

/** @param {string} fileName md basename */
function templateFor(fileName) {
  return fileName === 'index.md'
    ? join(root, 'docs', 'template', 'index.html')
    : join(root, 'docs', 'template', 'article.html');
}

const files = readdirSync(specDir).filter((f) => f.endsWith('.md'));

for (const file of files) {
  const rawMd = readFileSync(join(specDir, file), 'utf8');
  const { meta, body } = parseFrontmatter(rawMd);
  const title = meta.title ?? inferTitle(body);
  const description = meta.description ?? '';
  const template = readFileSync(templateFor(file), 'utf8');
  const htmlBody = marked.parse(body, { async: false });
  const out = template
    .replaceAll('{{TITLE}}', escapeHtml(title))
    .replaceAll('{{DESCRIPTION}}', escapeHtml(description))
    .replace('{{BODY}}', htmlBody);
  const outName = file.replace(/\.md$/i, '.html');
  writeFileSync(join(htmlDir, outName), out, 'utf8');
  console.log(`wrote docs/html/${outName}`);
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
