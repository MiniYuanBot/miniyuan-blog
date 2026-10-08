---
title: 'MPI 集合通信 2'
excerpt: '26 春 并行程序设计 L24'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'May 16 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 引入：蒙特卡罗方法并行计算圆周率 π

### 蒙特卡罗方法（Monte Carlo Method）

**Monte Carlo**：以摩纳哥赌城命名，核心思想是通过**大量随机抽样**来估算概率或统计量的数值方法。

**计算 π 的原理**：

- 在 $[-1,1] \times [-1,1]$ 的正方形内随机撒点
- 统计落入单位圆 $x^2+y^2 \leq 1$ 内的点数比例
- $\pi \approx 4 \times \frac{\text{圆内点数}}{\text{总点数}}$

**要点**：采样点越多，估算精度越高（大数定律）。

### 并行化思路

| 步骤 | 串行程序 | 并行程序（MPI） |
| :--- | :--- | :--- |
| 1. 初始化 | 设置随机种子 | `MPI_Init()` + 按 `rank` 分配不同种子 |
| 2. 任务划分 | 计算全部 $N$ 个点 | 将 $N$ 个点按进程数 `size` **均匀划分** |
| 3. 局部计算 | 统计全部命中数 | 各进程统计各自的 `local_count` |
| 4. 全局汇总 | 直接求和 | `MPI_Allreduce()` 汇总全局命中数 |
| 5. 结果输出 | 单进程打印 | 仅 `rank==0` 打印最终 π |

**负载均衡分配公式**（整除处理）：

```cpp
int tmp = np[i] / size;          // 基础每进程点数
if (rank < np[i] % size) tmp++;  // 前 remainder 个进程多分配 1 个
np[i] = tmp;                     // 本进程实际计算点数
```

### 关键代码：使用 `MPI_Allreduce` 汇总结果

```cpp
double local_pi = compute_pi(np[i]);  // 各进程计算局部 π 估算值
double tmp_pi = local_pi;

#ifdef __MPI
    tmp_pi /= (double)size;  // 先除，准备求平均
    // MPI_Allreduce（ALL REDUCE - 全局归约并将结果分发到所有进程）
    MPI_Allreduce(&tmp_pi, &pi, 1, MPI_DOUBLE, MPI_SUM, MPI_COMM_WORLD);
    // 解释：将各进程的 tmp_pi 相加(SUM)，结果存到所有进程的 pi 中
#endif

if (rank == 0) {
    cout << setprecision(6) << pi << endl;  // 仅 0 号进程打印
}
```

**注意**：课件中先除后加，等价于先加后除。`MPI_Allreduce` 比 `MPI_Reduce` 更适合此处，因为所有进程都需要知晓结果以继续后续数据集处理。

---

## 并行性能度量：加速比与可扩展性

### 加速比（Speedup）

**Speedup**：$S(P) = \frac{T_s}{T_p}$，其中 $T_s$ 为串行墙钟时间（Wall Time），$T_p$ 为 $P$ 个处理器上的并行墙钟时间。

- **理想线性加速比**：$S(P) = P$（处理器翻倍，性能翻倍）
- **实际限制**：通信开销、串行部分、负载不均衡导致 $S(P) < P$

**π 计算实例加速比数据**：

| 进程数 $P$ | 运行时间 $T_p$ | 加速比 $S(P)$ |
| :---: | :--- | :---: |
| 1 | 3.4395 s | 1.000 |
| 2 | 1.7298 s | 1.988 |
| 4 | 0.8867 s | 3.879 |
| 8 | 0.4595 s | 7.485 |
| 16 | 0.2356 s | 14.598 |
| 32 | 0.1835 s | 18.744 |

> [!note] 观察
> 16->32 进程时加速比显著偏离线性，说明**大规模并行存在瓶颈**。

### 强可扩展性（Strong Scaling）

**Strong Scaling**：**问题规模固定**，增加处理器数量，观察运行时间的下降程度。用**加速比**衡量。

- 理想：处理器 $\times 2$，时间 $\div 2$
- 实际：受限于 **Amdahl 定律**

### 阿姆达尔定律（Amdahl's Law）

**Amdahl's Law**：程序中**不可并行化的串行部分**决定了加速比的理论上限。
$$
S(P) = \frac{W_s + W_p}{W_s + \frac{W_p}{P}}
$$

其中：

- $W_s$：**串行工作量**（Serial Work）
- $W_p$：**可并行工作量**（Parallel Work）
- $P$：处理器数量

**极限情况**：当 $P \to \infty$ 时，$S_{\max} = \frac{W_s + W_p}{W_s} = \frac{1}{f}$，其中 $f$ 为串行比例。

**例**：若串行代码占 25%，则无论用多少核，加速比上限为 $1/0.25 = 4$。

**思考题**：超大规模并行（Massive Parallelism）与并行的本质区别？如何突破 Amdahl 限制？**答**：增大问题规模（弱扩展），使 $W_s$ 占比相对减小。

### 弱可扩展性（Weak Scaling）

**Weak Scaling**：增加处理器数量的同时，**保持每个处理器的任务量不变**（即问题规模与处理器数成正比）。衡量处理器增加时，每个处理器效率是否保持稳定。

- 理想：效率保持 100%
- 实际：通信开销随进程数增加而增大，效率逐渐下降

---

## MPI 集合通信进阶函数

**Collective Communication**：涉及通信域内**所有进程**的通信操作。所有进程必须调用相同的集合函数，使用相同的通信器（Communicator）。

### `MPI_Reduce_scatter` — 规约分发（Reduce + Scatter）

#### 概念

**Reduce**：归约（将多进程数据按指定操作合并）  
**Scatter**：散发（将数据分散给各进程）  
**Reduce_scatter**：先对所有进程的数组**逐元素归约**，再按指定长度**散发**给各进程。

#### 函数原型

```cpp
int MPI_Reduce_scatter(
    const void *sendbuf,       // 发送缓冲区起始地址
    void *recvbuf,             // 接收缓冲区起始地址
    const int recvcounts[],    // 各进程接收元素个数数组
    MPI_Datatype datatype,     // 数据类型
    MPI_Op op,                 // 归约操作
    MPI_Comm comm              // 通信子
);
```

#### 参数详解

| 参数 | 英文全称/含义 | 说明 |
| :--- | :--- | :--- |
| `sendbuf` | Send Buffer | 每个进程待归约的输入数组 |
| `recvbuf` | Receive Buffer | 接收归约后属于自己部分的结果 |
| `recvcounts[]` | Receive Counts | **关键参数**：`recvcounts[i]` 表示第 `i` 个进程最终接收的元素个数。所有进程的此数组必须**完全相同** |
| `datatype` | Data Type | 如 `MPI_INT`, `MPI_DOUBLE` |
| `op` | Operation | 如 `MPI_SUM`, `MPI_MAX` |
| `comm` | Communicator | 如 `MPI_COMM_WORLD` |

#### 执行逻辑图解

假设 4 个进程，每个进程有 4 个元素，先 `SUM` 归约，再按 `recvcounts={1,1,1,1}` 散发：

| 进程 | 原始 `a[]` | 归约后（逐列求和） | 接收结果 `b` |
| :---: | :--- | :--- | :---: |
| 0 | 1, 2, 3, 4 | **10**, 14, 18, 22 | 10 |
| 1 | 5, 6, 7, 8 | 10, **14**, 18, 22 | 14 |
| 2 | 9, 10, 11, 12 | 10, 14, **18**, 22 | 18 |
| 3 | 13, 14, 15, 16 | 10, 14, 18, **22** | 22 |

> 若 `recvcounts={1,2,3,4}`，则进程 0 收 1 个，进程 1 收 2 个，以此类推。此时各进程 `recvbuf` 大小需分别分配。

#### 代码示例

```cpp
#include <mpi.h>
#include <iostream>
#include <cassert>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    // 课件示例：强制要求 4 个进程
    if (size != 4) {
        MPI_Abort(MPI_COMM_WORLD, 1);  // ABORT - 异常终止
    }
    
    int ndata = 10;
    int *value = new int[ndata];
    for (int i = 0; i < ndata; i++) {
        value[i] = i + 1;  // 所有进程 value 均为 {1,2,...,10}
    }
    
    // 散发方案：各进程接收不同长度
    int *count = new int[size];
    count[0] = 1; count[1] = 2; count[2] = 3; count[3] = 4;
    
    // 按本进程 rank 分配接收缓冲区
    int *b = new int[count[rank]];
    
    // 先对 4 个进程的 value 逐元素求和，再按 count 散发
    // 归约结果应为 {4,8,12,16,20,24,28,32,36,40}
    MPI_Reduce_scatter(value, b, count, MPI_INT, MPI_SUM, MPI_COMM_WORLD);
    
    // 打印本进程收到的数据
    printf("Process %d received %d elements: ", rank, count[rank]);
    for (int i = 0; i < count[rank]; i++) {
        printf("%d ", b[i]);
    }
    printf("\n");
    
    delete[] b; delete[] value; delete[] count;
    MPI_Finalize();
    return 0;
}
```

**预期输出（4 进程）**：

```text
Process 0 received 1 elements: 4 
Process 1 received 2 elements: 8 12 
Process 2 received 3 elements: 16 20 24 
Process 3 received 4 elements: 28 32 36 40 
```

> [!warning] 注意
> `recvcounts` 数组在所有进程上必须**完全一致**，但各进程实际接收到的数据量可以不同（由 `recvcounts[rank]` 决定）。

---

### `MPI_Allgather` — 全集中（All + Gather）

#### 概念对比

| 操作 | 含义 | 结果分布 |
| :--- | :--- | :--- |
| `MPI_Gather` | **Gather** - 收集 | 仅根进程（root）收到全部数据 |
| `MPI_Allgather` | **All Gather** - 全集中 | **所有进程**都收到全部数据 |

#### 函数原型

```cpp
int MPI_Allgather(
    const void *sendbuf,   // 发送缓冲区
    int sendcount,         // 发送元素个数
    MPI_Datatype sendtype, // 发送数据类型
    void *recvbuf,         // 接收缓冲区
    int recvcount,         // 从每个进程接收的元素个数
    MPI_Datatype recvtype, // 接收数据类型
    MPI_Comm comm          // 通信子
);
```

#### 执行逻辑

- 每个进程贡献 `sendcount` 个数据
- 所有进程最终拥有按 `rank` 顺序排列的完整数据
- `recvbuf` 大小应 $\geq$ `recvcount * size`

#### 代码示例

```cpp
#include <mpi.h>
#include <stdio.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    int send_data = rank + 1;        // 进程 0 发 1，进程 1 发 2...
    int *recv_data = new int[size];  // 接收所有进程的数据
    
    // MPI_Allgather：所有进程收集所有进程的数据
    MPI_Allgather(&send_data, 1, MPI_INT, 
                  recv_data, 1, MPI_INT, 
                  MPI_COMM_WORLD);
    
    printf("Process %d received: ", rank);
    for (int i = 0; i < size; i++) {
        printf("%d ", recv_data[i]);
    }
    printf("\n");
    
    delete[] recv_data;
    MPI_Finalize();
    return 0;
}
```

**预期输出（2 进程）**：

```text
Process 0 received: 1 2 
Process 1 received: 1 2 
```

---

### `MPI_Alltoall` — 全交换（All to All）

#### 概念

**All to All**：每个进程向**所有其他进程**发送数据，同时从**所有其他进程**接收数据。可视为 MPI 的**全局转置**操作。

- 每个进程的 `sendbuf` 被逻辑划分为 `size` 块，第 `i` 块发送给进程 `i`
- 每个进程的 `recvbuf` 按 `rank` 顺序接收来自各进程的数据块

#### 函数原型

```cpp
int MPI_Alltoall(
    const void *sendbuf,   // 发送缓冲区
    int sendcount,         // 向每个进程发送的元素个数
    MPI_Datatype sendtype, // 发送数据类型
    void *recvbuf,         // 接收缓冲区
    int recvcount,         // 从每个进程接收的元素个数
    MPI_Datatype recvtype, // 接收数据类型
    MPI_Comm comm          // 通信子
);
```

#### 执行逻辑图解（3 进程，每进程 3 个元素）

| | 进程 0 | 进程 1 | 进程 2 |
| :--- | :--- | :--- | :--- |
| **发送** | [0, 100, 200] | [300, 400, 500] | [600, 700, 800] |
| **接收** | [0, 300, 600] | [100, 400, 700] | [200, 500, 800] |

规律：`recvbuf[i]` 收到的是进程 `i` 发送的第 `rank` 个元素。

#### 代码示例

```cpp
#include <mpi.h>
#include <stdio.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    
    int my_rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &my_rank);
    
    // 每进程 3 个整数，按规则初始化
    int my_values[3];
    for (int i = 0; i < 3; i++) {
        my_values[i] = my_rank * 300 + i * 100;
    }
    printf("Process %d, my values = %d, %d, %d.\n", 
           my_rank, my_values[0], my_values[1], my_values[2]);
    
    int buffer_recv[3];
    
    // MPI_Alltoall：每个进程向每个进程发送 1 个 int
    MPI_Alltoall(my_values, 1, MPI_INT, 
                 buffer_recv, 1, MPI_INT, 
                 MPI_COMM_WORLD);
    
    printf("Values collected on process %d: %d, %d, %d.\n", 
           my_rank, buffer_recv[0], buffer_recv[1], buffer_recv[2]);
    
    MPI_Finalize();
    return 0;
}
```

**预期输出（3 进程）**：

```text
Process 0, my values = 0, 100, 200.
Process 1, my values = 300, 400, 500.
Process 2, my values = 600, 700, 800.
Values collected on process 0: 0, 300, 600.
Values collected on process 1: 100, 400, 700.
Values collected on process 2: 200, 500, 800.
```

### `MPI_Scan` — 前缀和/扫描（Scan / Prefix Sum）

#### 概念

**Scan**：对数据进行**前缀累积**（Prefix Sum）。进程 `i` 的结果包含进程 `0` 到进程 `i` 的数据累积结果。

- 区别于 `MPI_Reduce`（仅根进程得最终结果），`MPI_Scan` 让每个进程得到**截至本进程**的累积值

#### 函数原型

```cpp
int MPI_Scan(
    const void *sendbuf,   // 发送缓冲区
    void *recvbuf,         // 接收缓冲区
    int count,             // 元素个数
    MPI_Datatype datatype, // 数据类型
    MPI_Op op,             // 操作
    MPI_Comm comm          // 通信子
);
```

#### 执行逻辑（`MPI_SUM`，4 进程，每进程数组 `{1,2,3,4}`）

| 进程 | `sendbuf` | `recvbuf`（前缀和结果） |
| :---: | :--- | :--- |
| 0 | 1, 2, 3, 4 | 1, 2, 3, 4 |
| 1 | 1, 2, 3, 4 | 1+1, 2+2, 3+3, 4+4 = **2, 4, 6, 8** |
| 2 | 1, 2, 3, 4 | 1+1+1, 2+2+2, ... = **3, 6, 9, 12** |
| 3 | 1, 2, 3, 4 | 1+1+1+1, ... = **4, 8, 12, 16** |

> 注意：是**逐元素**的前缀和，不是数组总和的前缀。

#### 代码示例

```cpp
#include <mpi.h>
#include <stdio.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    int sendbuf[4] = {1, 2, 3, 4};
    int recvbuf[4];
    
    // MPI_Scan：前缀和扫描
    MPI_Scan(sendbuf, recvbuf, 4, MPI_INT, MPI_SUM, MPI_COMM_WORLD);
    
    printf("Process %d has: %d %d %d %d\n", 
           rank, recvbuf[0], recvbuf[1], recvbuf[2], recvbuf[3]);
    
    MPI_Finalize();
    return 0;
}
```

**预期输出（4 进程）**：

```text
Process 0 has: 1 2 3 4
Process 1 has: 2 4 6 8
Process 2 has: 3 6 9 12
Process 3 has: 4 8 12 16
```

---

## 集合通信函数对比总结

| 函数 | 英文全称 | 核心操作 | 结果分布 | 典型应用场景 |
| :--- | :--- | :--- | :--- | :--- |
| `MPI_Reduce` | **Reduce** - 归约 | 合并数据（SUM/MAX等） | 仅根进程 | 求全局和、最大值 |
| `MPI_Allreduce` | **All Reduce** - 全局归约 | 归约 + 广播 | **所有进程** | 各进程都需要全局结果（如 π 计算） |
| `MPI_Reduce_scatter` | **Reduce Scatter** - 规约分发 | 归约后按长度散发 | 各进程得不同长度片段 | 矩阵向量乘的负载均衡 |
| `MPI_Gather` | **Gather** - 收集 | 收集各进程数据 | 仅根进程 | 汇总分布式结果 |
| `MPI_Allgather` | **All Gather** - 全集中 | 收集 + 广播 | **所有进程** | 各进程需要完整全局数据 |
| `MPI_Scatter` | **Scatter** - 散发 | 将数据分块散发 | 各进程得一块 | 初始数据分发 |
| `MPI_Alltoall` | **All to All** - 全交换 | 每对进程互发数据 | **所有进程** | 矩阵转置、数据重排 |
| `MPI_Scan` | **Scan** - 扫描/前缀和 | 前缀累积 | 各进程得前缀结果 | 负载均衡、积分计算 |
| `MPI_Bcast` | **Broadcast** - 广播 | 一对多发送 | **所有进程** | 分发配置参数 |
