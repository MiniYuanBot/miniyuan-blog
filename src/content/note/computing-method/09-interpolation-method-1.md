---
title: '插值法（Lagrange 插值，Newton 插值）'
excerpt: '26 春 计算方法 L09'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '插值法'
pubDate: 'May 09 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 插值法概述

### 核心思想

**插值**（Interpolation）就是在给定有限个点的函数值的情况下，寻找一个解析形式的**插值函数** $\varphi(x)$，近似地代替原函数 $f(x)$。
其中插值函数一般是（分段）多项式函数。

### 代数插值问题的形式化定义

给定 $n+1$ 个点上的函数表：
$$
\begin{array}{c|ccccc}
x & x_0 & x_1 & \cdots & x_n \\ \hline
y & y_0 & y_1 & \cdots & y_n
\end{array}
$$

要构造插值多项式 $\varphi_n(x)$，满足：

1. $\varphi_n(x)$ 是次数不超过 $n$ 的多项式；
2. $\varphi_n(x_j) = f(x_j) = y_j$，$j = 0, 1, \cdots, n$。

### 插值多项式的存在唯一性

将 $\varphi_n(x) = a_0 + a_1 x + \cdots + a_n x^n$ 代入插值条件，得线性方程组，其系数行列式为 Vandermonde 行列式：
$$
\begin{vmatrix}
1 & x_0 & x_0^2 & \cdots & x_0^n \\
1 & x_1 & x_1^2 & \cdots & x_1^n \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & x_n & x_n^2 & \cdots & x_n^n
\end{vmatrix}
= \prod_{0 \le j < i \le n}(x_i - x_j)
$$

故当 $x_0, x_1, \cdots, x_n$ **两两不相等**时，Vandermonde 行列式不为零，方程组有唯一解，即插值多项式**存在且唯一**。

### Taylor 展开 vs 插值展开

插值余项与 Taylor 余项在结构上高度相似，区别仅在于**单点展开**还是**多点展开**：

| 对比维度 | Taylor 展开 | 插值展开 |
| :--- | :--- | :--- |
| **展开基点** | 单点 $x_0$ | 多点 $x_0, x_1, \dots, x_n$ |
| **余项/误差** | $R_n(x) = \dfrac{f^{(n+1)}(\xi)}{(n+1)!}(x-x_0)^{n+1}$ | $R_n(x) = \dfrac{f^{(n+1)}(\xi)}{(n+1)!}\displaystyle\prod_{i=0}^{n}(x-x_i)$ |
| **核心区别** | $(x-x_0)^{n+1}$ | $\omega_{n+1}(x) = \displaystyle\prod_{i=0}^{n}(x-x_i)$ |
| **所需信息** | 需要 $f$ 在 $x_0$ 处的各阶导数值 | 只需要 $f$ 在各节点处的函数值 |
| **近似性质** | **局部**近似：在 $x_0$ 邻域内精度高，远离则发散 | **全局**近似：在节点处精确相等，在区间内整体拟合 |

---

## 插值余项

### 定义

插值多项式 $\varphi_n(x)$ 与被插函数 $f(x)$ 之间的差：
$$
R_n(x) = f(x) - \varphi_n(x)
$$
称为**截断误差**，又称**插值余项**。

### 两种表示形式

对同一插值问题，余项有两种等价写法，分别对应 Lagrange 与 Newton 视角：

| 形式 | 表达式 | 所需条件 | 特点 |
| :--- | :--- | :--- | :--- |
| **Lagrange 型（导数形式）** | $R_n(x)=\dfrac{f^{(n+1)}(\xi)}{(n+1)!}\,\omega_{n+1}(x)$ | $f\in C^{n+1}[a,b]$ | 依赖光滑性，便于误差估计 |
| **Newton 型（差商形式）** | $R_n(x)=f[x_0,\dots,x_n,x]\,\omega_{n+1}(x)$ | 仅需函数值存在 | 无需可导假设 |

其中 $\omega_{n+1}(x)=\displaystyle\prod_{i=0}^{n}(x-x_i)$。

### 两种余项的等价性

将 [差商与导数的关系](#均差的性质) 定理应用于 Newton 余项中的 $n+1$ 阶差商 $f[x_0,\dots,x_n,x]$，得：
$$
f[x_0,\dots,x_n,x]=\frac{f^{(n+1)}(\xi)}{(n+1)!}
$$

代回 Newton 余项，即恢复 Lagrange 型余项：
$$
R_n(x)=\frac{f^{(n+1)}(\xi)}{(n+1)!}\cdot\omega_{n+1}(x)
$$

---

## Lagrange 插值

### 一般形式

对 $n+1$ 个点，**第 $i$ 个 Lagrange 插值基函数**为：
$$
l_i(x) = \prod_{\substack{j=0 \\ j \ne i}}^{n} \frac{x - x_j}{x_i - x_j}
$$

插值基函数次数恰好为 $n$，且满足：
$$
l_i(x_j) = \delta_{ij} = \begin{cases} 1, & i = j \\ 0, & i \ne j \end{cases}
$$

**$n$ 次 Lagrange 插值公式**：
$$
\varphi_n(x) = \sum_{i=0}^{n} y_i\, l_i(x)
$$

显然 $\varphi_n(x_j) = \sum_{i=0}^{n} y_i\, \delta_{ij} = y_j$。

### Lagrange 插值余项

设 $x_0, x_1, \cdots, x_n$ 是区间 $[a,b]$ 上的互异节点，$\varphi_n(x)$ 是过这组节点的 $n$ 次 Lagrange 插值多项式。
若 $f(x) \in C^{n+1}[a,b]$，则对 $[a,b]$ 内任意点 $x$，插值余项为：
$$
R_n(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\,\omega_{n+1}(x), \quad \xi \in \bigl(\min\{x_i,x\},\max\{x_i,x\}\bigr)
$$
其中 $\omega_{n+1}(x) = \displaystyle\prod_{i=0}^{n}(x - x_i)$，且不同的 $x$ 对应不同的 $\xi$。

**证明**：

选取一个非节点的求值点 $x$，构造辅助函数：
$$
\psi(t) = f(t) - \varphi_n(t) - K\,\omega_{n+1}(t)
$$
其中常数 $K$ 选取为
$$
K=\frac{R_n(x)}{\omega_{n+1}(x)}=\frac{f(x)-\varphi_n(x)}{\omega_{n+1}(x)}
$$
使得 $\psi(x)=0$。

**步骤 1**：由插值条件 $\varphi_n(x_i)=f(x_i)$ 及 $\omega_{n+1}(x_i)=0$，知
$$
\psi(x_i)=0,\qquad i=0,1,\dots,n
$$
又 $\psi(x)=0$，故 $\psi(t)$ 在 $\bigl[\min\{x_0,\dots,x_n,x\},\max\{x_0,\dots,x_n,x\}\bigr]$ 上至少有 $n+2$ 个互异零点。

**步骤 2**：反复应用 **Rolle 中值定理**：

- $\psi(t)$ 有 $n+2$ 个零点 $\Rightarrow$ $\psi'(t)$ 至少有 $n+1$ 个零点
- $\cdots$
- $\psi^{(n+1)}(t)$ 在区间内至少有 $1$ 个零点，记为 $\xi$，即 $\psi^{(n+1)}(\xi)=0$。

**步骤 3**：计算 $(n+1)$ 阶导数：

- $\varphi_n^{(n+1)}(t)\equiv 0$
- $\omega_{n+1}^{(n+1)}(t)\equiv (n+1)!$

代入 $\psi^{(n+1)}(\xi)=0$：
$$
0 = f^{(n+1)}(\xi) - K\cdot(n+1)!
\quad\Longrightarrow\quad
K=\frac{f^{(n+1)}(\xi)}{(n+1)!}
$$

因此
$$
R_n(x)=K\cdot\omega_{n+1}(x)=\frac{f^{(n+1)}(\xi)}{(n+1)!}\,\omega_{n+1}(x)
$$

**注**：对比 Taylor 余项 $R_n(x)=\dfrac{f^{(n+1)}(\xi)}{(n+1)!}(x-x_0)^{n+1}$，Lagrange 余项只是把单点展开的 $(x-x_0)^{n+1}$ 替换为多点展开的 $\omega_{n+1}(x)$。

### Lagrange 插值算法实现

#### Lagrange 插值单插值点

```python
def lagrange_single(x, y, xt):
    n = len(x) - 1
    phi = 0.0
    for i in range(n + 1):
        # 计算第 i 个基函数值
        li = 1.0  
        for j in range(n + 1):
            if j != i:
                li *= (xt - x[j]) / (x[i] - x[j])
        # 累加插值结果
        phi += y[i] * li
    return phi
```

复杂度为 $\mathcal{O}(n^2)$。

#### Lagrange 插值多插值点

利用 $\omega_{n+1}'(x_i) = \displaystyle\prod_{j \ne i}(x_i - x_j)$，将基函数改写为：

$$
\begin{aligned}
l_i(x) &= \frac{\omega_{n+1}(x)/(x - x_i)}{\omega_{n+1}'(x_i)} \\
\varphi_n(x) &= \omega_{n+1}(x) \sum_{i=0}^{n} \frac{y_i}{(x-x_i)\,\omega_{n+1}'(x_i)}
\end{aligned}
$$

```python
def lagrange_multi(x, y, xt_list):
    n = len(x) - 1
    # 预计算权重 1/omega'(x_i)，复杂度 O(n^2)
    wt = [1.0] * (n + 1)
    for i in range(n + 1):
        for j in range(n + 1):
            if j != i:
                wt[i] *= (x[i] - x[j])  # 先求积
    for i in range(n + 1):
        wt[i] = 1.0 / wt[i]

    results = []
    for xt in xt_list:
        # 若 xt 恰好等于某个 x_i，直接返回 y_i 避免出现 0/0
        flag = False
        for i in range(n + 1):
            if abs(xt - x[i]) < EPS:
                results.append(y[i])
                flag = True
                break
        if flag:
            continue
        # 计算 omega_{n+1}(xt)，复杂度 O(n)
        omega = 1.0
        for i in range(n + 1):
            omega *= (xt - x[i])
        # 累加，复杂度 O(n)
        phi = 0.0
        for i in range(n + 1):
            phi += y[i] * omega / (xt - x[i]) * wt[i]
        results.append(phi)
    return results
```

复杂度为 $\mathcal{O}(n^2 + mn)$，其中 $m$ 为插值点数。

#### Lagrange 插值向量化版

```python
import numpy as np

def lagrange_vectorized(x, y, xt_list):
    # 计算权重 wt[i] = 1 / prod_{j!=i}(x_i - x_j)
    diff = x[:, None] - x[None, :]          # (n+1, n+1) 差矩阵
    np.fill_diagonal(diff, 1.0)             # 对角线置 1 避免除零
    wt = 1.0 / np.prod(diff, axis=1)        # 每行连乘

    phi = np.zeros(len(xt))

    # 解决 0/0 问题
    hits = np.abs(xt[:, None] - x[None, :]) < EPS   # (m, n+1)
    hit_mask = np.any(hits, axis=1)                   # (m,)

    if np.any(hit_mask):
        hit_idx = np.argmax(hits, axis=1)               # 命中的节点下标
        phi[hit_mask] = y[hit_idx[hit_mask]]            # 直接返回对应 y 值

    # 计算其余位置
    xt_valid = xt[~hit_mask]
    if len(xt_valid) > 0:
        denom = xt_valid[:, None] - x[None, :]          # (m', n+1)
        omega = np.prod(denom, axis=1)                  # (m',)
        phi[~hit_mask] = omega * np.sum(y * wt / denom, axis=1)

    return phi
```

### 复杂度分析

| 指标 | 单插值点 | $m$ 插值点 |
| :--- | :---: | :---: |
| **时间复杂度** | $O(n^2)$ | $O(n^2 + mn)$ |
| **空间复杂度** | $O(1)$ | $O(n)$ |
| **新增一点时** | 全部基函数重算 $O(n^2)$ | 全部权重重算 $O(n^2)$ |

**注**：Lagrange 插值的主要缺点是：**每新增一个插值节点，所有基函数均需重新计算**，无法复用之前的结果。Newton 插值解决了这一问题。

---

## Newton 插值

### 均差（差商）的定义

**零阶均差**：
$$
f[x_i] = f(x_i)
$$

**一阶均差**：
$$
f[x_i, x_j] = \frac{f(x_j) - f(x_i)}{x_j - x_i}
$$

**$n$ 阶均差**：
$$
\begin{aligned}
f[x_0, x_1, \cdots, x_n]
&= \frac{f[x_1, x_2, \cdots, x_n] - f[x_0, x_1, \cdots, x_{n-1}]}{x_n - x_0} \\
&= \sum_{k=0}^n \frac{f(x_k)}{\prod\limits_{\substack{j=0 \\ j \ne k}}^n (x_k - x_j)} \\
&= \sum_{k=0}^n \frac{f(x_k)}{\omega_{n+1}'(x_k)} \\
\end{aligned}
$$

### 均差的性质

1. **线性性**：

    若 $f(x) = \alpha\varphi(x) + \beta\psi(x)$，则
    $$
    f[x_0,\cdots,x_n] = \alpha\varphi[x_0,\cdots,x_n] + \beta\psi[x_0,\cdots,x_n]
    $$
2. **线性组合，系数和为 0**：

    $$
    f[x_0, x_1, \cdots, x_n] = \sum_{i=0}^{n} \frac{f(x_i)}{\omega_{n+1}'(x_i)}
    $$
    显然 $f[x_0, x_1, \cdots, x_n]$ 为 $f(x_0), \cdots f(x_n)$ 的线性组合，且系数和 $\sum_{i=0}^{n} 1/\omega_{n+1}'(x_i) = 0$。
3. **对称性**：

    $$
    f[x_i, x_j] = f[x_j, x_i], \quad f[x_i, x_j, x_k] = f[x_j, x_i, x_k]
    $$
4. **多项式求导关系**：

    若 $f(x)$ 为 $n$ 次多项式，则 $f[x_0, \cdots, x_k, x]$ 为 $n-k-1$ 次多项式。

5. **差商与导数的关系**：

    若 $f\in C^{n}[a,b]$，且 $x_0,x_1,\dots,x_n$ 互异，则存在 $\xi$ 落在这些点的凸包（即最小闭区间）内，使得
    $$
    f[x_0,x_1,\dots,x_n]=\frac{f^{(n)}(\xi)}{n!}
    $$

    **证明**：

    设 $P_{n-1}(t)$ 是 $f(t)$ 在节点 $x_0,\dots,x_{n-1}$ 上的 $n-1$ 次插值多项式。对固定的 $x_n$，构造
    $$
    \varphi(t)=f(t)-P_{n-1}(t)-K\cdot\omega_n(t),\qquad \omega_n(t)=(t-x_0)\cdots(t-x_{n-1})
    $$
    取 $K=\dfrac{f(x_n)-P_{n-1}(x_n)}{\omega_n(x_n)}$，使 $\varphi(x_n)=0$。

    由插值条件，$\varphi(x_i)=0\ (i=0,\dots,n-1)$，故 $\varphi$ 共有 $n+1$ 个零点。反复应用 Rolle 定理，$\varphi^{(n)}$ 至少有一个零点 $\xi$。

    计算得 $\varphi^{(n)}(t)=f^{(n)}(t)-K\cdot n!$，代入 $\xi$：
    $$
    0=f^{(n)}(\xi)-K\cdot n!
    \quad\Longrightarrow\quad
    K=\frac{f^{(n)}(\xi)}{n!}
    $$

    又因为 $K=\dfrac{f(x_n)-P_{n-1}(x_n)}{\omega_n(x_n)}=f[x_0,\dots,x_{n-1},x_n]$，故
    $$
    f[x_0,\dots,x_n]=\frac{f^{(n)}(\xi)}{n!}
    $$

    **推论**：

    当节点全部重合时，差商退化为导数：
    $$
    f[\underbrace{x_0,\dots,x_0}_{n+1\text{个}}]=\frac{f^{(n)}(x_0)}{n!}
    $$

6. **差商对活跃节点的求导**：

    若 $f\in C^{n+2}[a,b]$，$x_0,\dots,x_n$ 为固定互异节点，则对活跃节点 $x$ 有：
    $$
    \frac{\mathrm{d}}{\mathrm{d}x}f[x_0,\dots,x_n,x]=f[x_0,\dots,x_n,x,x]
    $$

    **证明**：

    记 $g(x)=f[x_0,\dots,x_n,x]$。对任意 $y\neq x$，由差商递推定义：
    $$
    f[x_0,\dots,x_n,x,y]=\frac{f[x_0,\dots,x_n,y]-f[x_0,\dots,x_n,x]}{y-x}=\frac{g(y)-g(x)}{y-x}
    $$

    令 $y\to x$。由于 $f\in C^{n+2}$，$n+2$ 阶差商关于节点连续，左边趋于重合节点差商 $f[x_0,\dots,x_n,x,x]$；右边正是 $g(x)$ 的导数定义。故：
    $$
    \frac{\mathrm{d}}{\mathrm{d}x}f[x_0,\dots,x_n,x]=f[x_0,\dots,x_n,x,x]
    $$

    **注**：

    结合性质 5，进一步可得：
    $$
    f[x_0,\dots,x_n,x,x]=\frac{f^{(n+2)}(\xi)}{(n+2)!}
    $$
    其中 $\xi$ 落在 $x_0,\dots,x_n,x$ 所张成的最小闭区间内。

### Newton 插值余项

Newton 插值多项式 $P_n(t)$ 在节点 $x_0,\dots,x_n$ 上插值 $f(t)$。
现在增加一个点 $x$（不是原插值节点），考虑在 $n+2$ 个节点 $x_0,\dots,x_n,x$ 上的 $n+1$ 次 Newton 插值多项式 $P_{n+1}(t)$。

根据 Newton 插值的逐次生成性质，增加一个节点只需在末尾追加一项：
$$
P_{n+1}(t)=P_n(t)+f[x_0,\dots,x_n,x]\cdot(t-x_0)(t-x_1)\cdots(t-x_n)
$$

记 $\omega_{n+1}(t)=(t-x_0)\cdots(t-x_n)$，则
$$
P_{n+1}(t)=P_n(t)+f[x_0,\dots,x_n,x]\cdot\omega_{n+1}(t)
$$

因为 $x$ 是 $P_{n+1}(t)$ 的插值节点之一，所以 $P_{n+1}(x)=f(x)$。代入 $t=x$：

$$
f(x)=P_n(x)+f[x_0,\dots,x_n,x]\cdot\omega_{n+1}(x)
$$

移项即得 **Newton 型余项**：
$$
R_n(x)=f(x)-P_n(x)=f[x_0,x_1,\dots,x_n,x]\cdot\omega_{n+1}(x)
$$

**特点**：此推导**不需要 $f$ 可导**，仅依赖函数值与差商定义，本质上是恒等式。

### 均差表的建立

根据函数表逐列填写：

| $x_i$ | $f[x_i]$ | 一阶差商       | 二阶差商           | 三阶差商               | 四阶差商               |
| :---: | :------: | :------------: | :----------------: | :--------------------: | :--------------------: |
| $x_0$ | $f[x_0]$ |                |                    |                        |                        |
|       |          | $f[x_0,x_1]$   |                    |                        |                        |
| $x_1$ | $f[x_1]$ |                | $f[x_0,x_1,x_2]$   |                        |                        |
|       |          | $f[x_1,x_2]$   |                    | $f[x_0,x_1,x_2,x_3]$   |                        |
| $x_2$ | $f[x_2]$ |                | $f[x_1,x_2,x_3]$   |                        | $f[x_0,\cdots,x_4]$    |
|       |          | $f[x_2,x_3]$   |                    | $f[x_1,x_2,x_3,x_4]$   |                        |
| $x_3$ | $f[x_3]$ |                | $f[x_2,x_3,x_4]$   |                        |                        |
|       |          | $f[x_3,x_4]$   |                    |                        |                        |
| $x_4$ | $f[x_4]$ |                |                    |                        |                        |

### Newton 插值公式

定义**Newton 基函数**：
$$
N_0(x)\equiv 1,\qquad N_k(x)=\prod_{j=0}^{k-1}(x-x_j)\;(k\ge 1)
$$

显然任意小于等于 $n$ 次的多项式 $\varphi_n(x)$ 都可以展为 $N_0, \cdots N_n$ 的线性组合：
$$
\varphi_n(x)=\displaystyle\sum_{k=0}^{n}a_k N_k(x)
$$

则在插值条件 $\varphi_n(x_i)=f(x_i)\;(i=0,1,\dots,n)$ 下，我们有：
$$
a_k = f[x_0, \cdots, x_k], \quad k=0,1,\dots,n
$$

递推关系：
$$
\varphi_n(x) = \varphi_{n-1}(x) + N_n(x) \cdot f[x_0,x_1,\cdots,x_n]
$$

**证明思路**：

设命题对 $k \le n-1$ 个节点成立，验证 $n+1$ 个节点时 $\varphi_n(x_n) = f(x_n)$：

$$
\begin{aligned}
\varphi_n(x_n)
&= \varphi_{n-1}(x_n) + \prod_{j=0}^{n-1}(x_n-x_j)
\cdot\frac{f[x_0,\cdots,x_{n-2},x_n]-f[x_0,\cdots,x_{n-2},x_{n-1}]}{x_n-x_{n-1}} \\
&= \varphi_{n-1}(x_n) + \prod_{j=0}^{n-2}(x_n-x_j)
\cdot(f[x_0,\cdots,x_{n-2},x_n]-f[x_0,\cdots,x_{n-2},x_{n-1}]) \\
&= \varphi_{n-1}(x_n) + [\tilde\varphi_{n-1}(x_n) - \varphi_{n-2}(x_n)] - [\varphi_{n-1}(x_n) - \varphi_{n-2}(x_n)] \\
&= \tilde\varphi_{n-1}(x_n) \\
&= f(x_n)
\end{aligned}
$$
其中 $\tilde\varphi_{n-1}(x)$ 为根据 $x_0, \cdots, x_{n-2}, x_n$ 拟合的多项式。

再由插值多项式的唯一性即证。当然直接由待定的系数猛猛求解也是可以的。

**注**：对比 Taylor 展开

| 对比项 | Taylor 展开 | Newton 插值 |
| :--- | :--- | :--- |
| 基函数 | $(x-x_0)^k$ | $\prod_{j=0}^{k-1}(x-x_j)$ |
| 系数 | $\frac{f^{(k)}(x_0)}{k!}$ | $f[x_0,\dots,x_k]$ |
| 信息来源 | 单点 $x_0$ 的各阶导数 | 多点 $x_0,\dots,x_k$ 的函数值 |

当 $x_1,\dots,x_k\to x_0$ 时，差商 $\to$ 导数，Newton 基 $\to$ 幂基。

### Newton 插值算法实现

#### Newton 插值标准算法

采用**原位存储**。

```python
def newton_interp(x, y, xt):
    n = len(x) - 1
    f = list(y)  # 原位存储差商

    phi = f[0]  # 初始化 xt 处值
    omega = 1.0  # 初始化 N_0(xt)

    for i in range(1, n + 1):
        omega *= (xt - x[i - 1])  # 求 N_i(xt)
        # 从后往前更新差商，避免覆盖还未用到的值
        for k in range(n, i - 1, -1):
            f[k] = (f[k-1] - f[k]) / (x[k-i] - x[k])  # 求 f[x_{k-i}, \cdots, x_k]
        phi += f[i] * omega  # 累加当前阶贡献
    return phi
```

复杂度为 $\mathcal{O}(n^2)$。

#### Newton 插值向量化版

```python
import numpy as np

def newton_vectorized(x, y, xt_list):
    x = np.array(x, dtype=float)
    f = np.array(y, dtype=float)
    n = len(x) - 1

    phi = np.full(len(xt_list), f[0])
    omega = np.ones(len(xt_list))

    for i in range(1, n + 1):
        omega *= (xt_list - x[i - 1])
        for k in range(n, i - 1, -1):
            f[k] = (f[k-1] - f[k]) / (x[k-i] - x[k])
        phi += f[i] * omega
    return phi
```

### Lagrange 与 Newton 插值对比

| 对比维度 | Lagrange 插值 | Newton 插值 |
| :--- | :--- | :--- |
| **公式结构** | 基函数线性组合 | 均差递推展开 |
| **新增节点** | 全部基函数**重算** | 只增加一项，**保留**已有结果 |
| **时间复杂度（单点）** | $O(n^2)$ | $O(n^2)$ |
| **适用场景** | 节点固定，一次性计算 | 节点逐步增加，在线插值 |
| **数值稳定性** | 可能因大 $n$ 出现数值问题 | 同等条件下相同 |

---

## Runge 现象

### 现象描述

对于 $n$ 次多项式插值，**节点数量越多，插值结果不一定越接近原函数**。

以 Runge 函数为例：
$$
f(x) = \frac{1}{1 + 25x^2}, \quad -1 \le x \le 1
$$

在 $[-1,1]$ 上取等距节点做高次多项式插值，区间端点附近会出现**剧烈振荡**。

![图 1：Runge 现象](/images/note/computing-method/09-interpolation-method-1-01-runge_phenomenon.png)

### 原因分析

根据插值余项公式：
$$
R_n(x) = \dfrac{f^{(n+1)}(\xi)}{(n+1)!}\,\omega_{n+1}(x)
$$

等距节点时，$|\omega_{n+1}(x)|$ 在区间端点处增长远快于 $(n+1)!$，且 $f(x)$ 的高阶导数在端点附近较大，两者共同导致误差在端点处爆炸性增大。

### 改进方法

| 方法 | 思路 |
| :--- | :--- |
| **Chebyshev 节点** | 使 $\|\omega_{n+1}\|_\infty$ 最小，抑制端点振荡 |
| **分段插值** | 用低次多项式分段拟合，下一讲介绍 |
| **样条插值** | 分段三次多项式，额外要求导数连续 |

---

## 综合复杂度对比

| 指标 | Lagrange（单点） | Lagrange（$m$ 点） | Newton（单点） | Newton（$m$ 点） |
| :--- | :---: | :---: | :---: | :---: |
| **时间复杂度** | $O(n^2)$ | $O(n^2 + mn)$ | $O(n^2)$ | $O(n^2 + mn)$ |
| **空间复杂度** | $O(1)$ | $O(n)$ | $O(n)$ | $O(n)$ |
| **新增节点代价** | $O(n^2)$ 重算 | $O(n^2)$ 重算 | $O(n)$ 递推 | $O(n + m)$ 递推 |
