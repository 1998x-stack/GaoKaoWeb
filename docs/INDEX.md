# GaoKaoWeb 文档中心

更新：2026-11-02。**区分已实现的 V1.0–V1.2 网站、已提交的 V1.3 数据/权限代码与尚未上线的 V1.3 教学业务。** 请按角色查阅，不把规划目标当作验收结果。

| 角色 | 文档 |
|---|---|
| 开发与架构 | [README](../README.md)、[当前架构](ARCHITECTURE.md)、[V1.3 系统设计](V1.3_SYSTEM_ARCHITECTURE.md)、[数据词典](V1.3_DATA_DICTIONARY.md) |
| 产品与设计 | [路线图](ROADMAP.md)、[交互规范](DESIGN_ENHANCEMENTS.md)、[学习路线](V1.3_LEARNING_PATHS.md) |
| 教师和教研 | [十学科资源指南](subjects/INDEX.md)、[数学题型](V1.3_QUESTION_TAXONOMY.md)、[教师备课模板](V1.3_TEACHER_RESOURCES.md) |
| 来源/版权审核 | [来源治理](SOURCE_GOVERNANCE.md)、[外部研究](V1.3_RESEARCH_RIGHTS.md)、[审核操作](V1.3_EDITORIAL_OPERATIONS.md) |
| AI/评测 | [AI 证据准入](V1.3_AI_EVIDENCE_GATES.md)、[测试策略](V1.3_TEST_STRATEGY.md) |
| 发布维护 | [Vercel/GitHub Pages](VERCEL_DEPLOYMENT.md)、[发布路线图](ROADMAP.md) |

## 版本现状

- V1.0–V1.2：10 学科，269 个历史知识节点与详情页，BM25、本地进度、结构关系；官方原件一致性未全部核验。
- V1.1：11 份 PDF 指纹、116 个含本地页码候选节点和 134 条候选页码；**这些页码都不是人工确认的官方引用**。
- V1.3：5 条候选官方链接元数据、版权默认拒绝规则、数学题型草案；**发布题目数 0**，题库/备课/学习路线/AI 尚未上线。

## 文档事实标准

- **已实现**：仓库源码及可复现 CI 支持，仍应注明实际测试边界。
- **已核验**：须明确证据对象（网页、原始文件、授权、解答、地区适用性）。
- **机器候选**：存在算法匹配，但未经独立人工确认。
- **设计目标**：尚未形成用户可访问的业务系统。
- **待验证**：不允许用估计成功率、虚构评测或过期截图来替代。

当前可执行验证：npm run verify；官方 PDF 页码重新审查：npm run audit:pdf（需 Poppler）；V1.3 候选权限检查：npm run check:v13。更多参见 [测试指南](V1.3_TEST_STRATEGY.md)。

[十学科具体文档](subjects/INDEX.md) | [原始资源数据](../content/v1.3/source-candidates.json) | [数学分类草案](../content/v1.3/mathematics-taxonomy.json)
