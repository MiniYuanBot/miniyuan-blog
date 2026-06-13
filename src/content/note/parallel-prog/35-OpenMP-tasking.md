---
title: 'OpenMP 3.0 与任务并行'
excerpt: '26 春 并行程序设计 L35'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'MPI'
pubDate: 'June 07 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 核心主题

本节聚焦 **OpenMP 3.0（2008年5月发布）** 引入的 `#pragma omp task` 构造，解决**不规则问题**（如链表遍历、递归树形结构）的并行化难题，实现**动态负载均衡**。同时回顾 `#pragma omp single` 的同步语义，并补充 `#pragma omp sections` 的静态任务划分机制。

---

## 回顾：single 构造与线程同步

### single 构造

`#pragma omp single`（**single** - 单一执行，仅由线程组中**一个线程**执行其结构化块）是共享工作构造的一种。其他线程会在该构造结束处的**隐式栅栏**（implicit barrier）等待。

- `nowait` 子句（**no wait** - 取消等待，禁用隐式栅栏，使其他线程无需等待即可继续执行后续代码）

**C/C++ 语法：**

```cpp
#pragma omp single [nowait]
{
    // 仅一个线程执行此代码块
}
```

**Fortran 语法：**

```fortran
!$omp single
! 结构化块
!$omp end single [nowait]
```

> **最佳实践：** `single` 构造非常适合执行**初始化**、**收尾操作**或**线程间共享变量的单次 I/O**（如打印当前线程总数），避免多线程重复执行导致的数据竞争或输出混乱。

---

### barrier 指令

`#pragma omp barrier`（**barrier** - 栅栏/路障，强制并行区域内**所有线程**到达此点后才可继续执行）常用于显式同步。

```cpp
#pragma omp parallel num_threads(3)
{
    #pragma omp single
    {
        x = 1;  // 仅一个线程修改 x
    }
    #pragma omp barrier  // 所有线程在此等待，确保 x=1 已生效
    // 此后所有线程读取 x 均为 1
}
```

> **注意：** `single` 构造本身自带隐式 `barrier`（除非使用 `nowait`）。显式 `#pragma omp barrier` 用于在并行区域内强制全局同步。

---

### 数据环境回顾：firstprivate 与 shared

在循环并行中，常结合数据属性子句控制变量可见性：

- `firstprivate(var)`（**first private** - 首私有变量，每个线程拥有独立副本，且**用进入并行区前的变量值初始化**）
- `shared(var)`（**shared** - 共享变量，所有线程访问**同一内存地址**）
- `private(var)`（**private** - 私有变量，每个线程拥有独立副本，但**未初始化**）

```cpp
int n = 11;
#pragma omp parallel for firstprivate(n)
for (int i = 0; i < n; ++i) {
    // 每个线程都有一份初始值为 11 的 n 副本
}
```

> **常见错误：** 若 `sum` 为 `shared` 且多个线程同时执行 `sum += i`，必须使用 `#pragma omp critical`（**critical** - 临界区，同一时刻仅允许一个线程执行）保护，否则产生数据竞争。

---

## 不规则问题与 task 构造

### 不规则问题的定义

**不规则问题**（Irregular Problems）指控制流和依赖性在编译时**不可预测**的问题。典型例子是**链表遍历**：

```cpp
p = head;
while (p != NULL) {
    processwork(p);
    p = p->next;
}
```

**无法使用 `#pragma omp for` 的原因：**

- `#pragma omp for`（**for** - 循环工作共享，将循环迭代分配给各线程）要求循环具有**明确的增量**和**不变的边界条件**
- `while` 循环的迭代空间无解析表达式，长度在编译时**未知**
- 链表节点依赖数据且动态生成，无法转为静态 `for` 循环

**传统三步并行链表算法的缺陷：**

1. 遍历链表统计项数
2. 再次遍历将节点指针存入数组
3. 用 `#pragma omp for` 并行处理数组

该方案需**三次遍历**并引入额外数组开销，破坏了原始代码的简洁性。

---

### task 构造：OpenMP 3.0 的核心扩展

`#pragma omp task`（**task** - 任务，创建显式独立工作单元）是 OpenMP 3.0 为不规则问题引入的**动态并行**机制。

**核心特性：**

- **独立于线程**：任务由线程组中的**空闲线程动态领取**执行，实现自动负载均衡
- **异步执行**：遇到 `#pragma omp task` 时，当前线程创建任务后**立即继续**执行后续代码，不等待任务完成
- **任务组成**：包含结构化块代码及其**数据环境**

**C/C++ 语法：**

```cpp
#pragma omp task [clause[[,] clause]...]
{
    // 任务代码块
}
```

**Fortran 语法：**

```fortran
!$omp task [clause[[,] clause]...]
! 结构化块
!$omp end task [nowait]
```

**可选子句包括：** `shared`, `private`, `firstprivate`, `default`, `if`, `final`, `untied`, `mergeable`, `depend` 等（本节重点涉及 `shared` / `private` / `firstprivate`）。

---

### taskwait：任务依赖同步

`#pragma omp taskwait`（**task wait** - 任务等待，阻塞当前任务直到其**所有直接子任务**完成）用于确保任务间依赖关系。

```cpp
#pragma omp task
A();  // 创建任务 A
#pragma omp task
B();  // 创建任务 B
#pragma omp taskwait  // 等待 A 和 B 完成
C();  // 现在可以安全执行 C（假设 C 依赖 A、B 结果）
```

> **应用场景：** 在递归算法（如二叉树遍历）中，`taskwait` 确保左右子树处理完毕后再进行当前节点的汇总操作。

---

### task 的数据环境

任务的数据环境绑定的是**任务本身**，而非线程：

| 属性 | 语义 | 内存行为 |
| :--- | :--- | :--- |
| `shared` | **shared** - 共享 | 任务内部引用指向**同一内存地址**（所有任务/线程共享） |
| `private` | **private** - 私有 | 任务执行时创建**新的未初始化**存储空间 |
| `firstprivate` | **first private** - 首私有 | 任务执行时创建新空间，并用**构造时变量值初始化** |

> **关键区别：** 与 `parallel` 区域的数据环境类似，但 `task` 的 `private` 空间是在**任务执行时**（可能由不同线程执行）创建的，而非线程创建时。

---

## 代码示例

### 示例一：二叉树并行遍历（递归任务）

```cpp
#include <iostream>
#include <omp.h>

struct Node {
    int val;
    Node* left;
    Node* right;
    Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

void processTree(Node* root) {
    if (!root) return;

    // 当前节点处理工作
    printf("Thread %d processing node: %d\n", omp_get_thread_num(), root->val);

    // 为左子树创建任务（任何空闲线程可执行）
    #pragma omp task
    processTree(root->left);

    // 为右子树创建任务
    #pragma omp task
    processTree(root->right);

    // 等待左右子任务完成，避免提前返回
    #pragma omp taskwait
}

void deleteTree(Node* root) {
    if (!root) return;
    deleteTree(root->left);
    deleteTree(root->right);
    delete root;
}

int main() {
    const int nthreads = 4;
    omp_set_num_threads(nthreads);

    // 构建测试二叉树
    Node* root = new Node(1);
    root->left = new Node(2);
    root->right = new Node(3);
    root->left->left = new Node(4);
    root->left->right = new Node(5);

    #pragma omp parallel
    {
        #pragma omp single
        {
            // 仅一个线程启动递归，其他线程空闲等待并"偷取"任务
            processTree(root);
        }
    }

    deleteTree(root);
    return 0;
}
```

**执行逻辑：**

1. `#pragma omp parallel`（**parallel** - 并行区域，创建线程组）建立 4 个线程的并行区
2. `#pragma omp single`（**single** - 单线程执行）确保仅一个线程调用 `processTree(root)`
3. 该线程在递归过程中不断 `#pragma omp task` 生成左右子树任务，放入任务队列
4. 其他 3 个线程从任务队列中**动态领取**任务执行，实现负载均衡
5. `#pragma omp taskwait` 保证后序遍历的依赖关系（子节点处理完才能处理父节点汇总）

---

### 示例二：递归分治计算 π（Task 并行版）

**数学原理：**
$$ \int_{0}^{1} \frac{4.0}{1+x^2} dx = \pi \approx \sum_{i=0}^{N} F(x_i) \Delta x $$

**串行递归函数（最小块阈值）：**

```cpp
double comp_pi(const int nstart, const int nfinish,
               const double step, const int min_blk) {
    double x = 0.0, sum = 0.0;

    if (nfinish - nstart < min_blk) {
        // 计算量小于阈值，直接串行计算
        for (int i = nstart; i < nfinish; ++i) {
            x = (i + 0.5) * step;
            sum += 4.0 / (1.0 + x * x);
        }
    } else {
        // 否则递归拆分为两个任务
        int iblk = nfinish - nstart;
        double sum1 = 0.0, sum2 = 0.0;

        #pragma omp task shared(sum1)
        sum1 = comp_pi(nstart, nfinish - iblk/2, step, min_blk);

        #pragma omp task shared(sum2)
        sum2 = comp_pi(nfinish - iblk/2, nfinish, step, min_blk);

        #pragma omp taskwait
        sum = sum1 + sum2;
    }
    return sum;
}
```

**主函数：**

```cpp
int main() {
    const int nthreads = 4;
    omp_set_num_threads(nthreads);
    static int* ntask;  // 记录各线程执行任务次数
    ntask = new int[nthreads]();

    const int n = 1024;        // 总迭代次数
    const int min_blk = 256;   // 最小任务粒度
    double step = 1.0 / (double)n;

    double sum = 0.0;
    #pragma omp parallel
    {
        #pragma omp single
        sum = comp_pi(0, n, step, min_blk);
    }

    double pi = step * sum;
    std::cout << "pi = " << pi << std::endl;

    delete[] ntask;
    return 0;
}
```

> **设计要点：** `min_blk`（minimum block - 最小块）防止任务拆分过细导致调度开销超过计算收益。当子区间长度小于 `min_blk` 时停止拆分，转为串行循环。

---

## 补充：sections 构造（静态任务划分）

`#pragma omp sections`（**sections** - 分段构造，对**非循环任务**进行静态多线程并行）适用于将固定数量的独立代码块分配给不同线程。

**支持子句：** `private`, `firstprivate`, `lastprivate`, `reduction`, `nowait`

```cpp
#include <iostream>
#include <omp.h>

int main() {
    #pragma omp parallel sections
    {
        #pragma omp section
        {
            std::cout << "Hello from section 1, thread "
                      << omp_get_thread_num() << std::endl;
        }

        #pragma omp section
        {
            std::cout << "Hello from section 2, thread "
                      << omp_get_thread_num() << std::endl;
        }

        #pragma omp section
        {
            std::cout << "Hello from section 3, thread "
                      << omp_get_thread_num() << std::endl;
        }
    }
    return 0;
}
```

> **特性：** 每个 `section` 仅由一个线程执行，类似于并行的 `switch-case`。输出顺序因线程调度而异。与 `task` 的动态分配不同，`sections` 在编译时静态划分工作。

---

## 对比与总结

### single vs. task vs. sections

| 特性 | `single` | `task` | `sections` |
| :--- | :--- | :--- | :--- |
| **工作划分方式** | 一个线程执行 | 动态分配给空闲线程 | 静态分配给线程 |
| **适用场景** | 初始化 / 收尾 / I/O | 不规则问题 / 递归 / 链表 | 固定数量的独立代码块 |
| **负载均衡** | 无（仅一线程工作） | **动态负载均衡** | 静态，可能不均衡 |
| **隐式同步** | 有（可用 `nowait` 取消） | 无（需显式 `taskwait`） | 有（可用 `nowait` 取消） |
| **引入版本** | OpenMP 1.0 | **OpenMP 3.0** | OpenMP 1.0 |

### 数据属性子句速查

| 子句 | 英文释义 | 初始化 | 并行区结束后值 |
| :--- | :--- | :--- | :--- |
| `private` | **private** - 私有 | 未初始化 | **丢失**（不可访问） |
| `firstprivate` | **first private** - 首私有 | 用进入前变量值初始化 | 丢失 |
| `lastprivate` | **last private** - 末私有 | 未初始化 | 最后一次迭代值带回 |
| `shared` | **shared** - 共享 | 共享同一地址 | 保留（所有修改直接生效） |
| `reduction` | **reduction** - 归约 | 编译器自动初始化 | 合并各线程结果后保留 |

---

## 本节总结

- `#pragma omp task` 是 OpenMP 3.0 的核心扩展，为**不规则问题**（链表、树、图遍历）提供了**动态并行**能力，弥补了 `#pragma omp for` 只能处理规则循环的局限。
- `task` 与 `single` 配合使用时，`single` 确保仅一个线程启动任务生成，其他线程作为**工作窃取**（work-stealing）的执行者，避免重复计算。
- `#pragma omp taskwait` 是控制任务依赖的关键，确保子任务完成后才继续执行后续代码。
- `sections` 构造适用于**静态**的非循环任务划分，与 `task` 的动态特性形成互补。

---

## 思考题

1. **为什么 `task` 比手动将链表转为数组再用 `omp for` 更优？** 从代码简洁性、内存开销和遍历次数角度分析。
2. **在计算 π 的 task 并行版中，若去掉 `taskwait` 会发生什么？** 从递归求和的数据依赖角度解释。
3. **`task` 构造中的 `shared(sum1)` 能否改为 `private(sum1)`？** 分析 `sum1` 在父任务和子任务间的可见性需求。
4. **`single` 和 `master` 有何区别？** （提示：`master` 始终由主线程执行，且无隐式 barrier）
5. **为什么 `task` 能实现自动负载均衡，而 `sections` 不行？** 从任务调度机制角度说明。

---

> **附录：常用库函数与环境变量**
>
> - `omp_get_thread_num()`（**get thread number** - 获取当前线程编号，0 开始）
> - `omp_get_num_threads()`（**get number of threads** - 获取当前并行区域线程总数）
> - `omp_set_num_threads(n)`（**set number of threads** - 设置后续并行区域线程数）
> - `OMP_NUM_THREADS`（**OpenMP Number of Threads** - 环境变量，设置默认线程数）
> - `OMP_SCHEDULE`（**OpenMP Schedule** - 环境变量，设置默认循环调度策略）
