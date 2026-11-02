import { createSearchEngine } from './search-core.mjs';

const app=document.querySelector('[data-global-search]');
if(app) {
  const input=document.querySelector('#global-query');
  const select=document.querySelector('#subject-select');
  const results=document.querySelector('#search-results');
  const count=document.querySelector('#result-count');
  const empty=document.querySelector('#search-empty');
  const form=document.querySelector('#global-search-form');
  const params=new URLSearchParams(location.search);
  input.value=params.get('q')||'';
  let engine=null;
  function element(tag,klass='',text=''){
    const node=document.createElement(tag);
    if(klass)node.className=klass;
    node.textContent=text;
    return node;
  }
  function run(){
    if(!engine)return;
    const term=input.value.trim();
    results.replaceChildren();
    if(!term){
      count.textContent='输入关键词，按中文词语或知识点标题进行检索';
      empty.hidden=true;
    }else {
      const found=engine.search(term,{subjectId:select.value,limit:80});
      count.textContent='找到 '+found.total+' 条相关知识点'+(found.total>80?' · 显示前80条':'');
      empty.hidden=found.total>0;
      for(const {doc,score} of found.results) {
        const link=element('a','result-item');
        link.href='../topics/'+encodeURIComponent(doc.subjectId)+'/'+encodeURIComponent(doc.id)+'/';
        const head=element('div','result-top');
        head.appendChild(element('span','result-subject',doc.subjectName));
        head.appendChild(element('span','result-status',doc.depth===0?'主主题':'知识节点'));
        head.appendChild(element('span','result-status',doc.locationStatus==='candidate_page_match_unreviewed'?'本地页码待核对':'历史资料'));
        link.appendChild(head);
        link.appendChild(element('h2','',doc.title));
        link.appendChild(element('p','',doc.excerpt||'进入知识点详情，查看相关知识和原文证据。'));
        link.appendChild(element('span','result-action','打开知识点详情 →'));
        results.appendChild(link);
      }
    }
    if(location.protocol==='http:'||location.protocol==='https:'){
      const url=new URL(location.href);
      if(term)url.searchParams.set('q',term);else url.searchParams.delete('q');
      if(select.value!=='all')url.searchParams.set('subject',select.value);else url.searchParams.delete('subject');
      history.replaceState(null,'',url.pathname+url.search);
    }
  }
  form.addEventListener('submit',event=>{event.preventDefault();run();});
  input.addEventListener('input',run);
  select.addEventListener('change',run);
  const status=element('p','search-loading','正在建立中文检索索引…');
  results.appendChild(status);
  fetch('../data/search-index.json').then(response=>{
    if(!response.ok)throw Error('search index HTTP '+response.status);
    return response.json();
  }).then(entries=>{
    engine=createSearchEngine(entries);
    const subjects=new Map(entries.map(doc=>[doc.subjectId,doc.subjectName]));
    for(const [id,label] of subjects){
      const opt=document.createElement('option');opt.value=id;opt.textContent=label;select.appendChild(opt);
    }
    if(subjects.has(params.get('subject')))select.value=params.get('subject');
    run();
  }).catch(()=>{
    results.replaceChildren(element('p','error-state','中文搜索暂时无法加载，请刷新页面重试。'));
  });
}
