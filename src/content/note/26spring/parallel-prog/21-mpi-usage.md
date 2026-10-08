---
title: 'MPI 使用建议'
excerpt: '26 春 并行程序设计 L21'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'May 13 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## MPI 软件环境配置

以下为从源码编译安装 OpenMPI，适用于 Linux 系统。推荐将 MPI 安装到系统公共目录（如 `/opt`），以便所有用户共享使用。

### 下载与解压

```bash
# 创建并进入构建目录（建议在 /tmp 或家目录操作）
mkdir -p ~/build && cd ~/build

# 下载 OpenMPI 源码包（示例为 v5.0.10）
wget https://download.open-mpi.org/release/open-mpi/v5.0/openmpi-5.0.10.tar.gz

# 解压缩
tar -zxf openmpi-5.0.10.tar.gz
cd openmpi-5.0.10
```

### 编译安装

```bash
# 配置安装路径为公共目录（需要 root 权限）
./configure --prefix=/opt/openmpi-5.0.10

# 编译（-j 并行编译，$(nproc) 自动获取 CPU 核心数）
make -j$(nproc)

# 安装（需 root 权限）
sudo make install
```

### 配置系统环境

安装完成后，需要让所有用户都能直接使用 MPI 命令，并让系统能找到动态库。

**可执行文件路径**：

将常用 MPI 工具链接到 `/usr/local/bin`，该目录已在默认 `PATH` 中：

```bash
sudo ln -sf /opt/openmpi-5.0.10/bin/mpicc   /usr/local/bin/mpicc
sudo ln -sf /opt/openmpi-5.0.10/bin/mpirun   /usr/local/bin/mpirun
sudo ln -sf /opt/openmpi-5.0.10/bin/mpiexec  /usr/local/bin/mpiexec
# 可根据需要添加其他工具（如 mpicxx, mpifort 等）
```

**动态库路径**：

将 MPI 库路径写入系统 ld 配置，避免每个用户手动设置 `LD_LIBRARY_PATH`：

```bash
echo "/opt/openmpi-5.0.10/lib" | sudo tee /etc/ld.so.conf.d/openmpi.conf
sudo ldconfig
```

### 用户级环境配置

如果出于特殊原因未使用上述系统级配置，或需要临时覆盖默认路径，可在用户自己的 `~/.bashrc` 中添加：

```bash
export PATH=/opt/openmpi-5.0.10/bin:$PATH
export LD_LIBRARY_PATH=/opt/openmpi-5.0.10/lib:$LD_LIBRARY_PATH
```

然后执行 `source ~/.bashrc` 使其生效。

### 环境变量说明

| 环境变量 | 英文全称 | 作用 |
| :---: | :--- | :--- |
| `PATH` | - | 可执行文件搜索路径，使 `mpicc`、`mpirun` 等命令可直接调用 |
| `LD_LIBRARY_PATH` | **L**oad **D**ynamic Library Path | 动态链接器搜索共享库（`.so`）的路径 |

### 验证安装

任意普通用户均可执行：

```bash
which mpicc          # 应显示 /usr/local/bin/mpicc（或软链接指向的真实路径）
mpicc --version      # 显示底层编译器版本（如 GCC 版本）
mpirun --version     # 显示 Open MPI 版本信息
```

---

## MPI 程序的编译

### MPI 编译器包装器

OpenMPI 提供了一系列**编译器包装器**，它们会自动处理 MPI 头文件路径（`-I`）和库文件链接（`-L`, `-l`）：

| 包装器 | 适用语言 | 底层编译器示例 |
| :---: | :---: | :--- |
| `mpicc` | **C** | `gcc`, `icc` |
| `mpicxx` | **C++** | `g++`, `icpc` |
| `mpifort` | **Fortran** | `gfortran`, `ifort` |

**注**：这些包装器并非独立编译器，而是调用系统已有的 C/C++/Fortran 编译器并自动附加 MPI 相关的编译和链接参数。

**基本编译命令**：

```bash
# 编译 C 程序
mpicc hello_world.c -o hello_world

# 编译 C++ 程序
mpicxx hello_world.cpp -o hello_world

# 编译 Fortran 程序
mpifort hello_world.f90 -o hello_world
```

- `-o`（**o**utput）：指定输出可执行文件的名称

### 使用 Makefile 编译

**Makefile** 是 Linux/Unix 下常用的自动化构建工具，通过定义**目标**（Target）和**依赖**（Dependency）关系来管理编译流程。

```makefile
# Makefile 示例

# CC（C Compiler）：指定 MPI C 编译器
CC=mpicc

# CFLAGS（C Compiler Flags）：编译选项
# -o 指定输出文件名
CFLAGS=-o

# 目标:依赖
hello_world: hello_world.c
 $(CC) $(CFLAGS) hello_world hello_world.c

# clean 目标：清理生成的文件
clean:
 rm -f hello_world
```

**关键语法解析**：

| 符号/变量 | 含义 |
| :--- | :--- |
| `CC` | **C** **C**ompiler - C 编译器 |
| `CFLAGS` | **C** **C**ompiler **Flags** - C 编译器标志/选项 |
| `$(CC)` | 引用变量 `CC` 的值 |
| `hello_world: hello_world.c` | 目标 `hello_world` 依赖于源文件 `hello_world.c` |
| `rm -f` | **f**orce - 强制删除，不提示确认 |

编译与清理：

```bash
make hello_world    # 编译目标
make clean          # 执行清理
```

### 使用 CMake 编译

**CMake**（**C**ross-platform **Make**）是跨平台的构建系统生成器，遵循 "**Write once, run everywhere**" 理念。

**工作流程**：

1. 编写 `CMakeLists.txt`
2. 运行 `cmake PATH` 生成 Makefile（或 Visual Studio 工程）
3. 运行 `make` 编译

```cmake
# CMakeLists.txt 示例

# 指定最低 CMake 版本
cmake_minimum_required(VERSION 3.10)

# 定义项目名称
project(HelloWorldMPI)

# 查找 MPI 库（REQUIRED 表示必须找到，否则报错）
find_package(MPI REQUIRED)

# 添加可执行文件目标
add_executable(hello_world hello_world.c)

# 将 MPI 库链接到目标
target_link_libraries(hello_world MPI::MPI_C)
```

**关键指令解析**：

| CMake 指令 | 英文释义 | 作用 |
| :--- | :--- | :--- |
| `cmake_minimum_required` | CMake Minimum Required | 声明项目所需的最低 CMake 版本 |
| `project` | Project | 定义项目名称 |
| `find_package` | Find Package | 查找并加载外部库（此处为 MPI）的配置 |
| `add_executable` | Add Executable | 定义一个可执行文件目标及其源文件 |
| `target_link_libraries` | Target Link Libraries | 为目标链接所需的库 |

编译步骤：

```bash
mkdir build && cd build
cmake ..              # 上级目录包含 CMakeLists.txt
make                  # 生成可执行文件
```

---

## MPI 程序的执行

### 直接运行的局限

若直接执行 MPI 编译出的可执行文件：

```bash
./hello_world
```

**输出示例**：

```bash
Hello world from processor ubuntu, rank 0 out of 1 processors
```

仅启动**单个进程**，该进程的 `rank` 为 `0`，通信子大小 `size` 为 `1`，无法体现 MPI 的并行特性。

### 使用 mpirun 启动多进程

**`mpirun`**（**MPI** **Run**，MPI 运行器）是启动和管理 MPI 并行程序的标准工具，负责在多台计算节点上组织和调度进程，并建立进程间的通信网络。

```bash
# 使用 4 个进程执行程序
mpirun -np 4 ./hello_world
```

**参数解析**：

| 参数 | 全称/含义 | 说明 |
| :--- | :--- | :--- |
| `-np` | **N**umber of **P**rocesses | 指定启动的进程数量 |

**预期输出（4 进程，顺序可能不同）**：

```bash
Hello world from processor ubuntu, rank 1 out of 4 processors
Hello world from processor ubuntu, rank 2 out of 4 processors
Hello world from processor ubuntu, rank 0 out of 4 processors
Hello world from processor ubuntu, rank 3 out of 4 processors
```

### 使用 Shell 脚本自动化编译与运行

将编译和运行步骤整合为 **Shell Script**：

```bash
#!/bin/bash

# 编译 MPI 程序
mpicc hello_world.c -o hello_world

# 使用 4 个进程运行
mpirun -np 4 ./hello_world
```

执行：

```bash
chmod +x mpi_hello_world.sh    # 添加执行权限
./mpi_hello_world.sh           # 运行脚本
```

---

## 对比与总结

### 构建工具对比

| 特性 | 手动编译 | Makefile | CMake |
| :--- | :--- | :--- | :--- |
| **复杂度** | 低 | 中 | 中 |
| **跨平台性** | 无 | Unix Only | 跨平台（Unix/Windows） |
| **自动依赖管理** | 无 | 有 | 有 |
| **MPI 支持** | 直接调用 `mpicc` | 调用 `mpicc` | `find_package(MPI)` |
| **适用场景** | 单文件快速测试 | 中小型 Linux 项目 | 大型跨平台项目 |
