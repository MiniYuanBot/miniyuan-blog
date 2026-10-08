---
title: 'OpenMP 并行调度'
excerpt: '26 春 并行程序设计 L33'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'June 05 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 为什么需要循环调度

在使用 `#pragma omp parallel for`（**parallel for** - 并行循环工作共享）时，编译器默认会自动将循环迭代分割到各线程。`schedule` 子句（**schedule** - 调度策略）允许程序员显式控制这种分割方式，以适配不同的负载特征和性能需求。

`schedule` 子句可应用于 `#pragma omp for`（**for** - 循环工作共享）和 `#pragma omp parallel for`（**parallel for** - 并行区域与循环合并）构造上，是优化负载均衡的关键手段。

---

## Schedule 子句语法与调度模式

### 基本语法

```cpp
#pragma omp parallel for schedule(static[, chunk])
#pragma omp parallel for schedule(dynamic[, chunk])
#pragma omp parallel for schedule(guided[, chunk])
#pragma omp parallel for schedule(auto)
#pragma omp parallel for schedule(runtime)
```

其中 `chunk`（分块大小）为可选参数，规定了调度基本单元的迭代次数。若省略，编译器采用默认值。

### 四种调度模式

| 模式 | 英文释义 | 核心机制 | 默认 chunk | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| `static` | **静态调度** | 编译时预分配，迭代块按轮询方式固定绑定到线程 | `ndata / nthreads` | 各迭代工作量**可预测且均衡** |
| `dynamic` | **动态调度** | 运行时动态分配，线程执行完一块再申请下一块 | `1` | 各迭代工作量**高度可变** |
| `guided` | **引导式/制导调度** | 类似 dynamic，但 chunk 大小随迭代推进逐步递减 | 动态计算 | 迭代执行时间不均匀且前期开销大 |
| `auto` | **自动调度** | 由编译器/运行时系统自动选择最优策略 | 系统决定 | 不确定性较大的场景 |

> [!warning] 注意
> `runtime`（运行时调度）模式表示由环境变量 `OMP_SCHEDULE`（**OpenMP Schedule** - 设置默认调度策略）在运行时决定调度方式，而非编译时固定。

---

## 静态调度详解

### 分配机制

`schedule(static, chunk)` 的工作流程：

1. 将总迭代数按 `chunk` 切分为连续的迭代块（Block）
2. 按**轮询（Round-Robin）**方式将块分配给各线程：第 1 块给线程 0，第 2 块给线程 1，……，第 `nthreads` 块给线程 0，以此类推

若未指定 `chunk`，默认值为 `总迭代数 / 线程数`，即每个线程仅分配**一个大块**。

### 示例一：默认 chunk（可均分）

3 线程处理 6 个数据，默认 chunk = 6 / 3 = 2：

```cpp
#include <iostream>
#include <omp.h>

int main() {
    const int nthreads = 3;
    omp_set_num_threads(nthreads);  // set number of threads - 设置线程数
    int n = 6;

    #pragma omp parallel for schedule(static)  // 静态调度，默认 chunk
    for (int i = 0; i < n; i++) {
        #pragma omp critical  // critical - 临界区，保证串行输出
        {
            std::cout << "Thread " << omp_get_thread_num()  // get thread number - 获取线程编号
                      << " is processing element " << i + 1 << std::endl;
        }
    }
    return 0;
}
```

**分配结果**：

| 线程 | 分配的迭代（元素） |
| :--- | :--- |
| 线程 0 | 1, 2 |
| 线程 1 | 3, 4 |
| 线程 2 | 5, 6 |

### 示例二：默认 chunk（不可均分）

3 线程处理 8 个数据，默认 chunk = 8 / 3 ≈ 2（向下取整后的分配策略）：

| 线程 | 分配的迭代（元素） |
| :--- | :--- |
| 线程 0 | 1, 2, 3 |
| 线程 1 | 4, 5, 6 |
| 线程 2 | 7, 8 |

> [!abstract] 要点
> 当不能整除时，前面的线程会多分得 1 个迭代，以消化余数。

### 示例三：显式 chunk = 2（可均分）

3 线程处理 8 个数据，`schedule(static, 2)`：

迭代被切分为块：`[1,2]`, `[3,4]`, `[5,6]`, `[7,8]`（共 4 块），按轮询分配：

| 线程 | 分配的迭代块 | 元素 |
| :--- | :--- | :--- |
| 线程 0 | 第 1 块、第 4 块 | 1, 2, 7, 8 |
| 线程 1 | 第 2 块 | 3, 4 |
| 线程 2 | 第 3 块 | 5, 6 |

### 示例四：显式 chunk = 2（不可均分）

3 线程处理 7 个数据，`schedule(static, 2)`：

迭代块：`[1,2]`, `[3,4]`, `[5,6]`, `[7]`（最后一块不足 chunk 大小），按轮询分配：

| 线程 | 分配的迭代块 | 元素 |
| :--- | :--- | :--- |
| 线程 0 | 第 1 块、第 4 块 | 1, 2, 7 |
| 线程 1 | 第 2 块 | 3, 4 |
| 线程 2 | 第 3 块 | 5, 6 |

### 静态调度的适用场景

`static` 适用于**每个循环索引的工作量可预期且均衡**的场景。例如：

```cpp
#define ITER 1000000

#pragma omp parallel
{
    int ID = omp_get_thread_num();
    double tdata = omp_get_wtime();  // get wall time - 获取墙上时钟时间

    #pragma omp for schedule(static)
    for (int ii = 1; ii < ITER; ii++) {
        A[ii] = A[ii] * sqrt(ii) / pow(sin(ii), tan(ii));  // 各迭代计算量相同
    }

    tdata = omp_get_wtime() - tdata;
    if (ID == 0) printf("Time spent is %f sec\n", tdata);
}
```

> [!note] 优势
> 调度开销极小，几乎所有分配逻辑在编译时完成，运行时无同步开销。  
> **劣势**：若各迭代工作量差异大，会导致严重的**负载不均衡**（Load Imbalance）。

---

## 动态调度详解

### 为什么需要动态调度

当遇到以下两种情况时，静态调度会面临瓶颈：

1. **迭代工作量高度可变**：如自适应网格细分、粒子模拟，每次迭代耗时随数据状态变化很大
2. **处理器性能异构**：系统中处理器以不同速度运行，静态分配无法感知这种差异

`schedule(dynamic[, chunk])` 提供了**自动负载均衡**（Automatic Load Balancing）：
线程执行完当前 chunk 后，动态向调度器申请下一个可用 chunk。但代价是**运行时调度开销显著高于 static**。

### 动态调度机制

`dynamic` 意味着迭代的执行顺序是**运行时动态确定**的，而非编译时静态绑定。默认 `chunk = 1`，即每次只分配 1 个迭代。

### 示例：基本动态调度

```cpp
#include <iostream>
#include <omp.h>

int main() {
    const int nthreads = 3;
    omp_set_num_threads(nthreads);
    int n = 8;

    #pragma omp parallel for schedule(dynamic)  // 动态调度，默认 chunk = 1
    for (int i = 0; i < n; i++) {
        #pragma omp critical
        {
            std::cout << "Thread " << omp_get_thread_num()
                      << " is processing element " << i + 1 << std::endl;
        }
    }
    return 0;
}
```

**运行特征**：每次运行结果可能不同。线程 0 可能先抢到迭代 1，完成后继续抢迭代 3，而线程 2 可能只抢到迭代 2。分配具有**随机性和竞争性**。

### 示例：质数检测（负载不均衡场景）

判断 2 ~ n 中哪些是质数：偶数只需判断能否被 2 整除即可快速退出，奇数可能需要遍历到 `sqrt(num)`，计算量差异巨大。

```cpp
#include <iostream>
#include <omp.h>
#include <cmath>

bool check_prime(const int num) {
    for (int ii = 2; ii <= sqrt(num); ++ii) {
        if (num % ii == 0) return false;
    }
    return true;
}

int main() {
    const int nthreads = 4;
    omp_set_num_threads(nthreads);
    int n = 30;
    int count = 0;

    #pragma omp parallel for schedule(dynamic) reduction(+:count)
    for (int i = 2; i <= n; i++) {
        if (check_prime(i)) {
            #pragma omp critical
            {
                std::cout << "Thread " << omp_get_thread_num()
                          << " found prime number: " << i << std::endl;
            }
            count++;
        }
    }
    std::cout << "Total prime numbers: " << count << std::endl;
    return 0;
}
```

> [!note] 分析
> 若使用 `schedule(static)`，负责偶数区间的线程会迅速完成并空闲等待，而负责奇数密集区间的线程仍在忙碌，造成**线程空转**。`dynamic` 让快速完成的线程继续领取新任务，显著改善整体效率。

---

## Static 与 Dynamic 深度对比

| 对比维度 | 静态调度 `schedule(static)` | 动态调度 `schedule(dynamic)` |
| :--- | :--- | :--- |
| **分配时机** | 编译时/启动时预分配，固定不变 | 运行时动态竞争领取 |
| **默认 chunk** | `ndata / nthreads`（每个线程一个大块） | `1`（每次领 1 个迭代） |
| **负载均衡** | 差（无法适应迭代耗时差异） | 优（自动将任务导向空闲线程） |
| **运行时开销** | 极低（无同步） | 较高（需维护任务队列与同步） |
| **可重复性** | 高（每次运行分配相同） | 低（每次运行分配可能不同） |
| **适用场景** | 迭代耗时**固定且可预测** | 迭代耗时**高度可变** |
| **典型应用** | 数组统一计算、矩阵行操作 | 自适应网格、粒子模拟、质数检测 |

---

## 其他调度模式简介

### Guided 调度

`schedule(guided)` 与 `dynamic` 类似，但 `chunk` 大小会**动态递减**。初始 chunk 较大，后续逐步缩小。适用于迭代前期开销大、后期收敛快的场景（如分支定界算法）。

### Auto 调度

`schedule(auto)` 将调度决策完全交给编译器或运行时系统。方便但可能因实现差异导致性能不可预测，通常仅在不确定最优策略时作为兜底方案。

---

## 本节总结

- **`schedule(static)`**：预分配、低开销、适合均衡负载。理解其**轮询分块**机制是关键。
- **`schedule(dynamic)`**：运行时分配、高开销、适合不均衡负载。理解其**任务队列竞争**机制是关键。
- **负载均衡原则**：程序总完成时间取决于**最慢线程**。`dynamic` 通过牺牲部分调度开销来换取更好的负载均衡，在迭代耗时差异大时总体收益为正。
- **chunk 参数**：`static` 中显式 chunk 越小，负载均衡潜力越大（接近 cyclic 分配），但会破坏空间局部性；`dynamic` 中 chunk 越大，调度开销越低，但负载均衡粒度越粗。

---

## 思考题

1. 为什么 `schedule(static, 1)` 的分配效果与默认 `schedule(static)` 截然不同？前者相当于循环迭代的**周期分配（cyclic）**，后者是**块状分配（block）**。
2. 在质数检测示例中，若将 `schedule(dynamic)` 改为 `schedule(static)`，对 4 线程加速比会有何影响？请从负载均衡角度分析。
3. `dynamic` 调度的运行时开销主要来自哪里？（提示：任务队列的同步访问、线程竞争领取时的锁开销）
4. 若系统中有 4 个核心但其中一个因降频运行速度仅为其他的 50%，此时 `static` 与 `dynamic` 哪种更合适？为什么？
5. `guided` 调度中 chunk 大小逐步减小的设计动机是什么？（提示：前期大块减少调度频率，后期小块精细化均衡）

---

> [!note] 编译提示
> 所有示例使用 `g++ -fopenmp xxx.cpp` 编译。`omp.h` 头文件提供所有 OpenMP 库函数声明。
