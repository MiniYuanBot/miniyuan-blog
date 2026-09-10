# miniyuan blog

## 写文章时的图片引用

**图片目录与内容目录一一对应**，只是把 `src/content` 换成 `public/images`：

```
src/content/note/26spring/cv-intro/07-2d-vision-1.md
public/images/note/26spring/cv-intro/07-2D-vision-1-02-receptive-field-1.png
```

文件名约定为 `<文章名>-<序号>-<描述>.<扩展名>`。正文里 **只需要写去掉「文章名前缀」
的文件名**，其余由 `src/plugins/remark-content-image.js` 在构建时补全：

```markdown
![感受野的递推公式|w=100%](02-receptive-field-1.png)
```

渲染结果：`/images/note/26spring/cv-intro/07-2D-vision-1-02-receptive-field-1.png`
（解析时大小写不敏感，所以 `07-2d-vision-1.md` 能匹配磁盘上的 `07-2D-vision-1-*`，
但**输出的 URL 用磁盘上的真实大小写**，因此在大小写敏感的 Linux 主机上也不会 404）。

新增一个学期/课程时，两边一起建目录即可，例如
`src/content/blog/26autumn/operating-system/` 配
`public/images/blog/26autumn/operating-system/`。

### 图注语法

`![...]` 里用 `|` 分隔图注与可选参数，顺序随意：

| 写法 | 效果 |
| --- | --- |
| `![说明](01-foo.png)` | 自动编号并渲染为「图 1：说明」 |
| `![说明\|w=50%](01-foo.png)` | 宽度 50%（也可写 `width=50%`） |
| `![说明\|credit: 来源](01-foo.png)` | 图注下方追加来源行 |
| `![图 7：说明](01-foo.png)` | 手写编号，自动计数器会跟着 7 继续 |

- 编号按正文出现顺序**自动递增**，插入/删除图片不需要再手改后面的编号。
- 图注内可用 `@@加粗@@`、`@斜体@`、`[[文字\|链接]]`。
- 旧写法 `| width=50%`、`%% credit: 来源` 和整条 `/images/...` 绝对路径**依然可用**，
  混用不会报错。

### 解析规则

短文件名按以下顺序查找，命中即返回（前三步都忽略大小写）：

1. **内容树的镜像**：`public/images/<collection>/<与该文章相同的子目录>/<文章名>-<文件名>`
   （找不到则再试去掉 `<文章名>-` 前缀的版本）
2. 含 `/` 时按 `public/images/<collection>/<该路径>` 解析
3. 递归索引兜底：先找 `<文章名>-<文件名>`，再找同名文件
4. 都不中则在**所有** collection 下重复第 3 步

**找不到就直接构建失败**并打印尝试过的路径，避免线上出现 404 图片。

同时会读取图片真实宽高写入 `<img width height>`，手机端长文滚动时不再因为图片
加载而抖动（CLS）。

批量改写旧引用的脚本：`scripts/content-image-migrate.mjs`（`node scripts/content-image-migrate.mjs`
先预览，加 `--write` 才会写入）。校验渲染结果的脚本：`scripts/content-image-snapshot.mjs`。

### 关于内容缓存

Astro 的内容缓存按「文件内容摘要」复用**已渲染好的 HTML**。因此**只改
remark/rehype 插件、不改文章内容**时，跑 `astro build` 可能仍用旧结果；此时需要
清缓存（正式使用中的是 `node_modules\.astro`，仓库根目录的 `.astro` 里也可能有
早期遗留的同名文件）：

```powershell
Remove-Item -Recurse -Force node_modules\.astro   # 使用中的内容缓存
Remove-Item -Recurse -Force node_modules\.vite    # Vite 转换缓存
Remove-Item -Force .astro\data-store.json         # 遗留文件，若存在
pnpm build
```

改文章内容则会自动重新渲染，无需清缓存。

## 触屏与 hover

`preset-wind3` 会把 `hover:bg-x` 编译成**裸 `:hover`**，把 `group-hover:x` 编译成
`.group:hover .group-hover\:x` —— 都不带任何指针能力判断。而触屏浏览器在**点按**时就
会应用 `:hover` 并**一直保持**到点别处，于是每个 hover 装饰在手机上都会「粘住」：
点过的卡片标题一直是主题色、点过的标签一直是灰底、图片一直保持放大、主题按钮一直高亮。

`unocss.config.ts` 里的 `pointerVariants` 统一把 `hover:` / `group-hover:` 包进
`@media (hover: hover)`，所以**写组件时照常写 `hover:` 即可**，不需要自己加断点。

注意这两个 variant 是**替换** preset 的同名 variant，因此必须同时做两件事：把
`hover:` 前缀去掉以查到规则，**以及**把 `:hover` 补回选择器。只加媒体查询、忘了补
`:hover`，生成的就是 `.hover\:-translate-y-2{…}` —— 在一切有指针的设备上「永远处于
hover 状态」。`pnpm check:hover` 会按**每个选择器**分别校验这两件事（UnoCSS 会把声明
相同的规则合并成逗号列表，所以要拆开看）。

用 `md:` 来规避是错的：`md:` 是**视口宽度**查询，既不必要（窄窗口的桌面也能 hover），
也不充分（触屏平板就是 768px 宽，但根本没有指针）。

手写的 hover 规则（`<style>` 里的、typography preset 的 prose 规则）不受 UnoCSS
管辖，也需要自己包一层 `@media (hover: hover)`。校验有没有漏网的：

```powershell
pnpm check:hover    # 扫 dist CSS：有没有既保留 :hover、又被 @media (hover: hover) 包住
```

## 分页

博客 / 笔记列表与标签页都按 `siteConfig.postsPerPage`（默认 10）分页：

| 页面 | 第 1 页 | 后续页 |
| --- | --- | --- |
| 博客列表 | `/blog/` | `/blog/page/2/`、`/blog/page/3/` … |
| 笔记列表 | `/note/` | `/note/page/2/` … |
| 标签页 | `/tags/blog/<tag>/` | `/tags/blog/<tag>/page/2/` … |

- 第 1 页固定在集合根路径，避免同一内容出现两个 URL。
- `/page/N/` 路由只在内容真的超过一页时生成（`laterPageParams`）。
- 每页底部渲染 `src/components/ui/Pagination.astro`，并在 `<head>` 输出
  `rel="prev"` / `rel="next"`。
- 改每页条数只需改 `src/config/site-config.ts` 的 `postsPerPage`。

## PlantUML 图

` ```plantuml ` 代码块会渲染成内联 SVG。三条要点：

### 1. 图必须先进缓存，插件本身不同步网络

`src/plugins/remark-plantuml.js` 是**同步**插件，只读 `.plantuml-cache/<hash>.svg`，
不发任何请求。原因很实际：Astro 的内容同步会并发渲染最多 10 个文件，而本站有
146 张图（单篇笔记就有 34 张）。一旦在 markdown 管道里做网络请求，内容同步就会
**静默丢条目** —— 整个 `26spring/oot-intro` 目录的笔记会从 collection 里消失，
对应页面根本不会生成，而且日志里没有任何报错。表现为构建页数在 127～184 之间
随机变化，看起来像路由 bug。

所以缓存由脚本单独负责（`pnpm plantuml`，也已挂到 `prebuild`，所以 `pnpm build`
自动补全）：

```powershell
pnpm plantuml                    # 补齐缺失的图并写入 .plantuml-cache/
node scripts/plantuml-cache.mjs --check    # 只报告缺哪些，不联网
node scripts/plantuml-cache.mjs --force    # 全部重新渲染
```

- 缓存键是「发送给 PlantUML 的源码」的 SHA-256，改了图就会自动重新渲染。
- 缓存已有内容时 `pnpm plantuml` 是**秒级空操作**，完全不联网。
- 没进缓存的图会退化成指向 plantuml.com 的 `<img>`（页面不会坏，但依赖外部服务），
  构建结束时会打印一行提示。
- 建议把 `.plantuml-cache/`（约 0.9 MB）**提交进仓库**，这样 CI 无需联网、构建完全可复现。

### 2. 共享样式里不再注入 `allowmixing`

它会让 PlantUML 假定这是一张类图，于是所有用例图 / 活动图 / 状态图 / 时序图
都会返回 400。确实需要混用类图元素的图（`class` 配 `component` / `node` /
`database`），请在代码块第一行自己写 `allowmixing`。

### 3. `database` / `component` / `node` 不接受字段列表

只有 `class` / `entity` 可以。要画「表结构」请用
`class "ORDER 表" as T <<(D, #DDDDDD)>> { order_id PK }`。

## 检查脚本

```powershell
pnpm check:assets   # dist 里所有 /images /others 引用是否存在（大小写敏感）
pnpm check:math     # 全部 KaTeX 公式是否有 warning
pnpm check:hover    # 有没有没被 @media (hover: hover) 包住的 hover 规则
node scripts/diagnose-plantuml.mjs       # 逐张请求服务器，打印失败图的原因
node scripts/diagnose-content-sync.mjs   # 用真实管道单跑一遍内容渲染，定位渲染报错
```

`check:assets` 值得在部署前跑一次：它会以**大小写敏感**的方式校验路径，能提前发现
只在 Linux 主机（Cloudflare Pages / Netlify）上才会 404 的引用。

## Project Structure

I need some spared time to deal with that...

## Credit

This theme is based on the purest [astro-theme-pure](https://github.com/cworld1/astro-theme-pure/).
