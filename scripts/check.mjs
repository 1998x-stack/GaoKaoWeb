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
// V1.2 independent pages, deep-links, relation graph, and search targets.
const index=JSON.parse(fs.readFileSync(path.join(dist,'data/topic-index.json'),'utf8'));
const relationGraph=JSON.parse(fs.readFileSync(path.join(dist,'data/knowledge-graph.json'),'utf8'));
const searchIndex=JSON.parse(fs.readFileSync(path.join(dist,'data/search-index.json'),'utf8'));
const topicIds=new Set(index.topics.map(row=>row.id));
if(manifest.schemaVersion!=='1.2') issues.push('Expected version 1.2');
if(index.topics.length!==manifest.nodes || manifest.topics!==manifest.nodes ||
   topicIds.size!==manifest.nodes) issues.push('Topic page cardinality / ID mismatch');
if(searchIndex.length!==manifest.nodes)issues.push('Search index lost nodes');
for(const topic of index.topics) {
  if(!/^[a-z0-9_-]+$/i.test(topic.id))issues.push('Unsafe topic route: '+topic.id);
  const expected='topics/'+topic.subjectId+'/'+topic.id+'/';
  if(topic.url!==expected)issues.push('Topic canonical URL mismatch: '+topic.id);
  const file=path.join(dist,expected,'index.html');
  if(!fs.existsSync(file))issues.push('Missing individual topic page: '+topic.id);
  if(!Array.isArray(relationGraph.relations[topic.id]))issues.push('Missing relation graph node: '+topic.id);
  else for (const relation of relationGraph.relations[topic.id]) {
    if(!topicIds.has(relation.id)||relation.id===topic.id)issues.push('Dangling/self relation: '+topic.id);
    if(!['parent','child','sibling','title_similarity'].includes(relation.type))
      issues.push('Invalid relation type: '+topic.id);
  }
  if(topic.parentId&&!topicIds.has(topic.parentId))issues.push('Missing topic parent: '+topic.id);
}
for(const doc of searchIndex) {
  if(!topicIds.has(doc.id)||doc.url!=='topics/'+doc.subjectId+'/'+doc.id+'/')
    issues.push('Search index points at missing topic: '+doc.id);
}
if(!fs.existsSync(path.join(dist,'learning','index.html')))issues.push('Missing learning dashboard');
for (const asset of ['search-core.mjs','study-store.mjs','detail.js','learning.js']){
  if(!fs.existsSync(path.join(dist,'assets',asset))) issues.push('Missing learning asset: '+asset);
}
if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('Validation passed:', htmlCount, 'HTML files,', manifest.nodes, 'nodes,', manifest.searchEntries, 'search entries,', covered, 'provenance records,', pageCandidates, 'page suggestions');
