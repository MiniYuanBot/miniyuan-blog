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