---
title: 'Linux 基本操作命令'
excerpt: '26 春 并行程序设计 L02'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行编程'
- 'Linux'
pubDate: 'March 04 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 一、核心概念与基础

### 1.1 Linux 指令标准格式

一个完整的 Linux 指令遵循以下格式：

```bash
指令 [选项] [操作对象]
```

- **选项**（Options）：以 `-` 或 `--` 开头，用于修饰命令行为
- **操作对象**：可以是文件、目录或其他目标
- **多个选项可组合**：如 `ls -lha` 等同于 `ls -l -h -a`

### 1.2 常用辅助操作

| 快捷键/命令 | 功能说明 |
|-------------|----------|
| `Ctrl + C` | **中止**当前运行的命令 |
| `man <指令>` | **Manual** - 查看指令手册 |
| `info <指令>` | **Information** - 查看指令详细信息 |
| `help <指令>` | **Help** - 查看内置命令帮助 |
| `clear` | **Clear** - 清空屏幕显示 |

---

## 二、文件与目录操作

### 2.1 查看目录内容：`ls`（**L**i**s**t）

**功能**：列出指定目录下的文件和文件夹。

#### 常用参数解析

| 参数 | 英文全称 | 功能说明 |
|------|----------|----------|
| `-l` | **l**ong format | 以长列表格式显示详细信息（权限、所有者、大小、时间） |
| `-a` | **a**ll | 显示所有文件，包括**隐藏文件**（以`.`开头） |
| `-h` | **h**uman-readable | 以人类易读格式显示文件大小（K、M、G） |
| `-t` | **t**ime | 按修改时间排序（最新的在前） |
| `-r` | **r**everse | 逆序显示 |
| `-R` | **R**ecursive | **递归**列出子目录内容 |
| `-s` | **s**ize | 显示文件大小（以1K为单位） |
| `-F` | **F**ile type | 在文件名后添加类型标识符（`/`表示目录，`*`表示可执行文件） |
| `--color` | color | 以颜色区分文件类型 |

#### 实战示例

```bash
# 基本用法：列出当前目录
$ ls
file1.txt  file2.txt  dir1  dir2

# 列出指定目录
$ ls /etc
passwd  group  fstab

# 组合选项：详细显示所有文件（包括隐藏文件），人类可读格式
$ ls -lha --color
drwxr-xr-x 2 user group 4.0K Jan 01 12:00 dir1
-rw-r--r-- 1 user group 1.0K Jan 01 12:01 file1.txt
-rw-r--r-- 1 user group  234 Jan 01 11:50 .hiddenfile

# 按时间排序并递归显示
$ ls -ltR
```

> **记忆技巧**：`ls` 就是单词 **list** 的缩写，功能就是"列清单"。

---

### 2.2 目录导航

| 命令 | 英文全称 | 功能说明 |
|------|----------|----------|
| `pwd` | **P**rint **W**orking **D**irectory | 打印当前工作目录的**绝对路径** |
| `cd` | **C**hange **D**irectory | 切换目录 |
| `mkdir` | **M**a**k**e **Dir**ectory | 创建新目录 |
| `rm` | **R**e**m**ove | 删除文件或目录（**慎用！**） |

#### 路径概念

| 路径类型 | 说明 | 示例 |
|----------|------|------|
| **绝对路径** | 从根目录 `/` 开始的完整路径 | `/media/qianrui/work/LQR/mohan_HW/1` |
| **相对路径 `.`** | 当前目录（可省略） | `ls ./1` 或 `ls 1` |
| **相对路径 `..`** | 上级目录 | `cd ..` |
| **家目录 `~`** | 用户登录时的默认目录（`/home/username/`） | `cd ~` 或直接 `cd` |

#### 实战示例

```bash
# 查看当前位置
$ pwd
/home/qianrui/work/LQR/mohan_HW

# 回到家目录
$ cd
# 或
$ cd ~

# 进入上级目录
$ cd ..

# 创建目录
$ mkdir new_folder

# 删除文件（危险操作！）
$ rm filename.txt

# 递归删除目录及其内容（极度危险！）
$ rm -r directory_name
```

> ⚠️ **警告**：`rm -rf /*` 会强制递归删除根目录下所有内容，**会导致系统崩溃**！使用 `rm` 命令前务必确认目标路径。

---

### 2.3 文件操作

| 命令 | 英文全称 | 功能说明 |
|------|----------|----------|
| `touch` | touch | 创建空文件或**修改文件时间戳**（防止超算清理长期未动文件） |
| `cp` | **C**o**p**y | 复制文件或目录 |
| `mv` | **M**o**v**e | 移动或**重命名**文件/目录 |
| `diff` | **diff**erence | 比较两个文件的差异 |

#### 参数详解

- `cp -r`：**r**ecursive，递归复制（用于目录）
- `cp -p`：**p**reserve，保留文件属性（权限、时间戳等）

#### 实战示例

```bash
# 创建空文件
$ touch newfile.txt

# 复制文件
$ cp source.txt destination.txt
$ cp /path/to/file.txt ./backup/

# 递归复制目录
$ cp -r original_dir/ backup_dir/

# 移动文件（剪切）
$ mv file.txt /new/location/

# 重命名文件
$ mv oldname.txt newname.txt

# 比较两个文件
$ diff file1.txt file2.txt
```

---

### 2.4 输出与重定向

| 命令/符号 | 英文全称 | 功能说明 |
|-----------|----------|----------|
| `>` | redirect | **覆盖**输出重定向 |
| `>>` | append redirect | **追加**输出重定向 |
| `cat` | con**cat**enate | 连接文件并打印到标准输出 |
| `echo` | echo | 打印变量或字符串 |
| `chmod` | **ch**ange **mod**e | 修改文件权限 |

#### 实战示例

```bash
# 覆盖输出：将ls结果保存到文件（原内容被清空）
$ ls > list.txt

# 追加输出：将新内容添加到文件末尾
$ ls -l >> list.txt

# 查看文件内容
$ cat file.txt

# 合并多个文件
$ cat file1.txt file2.txt file3.txt > combined.txt

# 打印环境变量
$ echo $PATH
$ echo "Hello World!"

# 修改文件权限（rwx = 读/写/执行）
$ chmod 755 script.sh
```

---

### 2.5 压缩与解压缩

| 命令 | 格式 | 说明 |
|------|------|------|
| `zip` / `unzip` | `.zip` | 跨平台压缩格式 |
| `tar` | `.tar.gz` | Linux 常用打包压缩格式 |

#### 实战示例

```bash
# ========== zip 操作 ==========
# 递归压缩文件夹
$ zip -r archive.zip foldername/

# 解压到指定目录
$ unzip archive.zip -d new_folder/

# ========== tar 操作 ==========
# 压缩：-c(create) -z(gzip) -v(verbose) -f(file)
$ tar -czvf archive.tar.gz foldername/

# 解压：-x(extract) -z(gzip) -v(verbose) -f(file) -C(指定目录)
$ tar -zxvf archive.tar.gz -C new_folder/
```

> **参数记忆**：
> - `tar -c` = **c**reate（创建）
> - `tar -x` = e**x**tract（提取）
> - `tar -z` = g**z**ip（使用gzip压缩/解压）
> - `tar -v` = **v**erbose（显示详细过程）
> - `tar -f` = **f**ile（指定文件名）

**注**：
`.tar` 只是打包，文件大小约为原文件总和；`.tar.gz` 则是打包加压缩，相应的需要使用 `-z` 参数

---

## 三、管道与搜索命令

### 3.1 管道（Pipe）

**概念**：管道是 Unix/Linux 中最强大的机制之一，由操作系统提供，通过 Shell 访问。它将一个程序的**标准输出（stdout）**直接连接到另一个程序的**标准输入（stdin）**。

**符号**：`|`

#### 工作原理

```
命令1 → [stdout] → | → [stdin] → 命令2
```

**核心特点**：
- 数据在**内存中直接传递**，不写入磁盘
- 实现"小工具、大组合"的 Unix 哲学

#### 实战示例

```bash
# 基础用法：列出文件并筛选
$ ls | grep ".txt"
file