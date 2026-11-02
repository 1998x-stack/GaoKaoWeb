import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('docs hub separates implementation from design and lists all subject guides',()=>{
 const hub=fs.readFileSync('docs/INDEX.md','utf8');
 const roadmap=fs.readFileSync('docs/ROADMAP.md','utf8');
 assert.match(hub,/V1\.3/);
 assert.match(hub,/未上线/);
 assert.match(roadmap,/1\.3\.0/);
 const subjects=fs.readdirSync('docs/subjects').filter(x=>x.endsWith('.md'));
 assert.equal(subjects.length,11);
});
test('README documents portable build without claiming Poppler required normally',()=>{
 const readme=fs.readFileSync('README.md','utf8');
 assert.match(readme,/npm run verify/);
 assert.match(readme,/npm run audit:pdf/);
 assert.match(readme,/不需要.*pdfinfo/);
 assert.doesNotMatch(readme,/初始搜索使用 substring/);
});
test('math pilot tracks remain unverified pending teacher review',()=>{
 const data=JSON.parse(fs.readFileSync('content/v1.3/mathematics-taxonomy.json','utf8'));
 assert.equal(data.pilotTracks.length,3);
 assert.equal(data.metadata.classificationStatus,'draft_requires_teacher_review');
 for(const p of data.pilotTracks){
   assert.deepEqual(p.topicIds,[]);
   assert.equal(p.mappingStatus,'teacher_review_required');
 }
});
