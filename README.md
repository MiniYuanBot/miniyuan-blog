# miniyuan blog

miniyuan 的个人博客，地址是 [miniyuan.site](https://miniyuan.site)。站点用 Astro 生成静态页面，
内容分两类：

- **Blog**：作业、实验报告、科研阅读等文章；
- **Note**：课程笔记。[note-buddy](https://github.com/MiniYuanBot/note-buddy) 生成的笔记也可以直接导入。

## 特点

- 笔记目录就是一个 Obsidian 仓库。callout、`[[双链]]`、`![[图片]]`、相对 `.md` 链接、
  `==高亮==`、`%%注释%%`、Mermaid 在 Obsidian 里和网站上显示一致，note-buddy 生成的
  笔记复制进来就能发布，不用改文件名或链接。
- KaTeX 公式、PlantUML 图（构建时渲染成 SVG 并缓存）、带自动编号的图注。
- 标签、分页、全站搜索、RSS、sitemap，以及跟随系统的深浅色主题。
- 文章密码加密；也可以用 `draft: true` 将文章排除在发布内容之外。
- 一条命令完成构建、检查和发布，出问题可以一条命令回滚。

## 快速开始

需要 Node.js 和 pnpm。

```bash
pnpm install
pnpm dev        # 本地预览：http://localhost:4321
pnpm build      # 生成 dist/
```

## 写一篇笔记

在 `src/content/note/<学期>/<课程>/` 下新建 Markdown 文件，图片放在同目录的 `assets/`
里，用相对路径引用：

```markdown
---
title: '02 CPI 与性能铁律'
excerpt: '计算机组织与体系结构 L02'
tags: ['计算机组织与体系结构']
---

![性能铁律](assets/l02-iron-law.png)

> [!note] 补充
> 也可以写 [下一节](03-performance-summary.md) 或 [[03-performance-summary]]。
```

文件名用小写英文加连字符（`02-cpi-and-iron-law.md`）。`title`、`pubDate` 可以省略，
省略时分别取文件名和文件第一次提交到 git 的时间。

从 note-buddy 导入时，把某门课的 `output/` 整个复制到
`src/content/note/<学期>/<课程>/` 即可。

## 加密或暂不发布文章

在文章 frontmatter 中加入环境变量名，密码单独放在根目录的 `.env.local`：

```yaml
passwordEnv: BLOG_PASSWORD_PRIVATE
```

```dotenv
BLOG_PASSWORD_PRIVATE=这里填写至少16个字符的独立密码
```

`.env.local` 已被 Git 忽略；部署环境也可以通过同名环境变量提供密码。页面只公开标题和
日期，摘要、正文、目录和 `src/content` 中引用的附件在浏览器输入密码后解密。
加密文章不会出现在搜索索引、RSS、标签页或 sitemap 中。改密码后需要重新构建和发布。

若希望文章完全不生成页面，在 frontmatter 中使用 `draft: true`。

网站加密不会加密 Git 仓库中的 Markdown 和历史版本；公开仓库中的原文仍可被读取。
共享给公开文章的附件，以及 `public/` 或第三方服务上的文件，也仍然公开。

实现细节和验证命令见[开发文档](docs/DEVELOPMENT.md#文章访问控制)。

## 发布

```bash
cp deploy.config.example.json deploy.config.json   # 填写服务器地址和密钥路径
pnpm ship              # 构建、检查链接、上传并切换到新版本
pnpm ship --rollback   # 切回上一个版本
```

`deploy.config.json` 不会提交到仓库。

## 文档

命名约定、图注语法、插件的解析规则、PlantUML 缓存、检查脚本、发布流程和项目结构都在
[开发文档](docs/DEVELOPMENT.md)里。

## 致谢

主题基于 [astro-theme-pure](https://github.com/cworld1/astro-theme-pure/)。
