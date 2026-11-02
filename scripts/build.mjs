import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLegacyData, normalizeSyllabus, flattenSearch, walkNodes } from '../src/model.mjs';
import { homePage, subjectPage, archivePage, searchPage, aboutPage, sourcesPage, legacyRedirect } from '../src/templates.mjs';
import { validateSourceRegistry, inspectLocalPdf, attachProvenance, makeProvenanceIndex } from '../src/provenance.mjs';
import { flattenTopics, makeKnowledgeGraph, getRelated } from '../src/knowledge.mjs';
import { topicPage, learningPage } from '../src/learning-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content', 'catalog.json'), 'utf8'));
const sourcesRegistry = JSON.parse(fs.readFileSync(path.join(root, 'content/sources.json'), 'utf8'));
validateSourceRegistry(sourcesRegistry, catalog);
const byDocument = new Map(sourcesRegistry.localDocuments.map(doc => [doc.id, doc]));
const pdfAudit = {};
const allSearchEntries = [];
const allTopics = [];
const output = { subjects: [], nodes: 0, searchEntries: 0, documents: 0, nodesWithPageCandidates: 0, pageCandidates:0 };

function write(relative, contents) {
  const destination = path.join(dist, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, contents, 'utf8');
}
function copy(source, target) {
  const destination = path.join(dist, target);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, source), destination);
}
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
copy('src/site.css', 'assets/site.css');
copy('src/site.js', 'assets/site.js');
copy('src/subject.js', 'assets/subject.js');
copy('src/search.js', 'assets/search.js');
for(const name of ['knowledge.mjs','search-core.mjs','study-store.mjs','detail.js','learning.js']){
  copy('src/'+name,'assets/'+name);
}

for (const subject of catalog.subjects) {
  const raw = readLegacyData(path.join(root, subject.dir, 'data.js'));
  const nodes = normalizeSyllabus(raw, subject.id);
  const pdfSource = subject.dir + '/' + subject.pdf;
  if (!fs.existsSync(path.join(root, pdfSource))) throw new Error('Missing PDF: ' + pdfSource);
  copy(pdfSource, 'documents/' + subject.id + '.pdf');
  const sourceDocument = byDocument.get('local-' + subject.id);
  if (!sourceDocument) throw new Error('Missing document registry: ' + subject.id);
  const inspected = inspectLocalPdf(dist, sourceDocument);
  pdfAudit[sourceDocument.id] = { pageCount:inspected.pageCount, extractablePages:inspected.extractablePages };
  const evidenceStats = attachProvenance(nodes, sourceDocument, inspected.pages);
  output.nodesWithPageCandidates += evidenceStats.matchedNodes;
  output.pageCandidates += evidenceStats.candidatePages;
  const indexes = flattenSearch(subject, nodes);
  let count = 0;
  walkNodes(nodes, () => count++);
  const categories = [...new Set(nodes.map((node) => node.category).filter(Boolean))];
  const enriched = { ...subject, categories, sectionCount: nodes.length, nodeCount: count };
  write('data/' + subject.id + '.json', JSON.stringify({ subject: enriched, nodes, status: 'historical_unverified', localDocumentId:sourceDocument.id, officialCatalogContextId:sourceDocument.officialCatalogContextId }));
  write('subjects/' + subject.id + '/index.html', subjectPage(enriched, catalog.sourceNotice));
  output.documents++;
  // Preserve legacy deep links while moving all new navigation to canonical routes.
  const legacyFilename = {
    Biology: 'biology', Chemistry: 'chemistry', Chinese: 'chinese',
    English: 'english', Geography: 'geography', History: 'history',
    HumanitiesMath: 'humanitiesmath', Physics: 'physics',
    Politic: 'politic', ScienceMath: 'sciencemath'
  }[subject.dir];
  write(subject.dir + '/' + legacyFilename + '.html', legacyRedirect('../subjects/' + subject.id + '/'));
  // Existing PDF URLs remain valid after the rebuild.
  copy(pdfSource, subject.dir + '/' + subject.pdf);
  allSearchEntries.push(...indexes.map(row=>({
    ...row,url:'topics/'+subject.id+'/'+row.id+'/'
  })));
  allTopics.push(...flattenTopics(enriched,nodes));
  output.subjects.push(enriched);
  output.nodes += count;
}
// Generate one independent, directly linkable HTML document for each knowledge node.
const knowledgeGraph=makeKnowledgeGraph(allTopics);
const bySubjectTopics=new Map();
for(const topic of allTopics) {
  const same=bySubjectTopics.get(topic.subjectId)||[];
  same.push(topic);
  bySubjectTopics.set(topic.subjectId,same);
}
for(const topic of allTopics) {
  const siblings=bySubjectTopics.get(topic.subjectId);
  const index=siblings.findIndex(x=>x.id===topic.id);
  const prev=index>0?siblings[index-1]:null;
  const next=index+1<siblings.length?siblings[index+1]:null;
  write(topic.url+'index.html',topicPage(topic,getRelated(knowledgeGraph,topic.id),prev,next));
}
write('learning/index.html',learningPage());
write('data/topic-index.json',JSON.stringify({schemaVersion:'1.2',topics:allTopics.map(topic=>({
  id:topic.id,title:topic.title,url:topic.url,
  subjectId:topic.subjectId,subjectName:topic.subjectName,
  parentId:topic.parentId,rootId:topic.rootId,depth:topic.depth,
  category:topic.category
}))}));
write('data/knowledge-graph.json',JSON.stringify({
  schemaVersion:'1.2',
  semantics:'structural_or_unreviewed_title_similarity_only',
  relations:Object.fromEntries(allTopics.map(x=>[x.id,getRelated(knowledgeGraph,x.id).map(link=>({
    id:link.id,type:link.type,reason:link.reason
  }))]))
}));
copy('Principle/高考-总纲.pdf', 'documents/overview.pdf');
copy('Principle/高考-总纲.pdf', 'Principle/高考-总纲.pdf');
output.documents++;
const overview = byDocument.get('local-overview');
const inspectedOverview = inspectLocalPdf(dist, overview);
pdfAudit[overview.id] = {pageCount:inspectedOverview.pageCount, extractablePages:inspectedOverview.extractablePages};
write('data/sources.json', JSON.stringify(makeProvenanceIndex(sourcesRegistry, pdfAudit)));
write('sources/index.html', sourcesPage(sourcesRegistry));
write('Principle/index.html', legacyRedirect('../archive/'));
write('data/search-index.json', JSON.stringify(allSearchEntries));
write('index.html', homePage(output.subjects, catalog.sourceNotice, output.nodes));
write('archive/index.html', archivePage(output.subjects, catalog.sourceNotice));
write('search/index.html', searchPage());
write('about/index.html', aboutPage(catalog.sourceNotice));
write('404.html', homePage(output.subjects, catalog.sourceNotice, output.nodes));
write('data/manifest.json', JSON.stringify({
  schemaVersion: '1.2', topics: allTopics.length, status: 'historical_unverified', subjects: output.subjects.length,
  nodes: output.nodes, searchEntries: allSearchEntries.length, documents: output.documents,
  nodesWithPageCandidates: output.nodesWithPageCandidates, pageCandidates: output.pageCandidates
}, null, 2));
output.searchEntries = allSearchEntries.length;
console.log('Built GaoKaoWeb:', JSON.stringify(output));
