import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  validateResource,validateRegistry,mayIndexForAI,mayIncludeInExport,isOfficialHost
} from '../src/resources/rights-policy.mjs';

const registry=JSON.parse(fs.readFileSync('content/v1.3/source-candidates.json','utf8'));
const base=registry.resources[1];
const clone=x=>structuredClone(x);

test('curated official references are explicitly link-only, not copyrighted exam papers',()=>{
  const report=validateRegistry(registry);
  assert.equal(report.records,5);
  assert.equal(report.published,0);
  assert.equal(report.externallyLinked,5);
  assert.ok(registry.resources.every(x=>x.usage.grantedActions.length===0));
  assert.ok(registry.resources.every(x=>!('content' in x)));
});
test('official URL does not confer the right to upload/copy exam questions',()=>{
  const fake=clone(base);
  fake.usage.mode='hosted';
  fake.content={stem:'Restricted exam question'};
  assert.throws(()=>validateResource(fake),/Hosted content requires explicit public display grant/);
});
test('link-only entries cannot silently add full question/AI index',()=>{
  const fake=clone(base);
  fake.content={stem:'Copied statement'};
  assert.throws(()=>validateResource(fake),/Link-only resource/);
  const fake2=clone(base);fake2.usage.grantedActions=['create_embeddings'];
  assert.throws(()=>validateResource(fake2),/rights cannot grant|Link-only/);
  assert.equal(mayIndexForAI(base),false);
});
test('exam reviews never become official exam papers by changing a label',()=>{
  const fake=clone(base);
  fake.kind='official_exam_paper';
  assert.throws(()=>validateResource(fake),/Official exam needs exact paper verification/);
});
test('withdrawn and unverified content cannot be published or exported',()=>{
  const fake=clone(base);
  fake.workflowStatus='withdrawn';assert.equal(mayIncludeInExport(fake),false);
  fake.workflowStatus='published';
  assert.throws(()=>validateResource(fake),/editor review/);
  assert.equal(mayIndexForAI(fake),false);
});
test('official-host checks prevent hostname impersonation',()=>{
  assert.ok(isOfficialHost('https://www.moe.gov.cn/srcsite/A26'));
  assert.equal(isOfficialHost('https://www.moe.gov.cn.evil.example/file'),false);
  assert.equal(isOfficialHost('http://www.moe.gov.cn/file'),false);
});
