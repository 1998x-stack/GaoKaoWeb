# 学纲 Atlas · GaoKaoWeb

面向历史高考资料的**可检索知识地图**：10 门学科、层级展开、全文检索、原始 PDF 归档与本地阅读进度。

> **重要资料提示**：项目现有 PDF 与条目尚未逐份完成官方版本、年份和地区适用性核验。这里的历史文理科数学与旧选修模块**不代表当年现行高考考试范围**。正式备考请查询本省教育考试院及最新课程标准、考试说明。

## 本轮重构

- 新首页：知识地图式导航，按学科群组筛选，快速进入全局搜索。
- 学科详情：自动生成分类，递归展示任意深度的知识树，全部展开/折叠、全文筛选。
- 阅读标记：顶层主题的阅读状态保存在浏览器 localStorage，不需要账号。
- 搜索：无需服务器的跨学科索引，按标题相关性排序，链接定位到对应主题。
- 归档：原始 PDF 集中入口，显示“历史资料 · 待核验”标识。
- 兼容：保留旧学科 HTML / PDF URL，旧 HTML 入口重定向至新版学科。
- 部署：Node.js 内置模块构建，无第三方运行依赖；CI 运行测试、构建及链接校验，Pages 仅发布 dist。
- 安全：内容通过 textContent 展示，不把知识字段当 HTML 插入。

## 运行

需要 Node.js 20+（推荐 22），不需要安装额外依赖：

~~~bash
npm run verify
cd dist && python3 -m http.server 8000
~~~

在浏览器打开 http://localhost:8000 。不建议通过 file:// 直接打开生成页面，因为搜索和学科内容使用 fetch 加载 JSON。

## 新目录

~~~text
content/catalog.json         # 学科元信息，统一历史资料标识
src/model.mjs                # 旧数据读取、递归规范化、检索索引
src/templates.mjs            # 可复用页面模板
src/site.css                 # Design tokens + 统一页面样式
src/site.js                  # 全局导航、主题、首页筛选
src/subject.js               # 学科递归知识树和阅读状态
src/search.js                # 全站静态搜索
scripts/build.mjs            # 生成 dist，复制原始文档及兼容页面
scripts/check.mjs            # 检查站内链接、文档与清单
tests/site.test.mjs          # 数据无损迁移与递归层级测试
Biology/ ... ScienceMath/    # 原始学科数据（保留，不覆写）
Principle/                  # 历史总纲 PDF
dist/                       # 自动生成，禁止手工修改
~~~

## 内容治理

当前所有资料声明为 historical_unverified。这不意味着每个文件都发表于同一年；需要逐份核验发布机构、年份、适用范围、来源 URL、版本、页码后才能升级状态。

任何下一版本如果标注“现行”或“最新”，必须提供对应官方来源和适用考试地区。详见 docs/ARCHITECTURE.md。

## 设计研究

参考 Khan Academy 的“学科 → 单元 → 知识点”发现路径，以及国家中小学智慧教育平台按资源和学科进行分类的方式。只吸收信息架构思想，不复制界面、插画或受版权保护的课程内容。

## 发布与开发

- 开发分支：feat/knowledge-hub-rebuild。
- Pull Request：ci.yml 验证并上传 dist 构建产物。
- 主分支：pages.yml 测试通过后发布 GitHub Pages。
- 原始资产：旧版 data.js 和 PDF 保留，支持无损迁移和回归测试。

代码许可和原始 PDF 许可应分别确定。PDF 与外部文件不能因代码许可证而推定可自由再分发。

## V1.1 来源核验（历史资料）

新增 /sources/ 来源核验中心、11 份本地 PDF 的页数与 SHA-256 登记、11 个中国教育考试网 2019 年官方目录，以及教育部 2020 年课程标准通知记录。

每个知识节点绑定来源文件 ID；部分节点显示通过本地 PDF 文本精确匹配找到的候选页码和 PDF 跳转链接。所有页码命中都只是机器建议、未经人工复核，不能证明仓库 PDF 与官方原件一致。

构建需要 poppler-utils (pdfinfo/pdftotext)。更多信息见 docs/SOURCE_GOVERNANCE.md。


## V1.2 独立知识页与本地学习中心

- /topics/{subjectId}/{nodeId}/ 为全部知识节点生成独立可分享的静态 URL。
- /learning/ 展示 10 学科的学习标记覆盖率、收藏夹、近期阅读、本地 JSON 导出和主动确认后清空。
- 中文检索使用浏览器 Intl.Segmenter + 汉字二元/三元切分 + 字段加权 BM25，支持标题优先和学科筛选。
- 目录父子/相邻主题是有源结构关系；标题相似仅供探索，不代表官方教学先修关系。
- 阅读状态仅存在本地浏览器。V1.0 已标记的一级主题自动迁移，不自动标记下级主题完成。

## Vercel static deployment compatibility

The normal Node.js build now uses pinned, independently audited page-location evidence and does not call pdfinfo/pdftotext. Both PDF checksums and the full knowledge graph remain validated. CI runs npm run audit:pdf with Poppler before building. Vercel serves only dist via vercel.json. See docs/VERCEL_DEPLOYMENT.md.

## V1.3 教学资源体系：深度调研与设计阶段

当前仅提交产品架构、证据来源候选、题型分类草案、来源与版权发布审核代码、AI 可引用证据门槛；**未公开第三方真题正文，未上线教师工作台或 AI 问答。**

- [深度调研与合法来源核验](docs/V1.3_RESEARCH_RIGHTS.md)
- [产品 / 数据模型 / 前后端 / 教师与学生工作流 / 阶段验收](docs/V1.3_SYSTEM_ARCHITECTURE.md)
- [AI 问答证据约束和评测方案](docs/V1.3_AI_EVIDENCE_GATES.md)
- [来源候选登记](content/v1.3/source-candidates.json)
- [资源契约 JSON Schema](schemas/v1.3/resource.schema.json)
- [数学分类和三个专题试点](content/v1.3/mathematics-taxonomy.json)

运行 `npm run check:v13` 验证来源候选无题干全文、没有把官方评析标为原卷且未经授权不准入正文；`npm run verify` 包含 V1.3 合规门槛单测。
