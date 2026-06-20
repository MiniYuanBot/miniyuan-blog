---
title: '插值法（二维插值，快速 Fourier 变换）'
excerpt: '26 春 计算方法 L11'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '插值法'
pubDate: 'May 11 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 二维插值

### 问题定义

**给定**：二元函数 $u(x, y)$ 在网格节点处的离散值
$$
u_{i,j} = u(x_i, y_j), \quad i = 0,1,\cdots,n,\; j = 0,1,\cdots,m
$$

**求**：关于 $x$ 为 $n$ 次、$y$ 为 $m$ 次的二元多项式
$$
P_{n,m}(x,y) = \sum_{i=0}^{n}\sum_{j=0}^{m} a_{ij}\, x^i y^j
$$

满足插值条件：
$$
P_{n,m}(x_i, y_j) = u_{i,j} = u(x_i, y_j), \quad i=0,\cdots,n,\; j=0,\cdots,m
$$

其中：

- $P_{n,m}(x,y)$ 称为**插值多项式**
- $(x_i, y_j)$ 称为**插值节点**

### 二维 Lagrange 插值

一维 Lagrange 插值回顾：

$$
\varphi_n(x) = \sum_{i=0}^{n} y_i\, l_i(x), \quad l_i(x_j) = \begin{cases}1, & i=j \\ 0, & i\neq j\end{cases}
$$

**二维推广**：构造插值形式
$$
P_{n,m}(x,y) = \sum_{i=0}^{n}\sum_{j=0}^{m} u_{i,j}\, l_{i,j}(x,y), \quad
l_{i,j}(x_s, y_t) = \begin{cases}1, & i=s,\; j=t \\ 0, & i\neq s \;\text{or}\; j\neq t\end{cases}
$$

**分离变量法**构造基函数：
$$
l_{i,j}(x,y) = l_i(x)\,\tilde{l}_j(y)
$$

其中 $l_i(x)$ 与 $\tilde{l}_j(y)$ 分别为基于以下一维节点的插值基函数：
$$
\Delta_x: a = x_0 < x_1 < \cdots < x_n = b, \quad
\Delta_y: c = y_0 < y_1 < \cdots < y_m = d
$$

插值区域：
$$
D = \{(x,y) \mid a \le x \le b,\; c \le y \le d\}
$$

剖分节点集合：
$$
\Delta = \Delta_x \times \Delta_y = \{(x_i, y_j) \mid 0 \le i \le n,\; 0 \le j \le m\}
$$

**注**：二维 Lagrange 插值要求节点排列在矩形网格上，对散点数据不直接适用。

### 分片双线性插值

**问题**：高次 Lagrange 多项式会引发 **Runge 现象**，二维情形同样不能幸免。

**改进方法**：采用**分片双线性插值**，是一维分段线性插值的直接推广。

$$
P_{1,1}(x,y) = \sum_{i=0}^{n}\sum_{j=0}^{m} u_{i,j}\, \varphi_{i,j}(x,y), \quad
\varphi_{i,j}(x,y) = l_i(x)\,\tilde{l}_j(y)
$$

其中 $l_i(x)$、$\tilde{l}_j(y)$ 为分段线性基函数。

**进一步改进**：**分片双三次 Hermite 插值**，也即在节点处同时插值函数值和偏导数，改善导数连续性。

| 方法 | 次数 | 优点 | 缺点 |
| :--- | :---: | :--- | :--- |
| 全局 Lagrange | $n \times m$ | 精确过所有节点 | 高次时 Runge 现象严重 |
| 分片双线性 | $1 \times 1$ | 简单、稳定 | 节点处导数不连续 |
| 分片双三次 Hermite | $3 \times 3$ | 导数连续，光滑 | 需提供偏导数数据 |

---

## DFT

### 问题背景

**问题定义**：设 $f(x)$ 在 $[0, 2\pi]$ 上 $N+1$ 个等距节点
$$
x_l = \frac{2\pi l}{N}, \quad l = 0, 1, \cdots, N
$$
处的值为 $f(x_l) \equiv f_l$，且满足周期性条件 $f_0 = f_N$，求
$$
P(x) = \sum_{k=0}^{N-1} c_k\, e^{\mathrm{i}kx}
$$
使得以下插值条件成立：
$$
P(x_l) = f(x_l) = f_l, \quad l = 0,1,\cdots,N
$$

**注**：采用指数形式，自动满足周期性。

### DFT 公式

记 $N$ 次单位根：
$$
\omega_N = e^{\mathrm{i}\frac{2\pi}{N}}
$$
则 $e^{\mathrm{i}k\frac{2l\pi}{N}} = \omega_N^{kl}$。

将插值条件代入，得线性方程组：
$$
\mathbf{A}\,\boldsymbol{c} = \boldsymbol{f}
$$

其中矩阵 $\mathbf{A}$ 为 Vandermonde 型复数矩阵：

$$
\mathbf{A}
=
\begin{bmatrix}
1 & 1 & 1 & \cdots & 1 \\
1 & \omega_N & \omega_N^{2} & \cdots & \omega_N^{N-1} \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & \omega_N^{N-1} & \omega_N^{2(N-1)} & \cdots & \omega_N^{(N-1)(N-1)}
\end{bmatrix}
= \begin{bmatrix} \boldsymbol{a}_0 & \boldsymbol{a}_1 & \cdots & \boldsymbol{a}_{N-1} \end{bmatrix}
$$

$$
\boldsymbol{c} = \begin{bmatrix}c_0 & c_1 & \cdots & c_{N-1}\end{bmatrix}^{\mathrm{T}}, \quad
\boldsymbol{f} = \begin{bmatrix}f_0 & f_1 & \cdots & f_{N-1}\end{bmatrix}^{\mathrm{T}}
$$

显然有以下**列向量的正交性**：

$$
(\boldsymbol{a}_j,\, \boldsymbol{a}_k) \equiv \sum_{l=0}^{N-1} \omega_N^{jl}\,\overline{\omega_N^{kl}}
= \sum_{l=0}^{N-1} \omega_N^{(j-k)l}
= \begin{cases} N, & j=k \\ 0, & j\neq k \end{cases}
$$

由正交性，用 $\bar{\boldsymbol{a}}_k^{\mathrm{T}}$ 左乘方程组两边，立即得到 **DFT 正变换公式**：

$$
c_k = \frac{1}{N}\sum_{l=0}^{N-1} f_l\, \omega_N^{-kl}, \quad k=0,1,\cdots,N-1
$$

由矩阵方程即得 **DFT 反变换公式**：

$$
f_l = \sum_{k=0}^{N-1} c_k\, \omega_N^{kl}, \quad l=0,1,\cdots,N-1
$$

### 算法实现

DFT 正变换与反变换时间复杂度均为 $\mathcal{O}(N^2)$。

```python
import numpy as np

def dft_naive(f):
    """朴素 DFT，时间复杂度 O(N^2)"""
    N = len(f)
    c = np.zeros(N, dtype=complex)
    for k in range(N):
        for l in range(N):
            c[k] += f[l] * np.exp(-1j * k * 2 * np.pi * l / N)
        c[k] /= N
    return c

def idft_naive(c):
    """朴素 IDFT，时间复杂度 O(N^2)"""
    N = len(c)
    f = np.zeros(N, dtype=complex)
    for l in range(N):
        for k in range(N):
            f[l] += c[k] * np.exp(1j * k * 2 * np.pi * l / N)
    return f
```

---

## FFT

### 核心思想

**基本策略**：

将 $N$ 个点的 DFT 问题分解为 2 个 $N/2$ 个点的 DFT 问题，重复此过程，直至变成 $N/2$ 个 2 点 DFT 问题。

**前提**：$N = 2^m$，也即 $N$ 为 2 的整数次幂。

**定义单位根**：
$$
\omega_N = e^{-\mathrm{i}\frac{2\pi}{N}}
$$

重写 DFT（令 $a_l \equiv f_l/N$）：
$$
c_k = \frac{1}{N}\sum_{l=0}^{N-1} f_l\, e^{-\mathrm{i}k\frac{2l\pi}{N}}
= \sum_{l=0}^{N-1} a_l\, \omega_N^{kl}, \quad k=0,1,\cdots,N-1
$$

### 数学基础

$$
\omega_N^{k+N/2} = -\omega_N^k
$$

$$
\omega_N^{k+N} = \omega_N^k
$$

且当 $N$ 为偶数时（$k = 0,1,\cdots,N/2-1$）：

$$
(\omega_N^k)^2 = \omega_{N/2}^k
$$

$$
(\omega_N^{k+N/2})^2 = \omega_{N/2}^k
$$

$$
\omega_N^{N/2} = -1
$$

### 奇偶分解推导

对 $k = 0, 1, \cdots, N/2-1$，将求和按偶数项（$l=0,2,\cdots$）和奇数项（$l=1,3,\cdots$）分开：
$$
c_k = \underbrace{\sum_{\substack{l=0,2,\cdots,N-2}} a_l\,(\omega_{N/2}^k)^{l/2}}_{\text{偶数子问题 }E_k}
+ \omega_N^k \underbrace{\sum_{\substack{l=1,3,\cdots,N-1}} a_l\,(\omega_{N/2}^k)^{(l-1)/2}}_{\text{奇数子问题 }O_k}
$$

利用 $\omega_N^{k+N/2} = -\omega_N^k$，得到：
$$
c_{k+N/2} = E_k - \omega_N^k\, O_k
$$

也即：
$$
c_k = E_k + \omega_N^k\, O_k, \quad
c_{k+N/2} = E_k - \omega_N^k\, O_k, \quad k=0,\cdots,\tfrac{N}{2}-1
$$

**几何意义**：每次分治将 $N$ 点问题分为两个 $N/2$ 点问题，每层只需 $O(N)$ 的合并工作，共 $\log_2 N$ 层，总复杂度 $O(N\log N)$。

### 算法实现

**标准递归**：

```python
# 标准递归版
def fft_recursive(a):
    """递归 FFT，要求 N 为 2 的幂，时间复杂度 O(N log N)"""
    N = len(a)
    if N == 1:
        return a                                   # 基础情形：1点DFT即自身
    
    E = fft_recursive(a[0::2])                    # 偶数下标子问题
    O = fft_recursive(a[1::2])                    # 奇数下标子问题
    
    omega = np.exp(-2j * np.pi * np.arange(N // 2) / N)   # 旋转因子
    return np.concatenate([E + omega * O, E - omega * O])  # 蝶形合并
```

**原位迭代**：

```python
# 原位迭代版
def fft_iterative(a):
    """迭代 FFT（原位），避免递归开销，内存高效"""
    N = len(a)
    m = int(np.log2(N))
    
    # 步骤1：位逆序置换
    a = a.copy().astype(complex)
    j = 0
    for i in range(1, N):
        bit = N >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]              # 交换位逆序对
    
    # 步骤2：逐层蝶形运算（原位覆盖）
    length = 2
    while length <= N:
        omega_len = np.exp(-2j * np.pi / length)  # 当前层单位根
        for i in range(0, N, length):              # 枚举每个蝶形组
            omega = 1
            for k in range(length // 2):           # 蝶形运算
                u = a[i + k]
                v = omega * a[i + k + length // 2]
                a[i + k] = u + v                   # 上支路
                a[i + k + length // 2] = u - v     # 下支路
                omega *= omega_len
        length <<= 1
    return a
```

**向量化原位迭代**：

```python
# 向量化版
def fft_vectorized(a):
    """向量化蝶形，减少 Python 循环"""
    N = len(a)
    a = a.copy().astype(complex)
    # 位逆序
    bits = int(np.log2(N))
    indices = np.arange(N)
    rev = sum(((indices >> i) & 1) << (bits - 1 - i) for i in range(bits))
    a = a[rev]
    # 逐层向量化蝶形
    length = 2
    while length <= N:
        half = length // 2
        k = np.arange(half)
        omega = np.exp(-2j * np.pi * k / length)   # 旋转因子（向量）
        for i in range(0, N, length):
            u = a[i:i+half]
            v = omega * a[i+half:i+length]
            a[i:i+half]      = u + v               # 上支路（向量化）
            a[i+half:i+length] = u - v             # 下支路（向量化）
        length <<= 1
    return a
```

---

## 基于 FFT 的大数乘法

### 核心思想

**关键观察**：

一个 $n+1$ 位十进制数 $\overline{a_n a_{n-1}\cdots a_0}$ 等于多项式：
$$
A(x) = a_0 + a_1 x + \cdots + a_n x^n
$$
在 $x=10$ 处的求值，即 $A(10) = \overline{a_n a_{n-1}\cdots a_0}$。

因此，两个大数相乘 $\Leftrightarrow$ 两个多项式相乘：
$$
C(x) = A(x)\cdot B(x), \quad \deg C = n+m
$$

得到 $C(x)$ 的系数后，再用秦九韶算法以 $O(n+m)$ 计算 $C(10)$，即得乘积。

### 算法流程

**总时间复杂度：** $O(N\log N)$，其中 $N > 2n$。

**输入：** $n+1$ 位大数 $A$，$m+1$ 位大数 $B$（$n \ge m$）  
**输出：** 乘积 $A \times B$

| 步骤 | 操作 | 时间复杂度 |
| :---: | :--- | :---: |
| 1 | 将 $A$、$B$ 的各位数字作为多项式系数，零填充至长度 $N$（取大于 $2n$ 的最小 2 的幂次） | — |
| 2 | $\text{FFT}(A) \to$ 频域 $F_A$；$\text{FFT}(B) \to$ 频域 $F_B$ | $O(N\log N)$ |
| 3 | 逐点相乘：$H[k] = F_A[k] \cdot F_B[k]$，$k=0,\dots,N-1$ | $O(N)$ |
| 4 | $\text{IFFT}(H) \to$ 时域 $C$（多项式 $C(x)$ 的系数） | $O(N\log N)$ |
| 5 | 对 $C$ 的系数做进位处理（系数可能 $> 9$） | — |
| 6 | 用秦九韶算法计算 $C(10)$ | $O(n+m)$ |

---

## 复杂度汇总

| 算法 | 时间复杂度 | 空间复杂度 | 适用条件 |
| :--- | :---: | :---: | :--- |
| 二维 Lagrange 插值 | $O((nm)^2)$ | $O(nm)$ | 矩形网格，低次 |
| 分片双线性插值 | $O(nm)$ | $O(nm)$ | 矩形网格，任意规模 |
| DFT（朴素） | $O(N^2)$ | $O(N)$ | 任意 $N$ |
| FFT（Cooley-Tukey） | $O(N\log N)$ | $O(N)$ | $N = 2^m$ |
| 基于 FFT 的大数乘法 | $O(N\log N)$ | $O(N)$ | $N > 2\max(n,m)$ |
