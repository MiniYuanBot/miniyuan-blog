---
title: 'OpenMP 并行构造'
excerpt: '26 春 并行程序设计 L31'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'June 03 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 核心主题

本节围绕 **OpenMP 并行构造** 展开，涵盖线程数的优先级控制、条件并行、SPMD 手动循环划分、共享工作循环构造（`#pragma omp for`）、组合式构造（`#pragma omp parallel for`）以及 **规约（reduction）** 操作，重点解决循环携带依赖性与数据竞争问题。

---

## 线程数的优先级控制

OpenMP 并行区域中的线程数按照**从低到高**的优先级顺序确定：

| 优先级 | 设定方式 | 说明 |
| :--- | :--- | :--- |
| 最低 | 系统默认 | 通常为可用的处理器核数 |
| 较低 | `OMP_NUM_THREADS` | 环境变量（**OpenMP Number of Threads** - 设置默认线程数） |
| 较高 | `omp_set_num_threads()` | 库函数（**set number of threads** - 设置后续并行区域的线程数） |
| 更高 | `num_threads` 子句 | 编译制导子句（**number of threads** - 指定当前并行区域的线程数） |
| 最高 | `if` 子句 | 条件并行（**if** - 若条件不满足则仅使用单线程执行） |

> **注意：** `if` 子句不仅决定是否并行，还会覆盖前述所有设定。当条件为假时，整个并行区域退化为单线程（主线程）串行执行。

---

## 条件并行：if 子句

`#pragma omp parallel if(condition)`（**parallel if** - 条件并行，满足条件才创建多线程）

### 概念解释

`if` 子句允许程序在**运行时**根据条件决定是否开启多线程。若条件表达式为假，则并行区域只由主线程执行，等同于无 `parallel` 指令的串行代码。

### 代码示例

```cpp
#include <iostream>
#include <omp.h>

int main() {
    using namespace std;
    int nthreads = 3;
    omp_set_num_threads(nthreads);  // 设置线程数为 3

    // if 条件不满足 (3 > 3 为假)，仅主线程执行
    #pragma omp parallel if(nthreads > 3)
    {
        cout << "Hello world" << endl;
    }
    return 0;
}
```

**预期结果：** 仅输出一行 `Hello world`（主线程执行一次）。

```cpp
#include <iostream>
#include <omp.h>

int main() {
    using namespace std;
    int nthreads = 4;
    omp_set_num_threads(nthreads);  // 设置线程数为 4

    // if 条件满足 (4 > 3 为真)，创建 4 个线程
    #pragma omp parallel if(nthreads > 3)
    {
        cout << "Hello world" << endl;
    }
    return 0;
}
```

**预期结果：** 输出四行 `Hello world`（4 个线程各执行一次）。

> **常见错误：** 混淆 `if` 子句与 C/C++ 的 `if` 语句。`#pragma omp parallel if(...)` 是编译制导指令的一部分，不是运行时分支语句。

---

## SPMD 设计模式

**SPMD**（**Single Program, Multiple Data** - 单程序多数据）是并行编程的核心模式，在 MPI 中广泛使用，也可应用于 OpenMP。

### 核心思想

1. **启用**两个或多个执行相同代码的线程
2. 每个线程确定其 **ID** 和线程组中的**线程总数**
3. 依据 ID 和线程总数在线程之间**分配工作**，不同线程处理循环迭代的**不同部分**

### 循环迭代划分策略

| 策略 | 描述 | 适用场景 |
| :--- | :--- | :--- |
| **周期性分布（Cyclic Distribution）** | 线程 `id` 处理迭代 `i = id, id + nthreads, id + 2*nthreads, ...` | 负载均衡较好，各迭代计算量相近 |
| **块状分布（Block Distribution）** | 将循环迭代连续划分为 `nthreads` 个块，每线程负责一块 | 迭代范围 `istart` 到 `iend` 连续，局部性好 |

### 代码示例：周期性分布计算 π

```cpp
#include <omp.h>
#include <iostream>
#include <iomanip>
#include <sstream>
#include <fstream>

int main() {
    using namespace std;
    int nth = 4;                          // 线程数
    int steps = 10;                       // 为展示策略，仅算 10 步
    double* sum = new double[nth]();      // 各线程局部和
    double ds = 1.0 / (double)steps;      // 步长
    double x = 0.0;

    omp_set_num_threads(nth);

    #pragma omp parallel
    {
        int id = omp_get_thread_num();           // 获取线程 ID
        int nthreads = omp_get_num_threads();    // 获取线程总数

        // 每个线程打开独立日志文件
        stringstream ss;
        ss << "Log_" << id + 1 << ".txt";
        ofstream ofs(ss.str().c_str());
        ofs << "openmp thread id:" << id << endl;

        // 周期性分布：每隔 nthreads 个迭代执行一次
        for (int i = id; i < steps; i += nthreads) {
            x = ((double)i + 0.5) * (double)ds;
            sum[id] += 4.0 / (1.0 + x * x);
            ofs << i << " " << sum[id] << endl;
        }
        ofs << "sum=" << sum[id] << endl;
        ofs.close();
    }

    // 主线程合并结果
    double pi = 0.0;
    for (int i = 0; i < nth; ++i) pi += sum[i];
    pi *= ds;
    cout << "pi=" << setprecision(16) << pi << endl;

    delete[] sum;
    return 0;
}
```

**执行逻辑：** 4 个线程分别处理迭代 `0,4,8`、`1,5,9`、`2,6`、`3,7`，各自累加局部和，最后由主线程汇总。

### 代码示例：块状分布计算 π

```cpp
#include <omp.h>
#include <iostream>
#include <fstream>
#include <sstream>

int main() {
    int nth = 4;
    int steps = 10;
    double* sum = new double[nth]();
    double ds = 1.0 / (double)steps;

    omp_set_num_threads(nth);

    #pragma omp parallel
    {
        int id = omp_get_thread_num();
        int nthreads = omp_get_num_threads();

        // 块状分解：计算每个线程的 istart 和 iend
        int block = steps / nthreads;
        int rem = steps % nthreads;
        int istart = id * block + (id < rem ? id : rem);
        int iend = istart + block + (id < rem ? 1 : 0);

        stringstream ss;
        ss << "Log_" << id + 1 << ".txt";
        ofstream ofs(ss.str().c_str());
        ofs << "openmp thread id:" << id 
            << " istart=" << istart << " iend=" << iend << endl;

        for (int i = istart; i < iend; ++i) {
            double x = ((double)i + 0.5) * ds;
            sum[id] += 4.0 / (1.0 + x * x);
            ofs << i << " " << sum[id] << endl;
        }
        ofs << "sum=" << sum[id] << endl;
        ofs.close();
    }
    // ... 合并结果
    return 0;
}
```

> **最佳实践：** 手动 SPMD 划分虽然灵活，但代码冗长且易出错。OpenMP 提供了更高级的**共享工作循环构造**来自动完成这一任务。

---

## 共享工作循环构造

`#pragma omp for`（**for** - 循环工作共享，将循环迭代自动分配给各线程）

### 概念解释

**共享工作构造（Work-sharing Construct）** 告诉编译器将构造中的工作分配给一组线程。最常用的共享工作构造是**共享工作循环构造**，它自动将 `for` 循环的迭代划分给并行区域内的线程，无需手动计算 `istart`/`iend` 或周期性跳转。

### 基本语法

```cpp
#pragma omp for [clause[, clause]...]
for (init-expr; test-expr; incr-expr) {
    structured block
}
```

- **init-expr**：初始化表达式，循环变量必须是基本整数类型
- **test-expr**：关系表达式，使用 `<`, `<=`, `>`, `>=` 等常见关系运算符
- **incr-expr**：自增（`++`）、自减（`--`）或固定常量的加减整数表达式

### 循环控制变量的私有化

OpenMP 要求编译器在生成代码时，**每个线程都有自己的循环控制索引变量的私有副本**（本例为 `i`）。

> **重要规则：** 该自动私有化规则**仅适用于**紧接着共享工作循环构造的循环。若循环嵌套在内部，则其索引变量不会被自动私有化，可能引发**数据竞争（data race）**。

### 代码示例：自动划分循环

```cpp
#include <iostream>
#include <omp.h>
#include <sstream>
#include <fstream>

int main() {
    using namespace std;
    const int nthreads = 4;
    omp_set_num_threads(nthreads);

    #pragma omp parallel
    {
        const int id = omp_get_thread_num();
        stringstream ss;
        ss << "Log_" << id + 1 << ".txt";
        ofstream ofs(ss.str().c_str());
        ofs << "Hello from thread " << id << endl;

        int sum = 0;
        #pragma omp for
        for (int i = 0; i < 5; ++i) {
            sum += i;           // 各线程累加自己负责的迭代
            ofs << i + 1 << endl; // 记录处理的迭代编号
        }
        ofs << "sum=" << sum << endl;
        ofs.close();
    }
    return 0;
}
```

**预期结果：** 4 个线程自动分配 5 个迭代（如线程 0 得 `i=0`，线程 1 得 `i=1`，线程 2 得 `i=2`，线程 3 得 `i=3,4`），各线程的 `sum` 为局部累加值。

---

## 组合式并行共享工作循环构造

`#pragma omp parallel for`（**parallel for** - 并行区域与循环工作共享的组合）

### 概念解释

最常见的 OpenMP 编程模式是：先创建并行区域（`#pragma omp parallel`），再在其中使用共享工作循环（`#pragma omp for`）。为了简化，OpenMP 允许将这两个指令**合成**为一个组合式构造。

| 方式 | C/C++ 语法 | Fortran 语法 |
| :--- | :--- | :--- |
| 单独构造 | `#pragma omp parallel` <br> `{ #pragma omp for for-loop }` | `!$omp parallel` <br> `!$omp do do-loop` <br> `!$omp end do` <br> `!$omp end parallel` |
| **组合式构造** | `#pragma omp parallel for for-loop` | `!$omp parallel do do-loop` <br> `!$omp end parallel do` |

### 代码示例：组合式构造

```cpp
#include <iostream>
#include <vector>

int main() {
    const int N = 1000;
    std::vector<double> a(N), b(N);
    // 初始化 a, b ...

    // 组合式构造：创建线程组并自动划分循环
    #pragma omp parallel for
    for (int i = 0; i < N; ++i) {
        a[i] = a[i] + b[i];
    }
    return 0;
}
```

> **注意：** 组合式构造等价于在 `parallel` 区域内紧跟一个 `for` 构造，但代码更简洁，是 OpenMP 中最常用的编程样式。

---

## 支持的子句与构造对照

不同 OpenMP 构造支持的子句有所不同，下表总结了 `parallel`、`for`、`parallel for` 对常见子句的支持情况：

| 子句 | `parallel` | `for` | `parallel for` |
| :--- | :---: | :---: | :---: |
| `if` | ● |  | ● |
| `num_threads` | ● |  | ● |
| `default` | ● |  | ● |
| `copyin` | ● |  | ● |
| `shared` | ● | ● | ● |
| `private` | ● | ● | ● |
| `reduction` | ● | ● | ● |
| `firstprivate` | ● | ● | ● |
| `lastprivate` |  | ● | ● |
| `schedule` |  | ● | ● |
| `ordered` |  | ● | ● |
| `collapse` |  | ● | ● |
| `nowait` |  | ● | ● |

> **图例说明：** ● 表示该构造支持此子句。`parallel` 主要关注线程创建与数据环境，`for` 主要关注循环调度与同步，`parallel for` 兼具两者特性。

---

## 规约操作

`reduction(op:var)`（**reduction** - 归约操作，线程私有副本运算后按指定运算符合并）

### 概念解释

**规约（Reduction）** 是将一组数据通过指定**二元运算**（如 `+`、`*`、`max`、`min`）合并成一个值的并行计算操作。它是并行编程中最常见的模式之一（如求和、求积、找最值）。

### 问题背景：循环携带依赖性

考虑以下代码：

```cpp
// 错误示例：存在数据竞争
#pragma omp parallel for
for (int i = 0; i < n; ++i) {
    sum += array[i];  // 多个线程同时读写 sum，结果不可预知
}
```

变量 `sum` 出现了**循环携带依赖性（Loop-carried Dependence）**。在不改变循环主体结构的情况下，无法通过简单的共享工作循环构造或 SPMD 方式并行化，因为多个线程会同时修改 `sum`，导致**数据竞争**。

### 解决方案：reduction 子句

OpenMP 通过 `reduction` 子句自动解决此问题：

1. **创建私有副本**：为每个线程创建 `sum` 的一个私有副本，初始化为该运算符的**单位元**（identity value）
2. **局部计算**：每个线程在私有副本上累加自己负责的迭代部分
3. **自动合并**：循环结束后，将所有线程的私有副本按指定运算符合并到全局的 `sum` 中

### 常见规约运算符与初始值

| 运算符（op） | 初始值 | 说明 |
| :--- | :--- | :--- |
| `+` | `0` | 求和（**sum**） |
| `*` | `1` | 求积（**product**） |
| `\|`（位或） | `0` | 按位或 |
| `min` | 最大正数 | 求最小值（**minimum**） |
| `max` | 最大负数 | 求最大值（**maximum**） |

### 代码示例：求和规约

```cpp
#include <iostream>
#include <omp.h>

int main() {
    const int n = 1000;
    double* array = new double[n]();  // 初始化为 0
    // 假设 array 已被填充数据...

    double sum = 0.0;

    // reduction(+:sum) 自动为每个线程创建 sum 的私有副本
    // 循环结束后将所有副本相加合并到全局 sum
    #pragma omp parallel for reduction(+:sum)
    for (int i = 0; i < n; ++i) {
        sum += array[i];
    }

    sum /= n;  // 求平均
    std::cout << "The sum value is: " << sum << std::endl;

    delete[] array;
    return 0;
}
```

### 代码示例：求平方和规约

```cpp
#include <iostream>
#include <omp.h>

int main() {
    int sum = 0;

    // 计算 1^2 + 2^2 + ... + 10^2 = 385
    #pragma omp parallel for reduction(+:sum)
    for (int i = 1; i <= 10; ++i) {
        sum += i * i;
    }

    std::cout << "The sum of squares is: " << sum << std::endl;
    return 0;
}
```

**执行流程：**

- 假设 4 个线程，迭代 `1..10` 被自动划分
- 线程 0 可能处理 `1,2,3`，局部 `sum = 1 + 4 + 9 = 14`
- 线程 1 可能处理 `4,5,6`，局部 `sum = 16 + 25 + 36 = 77`
- 线程 2 可能处理 `7,8`，局部 `sum = 49 + 64 = 113`
- 线程 3 可能处理 `9,10`，局部 `sum = 81 + 100 = 181`
- 隐式屏障后合并：`14 + 77 + 113 + 181 = 385`

> **性能提示：** `reduction` 比手动加 `critical` 求和性能更高，因为前者利用私有副本避免线程间同步，仅在最后做一次合并；后者每次累加都需进入临界区，串行化严重。

---

## 隐式屏障与 nowait 子句

对于所有**共享工作构造**，在构造的末尾都有一个**隐式屏障（Implicit Barrier）**。

`nowait`（**no wait** - 取消隐式屏障，线程执行完无需等待其他线程）

### 概念解释

默认情况下，`#pragma omp for` 结束后，所有线程会等待直到该构造中运行的线程组全部完成，以确保数据一致。若后续代码不依赖本次循环的结果，可使用 `nowait` 子句取消等待，减少同步开销。

```cpp
#pragma omp parallel
{
    #pragma omp for nowait
    for (int i = 0; i < N; ++i) {
        a[i] = heavy_compute(i);
    }
    // 使用 nowait 后，先完成的线程可立即执行后续代码
    // 但需注意：若后续代码读取 a[]，可能读到未计算完成的值！
}
```

> **常见错误：** 在 `parallel for` 组合构造中，隐式屏障位于 `for` 构造末尾，而非 `parallel` 区域末尾。若使用 `nowait`，线程完成循环后即可继续执行 `parallel` 区域内的后续代码，但仍会在 `parallel` 区域末尾汇合（除非 `parallel` 也使用了 `nowait`，但 `parallel` 不支持 `nowait`）。

---

## 对比与总结

### SPMD 手动划分 vs. 共享工作循环构造

| 特性 | SPMD 手动划分 | `#pragma omp for` 自动划分 |
| :--- | :--- | :--- |
| 代码复杂度 | 高，需手动计算 ID、范围、步长 | 低，编译器自动处理 |
| 灵活性 | 高，可自定义负载分配策略 | 中，依赖 `schedule` 子句 |
| 可维护性 | 差，易出错 | 好，语义清晰 |
| 适用场景 | 不规则循环、特殊数据分布 | 标准 `for` 循环、规则迭代 |

### 周期性分布 vs. 块状分布

| 特性 | 周期性分布（Cyclic） | 块状分布（Block） |
| :--- | :--- | :--- |
| 迭代分配 | 线程 `id` 处理 `i = id, id+P, id+2P...` | 连续迭代块分配给各线程 |
| 负载均衡 | 好，适合迭代计算量差异大的情况 | 可能不均，若末尾迭代计算量大 |
| 局部性 | 差，内存访问不连续 | 好，连续访问利于缓存命中 |
| OpenMP 对应 | `schedule(dynamic)` 类似效果 | `schedule(static)` 默认行为 |

### 数据属性子句对比

| 子句 | 英文含义 | 进入并行区时 | 退出并行区时 | 典型用途 |
| :--- | :--- | :--- | :--- | :--- |
| `private(var)` | **private** - 私有变量 | 未初始化 | 值丢失 | 临时变量，线程独立计算 |
| `firstprivate(var)` | **first private** - 首私有变量 | 拷贝主线程值初始化 | 值丢失 | 需要串行初始值的私有变量 |
| `lastprivate(var)` | **last private** - 末私有变量 | 未初始化 | 最后一次迭代值写回 | 需要循环最终迭代结果的变量 |
| `shared(var)` | **shared** - 共享变量 | 所有线程访问同一内存 | 值保留 | 只读数据或已同步的写操作 |
| `reduction(op:var)` | **reduction** - 归约变量 | 初始化为单位元 | 按运算符合并到原变量 | 求和、求积、最值等 |

---

## 本节总结

- **线程数优先级**：系统默认 < `OMP_NUM_THREADS` < `omp_set_num_threads()` < `num_threads` < `if` 条件并行
- **`if` 子句**：实现**条件并行**，条件不满足时退化为单线程串行执行
- **SPMD 模式**：单程序多数据，通过 `omp_get_thread_num()` 和 `omp_get_num_threads()` 手动分配循环迭代，支持**周期性分布**与**块状分布**
- **共享工作循环构造**：`#pragma omp for` 自动划分循环迭代，循环变量 `i` 自动私有化
- **组合式构造**：`#pragma omp parallel for` 是最常用的 OpenMP 编程样式，简洁高效
- **规约 `reduction`**：自动为变量创建私有副本、局部计算、最终合并，优雅解决**循环携带依赖性**与**数据竞争**，支持 `+`、`*`、`max`、`min` 等运算符
- **隐式屏障**：共享工作构造末尾默认存在线程同步点，可用 `nowait` 取消以提升性能，但需确保后续无数据依赖

---

## 思考题

1. **为什么 `reduction(+:sum)` 比手动加 `#pragma omp critical` 求和性能更高？** 从线程同步开销和并行度角度分析。
2. **`private` 变量在并行区域结束后为何值会丢失？** 若需要在并行区外保留最终值，应使用哪个子句？
3. **如何避免数据竞争？** 列举至少三种 OpenMP 机制（`reduction`、`critical`、`atomic`、`private` 等）。
4. **`schedule(static)` 与 `schedule(dynamic)` 在负载不均衡时分别有何表现？** 结合 SPMD 的周期性分布与块状分布思考。
5. **组合式构造 `#pragma omp parallel for` 是否支持 `parallel` 和 `for` 的所有子句？** 对照子句支持表，指出哪些子句不能用于组合式构造。
