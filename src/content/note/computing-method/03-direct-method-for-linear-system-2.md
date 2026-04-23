---
title: '解线性方程组的直接法（LU 分解、Cholesky 分解）'
excerpt: '26 春 计算方法 L03'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'March 17 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## LU 分解概述

### 定义

LU 分解是将一个方阵 $A$ （不一定可逆）分解为一个下三角矩阵 $L$ 和一个上三角矩阵 $U$ 的乘积：
$$
A = LU
$$

其中：

- $L$ 为下三角矩阵（通常取为单位下三角矩阵）
- $U$ 为上三角矩阵

**注**：若不加限制，LU 分解不唯一。为保证唯一性，以下采用**单位下三角矩阵**形式，即：
$$
\begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{n1} & a_{n2} & \cdots & a_{nn}
\end{bmatrix}
=
\begin{bmatrix}
1 & 0 & \cdots & 0 \\
l_{21} & 1 & \cdots & 0 \\
\vdots & \vdots & \ddots & \vdots \\
l_{n1} & l_{n2} & \cdots & 1
\end{bmatrix}
\begin{bmatrix}
u_{11} & u_{12} & \cdots & u_{1n} \\
0 & u_{22} & \cdots & u_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
0 & 0 & \cdots & u_{nn}
\end{bmatrix}
$$

### 利用 LU 分解求解线性方程组

给定线性方程组 $Ax=b$，若已知 $A=LU$，则可转化为两步求解：

1. **前向代入（Forward Substitution）**：求解 $Ly = b$
   $$
   y_i = b_i - \sum_{j=1}^{i-1} l_{ij}y_j, \quad i=1,2,\dots,n
   $$

2. **后向代入（Backward Substitution）**：求解 $Ux = y$
   $$
   x_i = \frac{1}{u_{ii}}\left(y_i - \sum_{j=i+1}^{n} u_{ij}x_j\right), \quad i=n,n-1,\dots,1
   $$

从而我们只需给出 LU 分解即可完成线性方程组的求解。

**注**：
与 Gauss 消去法相比，LU 分解将消元过程与回代过程分离，便于多次求解同一系数矩阵的方程组（只需一次分解，多次代入）。并且消元是 $O(n^3)$ 的，而回代则是 $O(n^2)$ 的。

## LU 分解

### 数学基础：LU 分解的存在唯一性

矩阵 $A \in \mathbb{R}^{n \times n}$ 存在唯一的 LU 分解（其中 $L$ 为单位下三角矩阵）的充要条件是：$A$ 的所有 $k$ 阶顺序主子式（$k=1,2,\dots,n-1$）均非零。

**证明**：

以下 $A_k$、$L_k$、$U_k$ 分别表示 $A$、$L$、$U$ 的 $k$ 阶主子矩阵。$n=1$ 时显然存在唯一。假设 $n=1, 2, \dots, k-1$ 时成立，下证 $n=k$ 时成立。
设
$$
A_k
=
\begin{bmatrix}
A_{k-1} & c^T \\
d & a_{kk} \\
\end{bmatrix}
$$
其 LU 分解可写成
$$
A_k
=
\begin{bmatrix}
A_{k-1} & c^T \\
d & a_{kk} \\
\end{bmatrix}
=
\begin{bmatrix}
L_{k-1} & 0 \\
l & 1 \\
\end{bmatrix}
\begin{bmatrix}
U_{k-1} & u^T \\
0 & u_{kk} \\
\end{bmatrix}
$$
也即
$$
\begin{cases}
A_{k-1} = L_{k-1} U_{k-1} \\
c^T = L_{k-1} u^T \\
d = l U_{k-1} \\
a_{kk} = l u^T + u_{kk}
\end{cases}
\tag{1}
$$
则 LU 分解存在且唯一等价于方程组 $(1)$ 的解存在且唯一。

- **充分性**：
   由条件和归纳知 $A_{k-1}$ 的 LU 分解存在且唯一，也即 $L_{k-1}$、$U_{k-1}$ 存在且唯一。
   又由 $\det(A_{k-1}) \neq 0$ 知 $L_{k-1}$、$U_{k-1}$ 可逆，故方程 $(1)$ 的解存在且唯一，也即有 LU 分解：
   $$
   A_k
   =
   \begin{bmatrix}
   L_{k-1} & 0 \\
   -l U_{k-1}^{-1} & 1 \\
   \end{bmatrix}
   \begin{bmatrix}
   U_{k-1} & L_{k-1}^{-1} u^T \\
   0 & a_{kk} - l U_{k-1}^{-1} L_{k-1}^{-1} u^T \\
   \end{bmatrix}
   $$
   本质上就是简单的行列变换消元。

- **必要性**：
   由条件知方程 $(1)$ 的解存在且唯一。故必须 $L_{k-1}$、$U_{k-1}$ 可逆，也即 $A_{k-1}$ 可逆，从而得证。

**注**：

- 我们证明时不需要 $A$ 是奇异的，其右下角元可以为 0
- 若某顺序主子式为 0，但主元位置可通过行交换（列主元）避免为 0，则可进行**PLU分解**（$PA = LU$，其中 $P$ 为置换矩阵）。

### LU 分解计算公式

$$
u_{kj} = a_{kj} - \sum_{m=1}^{k-1} l_{km}u_{mj}, \quad j=k,k+1,\dots,n
$$

$$
l_{ik} = \frac{1}{u_{kk}}\left(a_{ik} - \sum_{m=1}^{k-1} l_{im}u_{mk}\right), \quad i=k+1,k+2,\dots,n
$$

**证明**：

从 $ A = LU $ 出发，**逐元素比较**来推导即可。

矩阵乘法：
$$
a_{ij} = (LU)_{ij} = \sum_{m=1}^n l_{im} u_{mj}.
$$

由于 $ L $ 下三角（$ l_{im} = 0 $ 当 $ m > i $），且 $ U $ 上三角（$ u_{mj} = 0 $ 当 $ m > j $），所以求和实际上只到 $ \min(i, j) $：
$$
a_{ij} = \sum_{m=1}^{\min(i, j)} l_{im} u_{mj}.
$$

- 情形 1：$ i \le j $（图 1 中红黄蓝部分，得到 $ U $ 的元素）
   当 $ i \le j $ 时，$ \min(i, j) = i $，所以
   $$
   a_{ij} = \sum_{m=1}^{i} l_{im} u_{mj} = \sum_{m=1}^{i-1} l_{im} u_{mj} + l_{ii} u_{ij}.
   $$

   因为 $ L $ 是单位下三角，$ l_{ii} = 1 $，再将 $i$ 替换为 $k$ 化简得：
   $$
   u_{kj} = a_{kj} - \sum_{m=1}^{k-1} l_{km} u_{mj}, \quad j = k, k+1, \dots, n.
   $$

- 情形 2：$ i > j $（图 1 中橙绿部分，得到 $ L $ 的元素）
   当 $ i > j $ 时，$ \min(i, j) = j $，所以
   $$
   a_{ij} = \sum_{m=1}^{j} l_{im} u_{mj} = \sum_{m=1}^{j-1} l_{im} u_{mj} + l_{ij} u_{jj}.
   $$

   用 $ k $ 替换 $ j $，化简得：
   $$
   l_{ik} = \frac{1}{u_{kk}} \left( a_{ik} - \sum_{m=1}^{k-1} l_{im} u_{mk} \right), \quad i = k+1, k+2, \dots, n.
   $$

实际操作时应按照下图所示的红橙黄绿蓝顺序依次求解。也即先由上式求出 $u^1$，再由下式求出 $l_1$，再由上式求出 $u^2$，以此类推。

![图1：LU 分解求解顺序](/images/note/computing-method/03-direct-method-for-linear-system-2-01-lu-ordinary-order.png)

### LU 分解代码

#### 标准 LU 分解

```python
for k in range(n): # 枚举 U 的行，同时也是枚举 L 的列
   for j in range(k, n): # 枚举 U 的列
      U[k, j] = A[k, j]
      for m in range(k - 1):
         U[k, j] = U[k, j] - L[k, m] * U[m, j]
   for i in range(k + 1, n): # 枚举 L 的行
      L[i, k] = A[i, k]
      for m in range(k - 1):
         L[i, k] = L[i, k] - L[i, m] * U[m, k]
      L[i, k] = L[i, k] / U[k, k]
```

**注**：标准算法需要额外存储空间。实际中常采用**原位存储**优化，即将 $L$ 的非对角元素和 $U$ 存储在同一矩阵 $A$ 中：

$$
\begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{n1} & a_{n2} & \cdots & a_{nn}
\end{bmatrix}
\Rightarrow
\begin{bmatrix}
u_{11} & u_{12} & \cdots & u_{1n} \\
l_{21} & u_{22} & \cdots & u_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
l_{n1} & l_{n2} & \cdots & u_{nn}
\end{bmatrix}
$$

#### 原位存储 LU 分解

由此算法可以更清晰地看到求解顺序。

```python
for k in range(n): # 枚举 U 的行，同时也是枚举 L 的列
   for j in range(k, n): # 枚举 U 的列
      for m in range(k - 1):
         A[k, j] = A[k, j] - A[k, m] * A[m, j]
   for i in range(k + 1, n): # 枚举 L 的行
      for m in range(k - 1):
         A[i, k] = A[i, k] - A[i, m] * A[m, k]
      A[i, k] = A[i, k] / A[k, k]
```

也即：
$$
\begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{n1} & a_{n2} & \cdots & a_{nn}
\end{bmatrix}
\Rightarrow
\begin{bmatrix}
u_{11} & u_{12} & \cdots & u_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{n1} & a_{n2} & \cdots & a_{nn}
\end{bmatrix}
\Rightarrow
\begin{bmatrix}
u_{11} & u_{12} & \cdots & u_{1n} \\
l_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
l_{n1} & a_{n2} & \cdots & a_{nn}
\end{bmatrix}
\Rightarrow
\begin{bmatrix}
u_{11} & u_{12} & \cdots & u_{1n} \\
l_{21} & u_{22} & \cdots & u_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
l_{n1} & a_{n2} & \cdots & a_{nn}
\end{bmatrix}
$$

#### 递归的 LU 分解

基于分块矩阵思想，将 $A$ 分块为：
$$
A = \begin{bmatrix}
a_{11} & \mathbf{u}^T \\
\mathbf{l} & B
\end{bmatrix}
=
\begin{bmatrix}
1 & 0 \\
\mathbf{l}/a_{11} & I_{n-1}
\end{bmatrix}
\begin{bmatrix}
1 & 0 \\
0 & B - \mathbf{l}\mathbf{u}^T/a_{11}
\end{bmatrix}
\begin{bmatrix}
a_{11} & \mathbf{u}^T \\
0 & I_{n-1}
\end{bmatrix}
$$

其中 $B - \mathbf{l}\mathbf{u}^T/a_{11}$ 称为 $a_{11}$ 的 **Schur 补**，其 LU 分解与原矩阵的 LU 分解递归相关。
这是因为若 Schur 补也能够 LU 分解，即若有 $B - \mathbf{l}\mathbf{u}^T/a_{11} = L_{n-1} U_{n-1}$，则：
$$
A = \begin{bmatrix}
a_{11} & \mathbf{u}^T \\
\mathbf{l} & B
\end{bmatrix}
=
\begin{bmatrix}
1 & 0 \\
\mathbf{l}/a_{11} & L_{n-1}
\end{bmatrix}
\begin{bmatrix}
a_{11} & \mathbf{u}^T \\
0 & U_{n-1}
\end{bmatrix}
$$

**原位存储的递归算法**：

实际上每一递归步都是按照红橙黄的顺序进行计算，其中红橙色区域计算得到的是最终值，而黄色区域计算得到的是中间值。

```python
for k in range(n - 1): # 递归的第 k 步，最后一步不用计算
   # 红色区域不需计算
   for i in range(k + 1, n): # 计算橙色区域
      A[i, k] = A[i, k] / A[k, k]
   for i in range(k + 1, n): # 计算黄色区域
      for j in range(k + 1, n):
         A[i, j] = A[i, j] - A[i, k] * A[k, j]
```

![图2：递归 LU 分解求解顺序](/images/note/computing-method/03-direct-method-for-linear-system-2-02-lu-recursive-order.png)

**向量化的递归算法**：

针对按行或按列存储的数组分别进行优化，主要是黄色区域的更新可以考虑内存访问方式（还有 ICS 的事 OoO）：

**按行存储**：

```python
for k in range(n - 1): # 递归的第 k 步，最后一步不用计算
   # 红色区域不需计算
   A[k + 1:n, k] = A[k + 1:n, k] / A[k, k] # 计算橙色区域
   for i in range(k + 1, n): # 计算黄色区域
         A[i, k + 1:n] = A[i, k + 1:n] - A[i, k] * A[k, k + 1:n]
```

**按列存储**：

```python
for k in range(n - 1): # 递归的第 k 步，最后一步不用计算
   # 红色区域不需计算
   A[k + 1:n, k] = A[k + 1:n, k] / A[k, k] # 计算橙色区域
   for j in range(k + 1, n): # 计算黄色区域
         A[k + 1:n, j] = A[k + 1:n, j] - A[k + 1:n, k] * A[k, j]
```

**注**：
向量化操作能充分利用 CPU 的向量指令集（如SSE、AVX），从而加速运算。

### 复杂度分析

针对原位存储 LU 分解而言：

- **时间复杂度**：乘除法次数为 $\sum_{k=1}^{n-1} 2(n-k)k + n \approx n^3/3$，也即 $O(n^3)$
- **空间复杂度**：原位存储只需 $O(n^2)$

## 带状矩阵的 LU 分解

### 带状矩阵定义

- **下带宽 $p$**：若 $i > j + p$ 时 $a_{ij} = 0$
- **上带宽 $q$**：若 $j > i + q$ 时 $a_{ij} = 0$

常见类型：

| 矩阵结构 | 下带宽 | 上带宽 |
| -------- | ------- | ------- |
| 对角矩阵 | 0 | 0 |
| 上三角矩阵 | 0 | $n-1$ |
| 下三角矩阵 | $n-1$ | 0 |
| 三对角矩阵 | 1 | 1 |

### 带状矩阵的压缩存储

普通 $n \times n$ 矩阵需 $n^2$ 存储空间，带状矩阵仅需 $(p+q+1) \times n$ 空间：
$$
a_{ij} \Rightarrow \bar{a}_{i-j+q+1,j}
$$
其中 $\bar{A} \in \mathbb{R}^{(p+q+1) \times n}$

![图3：下带宽 p=1、上带宽 q=2 的6×6矩阵](/images/note/computing-method/03-direct-method-for-linear-system-2-03-band-matrix.png)

### 数学基础：带状矩阵 LU 分解的稀疏性

若 $A = LU$ 且 $A$ 的上带宽为 $q$、下带宽为 $p$，则 $U$ 的上带宽为 $q$，$L$ 的下带宽为 $p$。

**注**：并非所有稀疏矩阵的 LU 分解都保持稀疏性（称为"填充"现象），但对于带状矩阵，LU 分解能够保持稀疏性。

### 未压缩的算法

```python
for k in range(n - 1): # 递归的第 k 步，最后一步不用计算
   # 红色区域不需计算
   for i in range(k + 1, min(k + p + 1, n)): # 计算橙色区域
      A[i, k] = A[i, k] / A[k, k]
   for i in range(k + 1, min(k + p + 1, n)): # 计算黄色区域
      for j in range(k + 1, min(k + q + 1, n)):
         A[i, j] = A[i, j] - A[i, k] * A[k, j]
```

**复杂度分析**：

当 $n \gg p,q$ 时，运算量约为 $npq$ 次乘除法和 $npq$ 次加减法，也即时间复杂度 $O(npq)$

## 正定矩阵的 Cholesky 分解

### 数学基础：正定矩阵

**定义**：矩阵 $A$ 称为对称正定矩阵（SPD），若 $A^T = A$ 且对任意非零向量 $\mathbf{x} \in \mathbb{R}^n$，有 $\mathbf{x}^TA\mathbf{x} > 0$。

**重要性质**：

1. $A$ 的所有特征值均为正数
2. $A$ 的所有顺序主子式均为正数
3. $A$ 的所有主子阵也为正定阵，所有对角元素均为正数
4. $A$ 可逆，且 $A^{-1}$ 也是对称正定矩阵

**几何意义**：SPD 矩阵对应的二次型 $\mathbf{x}^TA\mathbf{x}$ 在 $\mathbb{R}^n$ 中表示一个开口向上的碗状曲面，其最小值在原点处取得。

### 数学基础：Cholesky 分解的存在唯一性

若 $A \in \mathbb{R}^{n \times n}$ 是对称正定矩阵，则存在唯一的下三角矩阵 $L$（对角元为正），使得：
$$
A = LL^T
$$

**证明**：

记 $ A_k $ 为 $ A $ 的 $ k $ 阶顺序主子矩阵。由 $ A $ 正定知 $ A_k $ 可逆。当 $n=1$ 时，$ A = [a_{11}] $，$ a_{11} > 0 $，显然存在唯一。

假设对 $ n \le k-1 $ 结论成立，则对称正定矩阵 $ A_{k-1} $ 存在唯一的 Cholesky 分解  
$ A_{k-1} = L_{k-1} L_{k-1}^T $，其中 $ L_{k-1} $ 下三角且对角元为正。下证 $n = k$ 时成立。

将 $ A_k $ 分块为
$$
A_k =
\begin{bmatrix}
A_{k-1} & v \\
v^T & a_{kk}
\end{bmatrix},
$$
其中 $ v \in \mathbb{R}^{k-1} $，$ a_{kk} > 0 $。

设待求的 $ L_k $ 分块为
$$
L_k =
\begin{bmatrix}
L_{k-1} & 0 \\
w^T & l_{kk}
\end{bmatrix},
$$
其中 $ L_{k-1} $ 是归纳得到的下三角矩阵（对角元为正），$ w \in \mathbb{R}^{k-1} $，$ l_{kk} > 0 $。

计算
$$
L_k L_k^T =
\begin{bmatrix}
L_{k-1} & 0 \\
w^T & l_{kk}
\end{bmatrix}
\begin{bmatrix}
L_{k-1}^T & w \\
0 & l_{kk}
\end{bmatrix}
=
\begin{bmatrix}
L_{k-1} L_{k-1}^T & L_{k-1} w \\
w^T L_{k-1}^T & w^T w + l_{kk}^2
\end{bmatrix}.
$$

令其等于 $ A_k $：
$$
\begin{cases}
A_{k-1} = L_{k-1} L_{k-1}^T & \text{(由归纳假设已知)}\\
v = L_{k-1} w & \text{(1)}\\
a_{kk} = w^T w + l_{kk}^2 & \text{(2)}
\end{cases}
\tag{2}
$$

则 Cholesky 分解存在且唯一等价于方程组 $(2)$ 的解存在且唯一。显然 $w = L_{k-1}^{-1} v$ 存在且唯一，只需验证 $ a_{kk} - w^T w > 0 $ 即可！

由正定性，对任意非零向量 $ x \in \mathbb{R}^k $ 有 $ x^T A_k x > 0 $。
取 $ x = \begin{pmatrix} -L_{k-1}^{-T} w \\ 1 \end{pmatrix} $，注意这是一个分块向量，第一块长度 $k-1$，第二块是标量。
则
$$
x^T A_k x = \begin{pmatrix} -w^T L_{k-1}^{-1} & 1 \end{pmatrix}
\begin{bmatrix}
A_{k-1} & v \\
v^T & a_{kk}
\end{bmatrix}
\begin{pmatrix} -L_{k-1}^{-T} w \\ 1 \end{pmatrix} \\
=
\begin{pmatrix} -w^T L_{k-1}^{-1} & 1 \end{pmatrix}
\begin{bmatrix}
L_{k-1} L_{k-1}^T & L_{k-1} w \\
w^T L_{k-1}^T & a_{kk}
\end{bmatrix}
\begin{pmatrix} -L_{k-1}^{-T} w \\ 1 \end{pmatrix} \\
= a_{kk} - w^T w > 0.
$$

于是存在唯一性得证。

### Cholesky 分解计算公式

从 $A=L L^T$ 出发，对比矩阵元素可得：

$$
l_{kk} = \sqrt{a_{kk} - \sum_{j=1}^{k-1} l_{kj}^2}, \quad k=1,2,3,\dots,n
$$
$$
l_{ik} = \frac{1}{l_{kk}}\left(a_{ik} - \sum_{j=1}^{k-1} l_{ij}l_{kj}\right), \quad i=k+1,k+2,\dots,n
$$

**证明**：

矩阵乘法：
$$
a_{ij} = (LL^T)_{ij} = \sum_{k=1}^n l_{ik} l_{jk} = \sum_{k=1}^{\min(i, j)} l_{ik} l_{jk}.
$$

由于 $ L $ 下三角，$ l_{ik} = 0 $ 当 $ i < k $，且 $ l_{jk} = 0 $ 当 $ j < k $，所以求和实际上只到 $ \min(i, j) $。

- 情形 1：对角元 ($ i = j $)
   $$
   a_{ii} = \sum_{k=1}^i l_{ik}^2 = \sum_{k=1}^{i-1} l_{ik}^2 + l_{ii}^2.
   $$

   于是
   $$
   l_{ii}^2 = a_{ii} - \sum_{k=1}^{i-1} l_{ik}^2.
   $$

   将 $i$ 替换为 $k$，$k$ 替换为 $j$，并开方得（可以开方的证明见前一节）：
   $$
   l_{kk} = \sqrt{a_{kk} - \sum_{j=1}^{k-1} l_{kj}^2}, \quad k = 1, 2, \dots, n.
   $$

- 情形 2：非对角元 ($ i > j $) 下三角部分
   由对称性，我们只需考虑 $ i > j $。此时
   $$
   a_{ij} = \sum_{k=1}^j l_{ik} l_{jk} = \sum_{k=1}^{j-1} l_{ik} l_{jk} + l_{ij} l_{jj}.
   $$

   将 $j$、$k$ 互换，解得
   $$
   l_{ik} = \frac{1}{l_{kk}} \left( a_{ik} - \sum_{j=1}^{k-1} l_{ij} l_{kj} \right), \quad i=k+1,k+2,\dots,n.
   $$

实际操作时应按照下图所示的红橙黄绿顺序依次求解。也即先由上式求出 $a_{11}$，再由下式求出 $a_1$（$a^1$），再由上式求出 $a_{22}$，以此类推。

![图4：Cholesky 分解求解顺序](/images/note/computing-method/03-direct-method-for-linear-system-2-04-cholesky-ordinary-order.png)

### Cholesky 分解代码

#### 标准 Cholesky 分解

```python
L = np.zeros(n, n)
for k in range(n):
   # 求解对角元
   L[k, k] = A[k, k]
   for j in range(k):
      L[k, k] = L[k, k] - L[k, j] * L[k, j]
   L[k, k] = np.sqrt(L[k, k])
   # 求解对角元下侧（右侧）的剩余元
   for i in range(k + 1, n):
      L[i, k] = A[i, k]
      for j in range(k):
         L[i, k] = L[i, k] - L[i, j] * L[k, j]
      L[i, k] = L[i, k] / L[k, k]
```

#### 原位存储 Cholesky 分解

对于对称正定矩阵
$$
A = \begin{bmatrix}
a_{11} & \mathbf{l}^T \\
\mathbf{l} & B
\end{bmatrix}
$$
其中 $a_{11} > 0$，$B$ 对称正定。

则：
$$
A = \begin{bmatrix}
\sqrt{a_{11}} & 0 \\
\mathbf{l}/\sqrt{a_{11}} & I_{n-1}
\end{bmatrix}
\begin{bmatrix}
1 & 0 \\
0 & B - \mathbf{l}\mathbf{l}^T / a_{11}
\end{bmatrix}
\begin{bmatrix}
\sqrt{a_{11}} & \mathbf{l}^T/\sqrt{a_{11}} \\
0 & I_{n-1}
\end{bmatrix}
$$

其中 $B - \mathbf{l}\mathbf{l}^T/a_{11}$ 为 Schur 补，其 Cholesky 分解与原矩阵的 Cholesky 分解递归相关。
这是因为若 Schur 补也能够 Cholesky 分解，即若有 $B - \mathbf{l}\mathbf{l}^T/a_{11} = L_{n-1} L_{n-1}^T$，则：

$$
A = \begin{bmatrix}
\sqrt{a_{11}} & 0 \\
\mathbf{l}/\sqrt{a_{11}} & L_{n-1}
\end{bmatrix}
\begin{bmatrix}
\sqrt{a_{11}} & \mathbf{l}^T/\sqrt{a_{11}} \\
0 & L_{n-1}^T
\end{bmatrix}
$$

**原位存储的 Cholesky 分解**：

实际上每一递归步都是按照红橙黄的顺序进行计算，其中红橙色区域计算得到的是最终值，而黄色区域计算得到的是中间值。又由于对称性，所以我们只使用和计算下三角部分。

```python
for k in range(n):
   # 计算红色区域
   A[k, k] = np.sqrt(A[k, k])
   # 计算橙色区域
   for i in range(k + 1, n):
      A[i, k] = A[i, k] / A[k, k]
   # 计算黄色区域
   for i in range(k + 1, n):
      for j in range(i, n):
         A[i, j] = A[i, j] - A[i, k] * A[j, k] # 前面已经除了，故不需再除
```

![图5：递归 Cholesky 分解求解顺序](/images/note/computing-method/03-direct-method-for-linear-system-2-05-cholesky-recursive-order.png)

**注**：利用了对称性，只需计算下三角部分，存储空间和运算量都减半。

## LDL^T 分解

当矩阵对称但不一定是正定时，可采用 $LDL^T$ 分解。当然，对于对称正定矩阵也适用，并且比 Cholesky 分解少 $n$ 次开方运算。

### 数学基础：LDL^T 分解的存在唯一性

**定理**：
设 $A \in \mathbb{R}^{n \times n}$ 是对称矩阵，且其所有顺序主子式 $\det(A_k) \neq 0$（其中 $A_k$ 为 $A$ 的前 $k$ 阶顺序主子阵），
则存在唯一的单位下三角矩阵 $L$（对角元全为 $1$）和对角矩阵 $D$（对角元 $d_k \neq 0$），使得：
$$
A = LDL^T
$$

特别地，若 $A$ 对称正定（SPD），则所有 $d_k > 0$。

**与 Cholesky 分解的关系**：  
若 $A = LL^T$ 是标准 Cholesky 分解，则 $LDL^T$ 分解可视为 $L_{\text{chol}} = L_{\text{ldl}} \sqrt{D}$，从而避免开方运算，数值上更稳定，尤其适用于半正定或接近奇异的矩阵。

**证明**：

采用归纳法。

$n=1$ 时，显然存在且唯一。

假设对 $n \le k-1$ 结论成立，下证对于 $n=k$ 也成立。

将 $A_k$ 分块为
$$
A_k =
\begin{bmatrix}
A_{k-1} & v \\
v^T & a_{kk}
\end{bmatrix},
$$
其中 $v \in \mathbb{R}^{k-1}$。

由归纳假设，$A_{k-1} = L_{k-1} D_{k-1} L_{k-1}^T$。设待求的 $L_k$ 和 $D_k$ 分块为
$$
L_k =
\begin{bmatrix}
L_{k-1} & 0 \\
w^T & 1
\end{bmatrix},
\quad
D_k =
\begin{bmatrix}
D_{k-1} & 0 \\
0 & d_{kk}
\end{bmatrix},
$$
其中 $w \in \mathbb{R}^{k-1}$，$d_{kk} \neq 0$ 待定。

计算 $L_k D_k L_k^T$：
$$
L_k D_k L_k^T =
\begin{bmatrix}
L_{k-1} D_{k-1} L_{k-1}^T & L_{k-1} D_{k-1} w \\
w^T D_{k-1} L_{k-1}^T & w^T D_{k-1} w + d_{kk}
\end{bmatrix}.
$$

令其等于 $A_k$，得方程组：
$$
\begin{cases}
A_{k-1} = L_{k-1} D_{k-1} L_{k-1}^T & \text{(由归纳假设满足)}\\
v = L_{k-1} D_{k-1} w & \text{(1)}\\
a_{kk} = w^T D_{k-1} w + d_{kk} & \text{(2)}
\end{cases}
$$

由 (1) 解得
$$
w = D_{k-1}^{-1} L_{k-1}^{-1} v.
$$
由于 $L_{k-1}$ 单位下三角可逆，$D_{k-1}$ 对角元非零可逆，故 $w$ 存在且唯一。

代入 (2) 得
$$
d_{kk} = a_{kk} - w^T D_{k-1} w.
$$
$d_{kk}$ 由给定数据唯一确定。至此 $L_k$、$D_k$ 被唯一确定。

**需要验证 $d_{kk} \neq 0$**：由条件 $\det(A_k) \neq 0$，且
$$
\det(A_k) = \det(L_k D_k L_k^T) = \det(D_k) = \left( \prod_{i=1}^{k-1} d_i \right) \cdot d_{kk}.
$$
由归纳假设 $\prod_{i=1}^{k-1} d_i = \det(A_{k-1}) \neq 0$，结合 $\det(A_k) \neq 0$ 得 $d_{kk} \neq 0$。证毕。

当正定时，显然可知所有 $d_k \gt 0$

### LDL^T 分解计算公式

从 $A = LDL^T$ 出发，设 $L$ 为单位下三角，$D = \operatorname{diag}(d_1, d_2, \dots, d_n)$，对比矩阵元素可得：

$$
d_k = a_{kk} - \sum_{j=1}^{k-1} l_{kj}^2 d_j, \quad k=1,2,\dots,n
$$
$$
l_{ik} = \frac{1}{d_k} \left( a_{ik} - \sum_{j=1}^{k-1} l_{ij} l_{kj} d_j \right), \quad i=k+1,\dots,n
$$

**证明**：

由 $A = LDL^T$，且 $L$ 下三角且对角元为 $1$，得
$$
a_{ij} = \sum_{k=1}^{\min(i,j)} l_{ik} d_k l_{jk}.
$$

- 情形 1：对角元 ($i=j$)  
  $$
  a_{ii} = \sum_{k=1}^{i} l_{ik}^2 d_k = \sum_{k=1}^{i-1} l_{ik}^2 d_k + d_i.
  $$
  将 $i$ 替换为 $k$，并化简得：
  $$
  d_k = a_{kk} - \sum_{j=1}^{k-1} l_{kj}^2 d_j.
  $$

- 情形 2：非对角元 ($i>j$)  
  $$
  a_{ij} = \sum_{k=1}^{j} l_{ik} d_k l_{jk} = \sum_{k=1}^{j-1} l_{ik} d_k l_{jk} + l_{ij} d_j.
  $$
  将 $j$ 换为 $k$，$i$ 换为 $i$，$k$ 换为 $j$，并化简得：
  $$
  l_{ik} = \frac{1}{d_k} \left( a_{ik} - \sum_{j=1}^{k-1} l_{ij} l_{kj} d_j \right), \quad i=k+1,\dots,n.
  $$

实际操作时计算顺序与 Cholesky 分解类似，不过此处对角元在 D 中计算。

### LDL^T 分解代码

#### 标准 LDL^T 分解

```python
L = np.eye(n)
D = np.zeros(n)
for k in range(n):
   # 计算 D 中对角元 d_k
   D[k] = A[k, k]
   for j in range(k):
      D[k] = D[k] - L[k, j] * L[k, j] * D[j]
    
   # 计算 L 中第 k 列严格下三角部分
   for i in range(k + 1, n):
      L[i, k] = A[i, k]
      for j in range(k):
         L[i, k] = L[i, k] - L[i, j] * L[k, j] * D[j]
      L[i, k] = L[i, k] / D[k]
```

#### 原位存储 LDL^T 分解

对于对称阵
$$
A = \begin{bmatrix}
a_{11} & \mathbf{l}^T \\
\mathbf{l} & B
\end{bmatrix}
$$
其中 $a_{11} \ne 0$，$B$ 对称。

则：
$$
A = \begin{bmatrix}
1 & 0 \\
\mathbf{l}/a_{11} & I_{n-1}
\end{bmatrix}
\begin{bmatrix}
a_{11} & 0 \\
0 & B - \mathbf{l}\mathbf{l}^T / a_{11}
\end{bmatrix}
\begin{bmatrix}
1 & \mathbf{l}^T/a_{11} \\
0 & I_{n-1}
\end{bmatrix}
$$
其中 $B - \mathbf{l}\mathbf{l}^T / a_{11}$ 是 Schur 补，其 $LDL^T$ 分解可以递归进行。也即若有 $B - \mathbf{l}\mathbf{l}^T / a_{11} = L_{n-1}D_{n-1}L_{n-1}^T$，则：
$$
A = \begin{bmatrix}
1 & 0 \\
\mathbf{l}/a_{11} & L_{n-1}
\end{bmatrix}
\begin{bmatrix}
a_{11} & 0 \\
0 & D_{n-1}
\end{bmatrix}
\begin{bmatrix}
1 & \mathbf{l}^T/a_{11} \\
0 & L_{n-1}^T
\end{bmatrix}
$$

原位存储时，我们只需存储下三角部分（包括对角元），最终 $A$ 的下三角部分被 $L$ 的严格下三角部分和 $D$ 的对角元覆盖。

```python
for k in range(n):
   # 计算 D 中对角元 d_k，暂存在 A[k, k]
   for i in range(k + 1, n):
      A[i, k] = A[i, k] / A[k, k]
   # 计算 L 中第 k 列严格下三角部分
   for i in range(k + 1, n):
      for j in range(i, n):
         A[i, j] = A[i, j] - A[i, k] * A[j, k] # 前面已经除了，故不需再除
```

**注**：  
与 Cholesky 分解相比，$LDL^T$ 避免了开方运算，数值稳定性更好，且可推广到对称不定矩阵（此时 $D$ 允许有正负对角元）。

## 方法对比与总结

### 各种分解方法对比

| 方法 | 适用条件 | 存储需求 | 运算量 | 特点 |
| ------ | ---------- | ---------- | -------- | ------ |
| LU 分解 | 一般方阵（顺序主子式非零） | $n^2$ | $\frac{2}{3}n^3$ | 通用性强，适合多次右端项求解 |
| Cholesky 分解 | 对称正定矩阵 | $\frac{1}{2}n^2$ | $\frac{1}{3}n^3$ | 运算量少，数值稳定性好 |
| LDL^T 分解 | 对称矩阵（顺序主子式非零） | $\frac{1}{2}n^2$ | $\frac{1}{3}n^3$ | 无需开方，适用于对称不定矩阵 |
| 带状 LU 分解 | 带状矩阵 | $(p+q+1)n$ | $npq$ | 利用稀疏性，效率高 |

### 数值稳定性对比

- **LU 分解**：若主元很小，可能导致舍入误差放大，需列主元（PLU分解）提高稳定性。
- **Cholesky 分解**：若主元 $l_{kk} = \sqrt{a_{kk}^{(k)}}$ 很小，则会不稳定。
- **LDL^T 分解**：对称矩阵中，若 $D$ 中出现接近 0 的对角元，同样会有数值稳定性问题。
