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

### 向量空间记号约定

为简化表达，引入以下记号，其中 $\mathbf{A}$ 为对称正定阵：

- **欧式内积**：
    $$
    \langle \mathbf{x}, \mathbf{y} \rangle \equiv \mathbf{x}^\top \mathbf{y}
    $$

- **$\mathbf{A}$-内积**：
    $$
    \langle \mathbf{x}, \mathbf{y} \rangle _{\mathbf{A}}
    \equiv \mathbf{x}^\top \mathbf{A} \mathbf{y}
    = \langle \mathbf{x}, \mathbf{A} \mathbf{y} \rangle
    = \langle \mathbf{A} \mathbf{x}, \mathbf{y} \rangle
    $$
    **注**：因 $\mathbf{A}$ 对称正定，$\langle \cdot\;, \cdot \rangle _{\mathbf{A}}$ 确实是 $\mathbb{R}^n$ 上的内积。

- **$\mathbf{A}$-范数**：
    $$
    \|\mathbf{x}\|_\mathbf{A}
    \equiv \sqrt{\langle \mathbf{x}, \mathbf{x} \rangle _{\mathbf{A}}}
    = \sqrt{\mathbf{x}^\top \mathbf{A} \mathbf{x}}
    $$

于是目标函数可简写为：
$$
\phi(\mathbf{x})
= \frac{1}{2} \langle \mathbf{x}, \mathbf{x} \rangle _{\mathbf{A}} - \langle \mathbf{b}, \mathbf{x} \rangle
= \frac{1}{2} \| \mathbf{x} - \mathbf{x}^* \|_{\mathbf{A}}^2 + C
$$

**几何意义**：$\phi(\mathbf{x})$ 是一个开口向上的抛物面（椭球面），其等高线为 $\mathbf{A}$-椭球。

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
\nabla \phi(\mathbf{x}^{(k)})
\equiv \mathbf{g}^{(k)}
= \mathbf{A} \mathbf{x}^{(k)} - \mathbf{b} = -\mathbf{r}^{(k)}
$$
由于**负梯度方向即为下降最快方向**，故取搜索方向为：
$$
\mathbf{p}^{(k)} = -\mathbf{g}^{(k)} = \mathbf{r}^{(k)}
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
&= \frac{1}{2} \langle \mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)}, \mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)} \rangle _{\mathbf{A}}
- \langle \mathbf{b}, \mathbf{x}^{(k)} + \alpha \mathbf{p}^{(k)} \rangle \\
&= \frac{1}{2} \langle \mathbf{x}^{(k)},\mathbf{x}^{(k)} \rangle _{\mathbf{A}}
+ \alpha \langle \mathbf{x}^{(k)},\mathbf{p}^{(k)} \rangle _{\mathbf{A}}
+ \frac{\alpha^2}{2} \langle \mathbf{p}^{(k)},\mathbf{p}^{(k)}\rangle _{\mathbf{A}} \\
&\quad - \langle \mathbf{b}, \mathbf{x}^{(k)} \rangle - \alpha \langle \mathbf{b}, \mathbf{p}^{(k)} \rangle \\
&= \phi(\mathbf{x}^{(k)}) + \alpha \langle \mathbf{g}^{(k)}, \mathbf{p}^{(k)} \rangle
+ \frac{\alpha^2}{2} \langle \mathbf{p}^{(k)},\mathbf{p}^{(k)}\rangle _{\mathbf{A}}
\end{aligned}
$$

这是一个关于 $\alpha$ 的二次函数，其最小值点为：
$$
\alpha^{(k)}
= -\frac{ \langle \mathbf{g}^{(k)}, \mathbf{p}^{(k)} \rangle }
{ \langle \mathbf{p}^{(k)},\mathbf{p}^{(k)}\rangle _{\mathbf{A}} }
= \frac{ \langle \mathbf{r}^{(k)}, \mathbf{p}^{(k)} \rangle }
{ \langle \mathbf{p}^{(k)},\mathbf{p}^{(k)}\rangle _{\mathbf{A}} }
$$

代入 $\mathbf{p}^{(k)} = -\mathbf{g}^{(k)} = \mathbf{r}^{(k)}$ 得：
$$
\alpha^{(k)}
= \frac{ \langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle }
{ \langle \mathbf{g}^{(k)},\mathbf{g}^{(k)}\rangle _{\mathbf{A}} }
= \frac{ \langle \mathbf{r}^{(k)}, \mathbf{r}^{(k)} \rangle }
{ \langle \mathbf{r}^{(k)},\mathbf{r}^{(k)}\rangle _{\mathbf{A}} }
$$

### 梯度正交性

最速下降法具有相邻梯度（残差）正交的性质，也即：
$$
\langle \mathbf{g}^{(k-1)}, \mathbf{g}^{(k)} \rangle  = 0, \quad \forall k \geqslant 1
$$

**证明**：

易得：
$$
\mathbf{g}^{(k+1)} - \mathbf{g}^{(k)} = \mathbf{A} (\mathbf{x}^{(k+1)} - \mathbf{x}^{(k)}) = \alpha^{(k)} \mathbf{A} \mathbf{p}^{(k)}
$$

代入 $\mathbf{p}^{(k)} = -\mathbf{g}^{(k)}$ 得：
$$
\langle \;\cdot\;, \mathbf{g}^{(k+1)} \rangle - \langle \;\cdot\;, \mathbf{g}^{(k)} \rangle
= -\alpha^{(k)} \langle \;\cdot\;, \mathbf{g}^{(k)} \rangle _\mathbf{A}
$$

再代入 $\mathbf{g}^{(k)}$ 并结合
$\alpha^{(k)} = \langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle / \langle \mathbf{g}^{(k)},\mathbf{g}^{(k)}\rangle _{\mathbf{A}}$
得：
$$
\langle \mathbf{g}^{(k-1)}, \mathbf{g}^{(k)} \rangle  = 0
$$

**注**：该性质仅对相邻步成立；非相邻步一般不正交，这是最速下降法收敛较慢的根本原因（可能出现锯齿状）。

### 最速下降法代码

**初始化**：给定初值 $\mathbf{x}^{(0)}$，计算梯度 $\mathbf{g}^{(0)} = \mathbf{A} \mathbf{x}^{(0)} - \mathbf{b}$

**循环**：

- 计算 $\mathbf{t} = \mathbf{A} \mathbf{g}^{(k)}$
- 计算步长：
    $\alpha^{(k)} = \dfrac{ \langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle }
    { \langle \mathbf{g}^{(k)}, \mathbf{t} \rangle }$
- 更新解：$\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} - \alpha^{(k)} \mathbf{g}^{(k)}$
- 更新梯度：$\mathbf{g}^{(k+1)} = \mathbf{g}^{(k)} - \alpha^{(k)} \mathbf{t}$
- 若 $\|\mathbf{r}^{(k+1)}\|_2 = \|\mathbf{g}^{(k+1)}\|_2 < \varepsilon$，终止；否则继续循环

```python
k = 0
g = A @ x - b
while k < N:
    t = A @ g
    alpha = np.dot(g, g) / np.dot(g, t)  # 步长
    x -= alpha * g                       # 更新解
    g -= alpha * t                       # 更新梯度
    if np.linalg.norm(g) < EPS:
        break
    k += 1
```

**复杂度分析**：主要代价来自矩阵-向量乘法 $\mathbf{A} \mathbf{g}^{(k)}$。若 $\mathbf{A}$ 稀疏，则成本为 $\mathcal{O}(\text{nnz}(\mathbf{A}))$。  

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
\mathbf{g}^{(k)} = \mathbf{A} \mathbf{x}^{(k)} - \mathbf{b} = \mathbf{A} \mathbf{e}^{(k)}
$$

我们还有：
$$
\mathbf{g}^{(k+1)}
= \mathbf{g}^{(k)} + \alpha^{(k)} \mathbf{A} \mathbf{p}^{(k)}
= (\mathbf{I} - \alpha^{(k)} \mathbf{A}) \mathbf{g}^{(k)}
$$

从而：
$$
\mathbf{e}^{(k+1)} = (\mathbf{I} - \alpha^{(k)} \mathbf{A}) \mathbf{e}^{(k)}
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

共轭梯度法是对最速下降法的根本性改进：**不再使用负梯度方向，而是构造一组 $\mathbf{A}$-共轭搜索方向** $\{\mathbf{d}^{(k)}\}$，使得在 $n$ 步内精确收敛（无舍入误差下），避免震荡。

### A-共轭与共轭方向

**定义**：

- **$\mathbf{A}$-共轭**：对称正定矩阵 $\mathbf{A}$ 下, 向量 $\mathbf{x}, \mathbf{y}$ 满足：
  $$
  \langle \mathbf{x}, \mathbf{y} \rangle _\mathbf{A} = \mathbf{x}^\top \mathbf{A} \mathbf{y} = 0
  $$
- **$\mathbf{A}$-共轭向量组**：$\{\mathbf{d}^{(0)}, \mathbf{d}^{(1)}, \dots, \mathbf{d}^{(m)}\}$ 满足：
  $$
  \langle \mathbf{d}^{(i)}, \mathbf{d}^{(j)} \rangle _\mathbf{A} = 0, \quad \forall i \ne j
  $$

**性质**：

- $\mathbf{A}$-共轭向量组线性无关；
- $\mathbb{R}^n$ 中最多存在 $n$ 个线性无关的 $\mathbf{A}$-共轭向量；
- 若 $\{\mathbf{d}^{(i)}\}_{i=0}^{n-1}$ 构成 $\mathbf{A}$-共轭基，则任意向量 $\mathbf{x}$ 可唯一投影表示为：
    $$
    \mathbf{x} = \sum_{i=0}^{n-1} \lambda_i \mathbf{d}^{(i)}, \quad
    \lambda_i = \frac{ \langle \mathbf{x}, \mathbf{d}^{(i)} \rangle _\mathbf{A} }
    { \langle \mathbf{d}^{(i)}, \mathbf{d}^{(i)} \rangle _\mathbf{A} }
    $$

    特殊地，对于解 $\mathbf{x}^*$，有：
    $$
    \mathbf{x}^* = \sum_{i=0}^{n-1} \lambda_i \mathbf{d}^{(i)}, \quad
    \lambda_i = \frac{ \langle \mathbf{b}, \mathbf{d}^{(i)} \rangle }
    { \langle \mathbf{d}^{(i)}, \mathbf{d}^{(i)} \rangle _\mathbf{A} }
    $$

**几何意义**：$\mathbf{A}$-共轭方向在拉伸后的坐标系下相互垂直（椭球主轴方向），沿这些方向搜索更加高效。

### 递推构造共轭方向

共轭梯度法递推构造了一组 $\mathbf{A}$-共轭基，并且一边构造一边进行求解（投影）。具体构造如下：

1. 初值：
    $$
    \mathbf{x}^{(0)}, \quad
    \mathbf{d}^{(0)} = -\mathbf{g}^{(0)}
    $$
2. 先构造新的解和梯度：
    $$
    \mathbf{x}^{(k)} = \mathbf{x}^{(k-1)} + \alpha^{(k-1)} \mathbf{A} \mathbf{d}^{(k-1)}
    $$
    其中 $\alpha^{(k-1)}$ 由[前述](#步长的确定)确定（实际上是确保了相邻梯度正交）：
    $$
    \alpha^{(k-1)}
    = -\frac{ \langle \mathbf{g}^{(k-1)}, \mathbf{d}^{(k-1)} \rangle }
    { \langle \mathbf{d}^{(k-1)}, \mathbf{d}^{(k-1)} \rangle _\mathbf{A} }
    $$
    从而可得新的梯度 $\mathbf{g}^{(k)} = \mathbf{A} \mathbf{x}^{(k)} - \mathbf{b}$
3. 再构造新的共轭方向：
    $$
    \mathbf{d}^{(k)} = -\mathbf{g}^{(k)} + \beta^{(k-1)} \mathbf{d}^{(k-1)}
    $$
    其中 $\beta^{(k-1)}$ 由 $\mathbf{A}$-共轭条件 $\langle \mathbf{d}^{(k-1)}, \mathbf{d}^{(k)} \rangle _\mathbf{A} = 0$ 确定：
    $$
    \beta^{(k-1)}
    = \frac{ \langle \mathbf{g}^{(k)}, \mathbf{d}^{(k-1)}\rangle _\mathbf{A} }
    { \langle \mathbf{d}^{(k-1)}, \mathbf{d}^{(k-1)}\rangle _\mathbf{A} }
    $$

**定理**：
共轭梯度法递推构造的向量组 $\{\mathbf{d}^{(k)}\}$ 是 $\mathbf{A}$-共轭基，即：
$$
\langle \mathbf{d}^{(i)}, \mathbf{d}^{(j)} \rangle _\mathbf{A} = 0, \quad \forall i \neq j
$$

**证明**：

数学归纳法，同时证明以下三个性质对任意 $k \geqslant 0$ 成立：

1. **$\mathbf{A}$-共轭性**：
    $\langle \mathbf{d}^{(i)}, \mathbf{d}^{(j)} \rangle _\mathbf{A} = 0,$，对 $0 \leqslant j < i \leqslant k$
2. **梯度正交性**：$\langle \mathbf{g}^{(i)}, \mathbf{g}^{(j)} \rangle = 0$，对 $0 \leqslant j < i \leqslant k$  
3. **梯度与方向正交**：$\langle \mathbf{g}^{(i)}, \mathbf{d}^{(j)} \rangle = 0$，对 $0 \leqslant j < i \leqslant k$

已知迭代关系为：
$$
\mathbf{g}^{(k+1)} = \mathbf{g}^{(k)} + \alpha^{(k)}\mathbf{A}\mathbf{d}^{(k)}, \quad
\mathbf{d}^{(k)} = -\mathbf{g}^{(k)} + \beta^{(k-1)} \mathbf{d}^{(k-1)}
$$

也即：
$$
\begin{align}
\langle \;\cdot\;, \mathbf{g}^{(m+1)} \rangle
&= \langle \;\cdot\;, \mathbf{g}^{(m)} \rangle + \alpha^{(m)}\langle \;\cdot\;, \mathbf{d}^{(m)} \rangle _\mathbf{A} \\
\langle \;\cdot\;, \mathbf{d}^{(m)} \rangle _\mathbf{A}
&= -\langle \;\cdot\;, \mathbf{g}^{(m)} \rangle _\mathbf{A}
+ \beta^{(m-1)} \langle \;\cdot\;, \mathbf{d}^{(m-1)} \rangle _\mathbf{A}
\end{align}
$$

- **验证初值**：

$\langle \mathbf{d}^{(1)}, \mathbf{d}^{(0)}\rangle _\mathbf{A} = 0$ 显然。

利用 $\mathbf{d}^{(0)} = -\mathbf{g}^{(0)}$ 和
$\alpha^{(0)} = \langle \mathbf{g}^{(0)}, \mathbf{g}^{(0)} \rangle
/ \langle \mathbf{g}^{(0)}, \mathbf{g}^{(0)} \rangle _\mathbf{A}$
，在 $(1)$ 式中代入 $\mathbf{g}^{(0)}$ 和 $m=0$：
$$
\langle \mathbf{g}^{(0)}, \mathbf{g}^{(1)} \rangle
= \langle \mathbf{g}^{(0)}, \mathbf{g}^{(0)} \rangle - \alpha^{(0)}\langle \mathbf{g}^{(0)}, \mathbf{g}^{(0)} \rangle _\mathbf{A}
= 0
$$

- **归纳假设**：

假设对某个 $k \geqslant 1$，上述三性质对 $k$ 成立。下证对于 $k+1$ 也成立。

**先证梯度正交性**：
$\langle \mathbf{g}^{(k+1)}, \mathbf{g}^{(j)} \rangle = 0$ 对 $j \leqslant k$。

- $j = k$ 时：由递推方式显然。
- $j \lt k$ 时：
    在 $(1)$ 式中代入 $\mathbf{g}^{(j)}$ 和 $m=k$：
    $$
    \langle \mathbf{g}^{(j)}, \mathbf{g}^{(k+1)} \rangle
    = \langle \mathbf{g}^{(j)}, \mathbf{g}^{(k)} \rangle
    + \alpha^{(k)}\langle \mathbf{g}^{(j)}, \mathbf{d}^{(k)} \rangle _\mathbf{A}
    = 0
    $$

**再证梯度方向正交性**：
$\langle \mathbf{g}^{(k+1)}, \mathbf{d}^{(j)} \rangle = 0$ 对 $j \leqslant k$。

- $j = k$ 时：由递推方式显然。
- $j < k$ 时：
    在 $(1)$ 式中代入 $\mathbf{d}^{(j)}$ 和 $m=k$：
    $$
    \langle \mathbf{d}^{(j)}, \mathbf{g}^{(k+1)} \rangle
    = \langle \mathbf{d}^{(j)}, \mathbf{g}^{(k)} \rangle
    + \alpha^{(k)}\langle \mathbf{d}^{(j)}, \mathbf{d}^{(k)} \rangle _\mathbf{A}
    = 0
    $$

**最后证明 $\mathbf{A}$-共轭性**：
$\langle \mathbf{d}^{(k+1)}, \mathbf{d}^{(j)} \rangle _\mathbf{A} = 0$ 对 $j \leqslant k$。

- $j = k$ 时：由递推方式显然。
- $j < k$ 时：
    在 $(2)$ 式中代入 $\mathbf{d}^{(j)}$ 和 $m=k+1$：
    $$
    \begin{aligned}
    \langle \mathbf{d}^{(j)}, \mathbf{d}^{(k+1)} \rangle _\mathbf{A}
    &= -\langle \mathbf{d}^{(j)}, \mathbf{g}^{(k+1)} \rangle _\mathbf{A}
    + \beta^{(k)}\langle \mathbf{d}^{(j)}, \mathbf{d}^{(k)} \rangle _\mathbf{A} \\
    &= -\langle \mathbf{d}^{(j)}, \mathbf{g}^{(k+1)} \rangle _\mathbf{A}
    \end{aligned}
    $$

    又因为在 $(1)$ 式中代入 $\mathbf{g}^{(k+1)}$ 和 $m=j$：
    $$
    \langle \mathbf{g}^{(k+1)}, \mathbf{g}^{(j+1)} \rangle
    = \langle \mathbf{g}^{(k+1)}, \mathbf{g}^{(j)} \rangle
    + \alpha^{(j)}\langle \mathbf{g}^{(k+1)}, \mathbf{d}^{(j)} \rangle _\mathbf{A}
    $$

    从而：
    $$
    \langle \mathbf{d}^{(j)}, \mathbf{d}^{(k+1)} \rangle _\mathbf{A}
    = -\langle \mathbf{d}^{(j)}, \mathbf{g}^{(k+1)} \rangle _\mathbf{A}
    = 0
    $$

**证毕。**

### 共轭参数的等价形式

1. **Hestenes–Stiefel (HS)**：
    $$
    \beta^{(k-1)}_{\text{HS}}
    = \frac{\langle \mathbf{g}^{(k)}, \mathbf{d}^{(k-1)} \rangle _{\mathbf{A}}}
    {\langle \mathbf{d}^{(k-1)}, \mathbf{d}^{(k-1)} \rangle _{\mathbf{A}}}
    $$

2. **Crowder–Wolfe (CW)**：
    $$
    \beta^{(k-1)}_{\text{CW}}
    = \frac{\langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} - \mathbf{g}^{(k-1)} \rangle}
    {\langle \mathbf{d}^{(k-1)}, \mathbf{g}^{(k)} - \mathbf{g}^{(k-1)} \rangle}
    $$

    **等价性证明**：

    利用 $\mathbf{g}^{(k)} - \mathbf{g}^{(k-1)} = \alpha^{(k-1)} \mathbf{A} \mathbf{d}^{(k-1)}$，代入 HS 即得。

3. **Dixon (D)**：
    $$
    \beta^{(k-1)}_{\text{D}}
    = -\frac{\langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle}
    {\langle \mathbf{d}^{(k-1)}, \mathbf{g}^{(k-1)} \rangle}
    $$

    **等价性证明**：

    利用前述性质代入 CW 即得。

4. **Fletcher–Reeves (FR)**：
    $$
    \beta^{(k-1)}_{\text{FR}}
    = \frac{\langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle}
    {\langle \mathbf{g}^{(k-1)}, \mathbf{g}^{(k-1)} \rangle}
    $$

    **等价性证明**：

    利用
    $\langle \mathbf{d}^{(k)}, \mathbf{g}^{(k)} \rangle = -\langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle$
    代入 D 即得。

5. **Polak–Ribière–Polyak (PRP)**：
    $$
    \beta^{(k-1)}_{\text{PRP}}
    = \frac{\langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} - \mathbf{g}^{(k-1)} \rangle}
    {\langle \mathbf{g}^{(k-1)}, \mathbf{g}^{(k-1)} \rangle}
    $$

    **等价性证明**：显然。

6. **Dai–Yuan (DY)**：
    $$
    \beta^{(k-1)}_{\text{DY}}
    = \frac{\langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle}
    {\langle \mathbf{d}^{(k-1)}, \mathbf{g}^{(k)} - \mathbf{g}^{(k-1)} \rangle}
    $$

    **等价性证明**：显然。

### 共轭梯度法代码

**初始化**：
给定初值 $\mathbf{x}^{(0)}$，
计算梯度 $\mathbf{g}^{(0)} = \mathbf{A}\mathbf{x}^{(0)} - \mathbf{b}$，
设搜索方向 $\mathbf{d}^{(0)} = -\mathbf{g}^{(0)}$

**循环**：

- 计算 $\mathbf{t} = \mathbf{A}\mathbf{d}^{(k)}$
- 计算 $s = \langle \mathbf{d}^{(k)}, \mathbf{t} \rangle$（即 $\langle \mathbf{d}^{(k)}, \mathbf{d}^{(k)} \rangle _\mathbf{A}$）
- 计算步长：
    $\alpha^{(k)} = -\dfrac{ \langle \mathbf{g}^{(k)}, \mathbf{d}^{(k)} \rangle }{ s }$
- 更新解：$\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \alpha^{(k)} \mathbf{d}^{(k)}$
- 更新梯度：$\mathbf{g}^{(k+1)} = \mathbf{g}^{(k)} + \alpha^{(k)} \mathbf{t}$
- 若 $\|\mathbf{r}^{(k+1)}\|_2 = \|\mathbf{g}^{(k+1)}\|_2 < \varepsilon$，终止
- 计算 $\beta^{(k)}$：选择等价形式中的一种，一般采用 FR 形式。
    $\beta^{(k)} = \dfrac{ \|\mathbf{g}^{(k+1)}\|_2^2 }{ \|\mathbf{g}^{(k)}\|_2^2 }$
- 更新搜索方向：$\mathbf{d}^{(k+1)} = -\mathbf{g}^{(k+1)} + \beta^{(k)} \mathbf{d}^{(k)}$

```python
k = 0
g = A @ x - b
d = g.copy()
g_norm = np.dot(g, g)          # 存储 ||g^(k)||^2

while k < N:
    t = A @ d
    s = np.dot(d, t)
    alpha = -np.dot(g, d) / s   # 步长
    x += alpha * d             # 更新解
    g += alpha * t             # 更新梯度
    
    g_norm_new = np.dot(r, r)
    if g_norm_new < EPS:
        break
    
    beta = g_norm_new / g_norm
    g_norm = g_norm_new
    
    d = -g + beta * d           # 更新搜索方向
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
| **搜索方向** | $\mathbf{p}^{(k)} = -\mathbf{g}^{(k)}$（负梯度） | $\mathbf{d}^{(k)} = -\mathbf{g}^{(k)} + \beta^{(k-1)} \mathbf{d}^{(k-1)}$（$\mathbf{A}$-共轭基） |
| **步长公式** | $\alpha^{(k)} = \dfrac{\|\mathbf{r}^{(k)}\|^2}{\mathbf{r}^{(k)T} \mathbf{A} \mathbf{r}^{(k)}}$ | $\alpha^{(k)} = \dfrac{\mathbf{r}^{(k)T} \mathbf{d}^{(k)}}{\mathbf{d}^{(k)T} \mathbf{A} \mathbf{d}^{(k)}}$ |
| **方向正交性** | $\langle \mathbf{r}^{(k-1)}, \mathbf{r}^{(k)} \rangle = 0$（相邻） | $B(\mathbf{d}^{(i)}, \mathbf{d}^{(j)}) = 0, \; i \ne j$（全局 $\mathbf{A}$-共轭） |
| **实际收敛速度** | 慢，$\sim \left(\frac{\lambda_n-\lambda_1}{\lambda_n+\lambda_1}\right)^k$ | 快，理论上 $n$ 步得到精确解，对良态/病态矩阵均稳健 |
| **空间复杂度** | $O(n)$（存 $\mathbf{x}, \mathbf{r}$） | $O(n)$（存 $\mathbf{x}, \mathbf{r}, \mathbf{d}$） |
| **时间复杂度** | 1 × matvec ($\mathbf{A} \mathbf{r}$) | 1 × matvec ($\mathbf{A} \mathbf{d}$) |

- **最速下降法的缺陷**：负梯度方向在狭长椭球中会反复在主轴间震荡，每次修正仅消除一个方向误差，效率低下。
- **CG 的优势**：通过 $\mathbf{A}$-共轭性，确保每次搜索方向独立修正一个主轴方向的误差，相当于在 A-内积下进行正交化搜索，极大提升效率。

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
