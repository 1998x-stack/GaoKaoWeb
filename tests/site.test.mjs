import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readLegacyData, normalizeSyllabus, flattenSearch, walkNodes, getCategories } from '../src/model.mjs';

const catalog = JSON.parse(fs.readFileSync('content/catalog.json', 'utf8'));
test('all ten original subject datasets normalize without losing nodes', () => {
  assert.equal(catalog.subjects.length, 10);
  for (const subject of catalog.subjects) {
    const raw = readLegacyData(path.join(subject.dir, 'data.js'));
    const normalized = normalizeSyllabus(raw, subject.id);
    assert.equal(normalized.length, raw.length, subject.id);
    const seen = new Set();
    walkNodes(normalized, node => {
      assert.ok(node.title, subject.id);
      assert.ok(!seen.has(node.id), node.id);
      seen.add(node.id);
    });
    assert.ok(seen.size > raw.length, subject.id + ' should preserve nested nodes');
    const entries = flattenSearch(subject, normalized);
    assert.ok(entries.length > 0, subject.id);
  }
});
test('deep child levels remain addressable', () => {
  const raw = readLegacyData('ScienceMath/data.js');
  const nodes = normalizeSyllabus(raw, 'science-math');
  let depth = 0;
  walkNodes(nodes, (_node, d) => { depth = Math.max(d, depth); });
  assert.ok(depth >= 2);
});
test('classifications derive from source data rather than stale HTML filters', () => {
  const nodes = normalizeSyllabus(readLegacyData('ScienceMath/data.js'), 'science-math');
  assert.ok(getCategories(nodes).includes('statistics'));
  assert.ok(getCategories(nodes).includes('basic'));
});
test('catalog links to actual source PDFs', () => {
  for (const subject of catalog.subjects) {
    assert.ok(fs.existsSync(path.join(subject.dir, subject.pdf)), subject.id);
  }
});

test('every nested text item survives legacy normalization in original order', () => {
  function collect(nodes, output = []) {
    for (const node of nodes) {
      output.push('TITLE:' + node.title);
      for (const item of node.items || []) output.push('ITEM:' + item);
      for (const part of node.content || []) {
        output.push('PART:' + part.title);
        for (const item of part.items || []) output.push('ITEM:' + item);
      }
      if (node.footer) output.push('FOOTER:' + node.footer);
      collect(node.children || [], output);
    }
    return output;
  }
  for (const subject of catalog.subjects) {
    const original = readLegacyData(path.join(subject.dir, 'data.js'));
    const normalized = normalizeSyllabus(original, subject.id);
    assert.deepEqual(collect(normalized), collect(original), 'Lost source content: ' + subject.id);
  }
});

import { validateSourceRegistry, sha256File, normalizeText, findPageCandidates, attachProvenance } from '../src/provenance.mjs';

const sources = JSON.parse(fs.readFileSync('content/sources.json','utf8'));

test('official source registry tracks publication without claiming local PDF verification', () => {
  validateSourceRegistry(sources,catalog);
  assert.equal(sources.officialDocuments.length,11);
  assert.equal(sources.localDocuments.length,11);
  for (const official of sources.officialDocuments) {
    assert.equal(official.publishedAt,'2019-01-31');
    assert.equal(official.scope.examYear,2019);
    assert.equal(official.scope.regionalAdaptations,'not_assessed');
    assert.equal(official.verification.pdfBinary,'not_compared');
  }
  for (const local of sources.localDocuments) {
    assert.equal(local.originVerification,'unverified_local_copy');
    assert.equal(local.publishedAt,null);
    assert.equal(local.regions,null);
    assert.equal(local.year,null);
  }
});

test('all PDF source fingerprints match the registered source bytes', () => {
  const dirMap=new Map(catalog.subjects.map(s=>[s.id,path.join(s.dir,s.pdf)]));
  dirMap.set('overview',path.join('Principle','高考-总纲.pdf'));
  for (const doc of sources.localDocuments) {
    const key=doc.id.replace(/^local-/,'');
    assert.equal(sha256File(dirMap.get(key)),doc.sha256,'PDF drift '+key);
  }
});

test('page candidates require literal matches and are always unreviewed', () => {
  const sourceNode={id:'one',title:'导数及其应用',items:['导数的几何意义和导数的计算'],content:[],children:[]};
  const pages=[
    normalizeText('本页讲述集合与函数的概念'),
    normalizeText('导数及其应用：导数的几何意义和导数的计算'),
    normalizeText('另一页讲述函数性质')
  ];
  const candidates=findPageCandidates(sourceNode,pages);
  assert.equal(candidates[0].page,2);
  assert.equal(candidates[0].reviewStatus,'unreviewed');
  assert.equal(candidates[0].matchMethod,'local_pdf_exact_normalized_text');
  assert.equal(findPageCandidates({title:'不相关主题',items:[],content:[]},pages).length,0);
  const stats=attachProvenance([sourceNode],{id:'local-science-math',officialCatalogContextId:'neea-2019-science-math'},pages);
  assert.equal(stats.nodeCount,1);
  assert.equal(stats.matchedNodes,1);
  assert.equal(sourceNode.provenance.locationStatus,'candidate_page_match_unreviewed');
  assert.equal(sourceNode.provenance.compilationStatus,'legacy_compilation_not_officially_verified');
});

test('registry blocks unsupported local PDF publication dates or promotions', () => {
  const forged=structuredClone(sources);
  forged.localDocuments[0].publishedAt='2019-01-31';
  assert.throws(()=>validateSourceRegistry(forged,catalog),/Unsupported local PDF/);
  const forged2=structuredClone(sources);
  forged2.officialDocuments[0].verification.pdfBinary='verified';
  assert.throws(()=>validateSourceRegistry(forged2,catalog),/Official verification/);
});
