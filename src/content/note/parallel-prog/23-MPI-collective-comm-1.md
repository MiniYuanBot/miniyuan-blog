---
title: 'MPI 集合通信 1'
excerpt: '26 春 并行程序设计 L23'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'May 15 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 集合通信概述

### 简介

**集合通信（Collective Communication）** 是 MPI 中用于**一组进程**同时进行数据移动、规约计算或同步操作的通信模式。

与点对点通信不同，集合通信必须涉及通信域内的**所有进程**，且不接受消息标签（`tag`）参数。

**注**：

- 通信域中所有进程必须都参与，否则会导致程序死锁或失败；
- 集合通信本质上都包含同步语义。

### 集合通信的三大类型

| 类型 | 操作 | 典型函数 | 说明 |
| :---: | :--- | :--- | :--- |
| **数据移动** | 一对多 / 多对一 / 全交换 | `MPI_Bcast`, `MPI_Scatter`, `MPI_Gather`, `MPI_Alltoall` | 将数据从一个进程分发到多个，或反向收集 |
| **规约计算** | 归约 / 全规约 | `MPI_Reduce`, `MPI_Allreduce`, `MPI_Reduce_scatter` | 对多个进程的数据执行数学运算（求和、求最大等） |
| **同步** | 屏障 | `MPI_Barrier` | 进程等待直到组内所有成员到达同步点 |

### 集合通信 vs 点对点通信

| 特性 | 集合通信（Collective） | 点对点通信（P2P） |
| :--- | :--- | :--- |
| **参与进程** | **必须**涉及通信域内**所有进程** | 仅涉及**发送方**和**接收方** |
| **消息标签** | **无** `tag` 参数 | **有** `tag` 参数 |
| **同步语义** | 隐含同步（阻塞版本） | 取决于具体函数（`MPI_Send` 等） |
| **数据类型** | 仅支持 MPI 预定义数据类型 | 支持自定义数据类型（`MPI_Datatype`） |
| **阻塞性** | MPI-3 支持阻塞/非阻塞；本课仅讨论阻塞 | 有阻塞和非阻塞版本 |

---

## 广播操作 MPI_Bcast()

`MPI_Bcast()`（**B**road**cast**，广播）将根进程（`root`）的数据**复制到通信域内的所有进程**（包括根进程自身）。

### 函数原型

```cpp
int MPI_Bcast(
    void *buffer,           // 发送/接收缓冲区的起始地址
    int count,              // 发送的数据元素个数
    MPI_Datatype datatype,  // 数据类型（如 MPI_INT）
    int root,               // 广播源进程的 rank
    MPI_Comm comm           // 通信域（如 MPI_COMM_WORLD）
);
```

### 执行逻辑

- **根进程**（`root`）：将自身 `buffer` 中的数据广播出去。
- **所有其他进程**：接收来自根进程的数据，存入自身的 `buffer`。
- **结果**：广播结束后，每个进程都拥有完全相同的数据。

### 代码示例

```cpp
#include <mpi.h>
#include <iostream>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    
    int rank, value = 0;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    
    // 仅 rank 1 初始化数据
    if (rank == 1) {
        value = 999;
    }
    
    // 从 rank 1 广播到所有进程
    MPI_Bcast(&value, 1, MPI_INT, 1, MPI_COMM_WORLD);
    
    std::cout << "Process " << rank << " received value = " << value << std::endl;
    
    MPI_Finalize();
    return 0;
}
```

**预期输出**（4 进程）：

```bash
Process 0 received value = 999
Process 1 received value = 999
Process 2 received value = 999
Process 3 received value = 999
```

---

## 规约操作 MPI_Reduce()

`MPI_Reduce()`（**Reduce**，归约）将通信域内所有进程的数据按照指定操作进行**归约计算**，结果仅存放在**根进程**的目标缓冲区中。

### 函数原型

```cpp
int MPI_Reduce(
    const void *sendbuf,    // 发送缓冲区的起始地址（每个进程的本地数据）
    void *recvbuf,          // 接收缓冲区的起始地址（仅 root 进程需要）
    int count,              // 每个进程发送的元素个数
    MPI_Datatype datatype,  // 数据类型
    MPI_Op op,              // 规约操作（如 MPI_SUM, MPI_MAX）
    int root,               // 接收结果的进程 rank
    MPI_Comm comm           // 通信域
);
```

### 预定义规约操作

| 操作常量 | 英文全称 | 功能 |
| :--- | :--- | :--- |
| `MPI_SUM` | **Sum**，求和 | 将所有进程的对应元素相加 |
| `MPI_MAX` | **Max**imum，最大值 | 取所有进程对应元素的最大值 |
| `MPI_MIN` | **Min**imum，最小值 | 取所有进程对应元素的最小值 |
| `MPI_PROD` | **Prod**uct，乘积 | 将所有进程的对应元素相乘 |
| `MPI_LAND` | **L**ogical **AND**，逻辑与 | 对布尔值进行逻辑与 |
| `MPI_BAND` | **B**itwise **AND**，按位与 | 对整型进行按位与 |

### 代码示例：求和

```cpp
#include <mpi.h>
#include <iostream>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    int local_value = rank + 1;  // 进程 0:1, 进程 1:2, 进程 2:3...
    int global_sum = 0;
    
    // 将所有进程的 local_value 求和，结果存到进程 0
    MPI_Reduce(&local_value, &global_sum, 1, MPI_INT, MPI_SUM, 0, MPI_COMM_WORLD);
    
    if (rank == 0) {
        std::cout << "Global sum = " << global_sum << std::endl;  // 输出: 1+2+3+4=10
    }
    
    MPI_Finalize();
    return 0;
}
```

### 代码示例：求最大值

```cpp
#include <mpi.h>
#include <iostream>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    
    int local_value = (rank + 1) * 10;  // 进程 0:10, 进程 1:20...
    int global_max = 0;
    
    MPI_Reduce(&local_value, &global_max, 1, MPI_INT, MPI_MAX, 0, MPI_COMM_WORLD);
    
    if (rank == 0) {
        std::cout << "Global max = " << global_max << std::endl;
    }
    
    MPI_Finalize();
    return 0;
}
```

---

## 规约操作 MPI_Allreduce()

`MPI_Allreduce()`（**All**-**Reduce**，全规约）与 `MPI_Reduce` 的区别在于，**所有进程**都会收到规约后的结果，而非仅根进程。

### 函数原型

```cpp
int MPI_Allreduce(
    const void *sendbuf,    // 发送缓冲区
    void *recvbuf,          // 接收缓冲区（每个进程都会填充结果）
    int count,              // 元素个数
    MPI_Datatype datatype,  // 数据类型
    MPI_Op op,              // 规约操作
    MPI_Comm comm           // 通信域
);
```

**对比**：`MPI_Allreduce` 比 `MPI_Reduce` 少了 `root` 参数，因为结果需要发给所有进程，无需指定根进程。

### 执行逻辑

`MPI_Allreduce` 等价于 `MPI_Reduce()` + `MPI_Bcast()` 的组合，先归约计算，再将结果广播给所有进程。但实现上通常比分别调用两个函数**更高效**。

### 代码示例

```cpp
#include <mpi.h>
#include <iostream>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    int local_arr[3] = {rank, rank+1, rank+2};
    int global_sum[3] = {0, 0, 0};
    
    // 所有进程都获得全局求和结果
    MPI_Allreduce(local_arr, global_sum, 3, MPI_INT, MPI_SUM, MPI_COMM_WORLD);
    
    std::cout << "Process " << rank << " global sum = [" 
              << global_sum[0] << ", " << global_sum[1] << ", " << global_sum[2] 
              << "]" << std::endl;
    
    MPI_Finalize();
    return 0;
}
```

---

## 分发操作 MPI_Scatter()

`MPI_Scatter()`（**Scatter**，散发）将根进程中的一个**大数据集**按块**分散**给通信域中的各个进程，每个进程获得**不同的一部分数据**。

### 函数原型

```cpp
int MPI_Scatter(
    const void *sendbuf,    // 发送缓冲区的起始地址（仅 root 进程有效）
    int sendcount,          // 向每个进程发送的元素个数
    MPI_Datatype sendtype,  // 发送数据类型
    void *recvbuf,          // 接收缓冲区的起始地址（每个进程）
    int recvcount,          // 每个进程接收的元素个数
    MPI_Datatype recvtype,  // 接收数据类型
    int root,               // 根进程 rank
    MPI_Comm comm           // 通信域
);
```

**注**：

看似 `sendcount == recvcount`，没必要重复，其实不然。因为 Scatter 可以看作一种类型发送，再用另一种类型接收，此时 count 数就不等了。

### 执行逻辑

- **根进程**：`sendbuf` 包含完整数据集（大小至少为 `sendcount * size`）。
- **每个进程**（包括根进程）：接收 `sendcount` 个元素到 `recvbuf`。
- **结果**：每个进程拥有不同的数据片段（区别于 `MPI_Bcast` 的相同数据）。

### 代码示例

```cpp
#include <mpi.h>
#include <iostream>
#include <vector>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    const int N = 10;
    std::vector<int> global_data;
    
    // 仅根进程初始化完整数据
    if (rank == 0) {
        global_data.resize(N);
        for (int i = 0; i < N; ++i) global_data[i] = i;
    }
    
    // 每个进程接收 1 个元素（注意：N 必须能被 size 整除！）
    int local_data = 0;
    MPI_Scatter(global_data.data(), 1, MPI_INT, 
                &local_data, 1, MPI_INT, 0, MPI_COMM_WORLD);
    
    std::cout << "Process " << rank << " received: " << local_data << std::endl;
    
    MPI_Finalize();
    return 0;
}
```

**常见错误**：

`sendcount` 是**每个进程**接收的数量，不是总数量。

- 若 `N % size != 0`，会导致数据丢失或错误。
- 若 `size > N`，`sendcount` 可能为 0，空指针传入 `MPI_Scatter` 会引发**段错误**（Segmentation Fault）。

---

## 集中操作 MPI_Gather()

`MPI_Gather()`（**Gather**，收集）将各个进程的数据**收集到根进程**，是 `MPI_Scatter` 的逆操作。

### 函数原型

```cpp
int MPI_Gather(
    const void *sendbuf,    // 发送缓冲区的起始地址（每个进程）
    int sendcount,          // 每个进程发送的元素个数
    MPI_Datatype sendtype,  // 发送数据类型
    void *recvbuf,          // 接收缓冲区的起始地址（仅 root 进程需要）
    int recvcount,          // 从每个进程接收的元素个数
    MPI_Datatype recvtype,  // 接收数据类型
    int root,               // 根进程 rank
    MPI_Comm comm           // 通信域
);
```

### 执行逻辑

- **每个进程**：发送 `sendcount` 个元素给根进程。
- **根进程**：按**进程 rank 顺序**将数据依次存入 `recvbuf`，`recvbuf` 大小至少为 `recvcount * size`。
- **结果**：根进程拥有按 rank 排序的完整数据集。

### 代码示例

```cpp
#include <mpi.h>
#include <iostream>
#include <vector>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    // 每个进程初始化 2 个整数
    int local_data[2] = {(rank + 1) * 1, (rank + 1) * 2};
    
    // 根进程准备接收缓冲区：2 个元素 × size 个进程
    std::vector<int> global_data;
    if (rank == 0) {
        global_data.resize(2 * size);
    }
    
    // 收集所有进程的数据到根进程
    MPI_Gather(local_data, 2, MPI_INT, 
               global_data.data(), 2, MPI_INT, 0, MPI_COMM_WORLD);
    
    if (rank == 0) {
        std::cout << "Root gathered data: ";
        for (int val : global_data) std::cout << val << " ";
        std::cout << std::endl;  // 输出: 1 2 2 4 3 6 4 8 (size=4时)
    }
    
    MPI_Finalize();
    return 0;
}
```

---

## 集合通信总结对比

### 集合通信函数对比表

| 函数 | 英文释义 | 数据流向 | 每个进程获得的数据 | 典型应用场景 |
| :--- | :--- | :--- | :--- | :--- |
| `MPI_Bcast()` | **B**road**cast**，广播 | 一对多 | 完全相同 | 广播配置参数、常量 |
| `MPI_Scatter()` | **Scatter**，分散 | 一对多 | 各不相同的片段 | 分发大数据集进行并行处理 |
| `MPI_Gather()` | **Gather**，收集 | 多对一 | **根进程**获得完整汇总 | 收集各进程的计算结果 |
| `MPI_Reduce()` | **Reduce**，归约 | 多对一 | **根进程**获得运算结果 | 求全局和、最大值 |
| `MPI_Allreduce()` | **All**-**Reduce**，全规约 | 多对多 | **所有进程**获得运算结果 | 全局归约后各进程继续计算 |
| `MPI_Barrier()` | **Barrier**，屏障 | 同步 | 无数据，仅同步 | 确保阶段性任务全部完成 |

### 集合通信常见错误

1. **进程数与数据量不匹配**：

    `MPI_Scatter` 中要求发送端总数据量 `N` 精确等于接收端总需求量 `sendcount * size`。
   - 若 `sendcount * size > N`，越界读取导致段错误；
   - 若 `sendcount * size < N`，尾部数据静默丢失，结果错误。

    务必确保数据可被均匀分割，或处理边界情况。

2. **空指针传入**：

    当接收数据量为 0 时（例如进程数大于数据量）时，`local_vector.data()` 可能返回空指针，传入 `MPI_Scatter` 引发崩溃。应确保 `recvbuf` 有效或分配至少 1 个元素的缓冲区。

3. **遗漏进程参与**：

    集合通信要求通信域内**所有进程**参与。若某进程因条件分支跳过 `MPI_Bcast` 等调用，会导致**死锁**。

4. **混淆 `sendcount` 的含义**：

    `MPI_Scatter` 和 `MPI_Gather` 中的 `sendcount` 是**每个进程**发送/接收的数量，不是总数量。

### 调试建议

1. **使用 `MPI_Barrier` 定位错误**：在关键代码段前后插入 `MPI_Barrier`，观察输出是否按预期顺序出现，判断哪个进程卡死。
2. **检查进程数与数据量**：动态获取 `MPI_Comm_size`，确保数据分配逻辑适应不同进程数。
3. **日志标记**：在每个进程的输出前打印 `rank`，便于追踪特定进程的行为。
