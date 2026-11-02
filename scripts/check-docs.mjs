import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const required=[
 'README.md','docs/INDEX.md','docs/ARCHITECTURE.md','docs/ROADMAP.md',
 'docs/DESIGN_ENHANCEMENTS.md','docs/SOURCE_GOVERNANCE.md','docs/VERCEL_DEPLOYMENT.md',
 'docs/V1.3_RESEARCH_RIGHTS.md','docs/V1.3_SYSTEM_ARCHITECTURE.md',
 'docs/V1.3_AI_EVIDENCE_GATES.md','docs/V1.3_DATA_DICTIONARY.md',
 'docs/V1.3_QUESTION_TAXONOMY.md','docs/V1.3_TEACHER_RESOURCES.md',
 'docs/V1.3_LEARNING_PATHS.md','docs/V1.3_EDITORIAL_OPERATIONS.md',
 'docs/V1.3_TEST_STRATEGY.md','docs/subjects/INDEX.md'
];
const subjects=[
 'biology','chemistry','chinese','english','geography',
 'history','humanities-math','physics','politics','science-math'
];
for(const id of subjects)required.push('docs/subjects/'+id+'.md');
const errors=[];
for(const rel of required){
  const full=path.join(root,rel);
  if(!fs.existsSync(full)) {errors.push('Missing documentation: '+rel);continue;}
  const content=fs.readFileSync(full,'utf8');
  if(!content.startsWith('# ')) errors.push('Missing level-one heading: '+rel);
  if(rel.startsWith('docs/subjects/') && rel!=='docs/subjects/INDEX.md' &&
     (!content.includes('2019') || !content.includes('审核')))
    errors.push('Subject doc lacks historical/approval disclaimer: '+rel);
  for(const match of content.matchAll(/\]\(([^)\n]+)\)/g)){
    const target=match[1].trim().split(/\s+"/)[0].replace(/^<|>$/g,'');
    if(!target || target.startsWith('#') || /^(https?:|mailto:|tel:|data:)/i.test(target))continue;
    const clean=decodeURIComponent(target.split('#')[0].split('?')[0]);
    if(!clean)continue;
    const absolute=path.resolve(path.dirname(full),clean);
    if(!absolute.startsWith(root+path.sep)&&absolute!==root){
      errors.push('Doc link escapes repository: '+rel+' => '+target);continue;
    }
    if(!fs.existsSync(absolute))errors.push('Broken Markdown link: '+rel+' => '+target);
  }
}
const seed=JSON.parse(fs.readFileSync('content/v1.3/source-candidates.json','utf8'));
const topicDraft=JSON.parse(fs.readFileSync('content/v1.3/mathematics-taxonomy.json','utf8'));
if(seed.resources.length!==5||seed.resources.some(r=>r.workflowStatus!=='candidate' || r.usage.mode!=='external_link_only'))
  errors.push('V1.3 docs cannot claim published exam content while seed status differs');
if(topicDraft.metadata?.classificationStatus!=='draft_requires_teacher_review'||
   topicDraft.pilotTracks.length!==3 ||
   topicDraft.pilotTracks.some(x=>x.topicIds.length>0))
  errors.push('Math topic mappings require a documented teacher review');
const map=fs.readFileSync('docs/INDEX.md','utf8');
const subjectsIndex=fs.readFileSync('docs/subjects/INDEX.md','utf8');
for(const id of subjects)if(!subjectsIndex.includes('('+id+'.md)'))
  errors.push('Subject doc omitted in index: '+id);
if(!map.includes('(subjects/INDEX.md)'))errors.push('Docs hub does not link to subjects');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Documentation check passed:',required.length,'Markdown files,',
  subjects.length,'subjects,',seed.resources.length,'unpublished source candidates');
