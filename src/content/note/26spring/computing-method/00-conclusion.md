---
title: '知识点梳理'
excerpt: '26 春 计算方法期中知识点梳理'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'April 24 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## L01 误差分析

### 误差

- **绝对误差**：
    $$
    e(x^*) = x - x^*
    $$
    有时也简称为**误差**。
- **绝对误差限**：
    $$
    |e(x^*)| \leq \varepsilon
    $$
    其中绝对误差绝对值的上界 $\varepsilon$ 即为绝对误差限。
- **相对误差**：
    $$
    e_r(x^*) = \frac{e(x^*)}{x} \approx \frac{e(x^*)}{x^*}
    $$
- **相对误差限**：
    $$
    |e_r(x^*)| \leq \varepsilon_r = \frac{\varepsilon}{|x^*|}
    $$
    其中相对误差绝对值的上界 $\varepsilon_r$ 即为相对误差限。

### 误差传播

- **绝对误差传播**：
    $$
    \begin{aligned}
    e(y^*)
    &\approx \sum_{i=1}^n \frac{\partial f}{\partial x_i}(x^*) e(x_i^*) \\
    &= \nabla f(x^*)^\top \mathbf{e}(x^*)
    \end{aligned}
    $$
- **相对误差传播**：
    $$
    \begin{aligned}
    e_r(y^*)
    &\approx \sum_{i=1}^n \frac{\partial f}{\partial x_i}(x^*) \frac{x_i^*}{y^*} e_r(x_i^*) \\
    &= \nabla_{\ln} f(x^*)^\top \mathbf{e}_r(x^*)
    \end{aligned}
    $$
    其中
    $$
    \nabla_{\ln} f(x) \in \mathbb{R}^n, \quad
    \left( \nabla_{\ln} f(x) \right)_i
    = \frac{\partial \ln f}{\partial \ln x_i}(x)
    = \frac{x_i}{f(x)} \frac{\partial f}{\partial x_i}(x)
    $$

    本质上是因为 $e_r(y^*) = \frac{y - y^*}{y^*} \approx \Delta (\ln y)$。

### 有效数字

**定义**：
$x^*$ 若可规格化为以下浮点数
$$
\pm 0.\alpha_1\alpha_2\cdots\alpha_n \times 10^m, \quad \alpha_1 \neq 0
$$
其中写出的数字都是准确的，则称 $x^*$ 有 **$n$ 位有效数字**。

**等价定义**：
$x^*$ 的绝对误差限若满足
$$
|e(x^*)| \le \frac{1}{2} \times 10^{m-n}
$$
其中 $m$ 为 $x^*$ 规格化表示中的指数，则称 $x^*$ 有 **$n$ 位有效数字**。

**性质**：

- **绝对误差限**：
    $$
    |e(x^*)| \le \frac{1}{2} \times 10^{m-n}
    $$
- **相对误差限**：
    $$
    |e_r(x^*)| \le \frac{1/2 \times 10^{m-n}}{\alpha_1 \times 10^{m-1}} = \frac{1}{2\alpha_1} \times 10^{-(n-1)}
    $$
- **相对误差限反推有效数字**：

    若 $x^* \ne 0$ 的相对误差限满足：
    $$
    |e_r(x^*)| \leq \frac{1}{2(\alpha_1+1)} \times 10^{-(n-1)}
    $$
    则 $x^*$ 至少有 $n$ 位有效数字。

### 数值问题和数值方法的性质

1. 数值问题的适定性就是数值问题的**解存在唯一**，且**关于参数连续**。
2. 数值方法的一致性就是**近似函数**接近**准确函数**。
3. 数值方法的稳定性就是**近似解关于近似参数连续**。
4. 数值方法的收敛性就是**近似解**接近**准确解**。

**定义**：数值计算问题是**适定的**，当且仅当满足：

1. **解存在**：对给定 $d$，至少存在一个解 $x$
2. **解唯一**：解在解空间中唯一
3. **解关于参数连续**：
    参数 $d$ 的微小扰动 $\delta d$ 仅引起解 $x$ 的微小变化 $\delta x$。
    具体来说，设问题扰动为 $F(x + \delta x, d + \delta d) = 0$，则对任意 $d$，
    存在 $\eta_0 > 0$ 和 $K_0 > 0$，使得当 $\|\delta d\| \leq \eta_0$ 时：
    $$
    \|\delta x\| \leq K_{0} \|\delta d\|
    $$

**定义**：对近似问题序列 $F_n(x_n, d_n) = 0$，若
$$
F_n(x, d) - F(x, d) \to 0 \quad (n \to \infty)
$$
其中 $x$ 是原问题的准确解，则称该序列**一致**。

**定义**：对近似问题序列 $F_n(x_n, d_n) = 0$，若对任意 $d_n$，
存在 $\eta_0 > 0$ 和 $K_0 > 0$，使得当 $\|\delta d_n\| \leq \eta_0$ 时：
$$
\|\delta x_n\| \leq K_{0} \|\delta d_n\|
$$
则称该序列**稳定**。

**定义**：对近似问题序列 $F_n(x_n, d_n) = 0$，若对任意 $\varepsilon > 0$，
存在 $n_0 \in \mathbb N$ 和 $\delta > 0$，使得当 $n > n_0$ 且 $\|\delta d_n\| \leq \delta$ 时：
$$
\|x(d) - x_n(d + \delta d_n)\| \leq \varepsilon
$$
则称该序列**收敛**。

**Lax-Richtmyer 定理**：

对满足 $\text{Consistency}$ 的数值方法，有：
$$
\text{Stability} \Leftrightarrow \text{Convergence}
$$

**注**：由于收敛性涉及到**准确解**，故一般不好判断。该定理可将收敛性转化为稳定性进行判断。

## L02 解线性方程组的直接法（Gauss 消去法、列主元消去法）

### GAUSS 消去法的矩阵视角

高斯消元的每一步可表示为左乘一个初等下三角矩阵 $\mathbf{M}_k$，其逆的乘积构成 LU 分解中的下三角部分 $\mathbf{L}$。

第 $k$ 步消元矩阵定义为：
$$
\mathbf{M}_k = \mathbf{I} - \mathbf{m}_k \mathbf{e}_k^\top
$$
其中 $\mathbf{m}_k = [0,\dots,0,m_{k+1,k},\dots,m_{n,k}]^\top$，$m_{j,k}=a_{j,k}^{(k)}/a_{k,k}^{(k)}$，$\mathbf{e}_k$ 为标准基向量。

易得：
$$
\mathbf{M}_k^{-1} = \mathbf{I} + \mathbf{m}_k \mathbf{e}_k^\top
$$

经过 $n-1$ 步消元：
$$
\mathbf{U} = \mathbf{M}_{n-1} \cdots \mathbf{M}_2 \mathbf{M}_1 \mathbf{A}
$$
令：
$$
\mathbf{L} = \mathbf{M}_1^{-1} \mathbf{M}_2^{-1} \cdots \mathbf{M}_{n-1}^{-1}
$$
则得到 LU 分解：
$$
\mathbf{A} = \mathbf{L} \mathbf{U}
$$

$\mathbf{L}$ 为单位下三角矩阵，其第 $j$ 行第 $k$ 列（$j>k$）的元素恰为第 $k$ 步的消元乘子 $m_{j,k}$：
$$
\mathbf{L} = \begin{pmatrix}
1 & & & & \\
m_{21} & 1 & & & \\
m_{31} & m_{32} & 1 & & \\
\vdots & \vdots & \ddots & \ddots & \\
m_{n1} & m_{n2} & \cdots & m_{n,n-1} & 1
\end{pmatrix}
$$

### 列主元消去法

在每一步选择该列中绝对值最大的元素作主元并交换行，称为**部分选主元**（partial pivoting）。
由于 $\mathbf A$ 的非奇异性，这是存在的，否则该列会与前面的列线性相关。

## L02 解线性方程组的直接法（LU 分解、Cholesky 分解）

### LU 分解

一个方阵 $A$ （不一定可逆）分解为一个单位下三角矩阵 $L$ 和一个上三角矩阵 $U$ 的乘积：
$$
A = LU
$$

**计算公式**：

$$
u_{kj} = a_{kj} - \sum_{m=1}^{k-1} l_{km}u_{mj}, \quad j=k,k+1,\dots,n
$$

$$
l_{ik} = \frac{1}{u_{kk}}\left(a_{ik} - \sum_{m=1}^{k-1} l_{im}u_{mk}\right), \quad i=k+1,k+2,\dots,n
$$

### LU 分解求解线性方程组

给定线性方程组 $Ax=b$，若已知 $A=LU$，则可转化为两步求解：

1. **前向代入（Forward Substitution）**：求解 $Ly = b$
   $$
   y_i = b_i - \sum_{j=1}^{i-1} l_{ij}y_j, \quad i=1,2,\dots,n
   $$

2. **后向代入（Backward Substitution）**：求解 $Ux = y$
   $$
   x_i = \frac{1}{u_{ii}}\left(y_i - \sum_{j=i+1}^{n} u_{ij}x_j\right), \quad i=n,n-1,\dots,1
   $$

### Cholesky 分解

若 $A \in \mathbb{R}^{n \times n}$ 是对称正定矩阵，则存在唯一的下三角矩阵 $L$（对角元为正），使得：
$$
A = LL^\top
$$

**计算公式**：

$$
l_{kk} = \sqrt{a_{kk} - \sum_{j=1}^{k-1} l_{kj}^2}, \quad k=1,2,3,\dots,n
$$
$$
l_{ik} = \frac{1}{l_{kk}}\left(a_{ik} - \sum_{j=1}^{k-1} l_{ij}l_{kj}\right), \quad i=k+1,k+2,\dots,n
$$

### LDL^T 分解

设 $A \in \mathbb{R}^{n \times n}$ 是对称矩阵，且其所有顺序主子式 $\det(A_k) \neq 0$（其中 $A_k$ 为 $A$ 的前 $k$ 阶顺序主子阵），
则存在唯一的单位下三角矩阵 $L$（对角元全为 $1$）和对角矩阵 $D$（对角元 $d_k \neq 0$），使得：
$$
A = LDL^T
$$

特别地，若 $A$ 对称正定（SPD），则所有 $d_k > 0$。

**计算公式**：

$$
d_k = a_{kk} - \sum_{j=1}^{k-1} l_{kj}^2 d_j, \quad k=1,2,\dots,n
$$
$$
l_{ik} = \frac{1}{d_k} \left( a_{ik} - \sum_{j=1}^{k-1} l_{ij} l_{kj} d_j \right), \quad i=k+1,\dots,n
$$

## L04 解线性方程组的直接法（误差分析、超定方程组）

### 向量范数

映射 $\|\cdot\|:\mathbb{R}^n\to\mathbb{R}$ 满足：

1. **正定性**：$\|\mathbf{x}\|\geq 0$，且 $\|\mathbf{x}\|=0 \Leftrightarrow \mathbf{x}=\mathbf{0}$
2. **齐次性**：$\|\alpha\mathbf{x}\| = |\alpha|\|\mathbf{x}\|$，$\forall \alpha\in\mathbb{R}$
3. **三角不等式**：$\|\mathbf{x}+\mathbf{y}\| \leq \|\mathbf{x}\|+\|\mathbf{y}\|$

### 矩阵范数

映射 $\|\cdot\|:\mathbb{R}^{n\times n}\to\mathbb{R}$ 满足：

1. **正定性**：$\|\mathbf{A}\|\geq 0$，且 $\|\mathbf{A}\|=0 \Leftrightarrow \mathbf{A}=\mathbf{0}$
2. **齐次性**：$\|\alpha\mathbf{A}\| = |\alpha|\|\mathbf{A}\|$
3. **三角不等式**：$\|\mathbf{A}+\mathbf{B}\| \leq \|\mathbf{A}\|+\|\mathbf{B}\|$
4. **相容性（次可乘性）**：$\|\mathbf{AB}\| \leq \|\mathbf{A}\|\|\mathbf{B}\|$

### 向量范数与矩阵范数相容

若对 $\forall \mathbf{A} \in \mathbf{R}^{n \times n}$ 与 $\forall \mathbf{x} \in \mathbf{R}^n$，都有：
$$
\| \mathbf{A} \mathbf{x} \| \le \| \mathbf{A} \| \| \mathbf{x} \|
$$
则称式中的向量范数和矩阵范数相容。

不是任意向量范数与任意矩阵范数都相容的。但是我们可以做到：

- 对任意向量范数，构造一个矩阵范数与之相容。即诱导范数。
- 对任意矩阵范数，构造一个向量范数与之相容。给定矩阵范数 $\|\cdot\|$，定义向量范数如下：
   $$
   \|\mathbf{x}\| := \|\mathbf{x}\mathbf{u}^T\|
   $$
   其中 $\mathbf{u}$ 是任意一个固定的非零向量。

### 诱导范数

由向量范数 $\|\cdot\|$ 诱导的：
$$
\|\mathbf{A}\| \equiv \max_{\mathbf{x}\neq\mathbf{0}} \frac{\|\mathbf{Ax}\|}{\|\mathbf{x}\|} = \max_{\|\mathbf{x}\|=1} \|\mathbf{Ax}\|
$$
是一个矩阵范数。

不是所有矩阵范数都是诱导范数。$1, 2, \infty$- 向量范数的诱导范数均为对应的矩阵范数。

### 谱半径

矩阵 $\mathbf{A} \in \mathbb{C}^{n \times n}$ 的谱半径定义为：
$$
\rho(\mathbf{A}) = \max_{1\leq i\leq n} |\lambda_i|
$$

**定理**：对任意矩阵范数，$\rho(\mathbf{A}) \leq \|\mathbf{A}\|$

**几何意义**：衡量特殊方向特征向量的最大拉伸率。

### 奇异值

矩阵 $\mathbf{A} \in \mathbb{C}^{m \times n}$ 的奇异值定义为：
$$
\sigma_i(\mathbf{A}) = \sqrt{\lambda_i(\mathbf{A}^H\mathbf{A})}, \quad i = 1, 2, \dots, \min(m, n)
$$
其中 $\lambda_i(\mathbf{A}^H\mathbf{A})$ 是 $\mathbf{A}^H\mathbf{A}$ 的特征值，通常按从大到小排列：
$$
\sigma_1(\mathbf{A}) \ge \sigma_2(\mathbf{A}) \ge \cdots \ge \sigma_r(\mathbf{A}) > 0, \quad \sigma_{r+1} = \cdots = 0
$$
$r = \mathrm{rank}(\mathbf{A})$。最大奇异值记为 $\sigma_{\max}(\mathbf{A})$。

**定理**：对任意矩阵，最大奇异值等于矩阵的谱范数（即 $2$-范数）：
$$
\sigma_{\max}(\mathbf{A}) = \|\mathbf{A}\|_2 = \max_{\|\mathbf{x}\|_2 = 1} \|\mathbf{A}\mathbf{x}\|_2
$$

**几何意义**：衡量任意方向（单位）向量的最大拉伸率。

我们知道对任意矩阵范数，有 $\rho(\mathbf{A}) \le \|\mathbf{A}\|$。故：
$$
\rho(\mathbf{A}) \le\sigma_{\max}(\mathbf{A})
$$
从几何意义上看显然奇异值寻找拉伸率的线性空间更大。

### 条件数

在矩阵范数 $\|\cdot\|$ 下，非奇异方阵 $\mathbf{A} \in \mathbf{R}^{n \times n}$ 的条件数为：
$$
\text{Cond}(\mathbf{A}) \equiv \|\mathbf{A}\|\|\mathbf{A}^{-1}\|
$$
特别地，$\text{Cond}(\mathbf{A})_p = \|\mathbf{A}\|_p\|\mathbf{A}^{-1}\|_p$（$p=1,2,\infty$）

1. 下界：
    $$
    \text{Cond}(\mathbf{A}) \geq 1
    $$
2. 正交矩阵：
    若 $\mathbf{A}$ 正交，则其谱范数下的条件数：
    $$
    \text{Cond}(\mathbf{A})_2 = 1
    $$
3. 齐次性：
    $\forall \alpha\neq 0$ 有：
    $$
    \text{Cond}(\alpha\mathbf{A}) = \text{Cond}(\mathbf{A})
    $$
4. 谱条件数：
    $$
    \text{Cond}(\mathbf{A})_2
    = \sqrt{\frac{\lambda_{\max}(\mathbf{A}^T\mathbf{A})}{\lambda_{\min}(\mathbf{A}^T\mathbf{A})}} = \frac{\sigma_{\max}}{\sigma_{\min}}
    $$
5. 等价性：$\mathbb{R}^{n \times n}$ 上的条件数都是等价的

### 条件数的几何意义

**条件数的倒数** $=$ **矩阵到最近奇异矩阵的相对距离**

假设 $\mathbf{A} \in \mathbb{R}^{n \times n}$ 可逆，
矩阵 $\delta\mathbf{A} \in \mathbb{R}^{n \times n}$ 使得 $\mathbf{A} + \delta\mathbf{A}$ 奇异。那么：
$$
\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} \geq \frac{1}{\text{Cond}(\mathbf{A})}
$$

并且如果矩阵范数 $\|\cdot\|$ 由向量范数诱导定义，则存在矩阵 $\delta\mathbf{A}$ 使得上述不等式取等号：

$$
\min_{\mathbf{A}+\delta\mathbf{A}\in\mathcal{S}} \frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} = \frac{1}{\text{Cond}(\mathbf{A})}
$$

其中 $\mathcal{S} = \{\mathbf{M} \mid \det(\mathbf{M}) = 0\}$ 为奇异矩阵集合。

### 误差分析

**右端项扰动分析**：

扰动方程：$\mathbf{A}(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}+\delta\mathbf{b}$

则有**误差估计**：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \|\mathbf{A}\|\|\mathbf{A}^{-1}\| \frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}
$$
也即解的相对误差不超过右端项相对误差的 $\|\mathbf{A}\|\|\mathbf{A}^{-1}\|$ 倍。

**系数矩阵扰动分析**：

扰动方程：$(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}$

则有**误差估计**：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}{1-\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}
$$
也即解的相对误差关于系数矩阵相对误差的函数，当扰动充分小时近似为 $\|\mathbf{A}\|\|\mathbf{A}^{-1}\|$ 倍。

**综合误差分析**：

对于非奇异矩阵 $\mathbf{A} \in \mathbb{R}^{n \times n}$ 及其扰动 $\delta\mathbf{A} \in \mathbb{R}^{n \times n}$ 满足
$$
\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\| < 1
$$

如果 $\mathbf{x} \in \mathbb{R}^n$ 是 $\mathbf{Ax} = \mathbf{b}$ 的解，其中 $\mathbf{b} \in \mathbb{R}^n, \mathbf{b} \neq \mathbf{0}$。
考虑扰动 $\delta\mathbf{b} \in \mathbb{R}^n$，$\delta\mathbf{x}$ 是
$$
(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}+\delta\mathbf{b}
$$
的解。此时有如下**正向先验误差估计**：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|}
\leq \frac{\text{Cond}(\mathbf{A})}{1-\text{Cond}(\mathbf{A})\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}
\left(\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} + \frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}\right)
$$

## L05 解线性方程组的迭代法（Jacobi，Gauss-Seidal，松弛法，收敛性）

### 统一迭代格式

三种方法可统一写成：
$$
\mathbf{x}^{(k+1)} = \mathbf{M}\mathbf{x}^{(k)} + \mathbf{g}
$$

| 方法 | 迭代矩阵 $\mathbf{M}$ | 向量 $\mathbf{g}$ |
| :--- | :--- | :--- |
| **Jacobi** | $\mathbf{M}_J = \mathbf{D}^{-1}(\mathbf{D}-\mathbf{A}) = \mathbf{I} - \mathbf{D}^{-1}\mathbf{A}$ | $\mathbf{g}_J = \mathbf{D}^{-1}\mathbf{b}$ |
| **Gauss-Seidel** | $\mathbf{M}_{GS} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}$ | $\mathbf{g}_{GS} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{b}$ |
| **SOR** | $\mathbf{M}_{SOR} = (\mathbf{D}-\omega\mathbf{L})^{-1}[(1-\omega)\mathbf{D} + \omega\mathbf{U}]$ | $\mathbf{g}_{SOR} = \omega(\mathbf{D}-\omega\mathbf{L})^{-1}\mathbf{b}$ |

### Jacobi 迭代格式

将系数矩阵 $\mathbf{A}$ 分解为：
$$
\mathbf{A} = \mathbf{D} - (\mathbf{D} - \mathbf{A}) = \mathbf{D} - \mathbf{B}
$$
其中 $\mathbf{D} = \text{diag}(a_{11}, a_{22}, \dots, a_{nn})$ 为对角矩阵，$\mathbf{B} = \mathbf{D} - \mathbf{A}$。

原方程 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 改写为：
$$
\mathbf{D}\mathbf{x} = \mathbf{B}\mathbf{x} + \mathbf{b}
$$

若 $a_{ii} \neq 0$（对所有 $i$），则 $\mathbf{D}$ 可逆，得到 **Jacobi 迭代格式**：
$$
\mathbf{x}^{(k+1)}
= \mathbf{D}^{-1}(\mathbf{D}-\mathbf{A})\mathbf{x}^{(k)} + \mathbf{D}^{-1}\mathbf{b} = \mathbf{B}\mathbf{x}^{(k)} + \mathbf{g}
$$

### Gauss-Seidal 迭代格式

将 $\mathbf{A}$ 分裂为：
$$
\mathbf{A} = \mathbf{D} - \mathbf{L} - \mathbf{U}
$$
其中 $\mathbf{L}$ 为严格下三角矩阵（对角线为零），$\mathbf{U}$ 为严格上三角矩阵。

迭代格式变为：
$$
(\mathbf{D} - \mathbf{L})\mathbf{x}^{(k+1)} = \mathbf{U}\mathbf{x}^{(k)} + \mathbf{b}
$$

即 **Gauss-Seidal 迭代格式**：
$$
\mathbf{x}^{(k+1)} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}\mathbf{x}^{(k)} + (\mathbf{D}-\mathbf{L})^{-1}\mathbf{b}
$$

### 松弛法迭代格式

Gauss-Seidel 的更新可看作在当前解 $\mathbf{x}^{(k)}$ 上加上一个修正量：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \Delta\mathbf{x}
$$
其中：
$$
\quad \Delta\mathbf{x} = \mathbf{D}^{-1}[\mathbf{L}\mathbf{x}^{(k+1)} + \mathbf{U}\mathbf{x}^{(k)} + \mathbf{b} - \mathbf{D}\mathbf{x}^{(k)}]
$$

引入松弛因子 $\omega$ 对修正量进行加权：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \omega \Delta\mathbf{x}
$$

整理得 **SOR 迭代格式**：
$$
\mathbf{x}^{(k+1)} = (\mathbf{D}-\omega\mathbf{L})^{-1}[(1-\omega)\mathbf{D} + \omega\mathbf{U}]\mathbf{x}^{(k)} + \omega(\mathbf{D}-\omega\mathbf{L})^{-1}\mathbf{b}
$$

### 收敛的充要条件

迭代格式对任意初始向量 $\mathbf{x}^{(0)}$ 都收敛的**充分必要条件**是：
$$
\rho(\mathbf{M}) < 1
$$

迭代格式对任意初始向量 $\mathbf{x}^{(0)}$ 都收敛的一个**充分条件**是：
存在某个矩阵范数 $\|\cdot\|$ 使得
$$
\|\mathbf{M}\| < 1
$$

### 对角占优与严格对角占优

矩阵 $\mathbf{A}$ 称为**对角占优**，若：
$$
|a_{ii}| \geq \sum_{j\neq i}|a_{ij}|, \quad \forall i=1,\dots,n
$$
且至少对一个 $i$ 严格不等式成立。若对所有 $i$ 都严格成立，则称为**严格对角占优**。

### 严格对角占优矩阵的收敛性

若迭代格式矩阵 $\mathbf{A}$ 严格对角占优，则

- $\mathbf{A}$ 非奇异
- Jacobi 迭代法对任意初始向量收敛
- Gauss-Seidel 迭代法对任意初始向量收敛

## L06 解线性方程组的迭代法（二次函数极值，最速下降法，共轭梯度法）

### 求解问题

本讲聚焦于 $\mathbf{A} \in \mathbb{R}^{n \times n}$ 对称正定的情形。
此时求解线性方程组 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 等价于求解如下二次函数的极小值问题：
$$
\phi(\mathbf{x}) = \frac{1}{2} \mathbf{x}^\top \mathbf{A} \mathbf{x} - \mathbf{b}^\top \mathbf{x}
$$

对于一般的方程 $\mathbf{A} \mathbf{x} = \mathbf{b}$，
转化为 $\mathbf{A}^\top \mathbf{A} \mathbf{x} = \mathbf{A}^\top \mathbf{b}$ 即可同理求解。

### 最速下降法

每一步沿**当前点处函数下降最快的方向**（即负梯度方向）进行一维搜索。

**初始化**：给定初值 $\mathbf{x}^{(0)}$，计算梯度 $\mathbf{g}^{(0)} = \mathbf{A} \mathbf{x}^{(0)} - \mathbf{b}$

**循环**：

- 计算 $\mathbf{t} = \mathbf{A} \mathbf{g}^{(k)}$
- 计算步长：
    $\alpha^{(k)} = \dfrac{ \langle \mathbf{g}^{(k)}, \mathbf{g}^{(k)} \rangle }
    { \langle \mathbf{g}^{(k)}, \mathbf{t} \rangle }$
- 更新解：$\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} - \alpha^{(k)} \mathbf{g}^{(k)}$
- 更新梯度：$\mathbf{g}^{(k+1)} = \mathbf{g}^{(k)} - \alpha^{(k)} \mathbf{t}$
- 若 $\|\mathbf{r}^{(k+1)}\|_2 = \|\mathbf{g}^{(k+1)}\|_2 < \varepsilon$，终止；否则继续循环

### 共轭梯度法

**不再使用负梯度方向，而是构造一组 $\mathbf{A}$-共轭搜索方向** $\{\mathbf{d}^{(k)}\}$，使得在 $n$ 步内精确收敛，避免震荡。

**初始化**：
给定初值 $\mathbf{x}^{(0)}$，
计算梯度 $\mathbf{g}^{(0)} = \mathbf{A}\mathbf{x}^{(0)} - \mathbf{b}$，
设搜索方向 $\mathbf{d}^{(0)} = -\mathbf{g}^{(0)}$

**循环**：

- 计算 $\mathbf{t} = \mathbf{A}\mathbf{d}^{(k)}$
- 计算 $s = \langle \mathbf{d}^{(k)}, \mathbf{t} \rangle$（即 $\langle \mathbf{d}^{(k)}, \mathbf{d}^{(k)} \rangle _\mathbf{A}$）
- 计算步长：
    $\alpha^{(k)} = -\dfrac{ \langle \mathbf{g}^{(k)}, \mathbf{d}^{(k)} \rangle }{ s }$
- 更新解：$\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \alpha^{(k)} \mathbf{d}^{(k)}$
- 更新梯度：$\mathbf{g}^{(k+1)} = \mathbf{g}^{(k)} + \alpha^{(k)} \mathbf{t}$
- 若 $\|\mathbf{r}^{(k+1)}\|_2 = \|\mathbf{g}^{(k+1)}\|_2 < \varepsilon$，终止
- 计算 $\beta^{(k)}$：选择等价形式中的一种，一般采用 FR 形式。
    $\beta^{(k)} = \dfrac{ \|\mathbf{g}^{(k+1)}\|_2^2 }{ \|\mathbf{g}^{(k)}\|_2^2 }$
- 更新搜索方向：$\mathbf{d}^{(k+1)} = -\mathbf{g}^{(k+1)} + \beta^{(k)} \mathbf{d}^{(k)}$

## L07 特征值和特征向量的计算（幂法，幂法加速，Jacobi 法）

### 方法对比与适用场景

| 方法 | 适用矩阵 | 目标特征值 | 计算复杂度 |
| :--- | :--- | :--- | :--- |
| **幂法** | 唯一主特征值 | 最大模特征值 | $O(n^2)$ |
| **位移幂法** | 唯一主特征值 | 离 $\mu$ 最远的特征值 | $O(n^2)$ |
| **降阶幂法** | 对称矩阵 | 前 $k$ 个特征值 | $O(kn^3)$ |
| **反幂法** | 非奇异矩阵 | 最小模特征值 | $O(n^3)$（LU分解）+ $O(n^2)$ |
| **位移反幂法** | 非奇异矩阵 | 离 $\mu$ 最近的特征值 | $O(n^3)$（LU分解）+ $O(n^2)$ |
| **Jacobi 法** | 实对称矩阵 | 所有特征值 | 未优化 $O(n^4)$ |

### 幂法

设 $A \in \mathbb{R}^{n \times n}$ 有唯一主特征值，即：
$$
|\lambda_1| > |\lambda_2| \ge |\lambda_3| \ge \cdots \ge |\lambda_n|
$$
其中 $\lambda_1$ 为实数且几何重数为 $1$。初始向量 $x^{(0)} \in \mathbb{R}^n$ 在 $\lambda_1$ 的特征方向上的投影非零。

为避免溢出问题，每步用 $\infty$-范数进行归一化：

$$
\begin{cases}
y^{(k)} = \dfrac{x^{(k)}}{\|x^{(k)}\|_\infty}, \\[1em]
x^{(k+1)} = A y^{(k)}
\end{cases}, \quad k = 0,1,2,\dots
$$

**收敛性质**：

- $y^{(k)}$ 收敛到 $\lambda_1$ 的一个特征向量。
- 主特征值估计为：
    $$
    \lambda_1^{(k)} = (x^{(k+1)})_j, \quad \text{其中 } j = \arg\max_i |(x^{(k)})_i|
    $$

### 位移幂法

注意到幂法收敛速度为：
$$
\frac{(x^{(k+1)})_j}{(x^{(k)})_j} - \lambda_1
= O\!\left( \left|\dfrac{\lambda_2}{\lambda_1}\right|^k \right)
$$

利用特征值平移性质：
若 $Au_i = \lambda_i u_i$，则 $(A - \mu I)u_i = (\lambda_i - \mu)u_i$，
也即

- $\lambda_i - \mu$ 为 $A - \mu I$ 的特征值
- $u_i$ 仍为 $A - \mu I$ 的特征向量

从而可以选择位移 $\mu$ 使收敛更快：
$$
\left| \frac{\lambda_2 - \mu}{\lambda_1 - \mu} \right| < \left| \frac{\lambda_2}{\lambda_1} \right|
$$

特殊地，对称正定矩阵特征值均为实数，故最优位移为：
$$
\mu = \frac{1}{2}(\lambda_2 + \lambda_n)
$$

### 降阶幂法

假设对称矩阵 $A$，则其特征向量相互正交。

已知主特征值 $\lambda_1$ 和单位主特征向量 $u_1$，构造：
$$
A^{(2)} = A - \lambda_1 \frac{u_1 u_1^T}{u_1^T u_1}
$$
则：

- $A^{(2)} u_1 = 0$
- $A^{(2)} u_i = \lambda_i u_i$（$i=2,3,\dots,n$）

即 $A^{(2)}$ 的特征值为 $0, \lambda_2, \dots, \lambda_n$，可对 $A^{(2)}$ 再次应用幂法求 $\lambda_2, u_2$。
同理可求更多特征对。

实际上 $A^{(2)}$ 消除了主特征方向的所有贡献，从而让次特征方向变为 $A^{(2)}$ 的主特征方向。

### 反幂法

适用于非奇异矩阵。由特征值倒数性质：若 $Au_i = \lambda_i u_i$，则 $A^{-1}u_i = \lambda_i^{-1} u_i$。

因此，对 $A^{-1}$ 应用幂法即得 $|\lambda_n|$ 最小的特征值。

为避免显式求逆，可以将 $x^{(k)} = A^{-1} x^{(k-1)}$ 改为解线性方程组：
$$
A x^{(k)} = x^{(k-1)}
$$

### 位移反幂法

结合位移技术，我们可以求已知近似特征值 $\lambda^*$ 附近的精确特征值。

首先构造 $B = A - \lambda^* I$，然后对 $B$ 应用反幂法求模最小特征值 $\mu$，则待求特征值即为：
$$
\lambda = \mu + \lambda^*
$$

由于 $|\lambda - \lambda^*| \ll |\lambda_i - \lambda^*|$，收敛极快。

### Jacobi 算法

对实对称矩阵 $A$，存在正交矩阵 $Q$ 使 $Q^T A Q = D$ 为对角阵。Jacobi 法通过一系列 **2D 正交变换**（Givens 旋转）逐步消除非对角元。

**算法流程**：

1. 初始化 $V = I_n$，用于累积正交变换矩阵
2. 重复以下步骤，直至所有非对角元绝对值小于给定阈值 $\varepsilon$：
   - 选择当前矩阵中绝对值最大的非对角元 $|a_{pq}| = \max_{i \neq j} |a_{ij}|$
   - 计算旋转参数：
    $$
    \tau = \frac{a_{pp} - a_{qq}}{2a_{pq}}, \quad
    t = -\frac{\text{sign}(\tau)}{|\tau| + \sqrt{1+\tau^2}}, \quad
    c = \frac{1}{\sqrt{1+t^2}}, \quad
    s = c \cdot t
    $$
   - 更新矩阵 $A \leftarrow Q_{pq}^T A Q_{pq}$：
     - 更新四个受影响的对角/非对角元：
       $$
       \begin{aligned}
       a_{pp} &\leftarrow c^2 a_{pp} + s^2 a_{qq} - 2sc\,a_{pq} \\
       a_{qq} &\leftarrow s^2 a_{pp} + c^2 a_{qq} + 2sc\,a_{pq} \\
       a_{pq} &\leftarrow 0, \quad a_{qp} \leftarrow 0
       \end{aligned}
       $$
     - 对 $i \neq p, q$，更新第 $i$ 行和第 $i$ 列：
       $$
       \begin{aligned}
       a_{ip} &\leftarrow c\,a_{ip} - s\,a_{iq} \\
       a_{iq} &\leftarrow s\,a_{ip} + c\,a_{iq}
       \end{aligned}
       $$
       实际操作中需用临时变量保存旧值。
   - 累积正交矩阵 $V \leftarrow V Q_{pq}$：
    $$
    \begin{aligned}
    v_{ip} &\leftarrow c\,v_{ip} - s\,v_{iq} \\
    v_{iq} &\leftarrow s\,v_{ip} + c\,v_{iq}
    \end{aligned}
    $$
3. 循环结束后，对角元 $a_{ii}$ 即为特征值 $\lambda_i$，$V$ 的第 $i$ 列即为对应的特征向量

## L08 特征值和特征向量的计算（QR 分解，SVD 分解）

### Householder 变换

对单位向量 $w \in \mathbb{R}^n$，Householder 矩阵定义为：
$$
H = I - 2ww^T
$$

**性质**：

- 对称：$H^T = H$
- 正交：$H^T H = I \Rightarrow H^2 = I$

**几何意义**：将向量 $x$ 关于与 $w$ 正交的超平面 $\{y \mid w^T y = 0\}$ 镜像反射。

**定理**：

对非零向量 $x, y \in \mathbb{R}^n$ 且 $\|x\|_2 = \|y\|_2$，存在 Householder 矩阵 $H$，使得：
$$
Hx = y
$$

### Householder QR 分解

**输入**：$ A \in \mathbb{R}^{n \times n} $

**输出**：正交矩阵 $ Q $ 和上三角矩阵 $ R $，使得 $ A = QR $

1. 初始化 $ A^{(1)} = A $，$ Q^{(1)} = I_n $
2. 对 $ k = 1, 2, \dots, n-1 $：
   1. 取 $ x^{(k)} = A^{(k)}[k:n, k] \in \mathbb{R}^{(n-k+1)} $
   2. 构造 Householder 矩阵 $ H^{(k)} \in \mathbb{R}^{(n-k+1) \times (n-k+1)} $ 使
    $ H^{(k)} x^{(k)} = -\text{sign}(x_1^{(k)})\|x^{(k)}\|_2 e_1 $
   3. 令 $ \tilde{H}^{(k)} = \begin{bmatrix} I_{k-1} & 0 \\ 0 & H^{(k)} \end{bmatrix} $，注意其仍为 Householder 矩阵
   4. $ A^{(k+1)} = \tilde{H}^{(k)} A^{(k)} $
   5. $ Q^{(k+1)} = Q^{(k)} (\tilde{H}^{(k)})^T $
3. 令 $ Q = Q^{(n)} $，$ R = A^{(n)} $，输出 $ Q, R $ 即为所求

### Givens 旋转变换

Givens 旋转用于有选择地消去矩阵中的特定元素，每次只影响两行（列）。

具体同 Jacobi 算法。

### Givens QR 分解

**输入**：$ A \in \mathbb{R}^{n \times n} $

**输出**：正交矩阵 $ Q $ 和上三角矩阵 $ R $，使得 $ A = QR $

1. 初始化 $ A^{(1)} = A $，$ Q^{(1)} = I_n $
2. 对 $ k = 1, 2, \dots, n-1 $，
   对 $ i = k+1, \dots, n $：
     1. 取 $ a = A^{(k)}[k, k] $，$ b = A^{(k)}[i, k] $
     2. 计算 $ c = \frac{a}{\sqrt{a^2+b^2}} $，$ s = \frac{b}{\sqrt{a^2+b^2}} $
     3. 构造 Givens 矩阵 $ G_{ik} \in \mathbb{R}^{n \times n} $：
        $$
        G_{ik} = \begin{bmatrix}
        1 & & & & & \\
        & \ddots & & & & \\
        & & c & \cdots & s & \\
        & & \vdots & \ddots & \vdots & \\
        & & -s & \cdots & c & \\
        & & & & & 1
        \end{bmatrix}
        $$
        其中非零元位于 $ (k,k), (k,i), (i,k), (i,i) $ 位置
     4. $ A^{(k+1)} = G_{ik}^T A^{(k)} $
     5. $ Q^{(k+1)} = Q^{(k)} G_{ik} $
3. 令 $ Q = Q^{(n)} $，$ R = A^{(n)} $，输出 $ Q, R $ 即为所求

### 两种 QR 分解对比

| 方法 | 每次操作 | 适用场景 |
| :--- | :--- | :--- |
| **Householder** | 消去一整列 | 稠密矩阵 |
| **Givens** | 消去单个元素 | 稀疏矩阵、并行计算 |

### QR 算法

定义**拟上三角矩阵**为对角块为 1 阶或 2 阶的分块上三角矩阵。

**实 Schur 分解**：

对任意 $A \in \mathbb{R}^{n \times n}$，存在正交矩阵 $Q \in \mathbb{R}^{n \times n}$，使：
$$
Q^T A Q = S
$$
其中 $S$ 为拟上三角矩阵，且：  

- 1 阶对角块对应一个实特征值  
- 2 阶对角块对应一对共轭复特征值

**迭代步骤**：

1. QR 分解：$A^{(k)} = Q^{(k)} R^{(k)}$
2. 更新：$A^{(k+1)} = R^{(k)} Q^{(k)} = (Q^{(k)})^T A^{(k)} Q^{(k)}$

显然 $A^{(k+1)}$ 与 $A^{(k)}$ 正交相似，故特征值不变。

**收敛性**：

设 $A$ 是 $n \times n$ 实矩阵，特征值满足：
$$
|\lambda_1| \ge |\lambda_2| \ge \cdots \ge |\lambda_n|
$$
且等号仅出现在共轭复特征值对（即 $\lambda = a \pm bi, b \ne 0$）的情形。

则 QR 迭代产生的 $A^{(k)}$ 收敛到拟上三角矩阵（实 Schur 标准型）。
