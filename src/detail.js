import { readState, updateState } from './study-store.mjs';

const root=document.querySelector('[data-topic-id]');
if(root){
  const id=root.dataset.topicId;
  const storage=(()=>{
    try{return window.localStorage;}catch{return null;}
  })();
  const bookmark=document.querySelector('[data-bookmark]');
  const review=document.querySelector('[data-review]');
  function paint(){
    const state=readState(storage);
    const saved=Boolean(state.bookmarks[id]);
    const done=Boolean(state.reviewed[id]);
    bookmark.setAttribute('aria-pressed',String(saved));
    review.setAttribute('aria-pressed',String(done));
    bookmark.textContent=saved?'★ 已收藏':'☆ 加入收藏';
    review.textContent=done?'✓ 已标记学习':'✓ 标记已学习';
  }
  bookmark?.addEventListener('click',()=>{updateState(storage,'bookmark',id);paint();});
  review?.addEventListener('click',()=>{updateState(storage,'reviewed',id);paint();});
  updateState(storage,'visit',id);
  paint();
}
