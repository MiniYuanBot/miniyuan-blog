---
title: '常微分方程初值问题的数值解法（Euler 方法, 常见单步法）'
excerpt: '26 春 计算方法 L19'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- 'ODE IVP'
pubDate: 'June 14 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 问题概述

考虑一阶常微分方程初值问题（IVP）：
$$
\begin{cases}
y'(x) = f(x, y(x)), & x \in [a, b] \\
y(a) = y_0
\end{cases}
$$

当无法求出显示解析解时，数值解法的核心思想是**将自变量离散化**：
$$
a = x_0 < x_1 < \cdots < x_N = b, \quad h = x_{k+1} - x_k
$$

并构造递推计算格式，由已知的 $(x_n, y_n)$ 逐步推进得到近似值 $y_{n+1} \approx y(x_{n+1})$。

---

## 数学基础

以下定义适用于一般数值格式 $y_{n+1} = G(y_{n+1}, y_n, \cdots, y_{n-k})$，其中 $y_n$ 为近似值，$y(x_n)$ 为准确值。

### 截断误差

**定义**（局部参考值）：

将计算格式中除 $y_{n+1}$ 自身外的所有历史值替换为准确值，即：
$$
\tilde{y}_{n+1} = G(\tilde{y}_{n+1}, y(x_n), \cdots, y(x_{n-k}))
$$

**定义**（局部截断误差）：

$$
l_{n+1} = y(x_{n+1}) - \tilde{y}_{n+1}
$$

描述**单步计算**引入的误差大小。

**定义**（总体截断误差）：

$$
e_{n+1} = y(x_{n+1}) - y_{n+1}
$$

描述**误差累积**导致的当前总偏差。

### 精度、相容性与稳定性

**定义**（精度阶数）：

若局部截断误差 $l_{n+1} = O(h^{p+1})$，则称该方法具有 **$p$ 阶精度**。

**定义**（相容性）：

若 $h \to 0$ 时局部截断误差趋于 $0$，则称方法**相容**。

**定义**（绝对稳定性）：

对模型方程 $y' = \lambda y\ (\lambda \in \mathbb{C})$，设数值方法的单步格式为：
$$
y_{n+1} = R(\lambda h)\, y_n
$$
若有：
$$
\bigl|R(\lambda h)\bigr| \leq 1
$$
则称该方法对 $h$ 与 $\lambda$ **绝对稳定**，并称
$$
\mathcal{S} = \bigl\{ z \in \mathbb{C} : \bigl|R(z)\bigr| \leq 1 \bigr\}
$$
为**绝对稳定区域**。

### 显式、隐式与单步、多步

**定义**（显式 / 隐式）：

若格式中 $G$ 不依赖 $y_{n+1}$，即：
$$
y_{n+1} = G(y_n, \cdots, y_{n-k})
$$

则称**显式方法**；反之，右端含 $y_{n+1}$ 需解方程的称为**隐式方法**。

**定义**（单步 / 多步）：

若 $k=0$，即格式仅依赖 $y_n$（及 $y_{n+1}$），则称**单步法**；若依赖更多历史值，则称**多步法**。

---

## Euler 方法

### 计算公式推导

Euler 方法的迭代格式为：
$$
y_{n+1} = y_n + h f(x_n, y_n), \quad n = 0, 1, \cdots, N-1
$$

**法一**（Taylor 展开）：

将 $y(x)$ 在 $x_n$ 处展开：
$$
y(x_{n+1}) = y(x_n) + h y'(x_n) + \frac{h^2}{2} y''(x_n) + O(h^3)
$$

代入 $y' = f(x, y)$，截断至线性项：
$$
y_{n+1} = y_n + h f(x_n, y_n), \quad n = 0, 1, \cdots, N-1
$$

**法二**（数值积分的左矩形公式）：

$$
y(x_{n+1}) - y(x_n) = \int_{x_n}^{x_{n+1}} f(\xi, y(\xi)) \, d\xi \approx h f(x_n, y(x_n))
$$

导出相同的迭代格式。

**注**：公式中 $y_n$ 是近似值，不可写成 $y(x_{n+1}) = y(x_n) + h f(x_n, y(x_n))$。

### 误差分析

**局部截断误差**：

由 Taylor 展开：
$$
y(x_{n+1}) = y(x_n) + h f(x_n, y(x_n)) + \frac{h^2}{2} y''(x_n) + O(h^3)
$$

对于显式 Euler 方法：
$$
y_{n+1} = y_n + h f(x_n, y_n)
$$

其局部参考值为：
$$
\tilde{y}_{n+1} = y(x_n) + h f(x_n, y(x_n))
$$

故：
$$
l_{n+1} = y(x_{n+1}) - \tilde{y}_{n+1} = \frac{h^2}{2} y''(x_n) + O(h^3) = O(h^2)
$$

从而 Euler 方法具有 1 阶精度。

**总体截断误差**：

假设 $f(x,y)$ 对 $y$ 满足 Lipschitz 条件，Lipschitz 常数为 $L$：
$$
|f(x, u) - f(x, v)| \leq L |u - v|
$$

则有总体误差递推：
$$
\begin{aligned}
|e_{n+1}| &= |y(x_{n+1}) - y_{n+1}| \\
&\leq |y(x_{n+1}) - \tilde{y}_{n+1}| + |\tilde{y}_{n+1} - y_{n+1}| \\
&\leq O(h^2) + |y(x_n) - y_n| + h|f(x_n, y(x_n)) - f(x_n, y_n)| \\
&\leq O(h^2) + (1 + hL)|e_n|
\end{aligned}
$$

反复递推得：
$$
\begin{aligned}
|e_{n+1}| &\leq O(h^2) \sum_{j=0}^{n} (1+hL)^j \\
&= O(h^2) \cdot \frac{(1+hL)^{n+1} - 1}{hL} \\
&= O(h) \cdot \frac{(1+hL)^{n+1} - 1}{L}
\end{aligned}
$$

由于 $(1+hL)^n \leq e^{nhL} = e^{L(x_n - x_0)} \leq e^{L(b-a)}$ 有界，因此：
$$
|e_{n+1}| = O(h)
$$

总体截断误差为 $O(h)$，比局部误差低一阶。

### 稳定性分析

对模型方程 $y' = \lambda y$，Euler 格式为：
$$
y_{n+1} = (1 + \lambda h) y_n
$$

绝对稳定要求误差不衰减：
$$
|1 + \lambda h| \leq 1
$$

当 $\lambda < 0$ 为实数时，稳定步长满足：
$$
h \leq -\frac{2}{\lambda}
$$

步长过大将导致数值不稳定。

### 算法实现

```python
def euler(f, a, b, y0, N):
    """
    显式 Euler 方法
    """
    h = (b - a) / (N - 1)
    x = a
    y = [0.0] * N
    y[0] = y0
    for i in range(1, N):
        y[i] = y[i-1] + h * f(x, y[i-1])
        x += h
    return y
```

**注**：若仅需终点值而非整条轨迹，可将 `y` 降为标量变量，空间复杂度降至 $O(1)$。

---

## 向后 Euler 方法

### 计算公式推导

将 $y(x)$ 在 $x_{n+1}$ 处反向 Taylor 展开：
$$
y(x_n) = y(x_{n+1}) - h y'(x_{n+1}) + \frac{h^2}{2} y''(x_{n+1}) + O(h^3)
$$

整理得 **向后 Euler 公式**：
$$
y_{n+1} = y_n + h f(x_{n+1}, y_{n+1})
$$

等价于用数值积分的右矩形公式近似 $\int_{x_n}^{x_{n+1}} f \, d\xi$。

### 隐式迭代求解

向后 Euler 公式需求解一个隐式方程，故采用迭代方式。以显式 Euler 提供初值：
$$
\begin{cases}
y_{n+1}^{(0)} = y_n + h f(x_n, y_n) \\
y_{n+1}^{(k+1)} = y_n + h f(x_{n+1}, y_{n+1}^{(k)}), \quad k = 0, 1, \cdots
\end{cases}
$$

**注**：

1. 上述只是 $x_n \to x_{n+1}$ 的一步迭代，直到隐式方程近似满足后再进行下一步迭代。
2. 实际实现中常设置最大迭代次数 `M` 与阈值 `eps` 双重退出条件。

### 收敛性分析

由
$$
|y_{n+1}^{(k+1)} - y_{n+1}^{(k)}|
= h |f(x_{n+1}, y_{n+1}^{(k)}) - f(x_{n+1}, y_{n+1}^{(k-1)})|
\leq hL |y_{n+1}^{(k)} - y_{n+1}^{(k-1)}|
$$
知，当 $0 < hL < 1$ 时迭代收敛。

### 误差与稳定性

Taylor 展开易证局部截断误差同样为 $O(h^2)$，即 **1 阶精度**。

对模型方程 $y' = \lambda y$：
$$
y_{n+1} = \frac{1}{1 - h\lambda} y_n
$$

绝对稳定条件：
$$
\frac{1}{|1 - h\lambda|} \leq 1
$$
也即 $\operatorname{Re}(\lambda) < 0$，故向后 Euler 在左半平面无条件绝对稳定。但需注意兼顾迭代收敛条件 $0 < hL < 1$。

### 算法实现

```python
def backward_euler(f, a, b, y0, N, M=100, eps=1e-10):
    """
    向后 Euler 方法
    """
    h = (b - a) / (N - 1)
    x = a
    y = [0.0] * N
    y[0] = y0
    for i in range(1, N):
        # 初始值：显式 Euler
        y[i] = y[i-1] + h * f(x, y[i-1])
        yt = y[i]
        for k in range(M):
            y[i] = y[i-1] + h * f(x + h, y[i])
            if abs(y[i] - yt) < eps:
                break
            yt = y[i]
        x += h
    return y
```

---

## 梯形公式

### 计算公式推导

将 Euler 与向后 Euler 取平均，或使用数值积分的梯形积分公式可得以下**梯形公式**：
$$
y_{n+1} = y_n + \frac{h}{2} \Big[ f(x_n, y_n) + f(x_{n+1}, y_{n+1}) \Big]
$$

为单步隐式方法。

### 隐式迭代求解

以显式 Euler 提供初值，迭代格式为：
$$
\begin{cases}
y_{n+1}^{(0)} = y_n + h f(x_n, y_n) \\
y_{n+1}^{(k+1)} = y_n + \dfrac{h}{2} \Big[ f(x_n, y_n) + f(x_{n+1}, y_{n+1}^{(k)}) \Big]
\end{cases}
$$

**注**：
上述也只是 $x_n \to x_{n+1}$ 的一步迭代，直到隐式方程近似满足后再进行下一步迭代。

### 收敛性分析

由
$$
|y_{n+1}^{(k+1)} - y_{n+1}^{(k)}| \leq \frac{hL}{2} |y_{n+1}^{(k)} - y_{n+1}^{(k-1)}|
$$

知，当 $0 < \dfrac{hL}{2} < 1$ 时收敛，步长限制比向后 Euler 放宽一倍。

### 误差分析

对 $y'(x)$ 在 $x_n$ 处 Taylor 展开：
$$
y'(x_n + t) = y'(x_n) + t y''(x_n) + \frac{t^2}{2} y'''(x_n) + O(t^3)
$$

精确积分：
$$
\int_{x_n}^{x_{n+1}} y'(x) \, dx
= h y'(x_n) + \frac{h^2}{2} y''(x_n) + \frac{h^3}{6} y'''(x_n) + O(h^4)
$$

梯形近似：
$$
\frac{h}{2} \Big[ y'(x_n) + y'(x_{n+1}) \Big]
= h y'(x_n) + \frac{h^2}{2} y''(x_n) + \frac{h^3}{4} y'''(x_n) + O(h^4)
$$

从而局部截断误差：
$$
\begin{aligned}
l_{n+1}
&= y(x_{n+1}) - \tilde{y}_{n+1} \\
&= \int_{x_n}^{x_{n+1}} y'(x) \, dx - \frac{h}{2} \Big[ y'(x_n) + y'(x_{n+1}) \Big]
+ \frac{h}{2} \Big[ y'(x_{n+1}) - f(x_{n+1}, \tilde{y}_{n+1}) \Big] \\
&= -\frac{h^3}{12} y'''(x_n) + O(h^4) + \frac{h}{2} \Big[ f(x_{n+1}, y(x_{n+1})) - f(x_{n+1}, \tilde{y}_{n+1}) \Big] \\
&\leq -\frac{h^3}{12} y'''(x_n) + O(h^4) + \frac{hL}{2} l_{n+1}
\end{aligned}
$$

也即：
$$
l_{n+1}\Big(1 + O(h)\Big) = -\frac{h^3}{12}y'''(x_n) + O(h^4)
$$

由于 $1/(1+O(h)) = 1 + O(h)$，所以：
$$
l_{n+1} = -\frac{h^3}{12}y'''(x_n) + O(h^4)
$$

梯形公式具有 2 阶精度。

**注**：可能不太严谨。进一步可证明其总体截断误差为 $O(h^2)$。

### 算法实现

```python
def trapezoidal(f, a, b, y0, N, M=100, eps=1e-10):
    """
    梯形公式
    """
    h = (b - a) / (N - 1)
    hh = h * 0.5
    x = a
    y = [0.0] * N
    y[0] = y0
    f0 = f(a, y0)          # 当前步 f(x_n, y_n)
    for i in range(1, N):
        # 初始值：显式 Euler
        y[i] = y[i-1] + h * f0
        yt = y[i]
        for k in range(M):
            f1 = f(x + h, y[i])
            y[i] = y[i-1] + hh * (f0 + f1)
            if abs(y[i] - yt) < eps:
                break
            yt = y[i]
        f0 = f(x + h, y[i])  # 为下一步缓存
        x += h
    return y
```

---

## 改进 Euler 方法

### 计算公式与推导

在梯形公式中，仅执行一次迭代，可以将隐式化为显式格式，也即**改进 Euler 方法**：
$$
y_{n+1} = y_n + \frac{h}{2} \Big[ f(x_n, y_n) + f\big(x_{n+1},\, y_n + h f(x_n, y_n)\big) \Big]
$$

记：
$$
\begin{cases}
k_1 = f(x_n, y_n) \\
k_2 = f(x_n + h,\, y_n + h k_1) \\
y_{n+1} = y_n + \dfrac{h}{2}(k_1 + k_2)
\end{cases}
$$

这其实是 2 阶 Runge-Kutta 方法的一种形式。

### 误差分析

由于：
$$
\begin{aligned}
\tilde{y}_{n+1}
&= y(x_n) + \frac{h}{2} f(x_n, y(x_n)) + \frac{h}{2} f[x_{n+1}, y(x_n)+hf(x_n, y(x_n))] \\
&= y(x_n) + \frac{h}{2} f(x_n, y(x_n)) + \frac{h}{2} [f(x_n, y(x_n)) + f_x h + f_y f h] + O(h^3) \\
&= y(x_n) + h f(x_n, y(x_n)) + \frac{h^2}{2}(f_x + f_y f) + O(h^3)
\end{aligned}
$$

其中 $f_x, f_y, f$ 均在 $(x_n, y(x_n))$ 处取值。

注意到 $y''(x_n) = f_x(x_n, y(x_n)) + f_y(x_n, y(x_n)) f(x_n, y(x_n))$，从而有：
$$
y(x_{n+1})
= y(x_n) + h f(x_n, y(x_n)) + \frac{h^2}{2}(f_x + f_y f) + O(h^3)
$$

于是：
$$
l_{n+1} = y(x_{n+1}) - \tilde{y}_{n+1} = O(h^3)
$$

故改进 Euler 具有 2 阶精度，且为单步显式。

### 算法实现

```python
def improved_euler(f, a, b, y0, N):
    """
    改进 Euler 方法
    """
    h = (b - a) / (N - 1)
    hh = h * 0.5
    x = a
    y = [0.0] * N
    y[0] = y0
    f0 = f(a, y0)
    for i in range(1, N):
        # 预测步（显式 Euler）
        y_pred = y[i-1] + h * f0
        # 校正步（梯形公式一次迭代）
        f1 = f(x + h, y_pred)
        y[i] = y[i-1] + hh * (f0 + f1)
        # 更新导数值用于下一步
        f0 = f1
        x += h
    return y
```

**注**：每步仅需 2 次 $f$ 求值，无需求解隐式方程，计算效率显著高于梯形公式的迭代求解。

---

## 方法对比与复杂度分析

| 方法 | 类型 | 局部截断误差 | 总体截断误差 | 精度 | 稳定条件（$\lambda < 0$） | 每步求值次数 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Euler | 显式单步 | $O(h^2)$ | $O(h)$ | 1 阶 | $h \leq -2/\lambda$ | 1 |
| 向后 Euler | 隐式单步 | $O(h^2)$ | $O(h)$ | 1 阶 | $\operatorname{Re}(\lambda) < 0$ | 迭代求解 |
| 梯形公式 | 隐式单步 | $O(h^3)$ | $O(h^2)$ | 2 阶 | $\operatorname{Re}(\lambda) < 0$ | 迭代求解 |
| 改进 Euler | 显式单步 | $O(h^3)$ | $O(h^2)$ | 2 阶 | 有条件稳定 | 2 |

**注**：
对于刚性方程（$\lambda$ 绝对值很大），显式方法受稳定性限制需极小步长，计算代价剧增；隐式方法稳定性好，允许大步长，虽每步需迭代，但总体效率反而更高。
