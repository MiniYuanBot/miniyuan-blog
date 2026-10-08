---
title: 'OpenMP 同步'
excerpt: '26 春 并行程序设计 L32'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'June 04 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 核心概念

OpenMP 线程是**并发执行**的，不同线程的指令不会按照固定的顺序执行。在并行执行过程中，出现错误结果的主要原因是**数据竞争**（Data Race）：存在两个以上的线程同时访问同一个内存区域，并且至少有一个线程的操作是写操作。

**同步**（Synchronization）是并行算法的重要特征，指在时间上各自执行计算的子线程之间必须互相等待，从而保证各个线程的执行实现在时间上的一致性。同步的目的是保证各个线程不会在访问共享资源时出现问题。

> [!warning] 注意
> 不合适的同步机制和算法会导致运行效率急剧下降。多线程编程需考虑同步的必要性，消除不必要同步（参考 MPI 的无阻塞通讯），或者调整同步顺序，有可能大幅度提升程序性能。

---

## 数据竞争示例

以下代码展示了未加同步保护时的数据竞争现象。多个线程共享变量 `sum`，并发执行 `sum += i` 时，由于读取-修改-写入操作非原子化，每次运行结果可能不同。

```cpp
#include <iostream>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    int sum = 0;
    #pragma omp parallel for
    for (int i = 0; i < 10000; ++i) {
        sum += i;  // 数据竞争！多个线程同时读写 sum
    }
    cout << "sum=" << sum << endl;
    return 0;
}
```

**预期正确结果**：`sum = 49995000`（即 0+1+...+9999）  
**实际运行结果**：`sum=8675856`、`sum=808356`、`sum=3955708`……每次运行结果随机错误。

---

## 同步机制分类

OpenMP 支持两种线程同步机制：

| 同步类型 | 英文名称 | 核心作用 | 对应指令/子句 |
| :--- | :--- | :--- | :--- |
| 互斥同步 | Mutual Exclusion Synchronization | 保护共享存储空间，使操作串行化，每次最多一个线程访问 | `critical`、`atomic`、库函数 |
| 事件同步 | Event Synchronization | 协调线程执行顺序，确保所有线程到达某点后再继续 | `barrier`、`nowait`、`master`、`single`、`ordered` |

---

## 互斥同步

互斥同步（互斥锁）用来保护一块共享的存储空间，使得所有在此共享空间上执行的操作串行化。每次访问该内存的线程数最多为一个，从而保证数据完整性。互斥操作会增加管理开销、降低运行效率，因此仅在必要区域使用。

### `critical` 指令

`#pragma omp critical`（**critical** - 临界区，同一时刻仅允许一个线程执行）

`critical` 指令创建一个临界区，保证在任一时刻，最多只有一个线程在执行临界区内的代码。`critical` 最终被编译器翻译为**加锁**和**解锁**两个操作，开销相对较大。

```cpp
#include <iostream>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    int sum = 0;
    #pragma omp parallel for
    for (int i = 0; i < 10000; ++i) {
        #pragma omp critical
        {
            sum += i;  // 临界区：每次只有一个线程执行
        }
    }
    cout << "sum=" << sum << endl;  // 稳定输出 49995000
    return 0;
}
```

**执行流程**：8 个线程并行迭代 0~9999，但执行 `sum += i` 时，必须竞争进入临界区。获得锁的线程执行加法后释放锁，其他线程排队等待。结果正确，但性能较差。

> [!failure] 常见错误
> `critical` 保护范围过大（如将整个循环体放入 `critical`）会导致严重串行化，失去并行意义。应最小化临界区范围。

---

### `atomic` 子句

`#pragma omp atomic`（**atomic** - 原子操作，不可再分的最小执行单元）

`atomic` 是一个微型的 `critical` 指令。`critical` 对一个**代码块**起作用，而 `atomic` 只对一个**表达式/语句**起作用。`atomic` 主要用于防止多线程对内存同一地址的并发写操作。

**关键区别**：`atomic` 对应的语句可以被编译器转化为**一条机器指令**，使得处理器能够一次执行完而不被打断，因此系统开销更小、执行速度更快。能用 `atomic` 的场合尽量用 `atomic`。

```cpp
#include <iostream>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    int sum = 0;
    int value = 0;
    #pragma omp parallel for
    for (int i = 0; i < 10000; ++i) {
        #pragma omp atomic
        sum += i;       // 原子操作：单条指令完成读写

        #pragma omp atomic
        value = i;      // 原子赋值
    }
    cout << "sum=" << sum << endl;
    cout << "value=" << value << endl;  // value 值不确定，取决于最后执行赋值的线程
    return 0;
}
```

> [!warning] 注意
> 当对一个数据进行 `atomic` 保护时，不能同时对同一数据使用 `critical` 保护，这两种是完全不同的保护机制，OpenMP 运行时不能同时用到两种保护机制。

---

### `critical` 与 `atomic` 对比

| 特性 | `critical` | `atomic` |
| :--- | :--- | :--- |
| 作用范围 | 代码块（`{}` 包裹的多条语句） | 单条表达式/语句 |
| 实现机制 | 加锁/解锁（软件锁） | 单条机器指令（硬件支持） |
| 系统开销 | 较大 | 较小 |
| 编译优化 | 受限 | 可被编译器更好优化 |
| 适用场景 | 复杂临界区、多语句保护 | 简单读写、自增/赋值等单操作 |
| 灵活性 | 高（可保护任意代码） | 低（仅支持特定表达式形式） |

> [!tip] 最佳实践
> 能用 `atomic` 解决的数据竞争，优先使用 `atomic`；仅当需要保护多条语句或复杂逻辑时，才使用 `critical`。

---

## 事件同步

事件同步机制与并行区域的**隐式 Barrier**（隐式屏障）密切相关。每个并行区域（如 `parallel`、`for`、`single`、`sections`）末尾都包含一个隐含的 Barrier，要求所有线程到达该点后才能继续执行后续代码。

### 显式 Barrier

`#pragma omp barrier`（**barrier** - 屏障，路障，所有线程必须到达此点才能通过）

显式 `barrier` 是一个独立可执行指令（不是一个构造，不与代码块相关联），用于在需要明确同步的地方强制所有线程汇合。

```cpp
#include <iostream>
#include <sstream>
#include <fstream>
#include <omp.h>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    #pragma omp parallel
    {
        int id = omp_get_thread_num();

        #pragma omp critical
        cout << "thread " << id + 1 << " says hello" << endl;

        #pragma omp barrier  // 显式同步：所有线程必须到达此处

        if (id == 0) {
            cout << "in total, " << nthreads << " nthreads say hello" << endl;
        }
    }
    return 0;
}
```

**执行流程**：

1. 8 个线程并行执行，各自打印 "thread X says hello"（顺序随机）
2. 所有线程到达 `#pragma omp barrier` 处等待
3. 当最后一个线程到达后，所有线程同时通过屏障
4. 线程 0（`id==0`）打印总结语句，确保总结在所有问候之后输出

> [!warning] 注意
> `barrier` 指令必须被并行区域内的**所有线程**执行，或**都不执行**。如果存在分支导致某些线程执行 `barrier` 而其他线程不执行，会导致**死锁**。

---

### 隐式 Barrier 与 `nowait` 子句

OpenMP 的许多构造（`parallel`、`for`、`single`、`sections`）在末尾隐式包含一个 `barrier`。如果后续代码不依赖前面构造的结果，可以使用 `nowait` 子句取消隐式屏障，减少线程等待时间。

`nowait`（**no wait** - 不等待，取消隐式屏障，线程执行完无需等待其他线程）

```cpp
#include <iostream>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    int sum = 0;
    #pragma omp parallel
    {
        #pragma omp for nowait  // 取消 for 循环结束后的隐式 barrier
        for (int i = 0; i < 10000; ++i) {
            #pragma omp atomic
            sum += i;
        }

        #pragma omp critical
        cout << "sum=" << sum << endl;  // 先完成的线程先打印，sum 可能未累加完全
    }
    cout << "last sum=" << sum << endl;
    return 0;
}
```

**运行结果分析**：由于取消了 `for` 后的隐式屏障，先完成循环的线程会立即执行后面的 `critical` 打印，此时其他线程可能还在累加 `sum`，因此打印出的 `sum` 值不确定（小于 49995000）。只有最后一个线程打印时，`sum` 才等于正确值。

> [!note] 重要限制
> `nowait` 不能和 `parallel for` 一起使用，否则会导致编译错误。`nowait` 只能用于独立的 `for` 或 `single` 等工作共享构造。

---

### `master` 构造

`#pragma omp master`（**master** - 主线程，仅由主线程执行）

`master` 构造指定由**主线程**（线程编号为 0，即 `id==0`）执行该代码块。其末尾**不包含**隐式的 Barrier，也不能使用 `nowait` 指令。

```cpp
#include <iostream>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    #pragma omp parallel
    {
        #pragma omp master
        {
            #pragma omp critical
            cout << "my id is " << omp_get_thread_num() << endl;
        }

        #pragma omp critical
        cout << "other id is" << omp_get_thread_num() << endl;
    }
    return 0;
}
```

**执行流程**：`master` 块仅由线程 0 执行，其他线程直接跳过并继续执行后面的代码。因此 "other id" 的输出可能穿插在 "my id" 前后，甚至可能在 "my id" 之前输出。

---

### `single` 构造

`#pragma omp single`（**single** - 单个线程，仅由某个线程执行，不指定具体是哪个）

`single` 构造指定由并行区域内的**某一个线程**执行该代码块（具体由哪个线程执行不确定，由运行时决定）。其末尾**包含隐式 Barrier**——执行 `single` 块的线程完成后，会等待其他线程到达该同步点，然后所有线程一起继续。

```cpp
#include <iostream>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    #pragma omp parallel
    {
        #pragma omp single
        {
            #pragma omp critical
            cout << "my id is " << omp_get_thread_num() << endl;
        }
        // 隐式 barrier：所有线程在此处同步

        #pragma omp critical
        cout << "other id is" << omp_get_thread_num() << endl;
    }
    return 0;
}
```

**执行流程**：某个线程（如线程 6）执行 `single` 块打印 "my id"，其他 7 个线程在 `single` 构造末尾等待。当线程 6 完成后，所有线程通过隐式屏障，然后一起执行后面的代码。因此输出总是先出现 "my id"，再出现所有 "other id"。

---

### `master` 与 `single` 对比

| 特性 | `master` | `single` |
| :--- | :--- | :--- |
| 执行线程 | 固定为线程 0（主线程） | 由运行时选择某个线程（不确定） |
| 隐式 Barrier | **无** | **有**（末尾自动同步） |
| `nowait` 支持 | 不支持 | 支持（可取消隐式屏障） |
| 典型用途 | 主线程专属初始化、打印进度 | 只需执行一次的 I/O、初始化 |

---

### `ordered` 子句与构造

`ordered`（**ordered** - 有序的，按顺序执行）

在循环并行化中，某些情况下需要规定执行顺序才能保证结果正确性。`ordered` 子句用于声明 `for` 循环中存在需要顺序执行的部分；`#pragma omp ordered` 构造则标记具体的顺序执行代码区。

**注意**：`ordered` 子句和构造必须**同时存在**才起作用。在同一时间内，只有一个线程执行 `ordered` 构造，其他线程严格按照循环迭代指标的先后次序排队执行。

```cpp
#include <iostream>
#include <omp.h>
using namespace std;

int main() {
    #pragma omp parallel num_threads(3)
    {
        #pragma omp for ordered
        for (int i = 0; i < 8; ++i) {
            #pragma omp ordered
            {
                cout << "Thread " << omp_get_thread_num() 
                     << " prints " << i << endl;
            }
        }
    }
    return 0;
}
```

**输出结果**（严格按 i=0,1,2,...,7 顺序）：

```
Thread 0 prints 0
Thread 0 prints 1
Thread 0 prints 2
Thread 1 prints 3
Thread 1 prints 4
Thread 1 prints 5
Thread 2 prints 6
Thread 2 prints 7
```

> [!note] 性能警告
> `ordered` 严重限制并行度。假设循环 1 万次，使用 `ordered` 可能导致效率下降 5~10 倍。仅在确实需要保序的场合使用。

---

## 循环构造高级子句

### `collapse` 子句

`collapse(n)`（**collapse** - 折叠/合并，将 n 层嵌套循环合并为单循环）

`collapse` 指令将多重嵌套循环展开到第 `n` 重，合并为一个单一的循环。这相当于增加了外层循环的迭代次数，从而方便 `schedule` 等调度策略为线程分配任务，提高负载均衡度。

**使用条件**：

- 待展开的循环之间**必须没有依赖关系**
- 展开后的迭代顺序与**串行迭代顺序一致**

```cpp
#include <iostream>
using namespace std;

int main() {
    const int nthreads = 8;
    omp_set_num_threads(nthreads);

    // 原始：仅最外层 i 循环被并行化，j/k 循环在各自线程内串行
    // #pragma omp parallel for

    // 使用 collapse(2)：将 i 和 j 两层合并，共 2×2=4 个迭代任务分配给 8 个线程
    #pragma omp parallel for collapse(2)
    for (int i = 0; i < 2; ++i) {
        for (int j = 0; j < 2; ++j) {
            for (int k = 0; k < 2; ++k) {
                #pragma omp critical
                cout << "Thread " << omp_get_thread_num() 
                     << " i=" << i << " j=" << j << " k=" << k << endl;
            }
        }
    }
    return 0;
}
```

**效果对比**：

- 无 `collapse`：仅 `i` 层并行（2 个任务），线程 0 和 1 各执行一个 `i` 值，内部 `j×k=4` 次迭代串行
- `collapse(2)`：`i` 和 `j` 合并为 4 个任务，线程 0~3 各执行一个 `(i,j)` 组合
- `collapse(3)`：`i`、`j`、`k` 全部合并为 8 个任务，线程 0~7 各执行一个 `(i,j,k)` 组合，负载最均衡

---

## for 循环构造子句兼容性速查

以下表格展示了各子句在 `parallel`、`for`、`parallel for` 三种指令中的可用性：

| 子句 | `parallel` | `for` | `parallel for` | 说明 |
| :--- | :---: | :---: | :---: | :--- |
| `if` | ● |  | ● | 条件并行 |
| `num_threads` | ● |  | ● | 指定线程数 |
| `default` | ● |  | ● | 默认数据作用域 |
| `copyin` | ● |  | ● | 主线程变量拷贝 |
| `shared` | ● | ● | ● | 共享变量 |
| `private` | ● | ● | ● | 私有变量 |
| `reduction` | ● | ● | ● | 归约操作 |
| `firstprivate` | ● | ● | ● | 初始值私有变量 |
| `lastprivate` |  | ● | ● | 末次迭代值保留 |
| `schedule` |  | ● | ● | 调度策略 |
| `ordered` |  | ● | ● | 有序执行 |
| `collapse` |  | ● | ● | 循环折叠 |
| `nowait` |  | ● |  | 取消隐式屏障（不可用于 `parallel for`） |

> [!note] 颜色标记说明
> 红色点为 `parallel` 构造特有（控制线程组）；蓝色点为通用变量作用域控制；绿色点为 `for` 循环构造特有。

---

## 性能计时工具

`omp_get_wtime()`（**get wall time** - 获取墙上时钟时间，用于性能计时）

返回自某个固定时间点以来的秒数（通常为程序启动或系统启动时刻），适合测量并行代码段的实际耗时（包含等待、阻塞时间）。

```cpp
#include <iostream>
#include <fstream>
#include <omp.h>
using namespace std;

int main() {
    double t0 = omp_get_wtime();  // 记录开始时间

    int sum = 0;
    #pragma omp parallel for reduction(+:sum)
    for (int i = 0; i < 50000; ++i) {
        sum += i;
    }

    double t1 = omp_get_wtime();  // 记录结束时间
    cout << "sum=" << sum << endl;
    cout << "time=" << t1 - t0 << endl;  // 打印耗时
    return 0;
}
```

---

## 常见错误与调试技巧

> [!failure] 错误 1：数据竞争导致随机结果
> 症状：每次运行结果不同。解决：使用 `reduction`、`atomic` 或 `critical` 保护共享变量。

> [!failure] 错误 2：`critical` 范围过大导致性能退化
> 症状：加速比接近 1 甚至小于 1。解决：缩小临界区，或用 `atomic`/`reduction` 替代。

> [!failure] 错误 3：隐式 Barrier 导致不必要的等待
> 症状：线程利用率低。解决：在独立的 `for` 或 `single` 后加 `nowait`。

> [!failure] 错误 4：`barrier` 使用不当导致死锁
> 症状：程序卡死。解决：确保并行区域内所有线程都执行 `barrier`，或都不执行。

> [!failure] 错误 5：`nowait` 与 `parallel for` 混用
> 症状：编译错误。解决：`nowait` 只能用于独立的 `for` 构造，不能用于组合构造 `parallel for`。

> [!failure] 错误 6：`ordered` 滥用导致性能骤降
> 症状：并行效率极低。解决：仅在确实需要保序的场合使用，并考虑算法重构避免保序。

---

## 本节总结

- **核心问题**：多线程并发访问共享内存且存在写操作，引发**数据竞争**，导致结果随机错误。
- **互斥同步**：`critical`（临界区，软件锁，灵活但开销大）和 `atomic`（原子操作，硬件级单指令，开销小）。
- **事件同步**：`barrier`（显式/隐式屏障，线程汇合点）、`nowait`（取消隐式屏障）、`master`（仅主线程执行，无隐式同步）、`single`（单线程执行，有隐式同步）、`ordered`（强制迭代顺序）。
- **循环优化**：`collapse(n)` 将 n 层嵌套循环合并为单循环，提升线程调度效率，但要求循环间无依赖。
- **性能原则**：同步是必要的 evil，尽量缩小同步范围、消除不必要的隐式屏障、优先使用 `atomic` 和 `reduction` 而非 `critical`。

---

## 思考题

1. 为什么 `reduction(+:sum)` 比手动加 `critical` 求和性能更高？从实现机制角度分析。
2. `private` 变量在并行区域结束后为何值会丢失？`firstprivate` 和 `lastprivate` 分别如何解决初始值和最终值的问题？
3. 在 `parallel for` 中，如果循环体内既有需要归约的求和操作，又有需要 `ordered` 的打印操作，如何组织代码才能兼顾正确性和性能？
4. `master` 和 `single` 的隐式屏障差异，在什么场景下选择 `master` 更优？什么场景下必须选择 `single`？
5. 使用 `collapse(3)` 展开三重循环后，如果最内层循环存在依赖关系，会导致什么后果？
