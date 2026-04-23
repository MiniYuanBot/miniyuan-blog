---
title: '解线性方程组的迭代法（Jacobi，Gauss-Seidal，松弛法，收敛性）'
excerpt: '26 春 计算方法 L05'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'April 01 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 简介

对于大规模稀疏线性方程组 $\mathbf{A}\mathbf{x}=\mathbf{b}$，直接法（如 LU 分解）存在以下局限：

- **存储问题**：即使 $\mathbf{A}$ 是稀疏的，其 LU 分解因子 $\mathbf{L}$ 和 $\mathbf{U}$ 也可能变得稠密。
- **计算复杂度**：直接法通常是 $O(n^3)$，对于大规模问题难以承受。

**迭代法基本思想**：

通过构造**迭代格式**：
$$
\mathbf{x}^{(k+1)} = \mathbf{M}\mathbf{x}^{(k)} + \mathbf{g}
$$
从一个初始猜测 $\mathbf{x}^{(0)}$ 出发，产生近似解序列 $\{\mathbf{x}^{(k)}\}$，期望其收敛到真实解 $\mathbf{x}^*$。

**注**：迭代法特别适合**大规模稀疏矩阵**，因为每次迭代只进行矩阵-向量乘法，可以充分利用稀疏性。

---

## Jacobi 迭代法

### Jacobi 迭代格式

将系数矩阵 $\mathbf{A}$ 分解为：
$$
\mathbf{A} = \mathbf{D} - (\mathbf{D} - \mathbf{A}) = \mathbf{D} - \mathbf{B}
$$
其中 $\mathbf{D} = \text{diag}(a_{11}, a_{22}, \dots, a_{nn})$ 为对角矩阵，$\mathbf{B} = \mathbf{D} - \mathbf{A}$。

原方程 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 改写为：
$$
\mathbf{D}\mathbf{x} = \mathbf{B}\mathbf{x} + \mathbf{b}
$$

若 $a_{ii} \neq 0$（对所有 $i$），则 $\mathbf{D}$ 可逆，得到 **Jacobi 迭代格式**：
$$
\mathbf{x}^{(k+1)}
= \mathbf{D}^{-1}(\mathbf{D}-\mathbf{A})\mathbf{x}^{(k)} + \mathbf{D}^{-1}\mathbf{b} = \mathbf{B}\mathbf{x}^{(k)} + \mathbf{g}
$$

**分量形式**：
$$
x_i^{(k+1)} = \frac{1}{a_{ii}}\left(b_i - \sum_{j=1, j\neq i}^{n} a_{ij}x_j^{(k)}\right), \quad i=1,2,\dots,n
$$

**注**：Jacobi迭代的本质是**同步更新**——每次迭代使用上一步的所有分量值 $x_j^{(k)}$ 来计算当前步的所有分量 $x_i^{(k+1)}$。

### Jacobi 算法流程

**输入**：$\mathbf{A} \in \mathbb{R}^{n\times n}$，初始值 $\mathbf{x}^{(0)}$，右端项 $\mathbf{b}$，最大迭代次数 $\text{N}$，误差阈值 $\text{EPS}$

**输出**：近似解 $\mathbf{x}$

```python
x_new = np.zeros(n, dtype=float) # 初始值
x_old = np.zeros(n, dtype=float)

k = 0
while k < N:
    k += 1

    for i in range(n):
        x_new[i] = b[i]

        for j in range(n):
            if j != i: # 为减少判断开销可以分开循环
                x_new[i] -= A[i, j] * x_old[j]

        x_new[i] /= A[i, i]

    if np.linalg.norm(x_new - x_old, 2) < EPS:
        break

    x_old = x_new.copy() # 保存旧值
```

**注**：
必须先用临时变量保存 $\mathbf{x}^{(k)}$ 的所有分量，避免混用新旧值。不过可以交替使用两个数列作为新旧值，只需交换引用而不需要复制数组，减少内存分配和复制的开销。

---

## Gauss-Seidel 迭代法

### Gauss-Seidel 迭代格式

观察 Jacobi 方法，在计算 $x_i^{(k+1)}$ 时，$x_1^{(k+1)}, \dots, x_{i-1}^{(k+1)}$ 已经计算出来，但 Jacobi 仍然使用旧值 $x_j^{(k)}$（$j<i$）。

**Gauss-Seidel 思想**：**立即使用**最新计算出的分量值（异步更新）。

将 $\mathbf{A}$ 分裂为：
$$
\mathbf{A} = \mathbf{D} - \mathbf{L} - \mathbf{U}
$$
其中 $\mathbf{L}$ 为严格下三角矩阵（对角线为零），$\mathbf{U}$ 为严格上三角矩阵。

迭代格式变为：
$$
(\mathbf{D} - \mathbf{L})\mathbf{x}^{(k+1)} = \mathbf{U}\mathbf{x}^{(k)} + \mathbf{b}
$$

即 **Gauss-Seidal 迭代格式**：
$$
\mathbf{x}^{(k+1)} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}\mathbf{x}^{(k)} + (\mathbf{D}-\mathbf{L})^{-1}\mathbf{b}
$$

**分量形式**：
$$
x_i^{(k+1)}
= \frac{1}{a_{ii}}\left(b_i - \sum_{j=1}^{i-1} a_{ij}x_j^{(k+1)} - \sum_{j=i+1}^{n} a_{ij}x_j^{(k)}\right), \quad i=1,2,\dots,n
$$

**注**：与 Jacobi 的关键区别在于求和项 $\sum_{j=1}^{i-1}$ 使用的是**当前步已更新**的 $x_j^{(k+1)}$。

### Gauss-Seidel 算法流程

**输入**：$\mathbf{A} \in \mathbb{R}^{n\times n}$，初始值 $\mathbf{x}^{(0)}$，右端项 $\mathbf{b}$，最大迭代次数 $\text{N}$，误差阈值 $\text{EPS}$

**输出**：近似解 $\mathbf{x}$

```python
x_new = np.zeros(n, dtype=float) # 初始值
x_old = np.zeros(n, dtype=float)

k = 0
while k < N:
    k += 1

    for i in range(n):
        x_new[i] = b[i]
        
        for j in range(i): # 使用新值
            x_new[i] -= A[i, j] * x_new[j]

        for j in range(i + 1, n): # 使用旧值
            x_new[i] -= A[i, j] * x_old[j] # 也可以写成 x_new
        
        x_new[i] /= A[i, i]

    if np.linalg.norm(x_new - x_old, 2) < EPS:
        break

    x_old = x_new.copy() # 保存旧值
```

**注**：

- Gauss-Seidel 通常比 Jacobi 收敛更快。
- 但 Jacobi 是同步的，每个分量的更新只依赖上一轮迭代的旧值，可以进行**并行**计算，而 Gauss-Seidel 是串行依赖的，每个分量的更新依赖同一轮迭代的新值，所以只能**串行**。
- 计算时实际上可以直接都使用 `x_new`，但是为了判断收敛不得不保存 `x_old`，所以使用 `x_old` 更加清晰。

---

## 松弛法

松弛法（Successive Over-Relaxation, **SOR**）。

### SOR 迭代格式

Gauss-Seidel 的更新可看作在当前解 $\mathbf{x}^{(k)}$ 上加上一个修正量：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \Delta\mathbf{x}
$$
其中：
$$
\quad \Delta\mathbf{x} = \mathbf{D}^{-1}[\mathbf{L}\mathbf{x}^{(k+1)} + \mathbf{U}\mathbf{x}^{(k)} + \mathbf{b} - \mathbf{D}\mathbf{x}^{(k)}]
$$

**松弛法思想**：引入松弛因子 $\omega$ 对修正量进行加权：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \omega \Delta\mathbf{x}
$$

整理得 **SOR 迭代格式**：
$$
(\mathbf{D} - \omega\mathbf{L})\mathbf{x}^{(k+1)} = [(1-\omega)\mathbf{D} + \omega\mathbf{U}]\mathbf{x}^{(k)} + \omega\mathbf{b}
$$

即：
$$
\mathbf{x}^{(k+1)} = (\mathbf{D}-\omega\mathbf{L})^{-1}[(1-\omega)\mathbf{D} + \omega\mathbf{U}]\mathbf{x}^{(k)} + \omega(\mathbf{D}-\omega\mathbf{L})^{-1}\mathbf{b}
$$

**分量形式**：
$$
x_i^{(k+1)}
= (1-\omega)x_i^{(k)} + \frac{\omega}{a_{ii}}
\left(b_i
- \sum_{j=1}^{i-1} a_{ij}x_j^{(k+1)}
- \sum_{j=i+1}^{n} a_{ij}x_j^{(k)}
\right)
$$

**注**：

- $\omega = 1$：退化为 Gauss-Seidel 方法
- $0 < \omega < 1$：**低松弛法**（亚松弛法），常用于非正定系统或震荡情况
- $1 < \omega < 2$：**超松弛法**，用于加速收敛
- $\omega \geq 2$ 或 $\omega \leq 0$：通常不收敛（对正定矩阵）

### SOR 算法流程

**输入**：增加松弛因子 $\text{omega}$

**输出**：近似解 $\mathbf{x}$

```python
x_new = np.zeros(n, dtype=float) # 初始值
x_old = np.zeros(n, dtype=float)

k = 0
while k < N:
    k += 1

    for i in range(n):
        # 先计算 delta x
        x_new[i] = b[i]
        
        for j in range(i): # 使用新值
            x_new[i] -= A[i, j] * x_new[j]

        for j in range(i + 1, n): # 使用旧值
            x_new[i] -= A[i, j] * x_old[j] # 也可以写成 x_new
        
        x_new[i] = x_new[i] * omega / A[i, i]

        # 再加上 x^(k)
        x_new[i] = x_new[i] + (1 - omega) * x_old[i]
    
    if np.linalg.norm(x_new - x_old, 2) < EPS:
        break
    
    x_old = x_new.copy() # 保存旧值
```

**注**：最优松弛因子 $\omega_{\text{opt}}$ 通常介于 0.9-1.5 之间，具体值与矩阵谱性质有关。对于特殊矩阵（如相容次序矩阵），有理论公式计算 $\omega_{\text{opt}}$。

---

## 迭代法的收敛性

### 统一迭代格式

三种方法可统一写成：
$$
\mathbf{x}^{(k+1)} = \mathbf{M}\mathbf{x}^{(k)} + \mathbf{g}
$$

| 方法 | 迭代矩阵 $\mathbf{M}$ | 向量 $\mathbf{g}$ |
| :--- | :--- | :--- |
| **Jacobi** | $\mathbf{M}_J = \mathbf{D}^{-1}(\mathbf{D}-\mathbf{A}) = \mathbf{I} - \mathbf{D}^{-1}\mathbf{A}$ | $\mathbf{g}_J = \mathbf{D}^{-1}\mathbf{b}$ |
| **Gauss-Seidel** | $\mathbf{M}_{GS} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}$ | $\mathbf{g}_{GS} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{b}$ |
| **SOR** | $\mathbf{M}_{SOR} = (\mathbf{D}-\omega\mathbf{L})^{-1}[(1-\omega)\mathbf{D} + \omega\mathbf{U}]$ | $\mathbf{g}_{SOR} = \omega(\mathbf{D}-\omega\mathbf{L})^{-1}\mathbf{b}$ |

### 两个引理

**定义（谱半径）**：矩阵 $\mathbf{A} \in \mathbb{C}^{n \times n}$ 的特征值
$\lambda_1, \lambda_2, \cdots, \lambda_n$，则其谱半径为
$$
\rho(\mathbf{A}) = \max_{1 \le i \le n} \vert \lambda_i \vert
$$

先证明两个引理：

**引理 1（范数逼近引理）**：
对任意 $\varepsilon > 0$，存在矩阵范数 $\|\cdot\|_\varepsilon$ 使得
$$
\rho(\mathbf{A}) \leq \|\mathbf{A}\|_\varepsilon \leq \rho(\mathbf{A}) + \varepsilon
$$

**引理 1 的证明**：

设 $\mathbf{A}$ 的 Jordan 标准形为 $\mathbf{J} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$，其中：
$$
\mathbf{J} = \begin{pmatrix} \mathbf{J}_1 & & \\ & \ddots & \\ & & \mathbf{J}_m \end{pmatrix}
$$

每个 Jordan 块 $\mathbf{J}_i$ 对应特征值 $\lambda_i$：
$$
\mathbf{J}_i = \lambda_i \mathbf{I}_{n_i} + \mathbf{N}_{n_i}
$$
其中 $\mathbf{N}_{n_i}$ 是 $n_i \times n_i$ 的严格上三角幂零矩阵，只有次对角线为 1。

对每个 Jordan 块，定义对角矩阵：
$$
\mathbf{D}_{n_i}(\varepsilon) = \text{diag}(1, \varepsilon, \varepsilon^2, \ldots, \varepsilon^{n_i-1})
$$

计算 Jordan 块的相似变换：
$$
\mathbf{D}^{-1}\mathbf{J}_i\mathbf{D}
=
\begin{pmatrix}
\lambda_i & \varepsilon & & \\ & \lambda_i & \ddots & \\ & & \ddots & \varepsilon \\ & & & \lambda_i
\end{pmatrix}
= \lambda_i \mathbf{I} + \varepsilon\mathbf{N}_{n_i}
$$

取 $\mathbf{D}(\varepsilon) = \text{diag}(\mathbf{D}_{n_1}(\varepsilon), \ldots, \mathbf{D}_{n_m}(\varepsilon))$，令整体相似变换后矩阵：
$$
\mathbf{A}(\varepsilon)
= \mathbf{D}^{-1}(\varepsilon)\mathbf{J}\mathbf{D}(\varepsilon)
= \mathbf{D}^{-1}(\varepsilon)\mathbf{P}^{-1}\mathbf{A}\mathbf{P}\mathbf{D}(\varepsilon)
$$

计算 $\mathbf{A}(\varepsilon)$ 的行和范数 $\|\cdot\|_\infty$：
$$
\|\mathbf{A}(\varepsilon)\|_\infty
= \max_i \sum_j |[\mathbf{A}(\varepsilon)]_{ij}|
= \max_i |\lambda_i| + \varepsilon
= \rho(\mathbf{A}) + \varepsilon
$$

接下来利用上一节课的补充内容：
[向量范数的可逆变换](/note/computing-method/04-direct-method-for-linear-system-3/#向量范数的可逆变换)
以及 [矩阵范数的相似变换](/note/computing-method/04-direct-method-for-linear-system-3/#矩阵范数的相似变换)，
构造一个诱导范数，使其值恰好等于**相似变换后**矩阵的行和范数。

定义向量范数：
$$
\|\mathbf{x}\|_\varepsilon := \|(\mathbf{P}\mathbf{D}(\varepsilon))^{-1}\mathbf{x}\|_\infty
$$

对应的诱导范数：
$$
\|\mathbf{A}\|_\varepsilon = \max_{\|\mathbf{x}\|_\varepsilon=1} \|\mathbf{A}\mathbf{x}\|_\varepsilon
$$

则：
$$
\|\mathbf{A}\|_\varepsilon
= \|(\mathbf{P}\mathbf{D})^{-1}\mathbf{A}(\mathbf{P}\mathbf{D})\|_\infty
= \|\mathbf{A}(\varepsilon)\|_\infty
= \rho(\mathbf{A}) + \varepsilon
$$

从而完成证明（构造）。当然左侧的不等式也可以由[上节课的有关内容](/note/computing-method/04-direct-method-for-linear-system-3/#谱半径)得到。

**注**：由于矩阵范数的选取依赖于 $\varepsilon$，故不能令 $\varepsilon \to 0$，也即不一定存在一个范数使得 $\|\mathbf{A}\| = \rho(\mathbf{A})$

**引理 2（幂零与谱半径的关系）**：

设 $\mathbf{A} \in \mathbb{C}^{n \times n}$，则：
$$
\lim_{k\to\infty} \mathbf{A}^k = \mathbf{0} \iff \rho(\mathbf{A}) < 1
$$
其中 $\mathbf{A}^k \to \mathbf{0}$ 等价于 $\|\mathbf{A}^k\| \to 0$，$\|\cdot\|$ 是某一（由范数等价性也即任意）矩阵范数。

**引理 2 的证明**：

$\Leftarrow$ 方向：

由 **引理 1（范数逼近引理）**：对任意 $\varepsilon > 0$，存在矩阵范数 $\|\cdot\|$，使得
$$
\|\mathbf{A}\| \leq \rho(\mathbf{A}) + \varepsilon
$$

取 $\varepsilon = \frac{1 - \rho(\mathbf{A})}{2} > 0$，则

$$
\|\mathbf{A}\| \leq \rho(\mathbf{A}) + \frac{1 - \rho(\mathbf{A})}{2} = \frac{1 + \rho(\mathbf{A})}{2} \equiv q < 1
$$

结合矩阵范数的**相容性（次可乘性）** 得：

$$
\|\mathbf{A}^k\| \leq \|\mathbf{A}\|^k \leq q^k
$$

故 $\lim_{k \to \infty} \|\mathbf{A}^k\| = 0$。

$\Rightarrow$ 方向：用**反证法**。

假设 $\rho(\mathbf{A}) \geq 1$，则存在特征值 $\lambda$ 满足 $|\lambda| \geq 1$。
设 $\mathbf{v} \neq \mathbf{0}$ 为对应的特征向量，$\mathbf{A} \mathbf{v} = \lambda \mathbf{v}$，则有：
$$
\mathbf{A}^k \mathbf{v} = \lambda^k \mathbf{v}
$$

若 $\mathbf{A}^k \to \mathbf{0}$，则对任意向量 $\mathbf{x}$ 有 $\mathbf{A}^k \mathbf{x} \to \mathbf{0}$。特别地，取 $\mathbf{x} = \mathbf{v}$：

$$
\lim_{k \to \infty} \mathbf{A}^k \mathbf{v} = \lim_{k \to \infty} \lambda^k \mathbf{v} = \mathbf{0}
$$

由于 $\mathbf{v} \neq \mathbf{0}$，这要求 $\lim_{k \to \infty} \lambda^k = 0$，与 $|\lambda| \geq 1$ 矛盾！

**注**：引理 2 的 $\Leftarrow$ 方向还可以直接用 Jordan 分解与二项式展开进行剥蒜证明。

### 收敛的充要条件

**基本收敛定理**：

迭代格式对任意初始向量 $\mathbf{x}^{(0)}$ 都收敛的**充分必要条件**是：
$$
\rho(\mathbf{M}) < 1
$$

**证明**：

- 有如下误差传播关系：
    $$
    \mathbf{e}^{(k)} = \mathbf{x}^{(k)} - \mathbf{x}^* = \mathbf{M}^k \mathbf{e}^{(0)}
    $$

    这是因为
    $$
    \begin{aligned}
    \mathbf{e}^{(k+1)}
    &= \mathbf{x}^{(k+1)} - \mathbf{x}^* \\
    &= \mathbf{M} \mathbf{x}^{(k)} + \mathbf{g} - \mathbf{M} \mathbf{x}^* - \mathbf{g} \\
    &= \mathbf{M} \mathbf{e}^{(k)}
    \end{aligned}
    $$
- 由引理 2 知
    $$
    \lim_{k\to\infty} \mathbf{M}^k = \mathbf{0} \iff \rho(\mathbf{M}) < 1
    $$
    从而完成证明。

### 收敛的充分条件

由于计算谱半径较困难，可以使用矩阵范数作为估计。

**定理**：若存在某个矩阵范数 $\|\cdot\|$ 使得
$$
\|\mathbf{M}\| < 1
$$
则迭代法收敛。

**证明**：

由 $\rho(\mathbf{M}) \le \|\mathbf{M}\|$ 对任意矩阵范数成立易知。

### 收敛速率分析

**定义（平均收敛速率）**：
对任意矩阵范数 $\|\cdot\|$，定义对应的平均收敛速率：
$$
R_k(\mathbf{M}) = -\frac{1}{k}\ln\|\mathbf{M}^k\|
$$

**定义（渐进收敛速率）**：
对格式矩阵 $\mathbf{M}$，定义其渐进收敛速率：
$$
R_\infty(\mathbf{M}) = \lim_{k\to\infty} R_k(\mathbf{M}) = -\ln\rho(\mathbf{M})
$$

**证明**：

即证如下 **Gelfand 谱半径公式**：
$$
\lim_{k\to\infty} \|\mathbf{M}^k\|^{1/k} = \rho(\mathbf{M})
$$

- 上界：

    对任意矩阵范数 $\|\cdot\|$，有谱半径不等式：
    $$
    \rho(\mathbf{M}) \leq \|\mathbf{M}\|
    $$

    对 $\mathbf{M}^k$ 应用此不等式，并结合 $\rho(\mathbf{M}^k) = \rho(\mathbf{M})^k$ 得：
    $$
    \rho(\mathbf{M}) \leq \|\mathbf{M}^k\|^{1/k}
    $$

    令 $k \to \infty$，得：
    $$
    \rho(\mathbf{M}) \leq \liminf_{k\to\infty} \|\mathbf{M}^k\|^{1/k}
    $$

- 下界：

    利用**引理 1（范数逼近引理）**：对任意 $\varepsilon > 0$，存在矩阵范数 $\|\cdot\|_\varepsilon$ 使得：
    $$
    \|\mathbf{M}\|_\varepsilon \leq \rho(\mathbf{M}) + \varepsilon
    $$

    于是：
    $$
    \|\mathbf{M}^k\|_\varepsilon^{1/k}
    \leq \left(\|\mathbf{M}\|_\varepsilon^k\right)^{1/k}
    = \|\mathbf{M}\|_\varepsilon
    \leq \rho(\mathbf{M}) + \varepsilon
    $$

    由于所有矩阵范数等价，因此存在常数 $C > 0$ 使得 $\|\mathbf{A}\| \leq C\|\mathbf{A}\|_\varepsilon$，也即：
    $$
    \|\mathbf{M}^k\|^{1/k} \leq C^{1/k} \|\mathbf{M}^k\|_\varepsilon^{1/k} \leq C^{1/k}(\rho(\mathbf{M}) + \varepsilon)
    $$

    令 $k \to \infty$ 即得：
    $$
    \limsup_{k\to\infty} \|\mathbf{M}^k\|^{1/k} \leq \rho(\mathbf{M}) + \varepsilon
    $$

    由 $\varepsilon$ 的任意性，令 $\varepsilon \to 0^+$：
    $$
    \limsup_{k\to\infty} \|\mathbf{M}^k\|^{1/k} \leq \rho(\mathbf{M})
    $$

证毕。

**注**：

- 误差显然是**指数形式**收敛的。我们估计的是 $\exp\{-\mathbf{R(\mathbf{M}) k}\}$ 形式。
- 渐进收敛速率由谱半径唯一确定，也即渐进收敛形式为 $\rho(\mathbf{M})^k$。
- 由此可见**谱半径越小，收敛越快**。

### 终止条件估计

**利用谱半径估计**：

为达到误差 $\|\mathbf{e}^{(k)}\| \leq \varepsilon$，所需迭代次数约为（假设初始误差为 1）：
$$
k \approx \frac{\ln\varepsilon}{\ln\rho(\mathbf{M})}
$$

**利用矩阵范数估计**：

若某一矩阵范数下 $\|\mathbf{M}\| = q < 1$，则：
$$
\|\mathbf{x}^{(k)} - \mathbf{x}^*\|
\leq \frac{q}{1-q}\|\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)}\|
\leq \frac{q^k}{1-q}\|\mathbf{x}^{(1)} - \mathbf{x}^{(0)}\|
$$
从而当 $\|\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)}\| < \frac{1-q}{q}\varepsilon$ 时，
可保证 $\|\mathbf{x}^{(k)} - \mathbf{x}^*\| < \varepsilon$。

**证明**：

$$
\mathbf{x}^{(k)} - \mathbf{x}^*
= \mathbf{M}(\mathbf{x}^{(k-1)} - \mathbf{x}^*)
= \mathbf{M}(\mathbf{x}^{(k-1)} - \mathbf{x}^{(k)} + \mathbf{x}^{(k)} - \mathbf{x}^*)
$$

从而由三角不等式：
$$
\|\mathbf{x}^{(k)} - \mathbf{x}^*\|
\le q \|\mathbf{x}^{(k-1)} - \mathbf{x}^{(k)}\| + q \|\mathbf{x}^{(k)} - \mathbf{x}^*\|
$$
化简即证。

## 特殊矩阵的收敛性

### 相关定义

**定义（对角占优矩阵）**：
矩阵 $\mathbf{A}$ 称为**对角占优**，若：
$$
|a_{ii}| \geq \sum_{j\neq i}|a_{ij}|, \quad \forall i=1,\dots,n
$$
且至少对一个 $i$ 严格不等式成立。若对所有 $i$ 都严格成立，则称为**严格对角占优**。

**定义（不可约矩阵）**：
矩阵 $\mathbf{A}\in\mathbb{R}^{n\times n}$ 称为**可约的**，若存在排列矩阵 $\mathbf{P}$ 使得：
$$
\mathbf{P}^{\mathrm{T}}\mathbf{A}\mathbf{P}=\begin{bmatrix}\mathbf{A}_{11}&\mathbf{A}_{12}\\ \mathbf{0}&\mathbf{A}_{22}\end{bmatrix}
$$
其中 $\mathbf{A}_{11}, \mathbf{A}_{22}$ 为方阵。否则称 $\mathbf{A}$ 为**不可约的**。

**不可约矩阵等价定义**：
存在指标集的非空划分 $\mathcal{S}\cup\mathcal{T}=\{1,\dots,n\}$，使得 $a_{ij}=0$ 对所有 $i\in\mathcal{S}, j\in\mathcal{T}$ 成立。

**证明**：这是显然的。

**标准分裂记号**：
$$
\mathbf{A} = \mathbf{D} + \mathbf{L} + \mathbf{U}
$$
其中 $\mathbf{D}$ 为对角部分，$\mathbf{L}$ 为严格下三角部分（$i>j$ 时 $l_{ij}=a_{ij}$），$\mathbf{U}$ 为严格上三角部分（$i<j$ 时 $u_{ij}=a_{ij}$）。

对应迭代矩阵：

- **Jacobi**：$\mathbf{M}_J = -\mathbf{D}^{-1}(\mathbf{L}+\mathbf{U})$
- **Gauss-Seidel**：$\mathbf{M}_{GS} = -(\mathbf{D}+\mathbf{L})^{-1}\mathbf{U}$

**注**：这类矩阵常见于离散偏微分方程（如有限差分、有限元）

### 严格对角占优矩阵的收敛性

若迭代格式矩阵 $\mathbf{A}$ 严格对角占优，则

- $\mathbf{A}$ 非奇异
- Jacobi 迭代法对任意初始向量收敛
- Gauss-Seidel 迭代法对任意初始向量收敛

#### 严格对角占优矩阵非奇异性证明

反设 $\mathbf{A}$ 奇异，则存在非零向量 $\mathbf{x}\in\mathbb{R}^n$ 使得 $\mathbf{A}\mathbf{x} = \mathbf{0}$。

设 $|\mathbf{x}_i| = \max_{1\leq j\leq n}|\mathbf{x}_j| > 0$，考虑第 $i$ 个方程：
$$
\sum_{j=1}^n a_{ij}\mathbf{x}_j = 0 \implies a_{ii}\mathbf{x}_i = -\sum_{j\neq i}a_{ij}\mathbf{x}_j
$$

取绝对值并利用三角不等式：
$$
|a_{ii}||\mathbf{x}_i|
= \left|\sum_{j\neq i}a_{ij}\mathbf{x}_j\right|
\leq \sum_{j\neq i}|a_{ij}||\mathbf{x}_j|
\leq \sum_{j\neq i}|a_{ij}||\mathbf{x}_i|
$$

两边除以 $|\mathbf{x}_i| > 0$ 得：
$$
|a_{ii}| \leq \sum_{j\neq i}|a_{ij}|
$$

这与 $\mathbf{A}$ 严格对角占优矛盾！

#### 严格对角占优矩阵 Jacobi 迭代收敛性证明

迭代矩阵 $\mathbf{M}_J = -\mathbf{D}^{-1}(\mathbf{L}+\mathbf{U})$，其元素为：
$$
(\mathbf{M}_J)_{ij} = \begin{cases} 0, & i=j \\ -\frac{a_{ij}}{a_{ii}}, & i\neq j \end{cases}
$$

计算行和范数：
$$
\|\mathbf{M}_J\|_\infty
= \max_{1\leq i\leq n}\sum_{j\neq i}\left|\frac{a_{ij}}{a_{ii}}\right|
= \max_{1\leq i\leq n}\frac{1}{|a_{ii}|}\sum_{j\neq i}|a_{ij}|
$$

由严格对角占优条件 $|a_{ii}| > \sum_{j\neq i}|a_{ij}|$，得：
$$
\|\mathbf{M}_J\|_\infty < 1
$$

因此 Jacobi 迭代收敛。

#### 严格对角占优矩阵 Gauss-Seidel 迭代收敛性证明

反证法证明 $\rho(\mathbf{M}_{GS}) < 1$。反设 $\lambda$ 为 $\mathbf{M}_{GS}$ 的特征值且 $|\lambda| \geq 1$。特征方程为：
$$
\det(\lambda\mathbf{I} - \mathbf{M}_{GS}) = \det(\lambda\mathbf{I} + (\mathbf{D}+\mathbf{L})^{-1}\mathbf{U}) = 0
$$

等价于：
$$
\det(\lambda(\mathbf{D}+\mathbf{L}) + \mathbf{U}) = 0
$$

令 $\mathbf{B}(\lambda) = \lambda(\mathbf{D}+\mathbf{L}) + \mathbf{U}$，其元素为：
$$
b_{ij} = \begin{cases} \lambda a_{ii}, & i=j \\ \lambda a_{ij}, & i>j\\ a_{ij}, & i<j \end{cases}
$$

容易发现 $\mathbf{B}(\lambda)$ 仍是严格对角占优矩阵，故其**非奇异**，与 $\det(\mathbf{B}(\lambda))=0$ 矛盾！

---

### 不可约对角占优矩阵的收敛性

若迭代格式矩阵 $\mathbf{A}$ 不可约对角占优，则

- $\mathbf{A}$ 非奇异
- Jacobi 迭代法对任意初始向量收敛
- Gauss-Seidel 迭代法对任意初始向量收敛

#### 不可约对角占优矩阵非奇异性证明

反设 $\mathbf{A}$ 奇异，则存在非零向量 $\mathbf{x}$ 使 $\mathbf{A}\mathbf{x}=\mathbf{0}$。

设 $|\mathbf{x}_k| = \max_{1\leq j\leq n}|\mathbf{x}_j| > 0$，考虑第 $k$ 个方程：
$$
\sum_{j=1}^n a_{kj}\mathbf{x}_j = 0 \implies a_{kk}\mathbf{x}_k = -\sum_{j\neq k}a_{kj}\mathbf{x}_j
$$

从而：
$$
|a_{kk}||\mathbf{x}_k|
= \left|\sum_{j\neq k}a_{kj}\mathbf{x}_j\right|
\leq \sum_{j\neq k}|a_{kj}||\mathbf{x}_j|
\leq \sum_{j\neq k}|a_{kj}||\mathbf{x}_k|
$$

由对角占优 $|a_{kk}| \geq \sum_{j\neq k}|a_{kj}|$，上式等号成立，故
$|\mathbf{x}_j| = |\mathbf{x}_k|$ 对所有满足 $a_{kj}\neq 0$ 的 $j$ 成立。

令指标集 $\mathcal{S} = \{i : |\mathbf{x}_i| = |\mathbf{x}_k|\}$，也即所有最大指标。

从而若 $i\in\mathcal{S}$ 且 $a_{ij}\neq 0$，则可在前述推导中令 $k \rightarrow i$ 即得 $|\mathbf{x}_i| = |\mathbf{x}_j|$，也即 $j\in\mathcal{S}$。

若 $\mathcal{S}$ 不是全集，则 $\mathcal{S}$ 与其补集 $\mathcal{T}$ 满足 $a_{ij}=0$ 对所有 $i\in\mathcal{S}, j\in\mathcal{T}$ 成立，与不可约性矛盾！

若 $\mathcal{S}$ 是全集，则所有行必须满足等号，与 $|a_{kk}| \ge \sum_{j\neq k}|a_{kj}|$ 至少一个严格不等式矛盾！

#### 不可约对角占优矩阵 Jacobi 迭代收敛性证明

反证法证明 $\rho(\mathbf{M}_{J}) < 1$。反设 $\lambda$ 为 $\mathbf{M}_J$ 的特征值 且 $|\lambda| \geq 1$。则：
$$
\det(\lambda\mathbf{D} + \mathbf{L} + \mathbf{U}) = 0
$$

令 $\mathbf{C}(\lambda) = \lambda\mathbf{D} + \mathbf{L} + \mathbf{U}$，其元素为：
$$
c_{ij} =
\begin{cases}
\lambda a_{ii}, & i=j \\
a_{ij}, & i\neq j
\end{cases}
$$

容易发现 $\mathbf{C}(\lambda)$ 仍是不可约对角占优矩阵。故其**非奇异**，与 $\det(\mathbf{C}(\lambda))=0$ 矛盾！

#### 不可约对角占优矩阵 Gauss-Seidel 迭代收敛性证明

反证法证明 $\rho(\mathbf{M}_{GS}) < 1$。反设 $\lambda$ 为 $\mathbf{M}_{GS}$ 特征值且 $|\lambda| \geq 1$。则：
$$
\det(\lambda(\mathbf{D}+\mathbf{L}) + \mathbf{U}) = 0
$$

令 $\mathbf{B}(\lambda) = \lambda\mathbf{D} + \lambda\mathbf{L} + \mathbf{U}$。其元素为：
$$
b_{ij} =
\begin{cases}
\lambda a_{ii}, & i=j\\
\lambda a_{ij}, & i>j\\
a_{ij}, & i<j
\end{cases}
$$

容易发现 $\mathbf{B(\lambda)}$ 仍是不可约对角占优矩阵。故其**非奇异**，与 $\det(\mathbf{B(\lambda)})=0$ 矛盾！

---

## 方法对比与总结

| 特性 | Jacobi | Gauss-Seidel | SOR |
| :--- | :--- | :--- | :--- |
| **更新方式** | 同步（并行友好） | 异步（串行） | 异步（串行） |
| **存储需求** | 需存储两个向量 | 可原位存储 | 可原位存储 |
| **收敛速度** | 慢 | 中等 | 可调（可能最快） |
| **适用场景** | 并行计算 | 通用 | 已知近似最优 $\omega$ |
