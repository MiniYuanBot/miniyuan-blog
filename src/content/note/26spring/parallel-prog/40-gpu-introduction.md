---
title: 'GPU 的发展简介'
excerpt: '26 春 并行程序设计 L40'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'GPU'
pubDate: 'June 10 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 为什么使用 GPU

### 人工智能训练的算力需求

现代大语言模型的训练对算力提出了前所未有的需求，GPU 凭借其强大的并行计算能力成为 AI 基础设施的核心。

- **GPT-3.5** 拥有约 **1750 亿**个训练参数，主要由 GPU 或 TPU 进行并行计算。
- **GPT-4**  reportedly 拥有万亿级参数，训练成本极高。
- **GPT-3** 的训练时间约为 **355 GPU-year**，成本约 **460 万美元**。

> 作为对比：ChatGPT 从公开测试到活跃用户数突破 1 亿仅用了 2 个多月，而电话达到同等用户规模用了 75 年，手机用了 16 年，互联网用了 7 年，推特用了 5 年。

### 国内 H100 GPU 采购规模（截至 2024 年）

`H100`（**Hopper** 架构，2022 年 3 月发布，台积电 4nm 工艺，集成 **800 亿**个晶体管）是目前主流的 AI 训练芯片之一。

| 公司 | 采购数量（约） |
| :--- | ---: |
| 腾讯 Tencent | 5 万块 |
| 百度 Baidu | 4 万块 |
| 阿里巴巴 Alibaba | 2.5 万块 |
| 字节跳动 ByteDance | 2 万块 |

---

## GPU 发展历史

### 从图形处理到通用计算

`GPU`（**Graphics Processing Unit** - 图形处理单元）最初专为图形渲染设计，后逐步演变为通用并行计算设备。

| 时间 | 事件 | 意义 |
| :--- | :--- | :--- |
| 1996 年 | Quake 游戏发布 | 带来独立 3D 显卡革命，推动 GPU 图形渲染需求 |
| 1999 年 10 月 | NVIDIA 发布 GeForce 256 | 首款被称为 "GPU" 的芯片，台积电 220nm 工艺，集成 2300 万个晶体管，首次定义 GPU 品类 |
| 2006 年 | Kumar Chellapilla 使用 GeForce 7800 实现 CNN | 比 CPU 快 **4 倍**，已知最早将 GPU 用于深度学习的尝试 |
| 2009 年 | Andrew Ng 等人发表突破性论文 | GPU 凭借超过 CPU **70 倍**的算力，将 AI 训练时间从几周缩短到几小时 |
| 2012 年 | AlexNet 夺得 ImageNet 冠军 | 使用 **2 颗 GTX 580**（Fermi 架构），在 1400 万张图片、总计 **262 千万亿次**浮点运算的训练量下，准确率远超传统方法，引发 AI 第三次浪潮 |

### 常见应用领域

- **游戏渲染**（Game Rendering）
- **图形设计**（Graphic Design）
- **并行计算**（Parallel Computing / GPGPU）

---

## GPU 架构 vs CPU 架构

### 架构设计哲学差异

GPU 硬件中**简化了控制逻辑**（Control），将更多晶体管用于计算部分（Core）。

| 特征 | CPU | GPU |
| :--- | :--- | :--- |
| 核心数量 | 少（通常个位数到数十个） | 多（数千个 CUDA Core） |
| 控制逻辑 | 占比大，擅长复杂分支与调度 | 占比小，每个 SM 共享控制单元 |
| 缓存结构 | 多级大容量缓存（L1/L2/L3） | 缓存相对较小，L2 共享，L1 与 Shared Memory 共享 |
| 设计目标 | 低延迟，快速处理串行任务 | 高吞吐，大规模并行处理简单计算 |
| 适用场景 | 通用计算、操作系统、复杂逻辑 | 数据并行、矩阵运算、深度学习、图形渲染 |

> **GPGPU**（**General-Purpose computing on Graphics Processing Units** - 通用图形处理器计算）：利用 GPU 的并行计算能力加速通用计算任务的技术。

---

## NVIDIA GPU 架构演化史

### 架构时间线

| 架构名称 | 发布时间 | 代表产品/特性 |
| :--- | :--- | :--- |
| GeForce 系列 | 1999 年 | 首款 GPU，定义图形处理器品类 |
| Tesla | 2006 年 | G80，首款支持 C 语言的 GPU，引入 SIMT 与共享内存 |
| Fermi | 2010 年 | 首款计算 GPU，提升双精度性能，30 亿晶体管，每个 SM 32 个核心，共 512 个内核 |
| Kepler | 2012 年 | SM 扩充到 192 个计算核心（SMX），更多共享内存 |
| Maxwell | 2014 年 | 性能功耗比提升 |
| Pascal | 2016 年 | 16nm 工艺，性能大幅提升，功耗不增加（如 GTX 1080Ti） |
| Volta | 2017 年 | V100，增加 Tensor Core，以深度学习为核心 |
| Turing | 2018 年 | RTX 2080 Ti，去掉了对 FP64 的强力支持（相对 Volta） |
| Ampere | 2019 年 | A100，第 8 代 GPU，FP64 Core 回归 |
| Hopper | 2022 年 | H100，800 亿个晶体管，当前 AI 训练主流 |

---

## Fermi 架构与流式多处理器

### 硬件构成（以 GTX 480 为例）

`GTX 480` 采用 **Fermi** 架构，发布于 2010 年，是 AlexNet 训练所使用的架构前身。

- 最多 **16 个**流式多处理器（`SM`）
- 每个 SM 包含 **32 个 CUDA 核心**
- 采用 **SIMT**（**Single Instruction Multiple Threads** - 单指令多线程）执行模式
- 二级缓存（`L2 Cache`）**768 KB**，被所有 SM 共享
- 主机接口通过 **PCIe**（**Peripheral Component Interconnect Express** - 高速串行计算机扩展总线标准）总线将 GPU 与 CPU 相连

### 流式多处理器（SM）详解

`SM`（**Streaming Multiprocessor** - 流式多处理器）是 GPU 的核心计算单元。

#### SM 关键组件

| 组件 | 英文全称 | 功能说明 |
| :--- | :--- | :--- |
| Warp Scheduler | Warp 调度器 | 调度线程束（Warp）的执行，GTX 480 每个 SM 有 **2 个** |
| Dispatch Unit | 指令分派单元 | 将指令分派到执行单元 |
| Register File | 寄存器文件 | 32,768 × 32-bit，供线程快速访问 |
| CUDA Core | CUDA 核心 | 每个 SM 32 个，负责浮点/整数运算的最小执行核 |
| LD/ST | Load / Store Unit | 加载/存储单元，负责内存读写 |
| SFU | Special Function Unit | 特殊功能单元，处理超越函数等 |
| Shared Memory / L1 Cache | 共享内存 / 一级缓存 | 64 KB，影响性能的关键因素，Block 内线程共享 |
| Interconnect Network | 互联网络 | 连接 SM 内部各组件与外部 L2/DRAM |

#### 线程并发能力

- 每个 SM 可同时处理 **48 个线程束**（`Warp`）
- 每个线程束有 **32 个线程**（`Thread`）
- 每个 SM 可同时处理：48 × 32 = **1536 个线程**
- 整块 GPU（15 个 SM）可同时并发：15 × 48 × 32 = **23,040 个线程**

> 这是 CPU 难以达到的并发规模。CPU 擅长低延迟的串行任务，而 GPU 通过海量线程切换实现高吞吐。

### CUDA 核心

`CUDA Core`（**Compute Unified Device Architecture Core** - CUDA 核心）是 SM 内的基本计算单元。

- 每个 CUDA 核心包含 **1 个整数算术逻辑单元**（`ALU` - **Arithmetic Logic Unit**）和 **1 个浮点运算单元**（`FPU` - **Floating Point Unit**）

---

## CUDA 编程模型

### CUDA 平台概述

`CUDA`（**Compute Unified Device Architecture** - 统一计算设备架构）是 NVIDIA 推出的并行计算平台和编程模型。

- 允许开发者使用 NVIDIA GPU 实现通用计算（GPGPU）
- 提供多种编程接口：`CUDA C`、`CUDA C++`、`CUDA Fortran`，以及 Python 库如 `Numba`、`CuPy`
- 开发者无需深入了解 GPU 底层架构，即可编写高性能并行代码

### 线程层次（Thread Hierarchy）

CUDA 将任务划分为线程，以层级方式组织：

| 层级 | 术语 | 英文解析 | 说明 |
| :--- | :--- | :--- | :--- |
| 最小单位 | `Thread` | **Thread** - 线程 | CUDA 执行的最小单位 |
| 中层组织 | `Block` | **Thread Block** - 线程块 | 由多个线程组成的协作执行单元，块内线程可共享 `Shared Memory` 并同步 |
| 顶层组织 | `Grid` | **Grid** - 网格 | 由多个 Block 组成的完整核函数执行空间 |

> 一个 Grid 可以包含多个 Block，一个 Block 可以包含多个 Thread。线程块内的线程可以协同工作、共享数据并同步执行。

### 执行模型（Execution Model）

CUDA 中的函数被称为**内核**（`Kernel`），在 GPU 上并行执行。

- 内核函数由 **CPU**（`Host` - 主机端）调用，在 **GPU**（`Device` - 设备端）的多个线程上运行
- 内核调用通过 `<<< >>>`（**Execution Configuration** / **Kernel Launch** - 执行配置）指定 Grid 和 Block 的维度
- 线程以灵活的方式同步和协调，完成复杂任务

### 内存模型（Memory Model）

CUDA 提供多种内存类型，在速度和访问权限上有所区别：

| 内存类型 | 英文名称 | 位置 | 速度 | 可见性 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 全局内存 | `Global Memory` | GPU DRAM | 慢 | 所有线程 | GPU 上的主内存，容量大但延迟高 |
| 共享内存 | `Shared Memory` | SM 片上 SRAM | 快 | Block 内线程 | 位于 SM 上的高速内存，Block 内共享 |
| 常量内存 | `Constant Memory` | 全局内存区域 | 较快（带缓存） | 所有线程 | 只读且带缓存的全局内存区域 |
| 纹理内存 | `Texture Memory` | 全局内存区域 | 较快（特殊缓存） | 所有线程 | 针对特定访问模式优化的只读内存 |
| 局部内存 | `Local Memory` | 全局内存中 | 慢 | 单个线程 | 用于寄存器溢出或大型局部数组 |
| 寄存器 | `Register` | SM 寄存器文件 | 最快 | 单个线程 | 每个线程私有，数量受限 |

### CUDA Runtime API 概述

CUDA 提供一系列 API 用于 GPU 内存管理、数据传输和事件管理：

| API 函数 | 英文全称解析 | 功能 |
| :--- | :--- | :--- |
| `cudaMalloc()` | **CUDA Memory Allocate** | 在设备端（GPU）分配全局内存 |
| `cudaFree()` | **CUDA Free** | 释放设备端分配的内存 |
| `cudaMemcpy()` | **CUDA Memory Copy** | 在 Host 与 Device 之间，或 Device 之间拷贝数据 |
| `cudaMemset()` | **CUDA Memory Set** | 将设备内存初始化为指定值 |
| `cudaGetLastError()` | **CUDA Get Last Error** | 获取最近一次 CUDA 调用的错误码 |
| `cudaDeviceSynchronize()` | **CUDA Device Synchronize** | 阻塞 Host，直到设备端所有先前任务完成 |

### 执行空间修饰符

CUDA 通过修饰符区分函数的执行位置：

| 修饰符 | 英文含义 | 执行位置 | 调用方式 |
| :--- | :--- | :--- | :--- |
| `__global__` | **global** - 全局的 | Device（GPU） | 由 Host 调用，核函数入口 |
| `__device__` | **device** - 设备端的 | Device（GPU） | 仅由 Device 调用 |
| `__host__` | **host** - 主机端的 | Host（CPU） | 普通函数，可省略 |

### 内置变量与执行配置

| 变量/符号 | 英文解析 | 含义 |
| :--- | :--- | :--- |
| `threadIdx` | **thread index** - 线程索引 | 当前线程在其 Block 内的局部编号 |
| `blockIdx` | **block index** - 块索引 | 当前 Block 在 Grid 内的全局编号 |
| `blockDim` | **block dimension** - 块维度 | 每个 Block 在 x/y/z 方向上的线程数 |
| `gridDim` | **grid dimension** - 网格维度 | Grid 在 x/y/z 方向上的 Block 总数 |
| `<<< >>>` | **Execution Configuration** | 核函数执行配置，指定 Grid 和 Block 维度 |

### 基础代码示例：向量加法

以下示例展示 CUDA 编程的基本数据流：Host 内存分配、Device 内存分配、数据传输、核函数启动、结果回传。

```cpp
#include <cuda_runtime.h>
#include <iostream>

// 核函数定义：__global__ 表示从 Host 调用，在 Device 执行
__global__ void vecAdd(const float *A, const float *B, float *C, int N) {
    // 计算全局线程索引
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        C[i] = A[i] + B[i];  // 每个线程处理一个元素
    }
}

int main() {
    int N = 1024;
    size_t size = N * sizeof(float);

    // Host 端内存分配
    float *h_A = (float *)malloc(size);
    float *h_B = (float *)malloc(size);
    float *h_C = (float *)malloc(size);

    // 初始化输入数据
    for (int i = 0; i < N; ++i) {
        h_A[i] = 1.0f;
        h_B[i] = 2.0f;
    }

    // Device 端内存分配：cudaMalloc
    float *d_A, *d_B, *d_C;
    cudaMalloc((void **)&d_A, size);
    cudaMalloc((void **)&d_B, size);
    cudaMalloc((void **)&d_C, size);

    // Host -> Device 数据传输：cudaMemcpyHostToDevice
    cudaMemcpy(d_A, h_A, size, cudaMemcpyHostToDevice);
    cudaMemcpy(d_B, h_B, size, cudaMemcpyHostToDevice);

    // 执行配置：<<<Grid, Block>>>
    // 这里使用 256 个线程 per Block，共需要 (N+255)/256 个 Block
    int threadsPerBlock = 256;
    int blocksPerGrid = (N + threadsPerBlock - 1) / threadsPerBlock;
    vecAdd<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, N);

    // 同步等待 Device 完成
    cudaDeviceSynchronize();

    // Device -> Host 数据传输：cudaMemcpyDeviceToHost
    cudaMemcpy(h_C, d_C, size, cudaMemcpyDeviceToHost);

    // 验证结果
    for (int i = 0; i < 5; ++i) {
        std::cout << "C[" << i << "] = " << h_C[i] << std::endl;
    }

    // 释放资源
    cudaFree(d_A);
    cudaFree(d_B);
    cudaFree(d_C);
    free(h_A);
    free(h_B);
    free(h_C);

    return 0;
}
```

### 同步机制

| 函数/机制 | 英文解析 | 作用域 | 说明 |
| :--- | :--- | :--- | :--- |
| `__syncthreads()` | **synchronize threads** | Block 内 | Block 内所有线程到达此点才能继续，用于共享内存一致性 |
| `cudaDeviceSynchronize()` | **CUDA Device Synchronize** | 整个 Device | 阻塞 Host，直到设备端所有先前任务完成（隐式同步点） |

---

## 性能指标与超算应用

### FLOPS 与计算峰值

`FLOPS`（**Floating Point Operations Per Second** - 每秒浮点运算次数）是衡量 GPU 计算性能的关键指标。

以 **Volta 架构 V100** 为例：

| 精度类型 | 峰值性能 | 说明 |
| :--- | :--- | :--- |
| FP64（双精度） | 7.8 TFLOPS | 科学计算关键指标 |
| FP32（单精度） | 15.7 TFLOPS | 通用并行计算 |
| FP16（半精度） | 125 TFLOPS | 深度学习训练主流 |

> **TFLOPS** = Tera FLOPS = 10^12 次浮点运算/秒。

### GPU 超算与 TOP500

GPU 已成为现代超级计算机的核心算力来源。

| 超算名称 | 时间 | GPU/加速器 | 峰值性能 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| Summit | 2018 年 | 27,000 块 V100 | 210.6 PFLOPS | 美国橡树岭国家实验室 |
| Frontier | 2023 年 | AMD Instinct MI250X | 1,679.82 PFLOPS | 美国，TOP500 第一 |
| Fugaku | 2023 年 | 无 GPU（ARM 架构） | 537.21 PFLOPS | 日本理化学研究所 |
| LUMI | 2023 年 | AMD Instinct MI250X | 428.70 PFLOPS | 芬兰 |
| Leonardo | 2023 年 | NVIDIA A100 | 304.47 PFLOPS | 意大利 |
| El Capitan | 2026 年 | AMD Instinct MI300A | 1.742 EFLOPS | 美国 LLNL，百亿亿级超算 |

> **El Capitan**（埃尔卡皮坦）位于美国劳伦斯利弗莫尔国家实验室（LLNL），主要用于核武库存管理与模拟核试验，总核心数超 1100 万，是全球首台正式交付的百亿亿级（Exascale）超算之一。

---

## OpenACC 简介

`OpenACC`（**Open Accelerators** - 开放加速器）是一种用于加速科学应用的编程范例。

- 通过向代码中添加**编译指令**（Pragma），让编译器自动在 GPU 等异构设备上并行执行
- 类似于 `OpenMP` 的指令形式，简化了并行编程
- 支持 C、C++、Fortran
- 可移植性强，可在不同加速器（GPU、多核 CPU）上运行
- 可与 `OpenMP`、`MPI` 等编程模型结合使用

---

## 本节总结

| 对比项 | CPU | GPU |
| :--- | :--- | :--- |
| 设计目标 | 低延迟，复杂控制流 | 高吞吐，数据并行 |
| 核心数 | 少而精 | 多而简（海量 CUDA Core） |
| 线程管理 | 硬件线程少，上下文切换开销大 | 硬件线程极多，Warp 切换隐藏延迟 |
| 缓存策略 | 大容量多级缓存减少访存延迟 | 缓存较小，依赖线程切换隐藏延迟 |
| 适用场景 | 操作系统、数据库、串行逻辑 | 矩阵运算、深度学习、图形渲染、科学模拟 |

### 思考题

1. 为什么 GPU 将更多晶体管用于计算单元而非控制逻辑？这与 CPU 的设计哲学有何根本差异？
2. 在 Fermi 架构中，一个 SM 可同时驻留 1536 个线程，但仅有 32 个 CUDA Core，这种**超配**（Over-subscription）设计如何通过 `Latency Hiding`（延迟隐藏）提升整体吞吐？
3. 为什么 AlexNet 在 2012 年仅用 2 颗 GTX 580 就能击败传统方法？GPU 的并行特性如何适配卷积神经网络的计算模式？
4. `__global__` 与 `__device__` 函数在调用方式和执行位置上有什么区别？
5. `cudaDeviceSynchronize()` 与 `__syncthreads()` 的作用域分别是什么？在什么场景下必须使用它们？
6. 为什么 Shared Memory 比 Global Memory 快得多？它的物理位置在哪里？
7. 如何计算一维线程的全局索引？公式 `blockIdx.x * blockDim.x + threadIdx.x` 中各变量的含义是什么？
8. 从 TOP500 榜单看，现代超算为什么普遍采用 GPU 或加速器架构？`计算访存比`（Compute-to-Memory Ratio）对算法设计有何影响？
