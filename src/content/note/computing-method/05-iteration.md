---
title: '解线性方程组的迭代法（Jacobi，Gauss-Seidal，松弛法，收敛性）'
excerpt: '26 春 计算方法 L04'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'March 25 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 解线性方程组的迭代法

## 引言：为什么需要迭代法？

对于大规模稀疏线性方程组 $\mathbf{A}\mathbf{x}=\mathbf{b}$，直接法（如LU分解）存在以下局限：

- **存储问题**：即使 $\mathbf{A}$ 是稀疏的，其LU分解因子 $\mathbf{L}$ 和 $\mathbf{U}$ 可能变得稠密（填充现象）
- **计算复杂度**：直接法通常是 $O(n^3)$，对于大规模问题难以承受

**迭代法基本思想**：通过构造迭代格式 $\mathbf{x}^{(k+1)} = \mathbf{M}\mathbf{x}^{(k)} + \mathbf{g}$，从一个初始猜测 $\mathbf{x}^{(0)}$ 出发，产生近似解序列 $\{\mathbf{x}^{(k)}\}$，期望其收敛到真实解 $\mathbf{x}^*$。

**注**：迭代法特别适合大规模稀疏矩阵，因为每次迭代主要涉及矩阵-向量乘法，可以充分利用稀疏性。

---

## Jacobi 迭代法

### 矩阵分裂与迭代格式

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
\mathbf{x}^{(k+1)} = \mathbf{D}^{-1}(\mathbf{D}-\mathbf{A})\mathbf{x}^{(k)} + \mathbf{D}^{-1}\mathbf{b} = \mathbf{B}\mathbf{x}^{(k)} + \mathbf{g}
$$

**分量形式**（更直观）：
$$
x_i^{(k+1)} = \frac{1}{a_{ii}}\left(b_i - \sum_{j=1, j\neq i}^{n} a_{ij}x_j^{(k)}\right), \quad i=1,2,\dots,n
$$

**注**：Jacobi迭代的本质是**同步更新**——每次迭代使用上一步的所有分量值 $x_j^{(k)}$ 来计算当前步的所有分量 $x_i^{(k+1)}$。

### 算法流程（Algorithm 5.1）

**输入**：$\mathbf{A} \in \mathbb{R}^{n\times n}$，初始值 $\mathbf{x}^{(0)}$，右端项 $\mathbf{b}$，最大迭代次数 $N$，误差阈值 $\varepsilon$  
**输出**：近似解 $\mathbf{x}$

1. 令 $k = 0$
2. **while** $k < N$ **do**
3. &nbsp;&nbsp;&nbsp;&nbsp;保存旧值：$y_i \leftarrow x_i$（对所有 $i$）
4. &nbsp;&nbsp;&nbsp;&nbsp;**for** $i = 1, 2, \dots, n$ **do**
5. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow b_i$
6. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**for** $j = 1, 2, \dots, n$ 且 $j \neq i$ **do**
7. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i - a_{ij} \cdot y_j$
8. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**end for**
9. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i / a_{ii}$
10. &nbsp;&nbsp;&nbsp;&nbsp;**end for**
11. &nbsp;&nbsp;&nbsp;&nbsp;**if** $\|\mathbf{x} - \mathbf{y}\|_2 < \varepsilon$ **then**
12. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Exit**（收敛，停止迭代）
13. &nbsp;&nbsp;&nbsp;&nbsp;**end if**
14. &nbsp;&nbsp;&nbsp;&nbsp;$k \leftarrow k + 1$
15. **end while**

**注**：实际编程中需注意，必须先用临时变量保存 $\mathbf{x}^{(k)}$ 的所有分量，待全部计算出 $\mathbf{x}^{(k+1)}$ 后再统一更新，避免混用新旧值。

---

## Gauss-Seidel 迭代法

### 迭代格式改进

观察 Jacobi 方法：在计算 $x_i^{(k+1)}$ 时，$x_1^{(k+1)}, \dots, x_{i-1}^{(k+1)}$ 已经计算出来，但 Jacobi 仍然使用旧值 $x_j^{(k)}$（$j<i$）。

**Gauss-Seidel 思想**：**立即使用**最新计算出的分量值（异步更新）。

将 $\mathbf{A}$ 分裂为：
$$
\mathbf{A} = \mathbf{D} - \mathbf{L} - \mathbf{U}
$$
其中 $\mathbf{L}$ 为严格下三角矩阵（对角线为零），$\mathbf{U}$ 为严格上三角矩阵。

迭代格式变为：
$$
(\mathbf{D} - \mathbf{L})\mathbf{x}^{(k+1)} = \mathbf{U}\mathbf{x}^{(k)} + \mathbf{b}
$$

即：
$$
\mathbf{x}^{(k+1)} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}\mathbf{x}^{(k)} + (\mathbf{D}-\mathbf{L})^{-1}\mathbf{b}
$$

**分量形式**：
$$
x_i^{(k+1)} = \frac{1}{a_{ii}}\left(b_i - \sum_{j=1}^{i-1} a_{ij}x_j^{(k+1)} - \sum_{j=i+1}^{n} a_{ij}x_j^{(k)}\right), \quad i=1,2,\dots,n
$$

**注**：与 Jacobi 的关键区别在于求和项 $\sum_{j=1}^{i-1}$ 使用的是**当前步已更新**的 $x_j^{(k+1)}$。

### 算法流程（Algorithm 5.2）

**输入**：同 Algorithm 5.1  
**输出**：近似解 $\mathbf{x}$

1. 令 $k = 0$
2. **while** $k < N$ **do**
3. &nbsp;&nbsp;&nbsp;&nbsp;保存旧值：$y_i \leftarrow x_i$（用于收敛判断）
4. &nbsp;&nbsp;&nbsp;&nbsp;**for** $i = 1, 2, \dots, n$ **do**
5. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow b_i$
6. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**for** $j = 1, 2, \dots, i-1$ **do**  $\quad$// 使用当前步新值
7. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i - a_{ij} \cdot x_j$
8. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**end for**
9. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**for** $j = i+1, i+2, \dots, n$ **do**  $\quad$// 使用上一步旧值
10. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i - a_{ij} \cdot y_j$
11. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**end for**
12. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i / a_{ii}$
13. &nbsp;&nbsp;&nbsp;&nbsp;**end for**
14. &nbsp;&nbsp;&nbsp;&nbsp;**if** $\|\mathbf{x} - \mathbf{y}\|_2 < \varepsilon$ **then**
15. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Exit**
16. &nbsp;&nbsp;&nbsp;&nbsp;**end if**
17. &nbsp;&nbsp;&nbsp;&nbsp;$k \leftarrow k + 1$
18. **end while**

**注**：

- Gauss-Seidel 通常比 Jacobi 收敛更快（见下表数值实验）
- 但 Jacobi 更适合并行计算（所有分量可同时更新），而 Gauss-Seidel 本质上是串行的

| 矩阵大小 $n$ | Jacobi 迭代步数 | Gauss-Seidel 迭代步数 | 加速比 |
|:---:|:---:|:---:|:---:|
| 200 | 66 | 14 | ~4.7× |
| 800 | 72 | 14 | ~5.1× |
| 3200 | 74 | 15 | ~4.9× |

---

## 松弛法（Successive Over-Relaxation, SOR）

### 迭代格式推导

Gauss-Seidel 的更新可看作在当前解 $\mathbf{x}^{(k)}$ 上加上一个修正量：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \Delta\mathbf{x}, \quad \text{其中} \quad \Delta\mathbf{x} = \mathbf{D}^{-1}[\mathbf{L}\mathbf{x}^{(k+1)} + \mathbf{U}\mathbf{x}^{(k)} + \mathbf{b} - \mathbf{D}\mathbf{x}^{(k)}]
$$

**松弛法思想**：引入松弛因子 $\omega$ 对修正量进行加权：
$$
\mathbf{x}^{(k+1)} = \mathbf{x}^{(k)} + \omega \Delta\mathbf{x}
$$

整理得 **SOR 迭代格式**：
$$
(\mathbf{D} - \omega\mathbf{L})\mathbf{x}^{(k+1)} = [(1-\omega)\mathbf{D} + \omega\mathbf{U}]\mathbf{x}^{(k)} + \omega\mathbf{b}
$$

即：
$$
\mathbf{x}^{(k+1)} = (\mathbf{D}-\omega\mathbf{L})^{-1}[(1-\omega)\mathbf{D} + \omega\mathbf{U}]\mathbf{x}^{(k)} + \omega(\mathbf{D}-\omega\mathbf{L})^{-1}\mathbf{b}
$$

**分量形式**（实用计算式）：
$$
x_i^{(k+1)} = (1-\omega)x_i^{(k)} + \frac{\omega}{a_{ii}}\left(b_i - \sum_{j=1}^{i-1} a_{ij}x_j^{(k+1)} - \sum_{j=i+1}^{n} a_{ij}x_j^{(k)}\right)
$$

**注**：

- $\omega = 1$：退化为 Gauss-Seidel 方法
- $0 < \omega < 1$：**低松弛法**（亚松弛），常用于非正定系统或震荡情况
- $1 < \omega < 2$：**超松弛法**（SOR），用于加速收敛
- $\omega \geq 2$ 或 $\omega \leq 0$：通常不收敛（对正定矩阵）

### 算法流程（Algorithm 5.3）

**输入**：增加松弛因子 $\omega$  
**输出**：近似解 $\mathbf{x}$

1. 令 $k = 0$
2. **while** $k < N$ **do**
3. &nbsp;&nbsp;&nbsp;&nbsp;保存旧值：$y_i \leftarrow x_i$
4. &nbsp;&nbsp;&nbsp;&nbsp;**for** $i = 1, 2, \dots, n$ **do**
5. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow \omega \cdot b_i$
6. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**for** $j = 1, 2, \dots, i-1$ **do**
7. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i - \omega \cdot a_{ij} \cdot x_j$
8. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**end for**
9. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i + (1-\omega) \cdot a_{ii} \cdot y_i$  $\quad$// 保留旧值部分
10. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**for** $j = i+1, i+2, \dots, n$ **do**
11. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i - \omega \cdot a_{ij} \cdot y_j$
12. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**end for**
13. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$x_i \leftarrow x_i / a_{ii}$
14. &nbsp;&nbsp;&nbsp;&nbsp;**end for**
15. &nbsp;&nbsp;&nbsp;&nbsp;**if** $\|\mathbf{x} - \mathbf{y}\|_2 < \varepsilon$ **then**
16. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Exit**
17. &nbsp;&nbsp;&nbsp;&nbsp;**end if**
18. &nbsp;&nbsp;&nbsp;&nbsp;$k \leftarrow k + 1$
19. **end while**

### 松弛因子的选择（数值实验）

下表展示了不同 $\omega$ 对收敛步数的影响（相同精度要求）：

| 松弛因子 $\omega$ | $n=200$ 步数 | $n=3200$ 步数 | 备注 |
|:---:|:---:|:---:|:---|
| 0.8 | 16 | 17 | 亚松弛，收敛慢 |
| 0.9 | 12 | 13 | 接近最优 |
| **1.0** | **14** | **15** | Gauss-Seidel |
| 1.1 | 18 | 19 | 超松弛，略慢 |
| 1.2 | 23 | 25 | 超松弛过强 |

**注**：最优松弛因子 $\omega_{\text{opt}}$ 通常介于 0.9-1.5 之间，具体值与矩阵谱性质有关。对于特殊矩阵（如相容次序矩阵），有理论公式计算 $\omega_{\text{opt}}$。

---

## 迭代法的收敛性理论

### 统一迭代格式

三种方法可统一写成：
$$
\mathbf{x}^{(k+1)} = \mathbf{M}\mathbf{x}^{(k)} + \mathbf{g}
$$

| 方法 | 迭代矩阵 $\mathbf{M}$ | 向量 $\mathbf{g}$ |
|:---|:---|:---|
| **Jacobi** | $\mathbf{M}_J = \mathbf{D}^{-1}(\mathbf{D}-\mathbf{A}) = \mathbf{I} - \mathbf{D}^{-1}\mathbf{A}$ | $\mathbf{g}_J = \mathbf{D}^{-1}\mathbf{b}$ |
| **Gauss-Seidel** | $\mathbf{M}_{GS} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}$ | $\mathbf{g}_{GS} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{b}$ |
| **SOR** | $\mathbf{M}_{SOR} = (\mathbf{D}-\omega\mathbf{L})^{-1}[(1-\omega)\mathbf{D} + \omega\mathbf{U}]$ | $\mathbf{g}_{SOR} = \omega(\mathbf{D}-\omega\mathbf{L})^{-1}\mathbf{b}$ |

### 收敛的充要条件

**定义（谱半径）**：矩阵 $\mathbf{A}$ 的谱半径 $\rho(\mathbf{A}) = \max\{|\lambda| : \lambda \text{ 是 } \mathbf{A} \text{ 的特征值}\}$。

**定理 5.3**（基本收敛定理）：  
迭代格式对任意初始向量 $\mathbf{x}^{(0)}$ 都收敛的**充分必要条件**是：
$$
\rho(\mathbf{M}) < 1
$$

**证明思路**：

- 误差传播：$\mathbf{e}^{(k)} = \mathbf{x}^{(k)} - \mathbf{x}^* = \mathbf{M}^k \mathbf{e}^{(0)}$
- $\lim_{k\to\infty} \mathbf{M}^k = \mathbf{0} \iff \rho(\mathbf{M}) < 1$（由 Jordan 标准型可证）

**注**：谱半径越小，收敛越快。

### 收敛的充分条件（实用判定）

由于计算谱半径较困难，常用矩阵范数作为估计：

**定理**：若 $\|\mathbf{M}\| < 1$（对某算子范数），则迭代法收敛。

**注**：这是充分非必要条件。例如 $\mathbf{M} = \begin{bmatrix} 0.9 & 0 \\ 0.3 & 0.8 \end{bmatrix}$，$\|\mathbf{M}\|_1 = 1.2 > 1$，$\|\mathbf{M}\|_\infty = 1.1 > 1$，但 $\rho(\mathbf{M}) = 0.9 < 1$，仍收敛。

### 特殊矩阵的收敛保证

**定义（对角占优）**：矩阵 $\mathbf{A}$ 满足 $|a_{ii}| \geq \sum_{j\neq i} |a_{ij}|$（对所有 $i$），且至少对一个 $i$ 严格不等，则称**对角占优**；若对所有 $i$ 都严格不等，则称**严格对角占优**。

**定义（不可约矩阵）**：若不存在排列矩阵 $\mathbf{P}$ 使得 $\mathbf{P}^T\mathbf{A}\mathbf{P} = \begin{bmatrix} \mathbf{A}_{11} & \mathbf{A}_{12} \\ \mathbf{0} & \mathbf{A}_{22} \end{bmatrix}$（分块上三角），则称 $\mathbf{A}$ 不可约。

**定理 5.6**（充分条件）：  
若 $\mathbf{A}$ **严格对角占优**，或 **不可约且对角占优**，则 Jacobi 和 Gauss-Seidel 迭代对任意 $\mathbf{x}^{(0)}$ 必定收敛。

**注**：

- 这类矩阵常见于偏微分方程离散（如有限差分、有限元）
- 对于 SOR，还需 $0 < \omega < 2$ 才能保证收敛（对正定矩阵）

### 收敛速率分析

**定义（平均收敛速率）**：  
$R_k(\mathbf{M}) = -\frac{1}{k}\ln\|\mathbf{M}^k\|$

**定义（渐进收敛速率）**：  
$R_\infty(\mathbf{M}) = \lim_{k\to\infty} R_k(\mathbf{M}) = -\ln\rho(\mathbf{M})$

**定理 5.7**：  
渐进收敛速率由谱半径唯一确定。为达到误差 $\|\mathbf{e}^{(k)}\| \leq \varepsilon$，所需迭代次数约为：
$$
k \approx \frac{-\ln\varepsilon}{R_\infty(\mathbf{M})} = \frac{-\ln\varepsilon}{-\ln\rho(\mathbf{M})}
$$

**误差估计**（定理 5.4）：  
若 $\|\mathbf{M}\| = q < 1$，则：
$$
\|\mathbf{x}^{(k)} - \mathbf{x}^*\| \leq \frac{q}{1-q}\|\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)}\| \leq \frac{q^k}{1-q}\|\mathbf{x}^{(1)} - \mathbf{x}^{(0)}\|
$$

**实用停机准则**：  
当 $\|\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)}\| < \frac{1-q}{q}\varepsilon$ 时，可保证 $\|\mathbf{x}^{(k)} - \mathbf{x}^*\| < \varepsilon$。

---

## 方法对比与总结

| 特性 | Jacobi | Gauss-Seidel | SOR |
|:---|:---|:---|:---|
| **更新方式** | 同步（并行友好） | 异步（串行） | 异步（串行） |
| **存储需求** | 需存储两个向量 | 可原位存储 | 可原位存储 |
| **每步计算量** | 矩阵-向量乘法 | 类似 | 类似，含 $\omega$ 乘法 |
| **收敛速度** | 慢 | 中等 | 可调（可能最快） |
| **实现难度** | 简单 | 中等 | 中等（需选 $\omega$） |
| **适用场景** | 并行计算 | 通用 | 已知近似最优 $\omega$ |

**选择建议**：

1. **简单实现**：选 Gauss-Seidel（通常比 Jacobi 快）
2. **极致性能**：尝试 SOR，但需花时间寻找最优 $\omega$（可通过试算几个 $\omega$ 值比较收敛步数）
3. **并行环境**：Jacobi 天然适合 GPU/多核并行
4. **保证收敛**：检查矩阵是否对角占优或对称正定（SPD）

**注**：对于对称正定矩阵，共轭梯度法（CG）通常比 SOR 更高效，这是下一讲的内容。
