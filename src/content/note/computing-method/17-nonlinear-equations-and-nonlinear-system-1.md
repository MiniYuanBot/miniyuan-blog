---
title: '非线性方程及非线性方程组的解法（二分法，不动点迭代法，迭代的加速方法）'
excerpt: '26 春 计算方法 L17'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '非线性方程'
- '非线性方程组'
pubDate: 'June 12 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 问题简介

非线性方程 $f(x)=0$ 的数值求解是科学计算的核心问题之一，其通常不存在闭式解，需借助区间收缩或不动点迭代等方法来逼近根。

**定义**（根与重根）：

若存在 $x^{*}$ 使得 $f(x^{*})=0$，则称 $x^{*}$ 为方程的根或零点。若 $f(x)$ 可分解为：
$$
f(x)=(x-x^{*})^{m}g(x),\quad g(x^{*})\neq 0
$$
其中 $m$ 为正整数，则称 $x^{*}$ 为方程的 $m$ 重根。

**定理**（根的存在性定理）：

设 $f(x)\in C[a,b]$ 且 $f(a)\cdot f(b) \lt 0$，则方程 $f(x)=0$ 在 $(a,b)$ 内至少存在一个根。

---

## 二分法

### 数学基础

二分法基于根的存在性定理来进行区间收缩，通过不断将含根区间对半分割，并以区间中点作为根的近似。

### 算法实现

```python
fa = f(a)

while b - a > EPS:
    p = a + (b - a) / 2.0    # 中点（避免 a+b 溢出）
    fp = f(p)
    if fp == 0:
        return p
    if fa * fp < 0:          # 符号与 f(a) 相反
        b = p
    else:
        a = p
        fa = fp

res = a + (b - a) / 2.0
```

### 稳定性与复杂度分析

**稳定性**：

二分法的误差随区间长度线性减小，属于**稳定算法**。
但终止条件 $|b_n-a_n| \lt \varepsilon$ 受浮点精度限制，若 $\varepsilon$ 过小会导致无限循环。
一般选取：
$$
\varepsilon = \max\{|a|,|b|\}\cdot 2\varepsilon_{\mathrm{mach}}
$$
其中 $\varepsilon_{\mathrm{mach}}$ 为机器精度，IEEE 754 双精度下 $\varepsilon_{\mathrm{mach}}\approx 2.22\times 10^{-16}$。

**复杂度分析**：

| 指标 | 结果 | 说明 |
| :--- | :--- | :--- |
| **时间复杂度** | $O\!\left(\log_2\frac{b-a}{\varepsilon}\right)$ | 迭代区间减半 1 次需 1 次函数求值 |
| **空间复杂度** | $O(1)$ | 仅存储端点与中点 |

**注**：
二分法对函数要求极低（连续性），但收敛速度仅为线性，且**无法处理偶数重根**。

---

## 不动点迭代法

### 数学基础

**定义**（不动点）：

对于函数 $\varphi(x)$，若 $x^{*}=\varphi(x^{*})$，则称 $x^{*}$ 为 $\varphi$ 的不动点。

构造迭代格式：
$$
x_{k+1}=\varphi(x_k),\quad k=0,1,2,\dots
$$
该格式仅依赖前一步 $x_k$，故为单步法；右端不含 $x_{k+1}$，故为显式算法。

**注**：将 $f(x)=0$ 等价改写为 $x=\varphi(x)$ 的方式不唯一，不同方式的效果不同。

### 全局收敛的必要条件

**定理**（不动点存在唯一性与收敛性）：

设 $\varphi(x)\in C^1[a,b]$ 且满足

1. **封闭性**（closure）：$\forall x\in[a,b],\; \varphi(x)\in[a,b]$；
2. **压缩性**（contraction）：$\exists\, L\in[0,1),\; \text{s.t.}\; |\varphi'(x)|\le L,\; \forall x\in[a,b]$。

则：

1. $\varphi$ 在 $[a,b]$ 上存在唯一不动点 $x^{*}$；
2. $\forall x_0\in[a,b]$，迭代序列 $\{x_k\},\; x_{k+1}=\varphi(x_k)$ 均收敛到 $x^{*}$；
3. $\displaystyle\lim_{k\to\infty}\frac{x_{k+1}-x^{*}}{x_k-x^{*}}=\varphi'(x^{*})$。

**证明**：

- **存在性**：
    构造 $h(x)=\varphi(x)-x$。
    由封闭性：
    $$
    h(a)=\varphi(a)-a\ge 0,\quad h(b)=\varphi(b)-b\le 0
    $$

    因 $h\in C[a,b]$，根据介值定理，$\exists x^{*}\in[a,b]$ 使 $h(x^{*})=0$，即 $x^{*}=\varphi(x^{*})$。

- **唯一性**：
    假设存在两个不动点 $x_1, x_2\in[a,b]$。由微分中值定理，
    $$
    |x_1-x_2|=|\varphi(x_1)-\varphi(x_2)|=|\varphi'(\xi)|\cdot|x_1-x_2|\le L|x_1-x_2|
    $$
    因 $L \lt 1$，必有 $|x_1-x_2|=0$，即 $x_1=x_2$。

- **收敛性与渐近误差常数**：
    反复应用中值定理，
    $$
    |x_k-x^{*}|=|\varphi(x_{k-1})-\varphi(x^{*})|\le L|x_{k-1}-x^{*}|\le\cdots\le L^k|x_0-x^{*}|
    $$
    故 $k\to\infty$ 时 $x_k\to x^{*}$。再由中值定理，$\exists \xi_k$ 介于 $x_k$ 与 $x^{*}$ 之间，使得
    $$
    \frac{x_{k+1}-x^{*}}{x_k-x^{*}}=\frac{\varphi(x_k)-\varphi(x^{*})}{x_k-x^{*}}=\varphi'(\xi_k)
    $$
    令 $k\to\infty$，由 $\xi_k\to x^{*}$ 及 $\varphi'$ 的连续性，得极限为 $\varphi'(x^{*})$。

### 局部收敛的充要条件

**定理**（不动点迭代的局部收敛性判别）：

设 $x^{*}$ 为 $\varphi$ 的不动点，且 $\varphi$ 在 $x^{*}$ 的某邻域内连续可微。则：

1. **收敛**：
    若 $|\varphi'(x^{*})|<1$，则存在 $x^{*}$ 的邻域 $U$，使得 $\forall x_0\in U$，迭代序列 $\{x_k\},\; x_{k+1}=\varphi(x_k)$ 均收敛到 $x^{*}$，且
    $$
    \lim_{k\to\infty}\frac{x_{k+1}-x^{*}}{x_k-x^{*}}=\varphi'(x^{*})
    $$

2. **发散**：
    若 $|\varphi'(x^{*})|>1$，则存在 $x^{*}$ 的邻域 $U$，使得 $\forall x_0\in U$ 且 $x_0\neq x^{*}$，迭代序列 $\{x_k\}$ 不收敛到 $x^{*}$，且 $|x_{k+1}-x^{*}|>|x_k-x^{*}|$。

3. **临界**：
    若 $|\varphi'(x^{*})|=1$，收敛性不确定，需通过 $\varphi$ 的更高阶导数以及具体结构判断。

**证明**：

**情形 1（$|\varphi'(x^{*})|<1$）**：

由连续性，存在 $\delta>0$ 和 $L\in[0,1)$，使得
$$
|\varphi'(x)|\le L,\quad \forall x\in U=[x^{*}-\delta,\,x^{*}+\delta]
$$
对任意 $x\in U$，由中值定理：
$$
|\varphi(x)-x^{*}|=|\varphi'(\xi)|\cdot|x-x^{*}|\le L|x-x^{*}|<\delta
$$
故 $\varphi(x)\in U$，即封闭性成立。从而可知收敛。

**情形 2（$|\varphi'(x^{*})|>1$）**：

由连续性，存在 $\delta>0$ 和 $L>1$，使得
$$
|\varphi'(x)|\ge L,\quad \forall x\in U=[x^{*}-\delta,\,x^{*}+\delta]
$$
对任意 $x_0\in U$ 且 $x_0\neq x^{*}$，由中值定理：
$$
|x_1-x^{*}|=|\varphi(x_0)-\varphi(x^{*})|=|\varphi'(\xi_0)|\cdot|x_0-x^{*}|\ge L|x_0-x^{*}|>|x_0-x^{*}|
$$
故不收敛。

### 误差估计

**定理**（先验与后验误差估计）：

在[全局收敛的必要条件](#全局收敛的必要条件)中的条件下，有先验估计：
$$
|x_k-x^{*}|\le\frac{L^k}{1-L}|x_1-x_0|
$$

以及后验估计：
$$
|x_k-x^{*}|\le\frac{1}{1-L}|x_{k+1}-x_k|
$$

**证明**：

对任意正整数 $p$，利用三角不等式与压缩性：
$$
|x_{k+p}-x_k|\le\sum_{i=1}^{p}|x_{k+i}-x_{k+i-1}|\le(L^{k+p-1}+\cdots+L^k)|x_1-x_0|=\frac{L^k(1-L^p)}{1-L}|x_1-x_0|
$$
令 $p\to\infty$ 即得先验估计。同理，
$$
|x_{k+p}-x_k|\le(L^{p-1}+\cdots+1)|x_{k+1}-x_k|=\frac{1-L^p}{1-L}|x_{k+1}-x_k|
$$
令 $p\to\infty$ 即得后验估计。

**注**：后验估计表明，当相邻两次迭代值之差足够小时，真实误差也足够小，可用于停机判断。

### 算法实现

```python
x = x0
res = None

for _ in range(N):
    x_new = phi(x)
    if abs(x_new - x) < EPS:
        res = x_new
        break
    x = x_new
```

### 收敛阶与误差分析

**定义**（收敛阶）：

设 $\lim_{k\to\infty}x_k=x^{*}$，记 $e_k=x_k-x^{*}$。若存在实数 $p\ge 1$ 及常数 $c\neq 0$，使得
$$
\lim_{k\to\infty}\frac{|e_{k+1}|}{|e_k|^p}=c
$$
则称序列 $\{x_k\}$ 为 $p$ 阶收敛。特别地：

- $p=1,\; 0 \lt c \lt 1$：线性收敛；
- $p=2$：平方收敛；
- $p=1,\; c=0$：超线性收敛。

**定理**（高阶收敛判据）：

设迭代函数 $\varphi(x)$ 满足：

1. $x^{*}=\varphi(x^{*})$，且在 $x^{*}$ 附近有 $p$ 阶连续导数；
2. $\varphi'(x^{*})=\varphi''(x^{*})=\cdots=\varphi^{(p-1)}(x^{*})=0$；
3. $\varphi^{(p)}(x^{*})\neq 0$。

则不动点迭代为 $p$ 阶收敛，且
$$
\lim_{k\to\infty}\frac{e_{k+1}}{e_k^p}=\frac{\varphi^{(p)}(x^{*})}{p!}
$$

**证明**：

对 $\varphi(x_k)$ 在 $x^{*}$ 处作 Taylor 展开：
$$
\varphi(x_k)
=\varphi(x^{*})+\sum_{j=1}^{p-1}\frac{\varphi^{(j)}(x^{*})}{j!}e_k^j+\frac{\varphi^{(p)}(\xi)}{p!}e_k^p
=\varphi(x^{*})+\frac{\varphi^{(p)}(\xi)}{p!}e_k^p
$$
其中 $\xi$ 介于 $x_k$ 与 $x^{*}$ 之间。于是：
$$
\frac{e_{k+1}}{e_k^p}
=\frac{\varphi(x_k)-\varphi(x^{*})}{e_k^p}=\frac{\varphi^{(p)}(\xi)}{p!}
$$
令 $k\to\infty$，由 $\xi\to x^{*}$ 得证。

**注**：也即高阶导数为 0 会带来更高阶的收敛性，这也是下面迭代加速法的基本思想。

---

## 迭代加速方法

### 松弛法

**思想**：

从 $x=\varphi(x)$ 出发，引入参数 $\lambda$ 构造等价形式
$$
x=\frac{\lambda}{1+\lambda}x+\frac{1}{1+\lambda}\varphi(x)\equiv\psi(x)
$$
其导数为
$$
\psi'(x)=\frac{\lambda+\varphi'(x)}{1+\lambda}
$$
若选取 $\lambda$ 使 $|\psi'(x)| \lt |\varphi'(x)|$，则新格式收敛更快。理论上最优 $\lambda=-\varphi'(x^{*})$。
但 $x^{*}$ 未知，故以当前迭代值近似：
$$
\lambda_k=-\varphi'(x_k),\qquad \omega_k=\frac{1}{1+\lambda_k}
$$
得到**松弛迭代格式**：
$$
x_{k+1}=(1-\omega_k)x_k+\omega_k\varphi(x_k)
$$

### 松弛法算法实现

```python
x = x0
res = None

for k in range(N):
    lamb = -dphi(x)
    omega = 1.0 / (1.0 + lamb)
    x_new = (1 - omega) * x + omega * phi(x)
    if abs(x_new - x) < EPS:
        res = x_new
        break
    x = x_new
```

**注**：松弛法需额外计算 $\varphi'(x)$，适用于导数易求的情形。

### Steffensen 法

**思想**：

若原序列 $\{x_k\}$ 线性收敛，当 $k$ 充分大时近似有
$$
\frac{x_{k+2}-x^{*}}{x_{k+1}-x^{*}}\approx\frac{x_{k+1}-x^{*}}{x_k-x^{*}}
$$
交叉相乘解出 $x^{*}$ 的近似：
$$
x^{*}\approx x_k-\frac{(x_{k+1}-x_k)^2}{x_{k+2}-2x_{k+1}+x_k}
$$

**定义**（差分算子）：

- 向前差分：$\Delta x_k = x_{k+1}-x_k$
- 二阶差分：$\Delta^2 x_k = \Delta(\Delta x_k)=x_{k+2}-2x_{k+1}+x_k$

**定义**（Aitken 加速序列）：
$$
\hat{x}_k = x_k-\frac{(\Delta x_k)^2}{\Delta^2 x_k}=x_k-\frac{(x_{k+1}-x_k)^2}{x_{k+2}-2x_{k+1}+x_k}
$$

**Steffensen 法**：

使用 Aitken 加速序列来进行不动点迭代就是 Steffensen 法。也即令：
$$
x_{k+1}=x_k-\frac{(\varphi(x_k)-x_k)^2}{\varphi(\varphi(x_k))-2\varphi(x_k)+x_k}
$$
等价于使用新的迭代函数：
$$
\hat{\varphi}(x)=\frac{x\varphi(\varphi(x))-\varphi^2(x)}{\varphi(\varphi(x))-2\varphi(x)+x}
$$

**验证正确性**：

由 L'Hôpital 法则可得：
$$
\begin{aligned}
\lim_{x\to x^{*}}\hat{\varphi}(x)
&=\lim_{x\to x^{*}}
\frac{\varphi(\varphi(x))+x\varphi'(\varphi(x))\varphi'(x)-2\varphi(x)\varphi'(x)}
{\varphi'(\varphi(x))\varphi'(x)-2\varphi'(x)+1} \\
&=\frac{x^{*}+x^{*}(\varphi'(x^{*}))^2-2x^{*}\varphi'(x^{*})}{(\varphi'(x^{*}))^2-2\varphi'(x^{*})+1} \\
&=\frac{x^{*}(1-\varphi'(x^{*}))^2}{(1-\varphi'(x^{*}))^2} \\
&=x^{*}
\end{aligned}
$$
故 $x^{*}$ 仍为 $\hat{\varphi}$ 的不动点。

### Steffensen 法算法实现

```python
x = x0
res = None

for k in range(N):
    x1 = phi(x)
    x2 = phi(x1)
    denom = x2 - 2*x1 + x
    if abs(denom) < 1e-15:
        res = x
        break
    x_new = x - (x1 - x)**2 / denom
    if abs(x_new - x) < eps:
        res = x_new
        break
    x = x_new
```

**注**：Steffensen 法无需计算导数，每步仅需两次 $\varphi$ 求值，即可将线性收敛提升为**平方收敛**。

## Ramanujan 迭代法

### 数学基础

Ramanujan 迭代法是通过幂级数系数递推求**模最小根**的方法。

考虑方程：
$$
f(x)=1-(a_1x+a_2x^2+\cdots)=0
$$

对 $[1-\sum_{n=1}^{\infty}a_n x^n]^{-1}=\sum_{n=0}^{\infty}b_n x^n$ 比较系数，得到递推关系：
$$
b_0=1,\qquad b_n=\sum_{i=1}^{n}a_i b_{n-i}\quad(n\ge 1)
$$
不加证明地指出，若极限 $\lim_{n\to\infty}b_n/b_{n+1}=c$ 存在，则 $c$ 即为 $f(x)=0$ 的模最小根。

### 算法实现

```python
def ramanujan(coeffs, max_n):
    """
    coeffs: list [a_1, a_2, ..., a_m]
    返回序列 b 以及近似根序列 b[n-1]/b[n]
    """
    b = [1.0]  # b_0
    roots = []
    for n in range(1, max_n + 1):
        bn = 0.0
        for i in range(1, min(n, len(coeffs)) + 1):
            bn += coeffs[i-1] * b[n - i]
        b.append(bn)
        if n >= 1 and abs(bn) > 1e-15:
            roots.append(b[n-1] / bn)
    return b, roots
```

---

## 方法对比与复杂度总表

| 方法 | 收敛条件 | 收敛阶 | 时间复杂度/步 | 空间复杂度 |
| :--- | :--- | :--- | :--- | :--- |
| 二分法 | $f\in C[a,b],\,f(a)f(b) \lt 0$ | 线性 $p=1$ | $O(\log(1/\varepsilon))$ | $O(1)$ |
| 不动点迭代 | $\varphi$ 压缩映射 | 线性 $p=1$ | $O(\log(1/\varepsilon))$ | $O(1)$ |
| 松弛法 | $\varphi'$ 存在且连续 | 线性（加速） | $O(\log(1/\varepsilon))$ | $O(1)$ |
| Steffensen | $\varphi\in C^2$ 附近 | 平方 $p=2$ | $O(\log\log(1/\varepsilon))$ | $O(1)$ |
| Ramanujan | 幂级数形式，模最小根唯一 | 线性 | $O(n^2)$ 递推 $n$ 项 | $O(n)$ |
