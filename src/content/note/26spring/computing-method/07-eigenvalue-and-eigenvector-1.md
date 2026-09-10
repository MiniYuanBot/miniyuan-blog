---
title: '特征值和特征向量的计算（幂法，幂法加速，Jacobi 法）'
excerpt: '26 春 计算方法 L07'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'April 17 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 问题引入

![图 1：弹簧-质点系统|w=50%](01-spring-system.png)

考虑弹簧-质点系统，质点 $m_j$ 的竖向位移为 $y_j(t)$，运动方程为：
$$
M\ddot{y} + Ky = 0
$$
其中：

- $M = \text{diag}(m_1,m_2,m_3)$ 为质量矩阵（对角阵）
- $K$ 为刚度矩阵（对称正定）

设 $y_j(t) = x_j e^{i\omega t}$（**谐波振动假设**），代入得：
$$
(-\omega^2 M + K)x = 0 \Rightarrow Kx = \omega^2 Mx
$$

当 $M$ 可逆时，转化为标准特征值问题：
$$
A x = \lambda x
$$
其中 $A = M^{-1}K, \lambda = \omega^2$

---

## 特征值与特征向量基本概念回顾

### 基本定义

1. **特征多项式与特征方程**：

    矩阵 $A \in \mathbb{R}^{n \times n}$ 的特征多项式为：
    $$
    \phi(\lambda) = \det(\lambda I - A) = \lambda^n + c_1\lambda^{n-1} + \cdots + c_n
    $$
    特征方程 $\phi(\lambda)=0$ 的根 $\lambda_1,\dots,\lambda_n$ 称为特征值，集合 $\lambda(A)$ 称为特征谱。

2. **特征向量与特征子空间**：

    对特征值 $\lambda$，齐次方程 $(\lambda I - A)x = 0$ 的非零解 $x$ 称为特征向量；所有对应特征向量构成的线性子空间称为特征子空间。

3. **代数重数与几何重数**：

    - 代数重数 $n_j$：特征值 $\tilde{\lambda}_j$ 在特征方程中作为根的重数
    - 几何重数 $k_j$：特征值 $\tilde{\lambda}_j$ 对应的特征子空间的维数

    有如下等价定义：

    - 代数重数 $n_j$：特征值 $\tilde{\lambda}_j$ 对应的 Jordan 块阶数之和
    - 几何重数 $k_j$：特征值 $\tilde{\lambda}_j$ 对应的 Jordan 块个数

    从而可见满足关系：$1 \leq k_j \leq n_j$，当且仅当矩阵可对角化时，等号成立。

### 重要定理

1. **迹与行列式**：

    设 $\lambda_i$ 为 $A$ 的特征值，则：
    $$
    \sum_{j=1}^n \lambda_j = \text{tr}(A) = \sum_{j=1}^n a_{jj}, \quad \prod_{j=1}^n \lambda_j = \det(A)
    $$

2. **转置不变性**：$\lambda(A) = \lambda(A^T)$

3. **三角阵特征值**：若 $A$ 为三角阵，则其对角线元素即为特征值

4. **分块三角阵特征值**：

    对分块上三角阵 $A = \begin{bmatrix} A_{11} & \cdots \\ & \ddots \end{bmatrix}$，有：
    $$
    \lambda(A) = \bigcup_{j=1}^m \lambda(A_{jj})
    $$

    分块下三角阵同理。

5. **相似变换不变性**：

    若 $B = X^{-1}AX$（$X$ 非奇异），则：

    - $\lambda(A) = \lambda(B)$
    - 若 $y$ 是 $B$ 的特征向量，则 $Xy$ 是 $A$ 的特征向量

6. **特征值的代数性质**：

    设 $\lambda_i$ 为 $A$ 的特征值，则：

    - $cA$ 的特征值：$c\lambda_i$
    - $A + cI$ 的特征值：$\lambda_i + c$
    - $A^k$ 的特征值：$\lambda_i^k$
    - $p(A)$ 的特征值：$p(\lambda_i)$（$p$ 为多项式）
    - $A^{-1}$ 的特征值：$\lambda_i^{-1}$（当 $A$ 非奇异）

---

## 幂法

幂法（Power Method）用于计算矩阵（模）最大特征值以及对应的特征向量。

### 幂法的数学原理

矩阵模最大的特征值称为主特征值（dominant eigenvalue），对应特征向量为主特征向量。

**幂法收敛性**：

设 $ A \in \mathbb{R}^{n \times n} $ 有唯一的主特征值。也即 $ |\lambda_1| > |\lambda_2| \ge |\lambda_3| \ge \cdots \ge |\lambda_n| $，
其中 $\lambda_1$ 是唯一主特征值（显然其为实数），并且 $\lambda_1$ 几何重数为 $1$。

初始向量 $x^{(0)} \in \mathbb{R}^n$ 在 $\lambda_1$ 的特征方向上的投影非零。

定义迭代：
$$
x^{(k)} = A x^{(k-1)}, \quad k = 1,2,\dots
$$
归一化：
$$
y^{(k)} = \frac{x^{(k)}}{\|x^{(k)}\|_\infty}
$$
则：

- $y^{(k)}$ 收敛到 $\lambda_1$ 的一个特征向量。
- 主特征值可通过下式估计：
    $$
    \lambda_1 = \lim_{k\to\infty} \frac{(x^{(k+1)})_j}{(x^{(k)})_j}, \quad j = \arg\max_i |(x^{(k)})_i|
    $$

**证明**：

1. **分解**：

    对 $A$ 做 Jordan 分解 $A=PJP^{-1}$：
    $$
    J=\mathrm{diag}(J_1,\dots,J_r),\quad
    J_i=\begin{pmatrix}\lambda_i&1&&\\&\lambda_i&\ddots&\\&&\ddots&1\\&&&\lambda_i\end{pmatrix}_{m_i},\quad \sum m_i=n.
    $$

    记 $z=P^{-1}x^{(0)}=(z_1,\dots,z_r)^{\mathsf T}$，$z_i\in\mathbb R^{m_i}$，则：
    $$
    x^{(k)}=PJ^k z
    $$
    对单个块记 $J(\lambda,m)=\lambda I+N$，其中 $N^m=0$。

2. **估阶**：

    对 Jordan 块 $J(\lambda,m) = \lambda I + N$，由二项式定理：
    $$
    J(\lambda,m)^k = \sum_{j=0}^{m-1} \binom{k}{j} \lambda^{k-j} N^j = \frac{k^{m-1}}{(m-1)!}\lambda^{k-m+1}N^{m-1} + O(k^{m-2}|\lambda|^k)
    $$
    其中 $O(\cdot)$ 为矩阵范数意义下的。

    作用于 $z_i$ 并取范数，不论 $N^{m_i-1}z_i$ 是否为 0 均有：
    $$
    \|J_i^k z_i\| = O(|\lambda_i|^k k^{m_i-1})
    $$

    对**非主块** $i \geq 2$，取 $\rho \in (|\lambda_2|/|\lambda_1|, 1)$，则 $|\lambda_i| \leq \rho|\lambda_1|$：
    $$
    \|J_i^k z_i\| = O(\rho^k |\lambda_1|^k k^{m_i-1}) = o(|\lambda_1|^k k^{m_1-1}).
    $$

    对**主块** $i=1$，令 $w = N^{m_1-1}z_1$。由题设 $x^{(0)}$ 在 $\lambda_1$ 特征方向投影非零，即 $w \neq 0$，且 $Nw = 0$（$w$ 为 $J_1$ 的特征向量）。于是：
    $$
    J_1^k z_1 = \Theta(\lambda_1^k k^{m_1-1}) \, w.
    $$

    综上：
    $$
    \begin{aligned}
    \|x^{(k)}\| &= \|PJ^k z\| = \Theta(|\lambda_1|^k k^{m_1-1}) \\
    x^{(k)} &= PJ^k z = [\Theta(\lambda_1^k k^{m_1-1}) Pw, \, o(|\lambda_1|^k k^{m_2-1}), \dots]^T
    \end{aligned}
    $$

3. **方向收敛**：

    归一化并消去非主块：
    $$
    \frac{x^{(k)}}{\|x^{(k)}\|} = \left(\frac{\lambda_1}{|\lambda_1|}\right)^k \frac{Pw}{\|Pw\|} + o(1)
    $$

    令 $u_1 = Pw/\|Pw\|$，也即 $A$ 的单位特征向量，则对 $\|\cdot\|_\infty$：
    $$
    y^{(k)} = \left(\frac{\lambda_1}{|\lambda_1|}\right)^k \frac{u_1}{\|u_1\|_\infty} + o(1)
    $$

    故 $y^{(k)} \to u_1$。

4. **特征值估计**：

    由 $x^{(k+1)} = A x^{(k)}$ 及第 3 部分的渐近展开：
    $$
    x^{(k)} = \|x^{(k)}\|_\infty \left( \left(\frac{\lambda_1}{|\lambda_1|}\right)^k \frac{u_1}{\|u_1\|_\infty} + o(1) \right)
    $$

    记 $j_k = \arg\max\limits_i |(x^{(k)})_i|$。由 $u_1$ 非零，存在唯一分量指标 $j_*$ 使得 $|(u_1)_{j_*}| = \|u_1\|_\infty$，
    且当 $k$ 充分大时 $j_k = j_*$ 保持恒定。此时 $(x^{(k)})_{j_k} = \Theta(\|x^{(k)}\|_\infty)$。

    将 $x^{(k+1)} = A x^{(k)}$ 的第 $j_k$ 分量写出：
    $$
    (x^{(k+1)})_{j_k} = \lambda_1 (x^{(k)})_{j_k} + \big( A x^{(k)} - \lambda_1 x^{(k)} \big)_{j_k}
    $$

    由第 2 部分的阶的估计，非主特征值部分贡献为 $o(\|x^{(k)}\|_\infty)$，因此：
    $$
    (x^{(k+1)})_{j_k} = \lambda_1 (x^{(k)})_{j_k} + o(\|x^{(k)}\|_\infty)
    $$

    两边除以 $(x^{(k)})_{j_k}$（当 $k$ 充分大时非零）：
    $$
    \frac{(x^{(k+1)})_{j_k}}{(x^{(k)})_{j_k}}
    = \lambda_1 + \frac{o(\|x^{(k)}\|_\infty)}{(x^{(k)})_{j_k}}
    = \lambda_1 + \frac{o(\|x^{(k)}\|_\infty)}{\Theta(\|x^{(k)}\|_\infty)}
    = \lambda_1 + o(1)
    $$

    取极限即得
    $$
    \lim_{k\to\infty} \frac{(x^{(k+1)})_j}{(x^{(k)})_j} = \lambda_1, \qquad j = \arg\max_i |(x^{(k)})_i|
    $$

**注**：

非主块贡献为 $O(\rho^k)$，故收敛速度为：
$$
\frac{(x^{(k+1)})_j}{(x^{(k)})_j} - \lambda_1
= O\!\left( \left|\dfrac{\lambda_2}{\lambda_1}\right|^k \right)
$$

### 幂法的几何直观

设矩阵 $A \in \mathbb{R}^{n \times n}$ 有唯一的实主特征值 $\lambda_1$，且 $|\lambda_1| > |\lambda_2| \ge |\lambda_3| \ge \cdots$。
考虑二维子空间 $\mathrm{span}\{u_1, u_2\}$，其中 $u_1$ 为 $\lambda_1$ 对应的单位特征向量（主方向），$u_2$ 为 $\lambda_2$ 对应的特征向量（次方向）。

假设初始向量 $x^{(0)}$ 在该子空间中的投影为：
$$
x^{(0)} = a_0 u_1 + b_0 u_2
$$

迭代 $k$ 次：
$$
x^{(k)} = A^k x^{(0)} = \lambda_1^k a_0 u_1 + \lambda_2^k b_0 u_2
$$

由于 $|\lambda_1| > |\lambda_2|$，主方向的分量增长比次方向更快，故趋向于 $u_1$。

设 $\theta_k$ 为 $x^{(k)}$ 与 $u_1$ 的夹角。则：
$$
\tan\theta_k = \frac{|b_k|}{|a_k|} = \left|\frac{\lambda_2}{\lambda_1}\right|^k \cdot \tan\theta_0
$$

特征值估计为：
$$
\lambda_1^{(k)} = \frac{(x^{(k+1)})_j}{(x^{(k)})_j}
$$

又因为
$$
\begin{aligned}
(x^{(k)})_j &= a_k + b_k (u_2)_j \\
(x^{(k+1)})_j &= \lambda_1 a_k + \lambda_2 b_k (u_2)_j
\end{aligned}
$$

因此：
$$
\begin{aligned}
\frac{(x^{(k+1)})_j}{(x^{(k)})_j}
&= \frac{\lambda_1 a_k + \lambda_2 b_k (u_2)_j}{a_k + b_k (u_2)_j} \\
&= \frac{\lambda_1 + \lambda_2 \cdot \frac{b_k}{a_k} (u_2)_j}{1 + \frac{b_k}{a_k} (u_2)_j} \\
&= \lambda_1 + (\lambda_2 - \lambda_1) \cdot \frac{b_k}{a_k} (u_2)_j + o(\frac{b_k}{a_k})
\end{aligned}
$$

从而：
$$
\lambda_1^{(k)} - \lambda_1
= O\!\left( \left|\dfrac{\lambda_2}{\lambda_1}\right|^k \right)
$$

### 数值稳定性改进

原始迭代 $x^{(k)} = A^k x^{(0)}$ 存在溢出问题：

- $|\lambda_1| > 1$：上溢出（overflow）
- $|\lambda_1| < 1$：下溢出（underflow）

故我们在迭代中用 $\infty$-范数进行归一化：
$$
\begin{cases}
y^{(k)} = x^{(k)}/\|x^{(k)}\|_\infty \\
x^{(k+1)} = A y^{(k)}
\end{cases}, \quad k=0,1,2,\dots
$$
主特征值估计为 $\lambda_1^{(k)} = (x^{(k)})_j$，其中 $j = \arg\max_i |(x^{(k)})_i|$。

### 幂法算法实现

```python
k = 0
lambda_old = 0.0

while k < N:
    k += 1

    j = np.argmax(np.abs(x))
    lambda_new = x[j]
    y = x / lambda_new # 归一化
    x = A @ y # 迭代

    if np.abs(lambda_new - lambda_old) < EPS:
        break

    lambda_old = lambda_new
```

---

## 位移幂法

### 位移幂法的数学原理

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

### 位移幂法的几何直观

$A - \mu I$ 在每个方向上都减去 $\mu$ 倍的该方向向量。取 $\mu$ 接近 $\lambda_2$，相当于将 $u_2$ 方向的拉伸大大减小，使得原本占优的 $u_1$ 方向更加占优。

**注**：
理论上我们也可以利用这种方法求次特征值。

### 位移幂法算法实现

实际实现时原点位移值 `shift` 需要利用特征值分布估计。

```python
k = 0
lambda_old = 0.0

while k < N:
    k += 1

    j = np.argmax(np.abs(x))
    lambda_new = x[j]
    y = x / lambda_new # 归一化
    x = A @ y - shift * y # 迭代

    if np.abs(lambda_new - lambda_old) < EPS:
        break

    lambda_old = lambda_new

lambda_old += shift
```

---

## 降阶幂法

### 降阶幂法的数学原理

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

**注**：
降阶法精度不佳，且破坏稀疏性，仅适用于求前几个特征值；实际中多用 Lanczos 等 Krylov 子空间方法。

### 降阶幂法的几何直观

注意到 $\dfrac{u_1 u_1^T}{u_1^T u_1}$ 即为 $u_1$ 方向的投影矩阵，故实际上 $A^{(2)}$ 消除了主特征方向的所有贡献，从而让次特征方向变为 $A^{(2)}$ 的主特征方向。

---

## 反幂法

反幂法（Inverse Power Method）用于计算矩阵（模）最小特征值以及对应的特征向量。

### 反幂法的数学原理

适用于非奇异矩阵。由特征值倒数性质：若 $Au_i = \lambda_i u_i$，则 $A^{-1}u_i = \lambda_i^{-1} u_i$。

因此，对 $A^{-1}$ 应用幂法即得 $|\lambda_n|$ 最小的特征值。

为避免显式求逆，可以将 $x^{(k)} = A^{-1} x^{(k-1)}$ 改为解线性方程组：
$$
A x^{(k)} = x^{(k-1)}
$$

### 反幂法算法实现

```python
k = 0
_, L, U = lu(A)  # 预计算 LU 分解
lambda_old = 1e16  # 初始极大值

while k < N:
    k += 1

    j = np.argmax(np.abs(x))
    lambda_new = x[j]
    y = x / lambda_new # 归一化

    # LU 分解法解 Ax = y
    z = solve_triangular(L, y, lower=True) # 先解 Lz = y
    x = solve_triangular(U, z, lower=False) # 再解 Ux = z

    if np.abs(1 / lambda_new - 1 / lambda_old) < EPS:
        break

    lambda_old = lambda_new

lambda_old = 1 / lambda_old
```

---

## 位移反幂法

结合位移技术，我们可以求已知近似特征值 $\lambda^*$ 附近的精确特征值。

首先构造 $B = A - \lambda^* I$，然后对 $B$ 应用反幂法求模最小特征值 $\mu$，则待求特征值即为：
$$
\lambda = \mu + \lambda^*
$$

由于 $|\lambda - \lambda^*| \ll |\lambda_i - \lambda^*|$，收敛极快。

---

## Jacobi 法

Jacobi 法用于计算实对称矩阵的所有特征值以及对应的特征向量。

### 核心思想

对实对称矩阵 $A$，存在正交矩阵 $Q$ 使 $Q^T A Q = D$ 为对角阵。Jacobi 法通过一系列 **2D 正交变换**逐步消除非对角元。

### 2×2 子问题求解

对子矩阵 $\begin{bmatrix} a_{pp} & a_{pq} \\ a_{pq} & a_{qq} \end{bmatrix}$，构造旋转矩阵：
$$
Q = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix}
$$

要求 $Q^T A Q$ 的 $(p,q)$ 元素为 0：
$$
a_{pq}^{(1)} = \frac{a_{qq} - a_{pp}}{2} \sin 2\theta + a_{pq} \cos 2\theta = 0
\Rightarrow \cot 2\theta = \frac{a_{pp} - a_{qq}}{2a_{pq}}
$$

解得：
$$
\begin{aligned}
\tau &= \frac{a_{pp} - a_{qq}}{2a_{pq}} \\
t &= -\frac{\text{sign}(\tau)}{|\tau| + \sqrt{1+\tau^2}} \\
c &= \frac{1}{\sqrt{1+t^2}} \\
s &= ct
\end{aligned}
$$

**注**：直接用反三角函数计算会数值不稳定，所以用上述方法避免三角函数计算。

### n×n 矩阵求解

构造 $Q_{pq}$，仅在 $(p,p),(p,q),(q,p),(q,q)$ 位置非单位元，其余位置与单位阵相同，则迭代：
$$
A^{(1)} = Q_{pq}^T A Q_{pq}
$$
迭代后非对角元 $a_{pq}^{(1)} = 0$。重复迭代即可。

### 收敛性证明

定义非对角元平方和：
$$
\|A\|_F^2 - \text{tr}(A^2) = \sum_{i\neq j} a_{ij}^2
$$

由 Frobenius 范数不变：
$$
\sum_i (a_{ii}^{(k+1)})^2 + \sum_{i\neq j} (a_{ij}^{(k+1)})^2 = \sum_i (a_{ii}^{(k)})^2 + \sum_{i\neq j} (a_{ij}^{(k)})^2
$$

旋转仅改变 $a_{pp}, a_{qq}, a_{pq}, a_{qp}$，
且 $(a_{pp}^{(k+1)})^2 + (a_{qq}^{(k+1)})^2 = (a_{pp}^{(k)})^2 + (a_{qq}^{(k)})^2 + 2(a_{pq}^{(k)})^2$

代入得：
$$
\sum_{i\neq j} (a_{ij}^{(k+1)})^2 = \sum_{i\neq j} (a_{ij}^{(k)})^2 - 2(a_{ij}^{(k)})^2
$$

选择最大非对角元 $|a_{pq}|$ 消除，则：
$$
\sum_{i\neq j} (a_{ij}^{(k+1)})^2 \leq \left(1 - \frac{2}{n(n-1)}\right) \sum_{i\neq j} (a_{ij}^{(k)})^2
$$
故当 $k\to\infty$ 时，$\sum_{i\neq j} (a_{ij}^{(k)})^2 \to 0$，算法收敛。

**注**：可以把 Frobenius 范数理解为能量，通过一次变换会将能量集中于对角线，从而实现收敛。

### Jacobi 法算法实现

1. 选择最大非对角元 $|a_{ij}|$
2. 计算旋转角 $\theta$
3. 更新 $A \leftarrow Q_{ij}^T A Q_{ij}$
4. 累积正交矩阵 $V \leftarrow V Q_{ij}$
5. 重复直至非对角元足够小

```python
k = 0
n = A.shape[0]
V = np.eye(n)

while k < N:
    k += 1

    # 选最大非对角元
    p, q = 0, 1
    max_off = 0
    for i in range(n):
        for j in range(i + 1, n):
            if abs(A[i, j]) > max_off:
                max_off = abs(A[i, j])
                p, q = i, j
    
    if max_off < EPS:
        break
    
    # 计算旋转参数
    tau = (A[p, p] - A[q, q]) / (2 * A[p, q])
    if tau >= 0:
        t = -1 / (tau + np.sqrt(1 + tau**2))
    else:
        t = 1 / (-tau + np.sqrt(1 + tau**2))
    c = 1 / np.sqrt(1 + t**2)
    s = c * t
    
    # 更新 A
    a_pp, a_qq, a_pq = A[p, p], A[q, q], A[p, q]
    A[p, p] = c**2 * a_pp + s**2 * a_qq - 2*s*c*a_pq
    A[q, q] = s**2 * a_pp + c**2 * a_qq + 2*s*c*a_pq
    A[p, q] = A[q, p] = 0
    
    for i in range(n):
        if i != p and i != q:
            a_ip, a_iq = A[i, p], A[i, q]
            A[i, p] = A[p, i] = c*a_ip - s*a_iq
            A[i, q] = A[q, i] = s*a_ip + c*a_iq
    
    # 累积 V
    for i in range(n):
        v_ip, v_iq = V[i, p], V[i, q]
        V[i, p] = c*v_ip - s*v_iq
        V[i, q] = s*v_ip + c*v_iq

eigvals = np.diag(A)
idx = np.argsort(eigvals)[::-1] # 从大到小排序
eigvals = eigvals[idx]
eigvecs = V[:, idx]
```

**注**：
现代实现多按固定顺序遍历所有 $(i,j)$ 对，虽收敛稍慢但更适合并行计算。

---

## 方法对比与适用场景

| 方法 | 适用矩阵 | 目标特征值 | 计算复杂度 |
| :--- | :--- | :--- | :--- |
| **幂法** | 唯一主特征值 | 最大模特征值 | $O(n^2)$ |
| **位移幂法** | 唯一主特征值 | 离 $\mu$ 最远的特征值 | $O(n^2)$ |
| **降阶幂法** | 对称矩阵 | 前 $k$ 个特征值 | $O(kn^3)$ |
| **反幂法** | 非奇异矩阵 | 最小模特征值 | $O(n^3)$（LU分解）+ $O(n^2)$ |
| **位移反幂法** | 非奇异矩阵 | 离 $\mu$ 最近的特征值 | $O(n^3)$（LU分解）+ $O(n^2)$ |
| **Jacobi 法** | 实对称矩阵 | 所有特征值 | 未优化 $O(n^4)$ |
