# V1.1 来源治理与证据追溯

## 四种不可混淆的事实

1. 官网大纲目录和发布日期：仅用于证明 2019 年官方目录记录。
2. 仓库本地 PDF：通过 SHA256、页数、CreationDate 元数据标识；CreationDate 不能推定文件正式发布日期。
3. 本地 PDF 页码候选：用 pdftotext + Unicode NFKC 规范化进行精确短语匹配，所有候选都未人工复核。
4. 仓库 PDF 与官网原件的同一性：未核验，绝不可因标题相似或 PDF 创建时间就宣称一致。

## 官方法源

- https://gaokao.neea.edu.cn/xhtml1/category/1509/6212-1.htm
- https://www.neea.edu.cn/xhtml1/report/19012/153-1.htm
- https://www.moe.gov.cn/srcsite/A26/s8001/202006/t20200603_462199.html

官方 2019 考试大纲日期：2019-01-31。共 11 个官方目录记录（10 个学科和总纲）；2020 年课程标准修订通知只作为背景资料，不作为知识节点已完成对齐的证据。

## 数据结构

- content/sources.json：source registry，包含官方目录 URL、发布日期、历史全国参考用途、本地 PDF 的 SHA256、页码总数、初始验证状态。
- dist/data/sources.json：构建产出的证据目录及 PDF 文本可提取性摘要。
- dist/data/{subject}.json：每个 node.provenance 关联本地 PDF ID、相关官方目录 ID、位置状态、pageCandidates 列表。
- pageCandidate：1-based page、精确命中短语 anchor、matchMethod、reviewStatus=unreviewed。

构建时强制 PDF SHA256 和页数比对，不一致就停止。仅对长度 >= 8 的归一化原文短语进行逐页精确匹配；无匹配则 no_page_match，不能自动补写页码。每个节点均记录对应的本地 PDF ID，即使没有页码命中。

## 状态语义

- verified_on_official_website：仅用于官方目录网页真实存在。
- unverified_local_copy：本地 PDF 状态。
- candidate_page_match_unreviewed：本地 PDF 机器候选页码。
- no_page_match：没有足够页码证据。
- 尚无任何 PDF 获得 confirmed_same_as_official 或人工审定页码状态。

## 人工核验流程

人工核验需要下载并比对官网正式文件的每页原文或图像，审核版本、地域适用性和来源许可。完成后需提供正式原件链接、比对证明、审核人、审核时间、文件 SHA256、具体页码和原文证据，才可提升验证等级。V1.1 不自动进行这类升级。

## CI 和验收

需要 Node.js 20+ 和 poppler-utils（pdfinfo, pdftotext）。
执行 npm run verify 检查源码语法、9 项自动测试、构建所有页面、资料指纹、来源完整性和页码范围。页面只发布生成的 dist/。

## 未解决事项

- 官方原始 PDF 与本地仓库文件逐页比对与再分发授权。
- 各省每年考法和课程标准范围的认证映射。
- 机器页码候选的教师/编辑人工审定。
- 真实浏览器跨设备 E2E 与 PDF 浏览器页码交互测试。
