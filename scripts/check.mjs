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
const sources = JSON.parse(fs.readFileSync(path.join(dist, 'data/sources.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/sources.json'), 'utf8'));
if (sources.schemaVersion !== '1.1') issues.push('Sources schema version mismatch');
if (sources.localDocuments.length !== 11 || sources.officialDocuments.length !== 11) issues.push('Unexpected document registry coverage');
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
let covered = 0;
let pageCandidates = 0;
for (const subject of catalog.subjects) {
  const data = JSON.parse(fs.readFileSync(path.join(dist,'data',subject.id+'.json'), 'utf8'));
  const document = sources.localDocuments.find(x=>x.id === data.localDocumentId);
  if (!document) {issues.push('Unregistered document for '+subject.id);continue;}
  if (document.originVerification !== 'unverified_local_copy') issues.push('Unauthorized promotion: '+subject.id);
  const pdf = path.join(dist,document.file);
  if (digest(pdf) !== document.sha256) issues.push('Registry hash mismatch: '+subject.id);
  const visit = node => {
    covered++;
    const evidence = node.provenance;
    if (!evidence || evidence.localDocumentId !== document.id || evidence.compilationStatus !== 'legacy_compilation_not_officially_verified') {
      issues.push('Missing/untrusted node provenance: '+node.id);
    } else {
      for (const candidate of evidence.pageCandidates) {
        pageCandidates++;
        if (candidate.page < 1 || candidate.page > document.pages ||
            candidate.reviewStatus !== 'unreviewed' ||
            candidate.matchMethod !== 'local_pdf_exact_normalized_text') issues.push('Invalid page candidate: '+node.id);
      }
    }
    node.children.forEach(visit);
  };
  data.nodes.forEach(visit);
}
if (covered !== manifest.nodes) issues.push('Provenance coverage mismatch: '+covered);
if (pageCandidates !== manifest.pageCandidates) issues.push('Page candidate count mismatch');
const ov = sources.localDocuments.find(x=>x.id==='local-overview');
if (!ov || digest(path.join(dist,ov.file))!==ov.sha256) issues.push('Overview checksum mismatch');
if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('Validation passed:', htmlCount, 'HTML files,', manifest.nodes, 'nodes,', manifest.searchEntries, 'search entries,', covered, 'provenance records,', pageCandidates, 'page suggestions');
