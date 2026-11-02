(() => {
  const app = document.querySelector('[data-global-search]');
  if (!app) return;
  const input = document.querySelector('#global-query');
  const select = document.querySelector('#subject-select');
  const results = document.querySelector('#search-results');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#search-empty');
  const form = document.querySelector('#global-search-form');
  let entries = [];
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';
  function element(tag, className = '', value = '') {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = value;
    return node;
  }
  function run() {
    const term = input.value.trim().toLocaleLowerCase('zh-CN');
    const subjectId = select.value;
    results.replaceChildren();
    if (!term) {
      count.textContent = '输入关键词开始检索';
      empty.hidden = true;
      if (location.protocol === 'http:' || location.protocol === 'https:') history.replaceState(null, '', location.pathname);
      return;
    }
    const words = term.split(/\s+/).filter(Boolean);
    const matched = entries.filter(item =>
      (subjectId === 'all' || item.subjectId === subjectId) &&
      words.every(word => item.searchText.includes(word)))
      .map(item => ({item, score: (item.title.toLocaleLowerCase('zh-CN').includes(term) ? 10 : 0) + (item.depth === 0 ? 2 : 0)}))
      .sort((a,b) => b.score-a.score || a.item.depth-b.item.depth)
      .slice(0, 100);
    count.textContent = '找到 ' + matched.length + (matched.length === 100 ? '+ ' : ' ') + '条匹配结果';
    empty.hidden = matched.length > 0;
    for (const {item} of matched) {
      const anchor = element('a', 'result-item');
      anchor.href = '../subjects/' + encodeURIComponent(item.subjectId) + '/#' + encodeURIComponent(item.rootId);
      const top = element('div','result-top');
      top.appendChild(element('span','result-subject',item.subjectName));
      top.appendChild(element('span','result-status','历史资料'));
      top.appendChild(element('span','result-status',item.locationStatus === 'candidate_page_match_unreviewed' ? '本地页码待复核' : 'PDF 页码未定位'));
      anchor.appendChild(top);
      anchor.appendChild(element('h2','',item.title));
      anchor.appendChild(element('p','',item.excerpt || '打开相关主题查看详细内容'));
      anchor.appendChild(element('span','result-action','查看所在知识主题 →'));
      results.appendChild(anchor);
    }
    const next = new URL(location.href);
    next.searchParams.set('q', input.value.trim());
    if (location.protocol === 'http:' || location.protocol === 'https:') history.replaceState(null, '', next.pathname + next.search);
  }
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  input.addEventListener('input', run);
  select.addEventListener('change', run);
  fetch('../data/search-index.json').then(response => {
    if (!response.ok) throw new Error('Failed to load index');
    return response.json();
  }).then(data => {
    entries = data;
    const subjects = new Map();
    for (const entry of entries) subjects.set(entry.subjectId, entry.subjectName);
    for (const [id, name] of subjects) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    }
    run();
  }).catch(() => { count.textContent = '搜索索引加载失败，请刷新页面'; });
})();
