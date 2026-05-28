---
title: '函数逼近（最小二乘法）'
excerpt: '26 春 计算方法 L13'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '函数逼近'
pubDate: 'May 28 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 神经网络的非线性数据拟合

### 数学基础

**定义**（前馈神经网络 FFNN）：

前馈神经网络是采用函数 $f(\boldsymbol{x};\boldsymbol{\theta})$ 近似目标函数 $f^*$ 的深度学习模型，其中 $\boldsymbol{\theta}$ 为可学习参数。
信息从输入 $\boldsymbol{x}$ 单向传递至输出 $\boldsymbol{y}$，无反馈机制。

网络中定义两类基本函数：

1. **仿射函数（affine function）**：$\boldsymbol{z} = \boldsymbol{W}\boldsymbol{a} + \boldsymbol{b}$
2. **非线性激活函数（activation function）**：$\sigma(z)$，如 Sigmoid 函数
    $$
    \sigma(z) = \frac{1}{1+\exp\{-z\}}, \qquad \sigma'(z) = \sigma(z)(1-\sigma(z))
    $$

随着层数与神经元数量增加，网络形成**复合函数**形式的拟合函数。

### 计算公式

对于拟合问题，定义**残差函数**为最小二乘形式：
$$
\mathcal{L}\left(\{w_{jk}^l, b_j^l\}\right) \equiv \sum_{s=1}^{N}\left[y_s - f\left(\boldsymbol{x}_s; \{w_{jk}^l, b_j^l\}\right)\right]^2
$$

其中 $N$ 为样本数，$\{w_{jk}^l, b_j^l\}$ 为第 $l$ 层第 $j$ 个神经元与第 $l-1$ 层第 $k$ 个神经元之间的权重及偏置。
训练目标即通过大量数据 $(\boldsymbol{x}_s, y_s)$ 对参数进行校正，使残差最小。

**注**：
通用逼近定理（Universal Approximation Theorem）证明了神经网络的这种多层复合具备逼近任意连续函数的能力。

### 复杂度分析

| 指标 | 结果 | 说明 |
| :--- | :--- | :--- |
| **前向传播** | $O(\sum_{l} n_{l} n_{l-1})$ | $n_l$ 为第 $l$ 层神经元数 |
| **参数规模** | $O(\sum_{l} n_{l} n_{l-1} + n_l)$ | 权重 + 偏置 |
| **训练复杂度** | 依赖迭代次数与优化器 | 反向传播利用链式法则高效计算梯度 |

**注**：神经网络通常采用梯度下降等迭代优化，一般只是局部最优解，无全局最优保证。

---

## 函数逼近

### 问题简介

误差函数 $\operatorname{erf}$ 源于 Gauss 对测量误差分布的研究：
$$
\operatorname{erf}(x) \equiv \frac{2}{\sqrt{\pi}}\int_{0}^{x}\exp\{-t^2\}\,\mathrm{d}t
$$
其补函数：
$$
\operatorname{erfc}(x) \equiv 1-\operatorname{erf}(x) = \frac{2}{\sqrt{\pi}}\int_{x}^{\infty}\exp\{-t^2\}\,\mathrm{d}t
$$

显然误差函数为奇函数，故一般只需考察 $x\geqslant 0$ 情形。

数值计算 $\operatorname{erf}(x)$ 的四种途径：

1. **Taylor 展开**：在 $x=0$ 处展开被积函数后逐项积分
2. **渐进展开**：在 $x\to+\infty$ 时有效
3. **多项式逼近**：最佳平方逼近或插值
4. **Padé 有理多项式逼近**

**Taylor 展开**：
$$
\exp\{-t^2\}
= \sum_{n=0}^{\infty}\frac{(-1)^n}{n!}t^{2n}
$$

从而：
$$
\operatorname{erf}(x)
= \frac{2}{\sqrt{\pi}}\sum_{n=0}^{\infty}\frac{(-1)^n}{n!(2n+1)}x^{2n+1}
$$
收敛半径无穷大，数值计算时截断为有限项多项式。

**渐进展开**：

注意到：
$$
e^{-t^2}\,\mathrm{d}t = -\frac{1}{2t}\,\mathrm{d}\!\left(e^{-t^2}\right)
$$

对 $\displaystyle\operatorname{erfc}(x)=\frac{2}{\sqrt{\pi}}\int_{x}^{\infty}e^{-t^2}\,\mathrm{d}t$ 反复分部积分：

$$
\begin{aligned}
\int_{x}^{\infty}e^{-t^2}\,\mathrm{d}t
&= \frac{e^{-x^2}}{2x}-\int_{x}^{\infty}\frac{e^{-t^2}}{2t^2}\,\mathrm{d}t \\[4pt]
&= \frac{e^{-x^2}}{2x}-\frac{e^{-x^2}}{4x^3}+\int_{x}^{\infty}\frac{3e^{-t^2}}{4t^4}\,\mathrm{d}t \\[4pt]
&= \frac{e^{-x^2}}{2x}-\frac{e^{-x^2}}{4x^3}+\frac{3e^{-x^2}}{8x^5}-\cdots
\end{aligned}
$$

提取 $\dfrac{e^{-x^2}}{2x}$，并注意每次分部积分产生奇数系数 $1,3,5,\dots$：

$$
\int_{x}^{\infty}e^{-t^2}\,\mathrm{d}t
= \frac{e^{-x^2}}{2x}\left[1-\frac{1}{2x^2}+\frac{1\cdot3}{(2x^2)^2}-\frac{1\cdot3\cdot5}{(2x^2)^3}+\cdots\right]
$$

从而：

$$
\operatorname{erf}(x)
= 1-\frac{\exp\{-x^2\}}{x\sqrt{\pi}}\left[1-\frac{1}{2x^2}+\frac{1\cdot3}{(2x^2)^2}-\frac{1\cdot3\cdot5}{(2x^2)^3}+\cdots\right]
$$

固定项数、令 $x\to\infty$ 时余项趋于零，但固定 $x$ 令项数 $\to\infty$ 时级数发散。

**注**：

- Taylor 展开在展开点附近精度高，增加项数可以提高精度。
- 渐进展开为发散级数，对固定的 $x$，存在一个最优的截断项数。

---

## 最佳平方逼近

### 数学基础

**定义**（最佳平方逼近）：
设 $f(x)\in C[a,b]$，$\{\varphi_0(x),\varphi_1(x),\cdots,\varphi_m(x)\}$ 为 $[a,b]$ 上线性无关的连续函数组，$\mathcal{H}=\operatorname{span}\{\varphi_0,\cdots,\varphi_m\}$。若
$$
\varphi(x) = \sum_{k=0}^{m}a_k\varphi_k(x)
$$
使得
$$
F(a_0,\cdots,a_m) = \int_{a}^{b}\omega(x)\big[f(x)-\varphi(x)\big]^2\,\mathrm{d}x = \min_{\psi\in\mathcal{H}}\int_{a}^{b}\omega(x)\big[f(x)-\psi(x)\big]^2\,\mathrm{d}x
$$
则称 $\varphi(x)$ 为 $f(x)$ 在 $\mathcal{H}$ 中关于权函数 $\omega(x)$ 的**最佳平方逼近函数**。
特别地，若 $\varphi_k(x)$ 为 $k$ 次多项式，则称 $\varphi(x)$ 为 **$m$ 次最佳平方逼近多项式**（或最小二乘逼近多项式）。

### 计算公式

将 $\varphi(x)=\sum_{k=0}^{m}a_k\varphi_k(x)$ 代入 $F$，对 $a_j$ 求驻点条件：
$$
\frac{\partial F}{\partial a_j}
= -2\int_{a}^{b}\omega(x)\left[f(x)-\sum_{k=0}^{m}a_k\varphi_k(x)\right]\varphi_j(x)\,\mathrm{d}x = 0
, \quad j=0,1,\cdots,m
$$

整理得**正规方程组**：
$$
\sum_{k=0}^{m}\underbrace{\left[\int_{a}^{b}\omega(x)\varphi_j(x)\varphi_k(x)\,\mathrm{d}x\right]}_{\equiv A_{jk}} a_k
=
\underbrace{\int_{a}^{b}\omega(x)f(x)\varphi_j(x)\,\mathrm{d}x}_{\equiv b_j}, \quad j=0,1,\cdots,m
$$

**矩阵形式**：

定义内积 $(\varphi,\psi) \equiv \int_{a}^{b}\omega(x)\varphi(x)\psi(x)\,\mathrm{d}x$，则
$$
\begin{bmatrix}
(\varphi_0,\varphi_0) & (\varphi_0,\varphi_1) & \cdots & (\varphi_0,\varphi_m) \\
(\varphi_1,\varphi_0) & (\varphi_1,\varphi_1) & \cdots & (\varphi_1,\varphi_m) \\
\vdots & \vdots & \ddots & \vdots \\
(\varphi_m,\varphi_0) & (\varphi_m,\varphi_1) & \cdots & (\varphi_m,\varphi_m)
\end{bmatrix}
\begin{bmatrix}
a_0 \\ a_1 \\ \vdots \\ a_m
\end{bmatrix}
=
\begin{bmatrix}
(f,\varphi_0) \\ (f,\varphi_1) \\ \vdots \\ (f,\varphi_m)
\end{bmatrix}
$$

### 几何意义

$\varphi(x)=\sum_{k=0}^{m}a_k\varphi_k(x)$ 是 $f(x)$ 在 $\mathcal{H}$ 上关于权函数 $\omega(x)$ 的最佳平方逼近函数的**充要条件**为：
$$
(f-\varphi, \varphi_j) = 0, \quad j=0,1,\cdots,m
$$

也即残差 $f-\varphi$ 垂直于子空间 $\mathcal{H}$，$\varphi$ 是 $f$ 在 $\mathcal{H}$ 上的**正交投影**。

**证明**：

必要性：

设 $\varphi$ 使 $F(\psi)=\|f-\psi\|^2$ 最小。对任意 $\varphi_j$，令
$$
g(t)=\big\|f-(\varphi+t\varphi_j)\big\|^2=\|f-\varphi\|^2-2t(f-\varphi,\varphi_j)+t^2\|\varphi_j\|^2
$$
$t=0$ 为极小值点，故 $g'(0)=0$，即
$$
-2(f-\varphi,\varphi_j)=0\quad\Rightarrow\quad(f-\varphi,\varphi_j)=0
$$

充分性：

设 $(f-\varphi,\varphi_j)=0$ 对所有 $j$ 成立。则对任意 $\psi=\sum c_j\varphi_j\in\mathcal{H}$，由内积线性性：
$$
(f-\varphi,\psi)=\sum_{j=0}^{m}c_j(f-\varphi,\varphi_j)=0
$$

于是对任意 $\psi\in\mathcal{H}$：
$$
\begin{aligned}
\|f-\psi\|^2
&=\big\|(f-\varphi)+(\varphi-\psi)\big\|^2 \\
&=\|f-\varphi\|^2+2\underbrace{(f-\varphi,\varphi-\psi)}_{=0}+\|\varphi-\psi\|^2 \\
&=\|f-\varphi\|^2+\|\varphi-\psi\|^2\geqslant\|f-\varphi\|^2
\end{aligned}
$$

等号仅当 $\psi=\varphi$（几乎处处）时成立。故 $\varphi$ 为最佳平方逼近。

### 算法实现

```python
import numpy as np
from scipy.integrate import quad

def best_square_approximation(f, phi, w, a, b, m):
    """
    f: 被逼近函数
    phi: 基函数列表 [phi_0, ..., phi_m]
    w: 权函数
    [a,b]: 区间
    """
    
    # 构造 Gram 矩阵 A 和右端向量 b
    A = np.zeros((m+1, m+1))
    rhs = np.zeros(m+1)
    
    for j in range(m+1):
        for k in range(m+1):
            # 计算内积 (phi_j, phi_k)
            integrand = lambda x: w(x) * phi[j](x) * phi[k](x)
            A[j,k], _ = quad(integrand, a, b)
        # 计算内积 (f, phi_j)
        integrand_f = lambda x: w(x) * f(x) * phi[j](x)
        rhs[j], _ = quad(integrand_f, a, b)
    
    # 解线性方程组
    coeffs = np.linalg.solve(A, rhs)
    return coeffs
```

### 复杂度分析

| 指标 | 结果 | 说明 |
| :--- | :--- | :--- |
| **内积计算** | $O(m^2)$ 个一维积分 | 每个积分数值计算代价取决于精度要求 |
| **方程组求解** | $O(m^3)$ | Gram 矩阵通常为稠密对称正定，可用 Cholesky 分解降至 $O(m^3/6)$ |
| **存储复杂度** | $O(m^2)$ | Gram 矩阵存储 |

**注**：
当基函数非正交时，Gram 矩阵条件数通常很大，导致数值不稳定。
采用**正交基函数**可将 Gram 矩阵对角化，系数直接由内积求得，计算复杂度降至 $O(m)$。

---

## 正交函数系与正交多项式

### 数学基础

**定义**（正交函数系）：

若函数系 $\{\varphi_0(x),\varphi_1(x),\cdots,\varphi_n(x),\cdots\}$ 满足
$$
(\varphi_j, \varphi_k) = \int_{a}^{b}\omega(x)\varphi_j(x)\varphi_k(x)\,\mathrm{d}x =
\begin{cases}
0, & j\neq k \\
\alpha_k > 0, & j=k
\end{cases}
\quad j,k=0,1,2,\cdots
$$
则称其为区间 $[a,b]$ 上关于权函数 $\omega(x)$ 的**正交函数系**。
若 $\alpha_k\equiv 1$，则称为**标准正交函数系**。

例如三角函数系 $\{1, \cos x, \sin x, \cos 2x, \sin 2x, \cdots\}$ 是 $[-\pi,\pi]$ 上关于 $\omega(x)=1$ 的正交函数系。

**定义**（正交多项式系）：

特殊地，若正交函数系中 $\varphi_k(x)$ 均为代数多项式，则称其为**正交多项式系**。

**定理**（正交函数系线性无关）：

区间 $[a,b]$ 上关于权函数 $\omega(x)$ 的正交函数系 $\varphi_0(x),\cdots,\varphi_n(x)$ 线性无关。

**证明**：

反证法。假设线性相关，则存在不全为零的实数 $c_0,\cdots,c_n$ 使得 $\sum_{i=0}^{n}c_i\varphi_i(x)=0$。
不妨设 $c_i\neq 0$，两边同乘 $\omega(x)\varphi_i(x)$ 并积分：
$$
\sum_{j=0}^{n}c_j(\varphi_j,\varphi_i) = c_i(\varphi_i,\varphi_i) = 0
$$
由于 $(\varphi_i,\varphi_i)>0$，得 $c_i=0$，矛盾。故正交函数系线性无关。

**定理**（正交多项式系的充要条件）：

设 $\varphi_k(x)$ 为最高次项系数非零的 $k$ 次多项式，则 $\{\varphi_k(x)\}$ 是 $[a,b]$ 上关于权函数 $\omega(x)$ 的正交多项式系的**充要条件**为：
对任意至多 $k-1$ 次的多项式 $Q_{k-1}(x)$，均有
$$
(\varphi_k, Q_{k-1}) = \int_{a}^{b}\omega(x)\varphi_k(x)Q_{k-1}(x)\,\mathrm{d}x = 0, \quad k=1,2,\cdots
$$

**证明**：

- **充分性**：取 $Q_{k-1}(x)=\varphi_j(x)$（$j<k$），则 $(\varphi_k,\varphi_j)=0$；又 $\varphi_k^2(x)\geqslant 0$ 且不恒为零，故 $(\varphi_k,\varphi_k)>0$。
- **必要性**：由前述定理，$\varphi_0,\cdots,\varphi_{k-1}$ 线性无关，构成 $k$ 维多项式空间的基，故任意 $Q_{k-1}(x)$ 可唯一表示为它们的线性组合，由内积线性性即得。

### 计算公式

**定理**（Gram-Schmidt 三项递推公式）：

按以下方式定义的多项式集合 $\{\varphi_0(x),\cdots,\varphi_n(x)\}$ 是 $[a,b]$ 上关于权函数 $\omega(x)\geqslant 0$（不恒为0）的正交多项式系：
$$
\begin{cases}
\varphi_0(x) = 1 \\
\varphi_1(x) = x - \alpha_1 \\
\varphi_k(x) = (x-\alpha_k)\varphi_{k-1}(x) - \beta_k\varphi_{k-2}(x), & k=2,3,\cdots,n
\end{cases}
$$
其中
$$
\alpha_k = \frac{(x\varphi_{k-1},\varphi_{k-1})}{(\varphi_{k-1},\varphi_{k-1})}, \quad k=1,2,\cdots,n
$$
$$
\beta_k
= \frac{(x\varphi_{k-1},\varphi_{k-2})}{(\varphi_{k-2},\varphi_{k-2})}
= \frac{(\varphi_{k-1},\varphi_{k-1})}{(\varphi_{k-2},\varphi_{k-2})}, \quad k=2,3,\cdots,n
$$

注：注意到 $(x\varphi_{k-1},\varphi_{k-2})=(\varphi_{k-1},x\varphi_{k-2})$ 即可。

### 常见的正交多项式系

| 多项式 | 区间 | 权函数 $\omega(x)$ | 正交性 | 递推关系 |
| :--- | :--- | :--- | :--- | :--- |
| **Legendre** $P_n(x)$ | $[-1,1]$ | $1$ | $\displaystyle\int_{-1}^{1}P_nP_m\,\mathrm{d}x=\frac{2}{2n+1}\delta_{nm}$ | $P_{n+1}=\dfrac{2n+1}{n+1}xP_n-\dfrac{n}{n+1}P_{n-1}$ |
| **Chebyshev** $T_n(x)$ | $[-1,1]$ | $\dfrac{1}{\sqrt{1-x^2}}$ | $\displaystyle\int_{-1}^{1}\frac{T_nT_m}{\sqrt{1-x^2}}\,\mathrm{d}x=\begin{cases}0, & m\neq n \\ \pi/2, & m=n\neq 0 \\ \pi, & m=n=0\end{cases}$ | $T_{n+1}=2xT_n-T_{n-1}$ |
| **Laguerre** $L_n(x)$ | $[0,\infty)$ | $\exp\{-x\}$ | $\displaystyle\int_{0}^{\infty}\exp\{-x\}L_nL_m\,\mathrm{d}x=(n!)^2\delta_{nm}$ | $L_{n+1}=(1+2n-x)L_n-n^2L_{n-1}$ |
| **Hermite** $H_n(x)$ | $(-\infty,\infty)$ | $\exp\{-x^2\}$ | $\displaystyle\int_{-\infty}^{\infty}\exp\{-x^2\}H_nH_m\,\mathrm{d}x=2^nn!\sqrt{\pi}\delta_{nm}$ | $H_{n+1}=2xH_n-2nH_{n-1}$ |

**Legendre 多项式**：
$$
P_n(x) = \frac{1}{2^n n!}\frac{\mathrm{d}^n}{\mathrm{d}x^n}\left[(x^2-1)^n\right], \quad P_0(x)=1,\; P_1(x)=x
$$
奇偶性：$P_n(-x)=(-1)^nP_n(x)$。

**Chebyshev 多项式**：
$$
T_n(x) = \cos(n\arccos x), \quad T_0(x)=1,\; T_1(x)=x
$$

- **零点**：$x_k = \cos\dfrac{(2k-1)\pi}{2n},\quad k=1,2,\cdots,n$
- **极值点**：$\hat{x}_k = \cos\dfrac{k\pi}{n},\quad k=0,1,\cdots,n$，交替取 $\pm 1$
- 最高次幂系数为 $2^{n-1}$（$n\geqslant 1$）

**Laguerre 多项式**：
$$
L_n(x) = \exp\{x\}\frac{\mathrm{d}^n}{\mathrm{d}x^n}\left(x^n\exp\{-x\}\right), \quad L_0(x)=1,\; L_1(x)=1-x
$$

**Hermite 多项式**：
$$
H_n(x) = (-1)^n\exp\{x^2\}\frac{\mathrm{d}^n}{\mathrm{d}x^n}\exp\{-x^2\}, \quad H_0(x)=1,\; H_1(x)=2x
$$

### 算法实现

```python
def orthogonal_polynomial_coeffs(f, poly_type, n, a, b):
    """
    利用正交多项式计算最佳平方逼近系数
    poly_type: 'legendre', 'chebyshev', ...
    """
    coeffs = []
    for k in range(n+1):
        # 获取第k个正交多项式 phi_k
        phi_k = get_orthogonal_poly(poly_type, k)
        # 计算内积 (f, phi_k)
        numerator, _ = quad(lambda x: f(x)*phi_k(x)*weight(x), a, b)
        # 计算范数平方 (phi_k, phi_k)
        denominator, _ = quad(lambda x: phi_k(x)**2*weight(x), a, b)
        a_k = numerator / denominator
        coeffs.append(a_k)
    return coeffs  # 逼近函数为 sum(a_k * phi_k(x))
```

### 复杂度分析

| 指标 | 一般基函数 | 正交基函数 | 说明 |
| :--- | :--- | :--- | :--- |
| **系数计算** | $O(m^3)$ | $O(m)$ | 正交基不用解稠密线性方程组 |
| **Gram 矩阵构造** | $O(m^2)$ 积分 | $O(m)$ 积分 | 正交基只需对角元 |
| **数值稳定性** | 条件数大 | 条件数优 | 正交多项式避免 Hilbert 病态 |

---

## Chebyshev 多项式与最佳 n 阶多项式插值

### 数学基础

回顾 $n$ 次多项式插值的误差估计：
$$
R_n(x) = f(x) - \varphi_n(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\omega_n(x), \quad \xi\in[a,b]
$$
其中 $\omega_n(x) = \prod_{i=0}^{n}(x-x_i)$。

为最小化整体误差，需最小化 $\max_{x\in[a,b]}|\omega_n(x)|$。

**区间映射**：将 $[a,b]$ 映射至 $[-1,1]$：
$$
x_k = \frac{b-a}{2}\tilde{x}_k + \frac{b+a}{2}
$$

**最优节点选择**：取 **Chebyshev 多项式** $T_{n+1}(x)$ 的零点作为 $\tilde{x}_k$：
$$
\tilde{x}_k = \cos\frac{(2k+1)\pi}{2(n+1)}, \quad k=0,1,\cdots,n
$$

此时 $\omega_n(x)$ 与 $T_{n+1}(x)$ 成正比，满足：
$$
|\omega_n(x)| = 2^{-n}|T_{n+1}(x)| \leqslant 2^{-n}
$$

不加证明的指出 Chebyshev 多项式是最优的，也即实现了极小化最大误差。

**误差界**：
$$
|R_n(x)| \leqslant \frac{\max_{x\in[a,b]}|f^{(n+1)}(x)|}{2^n (n+1)!}
$$

**注**：等距节点在高次插值时会出现 **Runge 现象**，而 Chebyshev 节点通过将节点向区间两端密集分布，实现了 minimax 意义下的最优。

---

## Padé 有理多项式逼近

### 数学基础

**定义**（Padé 逼近）：

给定有理函数形式
$$
r(x) = \frac{p(x)}{q(x)} = \frac{p_0 + p_1 x + \cdots + p_n x^n}{1 + q_1 x + \cdots + q_m x^m}
$$
其次数定义为 $N=n+m$，待定系数共 $n+m+1$ 个。

**Padé 逼近**是 Taylor 展开的一种推广。
对于给定的 $n,m$，通过匹配 $f(x)$ 与 $r(x)$ 在 $x=0$ 处的前 $N$ 阶导数：
$$
r^{(k)}(0) = f^{(k)}(0), \quad k=0,1,\ldots,N
$$
来确定所有系数。

### 计算公式

设 $f(x)$ 的 Maclaurin 级数为 $f(x)=\sum_{i=0}^{\infty}a_i x^i$。考虑
$$
f(x)-r(x) = \frac{f(x)q(x)-p(x)}{q(x)}
= \frac{1}{q(x)}\left[\sum_{i=0}^{\infty}a_i x^i\left(1+\sum_{j=1}^{m}q_j x^j\right) - \sum_{i=0}^{n}p_i x^i\right]
$$

要求分子中次数 $\leqslant N=n+m$ 的项系数全为零，依次得到方程组：
$$
\begin{cases}
a_0 = p_0 \\
a_1 + a_0 q_1 = p_1 \\
a_2 + a_1 q_1 + a_0 q_2 = p_2 \\
\cdots \\
a_n + a_{n-1}q_1 + \cdots + a_0 q_n = p_n \quad (q_j=0 \text{ if } j>m)
\end{cases}
$$
以及对于 $k=n+1,\ldots,n+m$ 的系数为零条件，解出 $q_1,\ldots,q_m$ 后回代求 $p_i$。

### 复杂度分析

| 指标 | 结果 | 说明 |
| :--- | :--- | :--- |
| **系数求解** | $O((n+m)^3)$ | 线性方程组求解 |
| **求值代价** | $O(n+m)$ | Horner 法则计算分子分母 |
| **逼近精度** | 同阶数下通常优于 Taylor | 有理函数可捕捉极点行为 |

**注**：Padé 逼近在函数带有极点或渐进行为时，比同阶数多项式逼近精度显著提高，广泛用于特殊函数（如 $\exp(x)$、$\operatorname{erf}(x)$）的高效数值计算。

---

## 综合对比与总结

| 方法 | 逼近形式 | 基函数/节点 | 核心优势 | 主要局限 |
| :--- | :--- | :--- | :--- | :--- |
| **最小二乘（离散）** | $\sum a_k\varphi_k(x_i)$ | 任意线性无关基 | 抗噪声、闭式解 | 高阶多项式不稳定 |
| **最佳平方逼近（连续）** | $\int\omega(x)(f-\varphi)^2\,\mathrm{d}x$ | 任意线性无关基 | 函数整体最优 | 需计算积分 |
| **正交多项式逼近** | $\sum a_k\varphi_k^{\perp}(x)$ | Legendre/Chebyshev 等 | 系数解耦、稳定 | 区间与权函数固定 |
| **Chebyshev 插值** | Lagrange 多项式 | Chebyshev 零点 | 极小化最大误差 | 需已知函数值 |
| **Padé 逼近** | $p_n(x)/q_m(x)$ | Maclaurin 系数 | 同阶数精度高、适合作极点 | 仅局部有效、需导数信息 |

**注**：
实际计算中，**Chebyshev 多项式**与 **Padé 逼近**常结合使用：先用 Chebyshev 节点离散化，再在局部采用 Padé 有理逼近，以获得全局稳定且局部高精度的数值方案。
