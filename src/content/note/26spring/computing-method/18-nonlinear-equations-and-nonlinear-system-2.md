---
title: '非线性方程及非线性方程组的解法（Newton 法，弦位法，Müller 法，非线性方程组）'
excerpt: '26 春 计算方法 L18'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '非线性方程'
- '非线性方程组'
pubDate: 'June 13 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Newton 法

### 数学基础

对非线性方程 $f(x)=0$，设 $x_k$ 是根 $x^*$ 的近似。将 $f(x)$ 在 $x_k$ 处作一阶 Taylor 展开：
$$
f(x) \approx f(x_k) + f'(x_k)(x - x_k)
$$

令右端为零解出下一个近似值，从而得到迭代格式：
$$
x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}, \quad k=0,1,2,\dots
$$

**几何意义**：$x_{k+1}$ 是曲线 $y=f(x)$ 在 $(x_k, f(x_k))$ 处切线与 $x$ 轴的交点。

### 收敛性分析

**定理**（Newton 法局部二阶收敛）：

设 $f(x)$ 二阶可导，$x^*$ 为单根（$f'(x^*)\neq 0$）。若初值 $x_0$ 充分接近 $x^*$，则 Newton 法收敛，且
$$
\lim_{k\to\infty} \frac{|x_{k+1}-x^*|}{|x_k-x^*|^2} = \left|\frac{f''(x^*)}{2f'(x^*)}\right|
$$

**证明**：

已知 Newton 迭代格式 $x_{k+1} = x_k - f(x_k)/f'(x_k)$，从而：
$$
x_{k+1} - x^* = (x_k - x^*) - \frac{f(x_k)}{f'(x_k)}
$$

只需消 $f(x_k)$。对 $f(x)$ 在 $x_k$ 处 Taylor 展开至二阶：
$$
f(x^*) = f(x_k) + (x^*-x_k)f'(x_k) + \frac{(x^*-x_k)^2}{2}f''(\xi_k)
$$

其中 $\xi_k$ 介于 $x_k$ 与 $x^*$ 之间。由 $f(x^*)=0$ 得：
$$
0 = f(x_k) + (x^*-x_k)f'(x_k) + \frac{(x^*-x_k)^2}{2}f''(\xi_k)
$$

代入 ：
$$
x_{k+1} - x^* = \frac{f''(\xi_k)}{2f'(x_k)}(x_k - x^*)^2
$$

令 $k\to\infty$，则 $\xi_k \to x^*$，即得二阶收敛常数 $c = |f''(x^*)/2f'(x^*)|$。

### 重根情况

若 $x^*$ 为 $m$ 重根（$m>1$），即 $f'(x^*) = 0,\; f''(x^*) = 0,\; \dots,\; f^{(m-1)}(x^*) = 0$。
此时收敛阶退化为 $1$，不再具有平方收敛。且误差满足：
$$
\frac{e_{k+1}}{e_k} \to 1 - \frac{1}{m}
$$

**证明**：

本质上就是把函数差用 Taylor 转成误差。
$$
\begin{aligned}
\frac{e_{k+1}}{e_k}
&= 1 - \frac{f(x_k) - f(x^*)}{f'(x_k)(x_k - x^*)} \\
&= 1 - \frac{\displaystyle \frac{1}{m!} f^{(m)}(\xi_k)(x_k - x^*)^m}
{\displaystyle \frac{1}{(m-1)!} f^{(m)}(\eta_k)(x_k - x^*)^{m-1} \cdot (x_k - x^*)} \\
&= 1 - \frac{f^{(m)}(\xi_k)}{m f^{(m)}(\eta_k)}
\end{aligned}
$$

其中 $\xi_k$ 和 $\eta_k$ 为介于 $x_k$ 与 $x^*$ 的两个数。取极限即证。

**改善策略一**（需预知重数 $m$）：

将迭代式改为：
$$
x_{k+1} = x_k - m\frac{f(x_k)}{f'(x_k)}
$$

此时误差比趋于 $0$，恢复二阶收敛。

**改善策略二**（无需预知重数 $m$）：

构造辅助函数 $h(x) = f(x)/f'(x)$，则 $x^*$ 必为 $h(x)$ 的单根。对 $h(x)$ 应用 Newton 法：

$$
x_{k+1} = x_k - \frac{h(x_k)}{h'(x_k)} = x_k - \frac{f(x_k)f'(x_k)}{[f'(x_k)]^2 - f(x_k)f''(x_k)}
$$

**注**：策略二需计算二阶导数，每步代价更高，但适用于重数未知场景。

### 阻尼 Newton 法

Newton 法对初值非常敏感。可以采用如下 阻尼 Newton 法改善。引入步长参数 $\alpha_k \in (0,1]$，考虑迭代格式：
$$
x_{k+1} = x_k - \alpha_k \frac{f(x_k)}{f'(x_k)}
$$

选择 $\alpha_k$ 使得 $|f(x_{k+1})| < |f(x_k)|$ 严格成立，强制函数值单调下降，扩大有效收敛域。

**注**：$\alpha_k$ 可通过线搜索确定，从 $\alpha=1$ 开始折半直至满足下降条件。

### 算法实现

**标准 Newton 法**：

```python
def newton(f, fp, x0, eps=1e-14, max_iter=100):
    x = x0
    for k in range(max_iter):
        fx = f(x)
        if abs(fx) < eps:          # 函数值收敛
            return x, k
        dfx = fp(x)
        if abs(dfx) < eps:         # 导数过零，失败
            raise ValueError("Derivative too small")
        x_new = x - fx / dfx
        if abs(x_new - x) < eps:   # 自变量收敛
            return x_new, k+1
        x = x_new
    return x, max_iter
```

**阻尼 Newton 法**：

```python
def damped_newton(f, fp, x0, eps=1e-14, max_iter=100):
    x = x0
    for k in range(max_iter):
        fx = f(x)
        dfx = fp(x)
        alpha = 1.0
        while alpha > 1e-10:
            x_new = x - alpha * fx / dfx
            if abs(f(x_new)) < abs(fx):
                break
            alpha *= 0.5
        if abs(x_new - x) < eps:
            return x_new, k+1
        x = x_new
    return x, max_iter
```

**注**：实际实现中，可用 $|f(x)|$ 或 $|x_{k+1}-x_k|$ 作为停机准则；对于多根问题，建议结合二分法提供稳健初值。

---

## 弦位法

### 双点弦位法

**核心思想**：

避免计算导数 $f'(x_k)$，用差商代替：
$$
f'(x_k) \approx \frac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}
$$

代入 Newton 迭代格式得双点弦位法：
$$
x_{k+1} = x_k - \frac{x_k - x_{k-1}}{f(x_k) - f(x_{k-1})} f(x_k)
$$

**几何意义**：过 $(x_{k-1},f(x_{k-1}))$ 与 $(x_k,f(x_k))$ 的割线与 $x$ 轴交点。故又称割线法。

### 双点弦位法收敛性

**定理**：

设 $f$ 在 $x^*$ 邻域内二阶可导且 $f'(x^*)\neq 0$。若 $x_0,x_1$ 充分接近 $x^*$，则双点弦位法收敛，收敛阶为：
$$
p = \frac{1+\sqrt{5}}{2} \approx 1.618
$$

且：
$$
\lim_{k\to\infty} \frac{x^*-x_{k+1}}{(x^*-x_k)^p} = \left|\frac{f''(x^*)}{2f'(x^*)}\right|^{p-1}
$$

**证明**：

割线 $s_k(x)$ 满足 $s_k(x_k)=f(x_k)$，$s_k(x_{k-1})=f(x_{k-1})$，且 $s_k(x_{k+1})=0$：
$$
s_k(x) = f(x_k) + (x-x_k)\frac{f(x_k)-f(x_{k-1})}{x_k-x_{k-1}}
$$

由于割线本质是一种线性插值，利用插值余项：
$$
f(x) - s_k(x) = \frac{1}{2}(x-x_k)(x-x_{k-1})f''(\xi_k)
$$

令 $x=x^*$ 并结合中值定理，可得误差递推：
$$
x_{k+1}-x^* = (x_k-x^*)(x_{k-1}-x^*) \frac{f''(\xi_k)}{2s'(\omega_k)}
$$

假设 $\lim \frac{|x^*-x_{k+1}|}{|x^*-x_k|^p} = c$，代入递推关系得特征方程 $p^2 = p+1$，解得 $p=(1+\sqrt{5})/2$。

### 双点弦位法算法实现

```python
def secant(f, x0, x1, eps=1e-14, max_iter=100):
    f0, f1 = f(x0), f(x1)
    for k in range(max_iter):
        if abs(f1 - f0) < eps:
            raise ValueError("Denominator too small")
        x2 = x1 - (x1 - x0) / (f1 - f0) * f1
        if abs(x2 - x1) < eps:
            return x2, k+1
        x0, f0 = x1, f1
        x1, f1 = x2, f(x2)
    return x1, max_iter
```

### 单点弦位法

**核心思想**：

固定一个端点 $x_0$，仅用 $(x_0,f(x_0))$ 与 $(x_k,f(x_k))$ 构造割线：
$$
x_{k+1} = x_k - \frac{x_k - x_0}{f(x_k) - f(x_0)} f(x_k)
$$

### 单点弦位法收敛性

**定理**：

在相同光滑性假设下，单点弦位法收敛阶为 $p=1$（线性收敛），且：
$$
\lim_{k\to\infty} \frac{x^*-x_{k+1}}{x^*-x_k} = \frac{f''(x^*)}{2f'(x^*)}(x_0-x^*)
$$

### 单点弦位法算法实现

```python
def single_point_secant(f, x0, x1, eps=1e-14, max_iter=100):
    f0 = f(x0)
    for k in range(max_iter):
        f1 = f(x1)
        if abs(f1 - f0) < eps:
            raise ValueError("Denominator too small")
        x2 = x1 - (x1 - x0) / (f1 - f0) * f1
        if abs(x2 - x1) < eps:
            return x2, k+1
        x1 = x2
    return x1, max_iter
```

### 方法对比

| 方法 | 每步函数值计算 | 需导数 | 收敛阶 | 超线性收敛 |
| :--- | :--- | :--- | :--- | :--- |
| Newton | 1 次函数 + 1 次导数 | 是 | 2 | 是 |
| 双点弦位 | 1 次函数 | 否 | $\frac{1+\sqrt{5}}{2}$ | 是 |
| 单点弦位 | 1 次函数 | 否 | 1 | 否 |

**注**：
双点弦位法以略低于 Newton 法的收敛阶，换取了免求导数的便利，在导数计算代价高昂时适用。

---

## Müller 法

### 方法简介

将弦位法（两点线性插值）推广至**三点二次插值**。
给定当前三个近似值 $(x_{k-2},x_{k-1},x_k)$，构造 Lagrange 二次多项式 $L_k(x)$ 并求其根作为 $x_{k+1}$。

为便于计算，引入比例参数：
$$
\lambda_k = \frac{x_k - x_{k-1}}{x_{k-1} - x_{k-2}}, \quad x_{k+1} = x_k + \lambda_{k+1}(x_k - x_{k-1})
$$

将 $L_k(x_{k+1})=0$ 整理为关于 $\lambda_{k+1}$ 的二次方程：
$$
a\lambda_{k+1}^2 + b\lambda_{k+1} + c = 0
$$

其中系数：
$$
\begin{aligned}
a &= f(x_{k-2})\lambda_k^2 - f(x_{k-1})\lambda_k(1+\lambda_k) + f(x_k)\lambda_k \\
b &= f(x_{k-2})\lambda_k^2 - f(x_{k-1})(1+\lambda_k)^2 + f(x_k)(2\lambda_k+1) \\
c &= f(x_k)(1+\lambda_k)
\end{aligned}
$$

**根的选择**：选取绝对值较小的 $\lambda_{k+1}$，保证新点更接近当前点。

**注**：若二次方程无实根，可改用 $x = ay^2+by+c$ 形式的横向抛物线（以 $y$ 为自变量），确保与 $x$ 轴必有交点。

### 收敛性

两种 Müller 法（纵向/横向抛物线）的收敛率均为 $p \approx 1.839$，介于双点弦位法（$1.618$）与 Newton 法（$2$）之间。

---

## 非线性方程组的解法

### Newton 迭代法

将单变量 Newton 法推广至 $n$ 维非线性方程组：
$$
\boldsymbol{f}(\boldsymbol{x}) = \boldsymbol{0}, \quad \boldsymbol{f}:\mathbb{R}^n \to \mathbb{R}^n
$$

对 $\boldsymbol{f}(\boldsymbol{x})$ 在 $\boldsymbol{x}^{(0)}$ 处作一阶 Taylor 展开（向量形式）：
$$
\boldsymbol{f}(\boldsymbol{x})
\approx \boldsymbol{f}(\boldsymbol{x}^{(0)})
+ \boldsymbol{J}(\boldsymbol{x}^{(0)})(\boldsymbol{x}
- \boldsymbol{x}^{(0)})
$$

其中 $\boldsymbol{J}$ 为 **Jacobian 矩阵**：
$$
\boldsymbol{J}_{ij} = \frac{\partial f_i}{\partial x_j}
$$

令线性近似为零，得到 Newton 迭代格式：
$$
\boldsymbol{J}(\boldsymbol{x}^{(k)})\Delta\boldsymbol{x}^{(k)} = -\boldsymbol{f}(\boldsymbol{x}^{(k)})
$$

$$
\boldsymbol{x}^{(k+1)} = \boldsymbol{x}^{(k)} + \Delta\boldsymbol{x}^{(k)}
$$

### 非线性方程组算法实现

```python
import numpy as np
from scipy.linalg import solve

def newton_system(f, J, x0, eps=1e-10, max_iter=50):
    x = np.array(x0, dtype=float)
    for k in range(max_iter):
        fx = f(x)
        if np.linalg.norm(fx, ord=np.inf) < eps:
            return x, k
        Jx = J(x)
        dx = solve(Jx, -fx)      # 解线性方程组 J·dx = -f
        x = x + dx
        if np.linalg.norm(dx, ord=np.inf) < eps:
            return x, k+1
    return x, max_iter
```

**注**：
每步迭代需计算 $n^2$ 个偏导数并求解 $n$ 维线性方程组，时间复杂度 $O(n^3)$。

### 与优化问题的联系

多变量标量函数 $\phi(\boldsymbol{x})$ 的极值问题对应求驻点：
$$
\nabla\phi(\boldsymbol{x}) = \boldsymbol{0}
$$

这正是一个非线性方程组。Newton 法在此对应于利用 Hessian 矩阵的优化迭代：
$$
\boldsymbol{H}(\boldsymbol{x}^{(k)})\Delta\boldsymbol{x}^{(k)} = -\nabla\phi(\boldsymbol{x}^{(k)})
$$

**注**：
极值点需进一步判断 Hessian 的正定性（极小值要求 $\boldsymbol{H}\succ 0$，极大值要求 $\boldsymbol{H}\prec 0$）。

---

## 拓展：Halley 迭代法

Halley 法利用二阶导数信息获得更高收敛阶。将 $f(x)$ 在 $x_k$ 处展开至二阶：
$$
0 = f(x_k) + (x_{k+1}-x_k)f'(x_k) + \frac{1}{2}(x_{k+1}-x_k)^2 f''(x_k)
$$

解此二次方程，并选择使分母绝对值更大的符号，得：
$$
x_{k+1} = x_k - \frac{2f(x_k)}{f'(x_k) \pm \sqrt{[f'(x_k)]^2 - 2f(x_k)f''(x_k)}}
$$

等价地，可通过构造有理函数 $R(x) = \frac{a-x}{bx+c}$ 与 $f(x)$ 在 $x_k$ 处函数值、一阶及二阶导数均匹配，导出更常用的迭代格式：
$$
x_{k+1} = x_k - \frac{2f(x_k)f'(x_k)}{2[f'(x_k)]^2 - f(x_k)f''(x_k)}
$$

**注**：
Halley 法达到**三阶收敛**，但每次迭代需计算 $f, f', f''$ 三个值。

---

## 拓展：快速平方根求解法

### 背景

```cpp
float InvSqrt(float x) {
    float xhalf = 0.5f * x;
    int i = *(int *)&x;
    i = 0x5f3759df - (i >> 1);
    x = *(float *)&i;
    x = x * (1.5f - xhalf*x*x);
    return x;
}
```

上述经典代码 `InvSqrt` 用于快速计算 $1/\sqrt{x}$，其核心由两部分组成：

1. **魔法初始猜测**：利用 IEEE 754 单精度浮点数的位运算给出极佳初值
2. **一次 Newton 迭代**：优化结果

### 数学原理

定义 $f(y) = \frac{1}{y^2} - x$，求 $f(y)=0$ 的正根即 $y = 1/\sqrt{x}$。

Newton 迭代格式：
$$
y_{k+1} = y_k - \frac{f(y_k)}{f'(y_k)} = y_k - \frac{1/y_k^2 - x}{-2/y_k^3} = \frac{1}{2}y_k(3 - xy_k^2)
$$

代码中 `x = x * (1.5f - xhalf*x*x)` 正是此迭代的一步。

### IEEE 浮点技巧

单精度浮点数存储为：
$$
x = (1+M)\cdot 2^{E-127}, \quad M\in[0,1)
$$

对 $x>0$（符号位 $s=0$），有：
$$
y = \frac{1}{\sqrt{x}} = \frac{1}{\sqrt{1+M}} \cdot 2^{-(E-127)/2}
$$

将 $x$ 的 32 位整数表示右移 1 位，再用常数 `0x5f3759df` 减去，本质是在对指数和尾数同时进行线性近似，得到相对误差极小的 $y_0$。

**注**：
该常数通过最小化最大相对误差 $\max_{M\in[0,1)} |\varepsilon_0(M,R)|$ 优化得到，最优参数约为 $R_1=190, R_2=0.45$（对应十六进制即 `0x5f3759df`）。

---

## 方法总览与选取指南

| 方法 | 每步代价 | 收敛阶 | 需导数 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| 二分法 | 1 次函数 | 1 | 否 | 仅需连续性，求单根，稳健但慢 |
| 单点弦位 | 1 次函数 | 1 | 否 | 导数难求，端点固定 |
| 双点弦位 | 1 次函数 | 1.618 | 否 | 导数难求，追求超线性收敛 |
| Müller | 1 次函数 | 1.839 | 否 | 需复根或三点信息 |
| Newton | 1 函数 + 1 导数 | 2 | 是 | 光滑函数，导数易求，初值好 |
| 阻尼 Newton | 1 函数 + 1 导数 + 线搜索 | 2 | 是 | 标准 Newton 发散时扩大收敛域 |
| Halley | 1 函数 + 2 导数 | 3 | 是（二阶） | 高光滑度，追求极速收敛 |
| 非线性方程组 Newton | 1 函数 + Jacobian | 2 | 是（偏导） | 多维非线性方程组 |

**注**：
对于工程问题，建议先以二分法或弦位法确定根的大致区间，再切换至 Newton 法精化。
