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

## 引入

在计算机中，实数表示存在**舍入误差**。
对于线性方程组 $\mathbf{A}\mathbf{x}=\mathbf{b}$，输入计算机后，
系数矩阵 $\mathbf{A}$ 和右端项 $\mathbf{b}$ 都会产生扰动 $\delta\mathbf{A}$ 和 $\delta\mathbf{b}$，导致解产生扰动 $\delta\mathbf{x}$。

**实际处理的方程**：
$$
(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}+\delta\mathbf{b}
$$

**病态与良态的定义**：

- **病态方程组**：$\mathbf{A}$ 或 $\mathbf{b}$ 的微小扰动引起解 $\mathbf{x}$ 的巨大变化
- **良态方程组**：扰动对解的影响与扰动同量级
- **病态矩阵/良态矩阵**：对应系数矩阵的性质

**例（病态现象）**：
$$
\begin{bmatrix} 1 & 1 \\ 1 & 1.0001 \end{bmatrix}\begin{bmatrix} x_1 \\ x_2 \end{bmatrix} = \begin{bmatrix} 2 \\ 2 \end{bmatrix}
$$
原解为 $\mathbf{x}=[2,0]^T$。当右端项微扰 $\delta\mathbf{b}=[0,0.0001]^T$ 时，新解变为 $[1,1]^T$，相对误差高达 $50\%$ 以上，而输入相对误差仅为 $0.005\%$。

---

## 向量范数

为量化误差大小，需引入**范数**。

### 定义：向量范数

映射 $\|\cdot\|:\mathbb{R}^n\to\mathbb{R}$ 满足：

1. **正定性**：$\|\mathbf{x}\|\geq 0$，且 $\|\mathbf{x}\|=0 \Leftrightarrow \mathbf{x}=\mathbf{0}$
2. **齐次性**：$\|\alpha\mathbf{x}\| = |\alpha|\|\mathbf{x}\|$，$\forall \alpha\in\mathbb{R}$
3. **三角不等式**：$\|\mathbf{x}+\mathbf{y}\| \leq \|\mathbf{x}\|+\|\mathbf{y}\|$

**注（三角不等式的重要性）**：

- 保证极限唯一性：
  若 $\mathbf{x}_n\to\mathbf{a}$ 且 $\mathbf{x}_n\to\mathbf{b}$，
  则 $\|\mathbf{a}-\mathbf{b}\|\leq \|\mathbf{x}_n-\mathbf{a}\|+\|\mathbf{x}_n-\mathbf{b}\|\to 0$，故 $\mathbf{a}=\mathbf{b}$
- 保证连续性：线性运算在范数拓扑下连续

### 常用向量范数

$p$-范数族。

| 范数名称 | 记号 | 表达式 | 几何意义 |
| :---: | :---: | :---: | :---: |
| 1-范数 | $\|\mathbf{x}\|_1$ | $\sum_{i=1}^n \vert x_i\vert$ | 曼哈顿距离 |
| 2-范数 | $\|\mathbf{x}\|_2$ | $\sqrt{\sum_{i=1}^n x_i^2} = \sqrt{\mathbf{x}^T\mathbf{x}}$ | 欧几里得距离 |
| $\infty$-范数 | $\|\mathbf{x}\|_\infty$ | $\max_{1\leq i\leq n} \vert x_i\vert$ | 最大分量幅度 |
| $p$-范数 | $\|\mathbf{x}\|_p$ | $\left(\sum_{i=1}^n \vert x_i\vert ^p\right)^{1/p}$ | 统一框架 |

### 向量范数的等价性

$\mathbb{R}^n$ 上任意两个范数等价，即存在 $a,b>0$ 使得：
$$
a\|\mathbf{x}\|_p \leq \|\mathbf{x}\|_q \leq b\|\mathbf{x}\|_p
$$

具体关系：
$$
\|\mathbf{x}\|_2 \leq \|\mathbf{x}\|_1 \leq \sqrt{n}\|\mathbf{x}\|_2
$$
$$
\|\mathbf{x}\|_\infty \leq \|\mathbf{x}\|_2 \leq \sqrt{n}\|\mathbf{x}\|_\infty
$$
$$
\|\mathbf{x}\|_\infty \leq \|\mathbf{x}\|_1 \leq n\|\mathbf{x}\|_\infty
$$

**注（等价性的意义）**：  
序列收敛性不依赖于具体范数选择。在数值分析中，可根据计算便利选择范数（如 $\infty$-范数易计算，2-范数有几何直观）。

### 向量范数的可逆变换

设 $\|\cdot\|$ 是 $\mathbb{R}^n$ 上的一个向量范数，$\mathbf{M} \in \mathbb{R}^{n \times n}$ 可逆，则如下定义的映射：

$$
\|\mathbf{x}\|_{\mathbf{M}} := \|\mathbf{M}^{-1}\mathbf{x}\|
$$

也是 $\mathbb{R}^n$ 上的范数。

**证明**：

1. **正定性**：
   $\|\mathbf{x}\|_{\mathbf{M}} \geq 0$ 显然。

   若 $\|\mathbf{x}\|_{\mathbf{M}} = 0$，则
   $$
   \|\mathbf{M}^{-1}\mathbf{x}\| = 0
   \Rightarrow \mathbf{M}^{-1}\mathbf{x} = \mathbf{0}
   \Rightarrow \mathbf{x} = \mathbf{0}
   $$
2. **齐次性**：
   $$
   \|\alpha\mathbf{x}\|_{\mathbf{M}}
   = \|\mathbf{M}^{-1}(\alpha\mathbf{x})\|
   = |\alpha| \cdot \|\mathbf{M}^{-1}\mathbf{x}\|
   = |\alpha| \cdot \|\mathbf{x}\|_{\mathbf{M}}
   $$
3. **三角不等式**：
   $$
   \begin{aligned}
   \|\mathbf{x}+\mathbf{y}\|_{\mathbf{M}}
   &= \|\mathbf{M}^{-1}\mathbf{x} + \mathbf{M}^{-1}\mathbf{y}\| \\
   &\leq \|\mathbf{M}^{-1}\mathbf{x}\| + \|\mathbf{M}^{-1}\mathbf{y}\| \\
   &= \|\mathbf{x}\|_{\mathbf{M}} + \|\mathbf{y}\|_{\mathbf{M}}
   \end{aligned}
   $$

**几何直观**：

原范数 $\|\cdot\|$ 的单位球是 $\{\mathbf{x} : \|\mathbf{x}\| \leq 1\}$，经 $\mathbf{M}^{-1}$ 变换后得到：
$$
\{\mathbf{M}^{-1}\mathbf{x} : \|\mathbf{x}\| \leq 1\} = \{\mathbf{y} : \|\mathbf{M}\mathbf{y}\| \leq 1\}
$$
这正是新范数 $\|\cdot\|_{\mathbf{M}}$ 的单位球。可逆线性变换将凸对称体映为凸对称体，因此保持范数结构。

**应用**：常通过可逆变换将复杂范数转化为简单范数（如 $\|\cdot\|_\infty$）进行估计。例如[范数逼近引理](/note/computing-method/05-iterative-method-for-linear-system-1/#两个引理)中的构造。

---

## 矩阵范数

### 定义：矩阵范数

映射 $\|\cdot\|:\mathbb{R}^{n\times n}\to\mathbb{R}$ 满足：

1. **正定性**：$\|\mathbf{A}\|\geq 0$，且 $\|\mathbf{A}\|=0 \Leftrightarrow \mathbf{A}=\mathbf{0}$
2. **齐次性**：$\|\alpha\mathbf{A}\| = |\alpha|\|\mathbf{A}\|$
3. **三角不等式**：$\|\mathbf{A}+\mathbf{B}\| \leq \|\mathbf{A}\|+\|\mathbf{B}\|$
4. **相容性（次可乘性）**：$\|\mathbf{AB}\| \leq \|\mathbf{A}\|\|\mathbf{B}\|$

**注（相容性的必要性）**：

- 矩阵乘法对应线性变换的复合，相容性保证复合变换的**放大率**不超过各变换放大率的乘积。
- 反例：
  $f(\mathbf{A})=\max_{i,j}|a_{ij}|$ 不满足相容性。如 $\mathbf{A}=\mathbf{B}=\begin{bmatrix}1&1\\1&1\end{bmatrix}$ 时，$f(\mathbf{AB})=2>f(\mathbf{A})f(\mathbf{B})=1$。

**向量范数与矩阵范数相容**：

若对 $\forall \mathbf{A} \in \mathbf{R}^{n \times n}$ 与 $\forall \mathbf{x} \in \mathbf{R}^n$，都有：
$$
\| \mathbf{A} \mathbf{x} \| \le \| \mathbf{A} \| \| \mathbf{x} \|
$$
则称式中的向量范数和矩阵范数相容。

<a name="vector-norm-and-matrix-norm"></a>
**注（矩阵与向量范数相容）**：

不是任意向量范数与任意矩阵范数都相容的。但是我们可以做到：

- 对任意向量范数，构造一个矩阵范数与之相容。这由下文的诱导范数是显然的。
- 对任意矩阵范数，构造一个向量范数与之相容。这是因为给定矩阵范数 $\|\cdot\|$，定义向量范数如下：
   $$
   \|\mathbf{x}\| := \|\mathbf{x}\mathbf{u}^T\|
   $$
   其中 $\mathbf{u}$ 是任意一个固定的非零向量。
   则利用矩阵运算的线性性和矩阵范数的正定性、齐次性、三角不等式可以轻松导出该准向量范数的正定性、齐次性、三角不等式。

### 常用矩阵范数

| 范数名称 | 记号 | 计算公式 | 计算方法 |
| :---: | :---: | :---: | :---: |
| 1-范数（列和范数） | $\|\mathbf{A}\|_1$ | $\max_{1\leq j\leq n} \sum_{i=1}^n \vert a_{ij}\vert$ | 每列绝对值之和的最大值 |
| 2-范数（谱范数） | $\|\mathbf{A}\|_2$ | $\sqrt{\lambda_{\max}(\mathbf{A}^T\mathbf{A})} = \sqrt{\rho(\mathbf{A}^T\mathbf{A})} = \sigma_{\max}$ | $\mathbf{A}^T\mathbf{A}$ 最大特征值平方根，也即 $\mathbf{A}$ 的最大奇异值 |
| $\infty$-范数（行和范数） | $\|\mathbf{A}\|_\infty$ | $\max_{1\leq i\leq n} \sum_{j=1}^n \vert a_{ij}\vert$ | 每行绝对值之和的最大值 |
| F-范数（Frobenius） | $\|\mathbf{A}\|_F$ | $\sqrt{\sum_{i,j=1}^n a_{ij}^2} = \sqrt{\text{tr}(\mathbf{A}^T\mathbf{A})}$ | 元素平方和开根号 |

### 诱导范数

由向量范数 $\|\cdot\|$ 诱导的：
$$
\|\mathbf{A}\| \equiv \max_{\mathbf{x}\neq\mathbf{0}} \frac{\|\mathbf{Ax}\|}{\|\mathbf{x}\|} = \max_{\|\mathbf{x}\|=1} \|\mathbf{Ax}\|
$$
是一个矩阵范数。

**证明**：

1. **引理**：
   诱导范数和向量范数是相容的，也即
   $$
   \|\mathbf{Ax}\| \leq \|\mathbf{A}\|\|\mathbf{x}\|
   $$

   **引理的证明**：

   若 $\mathbf{x} = \mathbf{0}$，两边均为 0，成立。  
   若 $\mathbf{x} \neq \mathbf{0}$，令 $\mathbf{u} = \frac{\mathbf{x}}{\|\mathbf{x}\|}$，则 $\|\mathbf{u}\| = 1$。由诱导范数定义：
   $$
   \|A\| = \max_{\|\mathbf{y}\|=1} \|A\mathbf{y}\| \ge \|A\mathbf{u}\| = \frac{\|A\mathbf{x}\|}{\|\mathbf{x}\|}
   $$
   两边乘以 $\|\mathbf{x}\|$ 即可。
2. **非负性**：$\|A\| \ge 0$，且 $\|A\| = 0 \iff A = 0$。

   显然，对任意 $\mathbf{x}$，$\|A\mathbf{x}\| \ge 0$，所以 $\|A\| \ge 0$。

   若 $\|A\| = 0$，则对任意 $\mathbf{x} \neq 0$，$\|A\mathbf{x}\| = 0$，也即 $A\mathbf{x} = 0$，从而 $A = 0$。

   若 $A = 0$，则对任意 $\mathbf{x}$，$A\mathbf{x} = 0$，从而 $\|A\| = 0$。
3. **齐次性**：$\|\alpha A\| = |\alpha| \|A\|$。

   $$
   \|\alpha A\| = \max_{\|\mathbf{x}\|=1} \|(\alpha A)\mathbf{x}\|
   = |\alpha| \cdot \max_{\|\mathbf{x}\|=1} \|A\mathbf{x}\| = |\alpha| \|A\|
   $$
4. **三角不等式**：$\|A + B\| \le \|A\| + \|B\|$。

   $$
   \|A + B\| = \max_{\|\mathbf{x}\|=1} \|(A+B)\mathbf{x}\|
   = \max_{\|\mathbf{x}\|=1} \|A\mathbf{x} + B\mathbf{x}\|
   $$
   $$
   \le \max_{\|\mathbf{x}\|=1} \left( \|A\mathbf{x}\| + \|B\mathbf{x}\| \right)
   $$
   $$
   \le \max_{\|\mathbf{x}\|=1} \|A\mathbf{x}\| + \max_{\|\mathbf{x}\|=1} \|B\mathbf{x}\|
   $$
   $$
   = \|A\| + \|B\|
   $$
5. **相容性**：$\|AB\| \le \|A\| \|B\|$。

   设 $AB$ 有定义，对任意 $\|\mathbf{x}\| = 1$，有：
   $$
   \|AB\mathbf{x}\| \le \|A\| \cdot \|B\mathbf{x}\| \le \|A\| \cdot \|B\|
   $$
   从而
   $$
   \|AB\| = \max_{\|\mathbf{x}\|=1} \|AB\mathbf{x}\| \le \|A\| \|B\|
   $$

**注**：
**不是所有矩阵范数都是诱导范数**。事实上，对于诱导范数 $\|\cdot\|$，有：
$$
\|\mathbf{I}_n\| = \max_{\mathbf{x}\neq\mathbf{0}}\frac{\|\mathbf{Ix}\|}{\|\mathbf{x}\|} = 1
$$
这是一个必要条件。但是对于 Frobenius 范数而言，
$$
\|\mathbf{I}_n\|_F = \sqrt{\sum_{i=1}^n\sum_{j=1}^n |a_{ij}|^2} = \sqrt{n}
$$
显然不是诱导范数。

### 常见向量范数的诱导范数

| 向量范数 | 诱导矩阵范数 | 计算公式 | 证明关键 |
| :-------: | :----------: | :--------: | :--------: |
| $\|\cdot\|_1$ | $\|\cdot\|_1$ | $\max_j \sum_i \vert a_{ij}\vert$ | 取标准基向量 |
| $\|\cdot\|_\infty$ | $\|\cdot\|_\infty$ | $\max_i \sum_j \vert a_{ij}\vert$ | 构造符号向量 |
| $\|\cdot\|_2$ | $\|\cdot\|_2$ | $\sigma_{\max}(\mathbf{A})$ | 瑞利商 + 特征值 |

#### 1-范数：最大列和

$$
\|\mathbf{A}\|_1 = \max_{\mathbf{x}\neq\mathbf{0}} \frac{\|\mathbf{Ax}\|_1}{\|\mathbf{x}\|_1}
= \max_{1\leq j\leq n}\sum_{i=1}^m |a_{ij}|
$$

**证明**：

**上界**：
对任意 $\mathbf{x}\neq\mathbf{0}$，
$$
\|\mathbf{Ax}\|_1 = \sum_{i=1}^m\left|\sum_{j=1}^n a_{ij}x_j\right| \leq \sum_{i=1}^m\sum_{j=1}^n|a_{ij}||x_j| = \sum_{j=1}^n|x_j|\sum_{i=1}^m|a_{ij}|
$$

令 $M = \max_j \sum_{i=1}^m|a_{ij}|$，则 $\|\mathbf{Ax}\|_1 \leq M\|\mathbf{x}\|_1$，故 $\|\mathbf{A}\|_1 \leq M$。

**可达**：
设第 $k$ 列达到 $M$，取 $\mathbf{x}=\mathbf{e}_k$，则 $\|\mathbf{x}\|_1=1$，
$$
\|\mathbf{Ax}\|_1 = \sum_{i=1}^m|a_{ik}| = M
$$

故 $\|\mathbf{A}\|_1 = M$。

#### 无穷-范数：最大行和

$$
\|\mathbf{A}\|_\infty = \max_{\mathbf{x}\neq\mathbf{0}} \frac{\|\mathbf{Ax}\|_\infty}{\|\mathbf{x}\|_\infty}
= \max_{1\leq i\leq m}\sum_{j=1}^n |a_{ij}|
$$

**证明**：

**上界**：
对任意 $\mathbf{x}\neq\mathbf{0}$，设 $\|\mathbf{x}\|_\infty = \max_j|x_j|$，则
$$
|(\mathbf{Ax})_i| = \left|\sum_{j=1}^n a_{ij}x_j\right| \leq \sum_{j=1}^n|a_{ij}||x_j| \leq \|\mathbf{x}\|_\infty\sum_{j=1}^n|a_{ij}|
$$

令 $M = \max_i \sum_{j=1}^n|a_{ij}|$，则 $\|\mathbf{Ax}\|_\infty \leq M\|\mathbf{x}\|_\infty$，
故 $\|\mathbf{A}\|_\infty \leq M$。

**可达**：
设第 $k$ 行达到 $M$。构造 $\mathbf{x}$ 使 $x_j = \mathrm{sign}(a_{kj})$，则 $\|\mathbf{x}\|_\infty=1$，且
$$
(\mathbf{Ax})_k = \sum_{j=1}^n a_{kj}\cdot\mathrm{sign}(a_{kj}) = \sum_{j=1}^n|a_{kj}| = M
$$

故 $\|\mathbf{Ax}\|_\infty \geq |(\mathbf{Ax})_k| = M$，即 $\|\mathbf{A}\|_\infty \geq M$。

#### 2-范数：最大奇异值

$$
\|\mathbf{A}\|_2 = \max_{\mathbf{x}\neq\mathbf{0}} \frac{\|\mathbf{Ax}\|_2}{\|\mathbf{x}\|_2} = \sigma_{\max}(\mathbf{A})
= \sqrt{\lambda_{\max}(\mathbf{A}^T\mathbf{A})}
$$

**证明**：

$$
\|\mathbf{A}\|_2^2 = \max_{\mathbf{x}\neq\mathbf{0}}\frac{\|\mathbf{Ax}\|_2^2}{\|\mathbf{x}\|_2^2}
= \max_{\mathbf{x}\neq\mathbf{0}}\frac{\mathbf{x}^T\mathbf{A}^T\mathbf{Ax}}{\mathbf{x}^T\mathbf{x}} = \lambda_{\max}(\mathbf{A}^T\mathbf{A})
$$

最后一个等号是瑞利商（Rayleigh quotient）的性质：对称矩阵 $\mathbf{A}^T\mathbf{A}$ 的瑞利商最大值为最大特征值。

设 $\mathbf{A}^T\mathbf{A}$ 的特征值为 $\lambda_1 \geq \lambda_2 \geq \cdots \geq \lambda_n \geq 0$，对应正交单位特征向量 $\mathbf{v}_1,\ldots,\mathbf{v}_n$。

对任意 $\mathbf{x} = \sum_{j=1}^n c_j\mathbf{v}_j$，
$$
\frac{\mathbf{x}^T\mathbf{A}^T\mathbf{Ax}}{\mathbf{x}^T\mathbf{x}}
= \frac{\sum_{j=1}^n c_j^2\lambda_j}{\sum_{j=1}^n c_j^2} \leq \lambda_1
$$

当 $\mathbf{x}=\mathbf{v}_1$ 时取等。故 $\|\mathbf{A}\|_2 = \sqrt{\lambda_1} = \sigma_{\max}(\mathbf{A})$。

### 矩阵范数的等价性

$\mathbb{R}^{m \times n}$ 上任意两个矩阵范数等价，即存在 $a,b>0$ 使得：
$$
a\|\mathbf{A}\|_p \leq \|\mathbf{A}\|_q \leq b\|\mathbf{A}\|_p
$$

具体关系（常用诱导范数）：
$$
\frac{1}{\sqrt{n}}\|\mathbf{A}\|_\infty \leq \|\mathbf{A}\|_2 \leq \sqrt{m}\|\mathbf{A}\|_\infty
$$
$$
\frac{1}{\sqrt{m}}\|\mathbf{A}\|_1 \leq \|\mathbf{A}\|_2 \leq \sqrt{n}\|\mathbf{A}\|_1
$$
$$
\frac{1}{n}\|\mathbf{A}\|_1 \leq \|\mathbf{A}\|_\infty \leq m\|\mathbf{A}\|_1
$$

Frobenius 范数与诱导范数：
$$
\|\mathbf{A}\|_2 \leq \|\mathbf{A}\|_F \leq \sqrt{\min(m,n)}\|\mathbf{A}\|_2
$$

**注（等价性的意义）**：  
矩阵序列收敛性不依赖于具体范数选择。在数值分析中，可根据计算便利选择范数（如1-范数、$\infty$-范数易计算，2-范数与谱分析直接关联）。

**注（本质）**：
有限维线性空间上，任意两个范数等价。

### 矩阵范数的相似变换

设 $\|\cdot\|_v$ 是 $\mathbb{R}^n$ 上的向量范数，$\|\cdot\|_m$ 是由其诱导的矩阵范数：

$$
\|\mathbf{A}\|_m = \max_{\|\mathbf{x}\|_v = 1} \|\mathbf{A}\mathbf{x}\|_v
$$

对任意可逆矩阵 $\mathbf{M} \in \mathbb{R}^{n \times n}$，定义新的向量范数：

$$
\|\mathbf{x}\|_v' := \|\mathbf{M}^{-1}\mathbf{x}\|_v
$$

则 $\|\cdot\|_v'$ 诱导范数为：

$$
\|\mathbf{A}\|_m' = \|\mathbf{M}^{-1}\mathbf{A}\mathbf{M}\|_m
$$

**证明**：

由诱导范数定义和变量替换 $\mathbf{y} = \mathbf{M}^{-1}\mathbf{x}$：

$$
\begin{aligned}
\|\mathbf{A}\|_m' &= \max_{\|\mathbf{x}\|_v' = 1} \|\mathbf{A}\mathbf{x}\|_v' \\
&= \max_{\|\mathbf{M}^{-1}\mathbf{x}\|_v = 1} \|\mathbf{M}^{-1}\mathbf{A}\mathbf{x}\|_v \\
&= \max_{\|\mathbf{y}\|_v = 1} \|\mathbf{M}^{-1}\mathbf{A}\mathbf{M}\mathbf{y}\|_v \\
&= \|\mathbf{M}^{-1}\mathbf{A}\mathbf{M}\|_m
\end{aligned}
$$

**注**：该性质表明，通过改变坐标系的度量，原矩阵的新范数等价于相似变换后新矩阵的原范数。

**应用**：下一节课的[范数逼近引理](/note/computing-method/05-iterative-method-for-linear-system-1/#两个引理)。

### 谱半径

矩阵 $\mathbf{A}$ 的谱半径定义为：
$$
\rho(\mathbf{A}) = \max_{1\leq i\leq n} |\lambda_i|
$$

**定理**：对任意矩阵范数，$\rho(\mathbf{A}) \leq \|\mathbf{A}\|$

**证明**：

由前述[关于向量范数与矩阵范数相容性的讨论](#vector-norm-and-matrix-norm)，我们可以针对该矩阵范数构造一个与之相容的向量范数。从而对任意特征值 $\lambda$，有：
$$
\|A x\| = \|\lambda x\| = |\lambda| \|x\| \le \|A\| \cdot \|x\|
$$
也即：
$$
|\lambda| \le \|A\|
$$
取最大特征值即得原式。

---

## 条件数

### 定义：条件数

在矩阵范数 $\|\cdot\|$ 下，非奇异方阵 $\mathbf{A} \in \mathbf{R}^{n \times n}$ 的条件数为：
$$
\text{Cond}(\mathbf{A}) \equiv \|\mathbf{A}\|\|\mathbf{A}^{-1}\|
$$
特别地，$\text{Cond}(\mathbf{A})_p = \|\mathbf{A}\|_p\|\mathbf{A}^{-1}\|_p$（$p=1,2,\infty$）

**注（行列式与条件数的关系）**：  
行列式大小**不能**反映病态程度。如：

- $\mathbf{B}=\begin{bmatrix}1&-1&\cdots&-1\\0&1&\cdots&-1\\\vdots&\vdots&\ddots&\vdots\\0&0&\cdots&1\end{bmatrix}$，$\det(\mathbf{B})=1$，
但 $\text{Cond}(\mathbf{B})_\infty = n2^{n-1}$（病态）
- $\mathbf{C}=\text{diag}\{10^{-1},\dots,10^{-1}\}$，$\det(\mathbf{C})=10^{-n}$ 很小，但 $\text{Cond}(\mathbf{C})=1$（良态）

### 条件数的性质

#### 下界

$$
\text{Cond}(\mathbf{A}) \geq 1
$$

**证明**：

因为 $\|\mathbf{I}\|^2 \ge \|\mathbf{I}^2\|$，所以有 $\|\mathbf{I}\| \ge 1$，从而：
$$
\|\mathbf{A}\|\|\mathbf{A}^{-1}\| \ge \|\mathbf{AA}^{-1}\| \ge \|\mathbf{I}\| \ge 1
$$

**注**：只对诱导范数成立 $\text{Cond}(\mathbf{I}) = 1$，一般不一定。

#### 正交矩阵

若 $\mathbf{A}$ 正交，则其谱范数下的条件数：
$$
\text{Cond}(\mathbf{A})_2 = 1
$$

**证明**：显然。

#### 齐次性

$\forall \alpha\neq 0$ 有：
$$
\text{Cond}(\alpha\mathbf{A}) = \text{Cond}(\mathbf{A})
$$

**证明**：显然。

#### 谱条件数

$$
\text{Cond}(\mathbf{A})_2
= \sqrt{\frac{\lambda_{\max}(\mathbf{A}^T\mathbf{A})}{\lambda_{\min}(\mathbf{A}^T\mathbf{A})}} = \frac{\sigma_{\max}}{\sigma_{\min}}
$$

**证明**：

由 SVD 分解：
$$
\mathbf{A} = \mathbf{U}\mathbf{\Sigma}\mathbf{V}^T
$$
其中 $\mathbf{\Sigma} = \mathrm{diag}(\sigma_1, \sigma_2, \ldots, \sigma_n)$，
且 $\sigma_1 \geq \sigma_2 \geq \cdots \geq \sigma_n > 0$。

则：
$$
\mathbf{A}^{-1} = (\mathbf{U}\mathbf{\Sigma}\mathbf{V}^T)^{-1} = \mathbf{V}\mathbf{\Sigma}^{-1}\mathbf{U}^T
$$

故
$$
\|\mathbf{A}^{-1}\|_2 = \|\mathbf{\Sigma}^{-1}\|_2 = \frac{1}{\sigma_n} = \frac{1}{\sigma_{\min}}
$$

代入即证。

#### 条件数等价性

$\mathbb{R}^{n \times n}$ 上的条件数都是等价的，特别地，有：
$$
\frac{1}{n}\text{Cond}_2(\mathbf{A}) \leq \text{Cond}_1(\mathbf{A}) \leq n\,\text{Cond}_2(\mathbf{A})
$$

$$
\frac{1}{n}\text{Cond}_\infty(\mathbf{A}) \leq \text{Cond}_2(\mathbf{A}) \leq n\,\text{Cond}_\infty(\mathbf{A})
$$

$$
\frac{1}{n^2}\text{Cond}_1(\mathbf{A}) \leq \text{Cond}_\infty(\mathbf{A}) \leq n^2\,\text{Cond}_1(\mathbf{A})
$$

**证明**：

由矩阵范数的等价性即证。

### 条件数的估计

直接计算 $\|\mathbf{A}^{-1}\|$ 成本为 $\mathcal{O}(n^3)$，实际中通过求解线性方程组 $\mathbf{Ay}=\mathbf{d}$ 估计：
$$
\|\mathbf{A}^{-1}\| \geq \frac{\|\mathbf{y}\|}{\|\mathbf{d}\|}
$$
选择适当的 $\mathbf{d}$ 使 $\|\mathbf{y}\|$ 尽可能大来逼近 $\|\mathbf{A}^{-1}\|$。

**注**：没太理解为什么不能选择适当的 $\mathbf{y}$ 使 $\|\mathbf{d}\|$ 尽可能小

### 几何意义

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

**证明**：

- **下界**：

设 $\mathbf{A} + \delta\mathbf{A} \in \mathcal{S}$，则存在 $\mathbf{x} \neq \mathbf{0}$ 使得：
$$
(\mathbf{A} + \delta\mathbf{A})\mathbf{x} = \mathbf{0}
$$

也即 $ \mathbf{x} = -\mathbf{A}^{-1}\delta\mathbf{A}\mathbf{x} $. 取范数：
$$
\|\mathbf{x}\| = \|\mathbf{A}^{-1}\delta\mathbf{A}\mathbf{x}\|
\leq \|\mathbf{A}^{-1}\| \cdot \|\delta\mathbf{A}\| \cdot \|\mathbf{x}\|
$$

因 $\mathbf{x} \neq \mathbf{0}$，两边除以 $\|\mathbf{x}\|$ 可得：
$$
\|\delta\mathbf{A}\| \geq \frac{1}{\|\mathbf{A}^{-1}\|} = \frac{\|\mathbf{A}\|}{\text{Cond}(\mathbf{A})}
$$

也即：
$$
\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} \geq \frac{1}{\text{Cond}(\mathbf{A})}
$$

- **构造**：

设 $\|\cdot\|$ 是由向量范数 $\|\cdot\|_v$ 诱导的矩阵范数。由 $\|\mathbf{A}^{-1}\|$ 的定义，存在 $\mathbf{y} \neq \mathbf{0}$ 使得：
$$
\|\mathbf{A}^{-1}\mathbf{y}\|_v = \|\mathbf{A}^{-1}\| \cdot \|\mathbf{y}\|_v
$$

令 $\mathbf{x} = \mathbf{A}^{-1}\mathbf{y}$，则 $\|\mathbf{x}\|_v = \|\mathbf{A}^{-1}\| \cdot \|\mathbf{y}\|_v$。

构造扰动（秩1矩阵）：
$$
\delta\mathbf{A} = -\frac{\mathbf{y}\mathbf{w}^T}{\mathbf{w}^T\mathbf{x}}
$$

其中 $\mathbf{w}$ 满足 $\|\mathbf{w}\|_{v*} = 1$ 且 $\mathbf{w}^T\mathbf{x} = \|\mathbf{x}\|_v$（由对偶范数存在性保证，$\|\cdot\|_{v*}$ 为对偶范数）。

因为：
$$
(\mathbf{A} + \delta\mathbf{A})\mathbf{x} = \mathbf{Ax} + \delta\mathbf{A}\mathbf{x}
= \mathbf{y} - \frac{\mathbf{y}\mathbf{w}^T\mathbf{x}}{\mathbf{w}^T\mathbf{x}} = \mathbf{y} - \mathbf{y} = \mathbf{0}
$$

故 $\mathbf{A} + \delta\mathbf{A}$ 奇异。

对诱导范数，有：
$$
\|\delta\mathbf{A}\| = \max_{\mathbf{z} \neq \mathbf{0}} \frac{\|\delta\mathbf{A}\mathbf{z}\|_v}{\|\mathbf{z}\|_v}
= \max_{\mathbf{z} \neq \mathbf{0}} \frac{\|\mathbf{y}\|_v \cdot |\mathbf{w}^T\mathbf{z}| / |\mathbf{w}^T\mathbf{x}|}{\|\mathbf{z}\|_v}
$$

由对偶范数性质 $|\mathbf{w}^T\mathbf{z}| \leq \|\mathbf{w}\|_{v*} \cdot \|\mathbf{z}\|_v = \|\mathbf{z}\|_v$，
且当 $\mathbf{z} = \mathbf{x}$ 时取等，得：
$$
\|\delta\mathbf{A}\| = \frac{\|\mathbf{y}\|_v}{|\mathbf{w}^T\mathbf{x}|} = \frac{\|\mathbf{y}\|_v}{\|\mathbf{x}\|_v}
= \frac{\|\mathbf{y}\|_v}{\|\mathbf{A}^{-1}\| \cdot \|\mathbf{y}\|_v} = \frac{1}{\|\mathbf{A}^{-1}\|}
$$

因此：
$$
\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} = \frac{1}{\|\mathbf{A}^{-1}\| \cdot \|\mathbf{A}\|} = \frac{1}{\text{Cond}(\mathbf{A})}
$$

**注**：

- **条件数的倒数** $=$ **矩阵到最近奇异矩阵的相对距离**
- 病态矩阵 $\Leftrightarrow$ 距离奇异矩阵近
- 良态矩阵 $\Leftrightarrow$ 与所有奇异矩阵保持距离
- 病态问题难以求解，因为数值计算中的舍入误差可能导致矩阵穿越奇异边界

---

## 误差分析

### 右端项扰动分析

扰动方程：$\mathbf{A}(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}+\delta\mathbf{b}$

则有**误差估计**：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \|\mathbf{A}\|\|\mathbf{A}^{-1}\| \frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}
$$
也即解的相对误差不超过右端项相对误差的 $\|\mathbf{A}\|\|\mathbf{A}^{-1}\|$ 倍。

**证明**：

由扰动方程可得 $\|\delta\mathbf{x}\| = \|\mathbf{A}^{-1}\delta\mathbf{b}\| \leq \|\mathbf{A}^{-1}\|\|\delta\mathbf{b}\|$

由原方程可得：$\|\mathbf{b}\| = \|\mathbf{Ax}\| \leq \|\mathbf{A}\|\|\mathbf{x}\|$，故 $1/\|\mathbf{x}\| \leq \|\mathbf{A}\|/\|\mathbf{b}\|$

两式相乘即可。

### 系数矩阵扰动分析

扰动方程：$(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}$

则有**误差估计**：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}{1-\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}
$$
也即解的相对误差关于系数矩阵相对误差的函数，当扰动充分小时近似为 $\|\mathbf{A}\|\|\mathbf{A}^{-1}\|$ 倍。

**证明**：

由扰动方程展开：
$$
(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x})
= \mathbf{A}\mathbf{x} + \mathbf{A}\delta\mathbf{x} + \delta\mathbf{A}\mathbf{x} + \delta\mathbf{A}\delta\mathbf{x} = \mathbf{b}
$$

由原方程 $\mathbf{A}\mathbf{x} = \mathbf{b}$，消去得：
$$
\mathbf{A}\delta\mathbf{x} + \delta\mathbf{A}\mathbf{x} + \delta\mathbf{A}\delta\mathbf{x} = \mathbf{0}
$$

即：
$$
\delta\mathbf{x} = -\mathbf{A}^{-1}\delta\mathbf{A}\mathbf{x} - \mathbf{A}^{-1}\delta\mathbf{A}\delta\mathbf{x}
$$

取范数并利用三角不等式：
$$
\|\delta\mathbf{x}\| \leq \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\mathbf{x}\| + \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\delta\mathbf{x}\|
$$

假设 $\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\| < 1$（小扰动），整理得：
$$
\|\delta\mathbf{x}\|\left(1 - \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\right) \leq \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\mathbf{x}\|
$$

故：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|}{1-\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|}
= \frac{\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}{1-\|\mathbf{A}\|\|\mathbf{A}^{-1}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}
$$

### 综合误差分析

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

**证明**：

由 $(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}+\delta\mathbf{b}$，展开得：
$$
\mathbf{Ax} + \mathbf{A}\delta\mathbf{x} + \delta\mathbf{A}\mathbf{x} + \delta\mathbf{A}\delta\mathbf{x}
= \mathbf{b} + \delta\mathbf{b}
$$

利用 $\mathbf{Ax} = \mathbf{b}$ 消去并整理得：
$$
\delta\mathbf{x} = -\mathbf{A}^{-1}\delta\mathbf{A}\mathbf{x} - \mathbf{A}^{-1}\delta\mathbf{A}\delta\mathbf{x} + \mathbf{A}^{-1}\delta\mathbf{b}
$$

由三角不等式：
$$
\|\delta\mathbf{x}\| \leq \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\mathbf{x}\|
+ \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\delta\mathbf{x}\| + \|\mathbf{A}^{-1}\|\|\delta\mathbf{b}\|
$$

由 $\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\| < 1$，整理：
$$
\|\delta\mathbf{x}\|(1-\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|)
\leq \|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\mathbf{x}\|
+ \|\mathbf{A}^{-1}\|\|\delta\mathbf{b}\|
$$

$$
\|\delta\mathbf{x}\| \leq \frac{\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|\|\mathbf{x}\| + \|\mathbf{A}^{-1}\|\|\delta\mathbf{b}\|}{1-\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|}
$$

两边除以 $\|\mathbf{x}\|$：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|}{1-\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|}
+ \frac{\|\mathbf{A}^{-1}\|}{1-\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\|}\frac{\|\delta\mathbf{b}\|}{\|\mathbf{x}\|}
$$

利用 $\|\mathbf{b}\| = \|\mathbf{Ax}\| \leq \|\mathbf{A}\|\|\mathbf{x}\|$：
$$
\frac{\|\delta\mathbf{b}\|}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}\|\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}
$$

代入并整理：
$$
\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \leq \frac{\|\mathbf{A}^{-1}\|\|\mathbf{A}\|\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}{1-\text{Cond}(\mathbf{A})\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}
+ \frac{\|\mathbf{A}^{-1}\|\|\mathbf{A}\|\frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}}{1-\text{Cond}(\mathbf{A})\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}
$$

$$
= \frac{\text{Cond}(\mathbf{A})}{1-\text{Cond}(\mathbf{A})\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|}}
\left(\frac{\|\delta\mathbf{A}\|}{\|\mathbf{A}\|} + \frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}\right)
$$

---

## 超定方程组

### 问题描述

当方程数 $m$ 大于未知数 $n$ 时，线性方程组 $\mathbf{A}\mathbf{x}=\mathbf{b}$，$\mathbf{A}\in\mathbb{R}^{m\times n}$ 通常**无解**。

所以我们希望寻找 $\mathbf{x}$ 使余量（残差）$\mathbf{r}=\mathbf{b}-\mathbf{A}\mathbf{x}$ 在某种意义下最小。也即求解
$$
\mathbf{x} = \argmin_{\mathbf{x}} F(\mathbf{x})
$$

### 最小二乘法

**目标函数**：
$$
F(\mathbf{x}) = \mathbf{r}^T\mathbf{r} = \|\mathbf{b}-\mathbf{A}\mathbf{x}\|_2^2
= \sum_{i=1}^m \left(b_i - \sum_{j=1}^n a_{ij}x_j\right)^2
$$

**几何意义**：  
寻找 $\mathbf{x}$ 使得 $\mathbf{A}\mathbf{x}$ 是 $\mathbf{b}$ 在 $\mathbf{A}$ 的列空间 $\mathcal{R}(\mathbf{A})$ 上的**正交投影**。

**注（2-范数的优势）**：

1. **解析可解**：可导出正规方程
2. **统计解释**：在高斯-马尔可夫假设下（误差独立同分布、零均值、等方差），最小二乘估计等价于最大似然估计
3. **几何意义**：对应欧几里得空间中的垂直距离最小化

### 正规方程

对 $F(\mathbf{x}) = (\mathbf{b}-\mathbf{A}\mathbf{x})^T(\mathbf{b}-\mathbf{A}\mathbf{x})$ 求梯度并令为零得：

$$
\frac{\partial F}{\partial \mathbf{x}} = 2\mathbf{A}^T(\mathbf{A}\mathbf{x}-\mathbf{b}) = \mathbf{0}
$$

**正规方程**：
$$
\mathbf{A}^T\mathbf{A}\mathbf{x} = \mathbf{A}^T\mathbf{b}
$$

若 $\text{rank}(\mathbf{A})=n$（列满秩），则 $\mathbf{A}^T\mathbf{A}$ 对称正定，此时存在唯一解：
$$
\mathbf{x} = (\mathbf{A}^T\mathbf{A})^{-1}\mathbf{A}^T\mathbf{b}
$$

**注**：

直接求解正规方程会将条件数平方：$\text{Cond}(\mathbf{A}^T\mathbf{A})_2 = [\text{Cond}(\mathbf{A})_2]^2$，可能引入数值不稳定性。
实际计算中，QR 分解或 SVD 是更稳定的算法，但正规方程在理论分析中非常重要
