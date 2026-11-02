import { shell, escapeHtml } from './templates.mjs';
const e=escapeHtml;
const topicLink=(row,depth=3)=>'../'.repeat(depth)+row.url;
function renderText(node) {
  let html='';
  if(node.items?.length) html+='<ul class="detail-points">'+node.items.map(item=>'<li>'+e(item)+'</li>').join('')+'</ul>';
  for(const part of node.content||[]) {
    html+='<section class="detail-part"><h2>'+e(part.title)+'</h2>';
    if(part.items?.length)html+='<ul class="detail-points">'+part.items.map(item=>'<li>'+e(item)+'</li>').join('')+'</ul>';
    html+='</section>';
  }
  if(node.footer)html+='<p class="detail-footnote">'+e(node.footer)+'</p>';
  if(!html)html='<p class="detail-empty">该节点为知识结构标题，请进入下一级知识主题继续查阅。</p>';
  return html;
}
function sourcePanel(node) {
  const ev=node.provenance;
  const pages=ev?.pageCandidates||[];
  const anchors=pages.length?pages.map(hit=>
    '<a class="evidence-link" target="_blank" rel="noopener noreferrer" href="../../../documents/'+encodeURIComponent(node.subjectId)+'.pdf#page='+hit.page+'">本地 PDF · 第'+hit.page+'页 ↗</a>').join(''):
    '<p class="evidence-note">尚未在本地 PDF 中定位到可信的文字页码。</p>';
  return '<section class="detail-source" aria-labelledby="source-heading">' +
    '<div><span class="eyebrow">SOURCE TRACE</span><h2 id="source-heading">原文与证据状态</h2></div>' +
    '<p>来源为仓库历史考纲整理。下列页码只是程序在本地 PDF 中匹配的候选页码，未经人工审定，不能证明与官方原件一致。</p>' +
    '<div class="evidence-links">'+anchors+'</div>' +
    '<a class="subtle-link" href="../../../sources/#doc-'+encodeURIComponent(node.subjectId)+'">查看官方目录及本地文件核验记录 →</a></section>';
}
export function topicPage(topic,relations,previous,next,topicById) {
  const route='../../../';
  const breadcrumbs=[
    '<a href="'+route+'">首页</a>',
    '<a href="'+route+'subjects/'+e(topic.subjectId)+'/">'+e(topic.subjectName)+'</a>',
    ...topic.path.map((name,i)=>'<span>'+e(name)+'</span>'),
    '<span>'+e(topic.title)+'</span>'
  ].join('<span class="breadcrumb-sep">/</span>');
  const related=relations.length?relations.map(({topic:related,reason,type})=>
    '<a class="relation-card" href="'+topicLink(related)+'"><span class="relation-kind">'+e(reason)+'</span>'+
    '<strong>'+e(related.title)+'</strong><span class="relation-subject">'+e(related.subjectName)+'</span>'+
    '<span class="relation-arrow" aria-hidden="true">↗</span></a>').join(''):
    '<p class="detail-empty">暂未生成可解释的相关主题。</p>';
  const childLinks=topic.children.length?'<section class="detail-children"><h2>继续深入</h2><div class="child-links">'+topic.children.map(id=>{
    const child=topicById.get(id);
    return '<a href="'+route+'topics/'+e(topic.subjectId)+'/'+e(id)+'/">'+e(child?.title||'查看下级知识点')+' ↗</a>';
  }).join('')+'</div></section>':'';
  const pager='<nav class="topic-pager" aria-label="知识目录翻页">'+
    (previous?'<a href="'+topicLink(previous)+'"><small>← 上一个知识点</small><span>'+e(previous.title)+'</span></a>':'<span></span>')+
    (next?'<a href="'+topicLink(next)+'"><small>下一个知识点 →</small><span>'+e(next.title)+'</span></a>':'<span></span>')+'</nav>';
  const body='<div class="container page-top topic-page" data-topic-id="'+e(topic.id)+'">' +
    '<nav class="breadcrumbs" aria-label="面包屑">'+breadcrumbs+'</nav>' +
    '<div class="topic-hero-v12"><div><span class="eyebrow">KNOWLEDGE ATLAS / '+e(topic.subjectName)+'</span>'+
    '<h1>'+e(topic.title)+'</h1><div class="topic-badges"><span class="tag tag-amber">历史资料 · 来源待核验</span>'+
    '<span class="tag">'+(topic.depth===0?'一级主题':'第'+(topic.depth+1)+'级知识节点')+'</span></div></div>'+
    '<div class="topic-actions"><button class="button button-outline" type="button" data-bookmark aria-pressed="false">☆ 加入收藏</button>'+
    '<button class="button button-primary" type="button" data-review aria-pressed="false">✓ 标记已学习</button></div></div>' +
    '<div class="topic-columns"><article class="topic-article"><section class="detail-material" aria-label="知识内容">'+renderText(topic)+'</section>'+
    childLinks+sourcePanel(topic)+pager+'</article>' +
    '<aside class="topic-aside"><div class="sticky-panel"><h2>学习导航</h2>'+
    '<p>你可以收藏主题、标记已学习，并在学习中心查看所有进度；数据只保存在当前浏览器。</p>'+
    '<a href="'+route+'subjects/'+e(topic.subjectId)+'/" class="subtle-link">返回'+e(topic.subjectName)+'知识目录 →</a>'+
    '<a href="'+route+'learning/" class="subtle-link">查看我的学习中心 →</a>'+
    '<div class="sidebar-divider"></div><h3>关联知识</h3>'+
    '<p class="side-note">结构关系来自原始目录；相似主题是文本提示，不代表经过教师验证的先修关系。</p>'+
    '<div class="topic-relations">'+related+'</div></div></aside></div></div>';
  return shell({title:topic.title,depth:3,body,script:'detail.js'});
}
export function learningPage() {
  const body='<div class="container page-top study-dashboard" data-learning-dashboard>'+
    '<nav class="breadcrumbs" aria-label="面包屑"><a href="../">首页</a><span>/</span><span>我的学习</span></nav>'+
    '<div class="page-heading"><span class="eyebrow">YOUR LEARNING ATLAS</span><h1>我的学习中心</h1>'+
    '<p>把正在探索的知识整理成自己的学习清单。所有记录仅存储于当前浏览器，无账户、无服务端同步。</p></div>'+
    '<div class="dashboard-summary">'+
    '<div><strong id="dashboard-reviewed">—</strong><span>已标记学习</span></div>'+
    '<div><strong id="dashboard-bookmarks">—</strong><span>收藏知识点</span></div>'+
    '<div><strong id="dashboard-percent">—</strong><span>全部节点覆盖率</span></div>'+
    '<div><strong id="dashboard-total">—</strong><span>知识节点总数</span></div></div>'+
    '<div class="page-note"><span>ⓘ</span><span>“已学习”是你主动标记的个人阅读记录，不是考试掌握度或成绩预测。V1.0 已标记的一级主题会自动迁移，子主题不会自动认定完成。</span></div>'+
    '<div class="dashboard-grid"><section class="dashboard-panel"><div class="dashboard-panel-head"><h2>各学科学习进度</h2><span>按节点统计</span></div><div id="subject-progress" class="subject-progress-list"></div></section>'+
    '<section class="dashboard-panel"><div class="dashboard-panel-head"><h2>我收藏的知识</h2><span id="bookmark-caption">—</span></div>'+
    '<div id="bookmark-list" class="dashboard-link-list"><p class="detail-empty">还没有收藏主题。可在任一知识点详情页添加。</p></div></section>'+
    '<section class="dashboard-panel"><div class="dashboard-panel-head"><h2>最近阅读</h2><span>当前浏览器</span></div>'+
    '<div id="recent-list" class="dashboard-link-list"><p class="detail-empty">打开知识点详情页后，将在此显示近期记录。</p></div></section>'+
    '<section class="dashboard-panel"><div class="dashboard-panel-head"><h2>本地记录管理</h2><span>隐私优先</span></div>'+
    '<p>清除记录将删除此浏览器的收藏、学习标记与最近阅读信息，不会修改网站资料。</p>'+
    '<div class="dashboard-controls"><button type="button" class="button button-outline" data-export>导出 JSON</button>'+
    '<button type="button" class="button button-plain" data-clear>清空本地记录</button></div>'+
    '<p role="status" class="dashboard-status" id="dashboard-status"></p></section></div></div>';
  return shell({title:'我的学习中心',depth:1,current:'learning',body,script:'learning.js'});
}
