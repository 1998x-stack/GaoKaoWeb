import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readLegacyData, normalizeSyllabus } from '../src/model.mjs';
import { sha256File, normalizeText, attachProvenance, applyCachedProvenance } from '../src/provenance.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/catalog.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(root,'content/sources.json'),'utf8'));
const cache=JSON.parse(fs.readFileSync(path.join(root,'content/pdf-evidence-locations.json'),'utf8'));
const byDoc=new Map(registry.localDocuments.map(x=>[x.id,x]));
const flatten=(nodes,out=[])=>{for(const n of nodes){out.push(n);flatten(n.children,out);}return out;};
let matched=0,candidates=0;
function checkDocument(doc,file) {
  assert.equal(sha256File(file),doc.sha256,'PDF changed: '+doc.id);
  const info=execFileSync('pdfinfo',[file],{encoding:'utf8',timeout:10000});
  const match=info.match(/^Pages:\s*(\d+)\s*$/m);
  assert.equal(Number(match?.[1]),doc.pages,'PDF page count changed: '+doc.id);
  const text=execFileSync('pdftotext',['-layout','-enc','UTF-8',file,'-'],{
    encoding:'utf8',maxBuffer:8*1024*1024,timeout:15000
  });
  const pages=text.split('\f').slice(0,doc.pages).map(normalizeText);
  assert.equal(pages.length,doc.pages,'Page text count mismatch: '+doc.id);
  return pages;
}
for(const subject of catalog.subjects){
  const doc=byDoc.get('local-'+subject.id);
  assert.ok(doc);
  const pages=checkDocument(doc,path.join(root,subject.dir,subject.pdf));
  const raw=readLegacyData(path.join(root,subject.dir,'data.js'));
  const independentlyComputed=normalizeSyllabus(raw,subject.id);
  const restoredFromCache=normalizeSyllabus(raw,subject.id);
  const actualStats=attachProvenance(independentlyComputed,doc,pages);
  const cachedStats=applyCachedProvenance(restoredFromCache,subject.id,doc,cache);
  assert.deepEqual(cachedStats,actualStats,'Evidence count mismatch: '+subject.id);
  const actual=flatten(independentlyComputed);
  const cached=flatten(restoredFromCache);
  assert.equal(actual.length,cached.length);
  for(let i=0;i<actual.length;i++){
    assert.equal(actual[i].id,cached[i].id);
    assert.deepEqual(cached[i].provenance,actual[i].provenance,
      'Cached PDF evidence mismatch: '+subject.id+' / '+actual[i].id);
  }
  matched+=actualStats.matchedNodes;
  candidates+=actualStats.candidatePages;
}
const overview=byDoc.get('local-overview');
checkDocument(overview,path.join(root,'Principle','高考-总纲.pdf'));
assert.equal(matched,116,'Unexpected count of matched knowledge nodes');
assert.equal(candidates,134,'Unexpected count of suggested page links');
console.log('Independent PDF cache audit passed:',catalog.subjects.length+1,
  'PDF files,',matched,'matched nodes,',candidates,'candidate pages.');
