---
title: 'Linux 基本操作命令'
excerpt: '26 春 并行程序设计 L02'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'Linux'
pubDate: 'March 04 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 基础操作

### Linux 指令标准格式

一个完整的 Linux 指令通常遵循以下格式（当然不完全是如此，事实上指令的规范比较混乱）：

```bash
指令 [选项] [操作对象]
```

- **选项**：以 `-` 或 `--` 开头，用于修饰命令行为
- **操作对象**：Linux 文件（当然由于 Linux **一切皆文件**，实际上包含 regular file, directory, socket 等等类型）
- **可组合**：选项和操作对象都可以有多个

### 常用辅助操作

| 快捷键/命令 | 全称 | 功能说明 |
| -------- | ------- | ---------- |
| `Ctrl + C` | - | **中止**当前运行的命令 |
| `man <指令>` | **Manual** | 查看指令手册 |
| `info <指令>` | **Information** | 查看指令详细信息 |
| `help <指令>` | **Help** | 查看内置命令帮助 |
| `clear` | **Clear** | 清空终端显示 |
| `reset` | **Reset** | 重启终端 |
| `chmod` | **ch**ange **mod**e | 修改文件权限 |
| `bc` | **B**asic **C**alculator | 命令行计算器，支持浮点运算 |

#### 示例

```bash
# 修改文件权限（rwx = 读/写/执行）
$ chmod 755 script.sh
```

---

## 文件与目录操作

### 查看目录内容：`ls`（**L**i**s**t）

**功能**：列出指定目录下的文件和文件夹。

#### 常用选项

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

#### 示例

```bash
# 列出当前目录
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

---

### 目录导航

| 命令 | 英文全称 | 功能说明 |
| ------ | ---------- | ---------- |
| `pwd` | **P**rint **W**orking **D**irectory | 打印当前工作目录的**绝对路径** |
| `cd` | **C**hange **D**irectory | 切换目录 |
| `mkdir` | **M**a**k**e **Dir**ectory | 创建新目录 |
| `rmdir` | **R**e**m**ove **Dir**ectory | 删除空目录 |
| `rm` | **R**e**m**ove | 删除文件或目录（**慎用！**） |

#### 路径类型

| 路径类型 | 说明 | 示例 |
| ---------- | ------ | ------ |
| **绝对路径** | 从根目录 `/` 开始的完整路径 | `/media/qianrui/work/LQR/mohan_HW/1` |
| **相对路径 `.`** | 当前目录（可省略） | `ls ./1` 或 `ls 1` |
| **相对路径 `..`** | 上级目录 | `cd ..` |
| **家目录 `~`** | 用户登录时的默认目录（`/home/username/`） | `cd ~` 或直接 `cd` |

#### 示例

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

# 删除文件（危险！）
$ rm filename.txt

# 递归删除目录及其内容（更危险！）
$ rm -r directory_name

# 强制递归删除目录及其内容（不能再危险！）
$ rm -rf directory_name
```

---

### 2.3 文件操作

| 命令 | 英文全称 | 功能说明 |
| ------ | ---------- | ---------- |
| `touch` | touch | 创建空文件或**修改文件时间戳**（可用于防止超算清理长期未动文件） |
| `cp` | **C**o**p**y | 复制文件或目录 |
| `mv` | **M**o**v**e | 移动或**重命名**文件/目录 |
| `diff` | **diff**erence | 比较两个文件的差异 |

#### 常用选项

- `cp -r`：**r**ecursive，递归复制（用于目录）
- `cp -p`：**p**reserve，保留文件属性（权限、时间戳等）

#### 示例

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
| ----------- | ---------- | ---------- |
| `>` | redirect | **覆盖**输出重定向 |
| `>>` | append redirect | **追加**输出重定向 |
| `cat` | con**cat**enate | 连接文件并打印到标准输出 |
| `echo` | echo | 打印变量或字符串 |

**注**：`>` 和 `>>` 在文件不存在时都会创建一个新文件

#### 示例

```bash
# 覆盖输出：将ls结果保存到文件（原内容被清空）
$ ls > list.txt

# 追加输出：将新内容添加到文件末尾
$ ls -l >> list.txt

# 查看文件内容
$ cat file.txt

# 合并多个文件
$ cat file1.txt file2.txt file3.txt > combined.txt
# 也可以
$ cat *.txt > combined.txt

# 打印环境变量
$ echo $PATH
$ echo "Hello World!"

# 将标准错误输出（2）重定向到 /dev/null，涉及文件标识符
$ grep -r "root" /etc/ 2>/dev/null
```

---

### 2.5 压缩与解压缩

| 命令 | 格式 | 说明 |
| ------ | ------ | ------ |
| `zip` / `unzip` | `.zip` | 跨平台压缩格式 |
| `tar` | `.tar.gz` | Linux 常用打包压缩格式 |

#### 常用选项

- `tar -c` = **c**reate（创建）
- `tar -x` = e**x**tract（提取）
- `tar -z` = g**z**ip（使用gzip压缩/解压）
- `tar -v` = **v**erbose（显示详细过程）
- `tar -f` = **f**ile（指定文件名）

#### 示例

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
$ tar -xzvf archive.tar.gz -C new_folder/
```

**注**：

- `.tar` 只是打包，文件大小约为原文件总和；`.tar.gz` 则是打包加压缩，相应的需要使用 `-z` 参数
- 参数的排列顺序是重要的

---

## 三、管道

### 3.1 管道概念

管道（Pipe）是 Linux 的核心哲学之一，用于将一个命令的**标准输出**作为另一个命令的**标准输入**。关键在于文件传输不经过磁盘读写，而是直接由内核在内存中进行传递，大大提高了效率。

#### 示例：词频统计

```bash
cat words.txt | tr ' ' '\n' | sort | uniq -c | sort -nr
```

- `cat words.txt`：读取文件内容。
- `tr ' ' '\n'`：**tr**（**Tr**anslate，替换字符），将空格替换为换行符，使每个单词占一行。
- `sort`：**sort**（排序），对单词进行排序，为去重做准备。
- `uniq -c`：**uniq**（**Uniq**ue，去重），`-c`（**c**ount，计数）统计每行重复出现的次数，即单词出现次数。
- `sort -nr`：`-n`（**n**umeric，按数值排序），`-r`（**r**everse，反向），按次数从高到低排序。

### 3.2 `xargs`

`xargs` （**Extended Arguments**）的作用就是将管道传过来的文本数据，转换成指令能接收的**参数**，因为有些命令（如 `rm`，`cp`，`mkdir`）只接受命令行参数。

#### 示例：批量删除文件

```bash
# 错误：rm 不理解管道传过来的文件名
$ cat filenames.txt | rm

# 正确：xargs 将每一行的内容（文件名，注意不需加 - ）作为参数传给 rm
$ cat filenames.txt | xargs rm
# 等价于：rm file1.txt file2.txt ...
```

---

## 四、`grep`

### 4.1 命令概述

`grep` 用于在文件中查找匹配指定模式的行，并将这些行打印出来。
英文全称为 **G**lobally search for a **R**egular **E**xpression and **P**rint matching lines（当然它总是让人联想到 grasp）

### 4.2 常用选项

| 选项 | 英文全称 | 功能说明 |
| :--- | :--- | :--- |
| `-r` 或 `-R` | **r**ecursive | **递归**查找，不仅搜索当前目录，还搜索所有子目录 |
| `-l` | **l**ist | 只显示包含匹配内容的**文件名**，不显示具体行 |
| `-i` | **i**gnore case | **忽略大小写** |
| `-n` | **n**umber | 显示匹配行的**行号** |
| `-v` | in**v**ert | **反向匹配**，显示不包含关键词的行 |
| `-w` | **w**ord | 执行**完整单词**匹配 |
| `-c` | **c**ount | 统计包含匹配内容的**行数** |
| `-E` | **E**xtended regexp | 支持**扩展正则表达式**（等价于 `egrep`） |
| `-A n` | **A**fter | 显示匹配行与后 n 行 |
| `-B n` | **B**efore | 显示匹配行与前 n 行 |
| `-C n` | **C**ontext | 显示匹配行与前后 n 行 |

**注**：
`-w` 认为以下字符是单词边界

- 空格、制表符、换行
- 标点符号（`-` 和 `_` 除外，`_` 被视为单词的一部分）
- 数字与字母的分界

### 4.3 示例

#### 示例1：日志分析

```bash
# 统计日志中 "error" 出现的行数
$ grep -c "error" app.log

# 忽略大小写，统计 Error/ERROR/error 出现的总行数
$ grep -ci "Error" app.log

# 反向统计，查看没有报错的行
$ grep -cv "error" app.log

# 匹配 "app" 行，但不匹配 "apple"
grep -w "app" test.txt
```

#### 示例2：上下文显示

```bash
# 显示包含 "error" 的行及其后3行（After）
grep -A 3 "error" app.log

# 显示包含 "crash" 的行及其前2行（Before）
grep -B 2 "crash" app.log

# 显示包含 "timeout" 的行及其前后5行（Context）
grep -C 5 "timeout" app.log
```

#### 示例3：代码检索

```bash
# 在当前目录下所有 .py 文件中查找 "TODO" 字符串，并显示行号
$ grep -n "TODO" *.py

# 在 /usr/bin 目录下找出所有包含 "python" 的可执行文件（仅显示文件名）
$ ls /usr/bin | grep -l "python" # 错误：grep -l 作用于文件，而非文本流。正确用法：
$ ls /usr/bin | grep "python"
# 或使用 xargs 和 grep -l
$ ls /usr/bin | xargs grep -l "python"
```

---

## 五、正则表达式

**正则表达式**（Regular Expression）是一套描述文本规则的"特殊字符串"，用于精准匹配、查找、替换符合规则的文本内容。与普通的匹配需要完全一致不同，正则表达式更为灵活。

### 5.1 常用元字符

| 元字符 | 记忆方法 | 功能说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `^` | 帽子 | 匹配行的**开头** | `"^start"` 匹配以 `start` 开头的行 |
| `$` | 蛇尾 | 匹配行的**结尾** | `"end$"` 匹配以 `end` 结尾的行 |
| `.` | 占位符 | 匹配**任意单个**字符（除了换行符） | `"h.t"` 匹配 `hat`, `hot`, `hut` |
| `*` | 未知符 | 匹配前一个字符**零次或多次** | `"ab*c"` 匹配 `ac`, `abc`, `abbc` |
| `+` | 正整数级 | 匹配前一个字符**一次或多次**（需 `-E`） | `"[0-9]+"` 匹配 `1`, `12`, `123` |
| `?` | 有没有 | 匹配前一个字符**零次或一次**（需 `-E`） | `"colou?r"` 匹配 `color`, `colour` |
| `\|` | 逻辑或 | 匹配多个子表达式中的**任意一个**（需 `-E`） | `"cat\|dog"` 匹配 `cat` 或 `dog` |
| `{m,n}` | 集合 | 匹配前一个字符 **m ~ n 次**（需 `-E`） | `"[0-9]{3,5}"` 匹配3到5位数字 |
| `[]` | 集合 | 匹配方括号内的**任意一个**字符 | `"[Ww]e"` 匹配 `We` 或 `we` |
| `[^]` | 逻辑非 | 匹配**不在**方括号内的任意字符 | `"[^0-9]"` 匹配任意非数字字符 |
| `\` | 略 | 转义字符，使元字符失去特殊意义 | `"10\.1"` 匹配 `10.1`，这里的 `.` 就是字面点号 |

### 5.2 结合 `grep` 的示例

假设有一个名为 `WishYou` 的文件。

| 命令 | 正则表达式含义 | 输出结果特征 |
| :--- | :--- | :--- |
| `grep .er WishYou` | `.` 匹配任意单个字符，所以会匹配 `_er` 模式的词 | 匹配 `isher`, `pudding` (包含 `er`)，`cheer` 等 |
| `grep [Ww]e WishYou` | `[Ww]` 匹配 **W** 或 **w** 中的任意一个 | 匹配以 `We` 或 `we` 开头的行中的单词 |
| `grep -n ^[W] WishYou` | `^` 匹配行首，所以匹配以 **W** 开头的行 | 打印所有以 `W` 开头的行，并显示行号 (`-n`) |
| `grep -E "[0-9]+@[a-z]+"` | `[0-9]+` 匹配一个或多个数字，`[a-z]+` 匹配一个或多个小写字母 | 匹配简单的邮箱格式（如 `123@qq`） |

---

## 六、文本处理

### 6.1 `find`

**Find** 用于在指定目录下**递归**查找符合条件的文件或目录。

#### 常见选项

- `-name`：按文件名查找，支持通配符 `*` `?`
- `-size`：按文件大小查找（`c`字节，`k`KB，`M`MB，`G`GB）
- `-type`：按文件类型查找

#### 示例

```bash
# 按文件名查找（在当前目录递归查找以 stress 开头的文件）
$ find . -name "stress*"

# 按文件大小查找（查找当前目录下名字以 stress 开头，且大小约为 2KB 的文件）
$ find . -name "stress*" -size 2k
```

### 6.2 `awk`

`awk` 把文件逐行读入，以空格/制表符为默认分隔符将每行切片，然后**按列**对切片进行处理。名称取自创始人首字母，可以记为 **Aw**a**k**e。

#### 内置变量

- `$0`：整行
- `$1`/`$2`: 第1/2列

#### 示例

```bash
# 文件 1.dat 内容：
# 1  1.1
# 2  2.2
# 3  3.3

# 打印第2列乘以 2.3 的结果
awk '{print $2*2.3}' 1.dat

# 输出：
# 2.53
# 5.06
# 7.59
```

### 6.3 `sed`

`sed`（**S**tream **Ed**itor，流式编辑器）用于对文本进行编辑（删除、替换、插入）。功能比 `awk` 更专一（编辑），所以使用更简单

语法格式为

```bash
sed [选项] '脚本' 文件
# 脚本格式为
# '[行范围]d'
# '[行范围]s/查找/替换/[修饰符]'
# '[行范围]a\文本'
# '[行范围]i\文本'
```

#### 常见命令

| 命令 | 含义 | 功能 | 示例 |
| :--- | :--- | :--- | :--- |
| `s` | 替换 | 替换文本 | `'s/old/new/'` |
| `d` | 删除 | 删除行 | `'2d'` |
| `p` | 打印 | 打印行 | `'2p'` |
| `a` | 追加 | 行后添加 | `'2a\hello'` |
| `i` | 插入 | 行前添加 | `'2i\hello'` |
| `c` | 更改 | 替换整行 | `'2c\hello'` |
| `q` | 退出 | 提前退出 | `'10q'` |
| `=` | 显示行号 | 打印行号 | `'/test/='` |

| 修饰符 | 含义 | 功能 | 示例 |
| :--- | :--- | :--- | :--- |
| `g` | 全局 | 替换所有匹配 | `'s/old/new/g'` |
| `i` | 忽略大小写 | 不区分大小写 | `'s/old/new/i'` |
| `Number` | 第N次 | 只替换第N个 | `'s/old/new/2'` |
| `p` | 打印 | 打印替换的行 | `'s/old/new/p'` |

#### 示例

```bash
# 删除文件的第二行（d: delete）
$ sed '2d' example.txt

# 删除包含 "test" 的所有行
$ sed '/test/d' example.txt

# 错误：替换文件
# Shell 在执行命令前，会先处理 > 重定向
# 所以 filename 文件先清空，导致 sed 无内容可读。
$ sed 's/old/new/g' filename > filename

# 正确：使用临时文件
$ sed 's/old/new/g' filename > filename_tmp
$ mv filename_tmp filename
```

---

## 七、系统与环境变量

### 7.1 `export`

`export` 命令用于将变量**导出**为**环境变量**。普通变量只在当前Shell有效，而环境变量在当前Shell及其**子Shell**（如运行脚本、新开终端）中都有效。

#### 常用环境变量

| 变量名 | 说明 |
| :---------------- | :-------- |
| `PATH` | 可执行文件搜索路径 |
| `LD_LIBRARY_PATH` | 动态库搜索路径 |

#### 示例

```bash
# 定义普通变量（仅当前Shell）
$ name="test"

# 导出为环境变量（当前Shell + 子Shell）
$ export name="test"

# 定义并导出，: 为路径分隔符
$ export PATH=/usr/local/bin:$PATH
```

### 7.2 配置文件 `~/.bashrc`

`.bashrc`（**B**ourne **A**gain **Sh**ell **R**un **C**ommands）是用户个人的Shell配置文件。
每次启动新的终端时，bash 都会自动执行此文件中的命令。可以将 `export`、`alias` 等设置写入该文件，实现**永久生效**的个性化配置。

#### 示例

```bash
# 1. 用 vim 或 nano 编辑文件
$ vim ~/.bashrc

# 2. 在文件末尾添加以下内容
# bin path export
export PATH=/home/510group/bin/:$PATH

# alias settings
alias la='ls -A'
alias 3='cd /home/mohan/3_Work/'

# 3. 保存退出后，使配置立即生效
$ source ~/.bashrc
# 或重启终端
```

- `alias`：**Alias**（别名），为长命令创建快捷方式。
- `source`：**Source**（执行），使当前Shell重新读取并执行配置文件。

---

## 八、其他常用命令

### 8.1 远程连接与文件传输

| 命令 | 英文全称/含义 | 功能说明 |
| :--- | :--- | :--- |
| `ssh user@ip -p port` | **S**ecure **Sh**ell | 安全地远程登录到另一台Linux服务器 |
| `ssh-copy-id -i rsa_pub user@ip` | **S**ecure **Sh**ell **Copy** **ID** | 将本地的公钥复制到远程服务器，实现**免密登录** |
| `scp -r user@ip:remote_loc local_loc` | **S**ecure **C**o**p**y | 通过SSH在本地和远程服务器之间安全地**传输文件** (`-r` 递归传输目录) |
| `nohup command &` | **No** **H**ang**Up** | 让命令在后台持续运行，**即使关闭终端/断网/断开SSH连接也不受影响** |

### 8.2 系统管理与资源查看

| 命令 | 英文全称/含义 | 功能说明 |
| :--- | :--- | :--- |
| `df -h` | **D**isk **F**ree | 查看磁盘分区**总容量和使用情况** (`-h`: **h**uman-readable) |
| `du -sh *` | **D**isk **U**sage | 查看当前目录下**各文件和目录的大小** (`-s`: summarize) |
| `sudo reboot` | **S**uper **U**ser **DO** + **Reboot** | 以超级用户权限执行**重启**命令 |
| `sudo shutdown` | **Shutdown** | 以超级用户权限执行**关机**命令，`-h` 关机，`-r` 重启，`-c` 取消，`-t` 时间/秒， |
| `tail` | **Tail** | 显示文件的**末尾**几行 |
| `head` | **Head** | 显示文件的**开头**几行 |
