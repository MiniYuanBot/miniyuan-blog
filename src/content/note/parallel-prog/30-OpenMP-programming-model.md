---
title: 'OpenMP 编程模型'
excerpt: '26 春 并行程序设计 L30'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'June 02 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 核心概念与背景

### 从串行到并行

程序是运行在计算机上的指令流。在摩尔定律的引领下，程序员长期习惯于编写适用于**顺序计算机**的程序。然而，随着摩尔定律走向终结，硬件工程师将越来越复杂的并行结构交给软件开发者。并行程序是同时在多个处理单元上运行多个指令流，其基本思想简单，但正确使用并行计算解决实际问题并不简单。

**关键理解**：并行计算中的许多理念（如共享内存、线程同步、数据竞争）对于传统顺序编程是陌生的。在 AI 与 HPC 时代，**OpenMP**、MPI、CUDA 等并行方式依然不可替代。

### 进程、线程与共享内存

在操作系统中，**进程（process）**是资源分配的基本单位，拥有独立的存储空间；**线程（thread）**是调度执行的基本单位，可视为进程的一部分，一个进程可以开启多个线程。

| 特性 | 进程（Process） | 线程（Thread） |
| :--- | :--- | :--- |
| **内存空间** | 私有，相互独立 | 共享同一进程的内存 |
| **通信方式** | 需显式消息传递（如 MPI 的 `Send`/`Recv`） | 直接读写共享变量即可"通信" |
| **创建/调度开销** | 大 | 小 |
| **并行模型** | 分布式内存（Distributed Memory） | 共享内存（Shared Memory） |

**OpenMP**（**Open Multi-Processing** - 开放多处理）正是基于**共享内存**的多线程并行编程接口。它包含**编译制导指令**、**库函数**和**环境变量**三部分，支持 Fortran、C/C++ 等多种语言，具有良好的可移植性。

---

## Fork-Join 并行执行模式

### 模式概述

OpenMP 主要采用 **Fork-Join**（**分叉-合并**）模式进行并行：

1. 程序开始时只有一个**主线程（Master Thread）**运行串行代码
2. 当遇到 `#pragma omp parallel` 时，主线程**分叉（Fork）**出一组线程，共同执行并行区域内的代码
3. 并行区域结束后，所有线程**合并（Join）**，仅主线程继续执行后续串行代码
4. 该模式可在程序中反复出现，形成"串行区 → 并行区 → 串行区 → 并行区"的交替结构

### 并发性与执行交错

**并发（Concurrency）** 并不意味着严格的"同时执行"，而是指多个指令流之间的指令相互无序。编译时通过 `-fopenmp` 告诉编译器创建多线程程序。

> ⚠️ **注意事项**：每个线程内部的 `cout` 语句遵循程序定义的顺序，但在**不同线程之间没有指定顺序**。因此每次运行的输出交错方式可能都不一样。作为程序员，必须确保**所有可能的执行交错都能产生正确结果**。

---

## OpenMP 编程三要素

OpenMP 程序由串行程序通过以下三个组成部分改造而来：

```text
串行程序 ──→ [ 编程指导语句 ] ──→ 并行程序
             [   库函数    ]  ↑
             [  环境变量   ] ──┘
```

### 编译制导指令（Programming Directives）

`#pragma`（源于希腊语，意为"行动/事务"）在计算机科学中用于指代**编译器指令**。在 OpenMP 中，它与特定关键字组合，指导编译器如何在并发环境中执行代码。

C/C++ 中 OpenMP 指令的基本格式：

```cpp
#pragma omp directive-name [clause[[,] clause]...]
```

**核心指令**：

- `#pragma omp parallel`（**parallel** - 并行区域，创建一组线程执行结构化块）

> 课件中表格还提及了其他常见指令（后续课程展开）：
>
> - `#pragma omp for`（**for** - 循环工作共享，将循环迭代分配给各线程）
> - `#pragma omp barrier`（**barrier** - 屏障，线程在此等待直到所有线程到达）
> - `#pragma omp critical`（**critical** - 临界区，同一时刻仅允许一个线程执行）
> - `#pragma omp parallel for`（**parallel for** - 并行区域与循环工作共享的合并写法）
> - `#pragma omp single`（**single** - 仅由单个线程执行）
> - `#pragma omp task`（**task** - 任务，异步执行单元）

### 库函数（Library Functions）

OpenMP 提供辅助编程的 API，程序员可通过调用这些函数获取运行时信息。

| 库函数 | 英文全称解析 | 功能说明 |
| :--- | :--- | :--- |
| `omp_set_num_threads(n)` | **set number of threads** - 设置线程数 | 设置后续并行区域的默认线程数，直到被新值覆盖 |
| `omp_get_thread_num()` | **get thread number** - 获取线程编号 | 返回当前线程在团队中的 ID，**主线程为 0**，依次递增 |
| `omp_get_num_threads()` | **get number of threads** - 获取线程总数 | 返回当前并行区域中的线程总数 |
| `omp_get_wtime()` | **get wall time** - 获取墙上时钟时间 | 返回自过去某一时刻起经过的秒数，用于性能计时 |
| `omp_get_num_procs()` | **get number of processors** - 获取处理器核心数 | 返回程序可用的处理器核心数量 |

### 环境变量（Environment Variables）

环境变量与库函数在功能上通常对应，用于在程序外部控制 OpenMP 行为。

| 环境变量 | 英文全称解析 | 功能说明 |
| :--- | :--- | :--- |
| `OMP_NUM_THREADS` | **OpenMP Number of Threads** - 线程数量 | 设置并行区域的默认线程数 |
| `OMP_SCHEDULE` | **OpenMP Schedule** - 调度策略 | 设置循环的默认调度策略（如 `static`、`dynamic` 等） |

**最佳实践提示**：在 Linux 中通过 `export OMP_NUM_THREADS=10` 设置环境变量，使用 `echo $OMP_NUM_THREADS` 查看，使用 `unset OMP_NUM_THREADS` 清除。
若清除环境变量且程序中未显式设置，则默认使用**所有逻辑 CPU**（如 56 个线程）。

---

## 代码示例

### 示例一：Hello World（串行 vs 并行）

**串行版本**：

```cpp
#include <iostream>

int main() {
    std::cout << "Hello 1" << std::endl;
    std::cout << "Hi" << std::endl;
    std::cout << "Hello 2" << std::endl;
    return 0;
}
```

**并行版本**：

```cpp
#include <iostream>
#include <omp.h>  // OpenMP 头文件

int main() {
    std::cout << "Hello 1" << std::endl;  // 串行区：仅主线程执行

    #pragma omp parallel  // 进入并行区域（Fork）
    {
        std::cout << "Hi" << std::endl;  // 并行区：所有线程各执行一次
    }  // 并行区域结束（Join）

    std::cout << "Hello 2" << std::endl;  // 串行区：仅主线程执行
    return 0;
}
```

**编译与运行**：

```bash
g++ -fopenmp hello_world_openmp.cpp -o hello_world_openmp
./hello_world_openmp
```

**常见错误**：
若期望看到 5 行整齐的 `Hello world`，实际输出可能是交错的 `Hello worldHelloHello world`。
这是因为多个线程同时向标准输出写入，产生了**数据竞争（Race Condition）**。`omp_get_thread_num()` 可以帮助区分不同线程的输出。

### 示例二：利用线程 ID 分离输出

```cpp
#include <iostream>
#include <omp.h>
#include <sstream>
#include <fstream>

int main() {
    using namespace std;

    const int nthreads = 4;
    omp_set_num_threads(nthreads);  // 设置线程数为 4

    #pragma omp parallel
    {
        stringstream ss;
        
        // 获取当前线程 ID（从 0 开始）
        const int id = omp_get_thread_num();  // get thread number
        ss << "Log_" << id + 1 << ".txt";
        
        // 每个线程独立写入自己的文件，避免输出交错
        ofstream ofs(ss.str().c_str());
        ofs << "Hello from thread " << id << endl;
        ofs.close();
    }

    return 0;
}
```

**执行逻辑**：

- 4 个线程分别创建 `Log_1.txt` ~ `Log_4.txt`
- 每个文件内记录对应线程的 ID，彻底避免了标准输出的竞争问题

---

## 对比与总结

### 串行执行 vs Fork-Join 并行执行

| 阶段 | 串行程序 | OpenMP 并行程序 |
| :--- | :--- | :--- |
| **开始** | 单线程依次执行所有语句 | 主线程执行串行区 |
| **并行区入口** | 无 | 主线程 Fork 出多个子线程 |
| **并行区内** | 无 | 所有线程（含主线程）同时执行相同代码块 |
| **并行区出口** | 无 | 所有子线程 Join，仅主线程继续 |
| **结束** | 单线程结束 | 主线程继续执行后续串行区 |

### 设置线程数的三种方式优先级

| 方式 | 示例 | 说明 |
| :--- | :--- | :--- |
| **环境变量** | `export OMP_NUM_THREADS=8` | 全局设置，影响所有未显式指定的并行区 |
| **库函数** | `omp_set_num_threads(4)` | 程序内设置，覆盖环境变量，影响后续并行区 |
| **指令子句** | `#pragma omp parallel num_threads(2)` | 仅影响当前并行区（最细粒度，优先级最高） |

**思考题**：如果环境变量设置为 8，程序中 `omp_set_num_threads(4)`，而指令上又有 `num_threads(2)`，最终线程数是多少？（答案：2，就近原则）
