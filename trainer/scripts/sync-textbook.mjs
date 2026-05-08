import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const trainerRoot = path.join(__dirname, '..');
const repoRoot = path.join(trainerRoot, '..');
const dest = path.join(trainerRoot, 'public', 'textbook');

const toCopy = ['index.html', 'assets', 'chapters', 'extras'];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(dest);
fs.mkdirSync(dest, { recursive: true });

for (const rel of toCopy) {
  const src = path.join(repoRoot, rel);
  const dst = path.join(dest, rel);
  if (!fs.existsSync(src)) {
    console.warn('Skip missing:', src);
    continue;
  }
  const st = fs.statSync(src);
  if (st.isDirectory()) copyDir(src, dst);
  else fs.copyFileSync(src, dst);
}

const inject = '<script src="/learner-progress.js" defer></script>';

function injectHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('learner-progress.js')) return;
  if (!html.includes('</body>')) return;
  html = html.replace('</body>', `${inject}\n</body>`);
  fs.writeFileSync(filePath, html);
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.html')) injectHtml(p);
  }
}

walk(dest);
console.log('Textbook synced to', dest);
