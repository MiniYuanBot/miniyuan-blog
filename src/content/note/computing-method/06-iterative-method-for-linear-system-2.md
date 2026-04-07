---
title: '解线性方程组的迭代法（二次函数极值，最速下降法，共轭梯度法）'
excerpt: '26 春 计算方法 L06'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'April 07 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 迭代法的一般框架

### Richardson 方法

对于线性方程组 $\mathbf{A}\mathbf{x} = \mathbf{b}$，将系数矩阵分解为：
$$
\mathbf{A} = \mathbf{P} - \mathbf{Q}
$$
其中 $\mathbf{P}$ 为可逆矩阵，则可建立迭代格式：
$$
\mathbf{P}\mathbf{x}^{(k+1)} = \mathbf{Q}\mathbf{x}^{(k)} + \mathbf{b} \quad
\Rightarrow \quad \mathbf{x}^{(k+1)} = \mathbf{M}\mathbf{x}^{(k)} + \mathbf{g}
$$
其中 $\mathbf{M} = \mathbf{P}^{-1}\mathbf{Q}$ 为迭代矩阵，$\mathbf{g} = \mathbf{P}^{-1}\mathbf{b}$ 为常数项。

进一步改写为：
$$
\mathbf{x}^{(k+1)}
= \mathbf{x}^{(k)} + \mathbf{P}^{-1}(\mathbf{b} - \mathbf{A}\mathbf{x}^{(k)})
= \mathbf{x}^{(k)} + \mathbf{P}^{-1}\mathbf{r}^{(k)}
$$
其中 **残差向量** 定义为：
$$
\mathbf{r}^{(k)} \equiv \mathbf{b} - \mathbf{A}\mathbf{x}^{(k)}
$$

引入松弛因子 $\omega^{(k)}$，得到更一般的 **Richardson 迭代格式**：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \omega^{(k)} \mathbf{P}^{-1} \mathbf{r}^{(k)}
$$

### Richardson 方法分类

- **平稳 Richardson 方法**：$\omega^{(k)} \equiv \omega$ 为常数（如 Jacobi、Gauss-Seidel、SOR 方法）；
- **非平稳 Richardson 方法**：$\omega^{(k)}$ 依赖于迭代步 $k$（如最速下降法、共轭梯度法）。

**注**：

本讲聚焦于 $\mathbf{A}$ 对称正定的情形，此时可将求解 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 严格等价为极小化二次函数问题，从而可以使用最速下降与共轭梯度法。

对于一般的方程 $\mathbf{A} \mathbf{x} = \mathbf{b}$，
转化为 $\mathbf{A}^\top \mathbf{A} \mathbf{x} = \mathbf{A}^\top \mathbf{b}$ 即可同理求解。

### 二次函数极值等价性

设 $\mathbf{A} \in \mathbb{R}^{n \times n}$ 为对称正定矩阵，则求解线性方程组 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 等价于求解如下二次函数的极小值问题：
$$
\phi(\mathbf{x}) = \frac{1}{2} \mathbf{x}^\top \mathbf{A} \mathbf{x} - \mathbf{b}^\top \mathbf{x}
$$

**证明**：

只需证明 $\phi(\mathbf{x})$ 的极小值点 $\mathbf{x}^*$ $\Leftrightarrow$ $\mathbf{A}\mathbf{x} = \mathbf{b}$ 的解 $\mathbf{x}^*$。

- $\Leftarrow$ 方向：

    事实上，对任意向量 $\mathbf{x}, \mathbf{y} \in \mathbb{R}^n$，我们有如下恒等式：
    $$
    \frac{1}{2} \mathbf{x}^\top \mathbf{A} \mathbf{x} - \mathbf{b}^\top \mathbf{x}
    = \frac{1}{2} (\mathbf{x} - \mathbf{y})^\top \mathbf{A} (\mathbf{x} - \mathbf{y})
    - \frac{1}{2} \mathbf{y}^\top \mathbf{A} \mathbf{y}
    + (\mathbf{A}\mathbf{y} - \mathbf{b})^\top \mathbf{x}
    $$

    对于 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 的解 $\mathbf{x}^*$，在恒等式中取 $\mathbf{y} = \mathbf{x}^*$ 得：
    $$
    \phi(\mathbf{x})
    = \frac{1}{2} (\mathbf{x} - \mathbf{x}^*)^\top \mathbf{A} (\mathbf{x}
    - \mathbf{x}^*) - \frac{1}{2} (\mathbf{x}^*)^\top \mathbf{A} \mathbf{x}^*
    $$
    显然最小值点即为 $\mathbf{x} = \mathbf{x}^*$。

- $\Rightarrow$ 方向：

    设 $\mathbf{x}^*$ 是 $\phi(\mathbf{x})$ 的极小值点。由于 $\phi$ 可微，极小值点处梯度必为零：
    $$
    \nabla \phi(\mathbf{x}^*) = \mathbf{A} \mathbf{x}^* - \mathbf{b} = \mathbf{0}
    $$

    也即 $\mathbf{A} \mathbf{x}^* = \mathbf{b}$，因此 $\mathbf{x}^*$ 是原方程的解。

**注**：

若记误差向量为 $\mathbf{e} = \mathbf{x} - \mathbf{x}^*$，则我们有
$$
\phi(\mathbf{x}) = \frac{1}{2}\|\mathbf{e}\|_{\mathbf{A}} + C
$$
后续会用到。

### 向量空间记号约定

为简化表达，引入以下记号，其中 $\mathbf{A}$ 为对称正定阵：

- **标准内积**：
    $$
    \langle \mathbf{x}, \mathbf{y} \rangle \equiv \mathbf{x}^\top \mathbf{y}
    $$

- **A-双线性形式（A-内积）**：
    $$
    B(\mathbf{x}, \mathbf{y}) \equiv \mathbf{x}^\top \mathbf{A} \mathbf{y}
    = \langle \mathbf{x}, \mathbf{A} \mathbf{y} \rangle
    = \langle \mathbf{A} \mathbf{x}, \mathbf{y} \rangle
    $$
    **注**：因 $\mathbf{A}$ 对称正定，$B(\cdot,\cdot)$ 是 $\mathbb{R}^n$ 上的内积。

- **A-范数**：
    $$
    \|\mathbf{x}\|_\mathbf{A} \equiv \sqrt{B(\mathbf{x}, \mathbf{x})} = \sqrt{\mathbf{x}^\top \mathbf{A} \mathbf{x}}
    $$

于是目标函数可简写为：
$$
\phi(\mathbf{x}) = \frac{1}{2} B(\mathbf{x}, \mathbf{x}) - \langle \mathbf{b}, \mathbf{x} \rangle
$$

**几何意义**：$\phi(\mathbf{x})$ 是一个开口向上的抛物面（椭球面），其等高线为 $A$-椭球。

---

## 最速下降法

最速下降法是梯度下降法在二次函数情形下的具体实现，其核心思想是在每一步沿**当前点处函数下降最快的方向**（即负梯度方向）进行一维搜索。

设当前迭代点为 $\mathbf{x}^{(k)}$，搜索方向为 $\mathbf{p}^{(k)}$，步长为 $\alpha^{(k)}$，则：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \alpha^{(k)} \mathbf{p}^{(k)}
$$
其中 $\alpha^{(k)}$ 满足：
$$
\begin{aligned}
\alpha^{(k)}
&= \argmin_{\alpha \in \mathbb{R}} \phi(\mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)}) \\
&= \argmin_{\alpha \in \mathbb{R}} \|\mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)} - \mathbf{x}^*\|_{\mathbf{A}}
\end{aligned}
$$

### 搜索方向的确定

函数 $\phi(\mathbf{x})$ 在 $\mathbf{x}^{(k)}$ 处的梯度为：
$$
\nabla \phi(\mathbf{x}^{(k)}) = \mathbf{A} \mathbf{x}^{(k)} - \mathbf{b} = -\mathbf{r}^{(k)}
$$
由于**负梯度方向即为下降最快方向**，故取搜索方向为：
$$
\mathbf{p}^{(k)} = -\nabla \phi(\mathbf{x}^{(k)}) = \mathbf{r}^{(k)}
$$

### 步长的确定

定义单变量函数：
$$
f^{(k)}(\alpha) = \phi(\mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)})
$$
展开得：
$$
\begin{aligned}
f^{(k)}(\alpha)
&= \frac{1}{2} B(\mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)}, \mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)})
- \langle \mathbf{b}, \mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)} \rangle \\
&= \frac{1}{2} \left[ B(\mathbf{x}^{(k)},\mathbf{x}^{(k)}) + 2\alpha B(\mathbf{x}^{(k)},\mathbf{p}^{(k)})
+ \alpha^2 B(\mathbf{p}^{(k)},\mathbf{p}^{(k)}) \right] \\
&\quad - \langle \mathbf{b}, \mathbf{x}^{(k)} \rangle - \alpha \langle \mathbf{b}, \mathbf{p}^{(k)} \rangle \\
&= \phi(\mathbf{x}^{(k)}) + \alpha B(\mathbf{x}^{(k)},\mathbf{p}^{(k)})
+ \frac{\alpha^2}{2} B(\mathbf{p}^{(k)},\mathbf{p}^{(k)}) - \alpha \langle \mathbf{b}, \mathbf{p}^{(k)} \rangle \\
&= \phi(\mathbf{x}^{(k)}) - \alpha \langle \mathbf{r}^{(k)}, \mathbf{p}^{(k)} \rangle
+ \frac{\alpha^2}{2} B(\mathbf{p}^{(k)}, \mathbf{p}^{(k)})
\end{aligned}
$$

这是一个关于 $\alpha$ 的二次函数，其最小值点为：
$$
\alpha^{(k)}
= \frac{ \langle \mathbf{r}^{(k)}, \mathbf{p}^{(k)} \rangle }{ B(\mathbf{p}^{(k)}, \mathbf{p}^{(k)}) }
= \frac{ (\mathbf{r}^{(k)})^\top \mathbf{p}^{(k)} }{ (\mathbf{p}^{(k)})^\top \mathbf{A} \mathbf{p}^{(k)} }
$$

代入 $\mathbf{p}^{(k)} = \mathbf{r}^{(k)}$ 得：
$$
\alpha^{(k)} = \frac{ \|\mathbf{r}^{(k)}\|_2^2 }{ (\mathbf{r}^{(k)})^\top \mathbf{A} \mathbf{r}^{(k)} }
$$

### 残差正交性

最速下降法具有相邻残差正交的性质，也即：
$$
\langle \mathbf{r}^{(k-1)}, \mathbf{r}^{(k)} \rangle  = 0, \quad \forall k \ge 1
$$

**证明**：
$$
\begin{aligned}
\langle \mathbf{r}^{(k-1)}, \mathbf{r}^{(k)} \rangle
&= \langle \mathbf{r}^{(k-1)}, \mathbf{b} - \mathbf{A}(\mathbf{x}^{(k-1)} + \alpha^{(k-1)} \mathbf{r}^{(k-1)}) \rangle \\
&= \langle \mathbf{r}^{(k-1)}, \mathbf{r}^{(k-1)} - \alpha^{(k-1)} \mathbf{A} \mathbf{r}^{(k-1)} \rangle \\
&= \|\mathbf{r}^{(k-1)}\|_2^2 - \alpha^{(k-1)} (\mathbf{r}^{(k-1)})^\top \mathbf{A} \mathbf{r}^{(k-1)} \\
&= \|\mathbf{r}^{(k-1)}\|_2^2
- \frac{ \|\mathbf{r}^{(k-1)}\|_2^2 }{ (\mathbf{r}^{(k-1)})^\top \mathbf{A} \mathbf{r}^{(k-1)} }
\cdot (\mathbf{r}^{(k-1)})^\top \mathbf{A} \mathbf{r}^{(k-1)} \\
&= 0
\end{aligned}
$$

**注**：该性质仅对相邻步成立；非相邻步一般不正交，这是最速下降法收敛较慢的根本原因（可能出现锯齿状）。

### 最速下降法代码

**初始化**：给定初值 $\mathbf{x}^{(0)}$，计算残差 $\mathbf{r}^{(0)} = \mathbf{b} - \mathbf{A} \mathbf{x}^{(0)}$

**循环**：

- 计算 $\mathbf{t} = \mathbf{A} \mathbf{r}^{(k)}$
- 计算步长：
    $\alpha^{(k)} = \dfrac{ \langle \mathbf{r}^{(k)}, \mathbf{r}^{(k)} \rangle }
    { \langle \mathbf{r}^{(k)}, \mathbf{t} \rangle }$
- 更新解：$\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \alpha^{(k)} \mathbf{r}^{(k)}$
- 更新残差：$\mathbf{r}^{(k+1)} = \mathbf{r}^{(k)} - \alpha^{(k)} \mathbf{t}$
- 若 $\|\mathbf{r}^{(k+1)}\|_2 < \varepsilon$，终止；否则继续循环

```python
k = 0
r = b - A @ x
while k < N:
    t = A @ r
    alpha = np.dot(r, r) / np.dot(r, t)  # 步长
    x += alpha * r                       # 更新解
    r -= alpha * t                       # 更新残差
    if np.linalg.norm(r) < EPS:
        break
    k += 1
```

**复杂度分析**：主要代价来自矩阵-向量乘法 $\mathbf{A} \mathbf{r}^{(k)}$。若 $\mathbf{A}$ 稀疏，则成本为 $\mathcal{O}(\text{nnz}(\mathbf{A}))$。  

### 最速下降法收敛性分析

**引理**：设正定对称矩阵 $\mathbf{A} \in \mathbb{R}^{n \times n}$ 的特征值为 $0 < \lambda_1 \leqslant \cdots \leqslant \lambda_n$，
$P(t)$ 是一个关于 $t$ 的多项式，则有：
$$
\|P(\mathbf{A})\mathbf{x}\|_{\mathbf{A}}
\leqslant \max_{1 \leqslant i \leqslant n}|P(\lambda_i)|\|\mathbf{x}\|_{\mathbf{A}}, \quad \mathbf{x} \in \mathbb{R}^n
$$

**引理的证明**：

由于 $\mathbf{A}$ 是正定对称矩阵，根据谱定理，存在正交矩阵 $\mathbf{Q}$ 使得：
$$
\mathbf{A} = \mathbf{Q}\mathbf{\Lambda}\mathbf{Q}^\top
$$

其中 $\mathbf{\Lambda} = \mathrm{diag}(\lambda_1, \lambda_2, \ldots, \lambda_n)$，
且 $0 < \lambda_1 \leqslant \lambda_2 \leqslant \cdots \leqslant \lambda_n$。

对于多项式 $P(t) = a_0 + a_1 t + a_2 t^2 + \cdots + a_m t^m$，有：
$$
P(\mathbf{A}) = a_0\mathbf{I} + a_1\mathbf{A} + a_2\mathbf{A}^2 + \cdots + a_m\mathbf{A}^m
$$

利用 $\mathbf{A} = \mathbf{Q}\mathbf{\Lambda}\mathbf{Q}^\top$，
可得 $\mathbf{A}^k = \mathbf{Q}\mathbf{\Lambda}^k\mathbf{Q}^\top$，其中 $k = 0, 1, 2, \ldots$

因此：
$$
P(\mathbf{A}) = \mathbf{Q}P(\mathbf{\Lambda})\mathbf{Q}^\top
= \mathbf{Q}\,\mathrm{diag}(P(\lambda_1), P(\lambda_2), \ldots, P(\lambda_n))\,\mathbf{Q}^\top
$$

$\mathbf{A}$-范数定义为：
$$
\|\mathbf{x}\|_{\mathbf{A}} = \sqrt{\mathbf{x}^\top\mathbf{A}\mathbf{x}}
$$

令 $\mathbf{y} = \mathbf{Q}^\top\mathbf{x}$，即 $\mathbf{x} = \mathbf{Q}\mathbf{y}$。从而：
$$
\|\mathbf{x}\|_{\mathbf{A}}^2
= \mathbf{x}^\top\mathbf{A}\mathbf{x}
= \mathbf{y}^\top\mathbf{\Lambda}\mathbf{y}
= \sum_{i=1}^n \lambda_i y_i^2
$$

$$
\begin{aligned}
\|P(\mathbf{A})\mathbf{x}\|_{\mathbf{A}}^2
&= (P(\mathbf{A})\mathbf{x})^\top \mathbf{A} (P(\mathbf{A})\mathbf{x})
= \mathbf{x}^\top P(\mathbf{A})^\top \mathbf{A} P(\mathbf{A})\mathbf{x} \\
&= \mathbf{y}^\top P(\mathbf{\Lambda})\mathbf{\Lambda}P(\mathbf{\Lambda})\mathbf{y}
= \sum_{i=1}^n \lambda_i [P(\lambda_i)]^2 y_i^2
\end{aligned}
$$

设 $M = \max_{1 \leqslant i \leqslant n}|P(\lambda_i)|$，则有：
$$
\|P(\mathbf{A})\mathbf{x}\|_{\mathbf{A}}^2 = \sum_{i=1}^n \lambda_i [P(\lambda_i)]^2 y_i^2
\leqslant M^2 \sum_{i=1}^n \lambda_i y_i^2 = M^2 \|\mathbf{x}\|_{\mathbf{A}}^2
$$

两边开方即证。

**最速下降法误差估计**：

设 $\mathbf{A}$ 的特征值满足 $0 < \lambda_1 \leqslant \lambda_2 \leqslant \cdots \leqslant \lambda_n$，则对任意初始值 $\mathbf{x}^{(0)}$，有：
$$
\|\mathbf{x}^{(k)} - \mathbf{x}^*\|_\mathbf{A} \leqslant
\left( \frac{ \lambda_n - \lambda_1 }{ \lambda_n + \lambda_1 } \right)^k \|\mathbf{x}^{(0)} - \mathbf{x}^*\|_\mathbf{A}
$$

**证明**：

设 $\mathbf{x}^*$ 是方程 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 的精确解，定义误差向量 $\mathbf{e}^{(k)} = \mathbf{x}^{(k)} - \mathbf{x}^*$。

则有：
$$
\mathbf{r}^{(k)} = \mathbf{b} - \mathbf{A} \mathbf{x}^{(k)} = - \mathbf{A} \mathbf{e}^{(k)}
$$

从而：
$$
\begin{aligned}
\mathbf{e}^{(k+1)}
&= \mathbf{x}^{(k+1)} - \mathbf{x}^*
= \mathbf{x}^{(k)} + \alpha^{(k)} \mathbf{r}^{(k)} - \mathbf{x}^* \\
&= \mathbf{e}^{(k)} - \alpha^{(k)} \mathbf{A} \mathbf{e}^{(k)}
= (\mathbf{I} - \alpha^{(k)} \mathbf{A}) \mathbf{e}^{(k)}
\end{aligned}
$$

我们还知道 $\alpha^{(k)} = \argmin_{\alpha \in \mathbb{R}} \|\mathbf{e}^{(k+1)}\|_{\mathbf{A}}$，从而：
$$
\|\mathbf{e}^{(k+1)}\|_{\mathbf{A}}
= \|(\mathbf{I} - \alpha^{(k)} \mathbf{A}) \mathbf{e}^{(k)}\|_{\mathbf{A}}
\leqslant \|(\mathbf{I} - \alpha \mathbf{A}) \mathbf{e}^{(k)}\|_{\mathbf{A}}
$$

考虑一次多项式 $P(t) = 1 - \alpha t$，则 $P(\mathbf{A}) = \mathbf{I} - \alpha \mathbf{A}$。

根据引理：
$$
\|(\mathbf{I} - \alpha \mathbf{A})\mathbf{e}^{(k)}\|_{\mathbf{A}}
\leqslant \max_{1 \leqslant i \leqslant n}
|1 - \alpha \lambda_i| \cdot \|\mathbf{e}^{(k)}\|_{\mathbf{A}}
$$

因此：
$$
\|\mathbf{e}^{(k+1)}\|_{\mathbf{A}}
\leqslant \min_{\alpha \in \mathbb{R}} \max_{1 \leqslant i \leqslant n}|1 - \alpha \lambda_i| \cdot \|\mathbf{e}^{(k)}\|_{\mathbf{A}}
$$

由于 $\{\lambda_i\}_{i=1}^n \subset [\lambda_1, \lambda_n]$，且 $|1-\alpha \lambda|$ 是 $\lambda$ 的线性函数，其最大值必在区间端点达到：
$$
\max_{1 \leqslant i \leqslant n}|1 - \alpha \lambda_i|
\leqslant \max_{\lambda \in [\lambda_1, \lambda_n]}|1 - \alpha \lambda|
= \max\{|1 - \alpha \lambda_1|, |1 - \alpha \lambda_n|\}
$$

最优的 $\alpha^*$ 应使得 $|1 - \alpha \lambda_1| = |1 - \alpha \lambda_n|$，且符号相反，也即 $1 - \alpha^* \lambda_1 = -(1 - \alpha^* \lambda_n)$

解得 $\alpha^* = (\lambda_1 + \lambda_n)/2$。代入得：
$$
\max_{1 \leqslant i \leqslant n}|1 - \alpha^* \lambda_i|
= 1 - \frac{2\lambda_1}{\lambda_1 + \lambda_n}
= \frac{\lambda_n - \lambda_1}{\lambda_n + \lambda_1}
$$

综上，得到单步误差缩减 $\|\mathbf{e}^{(k+1)}\|_{\mathbf{A}} \leqslant \frac{\lambda_n - \lambda_1}{\lambda_n + \lambda_1} \|\mathbf{e}^{(k)}\|_{\mathbf{A}}$。
递推 $k$ 次即证。

**注**：

- 收敛速率由特征值决定；
- 当 $\lambda_n / \lambda_1 \gg 1$（如高长宽比椭球），收敛极慢（锯齿形路径）；

---

## 共轭梯度法

共轭梯度法是对最速下降法的根本性改进：**不再使用负梯度方向，而是构造一组 $\mathbf{A}$-正交搜索方向** $\{\mathbf{d}^{(k)}\}$，使得在 $n$ 步内精确收敛（无舍入误差下），避免震荡。

### A-正交性与共轭方向

**定义**：

- **$\mathbf{A}$-正交**：对称正定矩阵 $\mathbf{A}$ 下, 向量 $\mathbf{x}, \mathbf{y}$ 满足：
  $$
  B(\mathbf{x}, \mathbf{y}) = \mathbf{x}^\top \mathbf{A} \mathbf{y} = 0
  $$
- **$\mathbf{A}$-正交向量组**：$\{\mathbf{d}^{(0)}, \mathbf{d}^{(1)}, \dots, \mathbf{d}^{(m)}\}$ 满足：
  $$
  B(\mathbf{d}^{(i)}, \mathbf{d}^{(j)}) = 0, \quad \forall i \ne j
  $$

**性质**：

- $\mathbf{A}$-正交向量组线性无关；
- $\mathbb{R}^n$ 中最多存在 $n$ 个线性无关的 $\mathbf{A}$-正交向量；
- 若 $\{\mathbf{d}^{(i)}\}_{i=0}^{n-1}$ 构成 $\mathbf{A}$-正交基，则任意向量 $\mathbf{x}$ 可唯一投影表示为：
    $$
    \mathbf{x} = \sum_{i=0}^{n-1} \lambda_i \mathbf{d}^{(i)}, \quad
    \lambda_i = \frac{ B(\mathbf{x}, \mathbf{d}^{(i)}) }{ B(\mathbf{d}^{(i)}, \mathbf{d}^{(i)}) }
    $$

    特殊地，对于解 $\mathbf{x}^*$，有：
    $$
    \mathbf{x}^* = \sum_{i=0}^{n-1} \lambda_i \mathbf{d}^{(i)}, \quad
    \lambda_i = \frac{ \langle \mathbf{b}, \mathbf{d}^{(i)} \rangle }{ B(\mathbf{d}^{(i)}, \mathbf{d}^{(i)}) }
    $$

**几何意义**：$\mathbf{A}$-正交方向在拉伸后的坐标系下相互垂直（椭球主轴方向），沿这些方向搜索更加高效。

### 递推构造共轭方向

共轭梯度法递推构造了一组 $\mathbf{A}$-正交基，并且一边构造一边进行求解（投影）。具体构造如下：
$$
\mathbf{d}^{(0)} = \mathbf{r}^{(0)}, \quad
\mathbf{d}^{(k)} = \mathbf{r}^{(k)} + \beta^{(k-1)} \mathbf{d}^{(k-1)}, \quad k \ge 1
$$
其中 $\beta^{(k-1)}$ 由 $\mathbf{A}$-正交条件 $B(\mathbf{d}^{(k-1)}, \mathbf{d}^{(k)}) = 0$ 确定：
$$
\beta^{(k-1)} = - \frac{ B(\mathbf{r}^{(k)}, \mathbf{d}^{(k-1)}) }{ B(\mathbf{d}^{(k-1)}, \mathbf{d}^{(k-1)}) }
$$

步长仍由下式确定：
$$
\alpha^{(k)} = \frac{ \langle \mathbf{r}^{(k)}, \mathbf{d}^{(k)} \rangle }{ B(\mathbf{d}^{(k)}, \mathbf{d}^{(k)}) }
$$

**定理**：
共轭梯度法递推构造的向量组 $\{\mathbf{d}^{(k)}\}$ 是 $\mathbf{A}$-正交基，即：
$$
B(\mathbf{d}^{(i)}, \mathbf{d}^{(j)}) = \mathbf{d}^{(i)\top}\mathbf{A}\mathbf{d}^{(j)} = 0, \quad \forall i \neq j
$$

**证明**：

数学归纳法，同时证明以下三个性质对任意 $k \geqslant 0$ 成立：

1. **$\mathbf{A}$-正交性**：$B(\mathbf{d}^{(i)}, \mathbf{d}^{(j)}) = 0$，对 $0 \leqslant j < i \leqslant k$
2. **残差正交性**：$\langle \mathbf{r}^{(i)}, \mathbf{r}^{(j)} \rangle = 0$，对 $0 \leqslant j < i \leqslant k$  
3. **残差与方向正交**：$\langle \mathbf{r}^{(i)}, \mathbf{d}^{(j)} \rangle = 0$，对 $0 \leqslant j < i \leqslant k$

其中迭代关系为：
$$
\mathbf{r}^{(k+1)} = \mathbf{r}^{(k)} - \alpha^{(k)}\mathbf{A}\mathbf{d}^{(k)}, \quad
\alpha^{(k)} = \frac{\langle \mathbf{r}^{(k)}, \mathbf{d}^{(k)} \rangle}{B(\mathbf{d}^{(k)}, \mathbf{d}^{(k)})}
$$

- **验证初值**：

$B(\mathbf{d}^{(1)}, \mathbf{d}^{(0)}) = 0$ 显然。

利用 $\mathbf{d}^{(0)} = \mathbf{r}^{(0)}$
和 $\alpha^{(0)} = \dfrac{\|\mathbf{r}^{(0)}\|^2}{B(\mathbf{d}^{(0)}, \mathbf{d}^{(0)})}$ 得：
$$
\langle \mathbf{r}^{(1)}, \mathbf{r}^{(0)} \rangle
= \langle \mathbf{r}^{(0)} - \alpha^{(0)}\mathbf{A}\mathbf{d}^{(0)}, \mathbf{r}^{(0)} \rangle
= \|\mathbf{r}^{(0)}\|^2 - \alpha^{(0)}B(\mathbf{d}^{(0)}, \mathbf{d}^{(0)})
= 0
$$

- **归纳假设**：

假设对某个 $k \geqslant 1$，上述三性质对 $k$ 成立，即：

- $\{\mathbf{d}^{(0)}, \ldots, \mathbf{d}^{(k)}\}$ 两两 $\mathbf{A}$-正交
- $\{\mathbf{r}^{(0)}, \ldots, \mathbf{r}^{(k)}\}$ 两两欧几里得正交  
- $\langle \mathbf{r}^{(k)}, \mathbf{d}^{(j)} \rangle = 0$ 对 $j = 0, \ldots, k-1$

**先证** $\langle \mathbf{r}^{(k+1)}, \mathbf{d}^{(j)} \rangle = 0$ 对 $j \leqslant k$：

- **当 $j = k$**：
    $$
    \langle \mathbf{r}^{(k+1)}, \mathbf{d}^{(k)} \rangle
    = \langle \mathbf{r}^{(k)}, \mathbf{d}^{(k)} \rangle - \alpha^{(k)}B(\mathbf{d}^{(k)}, \mathbf{d}^{(k)})
    = 0
    $$

- **当 $j < k$**：
    $$
    \begin{aligned}
    \langle \mathbf{r}^{(k+1)}, \mathbf{d}^{(j)} \rangle
    &= \langle \mathbf{r}^{(k)}, \mathbf{d}^{(j)} \rangle
    - \alpha^{(k)}\langle \mathbf{A}\mathbf{d}^{(k)}, \mathbf{d}^{(j)} \rangle \\
    &= 0 - \alpha^{(k)}B(\mathbf{d}^{(k)}, \mathbf{d}^{(j)}) \\
    &= 0
    \end{aligned}
    $$

**再证** $\langle \mathbf{r}^{(k+1)}, \mathbf{r}^{(j)} \rangle = 0$ 对 $j \leqslant k$：

- 利用关系 $\mathbf{r}^{(j)} = \mathbf{d}^{(j)} - \beta^{(j-1)}\mathbf{d}^{(j-1)}$（$j \geqslant 1$）：
    $$
    \langle \mathbf{r}^{(k+1)}, \mathbf{r}^{(j)} \rangle
    = \langle \mathbf{r}^{(k+1)}, \mathbf{d}^{(j)} \rangle
    - \beta^{(j-1)}\langle \mathbf{r}^{(k+1)}, \mathbf{d}^{(j-1)} \rangle
    = 0 - 0
    = 0
    $$
    对 $j=0$ 同理成立。

**最后证明** $B(\mathbf{d}^{(k+1)}, \mathbf{d}^{(j)}) = 0$ 对 $j \leqslant k$：

- **$j = k$**：由构造显然。

- **$j < k$**：

    $$
    \begin{aligned}
    B(\mathbf{d}^{(k+1)}, \mathbf{d}^{(j)})
    &= B(\mathbf{r}^{(k+1)}, \mathbf{d}^{(j)}) + \beta^{(k)}B(\mathbf{d}^{(k)}, \mathbf{d}^{(j)}) \\
    &= B(\mathbf{r}^{(k+1)}, \mathbf{d}^{(j)})
    \end{aligned}
    $$

    利用 $\mathbf{A}\mathbf{d}^{(j)} = \dfrac{1}{\alpha^{(j)}}(\mathbf{r}^{(j)} - \mathbf{r}^{(j+1)})$：
    $$
    \begin{aligned}
    B(\mathbf{r}^{(k+1)}, \mathbf{d}^{(j)})
    &= \mathbf{r}^{(k+1)\top}\mathbf{A}\mathbf{d}^{(j)} \\
    &= \frac{1}{\alpha^{(j)}}[\langle \mathbf{r}^{(k+1)}, \mathbf{r}^{(j)} \rangle
    - \langle \mathbf{r}^{(k+1)}, \mathbf{r}^{(j+1)} \rangle] \\
    &= 0
    \end{aligned}
    $$

**证毕。**

**注**：该 $\beta^{(k-1)}$ 有多种等价形式（Polak–Ribière, Fletcher–Reeves），此处为 Fletcher–Reeves 形式，适用于二次函数。

### 共轭梯度法代码

**初始化**：
给定初值 $\mathbf{x}^{(0)}$，
计算残差 $\mathbf{r}^{(0)} = \mathbf{b} - \mathbf{A}\mathbf{x}^{(0)}$，
设搜索方向 $\mathbf{d}^{(0)} = \mathbf{r}^{(0)}$

**循环**：

- 计算 $\mathbf{t} = \mathbf{A}\mathbf{d}^{(k)}$
- 计算 $s = \langle \mathbf{d}^{(k)}, \mathbf{t} \rangle$（即 $B(\mathbf{d}^{(k)}, \mathbf{d}^{(k)})$）
- 计算步长：
    $\alpha^{(k)} = \dfrac{ \langle \mathbf{r}^{(k)}, \mathbf{d}^{(k)} \rangle }{ s }$
- 更新解：$\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \alpha^{(k)} \mathbf{d}^{(k)}$
- 更新残差：$\mathbf{r}^{(k+1)} = \mathbf{r}^{(k)} - \alpha^{(k)} \mathbf{t}$
- 若 $\|\mathbf{r}^{(k+1)}\|_2 < \varepsilon$，终止
- 计算 $\beta^{(k)}$（两种等价形式）：
  - 形式一（A-正交条件）：$\beta^{(k)} = -\dfrac{ \langle \mathbf{r}^{(k+1)}, \mathbf{t} \rangle }{ s }$
  - 形式二（Fletcher–Reeves）：$\beta^{(k)} = \dfrac{ \|\mathbf{r}^{(k+1)}\|_2^2 }{ \|\mathbf{r}^{(k)}\|_2^2 }$（推荐，避免额外内积）
- 更新搜索方向：$\mathbf{d}^{(k+1)} = \mathbf{r}^{(k+1)} + \beta^{(k)} \mathbf{d}^{(k)}$

```python
k = 0
r = b - A @ x
d = r.copy()
r_norm_sq = np.dot(r, r)       # 存储 ||r^(k)||^2

while k < N:
    t = A @ d
    s = np.dot(d, t)
    alpha = np.dot(r, d) / s   # 步长
    x += alpha * d             # 更新解
    r -= alpha * t             # 更新残差
    
    if np.linalg.norm(r) < EPS:
        break
    
    r_norm_sq_new = np.dot(r, r)
    beta = r_norm_sq_new / r_norm_sq
    r_norm_sq = r_norm_sq_new
    
    d = r + beta * d           # 更新搜索方向
    k += 1
```

**复杂度分析**：
与最速下降法相同，每步主要代价为一次矩阵-向量乘法 $\mathbf{A}\mathbf{d}^{(k)}$，稀疏矩阵下成本为 $\mathcal{O}(\text{nnz}(\mathbf{A}))$。
但共轭梯度法在精确算术下至多 $n$ 步收敛，实际中通常远少于 $n$ 步即可达到精度要求，收敛速度显著优于最速下降法。

### 共轭梯度法收敛性分析

- 在 $n$ 步内精确收敛（即 $\mathbf{x}^{(n)} = \mathbf{x}^*$）；
- 实际中因舍入误差，通常在 $k \ll n$ 步即达到所需精度；
- 收敛速率依赖于特征值分布，但远优于最速下降法。

---

## 方法对比与总结

### 对比

| 特性 | 最速下降法 (SD) | 共轭梯度法 (CG) |
| ------ | -------------- | ---------------- |
| **搜索方向** | $\mathbf{p}^{(k)} = \mathbf{r}^{(k)}$（负梯度） | $\mathbf{d}^{(k)} = \mathbf{r}^{(k)} + \beta^{(k-1)} \mathbf{d}^{(k-1)}$（$\mathbf{A}$-正交基） |
| **步长公式** | $\alpha^{(k)} = \dfrac{\|\mathbf{r}^{(k)}\|^2}{\mathbf{r}^{(k)T} \mathbf{A} \mathbf{r}^{(k)}}$ | $\alpha^{(k)} = \dfrac{\mathbf{r}^{(k)T} \mathbf{d}^{(k)}}{\mathbf{d}^{(k)T} \mathbf{A} \mathbf{d}^{(k)}}$ |
| **方向正交性** | $\langle \mathbf{r}^{(k-1)}, \mathbf{r}^{(k)} \rangle = 0$（相邻） | $B(\mathbf{d}^{(i)}, \mathbf{d}^{(j)}) = 0, \; i \ne j$（全局 $\mathbf{A}$-正交） |
| **实际收敛速度** | 慢，$\sim \left(\frac{\lambda_n-\lambda_1}{\lambda_n+\lambda_1}\right)^k$ | 快，理论上 $n$ 步得到精确解，对良态/病态矩阵均稳健 |
| **空间复杂度** | $O(n)$（存 $\mathbf{x}, \mathbf{r}$） | $O(n)$（存 $\mathbf{x}, \mathbf{r}, \mathbf{d}$） |
| **时间复杂度** | 1 × matvec ($\mathbf{A} \mathbf{r}$) | 1 × matvec ($\mathbf{A} \mathbf{d}$) |

- **最速下降法的缺陷**：负梯度方向在狭长椭球中会反复在主轴间震荡，每次修正仅消除一个方向误差，效率低下。
- **CG 的优势**：通过 $\mathbf{A}$-正交性，确保每次搜索方向独立修正一个主轴方向的误差，相当于在 A-内积下进行正交化搜索，极大提升效率。
- **本质**：CG 是 Lanczos 过程的隐式实现，
  将问题投影到 Krylov 子空间 $\mathcal{K}_k(A, r^{(0)}) = \text{span}\{r^{(0)}, A r^{(0)}, \dots, A^{k-1} r^{(0)}\}$ 上求最优解。

### 预处理共轭梯度法

预处理共轭梯度法（PCG）。实际应用中，为加速 CG 收敛, 常引入**预处理矩阵** $M \approx A$（对称正定），求解等价系统：
$$
M^{-1} A x = M^{-1} b
$$
或更稳定的：
$$
M^{-1/2} A M^{-1/2} y = M^{-1/2} b, \quad x = M^{-1/2} y
$$
此时 CG 在 $M$-内积下进行，收敛速率依赖于 $\kappa(M^{-1}A)$。常用预处理子：

- 对角预处理（Jacobi）：$M = \text{diag}(A)$
- 不完全 Cholesky 分解（IC）
- 代数多重网格（AMG）
