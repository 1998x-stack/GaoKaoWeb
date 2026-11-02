# GaoKaoWeb 系统架构（已实现与规划严格分离）

状态基线：2026-11-02。详细 V1.3 业务设计在 [V1.3_SYSTEM_ARCHITECTURE.md](V1.3_SYSTEM_ARCHITECTURE.md)，这里记录**当前仓库可复现的代码架构**。

## 1. 当前结构与数据流

~~~text
10 份旧学科 data.js                  content/catalog.json
           │                                   │
           └───────── src/model.mjs ───────────┘
                         │
              递归知识树（269 节点）
                         │
       ┌─────────────────┼─────────────────────┐
       │                 │                     │
  src/knowledge.mjs  src/search-core.mjs  src/provenance.mjs
  类型化目录关系      中文切词 + BM25      来源、哈希、页码缓存
       │                 │                     │
       └─────────────────┼─────────────────────┘
                         │
                   scripts/build.mjs
                         │
               dist/ (静态 HTML + JSON + PDF)
                         │
            GitHub Pages / Vercel (dist)
~~~

正常构建的 PDF 页码证据来自 content/pdf-evidence-locations.json；构建时**仍校验全部 PDF SHA-256**，但不运行 Poppler。CI 独立运行 npm run audit:pdf，从原文件逐页重新计算匹配并与缓存比较。此证据仅属于本地文件，不可升格为官方原件页码。

## 2. 当前公开路由

| 路由 | 实现状态 | 数据源 |
|---|---|---|
| / | 已实现：学科导航 | catalog |
| /subjects/:slug/ | 已实现：层级知识树 | 各学科 data.json |
| /topics/:subjectId/:nodeId/ | 已实现：独立知识页 | 知识树、证据、关联图 |
| /search/ | 已实现：中文搜索 | search-index.json |
| /learning/ | 已实现：收藏和阅读进度 | 本地 localStorage |
| /archive/ | 已实现：历史资料 | 本地 PDF |
| /sources/ | 已实现：来源状态 | sources.json |
| /exams/, /practice/, /teach/, /paths/, /ask/ | **未实现**：V1.3 后续路由 | 禁止提前宣称 |

V1.2 节点 ID 是历史结构序列 ID；在下一次迁移时应建立 immutableTopicId 与旧 ID 的 alias 映射，否则目录重排可能改变 URL。**尚未实施该迁移**。

## 3. 模块边界

- Build-time 读取原始 data.js 并生成静态页面；不在浏览器执行原始课程脚本。
- V1.2 客户端依赖浏览器原生 Intl.Segmenter / localStorage；本地状态无服务端持久化。未知/受限存储应按优雅降级处理。
- V1.3-design src/resources/rights-policy.mjs 只验证资源元数据和准入状态；**尚未建立持久的私有资源审核后台**。
- 正式的来源、题目、课程方案等实体必须经审核后从独立数据层构建，不可直接混入历史知识 JSON。

## 4. 可信边界与失效策略

1. 真实性：官方网页、仓库 PDF、PDF 页码候选、教师审核是不同证据等级。
2. 使用权：sourceUrl 公开并不授予题干、图片或解析的转载、分发或 AI 处理权。
3. 教学质量：教师或独立校核者验证答案、难度、知识映射；机器标签只是建议。
4. 适用性：年份、地区、课程标准版本与卷别必须绑定证据。Unknown 不得默认为全国适用。
5. 撤回：取消授权后须阻断页面、导出、搜索索引、缓存与 AI 索引；此流程仍待实施。
6. 隐私：V1.2 浏览器收藏/阅读标记不同于未来学生诊断、班级名单或成绩档案；后者必须先完成权限与隐私设计。

## 5. 性能与验证实际边界

- 已有 Node 测试、链接校验、PDF 内容缓存审计与可重复静态构建。
- **未完成**真实 HTTP 浏览器端 E2E、全平台屏幕阅读器实测、完整视觉回归、独立数学题目评估。
- V1.3 独立验收应由测试运行器、资源审核者与评测器三种角色分离。见 [V1.3_TEST_STRATEGY.md](V1.3_TEST_STRATEGY.md)。

## 6. 后续架构

参见 [V1.3_SYSTEM_ARCHITECTURE.md](V1.3_SYSTEM_ARCHITECTURE.md)：先实现无需后台的官方资料元数据与原创题目，后扩展教师工作台、学习路线，再根据证据与授权门槛引入服务端 AI。API 密钥绝不能出现在静态站点里。
