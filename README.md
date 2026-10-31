# garwoo-site

格物 Garwoo 官网（个人版）。公开仓。产品代码、方案文档和出网清单契约在产品仓 `industrial-ai`（私有）；本仓只放官网。

状态：原型的 16 页已全部迁入，文字与原型逐行一致，门禁通过；预览站构建可用。迁移计划见产品仓 `docs/plans/2026-10-31-格物官网独立仓-garwoo-site初始化与原型迁移计划.md`。

## 构建

Node 22，进入 `site/` 后执行 `npm ci`、`npm test`、`npm run check`。Windows 上可以直接双击 `run.bat`。

- `npm run build:pages`：GitHub Pages 预览，子路径 `/garwoo-site/`，产物 `dist/pages/`。`robots.txt` 为 `Disallow: /`。
- `SITE_PREVIEW=true WWW_ORIGIN=https://www.garwoo.example npm run build:www`：生产形态（根路径 `/`），占位域名只允许用于评审；产物 `dist/www/`。
- `WWW_ORIGIN=https://www.garwoo.cn npm run build:www`：正式域名构建。域名与 ICP 备案（品牌迁移方案 G0）完成前不要上线。
- PowerShell：先设置 `$env:SITE_MODE='www'` 和 `$env:WWW_ORIGIN='…'`，再执行命令。

`ACCOUNT_ORIGIN`、`DOWNLOAD_ORIGIN` 只接受 HTTPS 源地址，尚未开放时留空。所有站内链接用部署无关的根路径：Astro 里调用 `href()`，Markdown 链接由构建插件补当前 base。

## 门禁

`npm run build:*` 依次执行：Astro 构建 → 字体子集（按站内实际用字）→ 去敏与链接检查（`check-sensitive`）→ 产物检查（`check-site`：过期宣称、死链、本地端点、`robots.txt` 策略）。`npm test` 覆盖站点目标与产物策略的反例。

本仓是公开仓：不要放内网地址、本机路径、私有仓名、口令或密钥，也不要把产品仓方案文档的原文拷进来。

## 与产品仓的关系

- 产品仓不依赖本仓，也不读本仓源码；它只在 `repos.json` 里钉版本。
- 出网清单由产品仓拥有（`contracts/personal-egress.json`），本仓的 `site/src/data/personal-egress.json` 是副本，由产品仓 `scripts/repos/repos.py check` 校验一致。
- 术语、禁用词和口吻以产品仓的统一话术总表为准。本仓的禁用词表是它的副本，话术总表变化时手动同步。

## 发布

`deploy/deploy.ps1` 与 `deploy/remote-install.sh` 是从 `iai-pages` 改来的，尚未在真实主机上验证，G5 之前不使用。素材（吉祥物、字标）目前是占位稿，不授权复用。

## 上线前必须完成

当前站点是预览形态（`robots.txt` 与 `<meta name="robots">` 都不让收录），以下事项没做完之前不要用正式域名构建发布：

- **真实截图。** 页面里的产品界面是 HTML 画的示意，不是真实截图。产品内显示名改为“格物”之前，客户端界面仍写着旧名称，截图会与官网品牌不符；对话类截图还要用真实模型的回答。
- **正式品牌资产。** 吉祥物、字标是占位稿。
- **域名与备案。** `garwoo.cn` 的 ICP 备案号、页脚备案位。
- **预约演示、注册与购买。** 目前没有提交端点，企业页的预约表单是禁用状态，不放登录入口。
- **联系方式与运营主体。** 关于页写“备案完成后公布”。

重新生成 OG 图与 favicon 位图：在 `site/` 下执行 `node scripts/make-og.mjs`（需要系统里有中文黑体）。
