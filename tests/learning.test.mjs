import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readLegacyData, normalizeSyllabus, flattenSearch } from '../src/model.mjs';
import { flattenTopics, makeKnowledgeGraph, getRelated } from '../src/knowledge.mjs';
import { tokenize,createSearchEngine } from '../src/search-core.mjs';
import { KEY,readState,updateState,clearState,summarize } from '../src/study-store.mjs';

const catalog=JSON.parse(fs.readFileSync('content/catalog.json','utf8'));

function fixture(){
  const rows=[];
  for(const subject of catalog.subjects){
    const raw=readLegacyData(path.join(subject.dir,'data.js'));
    rows.push(...flattenTopics(subject,normalizeSyllabus(raw,subject.id)));
  }
  return rows;
}
test('all legacy nodes produce distinct direct links with stable IDs',()=>{
  const rows=fixture();
  assert.equal(rows.length,269);
  assert.equal(new Set(rows.map(t=>t.id)).size,rows.length);
  for(const topic of rows){
    assert.match(topic.id,/^[a-z0-9_-]+$/i);
    assert.equal(topic.url,'topics/'+topic.subjectId+'/'+topic.id+'/');
    assert.ok(topic.depth>=0);
    if(topic.parentId)assert.ok(rows.some(t=>t.id===topic.parentId));
  }
});
test('knowledge relation targets exist, include explicit semantics, and never point to self',()=>{
  const rows=fixture();
  const graph=makeKnowledgeGraph(rows);
  for(const topic of rows){
    for(const link of getRelated(graph,topic.id)){
      assert.notEqual(link.id,topic.id);
      assert.ok(graph.byId.has(link.id));
      assert.ok(['parent','child','sibling','title_similarity'].includes(link.type));
      if(link.type==='title_similarity')assert.match(link.reason,/仅供探索/);
    }
  }
});
test('structural parent/child links remain faithful to original tree',()=>{
  const rows=fixture(), graph=makeKnowledgeGraph(rows,{maxRelated:20});
  for(const topic of rows){
    if(topic.parentId){
      const edges=getRelated(graph,topic.id);
      assert.ok(edges.some(link=>link.id===topic.parentId&&link.type==='parent'));
    }
  }
});
test('Chinese segmenter supports multi-character compound terms and mixed Latin search',()=>{
  assert.ok(tokenize('平面解析几何').includes('解析'));
  assert.ok(tokenize('基因遗传').includes('遗传'));
  assert.ok(tokenize('导数 API').includes('api'));
});
test('weighted BM25 favors exact title over body occurrence and returns direct URLs',()=>{
  const docs=[
    {id:'a',title:'导数及其应用',subjectId:'science-math',subjectName:'数学',excerpt:'求导法则',searchText:'导数及其应用 求导法则'},
    {id:'b',title:'综合专题',subjectId:'physics',subjectName:'物理',excerpt:'导数与求导方法相关',searchText:'综合专题 导数与求导方法相关'},
    {id:'c',title:'概率统计',subjectId:'science-math',subjectName:'数学',excerpt:'随机变量',searchText:'概率统计 随机变量'}
  ];
  const engine=createSearchEngine(docs);
  assert.equal(engine.size,3);
  const result=engine.search('导数');
  assert.ok(result.total>=2);
  assert.equal(result.results[0].doc.id,'a');
  const filtered=engine.search('导数',{subjectId:'physics'});
  assert.equal(filtered.total,1);
  assert.equal(filtered.results[0].doc.id,'b');
  assert.equal(engine.search('完全无关项').total,0);
  assert.equal(engine.search('').total,0);
});
function fakeStorage(){
  const map=new Map();
  return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}
test('V1.0 reviewed marks migrate without claiming descendant completion',()=>{
  const storage=fakeStorage();
  storage.setItem('gaokao:reviewed:v1:biology',JSON.stringify(['biology--section-I']));
  const state=readState(storage);
  assert.equal(state.reviewed['biology--section-I'],true);
  assert.equal(state.reviewed['biology--section-I--1'],undefined);
  assert.ok(storage.getItem(KEY));
});
test('bookmarks and reviewed are independent, persistent and clearable',()=>{
  const storage=fakeStorage();
  const id='biology--section-I--1';
  updateState(storage,'bookmark',id,123456);
  updateState(storage,'reviewed',id,123457);
  updateState(storage,'visit',id,123458);
  assert.equal(readState(storage).bookmarks[id],true);
  assert.equal(readState(storage).reviewed[id],true);
  assert.equal(readState(storage).recent[0].id,id);
  updateState(storage,'bookmark',id);
  assert.equal(readState(storage).bookmarks[id],undefined);
  const stats=summarize(readState(storage),[{id,subjectId:'biology',subjectName:'生物'}]);
  assert.equal(stats.reviewed,1);
  assert.equal(stats.percentage,100);
  clearState(storage);
  assert.equal(readState(storage).reviewed[id],undefined);
});
test('invalid local storage and malformed IDs do not crash app state',()=>{
  const storage=fakeStorage();storage.setItem(KEY,'{garbled json');
  assert.equal(readState(storage).schema,2);
  assert.throws(()=>updateState(storage,'reviewed','bad/path'),/Invalid node id/);
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  assert.equal(readState(denied).schema,2);
});

test('search handles omitted Chinese modifiers in actual physics corpus',()=>{
  const physics=catalog.subjects.find(s=>s.id==='physics');
  const data=normalizeSyllabus(readLegacyData(path.join(physics.dir,'data.js')),physics.id);
  const engine=createSearchEngine(flattenSearch(physics,data));
  const answer=engine.search('牛顿定律');
  assert.ok(answer.total>0,'User query should retrieve 牛顿运动定律');
  assert.ok(answer.results.some(x=>x.doc.title.includes('牛顿运动定律')));
});
