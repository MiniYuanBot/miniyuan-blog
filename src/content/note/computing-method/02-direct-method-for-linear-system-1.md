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

对于 $n$ 阶线性代数方程组：
$$
\mathbf A \mathbf x = \mathbf b
$$
其中 $ \mathbf A\in\mathbb{R}^{n\times n} $ 且非奇异，$ \mathbf x,\mathbf b\in\mathbb{R}^n $.

直接法是指，通过有限次确定的算术运算得到舍入误差以内精确的数值解。

---

## 常见矩阵结构

- 对角矩阵：$\mathbf A=\operatorname{diag}(a_{11},\dots,a_{nn})$。
- 三对角矩阵（tridiagonal）：仅在主对角线及其上下各一条对角线非零。
- 上/下三角矩阵：上三角 $\mathbf U$、下三角 $\mathbf L$；
- 单位三角矩阵：对角线元素全为1。
- 对称/正定矩阵：$\mathbf A^\top=\mathbf A$，且 $\mathbf x^\top \mathbf A \mathbf x>0$（正定），或 $\ge0$（半正定）。
- 正交矩阵：$\mathbf Q^\top = \mathbf Q^{-1}$。

**注**：这些结构（稠密性）会影响解法选择与复杂度。

---

## GAUSS 消去法

通过初等行变换将 $\mathbf A$ 化为上三角矩阵 $\mathbf U$，再回代求解 $\mathbf x$。

### GAUSS 消去法思想

按列逐步消元。

- 在第 $k$ 步，用第 $k$ 行消去第 $k$ 列下面的元素，使得第 $k$ 列除对角元外均为 0。
- 对 $k=1,2,\dots,n-1$ 分别操作，最终得到上三角矩阵 $\mathbf U$ 与相应的右端项 $\tilde {\mathbf b}$，再通过回代得到解。

### 数学基础：SWM 公式

Sherman–Morrison–Woodbury 公式：
$$
(\mathbf A+\mathbf U\mathbf V^\top)^{-1}
=
\mathbf A^{-1} - \mathbf A^{-1} \mathbf U
(\mathbf I + \mathbf V^\top \mathbf A^{-1} \mathbf U)^{-1} \mathbf V^\top \mathbf A^{-1}.
$$
其中 $\mathbf A \in \mathbb R^{n \times n}$ 是可逆阵，$\mathbf U, \; \mathbf V \in \mathbb R^{n \times k}$

**证明**：
构造块矩阵 $\mathbf M$：
$$
\begin{pmatrix}
\mathbf A & \mathbf U \\ \mathbf V^\top & -\mathbf I
\end{pmatrix}
$$

将其对角化，可得恒等式：
$$
\begin{pmatrix}
\mathbf A & \mathbf U \\ \mathbf V^\top & -\mathbf I
\end{pmatrix}
=
\begin{pmatrix}
\mathbf I & \mathbf 0 \\ \mathbf V^\top \mathbf A^{-1} & \mathbf I
\end{pmatrix}
\begin{pmatrix}
\mathbf A & \mathbf 0 \\ \mathbf 0 & -\mathbf I - \mathbf V^\top \mathbf A^{-1} \mathbf U
\end{pmatrix}
\begin{pmatrix}
\mathbf I & \mathbf A^{-1}\mathbf U \\ \mathbf 0 & \mathbf I
\end{pmatrix}
$$

对 $\mathbf M$ 直接求逆，并取左上角块得：
$$
\mathbf M_{1, 1}^{-1} = (\mathbf A + \mathbf U\mathbf V^\top)^{-1}
$$

对恒等式右侧分别求逆并相乘得：
$$
\mathbf M^{-1}
=
\begin{pmatrix}
\mathbf I & -\mathbf A^{-1}\mathbf U \\ \mathbf 0 & \mathbf I
\end{pmatrix}
\begin{pmatrix}
\mathbf A^{-1} & \mathbf 0 \\ \mathbf 0 & -(\mathbf I + \mathbf V^\top \mathbf A^{-1} \mathbf U)^{-1}
\end{pmatrix}
\begin{pmatrix}
\mathbf I & \mathbf 0 \\ -\mathbf V^\top \mathbf A^{-1} & \mathbf I
\end{pmatrix}
$$

故
$$
\mathbf M_{1, 1}^{-1}
= \mathbf A^{-1} - \mathbf A^{-1} \mathbf U
(\mathbf I + \mathbf V^\top \mathbf A^{-1} \mathbf U)^{-1} \mathbf V^\top \mathbf A^{-1}
$$

### 矩阵视角下的 GAUSS 消去法

消元可以用矩阵乘法描述。定义第 $k$ 步的消元矩阵：
$$
\mathbf M_k = \mathbf I - \mathbf m_k \mathbf e_k^\top,
$$
其中向量
$$
\mathbf m_k = [0,\dots,0,\,m_{k+1,k},\dots,m_{n,k}]^\top,\quad m_{j,k}=\frac{a^{(k)}_{j,k}}{a^{(k)}_{k,k}},\; j=k+1,\dots,n,
$$
且 $\mathbf e_k$ 是第 $k$ 个标准基向量。

第 $k$ 步变换为左乘（行变换） $\mathbf M_k$：$\mathbf A^{(k+1)} = \mathbf M_k \mathbf A^{(k)}$。经过 $n-1$ 步：
$$
\mathbf A^{(n)} = \mathbf M_{n-1} \cdots \mathbf M_2 \mathbf M_1 \mathbf A^{(1)} \equiv \mathbf U
$$
且每个 $\mathbf M_k$ 可逆。

由 $k = 1$ 时的 SWM 公式：
$$
(\mathbf A+\mathbf u\mathbf v^\top)^{-1}
= \mathbf A^{-1}-\frac{\mathbf A^{-1} \mathbf u \mathbf v^\top \mathbf A^{-1}}{1+\mathbf v^\top \mathbf A^{-1} \mathbf u}
$$

取 $\mathbf A=\mathbf I$，$\mathbf u=-\mathbf m_k$, $\mathbf v=\mathbf e_k$，则有（虽然好像可以直接验证 www）：
$$
\mathbf M_k^{-1}=\mathbf I + \mathbf m_k \mathbf e_k^\top
$$

令
$$
\mathbf L = \mathbf M_1^{-1} \mathbf M_2^{-1}\cdots \mathbf M_{n-1}^{-1}
$$
则得到标准的 LU 分解
$$
\mathbf A = \mathbf L \mathbf U
$$
其中 $\mathbf L$ 为单位下三角矩阵，$\mathbf U$ 为上三角矩阵。

**注**：
有趣的时，此处 $\mathbf L$ 的第 $(j,k)$ 元就是在第 $k$ 步用来消去 $a_{j,k}$ 的乘子 $m_{j,k}$，也即 $\mathbf L$ 就是把之前各消元矩阵中乘子放在对应位置拼成的矩阵。注意符号！

$$
\mathbf L = \begin{pmatrix}
1 & & & & \\
m_{21} & 1 & & & \\
m_{31} & m_{32} & 1 & & \\
\vdots & \vdots & \ddots & \ddots & \\
m_{n1} & m_{n2} & \cdots & m_{n,n-1} & 1
\end{pmatrix}
$$

---

### GAUSS 消去法代码

假设 $\mathbf A \in \mathbb{R}^{n \times n}$ 存储于 `A[i, j]`，$\mathbf b \in \mathbb{R}^{n}$ 存储于 `b[i]`

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

### GAUSS 消去法复杂度分析

- 除法数：约 $\dfrac{n(n-1)}{2}$；
- 乘法数：约 $\dfrac{n(n-1)(n+1)}{3}$；
- 加法数：同样约 $\dfrac{1}{3} n^3$；
- 时间复杂度：$O(n^3)$；
- 空间复杂度：原地修改 $\mathbf A$，只需 $O(n^2)$ 存储。

---

## 列主元消去法

### 列主元消去法思想

考虑下面问题：
$$
\begin{bmatrix}\varepsilon & 1\\ 1 & 1\end{bmatrix}\begin{bmatrix}x_1\\x_2\end{bmatrix}=\begin{bmatrix}1\\\varepsilon\end{bmatrix},
$$
真实解：
$\mathbf x = \begin{bmatrix}-1\\ 1+\varepsilon\end{bmatrix}$

直接 Gauss 消去得:
$$
\begin{bmatrix} \varepsilon & 1 & 1 \\ 0 & 1-1/\varepsilon & \varepsilon-1/\varepsilon \end{bmatrix}
$$
若 $\varepsilon$ 很小，计算机中会解得：
$\mathbf x = \begin{bmatrix}0\\ 1\end{bmatrix}$

也即当主元 $a^{(k)}_{k,k}$ 为 0 或接近 0 时，直接消元会出现除以极小值导致的数值不稳定性，甚至可能出现除 0 操作。

解决方案是在每一步选择该列中绝对值最大的元素作主元并交换行，称为部分选主元（partial pivoting）。由于 $\mathbf A$ 的非奇异性，这是存在的，否则该列会与前面的列线性相关。

**注**：还有完全选主元法（full pivoting），也即行列同时选，代价更高但更稳定。工业中部分选主元（partial pivoting）通常是均衡的选择。

### 数学基础：初等交换阵

交换第 $i$ 行（$j$ 列）和第 $j$ 行（$i$ 列）的初等置换矩阵可表为：
$$
\mathbf P_{ij}
= \mathbf I - \mathbf e_i \mathbf e_i^\top - \mathbf e_j \mathbf e_j^\top
+ \mathbf e_i \mathbf e_j^\top + \mathbf e_j \mathbf e_i^\top
$$
其中 $\mathbf e_k$ 是第 $k$ 个标准基向量。

**性质**：

1. $ \mathbf P_{ij}^\top = \mathbf P_{ij} $
2. $ \mathbf P_{ij}^{-1} = \mathbf P_{ij} $

### 矩阵视角下的列主元消去法

这一部分对于算法设计用处不大，但还是看一眼喵~在列主元消去法中，每一步消元前需要先进行行交换。设第 $k$ 步选择第 $p$ 行（$p \geq k$）作为主元行，则完整的变换过程为：
$$
\mathbf{\mathbf A}^{(n)}
= \mathbf{\mathbf M}_{n-1}\mathbf{P}_{n-1}\mathbf{\mathbf M}_{n-2}\mathbf{P}_{n-2}
\cdots\mathbf{\mathbf M}_2\mathbf{P}_2\mathbf{\mathbf M}_1\mathbf{P}_1\mathbf{\mathbf A}^{(1)}
$$

其中 $\mathbf{P}_k$ 为行交换（交换第 $k$ 行与第 $p$ 行），
$\mathbf{\mathbf M}_k$ 为消元矩阵，
$\mathbf{\mathbf A}^{(n)} \equiv \mathbf{\mathbf U}$ 为上三角矩阵。

对于 $\mathbf{\mathbf M}_k = \mathbf{\mathbf I} - \mathbf{m}_k\mathbf{e}_k^\top$，定义
$$
\mathbf{P}_{k+1}\mathbf{\mathbf M}_k\mathbf{P}_{k+1} \equiv \overline{\mathbf{\mathbf M}}_k
$$

其中由于原消元矩阵的稀疏性，故 $\overline{\mathbf{\mathbf M}}_k$ 实际上仅是将 $\mathbf{\mathbf M}_k$ 的 $(k+1, k)$ 与 $(p, k)$ 元素进行了置换，仍保持单位下三角。

因为
$$
\mathbf{\mathbf A}^{(n)}
= \mathbf{\mathbf M}_{n-1}\mathbf{P}_{n-1}\cdots\mathbf{\mathbf M}_1\mathbf{P}_1\mathbf{\mathbf A}
$$

可得：
$$
\overline{\mathbf{\mathbf M}}_1^{-1}\overline{\mathbf{\mathbf M}}_2^{-1}
\cdots\overline{\mathbf{\mathbf M}}_{n-2}^{-1}\mathbf{\mathbf M}_{n-1}^{-1}\mathbf{\mathbf U}
= \underbrace{\mathbf{P}_{n-1}\mathbf{P}_{n-2}
\cdots\mathbf{P}_2\mathbf{P}_1}_{\equiv \mathbf{P}}\mathbf{\mathbf A}
$$

即 **带列主元的 LU 分解**：
$$
\mathbf{P\mathbf A} = \mathbf{LU}
$$

其中：

- $\mathbf{P}$ 为**排列矩阵**（permutation matrix），满足 $\mathbf{P}^{-1} = \mathbf{P}^\top$
- $\mathbf{\mathbf L} =$
   $\overline{\mathbf{\mathbf M}}_1^{-1}\cdots\overline{\mathbf{\mathbf M}}_{n-2}^{-1}\mathbf{\mathbf M}_{n-1}^{-1}$ 为单位下三角矩阵
- $\mathbf{\mathbf U}$ 为上三角矩阵

---

### 列主元消去法代码

假设 $\mathbf A \in \mathbb{R}^{n \times n}$ 存储于 `A[i, j]`，$\mathbf b \in \mathbb{R}^{n}$ 存储于 `b[i]`

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

### 列主元消去法复杂度分析

时间复杂度、空间复杂度与 Gauss 消元法量级相同，但是在时间复杂度上会多 $O(n^2)$ 的比较成本，空间复杂度上会多 $O(n)$ 的排列向量成本。
