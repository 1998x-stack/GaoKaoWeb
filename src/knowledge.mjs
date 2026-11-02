// Structural edges are source-backed by the legacy tree; similarity is only an exploration hint.
function pieces(title) {
 const t=String(title).normalize('NFKC').toLocaleLowerCase('zh-CN');
 const chars=(t.match(/\p{Script=Han}{2,}/gu)||[]);
 const grams=new Set();
 for(const part of chars) for(let i=0;i<part.length-1;i++) grams.add(part.slice(i,i+2));
 for(const word of t.match(/[a-z]{3,}/g)||[]) grams.add(word);
 return grams;
}
export function flattenTopics(subject,nodes){
  const records=[];
  const visit=(node,parent,root,trail,depth)=>{
    const row={
      id:node.id,title:node.title,subjectId:subject.id,subjectName:subject.name,
      subjectColor:subject.color,
      rootId:root||node.id,parentId:parent?.id||null,
      depth,path:trail,category:node.category,
      url:'topics/'+subject.id+'/'+node.id+'/',
      items:node.items,content:node.content,footer:node.footer,
      provenance:node.provenance,
      children:node.children.map(x=>x.id)
    };
    records.push(row);
    for(const child of node.children) visit(child,node,root||node.id,[...trail,node.title],depth+1);
  };
  for(const node of nodes)visit(node,null,null,[],0);
  return records;
}
export function makeKnowledgeGraph(records,{maxRelated=7}={}){
  const byId=new Map();
  for(const node of records) {
    if(byId.has(node.id))throw new Error('Duplicate topic id: '+node.id);
    byId.set(node.id,node);
  }
  const groups=new Map();
  for(const node of records) {
    const key=node.parentId||'ROOT:'+node.subjectId;
    const siblings=groups.get(key)||[];
    siblings.push(node.id);
    groups.set(key,siblings);
  }
  const tokenById=new Map(records.map(x=>[x.id,pieces(x.title)]));
  const edges=new Map();
  for(const node of records){
    const hits=[];
    const used=new Set([node.id]);
    function add(id,type,reason,weight) {
      if(!byId.has(id)||used.has(id))return;
      used.add(id);
      hits.push({id,type,reason,weight});
    }
    if(node.parentId)add(node.parentId,'parent','所属上级知识主题',100);
    for(const childId of node.children.slice(0,3))add(childId,'child','下一级目录',96);
    const siblingIds=groups.get(node.parentId||'ROOT:'+node.subjectId)||[];
    const pos=siblingIds.indexOf(node.id);
    if(pos>0)add(siblingIds[pos-1],'sibling','目录相邻主题',90);
    if(pos<siblingIds.length-1)add(siblingIds[pos+1],'sibling','目录相邻主题',89);
    // Only suggest textual similarity; never pretend it is a teacher-vetted prerequisite edge.
    const tokens=tokenById.get(node.id);
    const similar=[];
    for(const other of records){
      if(used.has(other.id))continue;
      const theirs=tokenById.get(other.id);
      if(tokens.size<2 || theirs.size<2)continue;
      let common=0;
      for(const token of tokens)if(theirs.has(token))common++;
      if(common<2)continue;
      const overlap=common/Math.max(2,Math.min(tokens.size,theirs.size));
      if(overlap<.4)continue;
      similar.push({other,score:common*2+overlap+(other.subjectId===node.subjectId?1:0)});
    }
    similar.sort((a,b)=>b.score-a.score||a.other.id.localeCompare(b.other.id));
    for(const hit of similar.slice(0,3))add(hit.other.id,'title_similarity','标题词片段相似 · 仅供探索',hit.score);
    edges.set(node.id,hits.slice(0,maxRelated));
  }
  return {byId,edges};
}
export function getRelated(graph,id) {
  return (graph.edges.get(id)||[]).map(edge=>({...edge,topic:graph.byId.get(edge.id)}));
}
