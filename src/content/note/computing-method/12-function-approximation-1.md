---
title: '函数逼近（最小二乘法）'
excerpt: '26 春 计算方法 L12'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '函数逼近'
pubDate: 'May 27 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 函数逼近概述

在科学实验与统计研究中，常需从一组测定数据 $(x_i, y_i),\,i=1,2,\dots,n$ 获得自变量 $x$ 与因变量 $y$ 的近似解析表达式 $y=\varphi(x)$。

与**插值法**要求 $\varphi(x_i)=y_i$ 严格过点不同，**函数逼近**不要求近似函数过每一个数据点，只要求能反映数据点的基本趋势，使残差在某种整体意义下最小。

**核心思想**：
选定一个由简单函数（如多项式、指数函数等）张成的有限维空间 $\mathcal{H}$，
寻找 $\varphi\in\mathcal{H}$ 使得残差向量 $\boldsymbol{\delta}=(\delta_1,\dots,\delta_n)^T$ 的某种范数最小，
其中 $\delta_i=y_i-\varphi(x_i)$。

---

## 数学基础

### 向量范数

对于向量 $\boldsymbol{x}\in\mathbb{R}^n$，常用范数定义为：

- **1-范数**（曼哈顿范数）：$\displaystyle \|\boldsymbol{x}\|_1 \equiv \sum_{i=1}^{n}|x_i|$
- **2-范数**（欧几里得范数）：$\displaystyle \|\boldsymbol{x}\|_2 \equiv \left(\sum_{i=1}^{n}x_i^2\right)^{1/2}$
- **$\infty$-范数**（最大范数）：$\displaystyle \|\boldsymbol{x}\|_{\infty} \equiv \max_{1\le i\le n}|x_i|$

上述三种范数在 $\mathbb{R}^n$ 上是等价的。最小二乘法本质上采用2-范数的平方作为目标函数，因其可微。

### 对向量的导数

令 $\boldsymbol{x}\in\mathbb{R}^n$。

**标量函数对向量导数**：

若 $f:\mathbb{R}^n\to\mathbb{R}$，则
$$
\frac{\partial f}{\partial\boldsymbol{x}}
=
\begin{bmatrix}
\frac{\partial f}{\partial x_1} & \frac{\partial f}{\partial x_2} & \cdots & \frac{\partial f}{\partial x_n}
\end{bmatrix}
$$
约定结果为**行向量**。

**向量值函数对向量导数**：

若 $\boldsymbol{f}:\mathbb{R}^n\to\mathbb{R}^m$，$\boldsymbol{f}(\boldsymbol{x})=[f_1(\boldsymbol{x}),\dots,f_m(\boldsymbol{x})]^T$，则
$$
\frac{\partial\boldsymbol{f}}{\partial\boldsymbol{x}} = \begin{bmatrix}
\frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{bmatrix}_{m\times n}
$$

**常用公式**：

- $\displaystyle \frac{\partial(\boldsymbol{u}^T\boldsymbol{x})}{\partial\boldsymbol{x}} = \boldsymbol{u}^T$
- $\displaystyle \frac{\partial(\boldsymbol{x}^T\boldsymbol{x})}{\partial\boldsymbol{x}} = 2\boldsymbol{x}^T$

### 一元函数的极值问题

**定义**（极小值）：

设 $f(x)$ 在 $x=a$ 的邻域有定义。若存在 $\varepsilon>0$ 使得
$$
f(x)\ge f(a),\quad \forall\,|x-a|<\varepsilon
$$
则称 $f(x)$ 在 $x=a$ 处取**极小值**。

**必要条件**（费马定理）：

若 $f(x)$ 在 $x=a$ 处可微且取极小值，则
$$
\left.\frac{\mathrm{d}f(x)}{\mathrm{d}x}\right|_{x=a}=0
$$

**证明**：
假设 $\left.\frac{\mathrm{d}f}{\mathrm{d}x}\right|_{x=a}=c\neq 0$。
取 $h=-\varepsilon c$，其中 $\varepsilon>0$ 为小正数，由 Taylor 展开：
$$
f(a+h)-f(a)=h\cdot c+o(h)=-\varepsilon c^2+o(\varepsilon)
$$

当 $\varepsilon$ 充分小时，$f(a+h)-f(a)<0$，矛盾！

**充分条件**：

在 $f'(a)=0$ 前提下，由 Taylor 展开
$$
f(a+h)-f(a)=\frac{h^2}{2}f''(a)+o(h^2)
$$
于是：

- 若 $\left.f''(x)\right|_{x=a}>0$，则 $f(x)$ 在 $x=a$ 处取**极小值**；
- 若 $\left.f''(x)\right|_{x=a}<0$，则 $f(x)$ 在 $x=a$ 处取**极大值**；
- 若 $\left.f''(x)\right|_{x=a}=0$，则不能确定。

### 多元函数的极值问题

**定义**（极小值）：

设 $f(\boldsymbol{x})$ 在 $\boldsymbol{x}=\boldsymbol{a}$ 的邻域有定义。若存在 $\varepsilon>0$ 使得
$$
f(\boldsymbol{x})\ge f(\boldsymbol{a}),\quad \forall\,\|\boldsymbol{x}-\boldsymbol{a}\|<\varepsilon,
$$
则称 $f(\boldsymbol{x})$ 在 $\boldsymbol{x}=\boldsymbol{a}$ 处取极小值。

**定义**（Hessian 矩阵）：

记
$$
\mathbf{A}=\left[a_{ij}\right]\equiv\left[\frac{\partial^2 f}{\partial x_i\partial x_j}\right]_{\boldsymbol{x}=\boldsymbol{a}}
$$
为函数 $f(\boldsymbol{x})$ 对应的 Hessian 矩阵。

**必要条件**（驻点）：

若 $f$ 在 $\boldsymbol{a}$ 处可微且取极值，则
$$
\left.\frac{\partial f}{\partial x_i}\right|_{\boldsymbol{x}=\boldsymbol{a}}=0,\quad i=1,2,\dots,n
$$

**充分条件**：

在驻点处的 Taylor 展开简化为以下二次型形式：
$$
f(\boldsymbol{a}+\boldsymbol{h})-f(\boldsymbol{a})=\frac{1}{2}\boldsymbol{h}^T\mathbf{A}\boldsymbol{h}+o(\|\boldsymbol{h}\|^2)
$$
于是：

- 若 $\mathbf{A}$ 为正定矩阵，则 $f$ 在 $\boldsymbol{a}$ 处取**极小值**；
- 若 $\mathbf{A}$ 为负定矩阵，则 $f$ 在 $\boldsymbol{a}$ 处取**极大值**；
- 若 $\mathbf{A}$ 为不定的，则不能确定。

**注**：
判断实对称矩阵正定性的 **Sylvester 准则**，$\mathbf{A}$ 正定当且仅当 $\mathbf{A}$ 的所有顺序主子式均大于零。

---

以下是统一修改后的完整章节，已按一般形式（带权基函数）重写，并在末尾给出多项式特例，同时新增正交函数族作用分析。

---

## 最小二乘法

### 问题描述

给定数据组 $(x_i,y_i),\,i=1,2,\dots,n$，选定函数空间 $\mathcal{H}$ 由一组线性无关的基函数 $\varphi_0(x),\dots,\varphi_m(x)$ 张成（$m<n-1$），设近似函数为：
$$
\varphi(x)=\sum_{k=0}^{m}a_k\varphi_k(x)
$$

引入权系数 $\omega_i>0,\;i=1,2,\dots,n$ 以反映不同数据点的可信度或重要性。
定义残差 $\delta_i=y_i-\varphi(x_i)$，最小二乘法寻求系数 $\boldsymbol{a}=[a_0,\dots,a_m]^T$ 使得加权残差的 2-范数平方最小：
$$
F(a_0,\dots,a_m)=\sum_{i=1}^{n}\omega_i\delta_i^2=\sum_{i=1}^{n}\omega_i\left[y_i-\sum_{k=0}^{m}a_k\varphi_k(x_i)\right]^2
$$

**注**：

- 当 $\varphi_k(x)=x^k$ 且 $\omega_i\equiv 1$ 时，一般形式退化为经典多项式拟合；
- 权系数常用于重复观测（$\omega_i$ 取出现频次）或异方差场景（$\omega_i$ 与方差成反比）。

---

### 正规方程组

#### 分量形式

$F$ 是关于 $a_0,\dots,a_m$ 的多元二次函数。由多元函数极值的必要条件，对每个 $a_j$ 求偏导并令其为零：
$$
\frac{\partial F}{\partial a_j}=-2\sum_{i=1}^{n}\omega_i\left[y_i-\sum_{k=0}^{m}a_k\varphi_k(x_i)\right]\varphi_j(x_i)=0
,\quad j=0,1,\dots,m
$$

整理得**正规方程组**：
$$
\sum_{k=0}^{m}a_k\left[\sum_{i=1}^{n}\omega_i\varphi_k(x_i)\varphi_j(x_i)\right]=\sum_{i=1}^{n}\omega_i y_i\varphi_j(x_i)
,\quad j=0,1,\dots,m
$$

#### 紧凑形式

定义**设计矩阵** $\mathbf{A}\in\mathbb{R}^{n\times(m+1)}$：
$$
\mathbf{A}_{ik}=\varphi_k(x_i),\quad i=1,\dots,n;\;k=0,\dots,m,
$$
并引入对角权矩阵 $\mathbf{W}=\mathrm{diag}(\omega_1,\dots,\omega_n)$。令 $\boldsymbol{b}=[y_1,\dots,y_n]^T$，则加权残差平方和可写为
$$
F(\boldsymbol{a})=(\mathbf{A}\boldsymbol{a}-\boldsymbol{b})^T\mathbf{W}(\mathbf{A}\boldsymbol{a}-\boldsymbol{b})=\|\mathbf{A}\boldsymbol{a}-\boldsymbol{b}\|_{\mathbf{W}}^2
$$

对 $\boldsymbol{a}$ 求导（行向量导数）并转置得驻点条件：
$$
\frac{\partial F}{\partial\boldsymbol{a}}=2(\mathbf{A}\boldsymbol{a}-\boldsymbol{b})^T\mathbf{W}\mathbf{A}=\boldsymbol{0}
\quad\Rightarrow\quad
\mathbf{A}^T\mathbf{W}\mathbf{A}\,\boldsymbol{a}=\mathbf{A}^T\mathbf{W}\boldsymbol{b}
$$

此式即为一般形式的**正规方程组**。
系数矩阵 $\mathbf{G}=\mathbf{A}^T\mathbf{W}\mathbf{A}$ 称为 Gram 矩阵，
其元素 $g_{jk}=\sum_{i=1}^{n}\omega_i\varphi_k(x_i)\varphi_j(x_i)$ 正是上述分量形式中的内积结构。

#### 特例：多项式拟合

取基函数 $\varphi_k(x)=x^k$（$k=0,\dots,m$）且权系数 $\omega_i\equiv 1$，则设计矩阵 $\mathbf{A}$ 为 Vandermonde 矩阵：
$$
\mathbf{A}=
\begin{bmatrix}
1 & x_1 & \cdots & x_1^m\\
1 & x_2 & \cdots & x_2^m\\
\vdots & \vdots & \ddots & \vdots\\
1 & x_n & \cdots & x_n^m
\end{bmatrix}
$$

此时 $\mathbf{G}=\mathbf{A}^T\mathbf{A}$ 的元素为幂次和 $S_{p}=\sum_{i=1}^{n}x_i^p$，正规方程组退化为：
$$
\begin{bmatrix}
n & \displaystyle\sum_{i=1}^{n} x_i & \cdots & \displaystyle\sum_{i=1}^{n} x_i^{m} \\
\displaystyle\sum_{i=1}^{n} x_i & \displaystyle\sum_{i=1}^{n} x_i^{2} & \cdots & \displaystyle\sum_{i=1}^{n} x_i^{m+1} \\
\vdots & \vdots & \ddots & \vdots \\
\displaystyle\sum_{i=1}^{n} x_i^{m} & \displaystyle\sum_{i=1}^{n} x_i^{m+1} & \cdots & \displaystyle\sum_{i=1}^{n} x_i^{2m}
\end{bmatrix}
\begin{bmatrix}
a_0 \\
a_1 \\
\vdots \\
a_m
\end{bmatrix}
=
\begin{bmatrix}
\displaystyle\sum_{i=1}^{n} y_i \\
\displaystyle\sum_{i=1}^{n} y_i x_i \\
\vdots \\
\displaystyle\sum_{i=1}^{n} y_i x_i^{m}
\end{bmatrix}
$$

---

### 存在唯一性定理

**定理**：

设设计矩阵 $\mathbf{A}\in\mathbb{R}^{n\times(m+1)}$（$n>m+1$），权矩阵 $\mathbf{W}$ 对角元均为正。
最小二乘问题存在唯一解 $\boldsymbol{a}^*$ 的充要条件是 $\mathbf{A}$ **列满秩**，即 $\mathrm{rank}(\mathbf{A})=m+1$。

**证明**：

- **充分性**：

    若 $\mathbf{A}$ 列满秩，则对任意非零 $\boldsymbol{v}\in\mathbb{R}^{m+1}$，$\mathbf{A}\boldsymbol{v}\neq\boldsymbol{0}$。
    由于 $\mathbf{W}$ 正定，故：
    $$
    \boldsymbol{v}^T(\mathbf{A}^T\mathbf{W}\mathbf{A})\boldsymbol{v}=(\mathbf{A}\boldsymbol{v})^T\mathbf{W}(\mathbf{A}\boldsymbol{v})=\|\mathbf{A}\boldsymbol{v}\|_{\mathbf{W}}^2>0.
    $$
    因此 $\mathbf{G}=\mathbf{A}^T\mathbf{W}\mathbf{A}$ 对称正定，正规方程组有唯一解。

- **必要性**：

    若 $\mathbf{A}$ 列不满秩，则存在 $\boldsymbol{v}\neq\boldsymbol{0}$ 使 $\mathbf{A}\boldsymbol{v}=\boldsymbol{0}$。
    若 $\boldsymbol{a}^*$ 为解，则 $\boldsymbol{a}^*+t\boldsymbol{v}$ 对任意 $t\in\mathbb{R}$ 也是解，解不唯一。

**注**：
$\mathbf{G}=\mathbf{A}^T\mathbf{W}\mathbf{A}$ 的 2-范数条件数约为 $\mathbf{A}$ 的 2-范数条件数的平方。
当 $m$ 较大或基函数在离散点集上接近线性相关时，正规方程组呈现**病态**，直接求解会放大舍入误差。

---

### 几何解释

将 $\mathbf{A}$ 按列分块为 $\mathbf{A}=[\boldsymbol{\alpha}_0,\boldsymbol{\alpha}_1,\dots,\boldsymbol{\alpha}_m]$，
其中 $\boldsymbol{\alpha}_k=[\varphi_k(x_1),\dots,\varphi_k(x_n)]^T$。
则 $\mathbf{A}\boldsymbol{a}$ 是列向量 $\boldsymbol{\alpha}_k$ 的线性组合，张成 $\mathbb{R}^n$ 中的一个 $(m+1)$ 维超平面 $S$。

最小二乘法等价于取内积 $\langle\boldsymbol{u},\boldsymbol{v}\rangle_{\mathbf{W}}=\boldsymbol{u}^T\mathbf{W}\boldsymbol{v}$ 时，
寻求 $\boldsymbol{b}$ 在 $S$ 上的正交投影，使得残差 $\boldsymbol{r}=\mathbf{A}\boldsymbol{a}-\boldsymbol{b}$ 满足：
$$
\boldsymbol{r}\perp S\quad\Longleftrightarrow\quad \boldsymbol{r}^T\mathbf{W}\boldsymbol{\alpha}_j=0\qquad j=0,\dots,m
$$
这与正规方程组 $\mathbf{A}^T\mathbf{W}\mathbf{A}\boldsymbol{a}=\mathbf{A}^T\mathbf{W}\boldsymbol{b}$ 完全一致。

---

## 正交函数族

### Gram 矩阵的病态性

一般形式的正规方程组以 Gram 矩阵 $\mathbf{G}=\mathbf{A}^T\mathbf{W}\mathbf{A}$ 为系数矩阵。
当采用幂基 $\varphi_k(x)=x^k$ 时，$\mathbf{G}$ 的元素为 $\sum_{i=1}^{n}\omega_i x_i^{k+j}$。随着 $m$ 增大：

- 矩阵列向量（在加权内积意义下）夹角越来越小，趋于线性相关；
- 条件数 $\kappa(\mathbf{G})$ 随阶数 $m$ 指数级增长；
- 舍入误差在求逆/求解过程中被急剧放大。

这一现象称为**正规方程组的病态**。

### 正交化的核心思想

若选取的基函数 $\{\varphi_k\}_{k=0}^m$ 关于离散点集 $\{x_i\}$ 及权 $\{\omega_i\}$ **两两正交**，即满足
$$
(\varphi_k,\varphi_j)\equiv\sum_{i=1}^{n}\omega_i\varphi_k(x_i)\varphi_j(x_i)=0\quad(k\neq j),
$$
则 Gram 矩阵退化为**对角矩阵**：
$$
\mathbf{G}=\mathrm{diag}\big((\varphi_0,\varphi_0),\,(\varphi_1,\varphi_1),\,\dots,\,(\varphi_m,\varphi_m)\big)
$$

正规方程组 $\mathbf{G}\boldsymbol{a}=\mathbf{A}^T\mathbf{W}\boldsymbol{b}$ 的求解简化为直接除法：
$$
a_k
=\frac{(y,\varphi_k)}{(\varphi_k,\varphi_k)}
=\frac{\displaystyle\sum_{i=1}^{n}\omega_i y_i\varphi_k(x_i)}{\displaystyle\sum_{i=1}^{n}\omega_i\varphi_k^2(x_i)}
,\quad k=0,1,\dots,m
$$

### 几何视角

在 $\mathbb{R}^n$ 的加权内积空间
$\langle\boldsymbol{u},\boldsymbol{v}\rangle_{\mathbf{W}}=\boldsymbol{u}^T\mathbf{W}\boldsymbol{v}$ 中，
取正交基 $\boldsymbol{\alpha}_k$，从而 $\boldsymbol{b}$ 在各基方向上的投影长度可直接独立计算，互不影响。

### 三项递推构造

对于多项式空间，正交基可通过**三项递推**构造：
$$
\begin{cases}
\varphi_0(x)=1,\\
\varphi_1(x)=x-\alpha_1,\\
\varphi_k(x)=(x-\alpha_k)\varphi_{k-1}(x)-\beta_k\varphi_{k-2}(x),\quad k\ge 2,
\end{cases}
$$
其中递推系数由加权内积确定：
$$
\alpha_k=\dfrac{(x\varphi_{k-1},\varphi_{k-1})}{(\varphi_{k-1},\varphi_{k-1})},\qquad
\beta_k=\dfrac{(\varphi_{k-1},\varphi_{k-1})}{(\varphi_{k-2},\varphi_{k-2})}
$$

---

## 具体拟合模型

一般我们不直接进行非线性最小二乘，也即我们的 $\varphi(x)=\sum_{k=0}^{m}a_k\varphi_k(x)$ 关于参数 $a_0, \cdots, a_m$ 是线性的。

如果遇到非线性的拟合，我们优先考虑线性化。

### 多项式拟合

略。

### 指数拟合

若数据近似满足 $y=b\,\mathrm{e}^{ax}$，采用**对数线性化**：
$$
\ln y = ax + \ln b
$$
令 $\tilde{y}_i=\ln y_i$（要求 $y_i>0$），则退化为一次多项式拟合，求得 $a$ 与 $\tilde{b}=\ln b$ 后还原 $b=\mathrm{e}^{\tilde{b}}$。

**注**：
对数变换改变了残差的度量方式，最小化 $\sum(\ln y_i - ax_i - \ln b)^2$ 而非 $\sum(y_i-b\mathrm{e}^{ax_i})^2$，若需严格最小化原始残差，应使用非线性最小二乘（略）。

### 分式线性拟合

| 原模型 | 变换 | 新变量 | 线性化形式 |
| :--- | :--- | :--- | :--- |
| $y=\dfrac{1}{ax+b}$ | $\dfrac{1}{y}=ax+b$ | $\tilde{y}_i=\dfrac{1}{y_i}$ | $\tilde{y}=ax+b$ |
| $y=\dfrac{x}{ax+b}$ | $\dfrac{1}{y}=a+b\dfrac{1}{x}$ | $\tilde{x}_i=\dfrac{1}{x_i},\;\tilde{y}_i=\dfrac{1}{y_i}$ | $\tilde{y}=a+b\tilde{x}$ |

---

## 算法实现

### 标准多项式拟合

取基函数 $\varphi_k(x)=x^k$，设计矩阵为 Vandermonde 矩阵。

```python
import numpy as np

def poly_fit_normal(x, y, m):
    n = len(x)
    # 构造 Vandermonde 矩阵 A (n, m+1)
    A = np.zeros((n, m + 1))
    for k in range(m + 1):
        A[:, k] = x ** k
    
    # 正规方程组
    ATA = A.T @ A          # (m + 1, m + 1)
    ATb = A.T @ y          # (m + 1,)
    
    # 解对称正定方程组，可用 Cholesky 分解提高稳定性
    a = np.linalg.solve(ATA, ATb)
    return a
```

**注**：
实际工程中不建议直接利用 $\mathbf{A}^T\mathbf{A}$ 求解正规方程组。
NumPy 的 `np.linalg.lstsq(A, y, rcond=None)` 基于 QR 分解或 SVD，数值稳定性远优于正规方程组，时间复杂度仍为 $O(nm^2)$（当 $n\gg m$）。

### 正交多项式拟合

若基函数关于离散点集 $\{x_i\}$ 及权 $\{\omega_i\}$ 满足正交性：
$$
(\varphi_k,\varphi_j)\equiv\sum_{i=1}^{n}\omega_i\varphi_k(x_i)\varphi_j(x_i)=0\;(k\neq j),
$$
则正规方程组的系数矩阵退化为对角阵，系数可直接求出：
$$
a_k=\frac{(y,\varphi_k)}{(\varphi_k,\varphi_k)}=\frac{\sum_{i=1}^{n}\omega_i y_i\varphi_k(x_i)}{\sum_{i=1}^{n}\omega_i\varphi_k^2(x_i)}
$$

三项递推构造正交多项式：
$$
\begin{cases}
\varphi_0(x)=1,\\
\varphi_1(x)=x-\alpha_1,\\
\varphi_k(x)=(x-\alpha_k)\varphi_{k-1}(x)-\beta_k\varphi_{k-2}(x),\quad k=2,3,\dots,m,
\end{cases}
$$
其中
$$
\alpha_k=\frac{(x\varphi_{k-1},\varphi_{k-1})}{(\varphi_{k-1},\varphi_{k-1})},\qquad
\beta_k=\frac{(\varphi_{k-1},\varphi_{k-1})}{(\varphi_{k-2},\varphi_{k-2})}
$$

```python
def poly_fit_orthogonal(x, y, m, w=None):
    n = len(x)
    if w is None:
        w = np.ones(n)
    
    # 初始化
    phi = [np.ones(n), x.copy()]   # phi_0, phi_1 占位
    alpha = np.zeros(m + 1)
    beta = np.zeros(m + 1)
    a = np.zeros(m + 1)
    
    # 实际计算从 k=0 开始
    phi_prev2 = np.ones(n)          # phi_{k-2}
    phi_prev1 = x - np.sum(w * x) / np.sum(w)  # phi_1 需要 alpha_1
    
    for k in range(m + 1):
        if k == 0:
            phi_k = np.ones(n)
        elif k == 1:
            alpha[1] = np.sum(w * x * phi_prev2 * phi_prev2) / np.sum(w * phi_prev2**2)
            phi_k = x - alpha[1]
        else:
            alpha[k] = np.sum(w * x * phi_prev1**2) / np.sum(w * phi_prev1**2)
            beta[k] = np.sum(w * phi_prev1**2) / np.sum(w * phi_prev2**2)
            phi_k = (x - alpha[k]) * phi_prev1 - beta[k] * phi_prev2
        
        a[k] = np.sum(w * y * phi_k) / np.sum(w * phi_k**2)
        phi_prev2, phi_prev1 = phi_prev1, phi_k
    
    return a
```

**注**：正交多项式方法将条件数问题从 $\kappa(\mathbf{A}^T\mathbf{A})$ 降至 $\kappa(\mathbf{A})$ 量级，且无需存储稠密正规矩阵，适合高次多项式拟合。

### 向量化 NumPy 实现

```python
def poly_fit_numpy(x, y, m):
    A = np.vander(x, m + 1, increasing=True)  #  Vandermonde 矩阵
    a, residuals, rank, s = np.linalg.lstsq(A, y, rcond=None)
    return a
```

---

## 超越最小二乘法的问题

### 指数函数之和拟合

给定等距数据 $(x_k,y_k)=(kh,y_k)$，$h>0$，$k=1,\dots,n$，拟合
$$
y(x)=\sum_{p=1}^{m}a_p\,\mathrm{e}^{\lambda_p x},\quad n\gg 2m
$$

**算法步骤**：

1. **离散化参数**：令 $\mu_p=\mathrm{e}^{\lambda_p h}$，则 $y(x_k)=\sum_{p=1}^{m}a_p\mu_p^k$。
2. **构造特征多项式**：设 $\mu_p$ 为多项式 $c_m\mu^m+\dots+c_1\mu+c_0=0$ 的根（取 $c_m=1$）。利用恒等式
   $$
   \sum_{q=0}^{m}c_q y_{k+q}=\sum_{p=1}^{m}a_p\mu_p^k\underbrace{\sum_{q=0}^{m}c_q\mu_p^q}_{=0}=0,
   $$
   得到关于 $c_0,\dots,c_{m-1}$ 的线性方程组：
   $$
   \begin{bmatrix}
   y_m & y_{m-1} & \dots & y_1\\
   y_{m+1} & y_m & \dots & y_2\\
   \vdots & \vdots & \ddots & \vdots\\
   y_{n-1} & y_{n-2} & \dots & y_{n-m}
   \end{bmatrix}
   \begin{bmatrix}c_{m-1}\\ c_{m-2}\\ \vdots\\ c_0\end{bmatrix}
   =
   -\begin{bmatrix}y_{m+1}\\ y_{m+2}\\ \vdots\\ y_n\end{bmatrix}.
   $$
3. **最小二乘求系数**：解上述超定方程组得 $c_q$。
4. **求特征根**：求多项式根 $\mu_p$，进而 $\lambda_p=\dfrac{\ln\mu_p}{h}$。
5. **求振幅系数**：固定 $\lambda_p$ 后，关于 $a_p$ 的模型对参数线性，再次使用最小二乘。

**注**：此过程本质是从数据中学习一个常系数线性常微分方程
$$
\left[A_m\frac{\mathrm{d}^m}{\mathrm{d}x^m}+\dots+A_1\frac{\mathrm{d}}{\mathrm{d}x}+A_0\right]y(x)=0
$$
的通解形式。

### 从数据中学习微分方程（SINDy）

对于未知动力学 $\dot{y}=f(y)$，预设候选函数库 $\boldsymbol{\Theta}(y)=[1,y,y^2,\dots,y^M]$，假设
$$
\dot{y}=\boldsymbol{\Theta}(y)\boldsymbol{\xi}
$$

对离散数据积分得：
$$
y(x_{k+1})-y(x_k)=\int_{x_k}^{x_{k+1}}\boldsymbol{\Theta}(y(\chi))\boldsymbol{\xi}\,\mathrm{d}\chi
$$

由于真实动力学方程一般是稀疏的，所以引入 **LASSO** 作为损失函数进行稀疏回归：
$$
\boldsymbol{\xi}=\arg\min_{\boldsymbol{\xi}}\Big\{\|\dot{y}-\boldsymbol{\Theta}\boldsymbol{\xi}\|_2^2+\lambda\|\boldsymbol{\xi}\|_1\Big\},
$$
通过 $\ell_1$ 惩罚自动筛选出非零系数。

**注**：
SINDy 对噪声敏感，通常需配合平滑导数估计（如 Savitzky-Golay 滤波）及交叉验证选取 $\lambda$。

---

## 复杂度分析

| 指标 | 直接正规方程组 | np.linalg.lstsq | 正交多项式递推 |
| :--- | :--- | :--- | :--- |
| **时间复杂度** | $O(nm^2+m^3/3)$ | $O(nm^2)$ | $O(nm)$ |
| **空间复杂度** | $O(m^2)$（需存储 $\mathbf{A}^T\mathbf{A}$） | $O(nm)$ | $O(n)$ |
| **数值稳定性** | 差 | 优 | 优 |
| **适用场景** | $m$ 较小且对效率不敏感 | 通用工程首选 | 高次多项式、递推场景 |

**与插值对比**：

| 特性 | 多项式插值 | 最小二乘拟合 |
| :--- | :--- | :--- |
| 过数据点 | 严格通过 | 不严格通过 |
| 次数/基函数数 | $n-1$（固定） | $m\ll n$（可控） |
| 对噪声敏感性 | 高（龙格现象） | 低（统计平均效应） |
| 计算核心 | 解 $n\times n$ 线性方程组 | 解 $(m+1)\times(m+1)$ 正规方程组 |
| 适用场景 | 精确数据、理论分析 | 实验数据、趋势提取、预测 |

**注**：
当 $m=n-1$ 且节点互异时，设计矩阵 $\mathbf{A}$ 可逆。
从而求解 $\mathbf{A}^T\mathbf{A}\mathbf{a} = \mathbf{A}^T\mathbf{y}$ 就等价于求解 $\mathbf{A}\mathbf{a} = \mathbf{y}$ 的插值问题。
但此时正规矩阵高度病态，故应直接插值。
