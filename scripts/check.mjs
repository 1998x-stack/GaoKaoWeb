import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Run npm run build first');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'data/manifest.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content/catalog.json'), 'utf8'));
const issues = [];
let htmlCount = 0;
function checkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { checkDir(full); continue; }
    if (!entry.name.endsWith('.html')) continue;
    htmlCount++;
    const html = fs.readFileSync(full, 'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = match[1].split('?')[0].split('#')[0];
      if (!target || /^(https?:|mailto:|tel:|data:)/.test(target)) continue;
      const resolved = path.resolve(path.dirname(full), decodeURIComponent(target));
      if (!resolved.startsWith(dist + path.sep) && resolved !== dist) {
        issues.push('Escapes dist: ' + full + ' => ' + target);
      } else if (!fs.existsSync(resolved)) {
        issues.push('Broken path: ' + path.relative(dist, full) + ' => ' + target);
      }
    }
  }
}
checkDir(dist);
if (manifest.subjects !== 10 || manifest.nodes < 80 || manifest.searchEntries < 80) {
  issues.push('Unexpected manifest counts: ' + JSON.stringify(manifest));
}
for (const subject of catalog.subjects) {
  if (!fs.existsSync(path.join(dist, 'subjects', subject.id, 'index.html'))) issues.push('No page: ' + subject.id);
  if (!fs.existsSync(path.join(dist, 'documents', subject.id + '.pdf'))) issues.push('No PDF: ' + subject.id);
}
function digest(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
for (const subject of catalog.subjects) {
  const source = path.join(root, subject.dir, subject.pdf);
  const published = path.join(dist, 'documents', subject.id + '.pdf');
  if (fs.existsSync(published) && digest(source) !== digest(published)) {
    issues.push('PDF source bytes changed: ' + subject.id);
  }
}
if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('Validation passed:', htmlCount, 'HTML files,', manifest.nodes, 'nodes,', manifest.searchEntries, 'search entries');
