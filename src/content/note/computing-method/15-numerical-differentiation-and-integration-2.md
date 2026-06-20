---
title: '数值微分与数值积分（复化求积方法，逐次分半法，加速收敛技巧与 Romberg 求积）'
excerpt: '26 春 计算方法 L15'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '数值微分'
- '数值积分'
pubDate: 'June 05 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 复化求积方法

### 复化梯形公式

将 $[a,b]$ 进行 $n$ 等分，节点 $x_k = a + kh,\; h = \dfrac{b-a}{n},\; k=0,1,\dots,n$。在每个小区间 $[x_k, x_{k+1}]$ 上应用梯形公式并求和：
$$
\begin{aligned}
I &= \sum_{k=0}^{n-1} \int_{x_k}^{x_{k+1}} f(x)\,\mathrm{d}x \\
  &\approx \sum_{k=0}^{n-1} \frac{h}{2}\bigl[f(x_k)+f(x_{k+1})\bigr] \\
  &= \frac{h}{2}\Bigl[f(a)+f(b)+2\sum_{k=1}^{n-1}f(x_k)\Bigr] \equiv T_n
\end{aligned}
$$

**几何意义**：用 $n$ 个梯形面积之和逼近曲边梯形面积。随着 $n$ 增大，折线逐步贴合原曲线。

### 复化 Simpson 公式

Simpson 公式需要区间中点，因此将 $[a,b]$ 进行 $2n$ 等分，步长 $h = \dfrac{b-a}{2n}$，节点 $x_k = a + kh\;(k=0,1,\dots,2n)$。共 $2n+1$ 个节点。

在每两个小区间组成的大区间 $[x_{2k-2}, x_{2k}]$ 上应用 Simpson 公式：
$$
\int_{x_{2k-2}}^{x_{2k}} f(x)\,\mathrm{d}x \approx \frac{2h}{6}\bigl[f(x_{2k-2})+4f(x_{2k-1})+f(x_{2k})\bigr]
$$

对所有 $k=1,\dots,n$ 求和，得到复化 Simpson 公式：
$$
S_n = \frac{h}{3}\Bigl[f(a)+f(b)+4\sum_{k=1}^{n}f(x_{2k-1})+2\sum_{k=1}^{n-1}f(x_{2k})\Bigr]
$$

**注**：复化 Simpson 的系数呈现 $1,4,2,4,2,\dots,4,1$ 的规律。

### 复化梯形误差

若 $f(x)\in C^2[a,b]$，则存在 $\eta\in(a,b)$ 使得：
$$
R(f,T_n) \equiv \int_a^b f(x)\,\mathrm{d}x - T_n = -\frac{b-a}{12}\,h^2 f''(\eta),\qquad h=\frac{b-a}{n}
$$

**证明**：

在单个小区间 $[x_k, x_{k+1}]$ 上，梯形公式的局部误差为：
$$
\int_{x_k}^{x_{k+1}} f(x)\,\mathrm{d}x - \frac{h}{2}\bigl[f(x_k)+f(x_{k+1})\bigr] = -\frac{h^3}{12}f''(\xi_k),\quad \xi_k\in(x_k,x_{k+1})
$$

对 $n$ 个小区间求和：
$$
R(f,T_n) = \sum_{k=0}^{n-1}\Bigl(-\frac{h^3}{12}f''(\xi_k)\Bigr) = -\frac{h^2}{12}\cdot h\sum_{k=0}^{n-1}f''(\xi_k)
$$

由于 $f''$ 连续，由积分中值定理的离散形式，存在 $\eta\in(a,b)$ 使得：
$$
h\sum_{k=0}^{n-1}f''(\xi_k) = (b-a)\,f''(\eta)
$$

代入即得结论。

### 复化 Simpson 误差

若 $f(x)\in C^4[a,b]$，则存在 $\eta\in(a,b)$ 使得：
$$
R(f,S_n) = -\frac{b-a}{180}\,h^4 f^{(4)}(\eta),\qquad h=\frac{b-a}{2n}
$$

等价地，若记 $h_1 = \dfrac{b-a}{n} = 2h$，则：
$$
R(f,S_n) = -\frac{b-a}{2880}\,h_1^4 f^{(4)}(\eta)
$$

**证明**：

在区间 $[x_{2k-2}, x_{2k}]$（长度 $2h$）上，Simpson 公式的局部误差为：
$$
\int_{x_{2k-2}}^{x_{2k}} f(x)\,\mathrm{d}x - \frac{2h}{6}\bigl[f(x_{2k-2})+4f(x_{2k-1})+f(x_{2k})\bigr]
= -\frac{(2h)^5}{2880}f^{(4)}(\xi_k) = -\frac{h^5}{90}f^{(4)}(\xi_k)
$$

对 $k=1,\dots,n$ 求和，并利用 $n = \dfrac{b-a}{2h}$：
$$
R(f,S_n)
= -\frac{h^5}{90}\sum_{k=1}^{n}f^{(4)}(\xi_k)
= -\frac{b-a}{180}h^4 f^{(4)}(\eta)
$$

**注**：对比可见，复化梯形误差 $O(h^2)$，复化 Simpson 误差 $O(h^4)$。

### 算法实现

```python
def composite_trapezoidal(f, a, b, n):
    """复化梯形公式，n等分"""
    h = (b - a) / n
    s = 0.5 * (f(a) + f(b))
    for k in range(1, n):
        s += f(a + k * h)
    return h * s

def composite_simpson(f, a, b, n):
    """
    复化 Simpson 公式，2n 等分（n 个 Simpson 区间）
    返回 S_n
    """
    h = (b - a) / (2 * n)
    s = f(a) + f(b)
    for k in range(1, 2 * n):
        if k % 2 == 1:
            s += 4 * f(a + k * h)   # 奇数节点，权重 4
        else:
            s += 2 * f(a + k * h)   # 偶数节点，权重 2
    return h * s / 3.0
```

---

## 逐次分半法

### 动机

复化公式要求预先给定步长 $h$，但实际问题中往往难以估计 $f''$ 或 $f^{(4)}$ 的界。

**逐次分半法**（Successive Halving）通过动态加密网格，并利用相邻两次计算结果的差进行**事后误差估计**，从而自适应地控制精度。

### 梯形逐次分半递推

设 $T_n$ 已计算，现将所有小区间对半分，新增中点 $x_{k+1/2} = x_k + \frac{h}{2}$。利用节点复用，$T_{2n}$ 可表示为：
$$
T_{2n} = \frac{1}{2}T_n + \frac{h}{2}\sum_{k=1}^{n}f\bigl(x_{k-1/2}\bigr)
$$

### Simpson 逐次分半递推

类似地，$S_{2n}$ 的小区间对半分，分为 $4n$ 等分，新增中点 $x_{k+1/2} = x_k + \frac{h}{2}$。则其递推公式为：

$$
S_{2n} = \frac{1}{2}S_n + \frac{2h}{3}\sum_{k=1}^{2n}f\bigl(x_{k-1/2}\bigr) - \frac{h}{3}\sum_{k=1}^{n}f(x_{2k-1})
$$

### 复化梯形的事后估计

复化梯形误差满足 $R(f,T_n) \approx c h^2$，其中 $c$ 与 $f''$ 相关。分半后：
$$
R(f,T_{2n}) \approx c\Bigl(\frac{h}{2}\Bigr)^2 = \frac{1}{4}R(f,T_n)
$$

于是：
$$
T_{2n}-T_n = \bigl(I-R(f,T_{2n})\bigr)-\bigl(I-R(f,T_n)\bigr) \approx 3R(f,T_{2n})
$$

即：
$$
I - T_{2n} \approx \frac{T_{2n}-T_n}{3}
$$

**停止准则**：若容许误差为 $\varepsilon$，当 $|T_{2n}-T_n| < 3\varepsilon$ 时，可终止计算并以 $T_{2n}$ 作为近似值。

### 复化 Simpson 的事后估计

同理，$R(f,S_n) \approx c h^4$，分半后 $R(f,S_{2n}) \approx \dfrac{1}{16}R(f,S_n)$。于是：
$$
S_{2n}-S_n \approx 15\,R(f,S_{2n})
$$

即：
$$
I - S_{2n} \approx \frac{S_{2n}-S_n}{15}
$$

**停止准则**：当 $|S_{2n}-S_n| < 15\varepsilon$ 时停止。

### 算法实现

```python
def adaptive_trapezoidal(f, a, b, eps=1e-10, max_iter=20):
    """
    逐次分半梯形法
    """
    n = 1
    h = b - a
    T_prev = h * (f(a) + f(b)) / 2.0   # T_1
    
    for _ in range(max_iter):
        # 计算新增中点函数值之和
        mid_sum = sum(f(a + (k - 0.5) * h) for k in range(1, n + 1))
        T_curr = 0.5 * T_prev + 0.5 * h * mid_sum   # T_{2n}
        
        if abs(T_curr - T_prev) < 3 * eps:
            return T_curr
        
        T_prev = T_curr
        h /= 2.0
        n *= 2
    
    return T_prev
```

---

## Richardson 外推法

### 一般原理

设真值 $F^*$ 的数值近似 $F_1(h)$ 满足误差展开：
$$
F^* - F_1(h) = a_1 h^{p_1} + a_2 h^{p_2} + \cdots + a_k h^{p_k} + \cdots,\qquad 0<p_1<p_2<\cdots
$$

将步长缩为 $qh$（通常 $q=1/2$），有：
$$
F^* - F_1(qh) = a_1 (qh)^{p_1} + a_2 (qh)^{p_2} + \cdots
$$

两式线性组合消去首项 $a_1 h^{p_1}$：
$$
\bigl(1-q^{p_1}\bigr)F^* - \bigl[F_1(qh)-q^{p_1}F_1(h)\bigr] = a_2\bigl(q^{p_2}-q^{p_1}\bigr)h^{p_2}+\cdots
$$

定义外推值：
$$
F_2(h) = \frac{F_1(qh)-q^{p_1}F_1(h)}{1-q^{p_1}}
$$

则 $F_2(h)$ 逼近 $F^*$ 的误差阶提升至 $O(h^{p_2})$。

**递推定义**：对 $m=2,3,\dots$，
$$
F_m(h) = \frac{F_{m-1}(qh)-q^{p_{m-1}}F_{m-1}(h)}{1-q^{p_{m-1}}}
$$

$F_m(h)$ 的误差阶为 $O(h^{p_m})$。

**注**：
外推（extrapolation）与插值（interpolation）相对。
插值是在已知数据点之间估计函数值；外推则是利用已知步长上的计算值，向步长 $h\to 0$ 的外推，以消去低阶误差项。

---

## Romberg 求积

### 构造原理

Romberg 求积在复化梯形公式的基础上应用 Richardson 外推。关键在于复化梯形的误差展开仅含**偶次幂**：
$$
R(f,T_n) = a_2 h^2 + a_4 h^4 + a_6 h^6 + \cdots
$$

这由 [单区间误差的奇次幂结构](../14-numerical-differentiation-and-integration-1#单区间误差的奇次幂结构) 容易看出。

### 递推公式

记 $T_0^{(k)} = T\bigl(h/2^k\bigr)$ 为步长 $h/2^k$ 的复化梯形值（区间 $2^k n$ 等分）。应用 Richardson 外推：
$$
T_m^{(k)}
= \frac{T_{m-1}^{(k+1)}-(1/2)^{2m}T_{m-1}^{(k)}}{1-(1/2)^{2m}}
= \frac{4^m T_{m-1}^{(k+1)}-T_{m-1}^{(k)}}{4^m-1}
,\qquad k,m\ge 0
$$

$T_m^{(k)}$ 的截断误差为 $O\bigl(h^{2m+2}\bigr)$。

**特殊情形**：

- $m=1$：$T_1^{(k)} = \dfrac{4T_0^{(k+1)}-T_0^{(k)}}{3}$，误差 $O(h^4)$。  
- $m=2$：$T_2^{(k)} = \dfrac{16T_1^{(k+1)}-T_1^{(k)}}{15}$，误差 $O(h^6)$。

**注**：$T_1^{(k)}$ 实际上就是复化 Simpson 公式在对应网格上的值。

### T 表计算流程

Romberg 求积的计算过程呈下三角表格（T 表）：

$$
\begin{array}{lccccccc}
 & m=0\text{（梯形）} & & m=1\text{（Simpson）} & & m=2\text{（Cotes）} & & m=3\text{（Romberg）} \\[6pt]
k=0 & T_0^{(0)}\ \text{1th} & \longrightarrow & T_1^{(0)}\ \text{3rd} & \longrightarrow & T_2^{(0)}\ \text{6th}
& \longrightarrow & T_3^{(0)}\ \text{10th} \\[2pt]
 & & \nearrow & & \nearrow & & \nearrow & \\[4pt]
k=1 & T_0^{(1)}\ \text{2nd} & \longrightarrow & T_1^{(1)}\ \text{5th} & \longrightarrow & T_2^{(1)}\ \text{9th} & & \\[2pt]
 & & \nearrow & & \nearrow & & & \\[4pt]
k=2 & T_0^{(2)}\ \text{4th} & \longrightarrow & T_1^{(2)}\ \text{8th} & & & & \\[2pt]
 & & \nearrow & & & & & \\[4pt]
k=3 & T_0^{(3)}\ \text{7th} & & & & & & \\ \\
\text{误差} & O(h^2) & & O(h^4) & & O(h^6) & & O(h^8)
\end{array}
$$

**计算顺序**：按列从左到右，在每一列中利用相邻两行的低阶值外推高阶值。第 0 列通过逐次分半梯形公式计算，后续各列纯为代数组合，无额外函数求值。

### 算法实现

```python
def romberg(f, a, b, max_k=10, eps=1e-12):
    """
    Romberg 求积算法。
    T[k][m] 存储 T_m^{(k)}，其中：
      - 第 0 列 T[k][0] = T_0^{(k)} 为复化梯形（步长 h/2^k）
      - 外推列按 T_m^{(k)} = (4^m * T_{m-1}^{(k+1)} - T_{m-1}^{(k)}) / (4^m - 1)
    最高精度值位于 T[0][k]。
    """
    T = [[0.0] * (max_k + 1) for _ in range(max_k + 1)]
    
    # 初始梯形：T_0^{(0)}，区间 1 等分
    h = b - a
    T[0][0] = h * (f(a) + f(b)) / 2.0
    
    for k in range(1, max_k + 1):
        # ---- 计算第 0 列：T_0^{(k)}（逐次分半梯形） ----
        n = 2 ** k
        h = (b - a) / n
        mid_sum = sum(f(a + (i - 0.5) * h) for i in range(1, n + 1))
        T[k][0] = 0.5 * T[k-1][0] + h * mid_sum
        
        # ---- Richardson 外推，填充当前行可计算的所有列 ----
        # 计算 T_m^{(k-m)}，存储于 T[k-m][m]
        for m in range(1, k + 1):
            row = k - m
            T[row][m] = (4**m * T[row+1][m-1] - T[row][m-1]) / (4**m - 1)
        
        # 检查对角线元素 T[0][k] 的收敛性
        if k >= 1 and abs(T[0][k] - T[0][k-1]) < eps:
            return T[0][k]
    
    return T[0][max_k]
```

---

## 复杂度与对比分析

| 方法 | 误差阶 | 自适应停止 | 光滑性要求 | 核心计算量 |
| :--- | :--- | :--- | :--- | :--- |
| 复化梯形 | $O(h^2)$ | N | $C^2$ | $n+1$ 次求值 |
| 复化 Simpson | $O(h^4)$ | N | $C^4$ | $2n+1$ 次求值 |
| 逐次分半梯形 | $O(h^2)$ | Y | $C^2$ | 动态增长，约 $2^k$ 次 |
| Romberg | $O(h^{2m+2})$ | Y | $C^{2m+2}$ | 同梯形，外推 $O(m^2)$ |

**注**：

- Romberg 求积的性价比极高。

    举例来说，达到 $O(h^8)$ 精度仅需第 0 列的 $T_0^{(0)},\dots,T_0^{(3)}$ 共 $1+2+4+8=15$ 个函数值，而直接复化 Simpson 要达到同等精度可能需要数百个节点。
- 然而，Romberg 要求 $f$ 具有足够的高阶光滑性；若 $f^{(2m+2)}$ 不存在或过大，高阶外推可能失效，此时应退回低阶公式或逐次分半法。
