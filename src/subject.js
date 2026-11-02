import { readState as loadStudyState, updateState } from './study-store.mjs';
(() => {
  const page = document.querySelector('[data-subject-page]');
  if (!page) return;
  const slug = page.dataset.subjectPage;
  const list = document.querySelector('#topic-list');
  const nav = document.querySelector('#subject-nav');
  const filters = document.querySelector('#category-filters');
  const queryInput = document.querySelector('#subject-search');
  const empty = document.querySelector('#subject-empty');
  const progressLabel = document.querySelector('#progress-label');
  const progressFill = document.querySelector('#progress-fill');
  const categoryNames = {
    basic:'基础与要求', ability:'能力目标', knowledge:'核心知识',
    experiment:'实验探究', reading:'阅读', language:'语言应用',
    writing:'写作', listening:'听力', algebra:'代数与函数',
    geometry:'几何', calculus:'导数与积分', statistics:'统计概率',
    mechanics:'力学', thermodynamics:'热学', electromagnetism:'电磁学',
    physical:'自然地理', human:'人文地理', regional:'区域地理',
    ancient:'古代历史', modern:'近代历史', contemporary:'现代历史',
    inorganic:'无机化学', organic:'有机化学', economic:'经济',
    political:'政治', cultural:'文化', philosophy:'哲学'
  };
  let nodes = [];
  let category = 'all';
  let query = '';
  const storage = (()=>{try{return window.localStorage;}catch{return null;}})();
  const reviewed = new Set(Object.keys(loadStudyState(storage).reviewed));
  function element(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function renderEvidence(node, holder) {
    const evidence = node.provenance;
    if (!evidence) return;
    const panel = element('div', 'evidence-panel');
    const heading = element('strong', 'evidence-heading', '来源证据 · 本地 PDF');
    panel.appendChild(heading);
    const pages = evidence.pageCandidates || [];
    if (pages.length === 0) {
      panel.appendChild(element('p','evidence-note','未找到可定位的 PDF 原文页码；该条目仍需人工核验。'));
    } else {
      const top = element('p','evidence-note','以下仅为本地 PDF 的文本匹配候选页码，尚未确认与官方原件一致。');
      panel.appendChild(top);
      const links = element('div','evidence-links');
      for (const candidate of pages) {
        const link = element('a','evidence-link','第 ' + candidate.page + ' 页 · 文本匹配 ↗');
        link.href = '../../documents/' + encodeURIComponent(slug) + '.pdf#page=' + candidate.page;
        link.title = '匹配内容：' + candidate.anchor + '（待复核）';
        link.target='_blank';
        link.rel='noopener noreferrer';
        links.appendChild(link);
      }
      panel.appendChild(links);
    }
    const registry = element('a', 'evidence-registry', '查看官方目录与文件状态 →');
    registry.href = '../../sources/#doc-' + encodeURIComponent(slug);
    panel.appendChild(registry);
    holder.appendChild(panel);
  }
  function renderContent(node, holder) {
    if (node.items.length) {
      const ul = element('ul', 'knowledge-list');
      node.items.forEach(item => ul.appendChild(element('li', '', item)));
      holder.appendChild(ul);
    }
    node.content.forEach(part => {
      const group = element('div', 'knowledge-part');
      group.appendChild(element('h4', '', part.title));
      if (part.items.length) {
        const ul = element('ul', 'knowledge-list');
        part.items.forEach(item => ul.appendChild(element('li', '', item)));
        group.appendChild(ul);
      }
      holder.appendChild(group);
    });
  }
  function renderNested(node, depth = 1) {
    const details = element('details', 'knowledge-node');
    details.open = depth <= 1;
    details.id = node.id;
    const summary = element('summary', 'knowledge-summary');
    summary.appendChild(element('span', 'summary-icon', '+'));
    const label = element('span', 'summary-label');
    if (node.level) label.appendChild(element('span', 'level-token', node.level));
    label.appendChild(document.createTextNode(node.title));
    summary.appendChild(label);
    details.appendChild(summary);
    const body = element('div', 'knowledge-body');
    renderContent(node, body);
    node.children.forEach(child => body.appendChild(renderNested(child, depth + 1)));
    renderEvidence(node, body);
    if (node.footer) body.appendChild(element('p', 'node-footer', node.footer));
    const deepLink=element('a','topic-deep-link','打开知识点独立页面 ↗');
    deepLink.href='../../topics/'+encodeURIComponent(slug)+'/'+encodeURIComponent(node.id)+'/';
    body.prepend(deepLink);
    details.appendChild(body);
    return details;
  }
  function drawProgress() {
    const completed = nodes.filter(node => reviewed.has(node.id)).length;
    progressLabel.textContent = completed + ' / ' + nodes.length;
    progressFill.style.width = (nodes.length ? Math.round(100 * completed / nodes.length) : 0) + '%';
  }
  function toggleRead(id, button) {
    const next=updateState(storage,'reviewed',id);
    reviewed.clear();
    Object.keys(next.reviewed).forEach(item=>reviewed.add(item));
    button.textContent=reviewed.has(id)?'✓ 已阅读':'标记已阅读';
    button.setAttribute('aria-pressed',String(reviewed.has(id)));
    drawProgress();
  }
  function buildCard(node, index) {
    const section = element('section', 'topic-card');
    section.id = node.id;
    const header = element('div', 'topic-heading');
    const label = element('div', 'topic-number', String(index + 1).padStart(2, '0'));
    const heading = element('div', 'topic-heading-text');
    heading.appendChild(element('span', 'topic-category', categoryNames[node.category] || node.category || '主题内容'));
    heading.appendChild(element('h3', '', node.title));
    header.append(label, heading);
    const mark = element('button', 'read-button', reviewed.has(node.id) ? '✓ 已阅读' : '标记已阅读');
    mark.type = 'button';
    mark.setAttribute('aria-pressed', String(reviewed.has(node.id)));
    mark.addEventListener('click', () => toggleRead(node.id, mark));
    header.appendChild(mark);
    section.appendChild(header);
    const detailLink=element('a','topic-deep-link topic-head-link','进入本知识主题详情 ↗');
    detailLink.href='../../topics/'+encodeURIComponent(slug)+'/'+encodeURIComponent(node.id)+'/';
    section.appendChild(detailLink);
    const body = element('div', 'topic-body');
    renderContent(node, body);
    node.children.forEach(child => body.appendChild(renderNested(child)));
    renderEvidence(node, body);
    if (node.footer) body.appendChild(element('p', 'node-footer', node.footer));
    section.appendChild(body);
    return section;
  }
  function matches(node, term) {
    if (!term) return true;
    const self = [node.title, ...node.items,
      ...node.content.flatMap(part => [part.title, ...part.items]),
      node.footer].join(' ').toLocaleLowerCase('zh-CN');
    return self.includes(term) || node.children.some(child => matches(child, term));
  }
  function draw() {
    list.replaceChildren();
    const visible = nodes.map((node, index) => ({node,index}))
      .filter(entry => (category === 'all' || entry.node.category === category) && matches(entry.node, query));
    visible.forEach(({node,index}) => list.appendChild(buildCard(node, index)));
    empty.hidden = visible.length > 0;
    if (query) list.querySelectorAll('details').forEach(details => { details.open = true; });
    drawProgress();
  }
  function drawNav() {
    nav.replaceChildren();
    nodes.forEach((node,index) => {
      const anchor = element('a', '', String(index+1).padStart(2,'0') + '  ' + node.title);
      anchor.href = '#' + encodeURIComponent(node.id);
      anchor.addEventListener('click', () => {
        if (category !== 'all' || query) {
          category='all'; query=''; queryInput.value=''; drawFilters(); draw();
        }
      });
      nav.appendChild(anchor);
    });
  }
  function drawFilters() {
    filters.replaceChildren();
    const categories = [...new Set(nodes.map(node => node.category).filter(Boolean))];
    for (const value of ['all', ...categories]) {
      const button = element('button', 'chip' + (category === value ? ' active' : ''), value === 'all' ? '全部主题' : (categoryNames[value] || value));
      button.type = 'button';
      button.setAttribute('aria-pressed', String(category === value));
      button.addEventListener('click', () => { category = value; drawFilters(); draw(); });
      filters.appendChild(button);
    }
  }
  queryInput.addEventListener('input', () => {
    query = queryInput.value.trim().toLocaleLowerCase('zh-CN');
    draw();
  });
  document.querySelector('[data-expand-all]').addEventListener('click', () =>
    list.querySelectorAll('details').forEach(details => { details.open = true; }));
  document.querySelector('[data-collapse-all]').addEventListener('click', () =>
    list.querySelectorAll('details').forEach(details => { details.open = false; }));
  fetch('../../data/' + encodeURIComponent(slug) + '.json')
    .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
    .then(data => {
      nodes = data.nodes;
      drawNav(); drawFilters(); draw();
      if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) {
          let parent = target.parentElement;
          while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
          target.scrollIntoView({block:'start'});
        }
      }
    }).catch(() => { list.replaceChildren(element('p', 'error-state', '知识数据暂时无法加载，请刷新页面后重试。')); });
})();
