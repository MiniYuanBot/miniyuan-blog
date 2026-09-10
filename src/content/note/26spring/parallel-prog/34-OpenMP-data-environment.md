---
title: 'OpenMP 数据环境'
excerpt: '26 春 并行程序设计 L34'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'June 06 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 数据环境基础概念

### 共享内存模型

OpenMP 是一个**共享内存（shared memory）**的编程模型。程序启动时，操作系统创建一个进程，进程包含 `n` 个线程以及这 `n` 个线程可见的内存块（通常是**堆空间，heap**）。

- **进程存储（堆空间）**：所有线程共享，存放全局变量、静态存储声明变量、动态分配内存（`new`/`malloc`）。
- **线程存储（栈空间）**：每个线程私有，存放线程栈中的局部变量、程序计数器等。

| 存储位置 | 内存类型 | 默认可见性 | 典型变量 |
| :--- | :--- | :--- | :--- |
| 进程存储 | 堆空间 | **共享（shared）** | 全局变量、静态变量、`new`/`malloc` 分配的内存 |
| 线程存储 | 栈空间 | **私有（private）** | 并行区域内定义的局部变量、函数形参 |

### 默认存储属性规则

- **并行区域外**定义的变量（全局变量、静态变量、并行区域前定义的局部变量）**默认是共享的**。
- **并行区域内**、`parallel` 块内定义的局部变量**默认是私有的**。
- 真实代码中需要靠人、编译器和 AI 模型三者一起去区分和辨认共享、私有变量。

> **注意：** 函数形参本身是线程栈上的局部变量（私有），但如果它是指针，指向的内存区域可能是共享的。`static` 局部变量属于静态存储，**不是线程私有变量**！

---

## 核心数据环境子句

当线程遇到 OpenMP 构造时，会创建一个新的数据环境。数据环境子句将老数据环境中的变量**映射**到新区域的数据环境中。同一个变量在两个数据环境中的角色可以变换。

### `shared` 子句

`shared(list)`（**shared** - 共享变量，对所有线程可见，类似 C++ 的 `public` 属性）

显式声明列表中的变量为共享变量。虽然并行区域外变量默认共享，但显式列出是良好的编程实践。

**例 1：基本 shared 用法**

```cpp
#include <iostream>
#include <omp.h>
using namespace std;

int main() {
    const int nthreads = 4;
    omp_set_num_threads(nthreads);

    int a = 10;  // 并行区域外定义，默认共享
    int b = 9;
    int c = 8;

    #pragma omp parallel shared(a)
    {
        int id = omp_get_thread_num();
        int b = id;       // 并行区域内定义，私有
        int c = id * id;  // 并行区域内定义，私有
        cout << "Thread=" << id << " a=" << a 
             << " b=" << b << " c=" << c << endl;
    }
    // 并行区域结束后：a 仍为 10（共享），b、c 恢复为 9、8
    cout << "final a=" << a << " final b=" << b << " final c=" << c << endl;
    return 0;
}
```

**预期输出：**

```
Thread=0 a=10 b=0 c=0
Thread=3 a=10 b=3 c=9
Thread=2 a=10 b=2 c=4
Thread=1 a=10 b=1 c=1
final a=10 final b=9 final c=8
```

> **关键理解：** `b` 和 `c` 在并行区域外定义，默认共享；但并行区域内又重新定义了同名的 `b` 和 `c`，这些是新创建的**私有局部变量**，与外部共享变量**无存储关联**。

**例 2：for 循环中的 shared（无效写法警示）**

```cpp
int i = 99;
int sum = 0;

// 无效写法：即使显式 shared(i)，for 循环的迭代变量 i 强制为私有
#pragma omp parallel for shared(i, sum)
for (i = 0; i < 10; ++i) {
    #pragma omp critical
    {
        sum = sum + i;  // sum 是共享的，需 critical 保护
    }
}
// 循环结束后 i 仍为 99（共享变量未被修改）
// sum = 45
```

> **重要规则：** `for` 循环的迭代变量**强制为私有**，即使使用 `shared(i)` 也无法改变。这是 OpenMP 规范的规定，因为每个线程需要独立的迭代索引。

---

### `private` 子句

`private(list)`（**private** - 私有变量，每个线程拥有独立副本，与外部同名变量无存储关联）

为列表中的每个变量在每个线程中创建**未初始化的私有副本**。并行区域内对私有变量的修改不会影响外部同名变量，退出并行区域后外部变量值保持不变。

**例 3：private 的基本行为**

```cpp
#include <iostream>
#include <fstream>
#include <sstream>
#include <omp.h>
using namespace std;

int main() {
    const int nthreads = 4;
    omp_set_num_threads(nthreads);

    int a = 0;  // 外部变量，默认共享

    #pragma omp parallel private(a)
    {
        int id = omp_get_thread_num();
        a = id + 1;  // 每个线程的私有 a，互不干扰

        stringstream ss;
        ss << "Log_" << id + 1 << ".txt";
        ofstream ofs(ss.str().c_str());
        ofs << "openmp thread id: " << id << endl;
        ofs << "Thread " << id << " a = " << a << endl;
        ofs.close();
    }
    // 并行区域外 a 仍为 0（private 与外部无关联）
    cout << "a = " << a << endl;
    return 0;
}
```

**预期输出：**

```
a = 0
```

> **核心要点：** `private(a)` 创建的私有副本**未初始化**（如果直接使用外部值会出错），且与外部 `a`**完全无存储关联**。并行区域结束后，私有副本被销毁，外部 `a` 保持原值。

---

### `firstprivate` 子句

`firstprivate(list)`（**first private** - 首次私有，用外部同名变量的值初始化每个线程的私有副本）

与 `private` 类似，为每个线程创建私有副本，但区别在于进入并行区域时，会用**外部变量的当前值**初始化每个线程的副本。

**例 4：firstprivate 的初始化行为**

```cpp
#include <iostream>
#include <fstream>
#include <sstream>
#include <omp.h>
using namespace std;

int main() {
    const int nthreads = 4;
    omp_set_num_threads(nthreads);

    int a = 10;  // 外部变量

    #pragma omp parallel firstprivate(a)
    {
        int id = omp_get_thread_num();
        int b = a;        // b = 10（a 的私有副本已被初始化为 10）
        a = a + 90;       // 私有副本变为 100
        a = a + 1;        // 私有副本变为 101

        stringstream ss;
        ss << "Log_" << id + 1 << ".txt";
        ofstream ofs(ss.str().c_str());
        ofs << "Thread " << id << " a1 = " << b << endl;   // 10
        ofs << "Thread " << id << " b   = " << b << endl;   // 10
        ofs << "Thread " << id << " a2 = " << a << endl;   // 100
        ofs << "Thread " << id << " a3 = " << a << endl;   // 101
        ofs.close();
    }
    cout << "a = " << a << endl;  // 外部 a 仍为 10
    return 0;
}
```

> **对比记忆：** `private` =  uninitialized 副本；`firstprivate` =  initialized with original value 副本。

---

### `lastprivate` 子句

`lastprivate(list)`（**last private** - 最后私有，将执行了最后一次迭代的线程的私有变量值带出并行区域）

用于 `for` 循环构造中，将**最后一次迭代**（逻辑上的最后，不一定是实际最后执行的线程）的私有变量值赋给外部同名变量。

**例 5：lastprivate 将结果带出**

```cpp
#include <iostream>
#include <omp.h>
using namespace std;

int main() {
    const int nthreads = 4;
    omp_set_num_threads(nthreads);

    int a = 10;

    #pragma omp parallel for lastprivate(a)
    for (int i = 0; i < 4; ++i) {
        int id = omp_get_thread_num();
        a = a + 1;  // 每个线程的私有副本（firstprivate 默认行为 + lastprivate）
        #pragma omp critical
        {
            cout << "Thread=" << id << " a=" << a << endl;
        }
    }
    cout << "final a=" << a << endl;  // a = 11（最后一次迭代 i=3 的结果）
    return 0;
}
```

**预期输出：**

```bash
Thread=0 a=11
Thread=3 a=11
Thread=1 a=11
Thread=2 a=11
final a=11
```

> **注意：** `lastprivate` 在 `for` 循环中隐含了 `firstprivate` 的初始化行为（如果变量在循环外有初值），但主要作用是**将最后一次迭代的值带出并行区域**。

---

### `default` 子句

`default(none)`（**default none** - 默认无，强制要求显式声明所有变量的数据属性）

OpenMP 程序中最常见的错误来源之一是变量有错误的存储属性。`default(none)` 要求传递到并行区域的所有变量必须明确列在 `private`、`firstprivate`、`reduction` 或 `shared` 中，否则编译器报错。

```cpp
#pragma omp parallel for default(none)     shared(arr, len)     reduction(max:max_val)     reduction(min:min_val)     reduction(*:product)
for (int i = 0; i < len; i++) {
    if (arr[i] > max_val) max_val = arr[i];
    if (arr[i] < min_val) min_val = arr[i];
    product *= arr[i];
}
```

> **最佳实践：** 在调试和正式代码中养成使用 `default(none)` 的习惯，可显著减少因默认共享属性导致的数据竞争 bug。

---

## 全局变量的私有化机制

### `threadprivate` 子句

`threadprivate(list)`（**thread private** - 线程私有，将全局变量变为每个线程拥有独立的全局副本）

- 作用对象：**全局变量**（或文件作用域的静态变量）。
- 效果：每个线程拥有该全局变量的**独立副本**，线程间互不可见。
- 生命周期：贯穿整个程序，在相邻的并行区域和串行区域中，**同一个线程**访问的是**同一个副本**。

```cpp
#include <iostream>
#include <omp.h>
using namespace std;

int a = 100;  // 全局变量
#pragma omp threadprivate(a)  // 每个线程拥有独立的 a 副本

int main() {
    const int nthreads = 2;
    omp_set_num_threads(nthreads);
    // ...
}
```

### `copyin` 子句

`copyin(variable)`（**copy in** - 拷贝进入，将主线程中 threadprivate 变量的当前值复制到所有线程的副本中）

- 前提：变量必须用 `threadprivate` 声明过。
- 作用时机：并行区域**开始时**。
- 功能：用主线程的当前值覆盖所有线程的 `threadprivate` 副本，确保并行区启动时各线程副本值一致。

> **默认行为：** `threadprivate` 变量默认会继承主线程中的初始值（如全局初始化 `int a = 100`）。但如果主线程的值在进入并行区前发生了修改，不使用 `copyin` 时线程副本不会同步这个新值。

### `copyprivate` 子句

`copyprivate(list)`（**copy private** - 拷贝私有，single 指令的专属子句，将单个线程的私有变量值广播到所有线程）

- **专属子句：** 只能与 `single` 指令配合使用，不能单独存在。
- 作用：在 `single` 区域结束时，将执行了 `single` 块的线程的私有变量值，复制到**其他所有线程**的同名私有变量中。

**完整示例：copyin 与 copyprivate 的综合运用**

```cpp
#include <iostream>
#include <omp.h>
using namespace std;

int a = 100;  // 全局变量
#pragma omp threadprivate(a)

int main() {
    const int nthreads = 2;
    omp_set_num_threads(nthreads);

    int b = 100;
    int c = 1000;

    // 第一个并行区域
    #pragma omp parallel firstprivate(b) copyin(a)
    {
        #pragma omp critical
        {
            cout << " initial a=" << a << " b=" << b << endl;
        }

        // single + copyprivate：只有一个线程执行赋值，然后广播给所有线程
        #pragma omp single copyprivate(a, b)
        {
            a = 10;   // 全局变量 a 的副本被修改
            b = 20;   // 私有变量 b 被修改
        }

        #pragma omp critical
        {
            cout << " after a=" << a << " b=" << b << endl;
        }
    }
    // 离开第一个并行区：全局变量 a 的值变为 10（主线程副本）
    // 局部变量 b 恢复为 100
    cout << " global a=" << a << " global b=" << b << endl;

    // 第二个并行区域
    #pragma omp parallel copyin(a)
    {
        #pragma omp critical
        {
            cout << " initial2 a=" << a << " b=" << b << endl;
        }
    }
    return 0;
}
```

**三种情况对比：**

| 情况 | 第一个并行区 `single` | 第二个并行区 | 结果特征 |
| :--- | :--- | :--- | :--- |
| 情况一 | `copyprivate(a,b)` | 无 `copyin(a)` | 两个线程的 `a` 都变为 10；第二个并行区 `a` 保持 10（继承主线程副本） |
| 情况二 | 无 `copyprivate` | 无 `copyin(a)` | 仅 single 执行的线程（主线程）`a=10,b=20`；另一线程不变；第二个并行区两线程 `a` 值不同（10 vs 100） |
| 情况三 | 无 `copyprivate` | 有 `copyin(a)` | 同情况二的第一并行区；第二个并行区 `copyin` 将主线程 `a=10` 传播到所有线程，两线程 `a` 都为 10 |

> **关键洞察：** `copyprivate` 实现的是**线程间私有变量的广播**；`copyin` 实现的是**主线程到所有线程的 threadprivate 变量同步**。

---

## 对比总结

### `private` vs `firstprivate` vs `lastprivate`

| 特性 | `private` | `firstprivate` | `lastprivate` |
| :--- | :--- | :--- | :--- |
| 副本数量 | 每个线程一个 | 每个线程一个 | 每个线程一个 |
| 初始化 | **未初始化** | 用外部变量值**初始化** | 用外部变量值初始化（隐含） |
| 退出后外部变量 | **保持原值** | 保持原值 | 被赋值为**最后一次迭代**的副本值 |
| 适用构造 | `parallel`, `for` | `parallel`, `for` | `for` |
| 与外部关联 | **无存储关联** | 进入时复制值 | 退出时复制值 |

### `private` vs `threadprivate`

| 项目 | `private` 子句 | `threadprivate` 子句 |
| :--- | :--- | :--- |
| 数据类型 | **局部变量** | **全局变量**（或静态变量） |
| 作用范围 | 当前并行区域 | 整个程序生命周期 |
| 跨并行区关联性 | 与外部同名变量**无关联** | 同一线程在相邻并行区访问**同一副本** |
| 初始化方式 | 未初始化 | 继承全局初始化值 |
| 同步子句 | `firstprivate`（进入时复制） | `copyin`（进入时复制主线程值） |
| 退出时赋值 | `lastprivate`（带出最后迭代值） | 副本值持续保留到下次使用 |

---

## 问答例题解析

**题目：**

```cpp
int A = 1, B = 1, C = 1;
#pragma omp parallel private(B) firstprivate(C)
{
    // 并行区域
}
```

**问题：**

| 问题 | 答案 |
| :--- | :--- |
| 并行区域内 A、B、C 的存储属性 | A：**共享**（默认）；B：**私有**（显式声明）；C：**私有**（显式声明） |
| 并行区域内的初始值 | A = **1**（共享，外部值）；B = **未定义/不确定**（private 未初始化）；C = **1**（firstprivate 用外部值初始化） |
| 并行区域后的值 | A = **可能改变**（共享，若被修改）；B = **1**（恢复外部值）；C = **1**（恢复外部值） |

---

## 实际代码中的陷阱：ABACUS 案例分析

在 ABACUS 软件的 OpenMP 并行代码中，曾出现以下典型模式：

```cpp
#ifdef _OPENMP
#pragma omp parallel
{
#endif
    double *aux = new double[msh];  // 每个线程都执行 new

    #ifdef _OPENMP
    #pragma omp for
    #endif
    for (int ig = igl0; ig < rho_basis->ngg; ig++) {
        // ... 使用 aux[ir] ...
    }

    delete [] aux;  // 每个线程都执行 delete
#ifdef _OPENMP
}
#endif
```

**分析：**

- `aux` 指针本身是**线程私有**的（在 `parallel` 区域内定义）。
- 但 `new double[msh]` 分配的是**共享堆内存**，每个线程都会执行一次 `new`，造成内存浪费。
- 如果 `aux` 在 `parallel` 区域外定义，则所有线程共享同一个 `aux` 指针，同时读写 `aux[ir]` 会产生**数据竞争**。
- 多个线程同时 `delete` 同一片内存会导致**未定义行为**。

> **启示：** AI 模型在分析此类代码时容易出错。需要人工仔细审查：指针变量本身的存储属性 vs 指针所指向内存的存储属性，以及 `new`/`delete` 的配对关系是否在正确的线程作用域内。

---

## 本节总结

1. **默认规则：** 并行区域外变量默认 `shared`，区域内局部变量默认 `private`。
2. **`shared`：** 所有线程访问同一内存，写操作需要同步保护（`critical`/`atomic`）。
3. **`private`：** 创建未初始化副本，与外部变量无关联，退出后外部值不变。
4. **`firstprivate`：** 私有副本用外部值初始化，适合需要读取初始状态的场景。
5. **`lastprivate`：** 用于 `for` 循环，将最后一次迭代的值带出并行区域。
6. **`default(none)`：** 强制显式声明所有变量属性，是避免数据竞争的最佳实践。
7. **`threadprivate`：** 让全局变量在每个线程中有独立的全局生命周期副本。
8. **`copyin`/`copyprivate`：** 分别实现主线程到所有线程的同步，以及 single 线程到所有线程的广播。

---

## 思考题

1. 为什么 `for` 循环的迭代变量即使被声明为 `shared` 也强制为私有？从并行正确性角度分析。
2. `private` 和 `firstprivate` 的本质区别是什么？如果忘记使用 `firstprivate` 而直接用 `private`，会导致什么常见 bug？
3. `lastprivate` 的"最后一次迭代"是指逻辑上的最后（`i = N-1`）还是实际执行顺序的最后？在 `schedule(dynamic)` 下有何区别？
4. 为什么 `threadprivate` 变量在相邻的两个 `parallel` 区域中，同一线程访问的是同一副本？这依赖于什么实现机制？
5. 在 ABACUS 的代码案例中，如果 `aux` 在 `parallel` 外定义且不加 `private`，会产生什么后果？如果 `aux` 在 `parallel` 内定义但 `new` 在 `parallel` 外，又会怎样？
