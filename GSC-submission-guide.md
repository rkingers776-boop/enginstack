# EnginStack — Google Search Console 提交清单（GSC）

> 目的：让 Google 完整收录 284 个页面（含新增的 Force/Frequency/Density/Flow-rate/Electric 类别和 24 篇指南）。
> 前置：本地代码已部署到 Cloudflare Pages（已完成）。

## 步骤 1：验证域名所有权

1. 打开 https://search.google.com/search-console
2. 点击「立即开始」→ 选择**网域**类型（Domain）
3. 输入：`enginstack.com`
4. Google 会给出 DNS TXT 记录验证码，例如 `google-site-verification=xxxx`
5. 到 Cloudflare 控制台 → 你的域名 → **DNS** → 添加记录：
   - 类型：`TXT`
   - 名称：`enginstack.com`（或留空用 @）
   - 内容：粘贴 Google 给的验证码
6. 回到 GSC 点「验证」——生效一般需几分钟

> 备选：选「网址前缀」类型 + 输入 `https://enginstack.com/`，用 HTML 文件验证更简单（把 Google 给的 html 文件放进站点根目录重新部署即可）。

## 步骤 2：提交 sitemap

1. 验证成功后进入 GSC 控制台
2. 左侧菜单 → **Sitemap**（站点地图）
3. 输入：`sitemap.xml`
4. 点击「提交」
5. 等待状态从「无法获取」→「成功」（一般 1-2 小时，首次可能 1-2 天）

## 步骤 3：请求收录关键页面（可选，加速）

1. 左侧 → **网址检查**（URL Inspection）
2. 输入 `https://enginstack.com/` → 等检查完成
3. 点击「**请求编入索引**」（Request Indexing）
4. 重点页面优先请求：
   - `https://enginstack.com/`
   - `https://enginstack.com/force/`
   - `https://enginstack.com/frequency/`
   - `https://enginstack.com/density/`
   - `https://enginstack.com/flow-rate/`
   - `https://enginstack.com/electric/`
   - 24 篇指南中选 3-4 篇最核心的（如 why-america-doesnt-use-metric-system、force-conversion-guide）
5. 每个 URL 每天最多请求 1 次

## 步骤 4：查看收录进度（提交后 3-7 天）

- 左侧 → **索引**（Indexing）→ 页面
- 关注「有效」页面数：应从 0 逐步增长到 280+
- 常见状态：
  - **已发现 - 尚未编入索引**：正常，等 Google 爬取
  - **已抓取 - 尚未编入索引**：可能页面被认为不够重要，加内链
  - **排除**：点开看原因（404/noindex 等）

## 验证 Google 是否抓到新页面

在 Google 搜索：`site:enginstack.com`
- 结果数应逐步增长
- 出现 `force/`、`density/`、`flow-rate/` 等目录 = 新内容已收录

## 常见问题

| 问题 | 解决 |
|---|---|
| sitemap 显示「无法获取」 | 检查 sitemap.xml 是否 200 可访问（https://enginstack.com/sitemap.xml） |
| 验证码不生效 | DNS TXT 记录保存后等 5-10 分钟再验证 |
| 请求编入索引按钮灰色 | 每天配额用完了，第二天再试 |
| 页面一直不收录 | 确认 robots.txt 未屏蔽 Googlebot（当前已 Allow，正常） |
