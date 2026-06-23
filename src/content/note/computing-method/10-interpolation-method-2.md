---
title: '插值法（分段线性插值，Hermite 插值，样条插值）'
excerpt: '26 春 计算方法 L10'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '插值法'
pubDate: 'May 10 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 分段线性插值

### 全局插值的缺陷

高次多项式全局插值存在两个根本缺陷：

1. **Runge 现象**：加密节点并不能保证插值多项式 $\varphi_n(x)$ 收敛到原函数 $f(x)$，在区间端点附近可能产生剧烈振荡。
2. **凹凸性无法保证**：实际测量数据中，相邻节点之间的函数凹凸性是确定的；但高次多项式插值无法保持这一物理合理性。

实际工程中大多采用**分段低次插值**，分段光滑的低次逼近效果一般优于任意光滑的高次多项式逼近。

### 分段线性插值定义

在区间 $[a, b]$ 上给定节点
$$
a = x_0 < x_1 < \cdots < x_n = b
$$

以及各节点处的函数值 $y_i = f(x_i)$，$i = 0, 1, \ldots, n$。

**分段线性插值函数** $\varphi_n(x)$ 满足：

- **插值条件**：$\varphi(x_i) = y_i$，$i = 0, 1, \ldots, n$
- **线性条件**：$\varphi(x)$ 在每个小区间 $[x_i, x_{i+1}]$ 上是一次多项式

也即依次连接数据点 $(x_i, y_i)$ 形成的**折线**。

### 分段线性插值基函数构造

分段线性插值函数通过构造基函数 $l_j(x)$，$j = 0, 1, \ldots, n$ 来表达：

**端点基函数**：
$$
l_0(x)
=
\begin{cases}
\dfrac{x - x_1}{x_0 - x_1}, & x \in [x_0, x_1] \\
0, & x \in (x_1, x_n]
\end{cases}
$$

$$
l_n(x)
=
\begin{cases}
\dfrac{x - x_{n-1}}{x_n - x_{n-1}}, & x \in [x_{n-1}, x_n] \\
0, & x \in [x_0, x_{n-1})
\end{cases}
$$

**内部节点基函数**（$1 \leq j \leq n-1$）：
$$
l_j(x)
=
\begin{cases}
\dfrac{x - x_{j-1}}{x_j - x_{j-1}}, & x \in [x_{j-1}, x_j] \\
\dfrac{x - x_{j+1}}{x_j - x_{j+1}}, & x \in (x_j, x_{j+1}] \\
0, & x \in [x_0, x_{j-1}) \cup (x_{j+1}, x_n]
\end{cases}
$$

**注**：每个 $l_j(x)$ 形如 hat，在 $x_j$ 处取值为 1，在相邻节点处为 0，支撑集仅为 $[x_{j-1}, x_{j+1}]$，这是分段插值**局部性**的体现。

**插值函数总表达式：**
$$
\varphi_n(x) = \sum_{j=0}^{n} y_j \, l_j(x)
$$

### 分段线性插值误差估计

**定理**：设 $f(x) \in C^2[a,b]$，则分段线性插值余项满足
$$
|R_n(x)| \equiv |f(x) - \varphi_n(x)| \leq \frac{h^2}{8} M_2
$$
其中 $h = \max_{0 \leq i \leq n-1} |x_{i+1} - x_i|$ 为最大步长，$M_2 = \max_{a \leq x \leq b} |f''(x)|$。

显然当 $h \to 0$ 时，误差趋于 $0$，确保收敛。

**证明**：

在每个子区间 $[x_i,x_{i+1}]$ 上，$\varphi_n(x)$ 即为线性插值 $L_1(x)$，故：
$$
f(x)-\varphi_n(x)=\frac{f''(\xi)}{2}(x-x_i)(x-x_{i+1}),\qquad \xi\in(x_i,x_{i+1})
$$

令 $h_i=x_{i+1}-x_i$，$x=x_i+th_i\ (t\in[0,1])$，则：
$$
(x-x_i)(x-x_{i+1})=h_i^2\,t(t-1)
$$

而 $t(t-1)$ 在 $[0,1]$ 上的最大绝对值为 $\displaystyle\frac{1}{4}$。因此：
$$
|f(x)-\varphi_n(x)|\le\frac{M_2}{2}\cdot\frac{h_i^2}{4}\le\frac{M_2 h^2}{8}
$$
对所有子区间一致成立，即得证。

**注**：分段线性插值的局限是在节点处**导数不连续**，整体仅为 $C^0$ 光滑。

---

## Hermite 插值

### 动机与思想

分段线性插值的导函数在节点处不连续，无法满足需要光滑曲线的工程应用。

**Hermite 插值**则是在给定节点上**取已知函数值**，而且同时**取已知导数值**，从而提升曲线整体光滑性。

### 两节点一阶 Hermite 插值

#### 问题表述

给定 $x_0, x_1$ 及对应的 $y_0, y_1, y_0', y_1'$，构造次数不超过 3 次的多项式 $H(x)$ 使得：
$$
H(x_0) = y_0,\quad H(x_1) = y_1,\quad H'(x_0) = y_0',\quad H'(x_1) = y_1'
$$

4 个约束条件显然能唯一确定 3 次多项式。

#### 基函数构造

令 $H(x) = y_0 \alpha_0(x) + y_1 \alpha_1(x) + y_0' \beta_0(x) + y_1' \beta_1(x)$，各基函数满足：

| 基函数 | 在 $x_0$ | 在 $x_1$ | 导数在 $x_0$ | 导数在 $x_1$ |
| :--- | :---: | :---: | :---: | :---: |
| $\alpha_0(x)$ | 1 | 0 | 0 | 0 |
| $\alpha_1(x)$ | 0 | 1 | 0 | 0 |
| $\beta_0(x)$ | 0 | 0 | 1 | 0 |
| $\beta_1(x)$ | 0 | 0 | 0 | 1 |

从而：
$$
\alpha_0(x)
= \left(1 + 2\frac{x-x_0}{x_1-x_0}\right)\left(\frac{x-x_1}{x_0-x_1}\right)^2
= (1 + 2t)s^2
$$

$$
\alpha_1(x)
= \left(1 + 2\frac{x-x_1}{x_0-x_1}\right)\left(\frac{x-x_0}{x_1-x_0}\right)^2
= (1 + 2s) t^2
$$

$$
\beta_0(x)
= (x-x_0)\left(\frac{x-x_1}{x_0-x_1}\right)^2
= hts^2
$$

$$
\beta_1(x)
= (x-x_1)\left(\frac{x-x_0}{x_1-x_0}\right)^2
= (-h)st^2
$$

其中不明所以的公式见 [两节点多阶 Hermite 插值](#两节点多阶-hermite-插值)。

#### 误差估计

$$
R(x) = f(x) - H(x) = \frac{f^{(4)}(\xi)}{4!}(x-x_0)^2(x-x_1)^2
$$

$$
|R(x)| \leq \frac{h^4}{384} M_4, \quad h = x_1 - x_0,\quad M_4 = \max_{a \leq x \leq b}|f^{(4)}(x)|
$$

**注**：线性插值误差为 $O(h^2)$，Hermite 插值误差为 $O(h^4)$，精度大幅提升。

### 两节点多阶 Hermite 插值

#### 问题表述

设插值区间 $[x_0,x_1]$，记
$$
h=x_1-x_0,\qquad t=\frac{x-x_0}{h}
$$
则 $x=x_0\leftrightarrow t=0$，$x=x_1\leftrightarrow t=1$，且 $\dfrac{d}{dx}=\dfrac{1}{h}\dfrac{d}{dt}$。

节点处给定条件数：

- $x_0$ 侧：$m_0$ 个（函数值及前 $m_0-1$ 阶导数）
- $x_1$ 侧：$m_1$ 个（函数值及前 $m_1-1$ 阶导数）

插值多项式总次数为 $m_0+m_1-1$。

负责 $x_0$ 处 $k$ 阶导数（$0\le k\le m_0-1$）的基函数记为 $\phi_{0,k}(x)$，满足：
$$
\begin{cases}
\phi_{0,k}^{(j)}(x_0)=\delta_{jk}, & 0\le j\le m_0-1 \\[4pt]
\phi_{0,k}^{(j)}(x_1)=0, & 0\le j\le m_1-1
\end{cases}
$$

负责 $x_1$ 处 $k$ 阶导数（$0\le k\le m_1-1$）的基函数记为 $\phi_{1,k}(x)$，满足：
$$
\begin{cases}
\phi_{1,k}^{(j)}(x_0)=0, & 0\le j\le m_0-1 \\[4pt]
\phi_{1,k}^{(j)}(x_1)=\delta_{jk}, & 0\le j\le m_1-1
\end{cases}
$$

#### 基函数构造

$x_0$ 侧基函数：
$$
\phi_{0,k}(x)=t^k(1-t)^{m_1}\,P_{m_0-1-k}(t)
$$
其中
$$
P_{m_0-1-k}(t)=\frac{h^k}{k!}\sum_{i=0}^{m_0-1-k}\binom{m_1+i-1}{m_1-1}t^i
$$

$x_1$ 侧基函数：
$$
\phi_{1,k}(x)=(1-t)^k\,t^{m_0}\,Q_{m_1-1-k}(1-t)
$$
其中
$$
Q_{m_1-1-k}(s)=\frac{(-h)^k}{k!}\sum_{i=0}^{m_1-1-k}\binom{m_0+i-1}{m_0-1}s^i
$$

**证明思路**：

对 $x_0$ 侧基函数，由零点定理：

- $x_1$ 处 $m_1$ 个条件为 0 $\Rightarrow$ 必含因子 $(1-t)^{m_1}$
- $x_0$ 处前 $k-1$ 阶导数为 0 $\Rightarrow$ 必含因子 $t^k$

总次数 $m_0+m_1-1$ 已用去 $k+m_1$，剩余 $m_0-1-k$ 次由待定多项式 $P_{m_0-1-k}(t)$ 填补。因此设：
$$
\phi_{0,k}(x)=t^k(1-t)^{m_1}\,P_{m_0-1-k}(t)
$$

定义 $G(t)=(1-t)^{m_1}P_{m_0-1-k}(t)$，则 $\phi_{0,k}=t^k G(t)$。

由 $x_0$ 处导数条件，对 $0\le j\le m_0-1$ 要求：
$$
\frac{1}{h^j}\frac{d^j}{dt^j}\left[t^k G(t)\right]\bigg|_{t=0}=\delta_{jk}
$$

对 $t^k G(t)$ 用 Leibniz 法则。在 $t=0$ 处，$\frac{d^i}{dt^i}(t^k)\neq 0$ 仅当 $i=k$。因此：

- **若 $j\lt k$**：和式中 $i\le j\lt k$，所有项为 0
- **若 $j\ge k$**：仅 $i=k$ 项非零，值为
  $$
  \frac{d^j}{dt^j}\left[t^k G(t)\right]\bigg|_{t=0}=\binom{j}{k}k!\,G^{(j-k)}(0)
  $$

代入归一化条件：

| $j$ | 条件 | 结果 |
| :---: | :--- | :--- |
| $j=k$ | $\frac{1}{h^k}\cdot k!\,G(0)=1$ | $G(0)=\dfrac{h^k}{k!}$ |
| $j=k+1,\dots,m_0-1$ | $\frac{1}{h^j}\cdot\binom{j}{k}k!\,G^{(j-k)}(0)=0$ | $G^{(1)}(0)=\cdots=G^{(m_0-1-k)}(0)=0$ |

等价于：
$$
G(t)\equiv \frac{h^k}{k!}\pmod{t^{m_0-k}}
$$

由 $G(t)=(1-t)^{m_1}P(t)$，得：
$$
P(t)\equiv \frac{h^k}{k!}(1-t)^{-m_1}\pmod{t^{m_0-k}}
$$

广义二项式展开：
$$
(1-t)^{-m_1}=\sum_{i=0}^{\infty}\binom{m_1+i-1}{m_1-1}t^i
$$

截断至 $t^{m_0-1-k}$ 次：
$$
P_{m_0-1-k}(t)=\frac{h^k}{k!}\sum_{i=0}^{m_0-1-k}\binom{m_1+i-1}{m_1-1}t^i
$$

对 $x_1$ 侧，作替换 $s=1-t$（即 $x_1\leftrightarrow s=0$），问题完全对称。
互换 $m_0\leftrightarrow m_1$ 并注意 $\frac{d}{dx}=-\frac{1}{h}\frac{d}{ds}$ 带来的 $(-1)^k$。
归一化条件要求 $Q(0)=\dfrac{(-h)^k}{k!}$，即得 $\phi_{1,k}(x)$ 的显式形式。

**插值多项式**：

给定 $f^{(j)}(x_0)\;(0\le j\le m_0-1)$ 和 $f^{(j)}(x_1)\;(0\le j\le m_1-1)$，则
$$
H(x)=\sum_{k=0}^{m_0-1}f^{(k)}(x_0)\,\phi_{0,k}(x)+\sum_{k=0}^{m_1-1}f^{(k)}(x_1)\,\phi_{1,k}(x)
$$

#### 误差估计

若 $f\in C^{m_0+m_1}[x_0,x_1]$，则
$$
R(x)=f(x)-H(x)=\frac{f^{(m_0+m_1)}(\xi)}{(m_0+m_1)!}(x-x_0)^{m_0}(x-x_1)^{m_1},\qquad \xi\in(x_0,x_1)
$$

#### 退化特例

| 情形 | 结果 |
| :--- | :--- |
| $m_1=1$ | $P(t)=\dfrac{h^k}{k!}\cdot\dfrac{1-t^{m_0-k}}{1-t}$，代回得 $\phi_{0,k}=\dfrac{h^k}{k!}(t^k-t^{m_0})$ |
| $m_0=m_1=2,k=0$ | $P_1(t)=1+2t$，$\phi_{0,0}=(1-t)^2(1+2t)$，即标准 Hermite $h_0^{(0)}$ |
| $m_0=m_1=2,k=1$ | $P_0(t)=h$，$\phi_{0,1}=ht(1-t)^2$，即标准 Hermite $h_0^{(1)}$ |

### 多节点分段一阶 Hermite 插值

为防止插值多项式次数过高引入 Runge 现象，实际使用**多节点分段一阶 Hermite 插值**：
在每个小区间上用两节点 Hermite 公式，同时保证全局函数的**一阶导数连续性**（$C^1$ 光滑）。

#### 问题表述

给定函数表：

| $x$ | $x_0$ | $x_1$ | $\cdots$ | $x_n$ |
| :--- | :---: | :---: | :---: | :---: |
| $y$ | $y_0$ | $y_1$ | $\cdots$ | $y_n$ |
| $y'$ | $m_0$ | $m_1$ | $\cdots$ | $m_n$ |

构造多节点分段一阶 Hermite 插值函数 $H(x)$ 满足：

- $H(x_i) = y_i$，$H'(x_i) = m_i$（$i = 0, 1, \ldots, n$）
- 在每个小区间 $[x_i, x_{i+1}]$ 上是不超过三次的多项式

#### 基函数构造

记步长 $h_i=x_{i+1}-x_i\;(i=0,1,\ldots,n-1)$。在区间 $[x_i,x_{i+1}]$ 上定义局部变量
$$
t_i=\frac{x-x_i}{h_i},\qquad s_i=\frac{x_{i+1}-x}{h_i}=1-t_i,\qquad i=0,1,\ldots,n-1.
$$

全局插值函数写成
$$
H(x)=\sum_{i=0}^{n}y_i\,\alpha_i(x)+\sum_{i=0}^{n}m_i\,\beta_i(x),
$$
其中 $\alpha_i(x)$ 为函数值基函数，$\beta_i(x)$ 为导数值基函数。

**端点基函数**：

左端点 $x_0$ 的基函数仅在 $[x_0,x_1]$ 上非零：
$$
\alpha_0(x)=
\begin{cases}
(1+2t_0)s_0^{\,2}, & x\in[x_0,x_1],\\[6pt]
0, & \text{otherwise},
\end{cases}
$$

$$
\beta_0(x)=
\begin{cases}
h_0\,t_0s_0^{\,2}, & x\in[x_0,x_1],\\[6pt]
0, & \text{otherwise}.
\end{cases}
$$

右端点 $x_n$ 的基函数仅在 $[x_{n-1},x_n]$ 上非零：
$$
\alpha_n(x)=
\begin{cases}
(1+2s_{n-1})t_{n-1}^{\,2}, & x\in[x_{n-1},x_n],\\[6pt]
0, & \text{otherwise},
\end{cases}
$$

$$
\beta_n(x)=
\begin{cases}
-h_{n-1}\,s_{n-1}t_{n-1}^{\,2}, & x\in[x_{n-1},x_n],\\[6pt]
0, & \text{otherwise}.
\end{cases}
$$

**内部节点基函数**（$i=1,2,\ldots,n-1$）：

内部节点 $x_i$ 的基函数由左右两支拼接而成。左支位于 $[x_{i-1},x_i]$（以 $x_i$ 为区间右端点），右支位于 $[x_i,x_{i+1}]$（以 $x_i$ 为区间左端点）：

$$
\alpha_i(x)=
\begin{cases}
(1+2s_{i-1})t_{i-1}^{\,2}, & x\in[x_{i-1},x_i],\\[8pt]
(1+2t_i)s_i^{\,2}, & x\in[x_i,x_{i+1}],\\[8pt]
0, & \text{otherwise},
\end{cases}
$$

$$
\beta_i(x)=
\begin{cases}
-h_{i-1}\,s_{i-1}t_{i-1}^{\,2}, & x\in[x_{i-1},x_i],\\[8pt]
h_i\,t_is_i^{\,2}, & x\in[x_i,x_{i+1}],\\[8pt]
0, & \text{otherwise}.
\end{cases}
$$

#### 误差估计

$$
|R(x)| = |f(x) - H(x)| \leq \frac{h^4 M_4}{384}
$$

其中 $h = \max_i |x_{i+1} - x_i|$，$M_4 = \max|f^{(4)}(x)|$。

**注**：与两节点三次相同的误差阶 $O(h^4)$，但现在是**分段**的，分段步长 $h$ 可以很小，精度更佳。

### 多节点全局一阶 Hermite 插值

#### 问题表述

对 $n+1$ 个互异节点 $x_0, x_1, \ldots, x_n$，已知各节点处的函数值 $y_i=f(x_i)$ 及一阶导数值 $y'_i=f'(x_i)$，构造次数不超过 $2n+1$ 的多项式 $H(x)$，满足
$$
H(x_i)=y_i,\quad H'(x_i)=y'_i,\qquad i=0,1,\ldots,n.
$$

#### 基函数构造

定义 $\omega_n(x) = \prod_{i=0}^{n}(x - x_i)$，Lagrange 基函数 $l_i(x) = \dfrac{\omega_n(x)}{(x-x_i)\omega_n'(x_i)}$，
则 Hermite 基函数为：
$$
\alpha_i(x) = \left(1 - \frac{\omega_n''(x_i)}{\omega_n'(x_i)}(x-x_i)\right)l_i^2(x),
$$

$$
\beta_i(x) = (x-x_i)l_i^2(x).
$$

**插值公式**：
$$
H(x) = \sum_{i=0}^{n}\bigl(y_i\,\alpha_i(x) + y'_i\,\beta_i(x)\bigr).
$$

#### 误差估计

若 $f\in C^{2n+2}[a,b]$，则余项为：
$$
R(x) = f(x) - H(x) = \frac{f^{(2n+2)}(\xi)}{(2n+2)!}\omega_n^2(x), \quad \xi \in (a,b).
$$

### 多节点全局多阶 Hermite 插值

#### 问题表述

设 $n+1$ 个互异节点 $x_0, x_1, \ldots, x_n$，在节点 $x_i$ 处给定 $m_i$ 个插值条件，即已知 $f^{(j)}(x_i)$（$0\le j\le m_i-1$，$i=0,1,\ldots,n$）。

构造次数不超过 $N=\left(\sum_{i=0}^{n}m_i\right)-1$ 的插值多项式 $H(x)$，满足
$$
H^{(j)}(x_i)=f^{(j)}(x_i),\quad 0\le j\le m_i-1,\; i=0,1,\ldots,n.
$$

#### 基函数构造

负责 $x_i$ 处 $k$ 阶导数（$0\le k\le m_i-1$）的基函数记为 $\phi_{i,k}(x)$，满足
$$
\phi_{i,k}^{(j)}(x_p)=\delta_{ip}\delta_{jk},\quad 0\le j\le m_p-1,\; p=0,1,\ldots,n.
$$

**插值多项式**：
$$
H(x)=\sum_{i=0}^{n}\sum_{k=0}^{m_i-1}f^{(k)}(x_i)\,\phi_{i,k}(x).
$$

#### 误差估计

若 $f\in C^{N+1}[a,b]$，则

$$
R(x)=f(x)-H(x)=\frac{f^{(N+1)}(\xi)}{(N+1)!}\prod_{i=0}^{n}(x-x_i)^{m_i},\qquad \xi\in(a,b),
$$

其中 $N+1=\sum_{i=0}^{n}m_i$。

---

## 样条插值

### 动机

**多节点分段一阶 Hermite 插值**只保证 $C^1$，而**样条插值**在不需要提前给定导数值的情况下，通过方程组自动确定节点导数，实现 $C^2$ 光滑。

### 三次样条插值问题

在 $[a,b]$ 上取节点 $a = x_0 < x_1 < \cdots < x_n = b$，给定 $f(x_i) = y_i$，构造**三次样条插值函数** $s(x)$ 满足：

1. **插值条件**：$s(x_i) = y_i$，$i = 0, 1, \ldots, n$
2. **不高于三次**：$s(x)$ 在每个小区间 $[x_i, x_{i+1}]$ 上是不高于三次的多项式
3. **二阶导连续**：$s(x) \in C^2_{[a,b]}$

**注**：与分段三次 Hermite 插值相比，Hermite 需要预先知道各节点导数值 $y'_i$，而样条插值的 $y'_i$ 通过 $C^2$ 条件**自动确定**。

### 三次样条插值函数构造

**第一步**：局部 Hermite 表示

在每个子区间 $[x_i, x_{i+1}]$（记 $h_i = x_{i+1} - x_i$），用两节点 Hermite 公式表示 $s(x)$，其中 $y'_i = s'(x_i)$ 为待定量：

$$
\begin{aligned}
s(x)
&= \left(1+2\frac{x-x_i}{x_{i+1}-x_i}\right)\left(\frac{x-x_{i+1}}{x_i-x_{i+1}}\right)^2 y_i \\
&+ \left(1+2\frac{x-x_{i+1}}{x_i-x_{i+1}}\right)\left(\frac{x-x_i}{x_{i+1}-x_i}\right)^2 y_{i+1} \\
&+ (x-x_i)\left(\frac{x-x_{i+1}}{x_i-x_{i+1}}\right)^2 y'_i \\
&+ (x-x_{i+1})\left(\frac{x-x_i}{x_{i+1}-x_i}\right)^2 y'_{i+1}
\end{aligned}
$$

**第二步**：利用 $C^2$ 条件

对 $s(x)$ 求二阶导，在内部节点 $x_i$（$i=1,\ldots,n-1$）处要求左右二阶导数相等：$s''(x_i^+) = s''(x_i^-)$。

计算得：

$$
s''(x_i^+) = -\frac{6}{h_i^2}y_i + \frac{6}{h_i^2}y_{i+1} - \frac{4}{h_i}y'_i - \frac{2}{h_i}y'_{i+1}
$$

$$
s''(x_i^-) = \frac{6}{h_{i-1}^2}y_{i-1} - \frac{6}{h_{i-1}^2}y_i + \frac{2}{h_{i-1}}y'_{i-1} + \frac{4}{h_{i-1}}y'_i
$$

令两者相等，整理后得到**关于 $y'_{i-1}, y'_i, y'_{i+1}$ 的三对角方程**：

$$
(1-\alpha_i)y'_{i-1} + 2y'_i + \alpha_i y'_{i+1} = \beta_i, \quad i = 1, 2, \ldots, n-1
$$

其中：

$$
\alpha_i = \frac{h_{i-1}}{h_{i-1}+h_i}, \quad \beta_i = 3\left(\frac{1-\alpha_i}{h_{i-1}}(y_i - y_{i-1}) + \frac{\alpha_i}{h_i}(y_{i+1}-y_i)\right)
$$

**注**：方程数为 $n-1$，未知数为 $n+1$ 个，还需**2个边界条件**才能封闭方程组。

### 三类边界条件

| 边界类型 | 条件 | 补充方程 |
| :--- | :--- | :--- |
| **固支边界** | $f'(x_0) = y'_0$，$f'(x_n) = y'_n$ 已知 | 直接代入，方程数减为 $n-1$ |
| **自然边界** | $s''(x_0) = 0$，$s''(x_n) = 0$ | $2y'_0 + y'_1 = \dfrac{3}{h_0}(y_1-y_0)$ 及对称式 |
| **周期边界** | $f(x_0)=f(x_n)$，$f'(x_0)=f'(x_n)$，$f''(x_0)=f''(x_n)$ | $y'_0 = y'_n$ 及额外方程 |

**注**：周期边界有用的条件是后两个，第一个条件应是数据已经满足的，否则不能使用周期边界条件。

**自然边界条件下的完整线性方程组**：

$$
\begin{cases}
2y'_0 + \alpha_0 y'_1 = \beta_0 \equiv 3(y_1-y_0)/h_0 \\
(1-\alpha_1)y'_0 + 2y'_1 + \alpha_1 y'_2 = \beta_1 \\
\quad \vdots \\
(1-\alpha_{n-1})y'_{n-2} + 2y'_{n-1} + \alpha_{n-1}y'_n = \beta_{n-1} \\
(1-\alpha_n)y'_{n-1} + 2y'_n = \beta_n \equiv 3(y_n-y_{n-1})/h_{n-1}
\end{cases}
$$

这里约定 $\alpha_0 = 1$，$\alpha_n = 0$。

### 追赶法求解

该三对角方程组通过**追赶法**高效求解：

#### 前向消元（追）

由第一个方程得 $y'_0 = A_0 y'_1 + B_0$，其中：

$$
A_0 = -\frac{\alpha_0}{2}, \quad B_0 = \frac{\beta_0}{2}
$$

递推关系（$i = 0, 1, \ldots, n-1$）：

$$
y'_i = A_i y'_{i+1} + B_i
$$

$$
A_i = -\frac{\alpha_i}{2+(1-\alpha_i)A_{i-1}}, \quad B_i = \frac{\beta_i-(1-\alpha_i)B_{i-1}}{2+(1-\alpha_i)A_{i-1}}
$$

#### 后向回代（赶）

$$
y'_n = B_n = \frac{\beta_n - (1-\alpha_n)B_{n-1}}{2+(1-\alpha_n)A_{n-1}}
$$

然后依次计算 $y'_{n-1}, y'_{n-2}, \ldots, y'_0$：

$$
y'_i = A_i y'_{i+1} + B_i
$$

#### 算法实现

```python
def cubic_spline_natural(x, y):
    """自然边界条件三次样条插值"""
    n = len(x) - 1
    h = [x[i+1] - x[i] for i in range(n)]  # 子区间长度

    # 计算 alpha, beta
    alpha = [0.0] * (n + 1)
    beta  = [0.0] * (n + 1)
    alpha[0] = 1.0  # 自然边界约定
    beta[0]  = 3.0 * (y[1] - y[0]) / h[0]
    for i in range(1, n):
        alpha[i] = h[i-1] / (h[i-1] + h[i])
        beta[i]  = 3.0 * ((1 - alpha[i]) * (y[i] - y[i-1]) / h[i-1]
                         + alpha[i] * (y[i+1] - y[i]) / h[i])
    alpha[n] = 0.0  # 自然边界约定
    beta[n]  = 3.0 * (y[n] - y[n-1]) / h[n-1]

    # 前向消元（追）
    A = [0.0] * n
    B = [0.0] * (n + 1)
    A[0] = -alpha[0] / 2.0
    B[0] =  beta[0]  / 2.0
    for i in range(1, n):
        denom = 2.0 + (1 - alpha[i]) * A[i-1]
        A[i] = -alpha[i] / denom
        B[i] = (beta[i] - (1 - alpha[i]) * B[i-1]) / denom

    # 后向回代（赶）
    m = [0.0] * (n + 1)  # 各节点处的一阶导数值
    denom_n = 2.0 + (1 - alpha[n]) * A[n-1]
    m[n] = (beta[n] - (1 - alpha[n]) * B[n-1]) / denom_n
    for i in range(n-1, -1, -1):
        m[i] = A[i] * m[i+1] + B[i]

    return m

def eval_spline(x, y, m, t):
    """在 t 处求值"""
    # 找到 t 所在子区间 [x_i, x_{i+1}]
    i = max(0, min(len(x)-2, next((j for j in range(len(x)-1) if x[j+1] >= t), len(x)-2)))
    h_i = x[i+1] - x[i]
    u = (t - x[i]) / h_i
    # Hermite 基函数
    h00 = (1 + 2*u) * (1 - u)**2
    h10 = u         * (1 - u)**2
    h01 = u**2      * (3 - 2*u)
    h11 = u**2      * (u - 1)
    return h00*y[i] + h10*h_i*m[i] + h01*y[i+1] + h11*h_i*m[i+1]
```

**注**：

- 追赶法时间复杂度为 $O(n)$，远优于直接解三对角线性方程组的通用方法。
- 三对角矩阵严格对角占优（每行对角元素为 2，非对角元素之和 $\leq 1$），故追赶法数值稳定。

### 误差估计

设 $f(x) \in C^4_{[a,b]}$，$s(x)$ 为满足固支边界条件的三次样条，则：

$$
|f^{(k)}(x) - s^{(k)}(x)| \leq C_k M_4 h^{4-k}, \quad k = 0, 1, 2, 3
$$

| $k$ | $C_k$ | 物理含义 |
| :---: | :---: | :--- |
| 0 | $5/384$ | 函数值误差，阶 $O(h^4)$ |
| 1 | $1/24$ | 一阶导误差，阶 $O(h^3)$ |
| 2 | $3/8$ | 二阶导误差，阶 $O(h^2)$ |
| 3 | $(\beta+\beta^{-1})/2$ | 三阶导误差，$\beta = \max h_i / \min h_i$ |

**收敛性**：当 $h \to 0$ 时，$s^{(k)}(x) \to f^{(k)}(x)$（$k = 0,1,2$），当 $\beta$ 有界时三阶导也收敛。

---

## 三种插值方法对比

| 方法 | 光滑阶 | 误差阶 | 需要 $y'_i$ | 特点 |
| :--- | :---: | :---: | :---: | :--- |
| 分段线性插值 | $C^0$ | $O(h^2)$ | 否 | 简单，导数不连续 |
| 分段三次 Hermite | $C^1$ | $O(h^4)$ | 是 | 一阶导连续，精度高 |
| 三次样条插值 | $C^2$ | $O(h^4)$ | 否 | 二阶导连续，最光滑 |

**复杂度**：

| 方法 | 时间复杂度 | 空间复杂度 | 说明 |
| :--- | :---: | :---: | :--- |
| 分段线性插值（求值） | $O(\log n)$ | $O(n)$ | 二分搜索定位区间 |
| 分段三次 Hermite（求值） | $O(\log n)$ | $O(n)$ | 同上，系数已知 |
| 三次样条（建立） | $O(n)$ | $O(n)$ | 追赶法解三对角系统 |
| 三次样条（求值） | $O(\log n)$ | $O(n)$ | 建立后同 Hermite |

**注**：Hermite 插值在已知导数信息时精度与样条相同，但样条通过光滑性条件自动确定导数，更适合只有函数值的情形。

---

## Bézier 曲线与字体设计

### Bézier 曲线定义

**定义**：给定控制点列 $\{\mathbf{P}_i\}$，$i = 0, 1, \ldots, n$，$n$ 次 Bézier 曲线定义为：

$$
\mathbf{P}(t) = \sum_{i=0}^{n} \mathbf{P}_i B_{i,n}(t), \quad t \in [0,1]
$$

其中基函数为 $n$ 次 **Bernstein 多项式**：

$$
B_{i,n}(t) = \binom{n}{i} t^i (1-t)^{n-i}
$$

### 典型情形

| 次数 | 控制点数 | 曲线形状 | SVG 命令 |
| :---: | :---: | :--- | :--- |
| 1 次 | 2 | 直线段 | `L x y` |
| 2 次 | 3 | 抛物线弧 | `Q x1 y1, x y` |
| 3 次 | 4 | 三次曲线 | `C x1 y1, x2 y2, x y` |

**注**：SVG 中的 `T x y` 命令绘制二次 Bézier 曲线，控制点为前一控制点与当前起点的中心对称点，实现曲线的**平滑连接**。

### 与插值的关系

Bézier 曲线是**逼近**而非插值：曲线通过首末控制点，但一般不通过中间控制点。

现代字体（如 SVG、OpenType 格式）使用分段 Bézier 曲线描述字形轮廓，每段二次或三次曲线的拼接要求导数连续，这正是 Hermite 插值思想的工程应用。
