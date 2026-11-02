// Shared, privacy-preserving learning state; stored only in the current browser.
export const KEY='gaokao:study:v2';
const ID_PATTERN=/^[a-z0-9][a-z0-9_-]{1,140}$/i;
function blank(){return {schema:2,bookmarks:{},reviewed:{},recent:[]};}
function safeRead(storage,key) { try {return storage?.getItem(key) ?? null;} catch {return null;} }
function safeWrite(storage,key,value) {try { storage?.setItem(key,value);return true;}catch{return false;} }
function cleanMap(candidate) {
  const result={};
  if(!candidate || typeof candidate!=='object' || Array.isArray(candidate)) return result;
  for(const [id,value] of Object.entries(candidate)) {
    if(ID_PATTERN.test(id) && value===true) Object.defineProperty(result,id,{value:true,enumerable:true,writable:true,configurable:true});
  }
  return result;
}
export function readState(storage) {
  const raw=safeRead(storage,KEY);
  if(raw!==null) {
    try {
      const data=JSON.parse(raw);
      if(data?.schema===2){
        const recent=Array.isArray(data.recent)?data.recent
          .filter(row=>row&&ID_PATTERN.test(row.id)&&Number.isFinite(row.at)&&row.at>0)
          .slice(0,40):[];
        return {schema:2,bookmarks:cleanMap(data.bookmarks),reviewed:cleanMap(data.reviewed),recent};
      }
    }catch{}
  }
  const state=blank();
  // Backward compatibility with V1.0 subject-level read marks. No child node is assumed complete.
  const subjects=['biology','chemistry','chinese','english','geography','history',
                  'humanities-math','physics','politics','science-math'];
  for (const subject of subjects) {
    try {
      const ids=JSON.parse(safeRead(storage,'gaokao:reviewed:v1:'+subject)||'[]');
      if(Array.isArray(ids)) for(const id of ids) {
        if(typeof id==='string' && ID_PATTERN.test(id) && id.startsWith(subject+'--')) state.reviewed[id]=true;
      }
    }catch{}
  }
  safeWrite(storage,KEY,JSON.stringify(state));
  return state;
}
export function updateState(storage, action, id, now=Date.now()) {
  if (!ID_PATTERN.test(id)) throw new Error('Invalid node id');
  const state=readState(storage);
  switch(action) {
    case 'bookmark':
      if(state.bookmarks[id]) delete state.bookmarks[id];
      else state.bookmarks[id]=true;
      break;
    case 'reviewed':
      if(state.reviewed[id]) delete state.reviewed[id];
      else state.reviewed[id]=true;
      break;
    case 'visit':
      state.recent=[{id,at:now},...state.recent.filter(x=>x.id!==id)].slice(0,30);
      break;
    default:throw new Error('Unsupported study action');
  }
  safeWrite(storage,KEY,JSON.stringify(state));
  return state;
}
export function clearState(storage){
  const state=blank();
  safeWrite(storage,KEY,JSON.stringify(state));
  // Clear old flags to prevent migration resurrecting removed marks if V2 is deleted.
  for(const subject of ['biology','chemistry','chinese','english','geography','history',
   'humanities-math','physics','politics','science-math']) {
    try {storage?.removeItem('gaokao:reviewed:v1:'+subject);} catch {}
  }
  return state;
}
export function summarize(state,records) {
  const valid=new Set(records.map(x=>x.id));
  const reviewed=records.filter(x=>state.reviewed[x.id]);
  const bookmarks=records.filter(x=>state.bookmarks[x.id]);
  const bySubject={};
  for(const row of records){
    const subject=bySubject[row.subjectId]??={name:row.subjectName,total:0,reviewed:0,bookmarked:0};
    subject.total++;
    if(state.reviewed[row.id])subject.reviewed++;
    if(state.bookmarks[row.id])subject.bookmarked++;
  }
  const recent=state.recent.filter(x=>valid.has(x.id)).slice(0,12);
  return {total:records.length,reviewed:reviewed.length,bookmarks:bookmarks.length,
    percentage:records.length?Math.round(reviewed.length/records.length*100):0,
    bySubject,recent};
}
