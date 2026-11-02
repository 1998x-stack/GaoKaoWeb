// Policy engine for *future* public teaching resources.
// Default-deny hosted content; a source URL alone never grants reproduction rights.
export const ACTIONS=Object.freeze(['display_full','host_file','distribute','adapt','create_embeddings','send_to_external_llm']);
const OFFICIAL_HOSTS=Object.freeze(['moe.gov.cn','neea.edu.cn','shmeea.edu.cn']);
const VALID_STATUSES=new Set(['candidate','metadata_reviewed','rights_reviewed','pedagogy_reviewed','published','withdrawn']);
const VALID_KINDS=new Set(['official_exam_paper','exam_review','teacher_development_news','curriculum_notice','policy_notice','licensed_question','authored_question','lesson_plan','learning_path']);
const MODES=new Set(['external_link_only','hosted']);
const GRANT_STATUSES=new Set(['not_established','licensed','author_owned','permission_in_writing','revoked']);
function assert(condition,message) {if(!condition)throw new Error(message);}
function validDate(x){return x===null || typeof x==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x+'T00:00:00Z'));}
function safeUrl(value){
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;} catch{return false;}
}
export function isOfficialHost(value){
  if(!safeUrl(value))return false;
  const host=new URL(value).hostname.toLowerCase();
  return OFFICIAL_HOSTS.some(x=>host===x||host.endsWith('.'+x));
}
export function validateResource(record) {
  assert(record && typeof record==='object'&&!Array.isArray(record),'Invalid resource');
  assert(/^[a-z0-9][a-z0-9-]{4,120}$/.test(record.id||''),'Invalid resource id');
  assert(VALID_KINDS.has(record.kind),'Unknown resource kind: '+record.id);
  assert(typeof record.title==='string'&&record.title.length>2,'Missing title: '+record.id);
  assert(typeof record.provider==='string'&&record.provider.length>1,'Missing publisher: '+record.id);
  assert(safeUrl(record.sourceUrl),'Unsafe or missing source URL: '+record.id);
  assert(validDate(record.publishedAt)&&validDate(record.issuedAt),'Invalid dates: '+record.id);
  assert(record.year===null||Number.isInteger(record.year)&&record.year>=2000&&record.year<=2100,
    'Invalid year: '+record.id);
  assert(Array.isArray(record.provinceCodes)&&record.provinceCodes.every(p=>/^[A-Z]{2}$/.test(p)),
    'Invalid province codes: '+record.id);
  assert(typeof record.examScheme==='string'&&record.examScheme.length>2,'Missing scheme: '+record.id);
  assert(typeof record.verifiedAspect==='string'&&record.verifiedAspect.length>3,'Missing verification aspect: '+record.id);
  assert(VALID_STATUSES.has(record.workflowStatus),'Invalid review status: '+record.id);
  assert(Array.isArray(record.topicIds)&&record.topicIds.every(id=>/^[a-z0-9_-]+$/.test(id)),
    'Invalid topic IDs: '+record.id);
  const grant=record.usage;
  assert(grant&&MODES.has(grant.mode)&&GRANT_STATUSES.has(grant.rightsStatus),
    'Invalid rights declaration: '+record.id);
  assert(Array.isArray(grant.grantedActions)&&grant.grantedActions.every(x=>ACTIONS.includes(x))&&
    new Set(grant.grantedActions).size===grant.grantedActions.length,
    'Invalid granted actions: '+record.id);
  if(grant.rightsStatus==='not_established'||grant.rightsStatus==='revoked'){
    assert(grant.grantedActions.length===0,'Unverified/revoked rights cannot grant actions: '+record.id);
  }
  if(grant.mode==='external_link_only'){
    assert(!Object.hasOwn(record,'content'),'Link-only resource cannot host protected content: '+record.id);
    assert(grant.grantedActions.length===0,'Link-only resource cannot advertise hosted rights: '+record.id);
  }
  if(record.kind==='official_exam_paper'){
    assert(record.year!==null&&record.examScheme!=='not_applicable'&&
      record.verifiedAspect==='official_paper_verified','Official exam needs exact paper verification: '+record.id);
  }
  if(record.kind==='exam_review'){
    assert(record.verifiedAspect.includes('review')||record.verifiedAspect.includes('news'),
      'Official exam commentary must remain commentary: '+record.id);
  }
  if(grant.mode==='hosted'){
    assert(grant.grantedActions.includes('display_full'),
      'Hosted content requires explicit public display grant: '+record.id);
    assert(['licensed','author_owned','permission_in_writing'].includes(grant.rightsStatus),
      'Hosted content rights not established: '+record.id);
    assert(safeUrl(grant.rightsEvidenceUrl)&&typeof grant.rightsHolder==='string'&&
      typeof grant.reviewedBy==='string'&&validDate(grant.reviewedAt)&&grant.reviewedAt!==null,
      'Hosted content requires reviewed rights evidence: '+record.id);
    assert(record.content&&typeof record.content==='object'&&
      record.workflowStatus==='published','Hosted content must be fully reviewed and published: '+record.id);
  }
  if(record.workflowStatus==='published'){
    assert(record.verifiedAspect!=='unverified'&&record.workflowStatus!=='withdrawn',
      'Unverified/withdrawn resource cannot publish: '+record.id);
    assert(typeof grant.reviewedBy==='string'&&grant.reviewedBy.length>0,
      'Published resource needs editor review: '+record.id);
  }
  if(record.workflowStatus==='withdrawn'){
    assert(!Object.hasOwn(record,'content'),'Withdrawn item must not contain publicly bundled content');
  }
  return true;
}
export function validateRegistry(registry){
  assert(registry?.schemaVersion==='1.3-design'&&Array.isArray(registry.resources),
    'Invalid design-stage registry');
  const seen=new Set();
  for(const record of registry.resources){
    validateResource(record);
    assert(!seen.has(record.id),'Duplicate resource '+record.id);
    seen.add(record.id);
  }
  return {records:seen.size,published:registry.resources.filter(x=>x.workflowStatus==='published').length,
    externallyLinked:registry.resources.filter(x=>x.usage.mode==='external_link_only').length};
}
export function mayIndexForAI(record){
  if(record.workflowStatus!=='published'||record.usage?.mode!=='hosted')return false;
  try{validateResource(record);}catch{return false;}
  const actions=new Set(record.usage.grantedActions);
  return actions.has('create_embeddings')&&actions.has('send_to_external_llm')&&
    record.content?.editoriallyVerified===true && Array.isArray(record.content?.evidence) &&
    record.content.evidence.every(x=>x.reviewStatus==='human_verified');
}
export function mayIncludeInExport(record){
  if(record.workflowStatus!=='published'||record.usage?.mode!=='hosted')return false;
  try{validateResource(record);}catch{return false;}
  return record.usage.grantedActions.includes('distribute');
}
