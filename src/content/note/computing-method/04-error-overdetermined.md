---
title: '解线性方程组的直接法（误差分析、超定方程组）'
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

## 误差分析

### 引言：从舍入误差到病态问题

在计算机中，实数以二进制浮点数表示，存在**舍入误差**（如 $0.3$ 为无限循环二进制小数）。对于线性方程组 $\mathbf{A}\mathbf{x}=\mathbf{b}$，输入计算机后，系数矩阵 $\mathbf{A}$ 和右端项 $\mathbf{b}$ 都会产生扰动 $\delta\mathbf{A}$ 和 $\delta\mathbf{b}$，导致解产生扰动 $\delta\mathbf{x}$。

**实际处理的方程：**
$$(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}+\delta\mathbf{b}$$

**病态与良态的定义：**

- **病态方程组**：$\mathbf{A}$ 或 $\mathbf{b}$ 的微小扰动引起解 $\mathbf{x}$ 的巨大变化
- **良态方程组**：扰动对解的影响与扰动同量级
- **病态矩阵/良态矩阵**：对应系数矩阵的性质

> **注：直观理解**  
> 病态问题类似于"站在陡峭的山脊上"——水平方向（输入）的微小移动会导致垂直方向（输出）的巨大落差。几何上，病态方程组的"解空间"对参数变化极度敏感。

**例题 4.1（病态现象）：**
$$\begin{bmatrix} 1 & 1 \\ 1 & 1.0001 \end{bmatrix}\begin{bmatrix} x_1 \\ x_2 \end{bmatrix} = \begin{bmatrix} 2 \\ 2 \end{bmatrix}$$
原解为 $\mathbf{x}=[2,0]^T$。当右端项微扰 $\delta\mathbf{b}=[0,0.0001]^T$ 时，新解变为 $[1,1]^T$，相对误差高达 $50\%$ 以上，而输入相对误差仅为 $0.005\%$。

---

### 向量范数（Vector Norms）

为量化误差大小，需引入**范数**作为"长度"的推广。

**定义 4.1（向量范数）：**  
映射 $\|\cdot\|:\mathbb{R}^n\to\mathbb{R}$ 满足：

1. **正定性**：$\|\mathbf{x}\|\geq 0$，且 $\|\mathbf{x}\|=0 \Leftrightarrow \mathbf{x}=\mathbf{0}$
2. **齐次性**：$\|\alpha\mathbf{x}\| = |\alpha|\|\mathbf{x}\|$，$\forall \alpha\in\mathbb{R}$
3. **三角不等式**：$\|\mathbf{x}+\mathbf{y}\| \leq \|\mathbf{x}\|+\|\mathbf{y}\|$

> **注：三角不等式的重要性**  
>
> - 保证极限唯一性：若 $\mathbf{x}_n\to\mathbf{a}$ 且 $\mathbf{x}_n\to\mathbf{b}$，则 $\|\mathbf{a}-\mathbf{b}\|\leq \|\mathbf{x}_n-\mathbf{a}\|+\|\mathbf{x}_n-\mathbf{b}\|\to 0$，故 $\mathbf{a}=\mathbf{b}$
> - 保证连续性：线性运算在范数拓扑下连续

**常用范数（$p$-范数族）：**

| 范数名称 | 记号 | 表达式 | 几何意义 |
|:---:|:---:|:---:|:---:|
| 1-范数 | $\|\mathbf{x}\|_1$ | $\sum_{i=1}^n |x_i|$ | 曼哈顿距离 |
| 2-范数 | $\|\mathbf{x}\|_2$ | $\sqrt{\sum_{i=1}^n x_i^2} = \sqrt{\mathbf{x}^T\mathbf{x}}$ | 欧几里得距离 |
| $\infty$-范数 | $\|\mathbf{x}\|_\infty$ | $\max_{1\leq i\leq n} |x_i|$ | 最大分量幅度 |
| $p$-范数 | $\|\mathbf{x}\|_p$ | $\left(\sum_{i=1}^n |x_i|^p\right)^{1/p}$ | 统一框架 |

**范数等价性（定理 4.1）：**  
$\mathbb{R}^n$ 上任意两个范数等价，即存在 $a,b>0$ 使得：
$$a\|\mathbf{x}\|_1 \leq \|\mathbf{x}\|_2 \leq b\|\mathbf{x}\|_1$$

具体关系：
$$\|\mathbf{x}\|_2 \leq \|\mathbf{x}\|_1 \leq \sqrt{n}\|\mathbf{x}\|_2$$
$$\|\mathbf{x}\|_\infty \leq \|\mathbf{x}\|_2 \leq \sqrt{n}\|\mathbf{x}\|_\infty$$
$$\|\mathbf{x}\|_\infty \leq \|\mathbf{x}\|_1 \leq n\|\mathbf{x}\|_\infty$$

> **注：等价性的意义**  
> 序列收敛性不依赖于具体范数选择。在数值分析中，可根据计算便利选择范数（如 $\infty$-范数易计算，2-范数有几何直观）。

---

### 矩阵范数（Matrix Norms）

**定义 4.4（矩阵范数）：**  
映射 $\|\cdot\|:\mathbb{R}^{n\times n}\to\mathbb{R}$ 满足：

1. **正定性**：$\|\mathbf{A}\|\geq 0$，且 $\|\mathbf{A}\|=0 \Leftrightarrow \mathbf{A}=\mathbf{0}$
2. **齐次性**：$\|\alpha\mathbf{A}\| = |\alpha|\|\mathbf{A}\|$
3. **三角不等式**：$\|\mathbf{A}+\mathbf{B}\| \leq \|\mathbf{A}\|+\|\mathbf{B}\|$
4. **相容性（次可乘性）**：$\|\mathbf{AB}\| \leq \|\mathbf{A}\|\|\mathbf{B}\|$

> **注：相容性的必要性**  
> 矩阵乘法对应线性变换的复合，相容性保证"复合变换的放大率不超过各变换放大率的乘积"。反例：$f(\mathbf{A})=\max_{i,j}|a_{ij}|$ 不满足相容性（如 $\mathbf{A}=\mathbf{B}=\begin{bmatrix}1&1\\1&1\end{bmatrix}$ 时，$f(\mathbf{AB})=2>f(\mathbf{A})f(\mathbf{B})=1$）。

**常用矩阵范数：**

| 范数名称 | 记号 | 计算公式 | 计算方法 |
|:---:|:---:|:---:|:---:|
| 1-范数（列和范数） | $\|\mathbf{A}\|_1$ | $\max_{1\leq j\leq n} \sum_{i=1}^n |a_{ij}|$ | 每列绝对值之和的最大值 |
| 2-范数（谱范数） | $\|\mathbf{A}\|_2$ | $\sqrt{\lambda_{\max}(\mathbf{A}^T\mathbf{A})} = \sqrt{\rho(\mathbf{A}^T\mathbf{A})}$ | $\mathbf{A}^T\mathbf{A}$ 最大特征值平方根 |
| $\infty$-范数（行和范数） | $\|\mathbf{A}\|_\infty$ | $\max_{1\leq i\leq n} \sum_{j=1}^n |a_{ij}|$ | 每行绝对值之和的最大值 |
| F-范数（Frobenius） | $\|\mathbf{A}\|_F$ | $\sqrt{\sum_{i,j=1}^n a_{ij}^2} = \sqrt{\text{tr}(\mathbf{A}^T\mathbf{A})}$ | 元素平方和开根号 |

**诱导范数（算子范数）：**  
由向量范数诱导（定理 4.2）：
$$\|\mathbf{A}\| \equiv \max_{\mathbf{x}\neq\mathbf{0}} \frac{\|\mathbf{Ax}\|}{\|\mathbf{x}\|} = \max_{\|\mathbf{x}\|=1} \|\mathbf{Ax}\|$$

**谱半径（Spectral Radius）：**
$$\rho(\mathbf{A}) = \max_{1\leq i\leq n} |\lambda_i|$$

**关键定理：**

- **定理 4.3**：诱导范数与向量范数相容：$\|\mathbf{Ax}\| \leq \|\mathbf{A}\|\|\mathbf{x}\|$
- **定理 4.4**：对任意矩阵范数，$\rho(\mathbf{A}) \leq \|\mathbf{A}\|$

---

### 误差分析：条件数的推导

#### 右端项扰动分析

扰动方程：$\mathbf{A}(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}+\delta\mathbf{b}$

推导步骤：

1. 由原方程 $\mathbf{Ax}=\mathbf{b}$，得 $\mathbf{A}\delta\mathbf{x} = \delta\mathbf{b}$
2. 两边取范数：$\|\delta\mathbf{x}\| = \|\mathbf{A}^{-1}\delta\mathbf{b}\| \leq \|\mathbf{A}^{-1}\|\|\delta\mathbf{b}\|$
3. 由原方程：$\|\mathbf{b}\| = \|\mathbf{Ax}\| \leq \|\mathbf{A}\|\|\mathbf{x}\|$，故 $\frac{1}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}\|}{\|\mathbf{b}\|}$

**误差估计：**
$$\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \|\mathbf{A}\|\|\mathbf{A}^{-1}\| \frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}$$

> **解读**：解的相对误差不超过右端项相对误差的 $\|\mathbf{A}\|\|\mathbf{A}^{-1}\|$ 倍。

#### 系数矩阵扰动分析

扰动方程：$(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}$

推导步骤：

1. 展开并忽略二阶小量 $\delta\mathbf{A}\delta\mathbf{x}$：
   $$\mathbf{A}\delta\mathbf{x} \approx -\delta\mathbf{A}\mathbf{x}$$
   （严格推导应保留二阶项后移项处理）

2. 完整推导：
   $$\delta\mathbf{x} = -\mathbf{A}^{-1}\delta\mathbf{A}\mathbf{x} - \mathbf{A}^{-1}\delta\mathbf{A}\delta\mathbf{x}$$

3. 取范数并利用三角不等式：
   $$\|\delta\mathbf{x}\| \leq \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\mathbf{x}\| + \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\delta\mathbf{x}\|$$

4. 假设 $\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\| < 1$（小扰动），整理得：
   $$\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|}{1-\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|} = \frac{\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}{1-\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}$$

---

### 条件数（Condition Number）

**定义 4.6：**
$$\text{Cond}(\mathbf{A}) \equiv \|\mathbf{A}\|\|\mathbf{A}^{-1}\|$$
特别地，$\text{Cond}(\mathbf{A})_p = \|\mathbf{A}\|_p\|\mathbf{A}^{-1}\|_p$（$p=1,2,\infty$）

**综合误差估计（定理 4.5）：**  
当 $\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\| < 1$ 时：
$$\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \frac{\text{Cond}(\mathbf{A})}{1-\text{Cond}(\mathbf{A})\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}} \left(\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} + \frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}\right)$$

**条件数的性质：**

1. **下界**：$\text{Cond}(\mathbf{A}) \geq 1$（因为 $\|\mathbf{I}\| = \|\mathbf{AA}^{-1}\| \leq \|\mathbf{A}\|\|\mathbf{A}^{-1}\|$）
2. **正交矩阵**：若 $\mathbf{A}$ 正交，则 $\text{Cond}(\mathbf{A})_2 = 1$（最良态）
3. **齐次性**：$\text{Cond}(\alpha\mathbf{A}) = \text{Cond}(\mathbf{A})$，$\forall \alpha\neq 0$
4. **谱条件数**：$\text{Cond}(\mathbf{A})_2 = \sqrt{\frac{\lambda_{\max}(\mathbf{A}^T\mathbf{A})}{\lambda_{\min}(\mathbf{A}^T\mathbf{A})}} = \frac{\sigma_{\max}}{\sigma_{\min}}$（最大与最小奇异值之比）
5. **范数等价性**：
   $$\frac{1}{n}\text{Cond}(\mathbf{A})_2 \leq \text{Cond}(\mathbf{A})_1 \leq n\cdot\text{Cond}(\mathbf{A})_2$$
   （其他范数间类似）

> **注：行列式与条件数的关系**  
> 行列式大小**不能**反映病态程度！
>
> - 反例1：$\mathbf{B}=\begin{bmatrix}1&-1&\cdots&-1\\0&1&\cdots&-1\\\vdots&\vdots&\ddots&\vdots\\0&0&\cdots&1\end{bmatrix}$，$\det(\mathbf{B})=1$，但 $\text{Cond}(\mathbf{B})_\infty = n2^{n-1}$（随 $n$ 指数增长，严重病态）
> - 反例2：$\mathbf{C}=\text{diag}\{10^{-1},\dots,10^{-1}\}$，$\det(\mathbf{C})=10^{-n}$ 很小，但 $\text{Cond}(\mathbf{C})=1$（良态）

---

### 条件数的估计与几何意义

#### 估计方法

直接计算 $\|\mathbf{A}^{-1}\|$ 成本为 $\mathcal{O}(n^3)$（已接近求解成本），实际中通过求解线性方程组 $\mathbf{Ay}=\mathbf{d}$ 估计：
$$\|\mathbf{A}^{-1}\| \geq \frac{\|\mathbf{y}\|}{\|\mathbf{d}\|}$$
选择适当的 $\mathbf{d}$（如使 $\|\mathbf{y}\|$ 尽可能大）来逼近 $\|\mathbf{A}^{-1}\|$。

#### 几何解释（条件数的再思考）

**定理 4.6：**  
设 $\mathbf{A}$ 可逆，$\mathcal{S}=\{\mathbf{M}\in\mathbb{R}^{n\times n}|\det(\mathbf{M})=0\}$ 为奇异矩阵集合，则：
$$\frac{1}{\text{Cond}(\mathbf{A})} = \min_{\mathbf{A}+\delta\mathbf{A}\in\mathcal{S}} \frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}$$

> **注：深刻含义**  
>
> - **条件数的倒数** = **矩阵到最近奇异矩阵的相对距离**
> - 病态矩阵 $\Leftrightarrow$ 距离奇异矩阵"很近"（相对意义下）
> - 良态矩阵 $\Leftrightarrow$ 与所有奇异矩阵保持"安全距离"
> - 这解释了为何病态问题难以求解：数值计算中的舍入误差可能"推动"矩阵穿越奇异边界

---

## 超定方程组（Overdetermined Systems）

### 问题描述

当方程数 $m$ 大于未知数 $n$ 时（$m>n$），线性方程组 $\mathbf{A}\mathbf{x}=\mathbf{b}$（$\mathbf{A}\in\mathbb{R}^{m\times n}$）通常**无精确解**（因实际数据含误差或模型过参数化）。

**转向优化问题：**  
寻找 $\mathbf{x}$ 使余量（残差）$\mathbf{r}=\mathbf{b}-\mathbf{A}\mathbf{x}$ 在某种意义下最小。

### 最小二乘法（Least Squares）

**目标函数（2-范数平方）：**
$$F(\mathbf{x}) = \mathbf{r}^T\mathbf{r} = \|\mathbf{b}-\mathbf{A}\mathbf{x}\|_2^2 = \sum_{i=1}^m \left(b_i - \sum_{j=1}^n a_{ij}x_j\right)^2$$

**几何意义：**  
寻找 $\mathbf{x}$ 使得 $\mathbf{A}\mathbf{x}$ 是 $\mathbf{b}$ 在 $\mathbf{A}$ 的列空间 $\mathcal{R}(\mathbf{A})$ 上的**正交投影**。

> **注：为什么用2-范数？**  
>
> 1. **解析可解**：导出线性方程组（正规方程）
> 2. **统计解释**：在高斯-马尔可夫假设下（误差独立同分布、零均值、等方差），最小二乘估计等价于最大似然估计
> 3. **几何直观**：对应欧几里得空间中的"垂直距离"最小化

### 正规方程（Normal Equations）

**求极值：**  
对 $F(\mathbf{x}) = (\mathbf{b}-\mathbf{A}\mathbf{x})^T(\mathbf{b}-\mathbf{A}\mathbf{x})$ 求梯度并令为零：

$$\frac{\partial F}{\partial \mathbf{x}} = 2\mathbf{A}^T(\mathbf{A}\mathbf{x}-\mathbf{b}) = \mathbf{0}$$

**正规方程：**
$$\mathbf{A}^T\mathbf{A}\mathbf{x} = \mathbf{A}^T\mathbf{b}$$

**解的存在性与唯一性：**

- $\mathbf{A}^T\mathbf{A}\in\mathbb{R}^{n\times n}$ 为对称矩阵
- 若 $\text{rank}(\mathbf{A})=n$（列满秩），则 $\mathbf{A}^T\mathbf{A}$ **对称正定**，存在唯一解：
  $$\mathbf{x} = (\mathbf{A}^T\mathbf{A})^{-1}\mathbf{A}^T\mathbf{b}$$

> **注：计算考量**  
>
> - 直接求解正规方程会将条件数平方：$\text{Cond}(\mathbf{A}^T\mathbf{A})_2 = [\text{Cond}(\mathbf{A})_2]^2$，可能引入数值不稳定性
> - 实际计算中，QR分解或SVD是更稳定的算法，但正规方程在理论分析中非常重要

---

## 知识体系总结

| 概念 | 核心公式 | 关键性质 | 数值意义 |
|:---:|:---:|:---:|:---:|
| **向量范数** | $\|\mathbf{x}\|_p = (\sum\|x_i\|^p)^{1/p}$ | 正定性、齐次性、三角不等式 | 度量误差大小 |
| **矩阵范数** | $\|\mathbf{A}\| = \max_{\|\mathbf{x}\|=1}\|\mathbf{Ax}\|$ | 相容性：$\|\mathbf{AB}\|\leq\|\mathbf{A}\|\|\mathbf{B}\|$ | 度量矩阵"放大率" |
| **条件数** | $\text{Cond}(\mathbf{A}) = \|\mathbf{A}\|\|\mathbf{A}^{-1}\|$ | $\geq 1$；正交矩阵=1；衡量到奇异矩阵距离 | 决定误差放大倍数 |
| **误差界** | $\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \lesssim \text{Cond}(\mathbf{A})\left(\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} + \frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}\right)$ | 条件数直接控制相对误差放大 | 评估解的可信度 |
| **最小二乘** | $\min\|\mathbf{b}-\mathbf{A}\mathbf{x}\|_2^2$ | 解满足正规方程 $\mathbf{A}^T\mathbf{A}\mathbf{x}=\mathbf{A}^T\mathbf{b}$ | 超定系统的最优解 |

**病态 vs 良态快速判断：**

- 计算 $\text{Cond}(\mathbf{A})$：
  - $1 \sim 10^3$：良态
  - $10^3 \sim 10^7$：中等病态
  - $> 10^7$：严重病态（可能失去精度）

**学习要点：**

1. 范数是误差分析的"语言"，掌握等价性可在不同范数间转换
2. 条件数是核心指标，反映问题的固有敏感性，与算法无关
3. 最小二乘将不相容方程转化为优化问题，正规方程提供了理论解
4. 实际计算中，条件数大的矩阵需谨慎处理（可采用预条件、高精度计算或正则化方法）
