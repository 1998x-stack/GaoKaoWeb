# 学纲 Atlas · GaoKaoWeb

面向教学与自主学习的可追溯知识地图；当前在线基础仍以**历史高考资料**为主。V1.3 的真题、教师备课、学习路线与 AI 功能处于设计/分阶段建设状态，**尚未作为完整网站功能上线**。

> 注意：仓库已有 11 份 PDF 与原始知识条目的官方原件一致性尚未逐份核实；2019 年历史考纲不能被宣传为当下任意省份或年份的考试要求。任何“官方”标签只对**具体已验证对象**成立。第三方试题与解析不因公开可访问而具备本站全文转载权。

## 先读什么

[文档总览](docs/INDEX.md) | [架构与代码地图](docs/ARCHITECTURE.md) | [路线图](docs/ROADMAP.md) | [V1.3 总体设计](docs/V1.3_SYSTEM_ARCHITECTURE.md) | [来源和版权](docs/V1.3_RESEARCH_RIGHTS.md) | [审核操作](docs/V1.3_EDITORIAL_OPERATIONS.md)

## 已实现的功能（V1.0–V1.2）

- 10 门学科、269 个知识节点、269 个独立静态详情页与可展开目录。
- 递归知识结构、上下级与相邻目录关联；标题相似推荐是**未审定的探索提示**，不是教学先修关系。
- 浏览器端中文检索：Intl.Segmenter、汉字二元/三元片段和字段加权 BM25。
- 收藏、已阅读标记、最近阅读与学科进度总览；数据仅保存在**当前浏览器**，不是账号同步或学习掌握度诊断。
- 11 份本地 PDF 指纹与来源元数据，269 条节点文档关联、116 个具有候选页码的节点和 134 条候选页码（**未人工审定**）。
- 来源核验中心与旧版 URL 兼容；页面标注历史资料及版本限制。

现有自动测试/静态构建不能证明浏览器跨设备 E2E、无障碍等级或 PDF 官方原件相同性；详见[测试矩阵](docs/V1.3_TEST_STRATEGY.md)。

## V1.3：已提交的是研究、数据契约与审核门槛，不是完整业务网站

| 子系统 | 目前 | 后续交付 |
|---|---|---|
| 官方来源候选 | 5 条元数据、官方外链、全部为 candidate | 人工复核、可发布的官方资料索引页面 |
| 版权门槛 | 默认拒绝未授权全文发布的代码与单测 | 明确许可证存证、撤回与审计流程 |
| 数学教学分类 | 导数、圆锥曲线、三角函数分类草案 | 原创/授权题目、标准解析与教师复核 |
| 教师资源 | 课程模板和设计规范 | 备课编辑、可合法导出的教学包 |
| 学习路线 | 数据协议和教学规则 | 诊断、练习、复盘、掌握度证据 |
| AI 问答 | 风险边界、证据和评测设计 | 审核通过后才试运行；默认关闭 |

[完整产品与数据架构](docs/V1.3_SYSTEM_ARCHITECTURE.md) | [数学题型规范](docs/V1.3_QUESTION_TAXONOMY.md) | [教学资源规范](docs/V1.3_TEACHER_RESOURCES.md) | [路线设计](docs/V1.3_LEARNING_PATHS.md) | [AI 证据准入](docs/V1.3_AI_EVIDENCE_GATES.md)

## 运行及验证

Node.js >=20（建议 22），普通构建不需要安装第三方 Node 包：

~~~bash
npm run verify
cd dist
python3 -m http.server 8000
~~~

打开 http://localhost:8000；不要通过 file:// 测试客户端 fetch。日常部署与 Vercel 构建**不需要** pdfinfo / pdftotext。若要重新抽查原始 PDF 证据，先安装 Poppler，然后运行：

~~~bash
npm run audit:pdf
npm run check:v13
~~~

verify 包含语法、单元测试、静态构建、内部链接与 V1.3 候选登记约束。参考 [Vercel / GitHub Pages 部署](docs/VERCEL_DEPLOYMENT.md)。

## 核心目录

~~~text
content/catalog.json                    旧学科元信息
content/sources.json                    V1.1 11 份文档的来源登记
content/pdf-evidence-locations.json     独立核验的本地页码候选缓存
content/v1.3/                          V1.3 候选源、数学分类草案
src/model.mjs                           旧数据规范化
src/knowledge.mjs                       关联图
src/search-core.mjs                     中文 BM25
src/study-store.mjs                     本地学习状态
src/resources/rights-policy.mjs         V1.3 默认拒绝版权规则
scripts/build.mjs                       dist 静态构建
scripts/check.mjs                       生成页面与数据检查
scripts/audit-pdf-evidence.mjs          Poppler 独立证据核验
scripts/check-v13.mjs                   V1.3 设计登记审核
docs/INDEX.md                           文档索引与版本事实
schemas/v1.3/                           下一阶段数据契约
dist/                                   生成物，不手工修改
~~~

## 贡献和发布

更新资源时应在 PR 中填写：来源、版权依据、年份/地区/卷别、知识点映射、人工复核结果、测试与回滚影响。外部链接不代表可下载或镜像其全文。题目/数学答案需通过教研审核后发布。不得把机器匹配候选写成“已人工验证”；发布状态和授权状态相互独立。详见 [编辑审核运营手册](docs/V1.3_EDITORIAL_OPERATIONS.md)。

代码许可证与图片、原始 PDF、第三方题目分别核验。原始文件字节不因任何 README 声明获得转载许可。

当前分支状态和 GitHub Pages 发布版本以 GitHub 上的实际 commit/PR 为准，本文不固定可能过期的分支名或部署状态。
