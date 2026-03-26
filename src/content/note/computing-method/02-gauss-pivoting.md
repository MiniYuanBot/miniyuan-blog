---
title: '解线性方程组的直接法（Gauss 消去法、列主元消去法）'
excerpt: '26 春 计算方法 L02'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'March 16 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 概述

研究对象是 $n$ 阶线性代数方程组
$$
A x = b
$$
其中 $ A\in\mathbb{R}^{n\times n} $ 且非奇异，$ x,b\in\mathbb{R}^n $.

直接法：通过有限次确定的算术运算（消元/分解）得到舍入误差以内精确的数值解。

---

## 常见矩阵结构

- 对角矩阵：$A=\operatorname{diag}(a_{11},\dots,a_{nn})$。
- 三对角矩阵（tridiagonal）：仅在主对角线及其上下各一条对角线非零。
- 上/下三角矩阵：上三角 $U$、下三角 $L$；单位三角矩阵：对角线元素全为1。
- 对称/正定矩阵：$A^T=A$，且 $x^T A x>0$（正定），或 $\ge0$（半正定）。
- 正交矩阵：$Q^T = Q^{-1}$。

**注**：这些结构（稠密性）会影响解法选择与复杂度。

---

## GAUSS 消去法

通过初等行变换将 $A$ 化为上三角矩阵 $U$，再回代求解 $x$。

### 思想

按列逐步消元。
- 在第 k 步，用第 k 行消去第 k 列下面的元素，使得第 k 列除对角元外均为 0。
- 重复 $k=1,2,\dots,n-1$，最终得到上三角矩阵 $U$ 与相应的右端项 $\tilde b$，再通过回代得到解。

### 数学基础：SWM 公式

Sherman–Morrison–Woodbury 公式：
$$
(A+UV^T)^{-1}=A^{-1} - A^{-1} U (I + V^T A^{-1} U)^{-1} V^T A^{-1}.
$$
其中 $A \in \mathbb R^{n \times n}$ 是可逆阵，$U, \; V \in \mathbb R^{n \times k}$

**证明**：
构造块矩阵 $M$：
$$
\begin{pmatrix}
A & U \\ V^T & -I
\end{pmatrix}
$$

将其对角化，可得恒等式：
$$
\begin{pmatrix}
A & U \\ V^T & -I
\end{pmatrix}
=
\begin{pmatrix}
I & 0 \\ V^T A^{-1} & I
\end{pmatrix}
\begin{pmatrix}
A & 0 \\ 0 & -I - V^T A^{-1} U
\end{pmatrix}
\begin{pmatrix}
I & A^{-1}U \\ 0 & I
\end{pmatrix}
$$

对 $M$ 直接求逆，并取左上角块得：
$$
M_{1, 1}^{-1} = (A + UV^T)^{-1}
$$

对恒等式右侧分别求逆并相乘得：
$$
M^{-1}
=
\begin{pmatrix}
I & -A^{-1}U \\ 0 & I
\end{pmatrix}
\begin{pmatrix}
A^{-1} & 0 \\ 0 & -(I + V^T A^{-1} U)^{-1}
\end{pmatrix}
\begin{pmatrix}
I & 0 \\ -V^T A^{-1} & I
\end{pmatrix}
$$

故
$$
M_{1, 1}^{-1} = A^{-1} - A^{-1} U (I + V^T A^{-1} U)^{-1} V^T A^{-1} \quad \Box
$$

### 矩阵视角

消元可以用矩阵乘法描述。定义第 $k$ 步的消元矩阵：
$$
M_k = I - m_k e_k^T,
$$
其中向量
$$
m_k = [0,\dots,0,\,m_{k+1,k},\dots,m_{n,k}]^T,\quad m_{j,k}=\frac{a^{(k)}_{j,k}}{a^{(k)}_{k,k}},\; j=k+1,\dots,n,
$$
且 $e_k$ 是第 $k$ 个标准基向量。

第 $k$ 步变换为左乘（行变换） $M_k$：$A^{(k+1)} = M_k A^{(k)}$。经过 $n-1$ 步：
$$
A^{(n)} = M_{n-1} \cdots M_2 M_1 A^{(1)} \equiv U,
$$
且每个 $M_k$ 可逆。

由 $k = 1$ 时的 SWM 公式：
$$
(A+uv^T)^{-1}=A^{-1}-\frac{A^{-1} u v^T A^{-1}}{1+v^T A^{-1} u}.
$$

取 $A=I$，$u=-m_k$, $v=e_k$，则有（虽然好像可以直接验证 www）：
$$
M_k^{-1}=I + m_k e_k^T,
$$

令
$$
L = M_1^{-1} M_2^{-1}\cdots M_{n-1}^{-1},
$$
则得到标准的 LU 分解
$$
A = L U,
$$
其中 $L$ 为单位下三角矩阵，$U$ 为上三角矩阵。

**注**：
有趣的时，此处 $L$ 的第 $(j,k)$ 元就是在第 $k$ 步用来消去 $a_{j,k}$ 的乘子 $m_{j,k}$，也即 $L$ 就是把之前各消元矩阵中乘子放在对应位置拼成的矩阵。注意符号！

$$
L = \begin{pmatrix}
1 & & & & \\
m_{21} & 1 & & & \\
m_{31} & m_{32} & 1 & & \\
\vdots & \vdots & \ddots & \ddots & \\
m_{n1} & m_{n2} & \cdots & m_{n,n-1} & 1
\end{pmatrix}
$$

---

### 算法

假设 $A \in \mathbb{R}^{n \times n}$ 存储于 `A[i, j]`，$b \in \mathbb{R}^{n}$ 存储于 `b[i]`
```python
# 消去算法
for k in range(n - 1): # 枚举列
   for i in range(k + 1, n): # 枚举行
      c = -A[i, k] / A[k, k] # 乘子
      for j in range(k + 1, n + 1): # 消元
         A[i, j] = A[i, j] + c * A[k, j]
      b[i] = b[i] + c * b[k]

# 回代算法
for i in range(n - 1, -1, -1): # 逆序回代
   for j in range(i + 1, n - 1): # 此时这些 b[j] 已经是准确的了
      b[i] = b[i] - A[i, j] * b[j]
   b[i] = b[i] / A[i, i] # 因为没有规约化
```

**注**：
算法中没有必要对 `A[k, k]` 做归一化（节约运算），同时只需更新矩阵的上三角部分（下三角不再需要）。计算中没有考虑除 0 问题。

---

### 复杂度分析

- 除法数：约 $\frac{n(n-1)}{2}$；
- 乘法数：约 $\frac{n(n-1)(n+1)}{3}$；
- 加法数：同样约 $\frac{1}{3} n^3$；
- 时间复杂度：$O(n^3)$；
- 空间复杂度：原地修改 $A$，只需 $O(n^2)$ 存储。

---

## 列主元消去法

### 思想

考虑下面问题：
$$
\begin{bmatrix}\varepsilon & 1\\ 1 & 1\end{bmatrix}\begin{bmatrix}x_1\\x_2\end{bmatrix}=\begin{bmatrix}1\\\varepsilon\end{bmatrix},
$$
真实解：
$x = \begin{bmatrix}-1\\ 1+\varepsilon\end{bmatrix}.$

直接 Gauss 消去得:
$$
\begin{bmatrix} \varepsilon & 1 & 1 \\ 0 & 1-1/\varepsilon & \varepsilon-1/\varepsilon \end{bmatrix}.
$$
若 $\varepsilon$ 很小，计算机中会解得：
$x = \begin{bmatrix}0\\ 1\end{bmatrix}.$

也即当主元 $a^{(k)}_{k,k}$ 为 0 或接近 0 时，直接消元会出现除以极小值导致的数值不稳定性，甚至可能直接出现除 0 操作。

解决方案是在每一步选择该列中绝对值最大的元素作主元并交换行，称为部分选主元（partial pivoting）。由于 $A$ 的非奇异性，这是存在的，否则该列会与前面的列线性相关。

**注**：还有完全选主元法（full pivoting，行列同时选，代价更高但更稳定），工业中部分选主元（partial pivoting）通常是均衡的选择。

### 数学基础：初等交换阵

交换第 $i$ 行（$j$ 列）和第 $j$ 行（$i$ 列）的初等置换矩阵可表为：
$$
P_{ij} = I - e_i e_i^T - e_j e_j^T + e_i e_j^T + e_j e_i^T
$$
其中 $e_k$ 是第 $k$ 个标准基向量。

**性质**：
1. $ P_{ij}^T = P_{ij} $
2. $ P_{ij}^{-1} = P_{ij} $

### 矩阵视角

这一部分对于算法设计用处不大，但还是看一眼喵~在列主元消去法中，每一步消元前需要先进行行交换。设第 $k$ 步选择第 $p$ 行（$p \geq k$）作为主元行，则完整的变换过程为：
$$
\mathbf{A}^{(n)} = \mathbf{M}_{n-1}\mathbf{P}_{n-1}\mathbf{M}_{n-2}\mathbf{P}_{n-2}\cdots\mathbf{M}_2\mathbf{P}_2\mathbf{M}_1\mathbf{P}_1\mathbf{A}^{(1)}
$$

其中 $\mathbf{P}_k$ 为行交换（交换第 $k$ 行与第 $p$ 行），$\mathbf{M}_k$ 为消元矩阵，$\mathbf{A}^{(n)} \equiv \mathbf{U}$ 为上三角矩阵。

对于 $\mathbf{M}_k = \mathbf{I} - \mathbf{m}_k\mathbf{e}_k^T$，定义
$$
\mathbf{P}_{k+1}\mathbf{M}_k\mathbf{P}_{k+1} \equiv \overline{\mathbf{M}}_k
$$

其中由于原消元矩阵的稀疏性，故 $\overline{\mathbf{M}}_k$ 实际上仅是将 $\mathbf{M}_k$ 的 $(k+1, k)$ 与 $(p, k)$ 元素进行了置换，仍保持单位下三角。

从 $\mathbf{A}^{(n)} = \mathbf{M}_{n-1}\mathbf{P}_{n-1}\cdots\mathbf{M}_1\mathbf{P}_1\mathbf{A}$ 出发，可得：

$$
\overline{\mathbf{M}}_1^{-1}\overline{\mathbf{M}}_2^{-1}\cdots\overline{\mathbf{M}}_{n-2}^{-1}\mathbf{M}_{n-1}^{-1}\mathbf{U} = \underbrace{\mathbf{P}_{n-1}\mathbf{P}_{n-2}\cdots\mathbf{P}_2\mathbf{P}_1}_{\equiv \mathbf{P}}\mathbf{A}
$$

即 **带列主元的 LU 分解**：
$$
\boxed{\mathbf{PA} = \mathbf{LU}}
$$

其中：
- $\mathbf{P}$ 为**排列矩阵**（permutation matrix），满足 $\mathbf{P}^{-1} = \mathbf{P}^T$
- $\mathbf{L} = \overline{\mathbf{M}}_1^{-1}\cdots\overline{\mathbf{M}}_{n-2}^{-1}\mathbf{M}_{n-1}^{-1}$ 为单位下三角矩阵
- $\mathbf{U}$ 为上三角矩阵

---

### 算法

假设 $A \in \mathbb{R}^{n \times n}$ 存储于 `A[i, j]`，$b \in \mathbb{R}^{n}$ 存储于 `b[i]` 
```python
# 消去算法
# 排列向量 p[i] = j 表示当前的第 i 行对应原始的第 j 行
for i in range(n):
   p[i] = i

for k in range(n - 1): # 枚举列
   s = k
   for i in range(k + 1, n):
      if abs(A[p[i], k]) > abs(A[p[s], k]):
         s = i
   p[s], p[k] = p[k], p[s]
   for i in range(k + 1, n): # 枚举行
      c = -A[p[i], k] / A[p[k], k] # 乘子
      for j in range(k + 1, n + 1): # 消元
         A[p[i], j] = A[p[i], j] + c * A[p[k], j]
      b[p[i]] = b[p[i]] + c * b[p[k]]

# 回代算法
for i in range(n - 1, -1, -1): # 逆序回代
   for j in range(i + 1, n - 1): # 此时这些 b[p[j]] 已经是准确的了
      b[p[i]] = b[p[i]] - A[p[i], j] * b[p[j]]
   b[p[i]] = b[p[i]] / A[p[i], i] # 因为没有规约化
```

**注**：操作上使用排列向量 `p[i]` 来避免昂贵的内存行交换。

---

### 复杂度分析

时间复杂度、空间复杂度与 Gauss 消元法量级相同，但是在时间复杂度上会多 $O(n^2)$ 的比较成本，空间复杂度上会多 $O(n)$ 的排列向量成本。
