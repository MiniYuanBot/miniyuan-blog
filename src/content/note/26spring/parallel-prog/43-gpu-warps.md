---
title: 'GPU 的线程束'
excerpt: '26 春 并行程序设计 L43'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'GPU'
pubDate: 'June 13 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 线程束（Warp）

### 概念解释

**Warp**（**线程束**）是 GPU 的**基本执行单元**。当一个线程块（Block）被调度到 **SM**（**Streaming Multiprocessor** - 流式多处理器，GPU 的核心计算单元）上执行后，Block 中的线程会被进一步划分为多个 Warp。

| 层级 | 英文术语 | 说明 |
| :--- | :--- | :--- |
| 线程 | **Thread** | CUDA 执行的最小单位 |
| 线程块 | **Thread Block** / **Block** | 由多个线程组成的协作执行单元，可共享 **Shared Memory** |
| 线程束 | **Warp** | 32 个线程组成的执行单位，同一 Warp 内线程以 **SIMT**（**Single Instruction Multiple Threads** - 单指令多线程）方式执行 |
| 网格 | **Grid** | 由多个 Block 组成的完整核函数执行空间 |
| 流多处理器 | **SM** | GPU 的核心计算单元，负责调度与执行 Warp |

> [!note] SIMT 本质
> 一个 Warp 中的所有线程在同一时刻执行**相同的指令**，但操作不同的数据。这与 **SIMD**（**Single Instruction Multiple Data** - 单指令多数据流）架构密切相关，可以最大限度地提高吞吐量。

**Warp 大小**是硬件固定的，通常为 **32 线程**。`warpSize` 是内建 CUDA 变量，表示当前硬件支持的 Warp 大小。

---

### 核心修饰符与执行配置

| 修饰符 | 英文含义 | 执行位置 | 调用位置 |
| :--- | :--- | :--- | :--- |
| `__global__` | **global** - 全局的 | Device（GPU） | Host（CPU）或 Device（CUDA 动态并行） |
| `__device__` | **device** - 设备端的 | Device | 仅 Device |
| `__host__` | **host** - 主机端的 | Host | 仅 Host（可省略） |

核函数调用使用 `<<< >>>`（**Execution Configuration** / **Kernel Launch** - 执行配置），用于指定 Grid 和 Block 的维度。

---

### 例 1：打印线程束大小

```cpp
#include <iostream>

__global__ void hello_PKU()
{
    // warpSize 是内建 CUDA 变量，表示当前硬件支持的线程束大小
    printf("warpSize=%d\n", warpSize);
}

int main()
{
    int num_blk = 2;   // number of blocks
    int num_thd = 4;   // number of threads per block

    hello_PKU<<< num_blk, num_thd >>>();
    cudaDeviceSynchronize();  // 阻塞 Host，等待 Device 完成

    return 0;
}
```

**运行结果**：输出 8 行 `warpSize=32`（2 blocks × 4 threads = 8 个线程各执行一次）。

> [!warning] 注意
> 核函数内**不能使用 `cout`**，只能用 `printf` 输出。

---

### 分支发散（Divergence）

GPU 中频繁的分支程序会导致利用率严重下降。

**原理**：由于硬件上每次只能为一个 Warp 获取一条执行指令，如果 Warp 内部分线程走 `if` 分支，另一部分走 `else` 分支，则硬件会**串行化**执行两个路径，导致部分线程阻塞。

> 类似于飞机的上座率：一条指令相当于一个航班，分支增加了指令个数，降低了"上座率"。

---

### 例 2：Warp 内的分支执行

```cpp
#include <iostream>
using namespace std;

__global__ void hello_PKU()
{
    const int index = threadIdx.x + 1;

    if (index <= 8)
    {
        printf("id<=8 id=%d\n", index);
    }
    else
    {
        printf("id> 8 id=%d\n", index);
    }
}

int main()
{
    int num_blk = 1;
    int num_thd = 9;  // 9 个线程 = 1 个 Warp（32 线程，但只启用 9 个）

    hello_PKU<<< num_blk, num_thd >>>();
    cudaDeviceSynchronize();

    return 0;
}
```

**运行结果**：

```
Hello from CPU! id> 8 id=9 id<=8 id=1 id<=8 id=2 ... id<=8 id=8
```

**观察**：`id<=8` 的输出是**连在一片的**。这是因为 Warp 内线程以 SIMT 方式执行，虽然逻辑上有分支，但硬件层面的执行顺序受 Warp 调度影响。

---

### 回顾：矩阵加法的 CUDA 程序

```cpp
__global__ void add_matrices(double *a, double *b, double *c, const int n)
{
    const int index = threadIdx.x;
    c[index] = a[index] + b[index];
    printf("Hello from GPU %d!\n", index);
}
```

**问题**：假设 4 个 Warp（128 线程）同时作业，系统如何调度？

**答案**：**不是**每个 Warp 全部做完 3 个操作（读、加、写）再处理下一个 Warp。SM 采用**流水线式调度**：当 Warp 0 发出内存请求后会被挂起，SM 立即切换到就绪队列中的 Warp 1 执行，以此隐藏延迟。

---

## 同步机制

### `__syncthreads()` 与 `__syncwarp()`

| 函数 | 英文全称 | 同步范围 | 分支内使用 | 死锁风险 |
| :--- | :--- | :--- | :--- | :--- |
| `__syncthreads()` | **synchronize threads** - 同步线程 | **整个 Block** | ❌ **严禁** | 部分线程跳过则死锁 |
| `__syncwarp()` | **synchronize warp** - 同步线程束 | **单个 Warp** | ✅ 允许 | 仅同步参与线程，不会死锁 |

> [!abstract] 关键区别
> `__syncthreads()` 硬性要求当前 Block 内**每一个线程**都必须执行到这条指令。若放在 `if/else` 分支里，部分线程跳过该语句，会导致**死锁**。

---

### 例 3：Block 级同步 `__syncthreads()`

```cpp
#include <cuda_runtime.h>
#include <stdio.h>

__global__ void block_sync_demo()
{
    __shared__ int sh_data[64];  // 共享内存，Block 内所有线程共享
    int tid = threadIdx.x;

    // 所有线程写入共享内存
    sh_data[tid] = tid;

    // 等待当前 block 内全部 64 个线程执行到此处
    __syncthreads();

    // 安全读取其他线程的数据
    if (tid == 0)
    {
        printf("block 同步完成, sh_data[1] = %d\n", sh_data[1]);
    }
}

int main()
{
    // 1 个 block，64 个线程（包含 2 个 warp）
    block_sync_demo<<<1, 64>>>();
    cudaDeviceSynchronize();
    return 0;
}
```

**输出**：`block 同步完成, sh_data[1] = 1`

> [!warning] 注意
> 64 线程 = 2 个 Warp，`__syncthreads()` 会让两个 Warp 互相等待。若把此函数放在 `if/else` 分支里，部分线程跳过该语句，会**直接死锁**。

---

### 例 4：Warp 级同步 `__syncwarp()`

```cpp
__global__ void warp_sync_demo()
{
    int tid = threadIdx.x;
    int lane = tid % 32;  // 当前线程在 warp 内的编号 0~31

    // 分支内使用 __syncwarp 合法
    if (lane < 16)
    {
        // 仅同步当前这一个 warp 的线程
        __syncwarp();
        printf("warp 内线程 %d 同步完成\n", tid);
    }
}

int main()
{
    // 1 个 block，64 个线程（2 个独立 warp）
    warp_sync_demo<<<1, 64>>>();
    cudaDeviceSynchronize();
    return 0;
}
```

**分析**：

- 只有 lane 0~15 这前 16 个线程进入分支、执行 `__syncwarp`
- lane 16~31 跳过分支，不会执行这句同步
- **只要参与同步的线程属于同一个 Warp，就不会死锁**

**对比实验**：

| 情况 | 代码 | 结果 |
| :--- | :--- | :--- |
| 情况 1 | `if (lane < 32) { __syncthreads(); }` | ✅ 可以运行，因为 Block 内所有线程都进入分支 |
| 情况 2 | `if (lane < 16) { __syncthreads(); }` | ❌ **死锁**，前 16 个线程卡在 `__syncthreads()` 等待 Block 内全部线程汇合 |

---

## 延迟（Latency）

### 指令延迟类型

| 延迟类型 | 英文 | 典型周期 | 说明 |
| :--- | :--- | :--- | :--- |
| 算术指令延迟 | **Arithmetic Instruction Latency** | 10~20 周期 | 加法、乘法等基本运算的执行时间 |
| 访存指令延迟 | **Memory Access Instruction Latency** | 400~800 周期 | 访问全局内存（DRAM）的传输时间 |

> 延迟越低，GPU 效率越高。访存延迟远高于算术延迟，因此**隐藏访存延迟**是 GPU 性能优化的核心。

---

### 算术指令延迟影响因素

1. **硬件性能**：处理器核心数量、运行频率、指令集架构
2. **指令复杂度**：加法/减法通常比乘法/除法更快
3. **指令依赖**：后续指令需等待前序指令完成
4. **资源争用**：多个核心/线程竞争寄存器、缓存等有限资源
5. **软件优化**：编译器指令调度、循环展开、向量化等

---

### GPU 线程调度模型

GPU 通过**多 Warp 交错执行**来隐藏延迟。SM 维护三类队列：

| 队列 | 英文 | 状态 |
| :--- | :--- | :--- |
| 就绪队列 | **Ready Queue** | Warp 已准备好执行下一条指令 |
| 执行队列 | **Execution Queue** | Warp 正在执行指令 |
| 挂起队列 | **Pending Queue** | Warp 等待数据（如内存请求），被挂起 |

**调度流程**：

1. **周期 0**：Warp 0 执行读内存操作（访问全局内存中的 `a` 和 `b`），发出内存请求
2. **周期 1**：Warp 0 因访存被**挂起**，SM 从就绪队列调度 Warp 1 执行
3. **周期 8**：所有 Warp 都可能因访存被挂起，GPU 暂时闲置
4. **数据返回后**：Warp 0 回到就绪队列，排队执行下一条指令
5. **无指令时**：Warp 消亡，所有 Warp 结束后 Kernel 返回 CPU

---

### 利特尔法则（Little's Law）估算活跃 Warp

**利特尔法则**起源于队列理论，用于估算 GPU 隐藏延迟所需的活跃线程束数量：

$$\text{所需线程束数量} = \text{延迟} \times \text{吞吐量}$$

**示例**：

- 单条指令平均执行延迟：**5 个周期**
- SM 每个周期可同时调度 **6 个 Warp** 进入运算
- 单个 Warp 送出指令后需闲置 **5 - 1 = 4 个周期** 才能再次被调度
- 为了硬件每时每刻不空转、稳定每周期跑满 6 个 Warp：

$$\text{最少活跃 Warp} = 4 \times 6 = 24 \text{ 个}$$

> 这意味着需要至少 **24 个未完成（in-flight）的 Warp** 来填满流水线空档，实现硬件满负荷运行。

---

### CPU vs GPU 延迟隐藏策略对比

| 策略 | CPU | GPU |
| :--- | :--- | :--- |
| 核心思路 | 减少延迟 | **隐藏延迟**（通过大量并行） |
| 指令级并行 | 超标量执行、流水线划分 | SIMT，单指令操作多数据 |
| 分支处理 | 分支预测 | 无分支预测，Warp 内串行化执行分支 |
| 缓存策略 | 多级缓存减少内存延迟 | 本地共享内存（Shared Memory）减少全局内存访问 |
| 线程切换 | 上下文切换开销大 | 零开销 Warp 切换，快速调度 |
| 并行规模 | 少量线程 | 大量 Warp 同时驻留 |

**GPU 特有策略**：

- **并行架构**：多核多线程，同时处理大量并行任务
- **SIMD/SIMT**：一个时钟周期内单指令操作多数据
- **本地共享内存**：减少全局内存访问延迟和带宽需求
- **异步计算和流处理**：多流并行执行，提高资源利用率
- **内核调度和上下文切换**：动态调度 Warp，减少执行延迟

---

## 本节总结

1. **Warp 是 GPU 调度和执行的基本单元**，固定 32 线程，SIMT 执行模式。
2. **分支发散**会严重降低 GPU 利用率，应尽量避免 Warp 内线程走不同分支路径。
3. `__syncthreads()` 要求 Block 内**所有线程**参与，**严禁放在分支内**；`__syncwarp()` 仅同步单个 Warp，**可在分支内安全使用**。
4. GPU 通过**快速 Warp 切换**隐藏访存延迟（400~800 周期），而非依赖缓存。
5. **利特尔法则**：所需活跃 Warp 数 = 延迟 × 吞吐量，是估算 SM 占用率的重要工具。

---

## 思考题

1. 为什么 `__syncthreads()` 放在 `if/else` 分支内会导致死锁？什么条件下可以安全使用？
2. 如果一个 Block 只有 16 个线程，调用 `__syncthreads()` 是否有效？与 `__syncwarp()` 有何区别？
3. 为什么 GPU 的访存延迟（400~800 周期）远高于算术延迟（10~20 周期），但 GPU 仍能通过高吞吐量保持高效？
4. 假设某 SM 指令延迟为 10 周期，每周期可调度 4 个 Warp，最少需要多少个活跃 Warp 才能隐藏延迟？
5. 在矩阵乘法中，如何利用 Shared Memory 和 `__syncthreads()` 实现分块（Tiled）优化，减少全局内存访问？
