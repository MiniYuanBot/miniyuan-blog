---
title: 'MPI 进程组划分和通信'
excerpt: '26 春 并行程序设计 L25'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'June 01 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 通信器概述

### 什么是通信器？

**通信器**（`MPI_Comm`，**Comm**unicator）是 MPI 中用于描述**进程间通信关系**的核心抽象。每个通信器包含：

- 一个**进程组**（Group）：即参与通信的进程集合
- 通信上下文环境：确保不同通信器中的消息不会互相干扰

**默认通信器：** `MPI_COMM_WORLD`（**COMM**unicator **WORLD** - 包含所有进程的默认全局通信器）

### 通信器拆分：`MPI_Comm_split()`

`MPI_Comm_split()`（**Comm**unicator **Split** - 通信器拆分）是 MPI 提供的核心函数，用于将一个通信器划分为多个**相互独立、无重叠**的子通信器。

```cpp
int MPI_Comm_split(MPI_Comm comm, int color, int key, MPI_Comm *newcomm)
```

| 参数 | 英文全称 / 含义 | 说明 |
| :--- | :--- | :--- |
| `comm` | **Comm**unicator | 待拆分的原始通信器（如 `MPI_COMM_WORLD`） |
| `color` | **Color** - 颜色/分组标识 | 决定进程归属哪个子通信器。**相同 `color` 的进程进入同一组**，不同 `color` 则分属不同通信域。`color` 必须是非负整数。 |
| `key` | **Key** - 排序键 | 控制**同组内进程的 rank 顺序**。MPI 按 `key` 升序自动分配新 rank。若 `key` 相等，以原通信器中 rank 较小的进程优先。 |
| `newcomm` | **New Comm**unicator | 输出参数：新创建的子通信器句柄 |

**执行逻辑：**

- 所有进程调用 `MPI_Comm_split`，传入各自的 `color` 和 `key`
- MPI 根据 `color` 将进程分组，每组形成一个新的通信器
- 每组内部按 `key` 排序重新分配 `0 ~ (size-1)` 的 rank

### 通信器释放：`MPI_Comm_free()`

```cpp
int MPI_Comm_free(MPI_Comm *comm)
```

**注**：
若不调用 `MPI_Comm_free` 释放不再使用的通信器，会造成**句柄泄漏**（Handle Leak）。长期运行、频繁拆分时，会导致程序变慢、内存上涨，最终崩溃或无法创建新通信器。

---

## 通信器划分实例：偶数/奇数进程分组

### 代码示例

**目标：** 将 `MPI_COMM_WORLD` 拆分为两个子通信器：

- **偶数进程**（`rank % 2 == 0`）组成一个通信器
- **奇数进程**（`rank % 2 == 1`）组成另一个通信器

```cpp
#include <iostream>
#include <mpi.h>

int main(int argc, char** argv)
{
    using namespace std;

    // 初始化 MPI 环境
    MPI_Init(&argc, &argv);

    int rank = -1;   // 初始化为 -1，便于判断是否被修改
    int size = -1;
    
    // 获取在 MPI_COMM_WORLD 中的 rank 和总进程数
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    // 基于 rank 决定 color 和 key
    // color = 0 表示偶数组，color = 1 表示奇数组
    int color = rank % 2;
    // key = rank / 2，表示在各自 color 组内的排序
    // 例如：rank 0 -> key 0; rank 2 -> key 1; rank 1 -> key 0; rank 3 -> key 1
    int key = rank / 2;

    MPI_Comm COLOR_WORLD;
    // 拆分通信器：相同 color 的进程进入同一子通信器
    MPI_Comm_split(MPI_COMM_WORLD, color, key, &COLOR_WORLD);

    int rank_color = -1;
    int size_color = -1;
    // 获取在新通信器中的 rank 和 size
    MPI_Comm_rank(COLOR_WORLD, &rank_color);
    MPI_Comm_size(COLOR_WORLD, &size_color);

    cout << "rank=" << rank 
         << " color=" << color 
         << " key=" << key 
         << " rank_color=" << rank_color 
         << " size_color=" << size_color << endl;

    // 释放子通信器
    MPI_Comm_free(&COLOR_WORLD);
    MPI_Finalize();
    return 0;
}
```

### 运行结果分析

**运行命令：** `mpirun -np 4 ./a.out`

| 原 rank | color | key | 新 rank (`rank_color`) | 新 size (`size_color`) | 说明 |
| :---: | :---: | :---: | :---: | :---: | :--- |
| 0 | 0（偶数） | 0 | 0 | 2 | 偶数组共 2 人，rank 0 排第 1 |
| 1 | 1（奇数） | 0 | 0 | 2 | 奇数组共 2 人，rank 1 排第 1 |
| 2 | 0（偶数） | 1 | 1 | 2 | 偶数组共 2 人，rank 2 排第 2 |
| 3 | 1（奇数） | 1 | 1 | 2 | 奇数组共 2 人，rank 3 排第 2 |

**运行命令：** `mpirun -np 5 ./a.out`

| 原 rank | color | key | 新 rank | 新 size | 说明 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 0 | 0 | 0 | 0 | 3 | 偶数组：0, 2, 4 |
| 1 | 1 | 0 | 0 | 2 | 奇数组：1, 3 |
| 2 | 0 | 1 | 1 | 3 | 偶数组 |
| 3 | 1 | 1 | 1 | 2 | 奇数组 |
| 4 | 0 | 2 | 2 | 3 | 偶数组 |

### 在子通信器上进行集合通信

**修改目标：** 使用 `COLOR_WORLD` 通信器执行 `MPI_Reduce`（**Reduce** - 归约）操作。

```cpp
// 接上文代码，在 MPI_Comm_split 之后 ...

int local = rank;      // 每个进程的本地数据 = 原 rank
int sum = 0;

// 在 COLOR_WORLD 通信器上做归约求和
// 注意：reduce 的 root 参数是 0，表示结果归约到 COLOR_WORLD 的 0 号进程
MPI_Reduce(&local, &sum, 1, MPI_INT, MPI_SUM, 0, COLOR_WORLD);

cout << "rank=" << rank 
     << " rank_color=" << rank_color 
     << " sum=" << sum << endl;

MPI_Comm_free(&COLOR_WORLD);
MPI_Finalize();
```

**运行结果**（`mpirun -np 4`）：

| 原 rank | `rank_color` | `sum` | 解释 |
| :---: | :---: | :---: | :--- |
| 0 | 0 | 2 | 偶数组 0+2=2，归约到偶数组的 0 号进程（原 rank 0） |
| 1 | 0 | 4 | 奇数组 1+3=4，归约到奇数组的 0 号进程（原 rank 1） |
| 2 | 1 | 0 | 偶数组的非 root 进程，sum 未被写入 |
| 3 | 1 | 0 | 奇数组的非 root 进程，sum 未被写入 |

**注**：
`MPI_Reduce` 的 `root` 参数 `0` 指的是**新通信器 `COLOR_WORLD` 中的 0 号进程**，而非 `MPI_COMM_WORLD` 中的 0 号进程。

### 死锁警告：集体通信必须全员参与

```cpp
int world_rank;
MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);
MPI_Comm sub_comm;

// ❌ 错误示范：只让 rank == 0 的进程执行 MPI_Comm_split
if (world_rank == 0) {
    MPI_Comm_split(MPI_COMM_WORLD, 0, 0, &sub_comm);
}
// 其他进程跳过调用 ...

// 全体进程会卡在这里永久等待，死锁！
```

**死锁条件：** `MPI_Comm_split` 是**集体操作**（Collective Operation），必须由 `comm` 中的**所有进程**调用。若部分进程跳过，其余进程将永远等待，导致死锁。

### 小结：`color` 与 `key`

| 参数 | 作用 | 取值规则 | 备注 |
| :--- | :--- | :--- | :--- |
| `color` | **分组标识** | 非负整数，相同值进同一组 | 决定"去哪个组" |
| `key` | **组内排序** | 任意整数（可正可负，可不连续） | 决定"在组内排第几" |

---

## 进程组

### 进程组 vs 通信器

| 概念 | 英文 | 功能 | 能否通信 |
| :--- | :--- | :--- | :---: |
| **进程组** | `MPI_Group`（**Group**） | 仅记录**有哪些进程、原 rank 是多少** | ❌ 不能 |
| **通信器** | `MPI_Comm`（**Comm**unicator） | 在进程组基础上，附加通信环境 | ✅ 可以 |

**关系：** 每个通信器包含一个进程组。可以**基于进程组创建新的通信器**。

### 获取进程组：`MPI_Comm_group()`

```cpp
int MPI_Comm_group(MPI_Comm comm, MPI_Group *group)
```

- 从通信器 `comm` 中提取其关联的进程组
- 获取后可用 `MPI_Group_rank()` 和 `MPI_Group_size()` 查询信息

```cpp
MPI_Group group;
MPI_Comm_group(MPI_COMM_WORLD, &group);  // 获取 MPI_COMM_WORLD 的进程组

int rank_group = -1;
int size_group = -1;
MPI_Group_rank(group, &rank_group);      // 查询在 group 中的 rank
MPI_Group_size(group, &size_group);      // 查询 group 的大小
```

### 进程组操作函数

#### (1) `MPI_Group_incl()` - 包含（Include）

```cpp
int MPI_Group_incl(MPI_Group group, int n, const int ranks[], MPI_Group *newgroup)
```

- 从旧组中**挑选指定编号的进程**，构造新组
- `ranks[]` 数组存储要挑选的进程在原组中的 rank

#### (2) `MPI_Group_union()` - 并集（Union）

```cpp
int MPI_Group_union(MPI_Group group1, MPI_Group group2, MPI_Group *newgroup)
```

- 将两个进程组取**并集**，构造新组

#### (3) `MPI_Group_intersection()` - 交集（Intersection）

```cpp
int MPI_Group_intersection(MPI_Group group1, MPI_Group group2, MPI_Group *newgroup)
```

- 将两个进程组取**交集**，构造新组

### 进程组操作实例

**场景：** 假设有 6 个进程（`size >= 5`），定义：

- `group_a`：包含原 rank `{0, 1, 2}`
- `group_b`：包含原 rank `{2, 3, 4}`

```cpp
#include <iostream>
#include <sstream>
#include <fstream>
#include <mpi.h>
#include <cassert>

int main(int argc, char** argv)
{
    using namespace std;
    MPI_Init(&argc, &argv);

    int rank = -1, size = -1;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    // 获取 MPI_COMM_WORLD 的进程组
    MPI_Group group;
    MPI_Comm_group(MPI_COMM_WORLD, &group);

    assert(size > 4);  // 确保进程数足够

    // 定义要挑选的进程编号
    int ranks_a[3] = {0, 1, 2};
    int ranks_b[3] = {2, 3, 4};

    MPI_Group group_a, group_b, group_ab_union, group_ab_inter;

    // 创建子进程组
    MPI_Group_incl(group, 3, ranks_a, &group_a);           // group_a = {0,1,2}
    MPI_Group_incl(group, 3, ranks_b, &group_b);           // group_b = {2,3,4}
    MPI_Group_union(group_a, group_b, &group_ab_union);      // 并集 = {0,1,2,3,4}
    MPI_Group_intersection(group_a, group_b, &group_ab_inter); // 交集 = {2}

    // 查询本进程在各组中的 rank（若不在组中则返回 MPI_UNDEFINED）
    int in_group_a, in_group_b, in_group_ab_union, in_group_ab_inter;
    MPI_Group_rank(group_a, &in_group_a);
    MPI_Group_rank(group_b, &in_group_b);
    MPI_Group_rank(group_ab_union, &in_group_ab_union);
    MPI_Group_rank(group_ab_inter, &in_group_ab_inter);

    // 每个进程写入自己的日志文件
    stringstream ss;
    ss << "Log_" << rank << ".dat";
    ofstream ofs(ss.str().c_str());
    
    ofs << "Processor " << rank << " belongs to" << endl;
    if (in_group_a != MPI_UNDEFINED)       ofs << " Group A" << endl;
    if (in_group_b != MPI_UNDEFINED)       ofs << " Group B" << endl;
    if (in_group_ab_union != MPI_UNDEFINED) ofs << " Group A union B" << endl;
    if (in_group_ab_inter != MPI_UNDEFINED) ofs << " Group A inter B" << endl;
    
    ofs.close();

    // 释放进程组
    MPI_Group_free(&group);
    MPI_Group_free(&group_a);
    MPI_Group_free(&group_b);
    MPI_Group_free(&group_ab_union);
    MPI_Group_free(&group_ab_inter);

    MPI_Finalize();
    return 0;
}
```

**运行结果**（`mpirun -np 6`）：

| 进程 | Group A | Group B | A ∪ B | A ∩ B |
| :---: | :---: | :---: | :---: | :---: |
| 0 | ✓ | | ✓ | |
| 1 | ✓ | | ✓ | |
| 2 | ✓ | ✓ | ✓ | ✓ |
| 3 | | ✓ | ✓ | |
| 4 | | ✓ | ✓ | |
| 5 | | | | |

### 基于进程组创建通信器：`MPI_Comm_create()`

```cpp
int MPI_Comm_create(MPI_Comm comm, MPI_Group group, MPI_Comm *newcomm)
```

- **必须由 `comm` 中的所有进程调用**
- 若进程不在 `group` 中，则返回 `MPI_COMM_NULL`
- 基于 `group` 创建新的通信器，可在其上执行 `MPI_Reduce` 等操作

```cpp
MPI_Comm NEW_WORLD;
MPI_Comm_create(MPI_COMM_WORLD, group_a, &NEW_WORLD);

int local = rank;
int sum = 0;

if (NEW_WORLD != MPI_COMM_NULL) {
    // 只有属于 group_a 的进程参与归约
    MPI_Reduce(&local, &sum, 1, MPI_INT, MPI_SUM, 0, NEW_WORLD);
}

cout << "rank=" << rank << " sum=" << sum << endl;
// 结果：rank=0 sum=3 (0+1+2)，其余不属于 group_a 的进程 sum=0
```

### 进程组释放：`MPI_Group_free()`

```cpp
int MPI_Group_free(MPI_Group *group)
```

- 释放进程组，句柄被设置为 `MPI_GROUP_NULL`
- 与 `MPI_Comm_free` 类似，防止资源泄漏

---

## MPI 并行输入输出

### 三种文件读写模式对比

| 模式 | 特点 | 优点 | 缺点 |
| :--- | :--- | :--- | :--- |
| **单进程读写** | 仅一个进程操作文件，其他进程通过 MPI 消息传递数据 | 简单、稳定、不易出错 | **性能瓶颈**：受限于单进程网络带宽和存储性能 |
| **多进程各自读写** | 每个进程操作独立文件 | 无竞争冲突 | 文件数量过多，后续处理困难；源数据文件可能不足 |
| **MPI 并行 I/O** | 多进程协同读写**同一个文件**，通过偏移量避免冲突 | **性能最优**，适合大数据 | 实现复杂，需仔细划分数据块 |

### MPI 并行 I/O 核心函数

MPI 提供了一系列文件操作 API，底层通过 MPI 库协调，最终调用文件系统（如 Lustre）的 `fopen()` 等接口。

```cpp
// 打开文件
MPI_File_open(MPI_Comm comm, const char *filename, int amode, 
              MPI_Info info, MPI_File *fh);

// 在指定偏移位置读取（集体操作）
MPI_File_read_at_all(MPI_File fh, MPI_Offset offset, void *buf, 
                     int count, MPI_Datatype datatype, MPI_Status *status);

// 关闭文件
MPI_File_close(MPI_File *fh);
```

| 参数/常量 | 英文全称 / 含义 |
| :--- | :--- |
| `MPI_File` | **File** - 文件句柄 |
| `MPI_MODE_RDONLY` | **Mode Read Only** - 只读模式 |
| `MPI_INFO_NULL` | **Info Null** - 空信息提示 |
| `MPI_STATUS_IGNORE` | **Status Ignore** - 忽略状态（不关心接收细节时使用） |

### 并行读取实例：按偏移量读取

**核心思想：** 所有进程打开**同一个文件**，但每个进程根据自身的 `rank` 计算不同的**偏移量**（`offset`），从而读取文件的不同部分，**互不冲突**。

```cpp
#include <iostream>
#include <mpi.h>

int main(int argc, char** argv)
{
    MPI_Init(&argc, &argv);
    int rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    MPI_File fh;
    // 所有进程同时打开同一个文件
    MPI_File_open(MPI_COMM_WORLD, "data.bin",
                  MPI_MODE_RDONLY,           // 只读模式
                  MPI_INFO_NULL, &fh);

    int read_data = -1;
    // 假设每个 int 占 4 字节，每个进程读取不同位置
    MPI_Offset offset = rank * sizeof(int);
    
    // 在指定偏移位置读取一个整数（集体操作，所有进程同时调用）
    MPI_File_read_at_all(fh, offset, &read_data, 1, MPI_INT, MPI_STATUS_IGNORE);
    
    MPI_File_close(&fh);

    std::cout << "Process " << rank 
              << " read_data=" << read_data << std::endl;

    MPI_Finalize();
    return 0;
}
```

**关键点：** `MPI_File_read_at_all()` 中的 `offset` 对每个进程不同，因此不会互相覆盖。`MPI_File_open()` 和 `MPI_File_read_at_all()` 都是**集体操作**（Collective），必须由通信器中所有进程调用。

### MPI 并行 I/O 注意事项

1. **数据块划分：** 将文件逻辑划分为多个小块，每个进程负责读写自己的块
2. **数据通信：** 若进程间需要交换边界数据，需通过 `MPI_Send`/`MPI_Recv` 等点对点通信同步
3. **性能优势：** 对于大型文件和大量进程，MPI 并行 I/O 可显著提高效率，但实现复杂度较高
