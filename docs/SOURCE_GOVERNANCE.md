# 来源、页码与版权治理操作规范

> 当前实现：V1.1 本地证据链；V1.3 仅有候选元数据及权限规则。发布日期、地区、原件、页码、使用权和教学正确性**不可合并为一个 verified 标签**。

## 1. 六个相互独立的证明对象

| 证明对象 | 证据 | 当前允许的声明 |
|---|---|---|
| 官网网页存在 | 官方 URL、发布主体、查询记录 | 官方目录或报道链接存在（非等同原卷） |
| 本地 PDF 文件完整性 | SHA-256、页数、文件名称 | 已锁定当前仓库版本；不证明来自官网 |
| 本地页码文本匹配 | Poppler 文本抽取、具体匹配短语、页码 | **候选页码；未经人工确认** |
| 官方原件同一性 | 官方二进制文件或逐页图像对照 + 审核记录 | 目前**未完成** |
| 内容使用权 | 作者/权利人、许可协议、许可范围、有效期 | 当前历史 PDF 的再分发授权**未确证** |
| 教学适用性 | 课程标准/省份年份/卷型/知识节点对照与教师审核 | 旧 2019 考纲不自动成为现行考试范围 |

官网发布日期不可复制成仓库 PDF 的发布日期，PDF CreationDate 也不代表正式文件发布日。

## 2. 当前真实的数据管线

- content/sources.json：11 份本地文件和 11 个关联官方目录的登记信息。
- content/pdf-evidence-locations.json：按规范化节点遍历序号保存的本地页码证据缓存；从旧版本 PDF 文本抽取回填而来，保留人工未审的语义。
- 正常 npm run build：不调用系统 PDF 工具；核对 PDF SHA-256，读取缓存并重建 269 节点的 provenance 及页码候选。
- CI 独立 npm run audit:pdf：需要 Poppler；对 11 份 PDF 重新抽取文本、计算候选页码并**逐节点精确比较**，发现哈希或候选偏移即失败。
- 现有构建记录为 116 个节点有页码候选、134 条候选；数量会随**经过审核的**源数据修订而变化，不可作为永久应有常数。
- Vercel 静态部署不需要 pdfinfo/pdftotext；CI 原件核验不能因 Vercel 成功而省略。

## 3. 内容状态建议（V1.3 完整后台仍未实现）

| 维度 | 状态 |
|---|---|
| Source | discovered → URL_checked → issuer_reviewed → reviewed / withdrawn |
| Local PDF | unverified_local_copy → official_binary_compared / page_reviewed / withdrawn |
| PageCandidate | unreviewed → reviewer_confirmed / rejected |
| Rights | not_established → documented_grant → expired/revoked |
| Pedagogy | draft → solution_reviewed → taxonomy_reviewed → approved |
| Scope | historical_reference → assessed_for_specific_profile → applicable / not_applicable |

建议引入 append-only 审核事件记录，含 actor、time、old/new、source hash、grant id、reason；任何页面、练习包、搜索、AI 缓存都必须随下架同步失效。

## 4. 来源入库操作

1. 记录 URL、网页标题、发布机构、网页显示的发布日期、实际访问时间、内容类型（新闻/评析/试卷/标准）。
2. 校验真实域名和网页内容。若是官方试卷评析，kind 必须是 exam_review，不能换成 official_exam_paper。
3. 明确地区（如 SH）与年份；未知需保留 unknown/空状态和复核标识，不能默认 CN 全部省份适用。
4. 拆分来源认证与版权认证；无明确授权只发布自编元数据 + 跳转原网页，不保存试卷/解析正文。
5. 建立资源-知识点映射时必须记录“候选/人工审定”及课程标准版本。
6. 对教师或作者提交的内容保留原创声明、引用素材清单、可发布协议、审题人、纠错版本。

## 5. 原始 PDF 对照与授权复查

- 先取得合法可访问的官网原件（避免绕过登录/反爬限制）。
- 记录官方文件的确切版本/地区/页码、下载时间与 SHA-256。
- 若官方资源以图片形式展示，则经权限允许后人工逐页对照标题、正文、附录；不能以归一化文字相似即判断原件一致。
- 通过复核后引用具体 page/section 和证据定位，保留审核人及时间；与当前 unreviewed 缓存分离。
- PDF 中存在的试题、插画、课件、出版社素材应另核权；源文件中含有它们不意味着具备公共复制许可。

## 6. V1.3 公开发布准入

当前 src/resources/rights-policy.mjs 已对新资源草案执行默认拒绝：未建立正文展示权、不存在审核者记录、撤销权限或仅外链时，不得发布完整受保护内容。这是**代码基础规则**，不是一套已部署的内容后台，也不代替法律审核。

详细执行见 [资源审核流程](V1.3_EDITORIAL_OPERATIONS.md)；机器字段见 [数据词典](V1.3_DATA_DICTIONARY.md)。

## 7. 对外来源链接

- [2019 高考历史大纲（中国教育考试网）](https://gaokao.neea.edu.cn/xhtml1/category/1509/6212-1.htm)
- [教育部 2020 普通高中课程标准修订通知](https://www.moe.gov.cn/srcsite/A26/s8001/202006/t20200603_462199.html)
- [教育部 2024 资源审核规范](https://www.moe.gov.cn/srcsite/A16/s3342/202407/t20240703_1139248.html)
- [教育部 2024 资源入库出库规范](https://hudong.moe.gov.cn/srcsite/A16/s3342/202407/t20240703_1139249.html)

这些规范的法定适用主体与本站自身责任应分别识别；此处参考其质量管理要求，不声称本站已成为国家智慧教育平台。
