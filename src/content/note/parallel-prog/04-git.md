---
title: 'Git 版本管理'
excerpt: '26 春 并行程序设计 L04'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'Git'
- 'GitHub'
pubDate: 'March 20 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 基础概念

说一些废话喵~

### 什么是 GitHub
GitHub 是利用 Git 进行代码存储、管理和协作用的。事实上是 Git 先被开发，而后催生了 GitHub。

本质上，Git（以及基于它的GitHub）实现的是基于快照的存储模型，每次提交都会保存文件的完整副本。但在后台，Git 会通过自动打包机制将多个完整文件进行增量压缩，以平衡存储效率和访问性能。

当然，国内还有 Gitee，和 GitHub 一样都是基于 Git 开发的。

### Git 与 GitHub 的关系
- **Git**：分布式的版本控制系统，负责本地代码管理
- **GitHub**：基于 Git 的云端托管服务平台
- 简单理解：Git 是工具，GitHub 是使用这个工具的服务平台

### 版本管理的意义

总的来说就是很有意义喵~

| 核心价值 | 说明 |
|----------|------|
| **保障团队协作** | 多人并行开发时避免代码覆盖丢失，支持大规模团队协同 |
| **完整历史追溯** | 记录每一次提交内容，便于定位 Bug、审计与代码审查 |
| **安全回滚与风险控制** | 出现严重问题时可快速回退到稳定版本，降低风险 |
| **支持多线并行开发** | 通过分支同时推进新功能、版本发布与紧急修复 |
| **数据安全与灾难恢复** | 完整保存代码历史，能从仓库恢复，保障安全 |

---

## 环境准备

### 注册 GitHub 账号
略

### 安装 Git
- **Windows**：下载 [Git for Windows](https://git-scm.com/download/win)
- **macOS**：`brew install git` 或下载安装包
- **Linux**：`sudo apt-get install git`（Ubuntu/Debian）

### 配置 Git 用户信息
在 Git 中提交代码时标注的作者信息，本质上与 GitHub 的用户信息无关。但建议与 GitHub 保持一致（否则你会看到另一个名字的自己提交了代码）。

```bash
# 配置全局用户名（建议与 GitHub/Gitee 用户名一致）
git config --global user.name "你的用户名"

# 配置全局邮箱（建议与 GitHub/Gitee 注册邮箱一致）
git config --global user.email "你的邮箱"
```

**验证配置**：
```bash
git config --global user.name      # 查看全局用户名
git config --global user.email     # 查看全局邮箱
git config --global --list         # 查看所有全局配置
```

**注**：`--global` 表示全局配置，所有本地仓库均使用该信息。去掉 `--global` 即可为单个仓库配置作者信息。

### 配置 SSH Key

SSH 不是必需的，但是推荐进行配置以更稳定、更便捷（无需使用 PAT）地进行连接。

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

### 配置 PAT

由于 GitHub 已停止支持密码验证，如果使用 HTTPS 方式连接 GitHub 的话需使用 **Personal Access Token (PAT)**。当然 ssh 连接就不需要了。

**生成 Token 步骤**：
1. 登录 GitHub → 右上角头像 → **Settings**
2. 左侧菜单 → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. 点击 **Generate new token (classic)**
4. 填写 Note（用途说明），选择过期时间
5. 勾选权限（至少选择 `repo` 用于仓库操作）
6. 点击 **Generate token**
7. **立即复制保存**（只显示一次）

**使用 Token**：
```bash
# HTTPS 方式克隆时，用 Token 代替密码
git clone https://github.com/username/repo.git
# 密码处输入 Token 而非 GitHub 密码

# 或修改远程 URL 包含 Token（不推荐，不安全）
git remote set-url origin https://<token>@github.com/username/repo.git

# 推荐：配置 Git 凭证管理器缓存 Token
git config --global credential.helper cache
```

---

## Git 本地仓库操作

Git 本地操作围绕**三个区域**展开：

1. **工作区**（Working Directory）：实际文件目录，日常开发在此进行
2. **暂存区**（Staging Area）：临时存储区，存放待提交的修改
3. **本地仓库**（Local Repository）：`.git` 目录，存储版本历史

### 仓库创建与克隆

#### 创建远程仓库
1. 点击右上角 `+` → `New repository`
2. 填写 `Repository name`（仓库名）
3. 选择权限：`Public`（开源）/ `Private`（私有）
4. **初始化选项**：
   - `Add a README file`：项目说明文档
   - `Add .gitignore`：忽略文件
   - `Choose a license`：开源协议
5. 点击 `Create repository`

#### 克隆远程仓库到本地
```bash
git clone repo-address
```

其中 `repo-address` 有以下几种格式：
1. https 地址: https://github.com/ownr-name/repo-name.git
2. ssh: git@github.com:owner-name/repo-name.git
3. 如果你配置了 SSH 别名: your-host-name:owner-name/repo-name.git
4. 如果你想的话，还可以配置 Git 别名

**克隆方式对比**：

| 方式 | 认证方式 | 适用场景 |
|------|----------|----------|
| **HTTPS** | 用户名和密码（或令牌） | 适合新手快速访问 |
| **SSH** | 密钥对认证 | 一次配置长期有效，适合高频操作和自动化 |
| **GitHub CLI** | 官方命令行工具 | 可管理仓库、Issue 等全流程 |

#### Fork 他人仓库
- 在他人仓库页面点击 "Fork" 按钮
- 将副本复制到自己的 GitHub 账号下
- 可以自由修改并提交 Pull Request

#### 仓库基本设置
- **Settings**：修改仓库名称、删除仓库、设置合作者
- **Branches**：设置保护分支规则
- **Collaborators**：添加项目协作者

---

### 工作区到暂存区

`git add` 负责将代码由工作区推入暂存区。

```bash
# 将工作区所有新增/修改的文件添加到暂存区
git add .

# 仅添加单个文件
git add filename

# 查看工作区和暂存区状态
git status
```

**状态说明**：
- **Untracked files**：未跟踪，也即未执行 `git add`
- **Changes to be committed**：已暂存，也即已执行 `git add`，但是未执行 `git commit`
- **modified**：已修改，也即已执行 `git add` 和 `git commit`，但未重新 `git add`

**注**：执行 `git add` 后若对文件做了新修改，需**重新执行** `git add`，否则新修改不会被加入暂存区。

**撤销暂存**：
```bash
git rm --cached filename  # 将文件从暂存区退回工作区
```

### 暂存区到本地仓库

`git commit` 负责将代码由暂存区推入本地仓库。

```bash
# 将暂存区的修改提交到本地仓库，生成版本记录
# -m 参数（message）：提交说明，必须添加
git commit -m "statement"

# 若未加 -m，会进入 Vi 编辑器，需手动输入提交说明后保存退出（新手易出错）
```

每次提交对应一个唯一的 **commit ID**（版本号），是 Git 版本管理的核心。

---

### 查看历史记录

`git log` 用于查看提交历史/版本记录

```bash
# 查看所有提交日志（按时间倒序，最新在最前）
git log

# 查看最近 n 条日志
git log -5

# 单行显示日志
git log --oneline -10

# 显示分支合并图（用 * 表示提交，| 表示分支）
git log --graph -5

# 查看指定作者的提交记录
git log --author="username"

# 查看指定时间之后的提交
git log --since="2025-03-01"
```

### 查看文件差异

`git diff` 用于查看文件差异

```bash
# 默认查看工作区与暂存区的差异
git diff

# 查看工作区与本地仓库的差异
git diff HEAD

# 查看暂存区与本地仓库的差异
git diff --staged

# 查看指定文件的差异
git diff filename
```

---

## Git 远程仓库交互

### 管理远程仓库

`git remote` 负责远程仓库关联与管理。

```bash
# 查看当前本地仓库关联的所有远程主机地址（fetch: 拉取地址, push: 推送地址）
git remote -v

# 关联本地仓库与远程仓库（用于本地创建的仓库）
git remote add 远程主机名 远程仓库地址

# 解除本地与远程仓库的关联
git remote rm origin
```

**注**：`origin` 是 Git 对**远程主机**的默认命名，克隆远程仓库时自动创建，可理解为远程仓库的"别名"。

---

### 本地仓库到远程仓库

`git push` 用于将本地仓库推送到远程仓库。

```bash
# 首次推送（关联本地分支与远程分支）
# -u 参数（upstream）：表示关联本地分支与远程分支，后续可直接执行 git push
git push -u origin master

# 后续推送（已关联分支）
git push

# 指定分支推送（本地分支名:远程分支名）
git push origin master:master
# 若分支名相同，可简化为：
git push origin master
```

### 拉取远程代码

- `git pull` 用于自动拉取并合并。可能产生**冲突**。

```bash
# git pull 自动拉取并合并
git pull origin master
```

- `git fetch` + `git merge` 用于精确拉取，用于解决使用自动合并时可能产生的冲突。

```bash
# 拉取远程主机最新代码到本地（不自动合并）
git fetch origin

# 合并到当前本地分支
git merge origin/develop
```

---

### 远程合并冲突解决

执行 `git merge` 后，终端显示 **CONFLICT**，文件中出现冲突标记：

```cpp
<<<<<<< HEAD
// 你的本地代码
=======
// 远程拉取的代码
>>>>>>> branch-name
```

**解决步骤**：
1. 打开冲突文件，根据需求修改内容：
   删除冲突标记 `<<<<<<<` / `=======` / `>>>>>>>`，保留正确代码
2. 标记冲突已解决：
   ```bash
   git add 冲突文件名
   ```
3. 提交合并结果：
   ```bash
   git commit -m "解决合并冲突，合并 xxx 分支"
   ```

---

## Git 进阶功能

### 临时存储

`git stash` 用于临时存储。也即保存工作区未提交的修改（未 `git add` / 未 `git commit`），让工作区恢复干净，方便切换分支、紧急修复 bug 等多任务处理。

例如，你正在 `master` 分支开发 feature 功能（未完成，未提交），突然发现线上 bug，需要切换到 `bugfix` 分支紧急修复，但你不想提交未完成的代码。

**操作流程**：
```bash
# 保存当前未提交修改
git stash save "开发 feature 功能，main.cpp 未完成"

# 切换到 bugfix 分支
git checkout bugfix

# 修复 bug，完成后提交推送
git add .
git commit -m "修复线上 XX bug"
git push

# 切回原开发分支
git checkout master

# 恢复之前保存的修改，继续开发
git stash pop

# 查看所有 stash 列表
git stash list

# 删除最新的 stash（若不需要恢复）
git stash drop
```

---

### 精选提交

`cherry-pick` 用于将指定提交的修改**复制**到当前分支，生成新的提交。

```bash
# 将某分支的特定提交应用到当前分支
git cherry-pick <commit-id>

#  cherry-pick 多个提交，可能产生冲突
git cherry-pick <commit-id-1> <commit-id-2>

# 遇到冲突时，解决后继续
git add .
git cherry-pick --continue
```

---

### 版本回退

- `git reset` 用于本地版本回退。也即将 **HEAD 指针**（当前版本的指向）移动到指定的 commit ID，实现撤销提交、回退版本，**会改变提交历史**。
   
   **使用命令前建议**：
   ```bash
   git status  # 确认工作区干净
   # 或用 git stash 保存修改
   ```

   **本地回退**：
   ```bash
   # 查看提交历史，获取希望回退版本的 commit ID（前几位即可，如 a0fvf8）
   git log --oneline

   # 软回退（仅移动 HEAD 指针，保留工作区和暂存区）
   git reset -soft <commit-id>
   # 或者以下命令
   # git reset <commit-id>

   # 混合回退（保留工作区，清空暂存区）
   git reset -mixed <commit-id>

   # 硬回退（彻底丢弃所有修改，包括未提交的！）
   git reset --hard <commit-id>
   ```

   **远程回退**：
   ```bash
   # 本地 reset 后，远程仍为原版本，需强制推送
   git push -f origin <branch-name>
   ```

   > **严禁在多人协作的公共分支（master/develop）使用 `git push -f`！** 强推会覆盖队友的修改，仅适用于自己的私有分支！

   **误操作恢复**：
   ```bash
   # 查看所有操作记录（包括 reset）
   git reflog

   # 找到 reset 前的 commit ID，恢复回去
   git reset --hard <commit-id>

   # 恢复后仍需强制推送到远程仓库
   git push -f origin <branch-name>
   ```

- `git revert` 更适合远程仓库版本回退。其会创建新的提交来**撤销**指定提交的修改（相当于把你的修改倒过来做一遍），**不改变历史**。

   ```bash
   # 撤销指定提交
   git revert <commit-id>

   # 撤销多个提交（依次 revert）
   git revert <commit-id-D>
   git revert <commit-id-C>
   ```

   例如，历史：A → B（错误）→ C（正确），需要保留 C 但撤销 B。

   **操作流程**：
   ```bash
   # 先 revert C 和 B（生成 C' 和 B'）
   git revert <commit-id-C>
   git revert <commit-id-B>

   # 再用 cherry-pick 重新应用 C
   git cherry-pick <commit-id-C>

   # 直接推送即可，不需要强制推送
   git push origin <branch-name>
   ```

   操作后历史变为: A → B → C → C' → B' → C''

---

## Git 分支管理

分支是 Git 的核心功能，用于**隔离开发任务**，互不影响。

### 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|----------|----------|------|
| 稳定分支 | `master` / `main` | 存放正式版本，禁止直接开发 |
| 开发分支 | `develop` | 团队协作开发 |
| 功能分支 | `feature/xxx` | `feature/main-cpp`、`feature/score-calc` |
| Bug修复分支 | `bugfix/xxx` | `bugfix/input-error`、`bugfix/crash` |
| 发布分支 | `release/xxx` | `release/v1.0`、`release/v2.1` |
| 临时分支 | `temp/xxx` | `temp/test`、`temp/debug` |

### 分支操作命令

```bash
# 查看所有分支（* 表示当前分支）
git branch

# 查看远程分支
git branch -r

# 查看所有分支（本地+远程）
git branch -a

# 创建新分支
git branch <new-branch>

# 创建并切换到新分支
git checkout -b <new-branch>

# 切换到已有分支
git checkout <branch-name>

# 删除已合并的分支
git branch -d <branch-name>

# 强制删除未合并的分支
git branch -D <branch-name>

# 合并指定分支到当前分支
git merge <branch-name>

# 还原某个文件的修改（和 git reset --hard 一样不可恢复！）
git checkout <file-name>
```

**注**：
切换分支前必须保证工作区干净。
- 方案1：`git add && git commit` 提交所有修改
- 方案2：`git stash` 暂存修改
- 方案3：`git reset --hard` 丢弃修改（不可恢复）

---

## Git 版本标记

Tag 是**静态的版本标签**，用于标记里程碑（如 `v1.0`、`v3.6.0`），指向固定 commit，不随分支变化。本质上是创建了项目在某个时间点的快照。

**命名规范**：`v` + 版本号，如 `v1.0`、`v2.1.3`（主版本.次版本.修订号）

### 创建 Tag

```bash
# 轻量 tag（仅标记，无说明）
git tag <tag-name>

# 附注 tag（带说明，推荐）
git tag -a <tag-name> -m "说明"

# 为历史 commit 打 tag
git tag -a <tag-name> <commit-id> -m "说明"

# 查看所有 tag
git tag
```

**注**：
这些操作仅在本地创建 Tag，远程仓库不会自动同步。

### 推送 Tag

```bash
# 推送单个 tag
git push origin <tag-name>

# 推送所有本地 tag
git push origin --tags
```

### 拉取与切换 Tag

```bash
# 拉取远程所有 tag
git fetch origin --tags

# 切换到指定 tag（进入"分离头指针"状态）
git checkout tags/<tag-name>

# 基于 tag 创建新分支（推荐，可修改）
git checkout -b <new-branch> tags/<tag-name>
```

### 删除 Tag

```bash
# 删除本地 tag
git tag -d <tag-name>

# 删除远程 tag
git push origin --delete <tag-name>
```

---

## Git 多人协同开发

### 核心概念

- **Fork（复刻）**：将他人仓库复制到自己的账号下，自由修改，不影响原仓库
- **Pull Request（PR）**：向原仓库提交合并申请，审核通过后代码合并到原项目

### 详细步骤

1. **Fork 原仓库**

进入他人仓库首页 → 点击右上角 **Fork** → 复制到自己的账号下

2. **克隆到本地**
```bash
git clone https://github.com/你的账号/仓库名.git
```

3. **关联上游仓库（原仓库）**
```bash
# 进入本地仓库
cd 仓库名

# 添加 upstream 远程地址
git remote add upstream https://github.com/原作者/仓库名.git

# 查看远程地址
git remote -v
# 应显示：origin（你的仓库）和 upstream（原仓库）
```

4. **本地开发**
```bash
# 创建功能分支
git checkout -b feature/xxx

# 开发
git add .
git commit -m "实现 xxx 功能"

# 推送到自己的远程仓库
git push origin feature/xxx
```

5. **提交 Pull Request**
- 进入自己的 Fork 仓库 → **Pull Request** → **New Pull Request**
- 选择原仓库的目标分支 → 自己的开发分支
- 填写 PR 说明（修改内容、修复的 bug / 实现的功能）
- 点击 **Create Pull Request**

6. **同步原仓库更新**
```bash
# 拉取原仓库最新代码
git fetch upstream

# 合并到本地分支
git merge upstream/main

# 推送到自己的远程仓库
git push origin main
```

**注**：
Fork 后的仓库不会自动同步原仓库，需手动 `fetch upstream`

---

## Git 命令速查表

| 场景 | 命令 |
|------|------|
| **仓库初始化** | |
| 克隆仓库 | `git clone <url>` |
| 初始化本地仓库 | `git init` |
| 关联远程仓库 | `git remote add origin <url>` |
| **日常开发** | |
| 查看状态 | `git status` |
| 添加到暂存区 | `git add .` / `git add <file>` |
| 提交到本地仓库 | `git commit -m "说明"` |
| 推送到远程 | `git push` / `git push -u origin <branch>` |
| 拉取并合并 | `git pull` |
| 拉取不合并 | `git fetch` |
| **分支管理** | |
| 查看分支 | `git branch` / `git branch -a` |
| 创建分支 | `git branch <name>` |
| 切换分支 | `git checkout <name>` |
| 创建并切换 | `git checkout -b <name>` |
| 合并分支 | `git merge <name>` |
| 删除分支 | `git branch -d <name>` |
| **版本回退** | |
| 查看历史 | `git log --oneline` |
| 查看操作记录 | `git reflog` |
| 软回退 | `git reset --soft <id>` |
| 硬回退 | `git reset --hard <id>` |
| 安全撤销 | `git revert <id>` |
| 精选提交 | `git cherry-pick <id>` |
| **临时存储** | |
| 暂存修改 | `git stash save "说明"` |
| 查看暂存列表 | `git stash list` |
| 恢复并删除 | `git stash pop` |
| 仅恢复 | `git stash apply` |
| **标签管理** | |
| 创建标签 | `git tag -a <name> -m "说明"` |
| 推送标签 | `git push origin <name>` / `git push origin --tags` |
| 删除标签 | `git tag -d <name>` |
| **差异查看** | |
| 工作区 vs 暂存区 | `git diff` |
| 工作区 vs 本地仓库 | `git diff HEAD` |
| 暂存区 vs 本地仓库 | `git diff --staged` |

---

## 完整工作流示例

```bash
# 1. 开始工作前同步最新代码
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/new-feature

# 3. 开发过程中
git add .
git commit -m "实现新功能：xxx"

# 4. 开发完成，推送到远程
git push -u origin feature/new-feature

# 5. 发现写错了，要回退（未 push 时）
git log --oneline          # 找到要回退的版本
git reset --hard <id>      # 硬回退

# 6. 或已 push 到远程，安全回退
git revert <id>            # 生成反提交
git push                   # 推送到远程

# 7. 临时要去修 bug
git stash                  # 暂存当前工作
git checkout -b bugfix/xxx # 创建 bug 分支
# ... 修 bug ...
git checkout feature/new-feature  # 切回原分支
git stash pop              # 恢复工作

# 8. 功能完成，合并到 main
git checkout main
git merge feature/new-feature
git push origin main
git branch -d feature/new-feature  # 删除功能分支
```
