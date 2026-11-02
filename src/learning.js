import { readState, updateState, clearState, summarize, KEY } from './study-store.mjs';

const root=document.querySelector('[data-learning-dashboard]');
if(root){
  const storage=(()=>{try{return window.localStorage;}catch{return null;}})();
  const elements={
    reviewed:document.querySelector('#dashboard-reviewed'),
    bookmarks:document.querySelector('#dashboard-bookmarks'),
    percent:document.querySelector('#dashboard-percent'),
    total:document.querySelector('#dashboard-total'),
    progress:document.querySelector('#subject-progress'),
    bookmarkList:document.querySelector('#bookmark-list'),
    recentList:document.querySelector('#recent-list'),
    status:document.querySelector('#dashboard-status'),
    bookmarkCaption:document.querySelector('#bookmark-caption')
  };
  let topics=[];
  let lookup=new Map();
  function element(tag,cls='',content=''){
    const el=document.createElement(tag);if(cls)el.className=cls;
    if(content)el.textContent=content;return el;
  }
  function link(topic) {
    const row=element('a','dashboard-topic-link');
    row.href='../'+topic.url;
    const title=element('strong','',topic.title);
    const meta=element('span','',topic.subjectName+' · 历史资料');
    row.append(title,meta);
    return row;
  }
  function fillLinks(container,ids,emptyText){
    container.replaceChildren();
    if(!ids.length){container.appendChild(element('p','detail-empty',emptyText));return;}
    for(const id of ids) {
      const row=lookup.get(id);
      if(row) container.appendChild(link(row));
    }
  }
  function render() {
    const state=readState(storage);
    const stats=summarize(state,topics);
    elements.reviewed.textContent=String(stats.reviewed);
    elements.bookmarks.textContent=String(stats.bookmarks);
    elements.percent.textContent=stats.percentage+'%';
    elements.total.textContent=String(stats.total);
    elements.bookmarkCaption.textContent=stats.bookmarks+' 个主题';
    elements.progress.replaceChildren();
    for (const [id,subject] of Object.entries(stats.bySubject)) {
      const item=element('div','subject-progress-item');
      const top=element('div','subject-progress-heading');
      const title=element('a','',subject.name);
      title.href='../subjects/'+encodeURIComponent(id)+'/';
      top.append(title,element('span','',subject.reviewed+' / '+subject.total));
      const bar=element('progress');bar.max=subject.total;bar.value=subject.reviewed;
      bar.setAttribute('aria-label',subject.name+'学习标记覆盖');
      item.append(top,bar);
      elements.progress.appendChild(item);
    }
    fillLinks(elements.bookmarkList,topics.filter(t=>state.bookmarks[t.id]).map(t=>t.id),'尚未收藏知识点。');
    fillLinks(elements.recentList,stats.recent.map(t=>t.id),'尚无最近阅读记录。');
  }
  document.querySelector('[data-export]')?.addEventListener('click',()=>{
    const state=readState(storage);
    const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;anchor.download='gaokao-study-progress.json';
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    URL.revokeObjectURL(url);
    elements.status.textContent='本地学习记录已准备导出。';
  });
  document.querySelector('[data-clear]')?.addEventListener('click',()=>{
    if(!window.confirm('确定清空此浏览器的收藏、学习标记和最近阅读记录吗？'))return;
    clearState(storage);render();elements.status.textContent='当前浏览器学习记录已清空。';
  });
  fetch('../data/topic-index.json').then(response=>{
    if(!response.ok)throw Error('topic index HTTP '+response.status);
    return response.json();
  }).then(index=>{
    topics=index.topics;
    lookup=new Map(topics.map(t=>[t.id,t]));
    render();
  }).catch(()=>{
    elements.status.textContent='无法加载学科知识索引，请刷新网页重试。';
  });
}
