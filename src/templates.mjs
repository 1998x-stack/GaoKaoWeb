export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function navLink(href, label, active) {
  return '<a class="nav-link' + (active ? ' is-active' : '') + '" href="' + href + '">' + label + '</a>';
}
export function shell({ title, depth = 0, current = '', body, script = '' }) {
  const root = '../'.repeat(depth);
  return '<!doctype html>\n' +
    '<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="theme-color" content="#101d33">' +
    '<meta name="description" content="高考知识地图：历史考纲分学科检索、层级目录和原始文档归档。现行考试要求请以当年官方文件为准。">' +
    '<title>' + escapeHtml(title) + ' · 学纲 Atlas</title>' +
    '<link rel="stylesheet" href="' + root + 'assets/site.css"></head><body>' +
    '<a class="skip-link" href="#main">跳转到正文</a>' +
    '<header class="site-header"><div class="header-inner">' +
    '<a class="brand" href="' + (root || './') + '" aria-label="学纲 Atlas 首页"><span class="brand-mark">学</span><span class="brand-name">学纲<span> ATLAS</span></span></a>' +
    '<nav class="site-nav" id="site-nav" aria-label="主导航">' +
    navLink(root || './', '首页', current === 'home') +
    navLink(root + 'archive/', '资料归档', current === 'archive') +
    navLink(root + 'sources/', '来源核验', current === 'sources') +
    navLink(root + 'search/', '知识检索', current === 'search') +
    navLink(root + 'learning/', '我的学习', current === 'learning') +
    navLink(root + 'about/', '关于项目', current === 'about') +
    '</nav><div class="header-tools">' +
    '<a class="header-search" href="' + root + 'search/" aria-label="搜索全部知识点"><span aria-hidden="true">⌕</span><span>搜索</span><kbd>/</kbd></a>' +
    '<button class="theme-toggle" type="button" data-theme-toggle aria-label="切换深色模式" title="切换深色模式">◐</button>' +
    '<button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav" aria-label="打开菜单"><span></span><span></span><span></span></button>' +
    '</div></div></header>' +
    '<main id="main">' + body + '</main>' +
    '<footer class="site-footer"><div class="container footer-grid">' +
    '<div><a class="footer-logo" href="' + (root || './') + '">学纲 <small>ATLAS</small></a>' +
    '<p>让复杂知识变得有迹可循。本站提供历史资料整理与检索，不替代当年官方考试要求。</p></div>' +
    '<div><h3>探索</h3><a href="' + root + 'search/">全文检索</a><a href="' + root + 'archive/">文档归档</a></div>' +
    '<div><h3>信息</h3><a href="' + root + 'sources/">资料来源</a><a href="' + root + 'about/">使用说明</a>' +
    '<a href="https://github.com/1998x-stack/GaoKaoWeb" target="_blank" rel="noopener noreferrer">GitHub 源码</a></div>' +
    '</div><div class="container footer-bottom"><span>© 学纲 Atlas · 开源内容索引</span><span>资料需核验 · 请关注文件年份和适用范围</span></div></footer>' +
    '<script src="' + root + 'assets/site.js" defer></script>' +
    (script ? '<script type="module" src="' + root + 'assets/' + script + '"></script>' : '') +
    '</body></html>\n';
}
function badge(text, type = '') {
  return '<span class="tag ' + type + '">' + escapeHtml(text) + '</span>';
}
function sectionCard(subject, depth = 0) {
  const root = '../'.repeat(depth);
  const group = subject.group === 'science' ? '自然科学' : subject.group === 'humanities' ? '人文与语言' : '历史数学';
  return '<a class="subject-tile" href="' + root + 'subjects/' + escapeHtml(subject.id) + '/" style="--subject-accent:' + escapeHtml(subject.color) + '">' +
    '<div class="tile-head"><span class="tile-symbol">' + escapeHtml(subject.symbol) + '</span><span class="tile-arrow" aria-hidden="true">↗</span></div>' +
    '<div class="tile-meta">' + escapeHtml(group) + ' · ' + subject.sectionCount + ' 个主题</div>' +
    '<h3>' + escapeHtml(subject.name) + '</h3><p>' + escapeHtml(subject.intro) + '</p>' +
    '<div class="tile-foot"><span>查看知识目录</span><span aria-hidden="true">→</span></div></a>';
}

export function homePage(subjects, notice, count) {
  const tiles = subjects.map(x => sectionCard(x)).join('');
  const body = '<section class="hero"><div class="container hero-layout">' +
    '<div class="hero-copy">' + badge('高考知识地图 · 开源资料库', 'tag-light') +
    '<h1>把复杂考纲，<br><em>变成清晰的知识地图。</em></h1>' +
    '<p>按学科、主题与层级探索知识要求。在结构化目录中找到关键概念，并一键追溯原始 PDF 资料。</p>' +
    '<form class="hero-search" action="search/" method="get" role="search">' +
    '<label class="sr-only" for="home-query">检索知识点</label><span aria-hidden="true">⌕</span>' +
    '<input id="home-query" name="q" type="search" placeholder="搜索：导数、遗传、文言文、牛顿定律…" autocomplete="off">' +
    '<button type="submit">搜索知识 <span aria-hidden="true">↗</span></button></form>' +
    '<p class="hero-caveat">历史资料索引 · 当前考试请以官方最新文件为准</p></div>' +
    '<div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>' +
    '<div class="hero-visual-label">知识之间<br>自有脉络</div><span class="orbit-dot dot-one">数</span><span class="orbit-dot dot-two">史</span><span class="orbit-dot dot-three">理</span></div>' +
    '</div></section>' +
    '<section class="stats-wrap"><div class="container stats-panel">' +
    '<div><strong>' + subjects.length + '</strong><span>学科目录</span></div>' +
    '<div><strong>' + count + '</strong><span>结构化知识节点</span></div>' +
    '<div><strong>11</strong><span>原始 PDF 资料</span></div>' +
    '<div><strong>100%</strong><span>无需注册即可查阅</span></div>' +
    '</div></section>' +
    '<section class="container subjects-section" id="subjects"><div class="section-heading">' +
    '<div><span class="eyebrow">SUBJECT LIBRARY</span><h2>探索学科知识</h2><p>从主题出发，一层层打开知识脉络。</p></div>' +
    '<a class="subtle-link" href="archive/">浏览完整资料归档 <span aria-hidden="true">↗</span></a></div>' +
    '<div class="filter-row" aria-label="学科类型筛选">' +
    '<button type="button" class="chip active" data-home-filter="all" aria-pressed="true">全部学科</button>' +
    '<button type="button" class="chip" data-home-filter="science" aria-pressed="false">自然科学</button>' +
    '<button type="button" class="chip" data-home-filter="humanities" aria-pressed="false">人文与语言</button>' +
    '<button type="button" class="chip" data-home-filter="archive" aria-pressed="false">历史数学</button></div>' +
    '<div class="subject-grid">' + subjects.map(subject => '<div data-subject-group="' + subject.group + '">' + sectionCard(subject) + '</div>').join('') +
    '</div></section>' +
    '<section class="container callout-wrap"><div class="trust-callout"><div>' + badge('资料说明', 'tag-amber') +
    '<h2>了解来源，比记住结论更重要。</h2><p>' + escapeHtml(notice) + '</p></div>' +
    '<a href="about/" class="button button-outline">了解资料使用规则 <span aria-hidden="true">→</span></a></div></section>';
  return shell({ title:'高考知识地图', current:'home', body });
}

export function subjectPage(subject, notice) {
  const root = '../../';
  const body = '<div class="container page-top">' +
    '<nav class="breadcrumbs" aria-label="面包屑"><a href="../../">首页</a><span>/</span><a href="../../archive/">学科目录</a><span>/</span><span>' + escapeHtml(subject.name) + '</span></nav>' +
    '<section class="subject-hero" style="--subject-accent:' + escapeHtml(subject.color) + '">' +
    '<div><div class="subject-hero-tags">' + badge('历史资料 · 待核验', 'tag-amber') + badge(subject.en) + '</div>' +
    '<h1>' + escapeHtml(subject.name) + '</h1><p>' + escapeHtml(subject.intro) + '</p>' +
    '<div class="hero-actions"><a class="button button-primary" href="../../documents/' + subject.id + '.pdf" download>下载原始 PDF ↗</a>' +
    '<a class="button button-plain" href="../../sources/#doc-' + subject.id + '">查看来源与核验状态 →</a></div></div>' +
    '<div class="subject-hero-mark" aria-hidden="true">' + escapeHtml(subject.symbol) + '</div></section>' +
    '<div class="page-note"><span aria-hidden="true">ⓘ</span><span>' + escapeHtml(notice) + ' <a href="../../sources/#doc-' + subject.id + '">查看出处核验详情 ↗</a></span></div>' +
    '<div class="study-layout" data-subject-page="' + escapeHtml(subject.id) + '">' +
    '<aside class="study-sidebar"><div class="sticky-panel"><div class="side-heading">内容导航 <span data-section-count>' + subject.sectionCount + ' 个主题</span></div>' +
    '<div id="subject-nav" class="topic-nav" aria-label="主题导航"></div>' +
    '<div class="side-doc"><span class="side-doc-icon" aria-hidden="true">▤</span><div><strong>原始资料</strong><span>PDF 文档</span></div>' +
    '<a href="../../documents/' + subject.id + '.pdf" aria-label="下载 PDF">↗</a></div></div></aside>' +
    '<div class="study-main"><div class="study-toolbar"><div><span class="eyebrow">KNOWLEDGE OUTLINE</span><h2>知识目录</h2></div>' +
    '<div class="study-search"><label class="sr-only" for="subject-search">筛选本学科知识</label><span aria-hidden="true">⌕</span>' +
    '<input type="search" id="subject-search" placeholder="筛选本学科内容…" autocomplete="off"></div></div>' +
    '<div class="toolbar-actions"><div id="category-filters" class="filter-row filter-row-small" aria-label="主题分类"></div>' +
    '<div class="toolbar-right"><button type="button" class="text-button" data-expand-all>全部展开</button>' +
    '<button type="button" class="text-button" data-collapse-all>全部折叠</button></div></div>' +
    '<div class="progress-strip"><span>已阅读主题 <strong id="progress-label">0 / ' + subject.sectionCount + '</strong></span><div class="progress-track"><div id="progress-fill"></div></div></div>' +
    '<div id="topic-list" class="topic-list" aria-live="polite"><div class="loading-state">正在整理知识目录…</div></div>' +
    '<div id="subject-empty" class="empty-state" hidden>没有找到匹配的知识条目，试试其他关键词。</div></div></div></div>';
  return shell({ title:subject.name + '考试知识目录', depth:2, body, script:'subject.js' });
}

export function searchPage() {
  const body = '<div class="container page-top"><nav class="breadcrumbs" aria-label="面包屑"><a href="../">首页</a><span>/</span><span>知识检索</span></nav>' +
    '<div class="page-heading"><span class="eyebrow">EXPLORE THE ATLAS</span><h1>查找你想了解的知识</h1><p>跨学科检索历史考纲中的知识主题与具体要求。</p></div>' +
    '<div class="search-workspace" data-global-search>' +
    '<form id="global-search-form" class="large-search" role="search"><label class="sr-only" for="global-query">输入关键词</label>' +
    '<span aria-hidden="true">⌕</span><input id="global-query" type="search" name="q" placeholder="例如：函数、地形、细胞膜、古诗文…" autofocus>' +
    '<button type="submit">检索</button></form>' +
    '<div class="search-options"><label for="subject-select">学科筛选</label><select id="subject-select"><option value="all">全部学科</option></select>' +
    '<span id="result-count" role="status">输入关键词开始检索</span></div>' +
    '<div id="search-results" class="search-result-list"></div><div id="search-empty" class="empty-state" hidden>暂无匹配结果。可以尝试更短的关键词或切换学科。</div>' +
    '</div></div>';
  return shell({ title:'知识检索', depth:1, current:'search', body, script:'search.js' });
}

export function archivePage(subjects, notice) {
  const body = '<div class="container page-top"><nav class="breadcrumbs" aria-label="面包屑"><a href="../">首页</a><span>/</span><span>资料归档</span></nav>' +
    '<div class="page-heading"><span class="eyebrow">DOCUMENT ARCHIVE</span><h1>资料归档与学科索引</h1>' +
    '<p>保留旧版大纲的完整下载入口，并明确标注资料尚未逐份完成版本核验。</p></div>' +
    '<div class="page-note"><span aria-hidden="true">ⓘ</span><span>' + escapeHtml(notice) + '</span></div>' +
    '<div class="archive-table-wrap"><table class="archive-table"><thead><tr><th scope="col">学科资料</th><th scope="col">资料类型</th><th scope="col">核验状态</th><th scope="col">访问</th></tr></thead><tbody>' +
    subjects.map(subject => '<tr><td><strong>' + escapeHtml(subject.name) + '</strong><small>' + escapeHtml(subject.en) + '</small></td>' +
      '<td>历史考试大纲资料</td><td><span class="status-dot"></span>待版本核验</td><td><a href="../subjects/' + subject.id + '/">知识目录</a>' +
      '<a href="../documents/' + subject.id + '.pdf" download>下载 PDF ↗</a></td></tr>').join('') +
    '<tr><td><strong>高考总纲（历史）</strong><small>Overview</small></td><td>历史总纲资料</td>' +
    '<td><span class="status-dot"></span>待版本核验</td><td><a href="../documents/overview.pdf" download>下载 PDF ↗</a></td></tr>' +
    '</tbody></table></div></div>';
  return shell({ title:'资料归档', depth:1, current:'archive', body });
}

export function aboutPage(notice) {
  const body = '<div class="container page-top"><nav class="breadcrumbs" aria-label="面包屑"><a href="../">首页</a><span>/</span><span>关于项目</span></nav>' +
    '<div class="page-heading"><span class="eyebrow">ABOUT THE PROJECT</span><h1>关于学纲 Atlas</h1><p>一个公开、轻量、以知识结构和资料追溯为中心的高考内容索引项目。</p></div>' +
    '<div class="about-grid"><article class="prose-card"><h2>资料状态</h2><p>' + escapeHtml(notice) + '</p>' +
    '<p>本站保留的文理科数学、旧版选修模块等分类具有历史研究价值，但不应视为当下所有省市的考试范围。使用前请查阅所在省份教育考试院与当年正式文件。</p></article>' +
    '<article class="prose-card"><h2>目前已提供</h2><p>10 份学科知识目录、全站全文筛选、逐级内容展开、原始 PDF 下载、浏览器本地阅读标记及移动端适配。</p>' +
    '<p>阅读标记只存储在当前浏览器，不需要账号，也不会同步到服务器。</p></article>' +
    '<article class="prose-card"><h2>未完成的工作</h2><p>原始 PDF 的发布机构、发布时间、适用省份和对应页码尚待逐份核验。暂不提供“官方最新版”“最新考试范围”或准确的地区匹配声明。</p></article>' +
    '<article class="prose-card"><h2>参与改进</h2><p>欢迎报告错误链接、知识遗漏及数据来源问题。任何内容更新都应提供可公开验证的来源及变更理由。</p>' +
    '<a class="subtle-link" href="https://github.com/1998x-stack/GaoKaoWeb/issues" target="_blank" rel="noopener noreferrer">GitHub Issues ↗</a></article></div></div>';
  return shell({ title:'关于与使用说明', depth:1, current:'about', body });
}

export function sourcesPage(registry) {
  const docById = new Map(registry.officialDocuments.map(entry => [entry.id, entry]));
  const rows = registry.localDocuments.map(doc => {
    const context = docById.get(doc.officialCatalogContextId);
    const name = doc.title;
    const anchor = doc.id.replace(/^local-/, '');
    return '<tr id="doc-' + escapeHtml(anchor) + '">' +
      '<td><strong>' + escapeHtml(name) + '</strong>' +
      '<small>本地归档 · ' + doc.pages + ' 页</small></td>' +
      '<td><a href="' + escapeHtml(context.officialUrl) + '" target="_blank" rel="noopener noreferrer">' +
      '2019 年官方学科目录 ↗</a><small>官方条目发布日期：' + escapeHtml(context.publishedAt) + '</small></td>' +
      '<td><span class="status-dot"></span>本地原件尚未比对<small>地区与本地发布日期：未知</small></td>' +
      '<td><a href="../' + escapeHtml(doc.file) + '">查看仓库 PDF ↗</a>' +
      '<small class="hash-prefix" title="' + escapeHtml(doc.sha256) + '">SHA-256 ' + escapeHtml(doc.sha256.slice(0, 12)) + '…</small></td>' +
      '</tr>';
  }).join('');
  const other = registry.otherOfficialSources.map(source =>
    '<article class="prose-card"><h2>' + escapeHtml(source.title) + '</h2>' +
    '<p>教育部 · ' + escapeHtml(source.publishedAt) + ' · ' + escapeHtml(source.documentNo) + '</p>' +
    '<p>该文件作为课程政策背景登记，不等于现有 269 个知识节点已经逐一匹配到现行课程标准。</p>' +
    '<a class="subtle-link" href="' + escapeHtml(source.officialUrl) + '" target="_blank" rel="noopener noreferrer">查看教育部官方公告 ↗</a></article>'
  ).join('');
  const body = '<div class="container page-top">' +
    '<nav class="breadcrumbs" aria-label="面包屑"><a href="../">首页</a><span>/</span><span>来源核验</span></nav>' +
    '<div class="page-heading"><span class="eyebrow">SOURCE PROVENANCE</span><h1>来源证据与版本管理</h1>' +
    '<p>官方发布记录和仓库中的本地 PDF 是两个不同的证据实体。只有核对原件后才能确认它们为同一版本。</p></div>' +
    '<div class="provenance-grid">' +
    '<div class="provenance-stat"><strong>11</strong><span>官方历史考纲入口（已确认网页）</span></div>' +
    '<div class="provenance-stat"><strong>11</strong><span>仓库 PDF（已记录哈希及页数）</span></div>' +
    '<div class="provenance-stat"><strong>0</strong><span>与官网原件一致性已核验</span></div>' +
    '</div>' +
    '<div class="page-note"><span>ⓘ</span><span>' + escapeHtml(registry.policy.disclosure) +
    ' ' + escapeHtml(registry.policy.candidateMeaning) + '</span></div>' +
    '<section class="source-guide"><h2>证据如何分级？</h2><div class="source-guide-grid">' +
    '<div><strong>已核验官方目录</strong><p>仅表示官网存在该学科与发布日期，不表明仓库 PDF 与其相同。</p></div>' +
    '<div><strong>本地 PDF 文本匹配</strong><p>以本地 PDF 页码和提取文本进行精确匹配；页码为程序建议，尚未经人工审查。</p></div>' +
    '<div><strong>未匹配 / 待复核</strong><p>不能定位到页码时不猜测，不能填入官方发布年份、地区或已审定状态。</p></div>' +
    '</div></section>' +
    '<section class="source-index"><div class="section-heading"><div><span class="eyebrow">DOCUMENT REGISTRY</span><h2>各学科资料清单</h2>' +
    '<p>2019 年全国考试大纲为历史参考，不保证适用于2026年考试或特定省份。</p></div></div>' +
    '<div class="archive-table-wrap"><table class="archive-table"><thead><tr><th>本地文档</th><th>相关官方目录</th><th>核验状态</th><th>文件与指纹</th></tr></thead><tbody>' +
    rows + '</tbody></table></div></section>' +
    '<section class="source-policy"><div class="section-heading"><div><span class="eyebrow">CURRENT POLICY CONTEXT</span><h2>现行课程标准相关依据</h2></div></div>' +
    '<div class="about-grid">' + other + '</div></section></div>';
  return shell({title:'来源与证据核验',depth:1,current:'sources',body});
}

export function legacyRedirect(destination) {
  const safe = escapeHtml(destination);
  return '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8">' +
    '<meta http-equiv="refresh" content="0;url=' + safe + '"><meta name="robots" content="noindex">' +
    '<title>页面已迁移</title></head><body><p>页面已迁移，<a href="' + safe + '">点击前往新版页面</a>。</p></body></html>\n';
}
