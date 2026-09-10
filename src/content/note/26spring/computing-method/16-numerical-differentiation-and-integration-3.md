---
title: '数值微分与数值积分（Gauss 型求积公式，数值积分专题，多重积分）'
excerpt: '26 春 计算方法 L16'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '数值微分'
- '数值积分'
pubDate: 'June 06 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Gauss 型求积公式

### 核心思想

Newton-Cotes 公式采用等距节点，在节点数 $n$ 固定时，代数精度最高为 $n$（$n$ 奇数）或 $n-1$（$n$ 偶数）。

**Gauss 型求积公式**的核心思想是：在节点数 $n$ 固定时，同时优化节点位置 $x_k$ 与权重系数 $A_k$，使得 $2n$ 个待定参数满足 $2n$ 个方程，从而将代数精度提升至 $2n-1$。

对于带权积分 $I = \int_a^b w(x)f(x)\,\mathrm{d}x$，其中权函数满足：

1. $w(x)\ge 0$ 在 $[a,b]$ 上几乎处处成立；
2. $\displaystyle\int_a^b w(x)\,\mathrm{d}x>0$，也即 $w(x)$ 不恒为零；
3. 各阶矩存在，也即 $\displaystyle\mu_k=\int_a^b w(x)x^k\,\mathrm{d}x$ 对所有 $k=0,1,2,\dots$ 都有限。

对应 Gauss 型求积公式表示为：
$$
I \approx \sum_{k=1}^{n} A_k f(x_k)
$$

其中：
$$
A_k=\int_a^b w(x)\ell_k(x)\,\mathrm{d}x,\qquad
\ell_k(x)=\prod_{\substack{j=1\\j\ne k}}^n\frac{x-x_j}{x_k-x_j}
$$

### 数学基础

**定理**（Gauss 型求积公式的代数精度）

设 Gauss 型求积公式：
$$
\int_a^b w(x)f(x)\,\mathrm{d}x \approx \sum_{k=1}^n A_k f(x_k)
$$

则该公式对所有次数不超过 $2n-1$ 的多项式精确成立的**充要条件**为：以节点 $x_1,\dots,x_n$ 为零点的 $n$ 次多项式
$$
\omega_n(x)=(x-x_1)(x-x_2)\cdots(x-x_n)
$$
与任意次数不超过 $n-1$ 的多项式在 $[a,b]$ 上关于权函数 $w(x)$ 正交，即
$$
\int_a^b w(x)q(x)\omega_n(x)\,\mathrm{d}x=0,\qquad \forall\,q(x)\in\mathcal{P}_{n-1}
$$

**证明**：

**引理**（插值型求积的基本性质）：上述 $n$ 点插值型求积公式对任意次数不超过 $n-1$ 的多项式 $p(x)$ 必定精确成立，即
$$
\int_a^b w(x)p(x)\,\mathrm{d}x=\sum_{k=1}^n A_k p(x_k)
$$

*引理证明*：

对 $p(x)$ 而言，插值多项式为：
$$
L_{n-1}(x)=\sum_{k=1}^n p(x_k)\ell_k(x)
$$
显然 $L_{n-1}(x)\equiv p(x)$。两边乘以 $w(x)$ 积分即得：
$$
\int_a^b w(x)p(x)\,\mathrm{d}x=\sum_{k=1}^n p(x_k)\int_a^b w(x)\ell_k(x)\,\mathrm{d}x=\sum_{k=1}^n A_k p(x_k)
$$

- **充分性**（正交 $\Rightarrow$ 对 $\mathcal{P}_{2n-1}$ 精确）：

设正交条件成立。任取 $f(x)\in\mathcal{P}_{2n-1}$，用 $\omega_n(x)$ 对 $f(x)$ 作带余除法：
$$
f(x)=q(x)\omega_n(x)+r(x),
$$
其中 $\deg q\le n-1$，$\deg r\le n-1$。

两边乘以 $w(x)$ 并积分：
$$
\int_a^b w(x)f(x)\,\mathrm{d}x
=\underbrace{\int_a^b w(x)q(x)\omega_n(x)\,\mathrm{d}x}_{=0}
+\int_a^b w(x)r(x)\,\mathrm{d}x
$$
故
$$
\int_a^b w(x)f(x)\,\mathrm{d}x=\int_a^b w(x)r(x)\,\mathrm{d}x
$$

另一方面，在节点 $x_k$ 处，$\omega_n(x_k)=0$，因此：
$$
f(x_k)=q(x_k)\omega_n(x_k)+r(x_k)=r(x_k)
$$

由于 $r(x)$ 次数 $\le n-1$，由引理知插值型求积对 $r(x)$ 精确：
$$
\int_a^b w(x)r(x)\,\mathrm{d}x=\sum_{k=1}^n A_k r(x_k)=\sum_{k=1}^n A_k f(x_k)
$$

从而：
$$
\int_a^b w(x)f(x)\,\mathrm{d}x=\sum_{k=1}^n A_k f(x_k)
$$
故公式对任意 $f\in\mathcal{P}_{2n-1}$ 精确成立。

**注**：也即高次由正交性确保，低次由插值自动满足。

- **必要性**（对 $\mathcal{P}_{2n-1}$ 精确 $\Rightarrow$ 正交）：

设求积公式对所有次数不超过 $2n-1$ 的多项式精确成立。任取 $q(x)\in\mathcal{P}_{n-1}$，构造：
$$
f(x)=q(x)\omega_n(x)
$$
则 $\deg f\le (n-1)+n=2n-1$，故 $f$ 落在精确成立的范围内。

由精确性：
$$
\int_a^b w(x)f(x)\,\mathrm{d}x=\sum_{k=1}^n A_k f(x_k)
$$

但右端中 $f(x_k)=q(x_k)\omega_n(x_k)=0$，因此右端为 $0$。于是
$$
\int_a^b w(x)q(x)\omega_n(x)\,\mathrm{d}x=0
$$

由 $q(x)$ 的任意性，正交条件得证。

**定理**（截断误差）：

设 $f(x)\in C^{2n}[a,b]$，则 Gauss 型求积公式的余项为：
$$
R = \int_a^b w(x)f(x)\,\mathrm{d}x - \sum_{k=1}^n A_k f(x_k)
= \frac{f^{(2n)}(\eta)}{(2n)!}\int_a^b w(x)\omega_n^2(x)\,\mathrm{d}x
,\quad a<\eta<b
$$

**证明**：

类似于 [Simpson 公式误差估计](../14-numerical-differentiation-and-integration-1#simpson-公式误差估计)。

设 $f\in C^{2n}[a,b]$，Gauss 节点为 $x_1,\dots,x_n$。构造 Hermite 插值多项式 $H(x)\in\mathcal{P}_{2n-1}$，使其满足 $2n$ 个插值条件：
$$
H(x_k)=f(x_k),\qquad H'(x_k)=f'(x_k),\qquad k=1,2,\dots,n
$$

这 $2n$ 个条件唯一确定一个次数不超过 $2n-1$ 的多项式。而 Gauss 型求积公式的代数精度为 $2n-1$，因此：
$$
\int_a^b w(x)H(x)\,\mathrm{d}x=\sum_{k=1}^n A_k H(x_k)=\sum_{k=1}^n A_k f(x_k)
$$

于是余项可写成：
$$
\begin{aligned}
R
&= \int_a^b w(x)\bigl[f(x)-H(x)\bigr]\,\mathrm{d}x \\
&= \int_a^b w(x)\cdot f[\underbrace{x_1,x_1,\dots,x_n,x_n}_{2n\text{ 个}},x]\cdot\underbrace{(x-x_1)^2(x-x_2)^2\cdots(x-x_n)^2}_{\omega_n^2(x)}
\end{aligned}
$$

由于 $f\in C^{2n}$，由重节点差商与导数的关系，存在 $\xi_x\in(a,b)$ 使得：
$$
f[x_1,x_1,\dots,x_n,x_n,x]=\frac{f^{(2n)}(\xi_x)}{(2n)!}
$$

因此：
$$
R=\frac{1}{(2n)!}\int_a^b w(x)\,f^{(2n)}(\xi_x)\,\omega_n^2(x)\,\mathrm{d}x
$$

又因为 $f^{(2n)}$ 连续，$w(x)\omega_n^2(x)$ 在 $[a,b]$ 上不变号，由加权形式的积分第一中值定理，存在 $\eta\in(a,b)$ 使得：
$$
R=\frac{f^{(2n)}(\eta)}{(2n)!}\int_a^b w(x)\omega_n^2(x)\,\mathrm{d}x,\qquad a<\eta<b
$$

**注**：误差公式表明，Gauss 求积的精度随节点数 $n$ 指数级提升，且被积函数光滑性要求较高，需 $2n$ 阶连续可导。

### 计算公式与推导

#### 区间标准化

任意区间 $[a,b]$ 可通过仿射变换映射到 $[-1,1]$：
$$
x = \frac{a+b}{2} + \frac{b-a}{2}t,\quad t\in[-1,1]
$$
$$
\int_a^b f(x)\,\mathrm{d}x = \frac{b-a}{2}\int_{-1}^{+1} g(t)\,\mathrm{d}t,\quad g(t) = f\left(\frac{a+b}{2}+\frac{b-a}{2}t\right)
$$

**注**：

1. 以下所有特殊 Gauss 公式均在 $[-1,1]$ 或对应标准区间上给出，实际应用时需先进行上述变换。
2. 以下所有特殊 Gauss 公式均取 $w(x) \equiv 1$。

#### 两点 Gauss-Legendre 公式

$$
\int_{-1}^1 f(x)\,\mathrm{d}x \approx f\left(-\frac{1}{\sqrt{3}}\right) + f\left(\frac{1}{\sqrt{3}}\right)
$$

**法一**（非线性方程组）：

要求对 $f(x)=1,x,x^2,x^3$ 精确成立：
$$
\begin{cases}
A_1 + A_2 = 2 \\
A_1x_1 + A_2x_2 = 0 \\
A_1x_1^2 + A_2x_2^2 = \frac{2}{3} \\
A_1x_1^3 + A_2x_2^3 = 0
\end{cases}
$$

求解较为困难。

**法二**（正交性推导）：

设 $\omega_2(x) = (x-x_1)(x-x_2) = x^2 + px + q$，要求其与 $1, x$ 正交：
$$
\begin{cases}
\int_{-1}^1 (x^2+px+q)\,\mathrm{d}x = 0 \\
\int_{-1}^1 x(x^2+px+q)\,\mathrm{d}x = 0
\end{cases}
\Rightarrow
\begin{cases}
p = 0 \\
q = -\frac{1}{3}
\end{cases}
$$

解得 $x_{1,2} = \pm\dfrac{1}{\sqrt{3}}$。

代入 $f(x)=1$ 和 $f(x)=x$ 求权重：
$$
\begin{cases}
A_1 + A_2 = 2 \\
-\frac{1}{\sqrt{3}}A_1 + \frac{1}{\sqrt{3}}A_2 = 0
\end{cases}
\Rightarrow A_1 = A_2 = 1
$$

**注**：仅使用 2 个函数值，即可精确积分到三次多项式，等距 Simpson 公式需 3 个点才能达到同等精度。

#### Gauss-Legendre 公式

定义 Legendre 多项式：
$$
P_n(x) = \frac{1}{2^n n!}\frac{\mathrm{d}^n}{\mathrm{d}x^n}\left[(x^2-1)^n\right]
$$

对于区间 $[-1,1]$，权函数 $w(x)=1$，有 Gauss-Legendre 公式：
$$
\int_0^{+\infty} f(x)\,\mathrm{d}x \approx \sum_{k=1}^n A_k f(x_k)
$$

**积分节点**：$P_n(x)$ 的 $n$ 个实根 $x_k\in(-1,1)$（互异且关于原点对称）。

**权重系数**：
$$
A_k = \frac{2(1-x_k^2)}{\left[n\,P_{n-1}(x_k)\right]^2} = \frac{2}{(1-x_k^2)\left[P_n'(x_k)\right]^2},\quad k=1,2,\ldots,n
$$

**常见节点与系数表**：

| $n$ | $x_k$ | $A_k$ |
| :--- | :--- | :--- |
| 1 | $0.0000000000000000$ | $2.0000000000000000$ |
| 2 | $\pm 0.5773502691896257$ | $1.0000000000000000$ |
| 3 | $\pm 0.7745966692414834$ | $0.5555555555555556$ |
| | $0.0000000000000000$ | $0.8888888888888888$ |
| 4 | $\pm 0.8611363115940526$ | $0.3478548451374538$ |
| | $\pm 0.3399810435848563$ | $0.6521451548625461$ |

**注**：$n$ 点 Gauss-Legendre 公式代数精度为 $2n-1$。

#### Gauss-Laguerre 公式

定义 Laguerre 多项式：
$$
L_n(x) = \mathrm{e}^{x}\frac{\mathrm{d}^n}{\mathrm{d}x^n}\left(x^n\mathrm{e}^{-x}\right)
$$

对于半无限区间 $[0,+\infty)$，权函数 $w(x)=\mathrm{e}^{-x}$，有 Gauss-Laguerre 公式：
$$
\int_0^{+\infty} \mathrm{e}^{-x}f(x)\,\mathrm{d}x \approx \sum_{k=1}^n A_k f(x_k)
$$

**积分节点**：$L_n(x)$ 的零点 $x_k\in(0,+\infty)$。

**权重系数**：
$$
A_k = \frac{(n!)^2}{x_k\left[L_n'(x_k)\right]^2}
$$

**常用节点与系数表**：

| $n$ | $x_k$ | $A_k$ |
| :--- | :--- | :--- |
| 2 | $0.585786$ | $0.853553$ |
| | $3.414214$ | $0.146447$ |
| 3 | $0.415775$ | $0.711093$ |
| | $2.294280$ | $0.278518$ |
| | $6.289945$ | $0.010389$ |

**注**：
若实际积分为 $\int_0^\infty g(x)\,\mathrm{d}x$，可改写为 $\int_0^\infty \mathrm{e}^{-x}[\mathrm{e}^{x}g(x)]\,\mathrm{d}x$ 然后套用公式。

#### Gauss-Hermite 公式

定义 Hermite 多项式：
$$
H_n(x) = (-1)^n\mathrm{e}^{x^2}\frac{\mathrm{d}^n}{\mathrm{d}x^n}\mathrm{e}^{-x^2}
$$

对于全实轴 $(-\infty,+\infty)$，权函数 $w(x)=\mathrm{e}^{-x^2}$，有 Gauss-Hermite 公式：
$$
\int_{-\infty}^{+\infty} \mathrm{e}^{-x^2}f(x)\,\mathrm{d}x \approx \sum_{k=1}^n A_k f(x_k)
$$

**积分节点**：$H_n(x)$ 的零点（关于原点对称）。

**权重系数**：
$$
A_k = \frac{2^{n+1}n!\sqrt{\pi}}{\left[H_n'(x_k)\right]^2}
$$

**常用节点与系数表**：

| $n$ | $x_k$ | $A_k$ |
| :--- | :--- | :--- |
| 2 | $\pm 0.70710678$ | $0.88622693$ |
| 4 | $\pm 1.65068012$ | $0.08131284$ |
| | $\pm 0.52464762$ | $0.80491409$ |

**注**：若积分为 $\int_{-\infty}^\infty g(x)\,\mathrm{d}x$，可提取 $\mathrm{e}^{-x^2}$ 因子，令 $f(x)=\mathrm{e}^{x^2}g(x)$。

#### Gauss-Chebyshev 公式

定义 Chebyshev 多项式：
$$
T_n(x)=\cos(n\arccos x)
$$

对于区间 $[-1,1]$，权函数 $w(x)=\dfrac{1}{\sqrt{1-x^2}}$（端点奇异性），有 Gauss-Chebyshev 公式：
$$
\int_{-1}^1 \frac{f(x)}{\sqrt{1-x^2}}\,\mathrm{d}x \approx \frac{\pi}{n}\sum_{k=1}^n f\left(\cos\frac{2k-1}{2n}\pi\right)
$$

**积分节点**：$T_n(x)$ 的零点：
$$
x_k = \cos\frac{2k-1}{2n}\pi,\quad k=1,2,\ldots,n
$$

**权重系数**：所有权重相等，$A_k = \dfrac{\pi}{n}$。

**注**：这是极少数权重显式相等、节点有闭式三角函数表达的 Gauss 公式，计算极其高效。

### 算法实现

**Gauss-Legendre 求积**：

```python
import numpy as np
from scipy.special import roots_legendre

def gauss_legendre(f, a, b, n):
    """
    使用 n 点 Gauss-Legendre 公式计算 ∫_a^b f(x) dx
    """
    # 获取标准区间 [-1, 1] 上的节点和权重
    x, w = roots_legendre(n)
    
    # 区间变换: t ∈ [-1,1] -> x ∈ [a,b]
    # x = (a+b)/2 + (b-a)/2 * t
    # dx = (b-a)/2 dt
    t = x
    nodes = 0.5 * (a + b) + 0.5 * (b - a) * t
    weights = w * 0.5 * (b - a)
    
    return np.sum(weights * f(nodes))
```

**自适应 Gauss-Legendre**：

```python
def composite_gauss_legendre(f, a, b, n, m):
    """
    将 [a,b] 分为 m 个子区间，每个子区间用 n 点 Gauss-Legendre
    """
    h = (b - a) / m
    total = 0.0
    for i in range(m):
        ai = a + i * h
        bi = ai + h
        total += gauss_legendre(f, ai, bi, n)
    return total
```

**注**：对于光滑性不足或变化剧烈的函数，复合 Gauss 公式比单纯增加单区间节点数更稳健。

### 复杂度分析

| 指标 | Gauss | Newton-Cotes |
| :--- | :--- | :--- |
| **节点数** | $n$ | $n$ |
| **代数精度** | $2n-1$ | $n$（$n$ 奇数）/ $n-1$（$n$ 偶数） |
| **函数求值次数** | $n$ | $n$ |
| **权重/节点计算** | $O(n^2)$（需解特征值/正交多项式零点） | $O(1)$（解析表达式） |
| **适用区间** | 各种区间 | 有限区间 |
| **端点奇异性** | 可变换函数或选用 Chebyshev | 通常失效 |

**注**：Gauss 求积的复杂性在于节点和权重的预计算。不过同一 $n$ 的节点权重只需计算一次。

---

## 数值积分专题

### 振荡函数的积分

**问题**：
计算 $\int_a^b f(x)\cos\omega x\,\mathrm{d}x$ 或 $\int_a^b f(x)\sin\omega x\,\mathrm{d}x$，其中 $f(x)$ 非振荡，$\omega \gg 1$。

**困难**：标准 Newton-Cotes 或 Gauss 公式需要极密节点才能捕捉高频振荡，计算量巨大。

**方法**：分段线性插值 + 解析积分。

将 $[a,b]$ 分为 $n$ 等分，$h=(b-a)/n$，$x_i=a+ih$。在每个子区间 $[x_i,x_{i+1}]$ 上用线性插值：
$$
\varphi(x) = f(x_i) + \frac{f(x_{i+1})-f(x_i)}{h}(x-x_i)
$$

利用分部积分，$\int_{x_i}^{x_{i+1}} \varphi(x)\cos\omega x\,\mathrm{d}x$ 有闭式解：
$$
\begin{aligned}
&\frac{1}{\omega}\left[f(x_{i+1})\sin\omega x_{i+1} - f(x_i)\sin\omega x_i\right] \\
&\quad + \frac{f(x_{i+1})-f(x_i)}{\omega^2 h}\left[\cos\omega x_{i+1} - \cos\omega x_i\right]
\end{aligned}
$$

对 $i$ 求和，第一项为 telescoping sum：
$$
\sum_{i=0}^{n-1} \frac{f(x_{i+1})\sin\omega x_{i+1} - f(x_i)\sin\omega x_i}{\omega}
= \frac{f(x_n)\sin\omega x_n - f(x_0)\sin\omega x_0}{\omega}
$$

第二项经整理（利用三角恒等式）：
$$
\sum_{i=1}^{n-1} f(x_i)\frac{2\cos\omega x_i(1-\cos\omega h)}{\omega^2 h}
- f(x_0)\frac{\cos\omega x_1-\cos\omega x_0}{\omega^2 h}
- f(x_n)\frac{\cos\omega x_n-\cos\omega x_{n-1}}{\omega^2 h}
$$

**误差估计**：
$$
\left|\int_a^b f(x)\cos\omega x\,\mathrm{d}x - \int_a^b \varphi(x)\cos\omega x\,\mathrm{d}x\right|
\le \frac{b-a}{8}h^2 \max_{x\in[a,b]}|f''(x)|
$$

**注**：误差界与 $\omega$ 无关，这是该方法的核心优势。当 $\omega$ 很大时，若 $h$ 固定，经典方法误差随 $\omega$ 增长，而本方法误差保持 $O(h^2)$。

### 奇异函数的积分

**问题**：$f(x)$ 在 $[a,b]$ 内有奇异点，例如 $x=a$ 处 $f(x)\to\infty$。

**可积条件**：设 $f(x) = \dfrac{\varphi(x)}{(x-a)^\mu}$，其中 $0<\mu<1$，$|\varphi(x)|\le M$。若 $\mu\ge 1$，积分发散。

**方法一**（积分域分解 + Taylor 展开）：

将积分分解：
$$
I
=
\underbrace{\int_a^{a+\varepsilon} \frac{\varphi(x)}{(x-a)^\mu}\,\mathrm{d}x}_{I_1}
+ \underbrace{\int_{a+\varepsilon}^b \frac{\varphi(x)}{(x-a)^\mu}\,\mathrm{d}x}_{I_2}
$$

对 $\varphi(x)$ 在 $x=a$ 处 Taylor 展开：
$$
\varphi(x) = \sum_{k=0}^p \frac{(x-a)^k}{k!}\varphi^{(k)}(a) + \frac{(x-a)^{p+1}}{(p+1)!}\varphi^{(p+1)}(\xi)
$$

则 $I_1$ 可解析计算：
$$
I_1 \approx \varepsilon^{1-\mu}\sum_{k=0}^p \frac{\varepsilon^k \varphi^{(k)}(a)}{k!(k+1-\mu)}
$$

误差项：
$$
|R| \le \frac{\varepsilon^{p+2-\mu}}{(p+1)!(p+2-\mu)}\max_{x\in[a,a+\varepsilon]}|\varphi^{(p+1)}(x)|
$$

$I_2$ 无奇异性，可用标准数值积分。

**方法二**（奇异性消去）：

构造：
$$
I = \int_a^b \frac{\varphi(x)-\varphi_p(x)}{(x-a)^\mu}\,\mathrm{d}x + \int_a^b \frac{\varphi_p(x)}{(x-a)^\mu}\,\mathrm{d}x
$$

其中 $\varphi_p(x) = \sum_{k=0}^p \frac{(x-a)^k}{k!}\varphi^{(k)}(a)$。第一项分子为 $(x-a)^{p+1}$ 阶，消去奇异性；第二项解析可积。

**注**：实际计算中，若 $\varphi(x)$ 的 Taylor 系数难以获取，也可采用变量替换法，如 $x=a+t^r$ 选择 $r$ 使得奇异性消失。

### 无限积分域函数的积分

**问题**：计算 $I = \int_a^{+\infty} f(x)\,\mathrm{d}x$。

**可积条件**：充分条件为 $\exists\mu>0$ 使得 $\lim_{x\to+\infty} x^{1+\mu}f(x) = C$（有限）。

**方法一**（截断 + 渐进展开）：

选取充分大的 $b$：
$$
I = \underbrace{\int_a^b f(x)\,\mathrm{d}x}_{\text{标准数值积分}} + \underbrace{\int_b^{+\infty} f(x)\,\mathrm{d}x}_{\text{渐进近似}}
$$

对 $x\to+\infty$ 做渐进展开：
$$
f(x) \sim x^{-(1+\mu)}\left(c_0 + \frac{c_1}{x} + \frac{c_2}{x^2} + \cdots\right)
$$

则尾项可逐项解析积分。

**方法二**（变量替换）：

令 $x = 1/t$（假设 $a>0$）：
$$
I = \int_0^{1/a} f\left(\frac{1}{t}\right)\frac{1}{t^2}\,\mathrm{d}t
$$

转化为有限区间积分，若 $t=0$ 处出现奇异性，则按奇异函数积分方法处理。

**方法三**（Gauss-Laguerre / Gauss-Hermite）：

若被积函数可表示为 $\mathrm{e}^{-x}f(x)$ 或 $\mathrm{e}^{-x^2}f(x)$，直接套用对应 Gauss 公式。

**注**：截断点 $b$ 的选择需平衡截断误差与计算成本。一般要求 $|f(b)|\cdot b \ll \varepsilon$，其中 $\varepsilon$ 为目标精度。

### 自适应数值积分

**核心思想**：根据被积函数的局部变化动态调整子区间大小。

- **函数变化剧烈**（导数大、曲率大）：细分小区间，使用更密节点。
- **函数变化平坦**：使用较宽区间。

**目标**：在给定误差容限 $\varepsilon$ 下，**最小化总函数求值次数**。

**典型策略**（以自适应 Simpson 为例）：

对区间 $[a,b]$，分别计算：

- $S(a,b)$：单区间 Simpson 近似
- $S(a,c) + S(c,b)$：二分后 Simpson 近似，$c=(a+b)/2$

若 $|S(a,b) - [S(a,c)+S(c,b)]| < 15\varepsilon/2$，接受结果；
否则递归处理 $[a,c]$ 和 $[c,b]$，误差容限各分配 $\varepsilon/2$。

### 多重积分

**矩形区域上的二重积分**：
$$
\iint_S f(x,y)\,\mathrm{d}A = \int_a^b\left[\int_c^d f(x,y)\,\mathrm{d}y\right]\mathrm{d}x,\quad S=[a,b]\times[c,d]
$$

**累次积分法**：对内层和外层分别应用一维求积公式。

**复合 Simpson 公式示例**：

内层对 $y$ 使用 Simpson：
$$
\int_c^d f(x,y)\,\mathrm{d}y \approx \frac{d-c}{6}\left[f(x,c) + 4f\left(x,\frac{c+d}{2}\right) + f(x,d)\right]
$$

外层对 $x$ 再次使用 Simpson，展开后得到九点权重分布：
$$
\begin{aligned}
&\frac{(b-a)(d-c)}{36}\Big[f(a,c) + 4f\left(\frac{a+b}{2},c\right) + f(b,c) \\
&\quad + 4f\left(a,\frac{c+d}{2}\right) + 16f\left(\frac{a+b}{2},\frac{c+d}{2}\right) + 4f\left(b,\frac{c+d}{2}\right) \\
&\quad + f(a,d) + 4f\left(\frac{a+b}{2},d\right) + f(b,d)\Big]
\end{aligned}
$$

**注**：高维积分（$d\ge 3$）时，一维公式直接张量积会导致**维度灾难**（节点数随 $n^d$ 增长）。此时需采用改进方法。

---

## 复杂度与方法对比总表

| 积分类型 | 推荐方法 | 核心优势 | 主要限制 |
| :--- | :--- | :--- | :--- |
| 光滑函数，有限区间 | Gauss-Legendre | $2n-1$ 代数精度，节点少 | 需预计算节点权重 |
| 端点 $1/\sqrt{1-x^2}$ 奇异 | Gauss-Chebyshev | 节点闭式，权重相等 | 特定权函数 |
| 半无限区间 + $\mathrm{e}^{-x}$ | Gauss-Laguerre | 天然处理无限域 | 需提取指数因子 |
| 全实轴 + $\mathrm{e}^{-x^2}$ | Gauss-Hermite | 量子力学/统计常用 | 需提取指数因子 |
| 高频振荡 ($\omega\gg 1$) | Filon 型/分段线性插值 | 误差与 $\omega$ 无关 | 需 $f(x)$ 低阶导数有界 |
| 代数奇异 ($x^{-\mu}$) | 奇异性消去 / 域分解 | 将奇异部分解析处理 | 需 Taylor 展开系数 |
| 无限区间一般函数 | 截断 + 渐进 / 变量替换 | 灵活通用 | 截断点选取需经验 |
| 局部剧烈变化 | 自适应求积 | 误差均匀分布，省节点 | 递归开销，实现复杂 |
| 矩形区域二重积分 | 累次 Simpson / Gauss | 利用一维公式直接推广 | 高维时维度灾难 |
