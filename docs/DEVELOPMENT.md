# 开发文档

这里记录博客的内容约定、构建管道和各个脚本的细节。项目概览见 [README](../README.md)。

## 内容约定（与 note-buddy / Obsidian 统一）

`src/content` 支持 Obsidian 语法。note-buddy（class-skipper 生成）的分章 `output/`
通过 `scripts/import-notes.mjs` 转换后导入，每讲对应一篇文章：

```
src/content/note/26autumn/computer-organization-and-architecture/
  01-computer-architecture-intro.md
  02-performance-and-risc-v.md
  assets/l02-iron-law.png
  .note-import.json
```

### 命名

| 对象 | 约定 | 例子 |
| --- | --- | --- |
| 笔记文件 | 小写英文 kebab-case，两位序号开头 | `02-cpi-and-iron-law.md` |
| 附件（图片等） | 放在笔记旁的 `assets/`，小写 kebab-case，以所属笔记/讲次开头 | `assets/l02-iron-law.png`、`assets/07-2d-vision-1-02-receptive-field-1.png` |
| 目录 | 小写 kebab-case，导入后的课程不再含 `Lxx/chapters/` | `26spring/cv-intro/` |
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

手写笔记仍使用上述缺省值。导入器会从每讲索引的 frontmatter 或一级标题提取文章标题，
补齐摘要、课程标签和日期；作者、位置、封面等默认元信息在导入配置中设置。

### 从 note-buddy 导入

课程导入配置独立放在根目录的 `notes.config.json`，不需要填写服务器配置即可使用：

```json
{
  "importNotes": [
    {
      "from": "../note-buddy/operating-system/output",
      "to": "src/content/note/26autumn/operating-system",
      "frontmatter": {
        "author": "miniyuan",
        "position": "Beijing",
        "heroImageLight": "@/assets/images/light/light-01.png",
        "heroImageDark": "@/assets/images/dark/dark-01.png"
      },
      "lectures": {
        "L03": { "slug": "interrupts-and-system-calls", "pubDate": "2026-10-10" }
      }
    }
  ]
}
```

```bash
pnpm import:notes --dry-run
pnpm import:notes
pnpm dev
```

`from` 和 `to` 相对于博客根目录；`to` 必须是 `src/content/note/<学期>/<课程>` 下的
课程目录。`lectures.Lxx.slug` 是两位讲次编号之后的英文 kebab-case 文件名；未配置的
新讲次使用 `07-lecture.md` 这样的名称，之后可以补上 slug 再导入。每讲配置还能覆盖
`title`、`excerpt`、`pubDate`、`tags` 等元信息。日期优先采用显式配置或源文件元信息，
缺省取源索引的修改日期；后续导入和改名保留首次导入的日期。

转换规则：

- 不生成任何 `index.md` 文章。每讲索引中的导读、小结等内容会合入对应文章，
  章节导航由网站目录代替；`questions.md` 等其他笔记保留为独立文章。
- `Lxx/chapters/*.md` 按文件名中的数字顺序合并，每章一级标题去掉 `01 ` 这样的
  数字前缀并转为二级标题，正文标题相应降一级。跨章节、跨讲次链接以及
  `section:section-N` 改写为新文章或标题的自动锚点，不插入额外 HTML 锚点；重复
  标题按合并后的顺序使用 `-1`、`-2` 等后缀。
- 图片及站点支持的附件集中到课程的 `assets/`，名称统一为小写并带讲次前缀。可修正
  章节误写的 `assets/x.png`；不会跨课程猜测同名图片。支持类型与现有附件插件一致。
- 删除「来源」callout、指向 PDF/DOCX 等原始材料的定位脚注，以及正文中对应的
  脚注标记；这类出处信息留在源笔记中，不导入网站。代码和转义示例中的写法保留。
- 删除「不确定事项」标题及其整个章节（含子标题），到下一个同级或更高级标题为止。
- 普通脚注和引用式链接按章节加前缀，避免合并后重名；代码块、公式与其他 callout
  保留原文。
- 全部课程先校验后写入，缺图、无效章节链接或重名附件会直接报错并保留原导入内容。

导入器维护 `.note-import.json`，记录生成文件的归属和摘要。重复导入不会改写相同文件；
源文件删除或更名后会清理旧的生成文件，并保留不属于导入器的手写文件。首次迁移旧的
整目录副本时，只清理与源目录内容一致的文件。生成文件有手工修改时会报冲突，修改
应写回源笔记或导入配置，再重新导入；源目录本身始终只读。

`pnpm ship` 构建前调用同一导入器，`--skip-build` 则直接发布现有构建，不再导入。
`pnpm build` 与 `pnpm dev` 使用已导入的笔记，不依赖本地存在 note-buddy，便于 CI
构建。没有 `notes.config.json` 时兼容旧的 `deploy.config.json.importNotes`；也可用
`pnpm import:notes --config <配置文件>` 指定配置。

运行 `pnpm test:imports` 验证合并、元信息、链接、脚注、附件、重复导入和覆盖保护。

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

## 文章访问控制

博客与笔记共用这两个可选 frontmatter 字段：

| 字段 | 行为 |
| --- | --- |
| `draft: true` | 不生成文章页面，不进入列表、标签、搜索、RSS 或 sitemap |
| `passwordEnv: BLOG_PASSWORD_PRIVATE` | 生成需要密码解密的页面，列表仅保留标题、日期和加密提示 |

示例文章是 `src/content/blog/student-union-office/01-meeting20260328.md`。
密码放在 `.env.local` 的 `BLOG_PASSWORD_PRIVATE` 中；可参考 `.env.example`。
多篇文章可以使用同一个变量名共享密码，独立密码则使用不同的变量名。变量名不能以
`PUBLIC_` 开头，密码不得少于 16 个字符。未配置密码、密码过短或仍为示例占位值时，
构建会失败，不会退回明文发布。
加密文章使用静态 Markdown（`.md`）；MDX 组件可能将数据写入公开的客户端 JS，因此不支持加密 `.mdx`。

加密发生在构建阶段，浏览器收到 AES-256-GCM 密文和每篇独立生成的随机 salt / IV。
密钥通过 PBKDF2-SHA-256（600,000 次）从密码派生；解密使用浏览器 Web Crypto API。
密码和解密密钥不写入生成的 HTML 或客户端 JS，也不保存到 localStorage / sessionStorage。
刷新页面或点击「重新锁定」后需再次输入密码。部署需要 HTTPS；本机 localhost 可直接预览。
相关接口见 [Astro 服务端环境变量](https://docs.astro.build/en/reference/modules/astro-env/)和
[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)。

摘要与目录随正文一起加密。加密文章会从搜索索引、RSS、标签页和 sitemap 排除，并输出
`noindex, nofollow`。标题、URL、发布时间仍然公开，适合希望访客知道文章存在的场景。
希望连页面都不发布时，应使用 `draft: true`。

引用的 `src/content` 附件会打包到密文中，解密后以浏览器内存中的 Blob URL 展示。
构建结束时只复制被公开 HTML 引用的内容附件；仅用于加密文章、草稿或未被使用的附件
不会复制到 `dist/`。与公开文章共享的附件仍然公开。`public/` 和外部链接不是私有存储，
机密附件应放到文章旁的 `assets/`，且不要同时在公开文章中引用。
本地 `astro dev` 的附件中间件用于预览，访问控制应以 `astro preview` 的生产构建为准。

网站密文保护的是发布产物，不保护源仓库。Markdown、原始附件和 Git 历史仍是明文；
私密原文需要保存在私有仓库中。已发布过的旧页面、浏览器缓存或第三方存档也不会因
新一轮加密自动消失。更换密码后重新构建并发布，旧密文仍可被旧密码解密。

```powershell
pnpm test:encryption  # Web Crypto 互通、错误密码、篡改、随机 salt/IV、附件打包
pnpm build
pnpm preview
```

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
`releases/00000000-legacy`。构建前按 `notes.config.json` 自动转换并导入 note-buddy 笔记。

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
