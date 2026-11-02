import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readLegacyData,normalizeSyllabus} from '../src/model.mjs';
import {applyCachedProvenance,sha256File} from '../src/provenance.mjs';

const catalog=JSON.parse(fs.readFileSync('content/catalog.json','utf8'));
const registry=JSON.parse(fs.readFileSync('content/sources.json','utf8'));
const cache=JSON.parse(fs.readFileSync('content/pdf-evidence-locations.json','utf8'));
test('all PDF evidence restores deterministically without Poppler',()=>{
  let nodes=0, matched=0, pages=0;
  for(const subject of catalog.subjects){
    const doc=registry.localDocuments.find(d=>d.id==='local-'+subject.id);
    const original=path.join(subject.dir,subject.pdf);
    assert.equal(sha256File(original),doc.sha256);
    const roots=normalizeSyllabus(readLegacyData(path.join(subject.dir,'data.js')),subject.id);
    const counts=applyCachedProvenance(roots,subject.id,doc,cache);
    nodes+=counts.nodeCount;matched+=counts.matchedNodes;pages+=counts.candidatePages;
    function check(items){
      for(const node of items){
        assert.equal(node.provenance.localDocumentId,doc.id);
        for(const candidate of node.provenance.pageCandidates){
          assert.equal(candidate.reviewStatus,'unreviewed');
          assert.ok(candidate.page<=doc.pages);
        }
        check(node.children);
      }
    }
    check(roots);
  }
  assert.equal(nodes,269);
  assert.equal(matched,116);
  assert.equal(pages,134);
});
test('invalid or out-of-bounds caches fail closed',()=>{
  const subject=catalog.subjects[0];
  const doc=registry.localDocuments.find(d=>d.id==='local-'+subject.id);
  const data=()=>normalizeSyllabus(readLegacyData(path.join(subject.dir,'data.js')),subject.id);
  assert.throws(()=>applyCachedProvenance(data(),subject.id,doc,{}),/cache/);
  const modified=structuredClone(cache);
  modified.subjects[subject.id][0][1][0][0]=100000;
  assert.throws(()=>applyCachedProvenance(data(),subject.id,doc,modified),/page/);
});
test('Vercel config serves generated dist only',()=>{
  const conf=JSON.parse(fs.readFileSync('vercel.json','utf8'));
  assert.equal(conf.framework,null);
  assert.equal(conf.buildCommand,'npm run build');
  assert.equal(conf.outputDirectory,'dist');
});
