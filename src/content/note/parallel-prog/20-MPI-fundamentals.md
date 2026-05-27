---
title: 'MPI 基础知识'
excerpt: '26 春 并行程序设计 L20'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'May 12 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

没想到已经 2 个月没学过并行了。。。

## 前置知识与环境准备

### 计算机硬件基础

在编写 MPI 程序前，需明确计算节点的硬件拓扑，这直接决定了进程映射与并行规模。

| 概念 | 英文 | 含义 | Linux 查看命令 |
| :--- | :--- | :--- | :--- |
| **物理 CPU** | Physical CPU | 实际存在的处理器芯片实体 | `grep 'physical id' /proc/cpuinfo \| sort \| uniq` |
| **核心** | Core | 单个物理 CPU 内的独立处理单元 | `cat /proc/cpuinfo \| grep "cpu cores" \| uniq` |
| **逻辑 CPU** | Logical Processor | 操作系统可见的独立调度单元 | `cat /proc/cpuinfo \| grep "processor" \| wc -l` |

**核心**（Core）：

- 核心独享：L1、L2 缓存，寄存器，ALU/FPU 等执行单元
- 核心共享：L3 缓存，内存控制器、系统总线接口

**超线程技术**（Hyper-Threading）：

- 在单个 core 内创建虚拟处理器，共享缓存与执行单元。当一个线程遇到内存墙时，就立刻切换到另外一个线程。
- 一般我们只划分 1 core 为 2 Logical Processor，因为再多会显著提升缓存未命中率。
- 支持超线程时 $\text{Logical Processor} = 2 \times \text{Core}$，不支持超线程时 $\text{Logical Processor} = \text{Core}$。

**注**：
集群（Cluster） > 节点（Node） > 芯片（Socket） > 核心（Core） > 逻辑处理器（Logical Processor）

### 混合语言编程

#### C++ 调用 Linux 命令

通过 `std::stringstream` 拼接命令字符串，配合 `system()` 执行：

```cpp
#include <sstream>
using namespace std;

string fn = "my_docs";
stringstream ss;
ss << " test -d " << fn << " || mkdir " << fn;
system(ss.str().c_str());  // 若目录不存在则创建
```

#### C++ 与 Fortran 混合编译

- C++ 端使用 `extern "C"` 声明 Fortran 函数，强制采用 C 语言的**名称修饰**与调用约定。
- Fortran 端使用 `intent(inout)` 指示参数可被修改。
- Fortran 函数名在链接时通常需加下划线（如 `myfunc_`）。

```cpp
// main.cpp
#include <iostream>
extern "C" void myfunc_(int*);  // 声明 Fortran 函数

int main() {
    int n = 10;
    myfunc_(&n);  // 传地址
    return 0;
}
```

```f90
! plus.f90
subroutine myfunc(n)
    integer, intent(inout) :: n
    n = n + 11
end subroutine myfunc
```

**编译脚本：**

```bash
g++ -c main.cpp
gfortran -c plus.f90
g++ main.o plus.o -o myprog
```

---

## MPI 概述

### 什么是 MPI

**MPI**（**M**essage **P**assing **I**nterface，消息传递接口）：

- 是由学术界与工业界联合制定的**消息传递接口标准**，并非官方标准组织制定，但已成为并行计算领域的事实标准。
- **MPI 不是一门独立的编程语言**，而是必须与 C/C++/Fortran 等串行语言配合使用的**函数库**。
- 核心目的：为跨节点（跨进程）通信提供标准化、可移植的基础软件环境。

### MPI 发展简史与主要实现

| 版本 | 发布时间 | 核心特性 |
| :--- | :--- | :--- |
| **MPI-1** | 1994 | 点对点与集合通信，共 129 个函数 |
| **MPI-2** | 1997 | 非阻塞通信、多线程支持，超过 200 个函数 |
| **MPI-3** | 2012 | 性能优化与扩展 |

**主要实现版本：**

| 实现 | 说明 |
| :--- | :--- |
| **MPICH** | 由 Argonne 国家实验室与 Mississippi 州立大学联合开发，最早且较流行的开源实现 |
| **MVAPICH** | 基于 MPICH，强调对各类硬件和网络的个性化支持 |
| **OpenMPI** | 多个开源实现的合并版，目前使用最广泛 |
| **商业版** | Intel MPI、IBM MPI、Bullx MPI 等 |

### 为什么需要 MPI

随着晶体管数量持续增长，**单线程性能**与**主频**已接近物理瓶颈（约 3 GHz），而**核心数**成为性能增长的主要驱动力。
MPI 正是为了充分利用多核/多节点分布式内存架构而诞生的编程模型。

---

## MPI 核心概念与执行模型

### 核心设计理念

- **进程私有内存**：每个 MPI 进程拥有独立的地址空间，进程间**不共享内存**。
- **消息传递**：进程间通过显式的发送（Send）与接收（Receive）操作交换数据。
- **SPMD**（**S**ingle **P**rogram **M**ultiple **D**ata）：同一段程序并行运行在多个进程/线程上，每个进程/线程（运行在不同的处理器上）处理不同的数据分区。

**注**：

- **OpenMP**（Open Multi-Processing，开放多处理）：
  - 面向**线程**。
  - 基于**共享内存**，核心任务是**同步与防冲突**。
- **MPI**（Message Passing Interface，消息传递接口）：
  - 面向**进程**。
  - 基于**分布式内存**，核心任务是**显式通信**。

### 标准执行流程

1. 包含 MPI 头文件
2. 初始化 MPI 环境，开始并行代码
3. 程序计算与消息传递通信
4. 终止 MPI 环境，结束并行代码
5. 串行代码
6. 程序结束

### 通信域与进程标识

- **通信域**（Communicator）：定义了一组可以相互通信的进程集合。
    `MPI_COMM_WORLD`（**COMM**unicator **WORLD**）是 MPI 预定义的默认通信域，包含程序启动时的**所有进程**。
- **进程标识**（Rank）：进程在通信域中的唯一整数 ID，范围为 `0` 到 `size - 1`。

---

## MPI 程序基础

### 命名惯例

| 语言 | 风格 | 示例 |
| :--- | :--- | :--- |
| C/C++ | `MPI_Aaa_aaa` 形式 | `MPI_Comm_size`、`MPI_Init` |
| Fortran | 通常全大写 | `MPI_INIT`、`MPI_COMM_SIZE` |
| 通用 | 所有 MPI 变量/函数均以 `MPI_` 为前缀 | `MPI_INT`、`MPI_SUCCESS` |

**注**：

- 用户自定义的变量和函数应避免以 `MPI_` 开头，防止混淆。
- Fortran 子程序最后一个参数通常为返回代码 `ierr`，成功时值为 `MPI_SUCCESS`。

### MPI C 语言示例

```c
#include <stdio.h>
#include <mpi.h>          // MPI 头文件

int main(int argc, char** argv) {
    // 1. 初始化 MPI 环境
    MPI_Init(&argc, &argv);

    // 2. 获取通信域中的进程总数
    int world_size;
    MPI_Comm_size(MPI_COMM_WORLD, &world_size);

    // 3. 获取当前进程的 rank
    int world_rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);

    // 4. 获取当前处理器名称
    char processor_name[MPI_MAX_PROCESSOR_NAME];
    int name_len;
    MPI_Get_processor_name(processor_name, &name_len);

    // 5. 打印信息
    printf("Hello world from processor %s, rank %d out of %d processors\n",
           processor_name, world_rank, world_size);

    // 6. 终止 MPI 环境（此后不可再调用 MPI 函数）
    MPI_Finalize();
    return 0;
}
```

**函数逐行解析：**

| 函数 | 英文全称与释义 | 作用 |
| :--- | :--- | :--- |
| `MPI_Init(&argc, &argv)` | **Init**ialize，初始化 | 任何 MPI 程序中必须第一个调用，建立进程间通信基础设施 |
| `MPI_Comm_size(..., &world_size)` | **Comm**unicator **Size**，通信域大小 | 获取 `MPI_COMM_WORLD` 中的进程总数 |
| `MPI_Comm_rank(..., &world_rank)` | **Comm**unicator **Rank**，通信域秩 | 获取当前进程在通信域中的唯一 ID（`0` 到 `size-1`） |
| `MPI_Get_processor_name(...)` | **Get** **Processor** **Name**，获取处理器名 | 获取进程所在节点的 hostname，用于调试与负载分析 |
| `MPI_Finalize()` | **Finalize**，终止 | 释放 MPI 资源，结束并行环境；调用后 MPI 进入未定义状态，不可再次使用 |

### MPI Fortran 版本示例

```f90
program hello_mpi
    implicit none
    include 'mpif.h'

    integer :: num_procs, my_id, ierr
    character(len=MPI_MAX_PROCESSOR_NAME) :: processor_name
    integer :: name_len

    call MPI_INIT(ierr)
    call MPI_COMM_SIZE(MPI_COMM_WORLD, num_procs, ierr)
    call MPI_COMM_RANK(MPI_COMM_WORLD, my_id, ierr)
    call MPI_GET_PROCESSOR_NAME(processor_name, name_len, ierr)

    write(*,*) 'Hello from process ', my_id, ' of ', num_procs, &
               ' on ', trim(processor_name)

    call MPI_FINALIZE(ierr)
end program hello_mpi
```

### 编译与运行

```bash
# C/C++ 编译（使用 mpicxx 或 mpicc 包装器）
mpicxx hello.cpp -o hello_mpi

# Fortran 编译
mpif90 hello.f90 -o hello_mpi

# 运行（-np 指定进程数）
mpirun -np 4 ./hello_mpi
```

---

## 常用环境管理函数

### 计时函数 MPI_Wtime()

- **英文**：**W**all **Time**，墙钟时间（即真实流逝时间）
- **功能**：返回自某个固定起点（通常是 MPI 初始化时刻）以来经过的秒数（`double` 类型）。
- **注意**：`MPI_Wtime()` **不保证跨进程同步**，不同进程获取的时间戳不应直接比较，通常用于测量**单个进程**内的代码段耗时。

```c
#include <mpi.h>
#include <stdio.h>
#include <unistd.h>

int main(int argc, char** argv) {
    MPI_Init(NULL, NULL);
    int rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    double start_time, end_time;
    if (rank == 0) {
        start_time = MPI_Wtime();
        printf("Start time = %f\n", start_time);
    }

    // 模拟计算
    sleep(1);

    if (rank == 0) {
        end_time = MPI_Wtime();
        printf("End time = %f\n", end_time);
        printf("Time elapsed = %f\n", end_time - start_time);
    }

    MPI_Finalize();
    return 0;
}
```

### 进程同步 MPI_Barrier()

- **英文**：**Barrier**，栅栏
- **功能**：通信域内**所有进程**必须都执行到该函数后，才能集体继续向后执行。用于强制同步各进程的进度。

```cpp
#include <iostream>
#include <mpi.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank = 0;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    std::cout << "Process " << rank << " before barrier" << std::endl;

    MPI_Barrier(MPI_COMM_WORLD);  // 所有进程在此等待集合

    std::cout << "Process " << rank << " after barrier" << std::endl;

    MPI_Finalize();
    return 0;
}
```

**预期输出（4 进程）**：

```bash
Process 1 before barrier
Process 0 before barrier
Process 2 before barrier
Process 3 before barrier
Process 0 after barrier   <-- 所有进程到齐后统一继续
Process 1 after barrier
Process 2 after barrier
Process 3 after barrier
```

### 初始化检测 MPI_Initialized()

- **英文**：**Initialized**，已初始化
- **功能**：检测当前 MPI 环境是否已初始化。返回值为整数指针指向的结果：`0` 表示未初始化，非 `0` 表示已初始化。
- **用途**：避免在嵌套调用或库函数中重复执行 `MPI_Init()`。

```cpp
#include <mpi.h>
#include <iostream>

int main(int argc, char** argv) {
    int initialized = -1;
    MPI_Initialized(&initialized);  // 查询状态

    std::cout << "initialized = " << initialized << std::endl;

    if (!initialized) {
        MPI_Init(&argc, &argv);
        std::cout << "initialize MPI" << std::endl;
        initialized = 1;
    }

    int rank = 0;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    if (initialized) {
        MPI_Finalize();
    }
    return 0;
}
```

### 异常终止 MPI_Abort()

- **英文**：**Abort**，终止
- **功能**：立即终止指定通信域内的**所有** MPI 进程，并返回一个错误代码给操作系统。
- **语法**：`int MPI_Abort(MPI_Comm comm, int errorcode)`
- **场景**：发生不可恢复的错误时（如输入数据不一致、通信子创建失败），由某一进程（通常是 `rank == 0`）调用，强制结束整个并行作业。

```c
#include <mpi.h>
#include <stdio.h>

int main(int argc, char** argv) {
    MPI_Init(NULL, NULL);
    int world_rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);

    if (world_rank == 0) {
        // 发生不可恢复错误
        MPI_Abort(MPI_COMM_WORLD, 1);  // 错误代码 1
    }

    MPI_Finalize();  // 实际上不会执行到这里
    return 0;
}
```

### 版本查询 MPI_Get_version()

- **英文**：**Get** **Version**，获取版本
- **功能**：返回当前 MPI 库的主版本号（`version`）与次版本号（`subversion`）。
- **注意**：参数为 `int*` 指针，因此传入变量地址 `&version`。

```c
#include <stdio.h>
#include <mpi.h>

int main(int argc, char *argv[]) {
    int rank, version, subversion;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    MPI_Get_version(&version, &subversion);
    printf("Rank %d is using MPI version %d.%d\n", rank, version, subversion);

    MPI_Finalize();
    return 0;
}
```

### 处理器名称查询 MPI_Get_processor_name()

- **英文**：**Get** **Processor** **Name**，获取处理器名称
- **功能**：获取运行当前进程的处理器（节点）名称，用于调试、日志记录与进程绑定验证。
- **语法**：`int MPI_Get_processor_name(char *name, int *resultlen)`

```c
#include <mpi.h>
#include <stdio.h>

int main(int argc, char** argv) {
    MPI_Init(NULL, NULL);

    char processor_name[MPI_MAX_PROCESSOR_NAME];
    int name_len;
    MPI_Get_processor_name(processor_name, &name_len);

    int rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    printf("Hello from process %d running on %s\n", rank, processor_name);

    MPI_Finalize();
    return 0;
}
```

---

## C/C++ 与 Fortran MPI 接口对比

| 特性 | C/C++ | Fortran |
| :--- | :--- | :--- |
| **头文件** | `#include <mpi.h>` | `include 'mpif.h'` |
| **初始化** | `MPI_Init(&argc, &argv)` | `call MPI_INIT(ierr)` |
| **获取进程数** | `MPI_Comm_size(comm, &size)` | `call MPI_COMM_SIZE(comm, size, ierr)` |
| **获取 Rank** | `MPI_Comm_rank(comm, &rank)` | `call MPI_COMM_RANK(comm, rank, ierr)` |
| **终止环境** | `MPI_Finalize()` | `call MPI_FINALIZE(ierr)` |
| **错误码处理** | 函数返回值 | 通常最后一个参数 `ierr` |
| **编译器** | `mpicxx` / `mpicc` | `mpif90` / `mpif77` |
