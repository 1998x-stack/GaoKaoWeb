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
