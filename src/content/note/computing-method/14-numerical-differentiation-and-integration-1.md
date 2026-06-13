---
title: '数值微分与数值积分（数值微分，Newton-Cotes 积分）'
excerpt: '26 春 计算方法 L14'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '数值微分'
- '数值积分'
pubDate: 'June 04 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 数值微分

### 核心思想

设 $f(x)$ 在区间内有定义，给定步长 $h>0$，通过节点 $x, x\pm h$ 上的函数值构造**差商**近似导数：
$$
f'(x) = \lim_{h\to 0}\frac{f(x+h)-f(x)}{h}
$$

### 数学基础

**Taylor 公式**（Lagrange 余项）：
$$
f(x+h)
= f(x) + \frac{h}{1!}f'(x) + \frac{h^2}{2!}f''(x)
+ \cdots + \frac{h^{n-1}}{(n-1)!}f^{(n-1)}(x) + \frac{h^n}{n!}f^{(n)}(x+\theta h)
$$

其中 $0 \lt \theta \lt 1$。

### 向前差商

$$
f'(x) \approx \frac{f(x+h)-f(x)}{h}
$$

**误差推导**：将 $f(x+h)$ 在 $x$ 处 Taylor 展开至二阶：
$$
f(x+h) = f(x) + hf'(x) + \frac{h^2}{2}f''(x+\theta_1 h)
$$

整理得：
$$
f'(x) - \frac{f(x+h)-f(x)}{h} = -\frac{h}{2}f''(x+\theta_1 h) = O(h)
$$

**截断误差**：一阶精度，主项系数 $-\frac{h}{2}f''(x)$。

### 向后差商

$$
f'(x) \approx \frac{f(x)-f(x-h)}{h}
$$

**误差推导**：将 $f(x-h)$ 在 $x$ 处 Taylor 展开至二阶：
$$
f(x-h) = f(x) - hf'(x) + \frac{h^2}{2}f''(x-\theta_2 h)
$$

整理得：
$$
f'(x) - \frac{f(x)-f(x-h)}{h} = -\frac{h}{2}f''(x-\theta_2 h) = O(h)
$$

**截断误差**：一阶精度。

### 中心差商

$$
f'(x) \approx \frac{f(x+h)-f(x-h)}{2h}
$$

**误差推导**：分别展开 $f(x+h)$ 与 $f(x-h)$ 至三阶：
$$
\begin{aligned}
f(x+h) &= f(x) + hf'(x) + \frac{h^2}{2}f''(x) + \frac{h^3}{6}f'''(x+\theta_1 h) \\
f(x-h) &= f(x) - hf'(x) + \frac{h^2}{2}f''(x) - \frac{h^3}{6}f'''(x-\theta_2 h)
\end{aligned}
$$

两式相减得：
$$
f(x+h)-f(x-h) = 2hf'(x) + \frac{h^3}{6}\left[f'''(x+\theta_1 h) + f'''(x-\theta_2 h)\right]
$$

整理得：
$$
f'(x) - \frac{f(x+h)-f(x-h)}{2h} = -\frac{h^2}{12}\left[f'''(x+\theta_1 h) + f'''(x-\theta_2 h)\right] = O(h^2)
$$

**截断误差**：二阶精度。

**几何直观**：向前/向后差商分别用右/左割线斜率逼近切线斜率，而中心差商用对称割线，利用函数**凹凸性的对称**抵消，使精度提升一阶。

### 插值型数值微分

当函数形式未知，仅知离散节点 $\{x_i\}_{i=0}^n$ 上的函数值 $y_i=f(x_i)$ 时，
可以构造 $n$ 次 Lagrange 插值多项式 $\varphi_n(x)$，以 $\varphi_n^{(k)}(x)$ 近似 $f^{(k)}(x)$。

**误差推导**：

已知插值余项为
$$
R_n(x) = f(x) - \varphi_n(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\omega_{n+1}(x)
$$

其中 $\omega_{n+1}(x)=\prod_{j=0}^n(x-x_j)$。

对余项求导得近似误差：
$$
R_n'(x) = \frac{\mathrm{d}}{\mathrm{d}x}\left[\frac{f^{(n+1)}(\xi)}{(n+1)!}\right]\omega_{n+1}(x) + \frac{f^{(n+1)}(\xi)}{(n+1)!}\omega_{n+1}'(x)
$$

**节点处的误差**：当 $x=x_i$ 时 $\omega_{n+1}(x_i)=0$，故
$$
R_n'(x_i) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\omega_{n+1}'(x_i)
$$

特殊地，取两节点 $x_0, x_1$，步长 $h=x_1-x_0>0$，则线性插值多项式：
$$
\varphi_1(x) = f(x_0)\frac{x-x_1}{x_0-x_1} + f(x_1)\frac{x-x_0}{x_1-x_0} = \frac{f(x_1)(x-x_0)-f(x_0)(x-x_1)}{h}
$$

求导得：

$$
\varphi_1'(x) = \frac{f(x_1)-f(x_0)}{h}
$$

此即向前差商（若 $x=x_0$）或向后差商（若 $x=x_1$）的一般形式。

---

## 数值积分

### 问题描述

定积分 $I=\int_a^b f(x)\,\mathrm{d}x$ 的数值逼近一般形式：

$$
I \approx I_n \equiv \sum_{k=0}^{n} A_k f(x_k)
$$

其中 $x_k$ 为求积节点，$A_k$ 为求积系数。

**定义**（代数精度）：

若求积公式对次数不超过 $m$ 的多项式均精确成立，但对 $m+1$ 次多项式不精确成立，则称该公式具有 **$m$ 次代数精度**。

**注**：代数精度是衡量求积公式质量的核心指标，精度越高，对光滑函数的逼近越好。

### 数学基础

将 $[a,b]$ 作 $n$ 等分，节点 $x_i=a+ih$（$i=0,1,\dots,n$），$h=\frac{b-a}{n}$。以 $P_n(x)$ 为 $f(x)$ 的 $n$ 次 Lagrange 插值多项式：

$$
P_n(x) = \sum_{i=0}^{n} f(x_i) l_i(x),\quad l_i(x)=\prod_{j\neq i}\frac{x-x_j}{x_i-x_j}
$$

积分近似：

$$
\int_a^b f(x)\,\mathrm{d}x \approx \int_a^b P_n(x)\,\mathrm{d}x = \sum_{i=0}^{n}\underbrace{\left[\int_a^b l_i(x)\,\mathrm{d}x\right]}_{A_i} f(x_i)
$$

**积分余项**：

$$
R(f) = \int_a^b \frac{f^{(n+1)}(\xi(x))}{(n+1)!}\omega_{n+1}(x)\,\mathrm{d}x,\quad \omega_{n+1}(x)=\prod_{j=0}^n(x-x_j)
$$

### Newton-Cotes 积分

作变量替换 $x = a + th$（$t\in[0,n]$），则：

$$
\omega_{n+1}(x) = h^{n+1}t(t-1)\cdots(t-n)
$$

$$
\omega_{n+1}'(x_i) = h^n (-1)^{n-i} i!\,(n-i)!
$$

代入系数公式 $A_i = \int_a^b l_i(x)\,\mathrm{d}x$：

$$
\begin{aligned}
A_i &= \int_a^b \frac{\omega_{n+1}(x)}{(x-x_i)\omega_{n+1}'(x)}\,\mathrm{d}x \\
&= \int_0^n \frac{h^{n+1}t(t-1)\cdots(t-n)}{(-1)^{n-i}h^n i!\,(n-i)!\cdot h(t-i)}\,h\,\mathrm{d}t \\
&= (b-a)\cdot\frac{(-1)^{n-i}}{n\cdot i!\,(n-i)!}\int_0^n t(t-1)\cdots(t-i+1)(t-i-1)\cdots(t-n)\,\mathrm{d}t
\end{aligned}
$$

定义 **Newton-Cotes 系数** $C_i^{(n)} = \frac{A_i}{b-a}$，则求积公式统一写为：

$$
\int_a^b f(x)\,\mathrm{d}x \approx (b-a)\sum_{i=0}^{n} C_i^{(n)} f(x_i)
$$

**注**：$C_i^{(n)}$ 仅与 $n$ 有关，与积分区间及被积函数无关，具有通用性。

#### 常用 Newton-Cotes 系数表

| $n$ | $C_0^{(n)}$ | $C_1^{(n)}$ | $C_2^{(n)}$ | $C_3^{(n)}$ | $C_4^{(n)}$ | $C_5^{(n)}$ | $C_6^{(n)}$ | 公式名称 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | $\frac{1}{2}$ | $\frac{1}{2}$ | | | | | | **梯形公式** |
| 2 | $\frac{1}{6}$ | $\frac{4}{6}$ | $\frac{1}{6}$ | | | | | **Simpson 公式** |
| 3 | $\frac{1}{8}$ | $\frac{3}{8}$ | $\frac{3}{8}$ | $\frac{1}{8}$ | | | | **3/8 公式** |
| 4 | $\frac{7}{90}$ | $\frac{32}{90}$ | $\frac{12}{90}$ | $\frac{32}{90}$ | $\frac{7}{90}$ | | | **Cotes 公式** |
| 5 | $\frac{19}{288}$ | $\frac{25}{96}$ | $\frac{25}{144}$ | $\frac{25}{144}$ | $\frac{25}{96}$ | $\frac{19}{288}$ | | |
| 6 | $\frac{41}{840}$ | $\frac{9}{280}$ | $\frac{9}{280}$ | $\frac{34}{105}$ | $\frac{9}{280}$ | $\frac{9}{280}$ | $\frac{41}{840}$ | |

#### 具体积分公式

**1. 梯形公式（Trapezoidal Rule, $n=1$）**

线性插值 $P_1(x)$ 过 $(a,f(a))$ 与 $(b,f(b))$：

$$
\int_a^b f(x)\,\mathrm{d}x \approx \frac{b-a}{2}\bigl[f(a)+f(b)\bigr]
$$

几何意义：以梯形面积近似曲边梯形面积。

**2. Simpson 公式（Parabolic Rule, $n=2$）**

二次插值过 $a, \frac{a+b}{2}, b$ 三点：

$$
\int_a^b f(x)\,\mathrm{d}x \approx \frac{b-a}{6}\left[f(a)+4f\left(\frac{a+b}{2}\right)+f(b)\right]
$$

几何意义：以抛物线围成面积近似原函数积分。

**3. $n=3$ 的 Newton-Cotes 公式**

$$
\int_a^b f(x)\,\mathrm{d}x \approx \frac{b-a}{8}\left[f(x_0)+3f(x_1)+3f(x_2)+f(x_3)\right]
$$

其中 $x_1=\frac{2a+b}{3},\; x_2=\frac{a+2b}{3}$。

### 算法实现

#### 通用 Newton-Cotes 求积

```python
def newton_cotes(f, a, b, n, coeffs):
    """
    通用 Newton-Cotes 积分
    coeffs: 长度为 n+1 的系数列表 C_i^(n)
    """
    h = (b - a) / n
    nodes = [a + i * h for i in range(n + 1)]
    return (b - a) * sum(c * f(x) for c, x in zip(coeffs, nodes))

# 预定义常用系数
TRAPEZOIDAL = [0.5, 0.5]
SIMPSON = [1/6, 4/6, 1/6]
NC3 = [1/8, 3/8, 3/8, 1/8]
NC4 = [7/90, 32/90, 12/90, 32/90, 7/90]
```

#### 复化求积（实用优化）

**注**：单区间高次 Newton-Cotes 可能出现 Runge 现象（高次插值振荡），工程上更常用**复化低阶公式**——将 $[a,b]$ 分为 $m$ 个子区间，在每个子区间上应用梯形或 Simpson 公式。

```python
def composite_simpson(f, a, b, m):
    """复化 Simpson 公式：m 为子区间数（偶数）"""
    if m % 2 == 1:
        m += 1
    h = (b - a) / m
    s = f(a) + f(b)
    for i in range(1, m):
        x = a + i * h
        s += 4 * f(x) if i % 2 == 1 else 2 * f(x)
    return s * h / 3
```

### 误差分析

#### 代数精度定理

**定理 14.1**：$n+1$ 个节点的 Newton-Cotes 求积公式至少具有 $n$ 次代数精度。

**定理 14.2**：当 $n$ 为**偶数**时，$n+1$ 个节点的 Newton-Cotes 求积公式至少具有 $n+1$ 次代数精度。

**证明思路（定理 14.2）**：  
对 $f(x)=x^{n+1}$，需证 $\int_a^b x^{n+1}\,\mathrm{d}x = \sum A_i x_i^{n+1}$。利用对称性，当 $n$ 为偶数时节点关于区间中点对称，被积函数 $x^{n+1}$ 的插值余项积分因奇函数性质在对称区间上为零，故精度额外提升一阶。

#### 梯形公式误差估计

**定理 14.3**：若 $f(x)\in C^2[a,b]$，则梯形公式误差：

$$
R_1(f) = \int_a^b f(x)\,\mathrm{d}x - \frac{b-a}{2}[f(a)+f(b)] = -\frac{(b-a)^3}{12}f''(\eta),\quad a\leq\eta\leq b
$$

**推导**：由线性插值余项 $f(x)-P_1(x)=\frac{f''(\xi)}{2}(x-a)(x-b)$，积分得：

$$
R_1(f) = \int_a^b \frac{f''(\xi(x))}{2}(x-a)(x-b)\,\mathrm{d}x
$$

因 $(x-a)(x-b)\leq 0$ 在 $[a,b]$ 上不变号，应用积分中值定理：

$$
R_1(f) = \frac{f''(\eta)}{2}\int_a^b (x-a)(x-b)\,\mathrm{d}x = -\frac{(b-a)^3}{12}f''(\eta)
$$

**注**：梯形公式具有一次代数精度（对 $f(x)=x^2$ 验证不精确）。

#### Simpson 公式误差估计

**定理 14.4**：若 $f(x)\in C^4[a,b]$，则 Simpson 公式误差：

$$
R_2(f) = \int_a^b f(x)\,\mathrm{d}x - \frac{b-a}{6}\left[f(a)+4f\left(\frac{a+b}{2}\right)+f(b)\right] = -\frac{(b-a)^5}{2880}f^{(4)}(\eta)
$$

**注**：Simpson 公式具有三次代数精度（$n=2$ 为偶数，由定理 14.2 至少 $2+1=3$ 次）。

#### 一般 Newton-Cotes 误差估计

**定理 14.5**：对 $n+1$ 个节点的 Newton-Cotes 公式，

- 当 $n$ 为**偶数**且 $f\in C^{n+2}[a,b]$ 时：

$$
R_n(f) = \frac{h^{n+3}}{(n+2)!}f^{(n+2)}(\eta)\int_0^n t^2(t-1)\cdots(t-n)\,\mathrm{d}t
$$

- 当 $n$ 为**奇数**且 $f\in C^{n+1}[a,b]$ 时：

$$
R_n(f) = \frac{h^{n+2}}{(n+1)!}f^{(n+1)}(\eta)\int_0^n t(t-1)\cdots(t-n)\,\mathrm{d}t
$$

其中 $h=\frac{b-a}{n}$，$a\leq\eta\leq b$。

**注**：误差阶数反映 $n$ 为偶数时精度优势——偶数阶 Newton-Cotes 公式误差为 $O(h^{n+3})$，奇数阶仅为 $O(h^{n+2})$，这与定理 14.2 的代数精度结论一致。

### 数值实验与对比（例题 14.3）

计算 $I=\displaystyle\int_{0.5}^1 \sqrt{x}\,\mathrm{d}x$，精确值 $I=\frac{2}{3}(1-0.5^{3/2})=0.43096441$。

| 方法 | 近似值 | 绝对误差 | 相对误差 |
| :--- | :--- | :--- | :--- |
| 梯形公式 | $0.42677670$ | $4.19\times 10^{-3}$ | $9.7\times 10^{-3}$ |
| Simpson 公式 | $0.43093403$ | $3.04\times 10^{-5}$ | $7.0\times 10^{-5}$ |
| Newton-Cotes ($n=4$) | $0.43096407$ | $3.40\times 10^{-7}$ | $7.9\times 10^{-7}$ |

**结论**：随着 $n$ 增大，Newton-Cotes 公式收敛迅速；但对一般工程问题，复化 Simpson 公式在稳定性与精度间取得最佳平衡，高次单区间 Newton-Cotes（$n\geq 8$）因系数符号交替可能出现数值不稳定，需谨慎使用。

---

### 复杂度与稳定性分析

| 指标 | 梯形公式 | Simpson 公式 | Newton-Cotes ($n$ 阶) |
| :--- | :--- | :--- | :--- |
| **函数求值次数** | 2 | 3 | $n+1$ |
| **代数精度** | 1 | 3 | $n$（$n$ 奇）/ $n+1$（$n$ 偶） |
| **误差阶** | $O(h^3)$ | $O(h^5)$ | $O(h^{n+2})$（奇）/ $O(h^{n+3})$（偶） |
| **稳定性** | 高（系数同号） | 高（系数同号） | $n\geq 8$ 时系数变号，不稳定 |

**注**：
实际计算中，步长 $h$ 的选择需在截断误差（希望 $h$ 小）与舍入误差（希望 $h$ 不太小）之间权衡；数值微分的中心差商在 $h\approx\sqrt[3]{\epsilon_{\mathrm{mach}}}$（机器精度）时达到最优，数值积分的复化公式在 $h$ 足够小时呈现单调收敛。
