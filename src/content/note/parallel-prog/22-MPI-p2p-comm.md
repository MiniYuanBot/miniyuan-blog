---
title: 'MPI 点对点通信'
excerpt: '26 春 并行程序设计 L22'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'May 14 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## C++ 预处理与 MPI 程序框架

在编写兼顾**串行版本**和**并行版本**的程序时，可利用 C++ **条件编译**机制：

| 指令 | 英文全称 / 含义 | 作用 |
| :---: | :--- | :--- |
| `#ifdef __MPI` | **IF** **DEF**ined，如果已定义 | 判断宏 `__MPI` 是否存在 |
| `#ifndef __MPI` | **IF** **N**ot **DEF**ined，如果未定义 | 判断宏 `__MPI` 是否不存在 |
| `#else` | **ELSE**，否则 | 条件不成立时的分支 |
| `#endif` | **END** **IF**，条件结束 | 结束条件编译块 |

- 使用 `mpicxx` 编译时，编译器通常会自动定义 `__MPI` 宏；使用 `g++` 编译时则不会定义。
- 典型写法：将 `MPI_Init`、`MPI_Comm_rank`、`MPI_Comm_size`、`MPI_Finalize` 等调用包裹在 `#ifdef __MPI` 中。

```cpp
#ifdef __MPI
#include "mpi.h"
#endif

int main(int argc, char **argv) {
#ifdef __MPI
    MPI_Init(&argc, &argv);
    int rank = 0, size = 0;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);  // 获取当前进程标识
    MPI_Comm_size(MPI_COMM_WORLD, &size);  // 获取总进程数
#endif
    // ... 计算逻辑 ...
#ifdef __MPI
    MPI_Finalize();
#endif
    return 0;
}
```

---

## MPI 点对点通讯基础

### 概念解释

**点对点通讯**（**P**oint-**to**-**P**oint, **P2P**）是 MPI 中两个进程之间直接进行数据传输的通信方式。

每个进程拥有独立的内存空间，数据通过显式的 `Send` / `Recv` 操作完成跨进程搬运。

- **Node 内**：通常通过**共享内存**（Shared Memory）实现。
- **Node 间**：通常通过 **RDMA**（**R**emote **D**irect **M**emory **A**ccess，远程直接内存访问）或网络协议实现。

### 标准阻塞发送 MPI_Send()

```c
int MPI_Send(const void* buf, int count, MPI_Datatype datatype,
             int dest, int tag, MPI_Comm comm);
```

| 参数 | 英文全称 / 含义 | 说明 |
| :--- | :--- | :--- |
| `buf` | **BUF**fer，缓冲区 | 发送缓冲区的起始地址 |
| `count` | **COUNT**，数量 | 发送数据的**个数**（非字节数） |
| `datatype` | **DATATYPE**，数据类型 | MPI 数据类型，如 `MPI_INT` |
| `dest` | **DEST**ination，目标 | 目标进程的 `rank` 标识号 |
| `tag` | **TAG**，标签 | 消息的唯一标识（类似密钥），用于匹配收发 |
| `comm` | **COMM**unicator，通信域 | 通信域，如 `MPI_COMM_WORLD` |

- 返回值为 `MPI_SUCCESS`（值为 0）表示成功。
- 采用**标准阻塞**发送模式，由 MPI 系统内部决定是否使用缓冲。
  - 若有缓冲且充足，则数据拷入缓冲，**立即返回**。
  - 若无缓冲或不足，则**阻塞等待**，直到接收方开始接收。

### 标准阻塞接收 MPI_Recv()

```c
int MPI_Recv(void* buf, int count, MPI_Datatype datatype,
             int source, int tag, MPI_Comm comm, MPI_Status* status);
```

| 参数 | 英文全称 / 含义 | 说明 |
| :--- | :--- | :--- |
| `buf` | **BUF**fer，缓冲区 | 接收缓冲区的起始地址 |
| `count` | **COUNT**，数量 | 接收缓冲区可容纳的**最大**数据个数 |
| `datatype` | **DATATYPE**，数据类型 | 期望接收的数据类型 |
| `source` | **SOURCE**，源 | 发送进程的 `rank`；可用 `MPI_ANY_SOURCE` 接收任意源 |
| `tag` | **TAG**，标签 | 期望的消息标签；可用 `MPI_ANY_TAG` 接收任意标签 |
| `comm` | **COMM**unicator，通信域 | 通信域 |
| `status` | **STATUS**，状态 | 输出参数，存储本次接收的详细信息 |

**注**：`MPI_Recv` 是**阻塞**调用，直到匹配的消息到达并写入缓冲区后才会返回。

### 状态对象 MPI_Status

`MPI_Status` 是一个结构体，用于保存接收操作的元数据：

| 成员 | 含义 |
| :--- | :--- |
| `MPI_SOURCE` | 实际消息来源进程的 `rank` |
| `MPI_TAG` | 实际消息的标签 |
| `MPI_ERROR` | 错误码（成功时为 0） |
| `count` / `size` | 实际接收到的数据量（需通过 `MPI_Get_count` 获取） |

```cpp
MPI_Status status;
MPI_Recv(&msg, 1, MPI_INT, 0, 99, MPI_COMM_WORLD, &status);
cout << "Received with tag " << status.MPI_TAG << endl;
```

### 发送与接收示例

```cpp
#include <iostream>
#include "mpi.h"
using namespace std;

int main(int argc, char **argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    MPI_Status status;

    int msg = 0;
    if (rank == 0) {
        msg = 123;
        // 向 rank 1 发送 1 个整数，标签为 99
        MPI_Send(&msg, 1, MPI_INT, 1, 99, MPI_COMM_WORLD);
        cout << "Processor " << rank << " send " << msg << endl;
    } else if (rank == 1) {
        // 从 rank 0 接收 1 个整数，期望标签 99
        MPI_Recv(&msg, 1, MPI_INT, 0, 99, MPI_COMM_WORLD, &status);
        cout << "Processor " << rank << " receive " << msg
             << " with tag " << status.MPI_TAG << endl;
    }

    MPI_Finalize();
    return 0;
}
```

**预期输出**（2 进程）：

```bash
Processor 0 send 123
Processor 1 receive 123 with tag 99
```

**常见错误**：

- **标签不匹配**：`MPI_Send` 使用 `tag=99`，而 `MPI_Recv` 使用 `tag=98`，导致接收方**死锁**。
- **无对应接收**：若代码中只有 `rank=0` 调用 `MPI_Send` 发给 `rank=1`，但 `rank=1` 没有对应的 `MPI_Recv`，则 `rank=0` 会**永久阻塞**等待接收方，程序无法正常结束。

---

## 四种点对点通信模式

MPI 定义了四种发送模式，核心差异在于**是否使用缓存**以及**何时完成**。每种模式都有阻塞和非阻塞（前缀 `I`，表示 Immediate）两个版本。

| 模式 | 阻塞版 | 非阻塞版 | 英文与含义 | 是否用缓存 | 函数何时返回(阻塞版) | 函数何时返回(非阻塞版) | 关键点 |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **标准** | `MPI_Send` | `MPI_Isend` | **S**tandard | 可能用系统缓存 | 看情况：能用缓存就立刻返，否则等 | 立即返回 | 最通用，但也最容易因缓存不够而死锁 |
| **缓冲** | `MPI_Bsend` | `MPI_Ibsend` | **B**uffered | 必须用用户缓存 | 立即返回 | 立即返回 | 绝不阻塞，但需自行保证缓存够大 |
| **同步** | `MPI_Ssend` | `MPI_Issend` | **S**ynchronous | 不用缓存 | 必须等对方开始收 | 立即返回 | 确认收发握手，保证同步完成 |
| **就绪** | `MPI_Rsend` | `MPI_Irsend` | **R**eady | 不用缓存 | 立即返回 | 立即返回 | 性能最高，但要求对方早已准备收 |

**用户缓存 vs 系统缓存**：

| 维度 | 用户缓存 | 系统缓存 |
| ---- | ------- | ------- |
| **分配者** | 程序员显式声明（`int buf[100]` / `new` / `malloc`） | MPI 库内部自动管理 |
| **位置** | 用户栈或用户堆 | MPI 库预分配的内部内存池 |
| **对程序员可见性** | 完全可见，可随意读写 | 完全不可见，黑盒 |
| **重用时机** | 必须等 MPI 确认发送完成（`MPI_Wait` 或同步返回后） | 无需关心，MPI 自动处理 |
| **性能开销** | 无额外拷贝 | 多一次到系统缓存的 `memcpy` |
| **容量限制** | 只受进程地址空间限制 | 严格受限（通常几十 KB 到几 MB） |
| **满时的行为** | — | 标准发送退化为同步发送，阻塞等待 |

### 缓存发送 MPI_Bsend()

`MPI_Bsend` 需要用户手动分配并附加（attach）一块缓冲区给 MPI 系统：

```cpp
// Step 1: 计算打包后数据所需的字节数
int packed_size;
MPI_Pack_size(1, MPI_INT, MPI_COMM_WORLD, &packed_size);

// Step 2: 加上 MPI 内部消息头开销（overhead）
int total_size = packed_size + MPI_BSEND_OVERHEAD;

// Step 3: 分配缓冲区并附加
char* buffer = new char[total_size];
MPI_Buffer_attach(buffer, total_size);

// Step 4: 使用 MPI_Bsend（立即返回）
MPI_Bsend(&data, 1, MPI_INT, dest, tag, MPI_COMM_WORLD);

// Step 5: 清理时解除附加并释放内存
void* detached_buf;
int detached_size;
MPI_Buffer_detach(&detached_buf, &detached_size);
delete[] static_cast<char*>(detached_buf);
```

- `MPI_BSEND_OVERHEAD`：MPI 为每条 `Bsend` 消息附加的内部开销（含发送/目标 rank、tag、数据类型、长度、校验等）。
- **优点**：调用后立即返回，发送方不会被阻塞。
- **缺点**：需要手动管理内存，存在额外的数据拷贝开销，一般不常用。

---

## 死锁与避免策略

### 什么是死锁

**死锁**（Deadlock）指两个或多个进程彼此等待对方释放资源或完成操作，导致所有进程都无法继续推进。

**典型死锁场景**：双向交换

```cpp
// 错误示例：rank 0 先 Send 再 Recv；rank 1 先 Send 再 Recv
if (rank == 0) {
    MPI_Send(&a, 1, MPI_INT, 1, tag, MPI_COMM_WORLD);  // 阻塞等待 rank 1 接收
    MPI_Recv(&b, 1, MPI_INT, 1, tag, MPI_COMM_WORLD, &status);
} else if (rank == 1) {
    MPI_Send(&a, 1, MPI_INT, 0, tag, MPI_COMM_WORLD);  // 阻塞等待 rank 0 接收
    MPI_Recv(&b, 1, MPI_INT, 0, tag, MPI_COMM_WORLD, &status);
}
```

两个进程都卡在 `MPI_Send`（标准阻塞模式）下，若系统未分配足够缓冲，需等待对方 `MPI_Recv`，形成**循环等待**。

### 避免死锁的方法

| 方法 | 说明 |
| :--- | :--- |
| **调整顺序** | 让 `rank=0` 先 `Send` 后 `Recv`，`rank=1` 先 `Recv` 后 `Send`，打破循环等待 |
| **`MPI_Sendrecv`** | 将发送和接收合并为**原子操作**，由 MPI 内部调度避免死锁 |
| **非阻塞通信** | 使用 `MPI_Isend` / `MPI_Irecv`，启动通信后立即返回，再通过 `MPI_Wait` 同步 |

### 组合发送接收 MPI_Sendrecv()

```c
int MPI_Sendrecv(const void *sendbuf, int sendcount, MPI_Datatype sendtype,
                 int dest, int sendtag,
                 void *recvbuf, int recvcount, MPI_Datatype recvtype,
                 int source, int recvtag,
                 MPI_Comm comm, MPI_Status *status);
```

| 参数前缀 | 含义 |
| :--- | :--- |
| `sendbuf` / `sendcount` / `sendtype` / `sendtag` | 发送侧参数 |
| `recvbuf` / `recvcount` / `recvtype` / `recvtag` | 接收侧参数 |
| `dest` / `source` | 目标 / 源进程 rank |

**示例**：两个进程安全交换数据

```cpp
int send = 0, recv = 0;
if (rank == 0) {
    send = 123;
    MPI_Sendrecv(&send, 1, MPI_INT, 1, 0,
                 &recv, 1, MPI_INT, 1, 0,
                 MPI_COMM_WORLD, MPI_STATUS_IGNORE);
    cout << "Process " << rank << " sent " << send << " and received " << recv << endl;
} else {
    send = 456;
    MPI_Sendrecv(&send, 1, MPI_INT, 0, 0,
                 &recv, 1, MPI_INT, 0, 0,
                 MPI_COMM_WORLD, MPI_STATUS_IGNORE);
    cout << "Process " << rank << " sent " << send << " and received " << recv << endl;
}
```

**预期输出**：

```bash
Process 0 sent 123 and received 456
Process 1 sent 456 and received 123
```

---

## 阻塞通信 vs 非阻塞通信

### 阻塞通信

**阻塞**（Blocking）指函数在通信**完全完成**之前不会返回：

- **阻塞发送**（`MPI_Send`）：返回时意味着消息已安全保存（系统缓冲或对方已接收），发送缓冲区可修改/释放。
- **阻塞接收**（`MPI_Recv`）：返回时意味着消息已完整到达，接收缓冲区数据可用。

MPI 的实现要求遵守**先发先收原则**：同一通信域内，同一进程向同一目标连续发送多个消息时，消息到达顺序与发送顺序一致（FIFO）。

### 非阻塞通信

**非阻塞**（Non-blocking）指通信函数启动后**立即**返回，允许进程在通信进行期间**重叠执行计算**（计算与通信重叠）。

| 特性 | 阻塞 | 非阻塞 |
| :--- | :--- | :--- |
| 函数调用次数 | 1 次完成 | 至少 2 次（Isend/Irecv + Wait） |
| 缓冲区安全 | 返回后即可使用 | 必须等 `MPI_Wait` / `MPI_Test` 完成后才能使用 |
| 死锁风险 | 较高 | 极低 |
| 性能 | 低，简单 | 高，可隐藏通信延迟 |

### 立即/非阻塞发送 MPI_Isend()

```c
int MPI_Isend(const void* buf, int count, MPI_Datatype datatype,
              int dest, int tag, MPI_Comm comm, MPI_Request* request);
```

- **新增参数** `request`（请求对象）：非阻塞通信的**句柄**，后续 `MPI_Wait` / `MPI_Test` 依赖它来判断通信是否完成。

### 立即/非阻塞接收 MPI_Irecv()

```c
int MPI_Irecv(void* buf, int count, MPI_Datatype datatype,
              int source, int tag, MPI_Comm comm, MPI_Request* request);
```

- 调用后立即返回，但此时 `buf` 中的数据**尚未就绪**，不可直接使用。

### 等待非阻塞通信完成 MPI_Wait()

```c
int MPI_Wait(MPI_Request* request, MPI_Status* status);
```

- **阻塞等待**，直到 `request` 对应的非阻塞操作完成。
- 完成前**禁止**修改或释放 `request` 对象。

### 非阻塞通信示例

1. 启动通信：`MPI_Isend` / `MPI_Irecv`
2. 立即返回
3. 执行计算（同时通信在后台进行）
4. 完成通信：`MPI_Wait` / `MPI_Test`
5. 缓冲区安全可用

```cpp
MPI_Request req_send, req_recv;
int msg_send = rank;
int msg_recv = -999;

// 每个进程同时启动发送和接收（无顺序依赖）
MPI_Isend(&msg_send, 1, MPI_INT, to,   0, MPI_COMM_WORLD, &req_send);
MPI_Irecv(&msg_recv, 1, MPI_INT, from, 0, MPI_COMM_WORLD, &req_recv);

// 在通信进行期间可做其他计算 ...

// 确保通信完成后再使用数据
MPI_Wait(&req_send, MPI_STATUS_IGNORE);
MPI_Wait(&req_recv, MPI_STATUS_IGNORE);

cout << "processor " << rank << " recv info " << msg_recv << endl;
```

### MPI_Isend vs. MPI_Send 对比

实际上 `MPI_Isend` 也是通过系统缓存实现的，不过与 `MPI_Send` 有一些差别。

| 对比维度 | `MPI_Send`（系统缓存够用时） | `MPI_Isend` |
| :--- | :--- | :--- |
| **函数返回条件** | 数据已安全（已拷入系统缓存或发送完成） | 通信操作已启动（立即返回） |
| **缓冲区安全性** | 返回后发送缓冲区可立即重用 | **不可重用**，必须等到 `MPI_Wait`/`MPI_Test` 确认完成 |
| **内部缓冲行为** | 若消息小，拷贝到系统缓存；若消息大，阻塞等待 | 可能拷贝到系统缓存，也可能直接使用发送缓冲区（DMA 传输） |
| **后续同步要求** | 无 | 必须调用 `MPI_Wait` 或 `MPI_Test` 来保证通信完成 |
| **计算‑通信重叠** | 不能重叠，阻塞调用期间无法执行其他计算 | **可以重叠**，在等待完成期间可执行其他计算 |
| **函数调用次数** | 1 次完成 | 至少 2 次（启动 + 完成） |

---

## MPI 数据类型

### 基础数据类型

MPI 提供与 C/Fortran 基本类型对应的内置数据类型，仅用于 MPI 通信：

| MPI 类型 | C 类型 | 英文全称记忆 |
| :--- | :--- | :--- |
| `MPI_CHAR` | `char` | **CHAR**acter |
| `MPI_SHORT` | `short` | **SHORT** |
| `MPI_INT` | `int` | **INT**eger |
| `MPI_LONG` | `long` | **LONG** |
| `MPI_FLOAT` | `float` | **FLOAT** |
| `MPI_DOUBLE` | `double` | **DOUBLE** |
| `MPI_UNSIGNED` | `unsigned int` | **UNSIGNED** |
| `MPI_BYTE` | 字节 | **BYTE** |
| `MPI_PACKED` | 打包数据 | **PACKED** |

### 派生数据类型

用于描述**复合数据结构**（如结构体、分散数组），通过 `MPI_Type_create_struct` 等函数构造：

```cpp
struct data_struct {
    int id;
    float value;
};

// 定义各成员的块长度、类型、偏移量
int block_lengths[2] = {1, 1};
MPI_Datatype types[2] = {MPI_INT, MPI_FLOAT};
MPI_Aint offsets[2];

offsets[0] = offsetof(struct data_struct, id);
offsets[1] = offsetof(struct data_struct, value);

MPI_Datatype struct_type;
MPI_Type_create_struct(2, block_lengths, offsets, types, &struct_type);
MPI_Type_commit(&struct_type);  // 提交类型，使其可用

// 使用 struct_type 进行 Send / Recv ...

MPI_Type_free(&struct_type);    // 释放派生类型
```

**注**：派生类型创建后必须调用 `MPI_Type_commit()` 提交；不再使用时调用 `MPI_Type_free()` 释放。

---

## 综合示例：循环传递 Ring Pass

**问题**：每个进程向下一个进程传递一个整数，最后一个进程传递给第 0 个进程，形成闭环。

```cpp
#include <iostream>
#include "mpi.h"
using namespace std;

int main(int argc, char **argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    // 确定发送目标 (to) 和接收来源 (from)
    int to   = (rank + 1) % size;       // 下一个进程，最后一个回到 0
    int from = (rank - 1 + size) % size; // 上一个进程，第 0 个来自最后

    int info_send = rank;
    int info_recv = -999;

    MPI_Request req1, req2;
    // 同时启动非阻塞发送和接收，避免死锁
    MPI_Isend(&info_send, 1, MPI_INT, to,   0, MPI_COMM_WORLD, &req1);
    MPI_Irecv(&info_recv, 1, MPI_INT, from, 0, MPI_COMM_WORLD, &req2);

    // 等待通信完成
    MPI_Wait(&req1, MPI_STATUS_IGNORE);
    MPI_Wait(&req2, MPI_STATUS_IGNORE);

    cout << "processor " << rank << " recv info " << info_recv << endl;

    MPI_Finalize();
    return 0;
}
```

**4 进程预期输出**：

```bash
processor 1 recv info 0
processor 2 recv info 1
processor 0 recv info 3
processor 3 recv info 2
```
