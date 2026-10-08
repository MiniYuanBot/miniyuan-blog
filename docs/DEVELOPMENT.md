# 开发文档

这里记录博客的内容约定、构建管道和各个脚本的细节。项目概览见 [README](../README.md)。

## 内容约定（与 note-buddy / Obsidian 统一）

`src/content` 按 **Obsidian 仓库**的方式组织，note-buddy（class-skipper 生成）的
`output/` 可以**原样复制**进来，不需要改任何文件名或链接：

```
src/content/note/26autumn/computer-organization-and-architecture/   ← note-buddy 的 output/
  index.md
  L02/index.md
  L02/chapters/02-cpi-and-iron-law.md
  L02/assets/l02-iron-law.png
```

### 命名

| 对象 | 约定 | 例子 |
| --- | --- | --- |
| 笔记文件 | 小写英文 kebab-case，两位序号开头 | `02-cpi-and-iron-law.md` |
| 附件（图片等） | 放在笔记旁的 `assets/`，小写 kebab-case，以所属笔记/讲次开头 | `assets/l02-iron-law.png`、`assets/07-2d-vision-1-02-receptive-field-1.png` |
| 目录 | 小写 kebab-case（note-buddy 的讲次目录 `L02/` 也可以，URL 会自动转小写） | `26spring/cv-intro/` |
| 标题 | 写在 frontmatter 的 `title`；正文开头的 `# 标题` 会自动去掉，避免重复 | |

- **URL 全部是小写**：Astro 本来就把笔记 id 转小写，附件也按小写路径输出，
  所以 Windows/macOS 上能用的链接，在大小写敏感的 Linux 服务器上同样能用。
- 不要用 `_`、空格或中文做文件名；中文只出现在标题和正文里。

### Frontmatter

博客需要的字段都有默认值，Obsidian 笔记不写也能构建：

| 字段 | 缺省时 |
| --- | --- |
| `title` | 文件名 |
| `pubDate` | `date` / `created`，否则取该文件**第一次 git 提交**的时间，再否则取修改时间 |
| `excerpt` | `description` / `summary`，否则为空 |

class-skipper 现在会额外写出 `excerpt`（章节摘要）和 `tags`（课程名）。

### 链接与 Obsidian 语法

由 `src/plugins/remark-obsidian.js` 处理，在 Obsidian 里和网站上效果一致：

| 写法 | 说明 |
| --- | --- |
| `[文字](05-foo.md#标题)`、`[目录](../index.md)` | 相对链接到笔记，标题可直接写原文 |
| `[[05-foo]]`、`[[05-foo#标题|文字]]`、`[[02 CPI与性能铁律]]` | wikilink，按路径、文件名、`title` 或 `aliases` 查找 |
| `![说明](assets/x.png)`、`![[x.png|300]]` | 图片（相对路径或嵌入，`|300` 为像素宽度） |
| `> [!note] 标题`、`> [!question]- 自测` | callout；`-` 默认折叠，`+` 默认展开 |
| `==高亮==`、`%%注释%%` | 高亮；注释不会出现在网页上 |
| ` ```mermaid ` | 在浏览器端渲染，跟随深浅色主题 |
| `[^1]` | 脚注（GFM） |

**找不到的链接只警告不报错**（构建日志里搜 `[remark-obsidian]`），找不到的**图片**
仍然直接构建失败。附件在 `astro dev` 时由中间件提供，构建后复制到 `dist/`
（`src/integrations/content-assets.js`）。

旧笔记已用 `scripts/migrate-to-vault.mjs` 迁移到这套约定（图片从 `public/images/`
移入各目录的 `assets/`，站内绝对 URL 改为相对 `.md` 链接，文件名改为小写）。
`public/images/` 现在只放首页等非文章图片。

## 发布到服务器

```bash
cp deploy.config.example.json deploy.config.json   # 填好服务器信息（已 gitignore）
pnpm ship              # 导入笔记 → 构建 → 检查链接 → 上传 → 原子切换
pnpm ship --dry-run    # 只打印要执行的命令
pnpm ship --skip-build # 直接上传现有的 dist/
pnpm ship --rollback   # 切回上一个版本
```

服务器上每次发布一个目录 `<remoteDir>/releases/<时间>`，`<remoteDir>/<liveLink>`
（默认 `dist`，即 nginx 原本指向的目录）改成指向它的软链接，所以上传过程中网站不会
出现半新半旧的状态，也不需要改 nginx 配置。第一次运行时原有的 `dist/` 会保留为
`releases/00000000-legacy`。`importNotes` 可以在构建前自动从 note-buddy 拷贝笔记。

## 图片的图注语法


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

相对路径（`assets/x.png`）先按 Obsidian 的方式相对笔记解析；只写文件名时
还兼容旧约定，按以下顺序查找，命中即返回（前三步都忽略大小写）：

1. **（旧）内容树的镜像**：`public/images/<collection>/<与该文章相同的子目录>/<文章名>-<文件名>`
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
  `rel="prev"` / `rel="next"`。上一页、下一页沿用 `Button` 的 `back` / `ahead`
  箭头样式（与侧栏「View all tags」相同），到头时保留位置并置灰。
- 博客和笔记共用同一套路由：`src/pages/[kind]/…`、`src/pages/tags/[kind]/…`，
  `kind` 取自 `src/utils/content.ts` 的 `KINDS`。
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
pnpm check:assets   # dist 里所有站内引用是否存在（大小写敏感）
pnpm check:math     # 全部 KaTeX 公式是否有 warning
pnpm check:hover    # 有没有没被 @media (hover: hover) 包住的 hover 规则
node scripts/diagnose-plantuml.mjs       # 逐张请求服务器，打印失败图的原因
node scripts/diagnose-content-sync.mjs   # 用真实管道单跑一遍内容渲染，定位渲染报错
```

`check:assets` 以**大小写敏感**的方式校验路径，能提前发现只在 Linux 主机上才会 404 的
引用。`pnpm ship` 在上传前会自动运行它。

## 项目结构

```
src/
  content/            博客与笔记（按 Obsidian 仓库组织，附件放在各目录的 assets/）
    blog/  note/
  content.config.ts   两个 collection 的定义，以及缺省 frontmatter 的补全
  schemas/            Zod schema；博客和笔记共用 post.ts 里的 PostSchema
  pages/
    [kind]/           /blog/、/note/ 的列表页、分页和文章页
    tags/[kind]/      标签页及其分页
    about / links / search / rss.xml / search-index.json
  components/
    layouts/          BaseLayout、BlogPost（文章页）、ListingPage、TagPage、目录
    ui/               Button、Card、ContentCard、Pagination 等
    basic/            head、主题、日期等基础组件
  plugins/            remark 插件：Obsidian 语法、图片解析与图注、PlantUML
  integrations/       content-assets：开发时提供附件，构建后复制到 dist/
  utils/              content.ts（getPosts 等，仅服务端）、分页、主题、toast
  config/             站点、首页、导航、友链等配置
scripts/              缓存、检查、迁移与发布脚本
public/               静态文件（首页图片、favicon 等）
.plantuml-cache/      PlantUML 渲染结果
```

### 博客与笔记的类型

两个 collection 用同一个 `PostSchema`。服务端代码统一通过 `src/utils/content.ts`
取数据：

```ts
import { getPosts, type Kind, type Post } from "@/utils/content";
const posts = await getPosts(kind); // Post[]，已按 pubDate 倒序
```

不要写 `kind === "blog" ? await getCollection("blog") : await getCollection("note")`：
它的类型是「两种数组的联合」（`BlogEntry[] | NoteEntry[]`），TypeScript 无法在上面调用
`sort`、`filter`，就会报「collection 的类型 "note" 不能赋给 "blog"」这类错误。`getPosts`
返回的是「联合类型的数组」（`Post[]`），没有这个问题。

`@/utils`（`index.ts`）会被浏览器端脚本引用，所以 `content.ts` 不从这里导出，
否则 `astro:content` 会被打进客户端代码。
