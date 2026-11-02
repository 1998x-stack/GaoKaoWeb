# 部署、来源审计与故障处理

版本基线：2026-11-02。普通静态构建在 GitHub Pages 和 Vercel 均应使用 dist；默认无服务端 API。

## 1. 可复制命令

~~~bash
# 最小构建（不需要 Poppler）
node --version
npm run build
npm run check

# 完整开发验收
npm run verify

# 独立核验历史 PDF 的页码证据（需要系统安装 Poppler）
npm run audit:pdf

# 本地预览
cd dist
python3 -m http.server 8000
~~~

build 产生 dist；check 校验站内链接、节点来源、PDF 哈希、269 节点完整性和详情页。verify 含 V1.3 候选登记约束，但**没有**替代真实浏览器端 E2E。

## 2. 关键配置

根目录 vercel.json：framework = null，buildCommand = npm run build，outputDirectory = dist，trailingSlash = true。Vercel 项目 Root Directory 应设置为仓库根目录，不能依赖一份被忽略的子目录文件。

GitHub Actions：
- ci.yml 验证 PR 并保存静态构建预览产物。
- pages.yml 只有推送到 main 才执行部署；审核和主分支同步由合并流程负责。
- GitHub runner 安装 Poppler、运行 audit:pdf，再执行 npm run verify。
- Vercel 普通构建不安装 Poppler；用已有 cache 重建页码候选，同时验证 PDF SHA-256。**若缓存更新，必须先在 Poppler CI 中完整核验。**

## 3. 为什么设计了两套 PDF 检查

V1.1 早期在 build 内直接调用 pdfinfo/pdftotext，存在 Vercel 环境依赖缺失风险。修复后部署构建只运行 Node，而 CI 专门核验缓存与实际 PDF 内容逐节点相等。历史 Vercel 失败日志未由此文档直接获取，因此不能把平台错误文本假设为事实。

## 4. 故障分诊

| 现象 | 首先检查 | 处理 |
|---|---|---|
| Vercel build 失败 | Vercel deployment log、vercel.json、项目 Root Directory | 核对 Node 版本和生成目录；不能只因为 CI 成功就认定 Vercel 成功 |
| PDF fingerprint mismatch | content/sources.json，原始 PDF 的 SHA256 | **禁止绕过检查**；确认是否合法更新，再重新做来源审核和缓存核验 |
| audit:pdf 不通过 | Poppler、原始 PDF、匹配短语缓存 | 对照页码与字符规范化规则；CI 未通过不可发布 |
| 页面 404 | dist 对应 index.html、trailing slash、旧 URL 兼容规则 | 修复静态构建和站内路径 |
| 主题页 JSON / 搜索失效 | 浏览器 Network、站点 Base URL、data 搜索索引 | 不把 file:// 打开失败误报为部署问题 |
| 权限或旧版数据已撤回 | 权利记录和发布清单 | 下架公开资源，并重建所有可缓存产物 |

## 5. 发布记录与回滚

发布登记至少记录：Git commit SHA、分支、数据模式/来源登记版本、CI 运行链接、Vercel/GitHub Pages 发布编号、已审核资源数、撤回清单、部署 URL、回滚 SHA 与验证人。

rollback 不得恢复已经明确撤销版权的内容；恢复旧版本之前须先检验其授权清单。不得把“预览部署成功”写成正式生产发布。

## 6. 安全边界

V1.3 若引入 AI，密钥只能在服务端托管；当前静态站没有经过权限审核的学生帐号或班级存储服务。对原站不明许可的真题不要镜像到 dist 或 CDN。

参见 [来源治理](SOURCE_GOVERNANCE.md) 与 [V1.3 测试策略](V1.3_TEST_STRATEGY.md)。
