---
title: '常微分方程初值问题的数值解法（Runge-Kutta 方法，线性多步法，预估-校正法, 常微分方程组与高阶微分方程）'
excerpt: '26 春 计算方法 L20'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- 'ODE IVP'
pubDate: 'June 15 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## Runge-Kutta 方法简介

Euler 方法及其改进形式都是在区间 $[x_n, x_{n+1}]$ 内计算一个或多个点的斜率，通过加权平均构造 $y_{n+1}$ 的更高阶近似。

- **Euler 法**（局部截断误差 $O(h^2)$）：
  $$
  \begin{cases} k_1 = h f(x_n, y_n) \\ y_{n+1} = y_n + k_1 \end{cases}
  $$

- **改进 Euler 法**（局部截断误差 $O(h^3)$）：
  $$
  \begin{cases} k_1 = h f(x_n, y_n) \\ k_2 = h f(x_n + h, y_n + k_1) \\ y_{n+1} = y_n + \frac{1}{2}(k_1 + k_2) \end{cases}
  $$

RK 方法的核心思想是在 $[x_n, x_{n+1}]$ 内选取若干中间点计算斜率 $k_i$，通过待定系数匹配 Taylor 展开，使局部截断误差关于 $h$ 的阶数最大化。

---

## 二阶 Runge-Kutta 方法

### 数学基础

二阶 RK 方法的一般计算格式为：
$$
\begin{cases}
k_1 = h f(x_n, y_n) \\
k_2 = h f(x_n + \alpha h, y_n + \beta k_1) \\
y_{n+1} = y_n + \omega_1 k_1 + \omega_2 k_2
\end{cases}
$$
其中 $\omega_1, \omega_2, \alpha, \beta$ 为待定参数。

**系数推导**：

类似 [改进 Euler](../19-numerical-solution-of-ode-ivps-1#误差分析-2) 中的推导过程，
记 $\tilde{k}_1 = hf(x_n, y(x_n)),\;\tilde{k}_2 = hf(x_n+\alpha h, y(x_n)+\beta \tilde{k}_1)$，则：
$$
\begin{aligned}
\tilde{y}_{n+1}
&= y(x_n) + \omega_1 \tilde{k}_1 + \omega_2 \tilde{k}_2 \\
&= y(x_n) + \omega_1 \tilde{k}_1 + \omega_2 h (f + f_x \alpha h + f_y \beta \tilde{k}_1) \\
&= y(x_n) + h (\omega_1+\omega_2) f + h^2 \omega_2 (\alpha f_x + \beta f_y f) + O(h^3)
\end{aligned}
$$

又因为：
$$
y(x_{n+1}) = y(x_n) + h f + h^2 \frac{f_x + f_y f}{2} + O(h^3)
$$

希望达到 2 阶精度，匹配系数得：
$$
\begin{cases}
\omega_1 + \omega_2 = 1 \\
\alpha \omega_2 = \frac{1}{2} \\
\beta \omega_2 = \frac{1}{2}
\end{cases}
$$

方程个数小于未知数个数，解不唯一。

**注**：一般会取 $\alpha = \beta$，因为若希望 $k_2$ 估计较为准确，则 $x$ 方向和 $y$ 方向行走的比例应当基本一致。

### 计算公式

**取法一**（改进 Euler 法）：

$$
\omega_1 = \frac{1}{2}, \quad \omega_2 = \frac{1}{2}, \quad \alpha = 1, \quad \beta = 1
$$
$$
\begin{cases}
k_1 = h f(x_n, y_n) \\
k_2 = h f(x_n + h, y_n + k_1) \\
y_{n+1} = y_n + \frac{1}{2}(k_1 + k_2)
\end{cases}
$$

**取法二**（中点方法）：

$$
\omega_1 = 0, \quad \omega_2 = 1, \quad \alpha = \frac{1}{2}, \quad \beta = \frac{1}{2}
$$
$$
\begin{cases}
k_1 = h f(x_n, y_n) \\
k_2 = h f\left(x_n + \frac{h}{2}, y_n + \frac{k_1}{2}\right) \\
y_{n+1} = y_n + k_2
\end{cases}
$$

**Butcher 表**：
$$
\begin{array}{c|cc}
0 & & \\
\alpha & \beta & \\
\hline
& \omega_1 & \omega_2
\end{array}
$$

改进 Euler：
$$
\begin{array}{c|cc}
0 & & \\
1 & 1 & \\
\hline
& 1/2 & 1/2
\end{array}
$$

中点方法：
$$
\begin{array}{c|cc}
0 & & \\
1/2 & 1/2 & \\
\hline
& 0 & 1
\end{array}
$$

### 算法实现

**中点方法**：

```python
def rk2_midpoint(f, a, b, y0, N):
    """
    二阶 Runge-Kutta 中点方法
    """
    h = (b - a) / (N - 1)
    hh = h * 0.5
    x = a
    y = [0.0] * N
    y[0] = y0
    
    for i in range(1, N):
        k1 = h * f(x, y[i-1])
        k2 = h * f(x + hh, y[i-1] + k1 * 0.5)
        y[i] = y[i-1] + k2
        x += h
    return y
```

### 稳定性分析

对模型方程 $y' = \lambda y\ (\lambda \in \mathbb{C})$，代入二阶 RK 计算格式可得：
$$
y_{n+1} = (1 + \lambda h + \frac{1}{2}\lambda^2 h^2) y_n
$$

故**绝对稳定条件**为 $|1 + \lambda h + \frac{1}{2}\lambda^2 h^2| < 1$。

当 $\lambda \in \mathbb{R}$ 且 $\lambda < 0$ 时，稳定步长要求：
$$
h < -\frac{2}{\lambda}
$$

---

## 四阶 Runge-Kutta 方法

### 数学基础

四阶 RK 的一般形式含 4 个斜率 $k_1, k_2, k_3, k_4$：
$$
\begin{cases}
k_1 = h f(x_n, y_n) \\
k_2 = h f(x_n + \alpha_1 h, y_n + \beta_1 k_1) \\
k_3 = h f(x_n + \alpha_2 h, y_n + \beta_2 k_1 + \gamma_1 k_2) \\
k_4 = h f(x_n + \alpha_3 h, y_n + \beta_3 k_1 + \gamma_2 k_2 + \zeta_1 k_3) \\
y_{n+1} = y_n + \omega_1 k_1 + \omega_2 k_2 + \omega_3 k_3 + \omega_4 k_4
\end{cases}
$$

希望局部截断误差为 $O(h^5)$。通过 Taylor 展开匹配系数，可以得到关于 13 个参数的 11 个方程。

### 计算公式

取满足方程组的一组经典解，得到**标准四阶 RK 方法**：
$$
\begin{cases}
k_1 = h f(x_n, y_n) \\
k_2 = h f\left(x_n + \frac{h}{2}, y_n + \frac{k_1}{2}\right) \\
k_3 = h f\left(x_n + \frac{h}{2}, y_n + \frac{k_2}{2}\right) \\
k_4 = h f(x_n + h, y_n + k_3) \\
y_{n+1} = y_n + \frac{1}{6}\left(k_1 + 2k_2 + 2k_3 + k_4\right)
\end{cases}
$$

**Butcher 表**：
$$
\begin{array}{c|cccc}
0 & & & & \\
1/2 & 1/2 & & & \\
1/2 & 0 & 1/2 & & \\
1 & 0 & 0 & 1 & \\
\hline
& 1/6 & 1/3 & 1/3 & 1/6
\end{array}
$$

**注**：
虽然 $k_2, k_3$ 均位于区间中点，但 $k_3$ 使用更新的斜率 $k_2$ 而非 $k_1$，类似预测-校正的思想。

### 算法实现

```python
def rk4(f, a, b, y0, N):
    """
    经典四阶 Runge-Kutta 方法
    """
    h = (b - a) / (N - 1)
    hh = h * 0.5
    x = a
    y = [0.0] * N
    y[0] = y0
    
    for i in range(1, N):
        k1 = h * f(x, y[i-1])
        k2 = h * f(x + hh, y[i-1] + k1 * 0.5)
        k3 = h * f(x + hh, y[i-1] + k2 * 0.5)
        k4 = h * f(x + h, y[i-1] + k3)
        y[i] = y[i-1] + (k1 + 2.0*k2 + 2.0*k3 + k4) / 6.0
        x += h
    return y
```

### 稳定性分析

对模型方程 $y' = \lambda y$，同理可求得四阶 RK 的传递因子为
$$
R(z) = 1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24}, \quad z = \lambda h
$$

故绝对稳定条件为：$|R(z)| \leq 1$。

当 $\lambda \in \mathbb{R}$ 且 $\lambda < 0$ 时，稳定步长要求
$$
h < -\frac{2.78}{\lambda}
$$

**注**：四阶 RK 的绝对稳定区间比二阶 RK 略大，但二者均为条件稳定，对刚性方程（$|\lambda| \gg 0$）需极小的 $h$。

---

## 线性多步法简介

### 一般形式

若 $y_{n+1}$ 的计算不仅依赖 $y_n$，还利用历史值 $y_n, y_{n-1}, \dots, y_{n-k}$，则称为**多步法**。其一般线性形式为
$$
y_{n+1} = \sum_{i=0}^{k} \alpha_i y_{n-i} + h \sum_{i=-1}^{k} \beta_i f(x_{n-i}, y_{n-i})
$$

- 若 $\beta_{-1} = 0$（不含 $f(x_{n+1}, y_{n+1})$）则为显式方法
- 若 $\beta_{-1} \neq 0$ 则为隐式方法

### 构造原理

基于恒等式：
$$
y(x_{n+1}) - y(x_{n-k}) = \int_{x_{n-k}}^{x_{n+1}} f(\xi, y(\xi))\,\mathrm{d}\xi
$$
令 $F(x) \equiv f(x, y(x))$，通过 Lagrange 插值多项式 $\psi(x)$ 近似 $F(x)$，再积分得到计算格式。

**注**：当 $k=0$ 时，退化为单步法，Euler、向后 Euler/梯形公式分别对应零次/一次插值。

### 隐式方法的局部截断误差简化

对隐式多步法（$\beta_{-1} \neq 0$），严格定义的局部参考值 $\tilde{y}_{n+1}$ 满足：
$$
\tilde{y}_{n+1} = \sum_{i=0}^{k}\alpha_i y(x_{n-i}) + h\sum_{i=0}^{k}\beta_i y'(x_{n-i}) + h\beta_{-1}f(x_{n+1},\tilde{y}_{n+1})
$$

若将隐式项中的 $\tilde{y}_{n+1}$ 直接替换为真解 $y(x_{n+1})$，得到：
$$
T_{n+1} = y(x_{n+1}) - \left[\sum_{i=0}^{k}\alpha_i y(x_{n-i}) + h\sum_{i=-1}^{k}\beta_i y'(x_{n-i})\right]
$$

由微分中值定理：
$$
f(x_{n+1},\tilde{y}_{n+1}) - f(x_{n+1},y(x_{n+1})) = -f_y \cdot l_{n+1}
$$

故在 p 阶精度时，隐式修正项为 $h\beta_{-1}f_y \cdot l_{n+1} = O(h^{p+2})$。因此：
$$
l_{n+1} = T_{n+1} + O(h^{p+2})
$$

也即隐式项的修正不影响精度结果。实际推导局部截断误差时，可直接将隐式项中的 $y_{n+1}$ 代入真值 $y(x_{n+1})$ 计算，所得阶数与主项系数均不变。

### 出发值计算

线性多步法需 $k$ 个出发值 $y_0, y_1, \dots, y_{k-1}$ 才能启动。通常采用**单步法**（如四阶 RK）以小步长计算出发值，且单步法阶数应不低于多步法阶数，以保证整体精度不被污染。

## Adams 外推公式

**思想**：
插值节点取积分区间左侧的 $x_n, x_{n-1}, \dots, x_{n-k}$，然后在 $[x_n, x_{n+1}]$ 上**外推**积分，得到**显式**格式。

### 二阶 Adams-Bashforth（两点线性插值）

对 $F(x)$ 在 $x_n, x_{n-1}$ 处线性插值：
$$
\psi_1(x) = \frac{x - x_{n-1}}{h} F(x_n) - \frac{x - x_n}{h} F(x_{n-1})
$$

余项：
$$
R_1(x) = \frac{1}{2}(x - x_n)(x - x_{n-1}) F''(\eta), \quad \eta \in (x_{n-1}, x_n)
$$

在 $[x_n, x_{n+1}]$ 上积分（设步长均匀为 $h$）：
$$
\int_{x_n}^{x_{n+1}} \psi_1(\xi)\,\mathrm{d}\xi = \frac{h}{2}\left[3F(x_n) - F(x_{n-1})\right]
$$

得到**计算格式**：
$$
y_{n+1} = y_n + \frac{h}{2}\left[3f(x_n, y_n) - f(x_{n-1}, y_{n-1})\right]
$$

**局部截断误差**：
$$
l_{n+1} = \int_{x_n}^{x_{n+1}} R_1(\xi)\,\mathrm{d}\xi = \frac{5}{12} h^3 F''(\eta)
$$

### 四阶 Adams-Bashforth（四点三次插值）

对 $F(x)$ 在 $x_n, x_{n-1}, x_{n-2}, x_{n-3}$ 处构造三次 Lagrange 插值 $\psi_3(x)$，在 $[x_n, x_{n+1}]$ 上积分。

**计算格式**：
$$
y_{n+1} = y_n + \frac{h}{24}\left(55f_n - 59f_{n-1} + 37f_{n-2} - 9f_{n-3}\right)
$$

其中 $f_i \equiv f(x_i, y_i)$。

**局部截断误差**：
$$
l_{n+1} = \frac{251}{720} h^5 F^{(4)}(\eta) + O(h^6), \quad \eta \in (x_{n-3}, x_n)
$$

从而四阶 Adams-Bashforth 方法具有 4 阶精度。

## Adams 内插公式

**思想**：
插值节点包含积分区间右端点，取为 $x_{n+1}, x_n, \dots, x_{n-k}$，包含了区间 $[x_n, x_{n+1}]$，故为**内插**积分，得到**隐式**格式。

### 二阶 Adams-Moulton（梯形公式）

对 $F(x)$ 在 $x_n, x_{n+1}$ 处线性插值，积分后恰好得到梯形公式，**计算格式**为：
$$
y_{n+1} = y_n + \frac{h}{2}\left[f(x_n, y_n) + f(x_{n+1}, y_{n+1})\right]
$$

**局部截断误差**：
$$
l_{n+1} = -\frac{1}{12} h^3 F''(\eta) + O(h^4), \quad \eta \in (x_{n}, x_{n+1})
$$

### 四阶 Adams-Moulton（四点三次插值）

对 $F(x)$ 在 $x_{n+1}, x_n, x_{n-1}, x_{n-2}$ 处构造三次 Lagrange 插值，积分得：

**计算格式**：
$$
y_{n+1} = y_n + \frac{h}{24}\left(9f_{n+1} + 19f_n - 5f_{n-1} + f_{n-2}\right)
$$

**局部截断误差**：
$$
l_{n+1} = -\frac{19}{720} h^5 F^{(4)}(\eta) + O(h^6), \quad \eta \in (x_{n-2}, x_{n+1})
$$

**结论**：四阶 Adams-Moulton 为隐式方法，局部截断误差系数小于同阶 Adams-Bashforth，精度更优且稳定性更好。

---

## 预估-校正法

### 基本思想

- **预估（Predictor, P）**：用显式方法（如 Adams-Bashforth）计算 $y_{n+1}$ 的初始近似 $p_{n+1}$
- **求值（Evaluation, E）**：计算 $f(x_{n+1}, p_{n+1})$
- **校正（Corrector, C）**：用隐式方法（如 Adams-Moulton）迭代求解 $y_{n+1}$

### 改进 Euler 的 PEC 形式

$$
\begin{aligned}
\mathrm{P}: &\quad p_{n+1} = y_n + h f(x_n, y_n) \\
\mathrm{E}: &\quad \tilde{f}_{n+1} = f(x_{n+1}, p_{n+1}) \\
\mathrm{C}: &\quad y_{n+1} = y_n + \frac{h}{2}\left(f_n + \tilde{f}_{n+1}\right)
\end{aligned}
$$

**注**：此即改进 Euler 法的实现形式，仅进行一次校正（迭代次数为 1）。

### Adams 预估-校正法

**PEC 格式**（四阶）：

$$
\begin{aligned}
\mathrm{P}: &\quad p_{n+1} = y_n + \frac{h}{24}\left(55f_n - 59f_{n-1} + 37f_{n-2} - 9f_{n-3}\right) \\
\mathrm{E}: &\quad \tilde{f}_{n+1} = f(x_{n+1}, p_{n+1}) \\
\mathrm{C}: &\quad y_{n+1} = y_n + \frac{h}{24}\left(9\tilde{f}_{n+1} + 19f_n - 5f_{n-1} + f_{n-2}\right)
\end{aligned}
$$

**P(EC)$^2$ 格式**（四阶，两次校正）：

$$
\begin{aligned}
\mathrm{P}: &\quad p_{n+1} = y_n + \frac{h}{24}\left(55f_n - 59f_{n-1} + 37f_{n-2} - 9f_{n-3}\right) \\
\mathrm{E}: &\quad \tilde{f}_{n+1}^{(1)} = f(x_{n+1}, p_{n+1}) \\
\mathrm{C}: &\quad y_{n+1}^{(1)} = y_n + \frac{h}{24}\left(9\tilde{f}_{n+1}^{(1)} + 19f_n - 5f_{n-1} + f_{n-2}\right) \\
\mathrm{E}: &\quad \tilde{f}_{n+1}^{(2)} = f(x_{n+1}, y_{n+1}^{(1)}) \\
\mathrm{C}: &\quad y_{n+1}^{(2)} = y_n + \frac{h}{24}\left(9\tilde{f}_{n+1}^{(2)} + 19f_n - 5f_{n-1} + f_{n-2}\right)
\end{aligned}
$$

**注**：校正公式的截断误差优于预估公式。实际计算中通常限制校正迭代次数为 1–2 次，以平衡计算开销与精度收益。

### 误差修正与 PMECME 方法

利用 Adams-Bashforth（预估）与 Adams-Moulton（校正）的同阶截断误差进行**事后误差估计与修正**：

设 $p_{n+1}$ 为预估值，$c_{n+1}$ 为校正值，根据余项公式：
$$
\begin{aligned}
y(x_{n+1}) - p_{n+1} &= \frac{251}{720} h^5 y^{(5)}(\xi_n), \quad x_{n-3} < \xi_n < x_{n+1} \\
y(x_{n+1}) - c_{n+1} &= -\frac{19}{720} h^5 y^{(5)}(\eta_n), \quad x_{n-2} < \eta_n < x_{n+1}
\end{aligned}
$$

两式相减，由中值定理得：
$$
c_{n+1} - p_{n+1} = \frac{270}{720} h^5 y^{(5)}(\zeta_n)
$$

从而得到**事后误差估计**：
$$
\begin{aligned}
y(x_{n+1}) - p_{n+1} &\approx \frac{251}{270}(c_{n+1} - p_{n+1}) \\
y(x_{n+1}) - c_{n+1} &\approx -\frac{19}{270}(c_{n+1} - p_{n+1})
\end{aligned}
$$

**PMECME 修正方案**：

$$
\begin{aligned}
\mathrm{P}: &\quad p_{n+1} = y_n + \frac{h}{24}\left(55f_n - 59f_{n-1} + 37f_{n-2} - 9f_{n-3}\right) \\
\mathrm{M}: &\quad m_{n+1} = p_{n+1} + \frac{251}{270}(c_n - p_n) \\
\mathrm{E}: &\quad f_{n+1} = f(x_{n+1}, m_{n+1}) \\
\mathrm{C}: &\quad c_{n+1} = y_n + \frac{h}{24}\left(9f_{n+1} + 19f_n - 5f_{n-1} + f_{n-2}\right) \\
\mathrm{M}: &\quad y_{n+1} = c_{n+1} - \frac{19}{270}(c_{n+1} - p_{n+1}) \\
\mathrm{E}: &\quad f_{n+1} = f(x_{n+1}, y_{n+1})
\end{aligned}
$$

其中两步 $\mathrm{M}$ 分别在利用前一步修正预估值和利用当前步修正校正值。

**注**：PMECME 可以在不显著增加计算量的前提下将有效精度提升约 1–2 阶。

---

## 常微分方程组与高阶微分方程

### 常微分方程组

**问题形式**：
$$
\begin{cases}
\displaystyle\frac{\mathrm{d}y}{\mathrm{d}x} = f(x, y, z) \\[6pt]
\displaystyle\frac{\mathrm{d}z}{\mathrm{d}x} = g(x, y, z) \\[6pt]
y(x_0)=y_0,\ z(x_0)=z_0
\end{cases}
$$

**数值处理**：将各未知量视为向量 $\mathbf{Y} = [y, z]^T$，右端函数视为向量值函数 $\mathbf{F} = [f, g]^T$，所有单步/多步公式直接向量形式套用。

**注**：方程组求解时，各分量必须同步推进，即先计算所有分量的斜率，再统一更新，避免使用已更新的分量去计算其他分量（这会改变方法的数学性质）。

### 高阶微分方程

**降阶法**：$m$ 阶 ODE 可通过引入 $m-1$ 个新变量化为一阶方程组。

**例**：二阶方程
$$
\frac{\mathrm{d}^2 y}{\mathrm{d}x^2} = g(x, y, y')
,\ y(x_0)=y_0,\ y'(x_0)=y'_0
$$

令 $z = \dfrac{\mathrm{d}y}{\mathrm{d}x}$，则化为方程组：
$$
\begin{cases}
\displaystyle\frac{\mathrm{d}y}{\mathrm{d}x} = z \\[6pt]
\displaystyle\frac{\mathrm{d}z}{\mathrm{d}x} = g(x, y, z) \\[6pt]
y(x_0)=y_0,\ z(x_0)=y'_0 \equiv z_0
\end{cases}
$$

**注**：高阶 RK 方法（如 RK4）对向量值 $\mathbf{F}$ 的每一步仍只需分别计算各分量的 $k_i$，存储与计算复杂度随变量数线性增长。

---

## 复杂度与稳定性总览

| 方法 | 类型 | 局部误差 | 全局误差 | 每步 $f$ 求值 | 稳定区间（实 $\lambda<0$） | 存储需求 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Euler | 显式单步 | $O(h^2)$ | $O(h)$ | 1 | $h < -2/\lambda$ | $O(1)$ |
| 改进 Euler | 显式单步 | $O(h^3)$ | $O(h^2)$ | 2 | $h < -2/\lambda$ | $O(1)$ |
| RK2（中点） | 显式单步 | $O(h^3)$ | $O(h^2)$ | 2 | $h < -2/\lambda$ | $O(1)$ |
| RK4 | 显式单步 | $O(h^5)$ | $O(h^4)$ | 4 | $h < -2.78/\lambda$ | $O(1)$ |
| Adams-Bashforth 4 | 显式多步 | $O(h^5)$ | $O(h^4)$ | 1 | 较小 | $O(4)$ |
| Adams-Moulton 4 | 隐式多步 | $O(h^5)$ | $O(h^4)$ | 迭代 | 较大 | $O(4)$ |
| PECE (Adams) | 预估-校正 | $O(h^5)$ | $O(h^4)$ | 2 | 中等 | $O(4)$ |
| PMECME | 修正预估-校正 | $O(h^6)$ | $O(h^5)$ | 2 | 中等 | $O(4)$ |

**注**：
Adams-Moulton 的绝对稳定域显著大于同阶显式方法，适合刚性方程；预估-校正法在保持显式方法计算效率的同时，通过一次校正获得接近隐式的稳定性与精度。
