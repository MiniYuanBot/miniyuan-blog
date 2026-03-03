---
title: 'GitHub 使用指南'
excerpt: '如何利用 GitHub 进行高效代码合作'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'GitHub'
pubDate: 'March 03 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 一、基础概念

### 什么是 GitHub
GitHub 是利用 Git 进行代码存储、管理和协作用的。事实上是 Git 先被开发，而后催生了 GitHub。

本质上，Git（以及基于它的GitHub）实现的是基于快照的存储模型，每次提交都会保存文件的完整副本。但在后台，Git 会通过自动打包机制将多个完整文件进行增量压缩，以平衡存储效率和访问性能。

### 核心术语
- **仓库（Repository）**：项目的容器，包含所有文件和每个文件的修订历史
- **分支（Branch）**：独立的开发线路，默认主分支通常叫 main 或 master
- **提交（Commit）**：代码变更的快照，包含变更说明和唯一标识
- **Pull Request（PR）**：请求项目维护者合并你的代码变更

### Git 与 GitHub 的关系
- **Git**：分布式的版本控制系统，负责本地代码管理
- **GitHub**：基于 Git 的云端托管服务平台
- 简单理解：Git 是工具，GitHub 是使用这个工具的服务平台

---

## 二、环境准备

### 注册 GitHub 账号
略

### 安装 Git
- **Windows**：下载 [Git for Windows](https://git-scm.com/download/win)
- **macOS**：`brew install git` 或下载安装包
- **Linux**：`sudo apt-get install git`（Ubuntu/Debian）

### 配置用户信息
```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 配置 SSH Key（可选但推荐）
```bash
# 生成 SSH Key
ssh-keygen -t rsa -b 4096 -C "对密钥的描述"

# 查看公钥
cat ~/.ssh/id_rsa.pub
```
将对应你的密钥描述的公钥添加到 GitHub：Settings → SSH and GPG keys → New SSH key，后续即可直接使用 ssh 连接 GitHub 并推拉代码

```bash
# ssh 连接 github，-T 表示不要分配伪终端
ssh -T git@github.com
```

也可以配置 ssh 别名。利用 VSCode 的远程资源管理器，选择新建远程，添加上述代码即可。为了取消分配伪终端可以如下设置

```bash
Host your-host-name
  RequestTTY no
  HostName github.com
  User git
```

然后直接通过以下命令连接

```bash
ssh your-host-name
```

---

## 三、仓库操作

### 创建自己的仓库
1. 点击右上角 "+" → "New repository"
2. 填写仓库名称和描述
3. 选择公开（Public）或私有（Private）
4. 可选：初始化 README、.gitignore 和许可证

### 克隆现有仓库
```bash
git clone repo-address
```

其中 `repo-address` 有以下几种格式：
1. https 地址: https://github.com/user-name/repo-name.git
2. ssh: git@github.com:user-name/repo-name.git
3. 如果你配置了 SSH 别名: your-host-name:user-name/repo-name.git
4. 如果你想的话，还可以配置 Git 别名

### Fork 他人仓库
- 在他人仓库页面点击 "Fork" 按钮
- 将副本复制到自己的 GitHub 账号下
- 可以自由修改并提交 Pull Request

### 仓库基本设置
- **Settings**：修改仓库名称、删除仓库、设置合作者
- **Branches**：设置保护分支规则
- **Collaborators**：添加项目协作者

---

## 四、Git 基础操作

### 工作区、暂存区、版本库的概念
- **工作区**：本地文件系统看到的文件
- **暂存区**：准备提交的变更暂存区域
- **版本库**：Git 保存历史版本的地方

### 添加文件
```bash
# 添加单个文件
git add 文件名

# 添加所有变更
git add .
```

### 提交更改
```bash
git commit -m "清晰描述本次提交的目的"
```

### 查看状态
```bash
git status  # 查看哪些文件被修改、暂存
```

### 查看历史
```bash
git log              # 完整提交历史
git log --oneline    # 简洁版
```

### 对比差异
```bash
git diff             # 工作区 vs 暂存区
git diff --staged    # 暂存区 vs 版本库
```

---

## 五、分支管理

### 查看分支
```bash
git branch           # 本地分支列表
git branch -r        # 远程分支
git branch -a        # 所有分支
```

### 创建分支
```bash
git branch 分支名              # 创建分支
git checkout -b 分支名         # 创建并切换
```

### 切换分支
```bash
git checkout 分支名            # 传统方式
git switch 分支名              # 新版方式
```

### 合并分支
```bash
# 先切换到目标分支（如 main）
git checkout main
# 合并特性分支
git merge 特性分支名
```

### 删除分支
```bash
git branch -d 分支名           # 删除已合并的分支
git branch -D 分支名           # 强制删除未合并分支
```

---

## 六、远程仓库同步

### 添加远程仓库
```bash
git remote add origin repo-address
```

### 推送代码
```bash
git push origin 分支名         # 首次推送
git push                      # 已建立追踪关系后
```

### 拉取更新
```bash
git pull origin 分支名         # 拉取并合并
git pull                      # 已建立追踪关系后
```

### 获取但不合并
```bash
git fetch origin              # 获取远程更新但不合并
git fetch --prune             # 清理已删除的远程分支
```

### 查看远程仓库
```bash
git remote -v                 # 查看远程仓库地址
```

---

## 七、协作核心：Pull Request

### 什么是 PR
Pull Request 是通知项目维护者审核并合并你代码变更的机制，包含代码改动、讨论区和自动化检查。

### 两种创建方式

#### Fork 模式（开源项目）
1. Fork 原项目到自己的账号
2. 克隆到本地并修改
3. 推送到自己的远程仓库
4. 在 GitHub 发起 PR 到原项目

#### 直接分支模式（团队协作）
1. 在项目仓库直接创建分支
2. 本地开发并推送到远程分支
3. 在 GitHub 发起 PR 到 main 分支

### 写好 PR 描述
- 清晰的标题（简明扼要）
- 详细说明改动内容和原因
- 关联相关 Issue（如 Fixes #123）
- 添加测试步骤或截图

### 代码审查与修改反馈
- 审查者可以在代码行添加评论
- 作者根据反馈修改并推送新提交
- PR 会自动更新，无需新建 PR

### 合并 PR
- **Create a merge commit**：保留所有提交历史
- **Squash and merge**：合并为一个提交
- **Rebase and merge**：变基后合并，保持线性历史

---

## 八、常见场景处理

### 撤销修改
```bash
# 撤销工作区修改
git checkout -- 文件名
git restore 文件名            # 新版命令

# 撤销暂存区文件
git reset HEAD 文件名
git restore --staged 文件名   # 新版命令
```

### 修改最后一次提交
```bash
# 修改提交信息或添加遗漏文件
git add 遗漏的文件
git commit --amend -m "新的提交信息"
```

### 处理合并冲突
1. Git 标记冲突文件，手动编辑解决
2. 删除 `<<<<<<<`、`=======`、`>>>>>>>` 标记
3. 保留需要的代码
4. 保存文件后：
```bash
git add 已解决的文件
git commit -m "解决合并冲突"
```

### 暂存当前工作
```bash
git stash                    # 暂存修改
git stash list               # 查看暂存列表
git stash pop                # 恢复最近暂存
git stash drop               # 删除暂存
```

---

## 九、项目沟通

### 使用 Issues 追踪任务/Bug
- **New Issue**：创建新任务或报告 Bug
- **Labels**：标记类型（bug、enhancement、help wanted）
- **Milestones**：规划版本里程碑
- **Assignees**：指派负责人

### 在 PR 中讨论代码
- 在代码行添加评论
- 使用 "Request changes" 或 "Approve"
- @ 提及特定人员

### 通过评论 @ 提及他人
```markdown
@用户名 请帮忙 review 这个 PR
```

---

## 十、实用技巧

### 常用 GitHub 快捷键
- `t`：启用文件查找
- `w`：切换分支
- `s`：聚焦搜索框
- `?`：查看所有快捷键

### 搜索技巧
- `repo:用户名/仓库名 关键词`
- `language:javascript 关键词`
- `stars:>1000 关键词`
- `pushed:>2024-01-01`

### 通过 README 让项目更友好
- 项目名称和简介
- 安装和使用说明
- 示例代码
- 贡献指南
- 许可证信息

### GitHub CLI 简介
```bash
# 安装 GitHub CLI
gh auth login               # 登录
gh repo create              # 创建仓库
gh pr create                # 创建 PR
gh issue list               # 查看 Issues
```

### .gitignore 的使用
- 忽略编译生成的文件（如 .class、.exe）
- 忽略依赖目录（node_modules、vendor）
- 忽略环境配置文件（.env、config.local）
- 可以使用 [gitignore.io](https://www.toptal.com/developers/gitignore) 生成模板

---

## 最佳实践建议

1. **提交信息规范**：使用清晰的动词开头（Add、Fix、Update、Remove）
2. **经常提交**：小步快跑，避免超大提交
3. **及时同步**：经常 pull 远程更新，减少冲突
4. **保护主分支**：设置分支保护规则，要求 PR 审核
5. **写文档**：README 和注释是给未来的自己看的

---

GitHub 不仅是一个工具，更是一种协作文化。掌握这些基础操作后，建议多参与开源项目，在实践中不断提升。遇到问题可以查阅 [GitHub Docs](https://docs.github.com) 或使用 `git help` 命令。