---
title: '文件编辑器 Vim 与 Shell 脚本编程'
excerpt: '26 春 并行程序设计 L03'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'Linux'
pubDate: 'March 11 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Linux 与 Vim 编辑器概述

### Linux 发展简史

Linux 操作系统由 **GNU 项目**（**G**NU is **N**ot **U**nix，自由软件运动）和 **Linux 内核**（Linus Torvalds，1991年）结合而成，是 Unix 哲学的现代开源实现。

### 为什么需要 Vim？

在 Linux/服务器环境中，**纯命令行操作**是核心场景（无图形界面、远程登录）。Vim 作为 `vi`（**V**isual **I**nterface）的增强版（**Vi** **IM**proved），具有以下核心优势：

| 特性 | 说明 |
| :--- | :--- |
| **无图形依赖** | 纯命令行运行，适合远程服务器 |
| **模式化编辑** | 正常/编辑/命令行模式分离，减少鼠标依赖 |
| **极致快捷键** | 熟练后效率远超图形编辑器 |
| **高度可定制** | 支持插件扩展（如 NERDTree） |
| **轻量强大** | 资源占用极少，低配服务器流畅运行 |

### Vim 安装

```bash
sudo apt-get update    # 更新软件源
sudo apt-get install vim   # 安装 Vim
```

---

## Vim 的三种基本模式

Vim 的核心设计哲学是**模式切换**，不同模式下键盘功能完全不同。

| 模式 | 进入方式 | 功能 | 退出方式 |
| :--- | :--- | :--- | :--- |
| **正常模式**（**Normal** Mode） | 默认模式，或按 `Esc` | 移动光标、复制、删除、撤销 | `i/a/o` 进入编辑模式，`:` 进入命令行模式 |
| **编辑模式**（**Insert** Mode） | 按 `i`/`a`/`o` 等 | 插入和修改文本 | 按 `Esc` 返回正常模式 |
| **命令行模式**（**Command-line** Mode） | 按 `:` | 保存、退出、搜索、替换 | 按 `Esc` 或执行命令后自动返回 |

## Vim 正常模式（Normal Mode）

正常模式是 Vim 的**默认模式**，所有操作通过快捷键完成，**不使用鼠标**。

### 光标移动（基础）

| 按键 | 英文全称/含义 | 功能 |
| :--- | :--- | :--- |
| `h` | **h**and（左手） | 光标**左**移 |
| `j` | **j**ump down | 光标**下**移 |
| `k` | **k**ick up | 光标**上**移 |
| `l` | **l**ight（右手） | 光标**右**移 |
| `w` | **w**ord | 向前跳**单词** |
| `b` | **b**ackward | 向后跳**单词** |

当然也可以直接用上下左右键进行光标移动，由于正常模式和编辑模式分离，所以不会影响字符输入。事实上在编辑模式下就只能使用上下左右键移动光标了。

### 光标移动（高级）

| 按键 | 英文全称/含义 | 功能 |
| :--- | :--- | :--- |
| `0` | **z**ero | 移动到行首（数字0） |
| `$` | **dollar**（行尾符号） | 移动到行尾 |
| `gg` | **g**o **g**o | 跳转到文件**第一行** |
| `G` | **G**oto end | 跳转到文件**最后一行** |
| `nG` | **G**oto line **n** | 跳转到第 n 行 |
| `M` | **M**iddle | 跳转到屏幕**中间**行 |

### 复制、粘贴与删除

| 命令 | 英文全称/含义 | 功能 |
| :--- | :--- | :--- |
| `yy` | **y**ank（抽出）line | **复制**当前行 |
| `nyy` | **y**ank **n** lines | 复制 n 行（含当前行） |
| `p` | **p**ut（放置） | **粘贴**到光标下一行 |
| `P` | **P**ut before | 粘贴到光标上一行 |
| `dd` | **d**elete **d**elete | **剪切**当前行 |
| `ndd` | **d**elete **n** lines | 剪切 n 行 |
| `x` | 类似剪刀形状 | 删除当前**字符** |
| `u` | **u**ndo | **撤销**上一步操作 |
| `ctrl + r` | **r**edo | **重做**上一步撤销的操作 |

### 其他常用操作

| 命令 | 功能 |
| :--- | :--- |
| `o` | **o**pen below，在当前行下方插入新行并进入编辑模式 |
| `O` | **O**pen above，在当前行上方插入新行并进入编辑模式 |
| `i` | **i**nsert，在光标前插入 |
| `a` | **a**ppend，在光标后插入 |
| `ggVG` | **全选**，先移动到文件首，然后进入行可视模式，最后移至文件尾 |

---

## Vim 编辑模式（Insert Mode）

编辑模式用于**输入和修改文本**，与常规编辑器类似。

### 进入编辑模式的多种方式

| 按键 | 英文全称/含义 | 插入位置 |
| :--- | :--- | :--- |
| `i` | **i**nsert | 光标**前** |
| `I` | **I**nsert at beginning | 行**首** |
| `a` | **a**ppend | 光标**后** |
| `A` | **A**ppend at end | 行**尾** |
| `o` | **o**pen below | 当前行**下**方新行 |
| `O` | **O**pen above | 当前行**上**方新行 |
| `r` | **r**eplace | **替换**单个字符（不进入完整编辑模式） |
| `R` | **R**eplace mode | 进入**替换模式**，持续替换 |

统一按 `Esc` 键返回正常模式。

`ctrl + shift + v` 在编辑模式中粘贴。但是 vim 的设计核心就是模式分离，一般不建议在编辑模式中使用快捷键（正常模式负责操作，编辑模式负责输入）。

---

## Vim 命令行模式（Command-line Mode）

命令行模式用于执行**文件级操作**和**文本处理**。

### 文件操作命令

| 命令 | 英文全称/含义 | 功能 |
| :--- | :--- | :--- |
| `:w` | **w**rite | **保存**文件 |
| `:q` | **q**uit | **退出** Vim |
| `:wq` | **w**rite and **q**uit | 保存并退出 |
| `:q!` | **q**uit force | **强制退出**（不保存） |
| `:wqa` | **w**rite **q**uit **a**ll | 保存所有文件并退出（多标签页时） |

注意字符顺序是重要的。

### 显示与搜索

| 命令 | 英文全称/含义 | 功能 |
| :--- | :--- | :--- |
| `:set nu` | **set** **nu**mber | **显示行号** |
| `/word` | **/** search | 向下搜索 "word" |
| `?word` | **?** search upward | 向上搜索 "word" |
| `n` | **n**ext | 跳转到**下一个**匹配 |
| `N` | **N**ext backward | 跳转到**上一个**匹配 |

### 替换命令

| 命令格式 | 功能说明 |
| :--- | :--- |
| `:n1,n2s/old/new/g` | 在第 n1 到 n2 行之间，将 old 替换为 new |
| `:%s/old/new/g` | **全局替换**（整个文件） |
| `:%s/old/new/gc` | 全局替换，每次**确认**（**c**onfirm） |

**参数解析**：

- `s` = **s**ubstitute（替换）
- `g` = **g**lobal（每行所有匹配，不加就只替换每行第一个匹配）
- `%` = 整个文件（等价于 `1,$`，从第1行到最后一行）

---

## Vim 多文件与窗口管理

### 标签页方式（推荐）

```bash
vim -p file1.txt file2.txt file3.txt    # 以标签页打开多个文件
vim -p *.ref                            # 打开所有 .ref 文件
```

**标签页操作命令**：

| 命令 | 功能 |
| :--- | :--- |
| `:qa` | **q**uit **a**ll，退出所有标签页 |
| `:qa!` | 强制退出所有（不保存） |
| `:wqa` | 保存所有并退出 |
| `gt` | **g**o **t**ab，切换到下一个标签页 |
| `gT` | 切换到上一个标签页 |

注意字符顺序是重要的。

### 分屏方式

| 启动命令 | 功能 |
| :--- | :--- |
| `vim -O file1 file2` | **O**pen vertically，**垂直**分屏 |
| `vim -o file1 file2` | **o**pen horizontally，**水平**分屏 |

此时可以同时显示多个文件，但是切换快捷键比较复杂，且会和 VSCode 默认的快捷键产生冲突，导致先被 VSCode 捕获。如果想要解决必须配置有关设置，比较麻烦。

---

## Vim 插件系统简介

Vim 支持通过插件管理器（如 **Vundle**）扩展功能。

### 常用插件示例

| 插件 | 功能 |
| :--- | :--- |
| **NERDTree** | 文件目录树浏览器，方便浏览项目结构 |
| **Vundle** | **V**im **Bundle**，插件管理器 |

### 插件安装示例（Vundle）

```bash
# 1. 安装 Vundle
git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim

# 2. 在 ~/.vimrc 中配置插件列表
# 3. 在 Vim 中运行 :PluginInstall
```

---

## Shell 脚本编程基础

### 什么是 Shell？

**Shell** 是用户与 Linux 内核之间的**命令行解释器**。

| 概念 | 说明 |
| :--- | :--- |
| **Shell** | 命令行解释器（如 `bash`） |
| **Shell 脚本** | 由一系列 Linux 命令组成的文本文件，可自动化执行 |
| **bash** | **B**ourne **A**gain **SH**ell，Linux 默认 Shell |

### 第一个 Shell 脚本

```bash
#!/bin/bash
# 上面这行称为 Shebang(hash-# bang-!)，指定解释器路径

echo "Hello, World!"    # echo：输出文本
```

将上述文件储存为 `./hello.sh`。**运行方式**：

```bash
# 方式1：需要执行权限
chmod +x hello.sh       # chmod：change mode，修改权限
./hello.sh              # 相对路径执行

# 方式2：无需执行权限，直接调用解释器
bash hello.sh
```

---

## Shell 变量与运算符

### 变量定义规则

**核心规则**：`变量名=值`，**等号两侧无空格**。

```bash
#!/bin/bash

# 自定义变量
name="mohan"            # 字符串
num=20                  # 数字

# 使用变量：前面加 $ 符号
echo $name              # 输出：mohan
echo ${name}            # 推荐写法，避免歧义

# 命令结果赋值（两种方式）
current_dir=$(pwd)      # $() 方式，现代推荐
current_time=`date +%Y-%m-%d`   # 反引号方式，旧式
```

也即在命令中使用变量时用 `${}` 包裹，在变量赋值中使用命令时使用 `$()` 包裹

### 预定义环境变量

| 变量 | 英文全称/含义 | 说明 |
| :--- | :--- | :--- |
| `$PATH` | **PATH** | 可执行文件搜索**路径** |
| `$PWD` | **P**resent **W**orking **D**irectory | 当前工作目录 |
| `$USER` | **USER** | 当前登录用户名 |
| `$HOME` | **HOME** | 当前用户家目录 |

```bash
echo "当前用户: $USER"
echo "家目录: $HOME"
echo "当前目录: $PWD"
```

### 算术运算符

Shell 本身不支持直接算术运算，需使用 `$(( ))` 或 `bc` 命令。

```bash
#!/bin/bash
a=10
b=3

echo "a+b = $((a+b))"   # 加法：13
echo "a-b = $((a-b))"   # 减法：7
echo "a*b = $((a*b))"   # 乘法：30
echo "a/b = $((a/b))"   # 整数除法：3（取商）
echo "a%b = $((a%b))"   # 取余：1

# 浮点运算（使用 bc 命令）
echo "scale=2; 10/3" | bc   # 输出：3.33（保留2位小数）
```

### 比较运算符

| 运算符 | 英文全称/含义 | 示例 |
| :--- | :--- | :--- |
| `-eq` | **eq**ual | `[ $a -eq $b ]`（等于） |
| `-ne` | **n**ot **e**qual | `[ $a -ne $b ]`（不等于） |
| `-gt` | **g**reater **t**han | `[ $a -gt $b ]`（大于） |
| `-lt` | **l**ess **t**han | `[ $a -lt $b ]`（小于） |
| `-ge` | **g**reater or **e**qual | `[ $a -ge $b ]`（大于等于） |
| `-le` | **l**ess or **e**qual | `[ $a -le $b ]`（小于等于） |

**注**：比较运算必须用 `[ ]` 包裹，且**两侧有空格**。

### 条件测试符

| 运算符 | 英文全称/含义 | 示例 |
| :--- | :--- | :--- |
| `-e` | **e**xists | `[ -e file.txt ]`（文件是否存在） |
| `-f` | **f**ile | `[ -f file.txt ]`（是否是普通文件） |
| `-d` | **d**irectory | `[ -d /home ]`（是否是目录） |
| `-s` | **s**ize | `[ -s file.txt ]`（文件是否存在且非空） |
| `-r` | **r**ead | `[ -r file.txt ]`（是否有读权限） |
| `-w` | **w**rite | `[ -w file.txt ]`（是否有写权限） |
| `-x` | e**x**ecute | `[ -x script.sh ]`（是否有执行权限） |
| `-L` | **L**ink | `[ -L link.txt ]`（是否是软链接） |
| `-nt` | **n**ewer **t**han | `[ file1 -nt file2 ]`（file1 是否比 file2 新） |
| `-ot` | **o**lder **t**han | `[ file1 -ot file2 ]`（file1 是否比 file2 旧） |

**注**：必须用 `[ ]` 包裹，且**两侧有空格**。路径包含空格时要加引号。

### 逻辑运算符

| 运算符 | 含义 | 示例 |
| :--- | :--- | :--- |
| `&&` | **AND**（与） | `mkdir test && cd test`（创建成功后才进入） |
| `\|\|` | **OR**（或） | `[ -e file.txt ] \|\| touch file.txt`（不存在则创建） |

---

## Shell 流程控制

### 条件语句：if-else

```bash
#!/bin/bash

read -p "请输入一个数字: " num    # read：读取用户输入，-p 显示提示

if [ $num -gt 100 ]; then
    echo "数字大于100"
elif [ $num -gt 50 ]; then
    echo "数字大于50且小于等于100"
else
    echo "数字小于等于50"
fi

# if []; then
    # if-statement
# elif []; then
    # elif-statement
# else
    # else-statement
# fi

# 或者
# if []
# then
    # if-statement
# elif []
# then
    # elif-statement
# else
    # else-statement
# fi
```

**注**：

- `if` 后接条件，用 `[ ]` 包裹，**两侧必须有空格**
- `then` 可以写在同一行（需加分号）或下一行
- 必须以 `fi`（if 的倒写）结束

### 10.2 循环语句：for

```bash
#!/bin/bash

# 方式1：遍历数字范围
for i in {1..5}; do
    echo "当前数字: $i"
done

# 方式2：遍历列表
for file in file1.txt file2.txt file3.txt; do
    echo "处理文件: $file"
done

# 例：批量创建计算目录
for i in {01..05}; do
    dir="calc_$i"
    mkdir $dir
    echo "创建目录: $dir"
done
```

### 10.3 循环语句：while

适用于**不确定循环次数**的场景。

```bash
#!/bin/bash

# 示例：1到10累加
i=1
sum=0

while [ $i -le 10 ]; do    # -le：less or equal
    sum=$((sum + i))
    i=$((i + 1))           # 变量自增，避免死循环！
done

echo "1到10的累加和: $sum"   # 输出：55
```

---

## Shell 引号规则

Shell 中三种引号的区别是常见难点：

| 引号类型 | 名称 | 功能 | 示例 |
| :--- | :--- | :--- | :--- |
| `" "` | **双引号** | **弱引用**，变量 `$var` 和命令 `` `cmd` `` 会被解析 | `echo "$HOME"` → `/home/user` |
| `' '` | **单引号** | **强引用**，所有特殊字符原样输出 | `echo '$HOME'` → `$HOME` |
| `` ` ` `` | **反引号** | 执行命令并替换为结果（现代推荐用 `$()`） | `` echo `date` `` → 当前时间 |

```bash
name="mohan"

echo "Hello, $name"     # 输出：Hello, mohan（解析变量）
echo 'Hello, $name'     # 输出：Hello, $name（原样输出）
echo "Today is `date`"  # 输出：Today is [当前日期]
```
