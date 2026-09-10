---
title: '信息论总结'
excerpt: '26 春 信息论'
author: 'miniyuan'
position: 'Beijing'
tags:
- '信息论'
pubDate: 'June 15 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<!-- markdownlint-disable MD024 -->

## 普通熵

### 定义

| 类型 | 公式 |
| ---- | ---- |
| **一维离散** | $H(X)=-\displaystyle\sum_{x\in\mathcal{X}}p(x)\log p(x)$ |
| **多维离散** | $H(X_1,\dots,X_n)=-\displaystyle\sum_{x_1,\dots,x_n}p(x_1,\dots,x_n)\log p(x_1,\dots,x_n)$ |
| **一维连续** | $h(X)=-\displaystyle\int_{\mathbb{R}}f(x)\log f(x)\,dx$ |
| **多维连续** | $h(X_1,\dots,X_n)=-\displaystyle\int_{\mathbb{R}^n}f(x_1,\dots,x_n)\log f(x_1,\dots,x_n)\,dx_1\cdots dx_n$ |

**$\Delta$ 离散化极限**：将 $\mathbb{R}$（或 $\mathbb{R}^n$）划分为边长 $\Delta>0$ 的均匀网格，记离散化变量为 $X_\Delta$（或 $\mathbf{X}_\Delta$），则
$$
h(X)=\lim_{\Delta\to 0^+}\bigl[H(X_\Delta)+\log_2\Delta\bigr]
$$
$$
h(\mathbf{X})=\lim_{\Delta\to 0^+}\bigl[H(\mathbf{X}_\Delta)+n\log_2\Delta\bigr]
$$
注：修正项 $n\log_2\Delta$ 对应网格体积 $\Delta^n$。

### 共同性质

1. **链式法则**：$H(X_1,\dots,X_n)=\displaystyle\sum_{i=1}^n H(X_i\mid X_1,\dots,X_{i-1})$
2. **次可加性**：$H(X_1,\dots,X_n)\leq\displaystyle\sum_{i=1}^n H(X_i)$
3. **条件作用减少熵**：$H(X\mid Y)\leq H(X)$，等号成立 $\iff$ $X$ 与 $Y$ 相互独立
4. **最大熵原理**：在给定约束下，特定分布使熵最大。如离散有限支撑 $\to$ 均匀分布；连续固定协方差 $\to$ 高斯分布。

### 不同性质

| 性质 | 离散（一维/多维） | 连续（一维/多维） |
| ---- | ----------------- | ----------------- |
| **非负性** | $H\geq 0$ 恒成立 | $h$ 可正可负，无下界 |
| **确定性** | $H=0\iff$ 单点分布 | Dirac $\delta$ 使 $h=-\infty$，无有限定义 |
| **上界** | $H(X)\leq\log\vert\mathcal{X}\vert$ | 无通用上界；仅在约束下有界（如支撑集体积 $V$ 或协方差 $\Sigma$） |
| **坐标不变性** | 与坐标/参数化无关 | 不保持不变；可逆变换 $Y=\varphi(X)$ 附加 $\mathbb{E}[\log\vert\det J_\varphi\vert]$ |

---

## 联合熵

### 定义

| 类型 | 公式 |
| ---- | ---- |
| **一维离散** | $H(X,Y)=-\displaystyle\sum_{x,y}p(x,y)\log p(x,y)$，$X,Y$ 各为一维离散变量 |
| **多维离散** | $H(\mathbf{X},\mathbf{Y})=-\displaystyle\sum_{\mathbf{x},\mathbf{y}}p(\mathbf{x},\mathbf{y})\log p(\mathbf{x},\mathbf{y})$，$\mathbf{X}\in\mathbb{R}^n,\mathbf{Y}\in\mathbb{R}^m$ |
| **一维连续** | $h(X,Y)=-\displaystyle\iint f(x,y)\log f(x,y)\,dx\,dy$ |
| **多维连续** | $h(\mathbf{X},\mathbf{Y})=-\displaystyle\int f(\mathbf{x},\mathbf{y})\log f(\mathbf{x},\mathbf{y})\,d\mathbf{x}\,d\mathbf{y}$ |

**$\Delta$ 离散化极限**：
$$
h(X,Y)=\lim_{\Delta\to 0^+}\bigl[H(X_\Delta,Y_\Delta)+2\log_2\Delta\bigr]
$$
$$
h(\mathbf{X},\mathbf{Y})=\lim_{\Delta\to 0^+}\bigl[H(\mathbf{X}_\Delta,\mathbf{Y}_\Delta)+(n+m)\log_2\Delta\bigr]
$$
注：修正项系数等于联合空间的维度数。

### 共同性质

1. **与边缘/条件关系**：$H(X,Y)=H(X)+H(Y\mid X)=H(Y)+H(X\mid Y)$
2. **次可加性**：$H(X,Y)\leq H(X)+H(Y)$，等号成立 $\iff$ $X$ 与 $Y$ 相互独立
3. **单调性**：$H(X,Y)\geq H(X)$

### 不同性质

| 性质 | 离散（一维/多维） | 连续（一维/多维） |
| ---- | ----------------- | ----------------- |
| **非负性** | $H(X,Y)\geq 0$ | $h(X,Y)$ 可负 |
| **自联合** | $H(X,X)=H(X)$（有限值） | $h(X,X)$ 无定义 |
| **上界** | $H(X,Y)\leq\log(\vert\mathcal{X}\vert\cdot\vert\mathcal{Y}\vert)$ | 无通用上界，仅约束下有界 |

---

## 条件熵

### 定义

| 类型 | 公式 |
| ---- | ---- |
| **一维离散** | $H(Y\mid X)=-\displaystyle\sum_{x,y}p(x,y)\log p(y\mid x)$ |
| **多维离散** | $H(\mathbf{Y}\mid\mathbf{X})=-\displaystyle\sum_{\mathbf{x},\mathbf{y}}p(\mathbf{x},\mathbf{y})\log p(\mathbf{y}\mid\mathbf{x})$ |
| **一维连续** | $h(Y\mid X)=-\displaystyle\iint f(x,y)\log f(y\mid x)\,dx\,dy$ |
| **多维连续** | $h(\mathbf{Y}\mid\mathbf{X})=-\displaystyle\int f(\mathbf{x},\mathbf{y})\log f(\mathbf{y}\mid\mathbf{x})\,d\mathbf{x}\,d\mathbf{y}$ |

**$\Delta$ 离散化极限**：
$$
h(Y\mid X)=\lim_{\Delta\to 0^+}\bigl[H(Y_\Delta\mid X_\Delta)+\log_2\Delta\bigr]
$$
$$
h(\mathbf{Y}\mid\mathbf{X})=\lim_{\Delta\to 0^+}\bigl[H(\mathbf{Y}_\Delta\mid\mathbf{X}_\Delta)+m\log_2\Delta\bigr]
$$

### 共同性质

1. **联合分解**：$H(X,Y)=H(X)+H(Y\mid X)=H(Y)+H(X\mid Y)$
2. **链式法则**：$H(X_1,\dots,X_n\mid\mathbf{Y})=\displaystyle\sum_{i=1}^n H(X_i\mid X_1,\dots,X_{i-1},\mathbf{Y})$
3. **条件作用减少熵**：$H(Y\mid X)\leq H(Y)$，等号成立 $\iff$ $X$ 与 $Y$ 相互独立
4. **独立性**：$H(Y\mid X)=H(Y)\iff$ $X$ 与 $Y$ 相互独立

### 不同性质

| 性质 | 离散（一维/多维） | 连续（一维/多维） |
| ---- | ----------------- | ----------------- |
| **非负性** | $H(Y\mid X)\geq 0$ | $h(Y\mid X)$ 可负，无下界 |
| **确定性函数** | $H(Y\mid X)=0\iff Y=g(X)\ \text{a.s.}$ | 若 $Y=g(X)$（即使 $g$ 可逆），$h(Y\mid X)\to-\infty$ |
| **上界** | $H(Y\mid X)\leq\log\vert\mathcal{Y}\vert$ | 无通用上界 |

---

## 互信息

### 定义

| 类型 | 公式 |
| ---- | ---- |
| **一维离散** | $I(X;Y)=\displaystyle\sum_{x,y}p(x,y)\log\dfrac{p(x,y)}{p(x)p(y)}$ |
| **多维离散** | $I(\mathbf{X};\mathbf{Y})=\displaystyle\sum_{\mathbf{x},\mathbf{y}}p(\mathbf{x},\mathbf{y})\log\dfrac{p(\mathbf{x},\mathbf{y})}{p(\mathbf{x})p(\mathbf{y})}$ |
| **一维连续** | $I(X;Y)=\displaystyle\iint f(x,y)\log\dfrac{f(x,y)}{f(x)f(y)}\,dx\,dy$ |
| **多维连续** | $I(\mathbf{X};\mathbf{Y})=\displaystyle\int f(\mathbf{x},\mathbf{y})\log\dfrac{f(\mathbf{x},\mathbf{y})}{f(\mathbf{x})f(\mathbf{y})}\,d\mathbf{x}\,d\mathbf{y}$ |

**$\Delta$ 离散化极限**：互信息在离散化过程中自动抵消网格体积修正项，故
$$
I(X;Y)=\lim_{\Delta\to 0^+}I(X_\Delta;Y_\Delta)
$$
$$
I(\mathbf{X};\mathbf{Y})=\lim_{\Delta\to 0^+}I(\mathbf{X}_\Delta;\mathbf{Y}_\Delta)
$$

### 共同性质

1. **非负性**：$I(X;Y)\geq 0$，等号成立 $\iff$ $X$ 与 $Y$ 相互独立
2. **对称性**：$I(X;Y)=I(Y;X)$
3. **熵分解**：$I(X;Y)=H(X)-H(X\mid Y)=H(Y)-H(Y\mid X)=H(X)+H(Y)-H(X,Y)$
4. **数据处理不等式（DPI）**：

    若 $X\to Y\to Z$ 为马尔可夫链，则 $I(X;Z)\leq I(X;Y)$

    特殊地，有 $H(f(X)) \leq H(X)$
5. **链式法则**：$I(X_1,\dots,X_n;Y)=\displaystyle\sum_{i=1}^n I(X_i;Y\mid X_1,\dots,X_{i-1})$

### 不同性质

| 性质 | 离散（一维/多维） | 连续（一维/多维） |
| ---- | ----------------- | ----------------- |
| **自信息** | $I(X;X)=H(X)$（有限值） | $I(X;X)=+\infty$ |
| **上界** | $I(X;Y)\leq\min\{H(X),H(Y)\}$ | 无此上界（因微分熵可负，但互信息仍非负且可有限） |
| **坐标不变性** | 与坐标无关 | 在连续可逆变换下保持不变（Jacobian 在比值中抵消） |
| **有限性** | 边缘熵有限 $\Rightarrow$ 互信息有限 | 可能为 $+\infty$（如自信息情形） |

---

## KL 散度

### 定义

| 类型 | 公式 |
| ---- | ---- |
| **一维离散** | $D(P\|Q)=\displaystyle\sum_{x\in\mathcal{X}}p(x)\log\dfrac{p(x)}{q(x)}$ |
| **多维离散** | $D(P\|Q)=\displaystyle\sum_{\mathbf{x}}p(\mathbf{x})\log\dfrac{p(\mathbf{x})}{q(\mathbf{x})}$ |
| **一维连续** | $D(P\|Q)=\displaystyle\int_{\mathbb{R}}f(x)\log\dfrac{f(x)}{g(x)}\,dx$ |
| **多维连续** | $D(P\|Q)=\displaystyle\int_{\mathbb{R}^n}f(\mathbf{x})\log\dfrac{f(\mathbf{x})}{g(\mathbf{x})}\,d\mathbf{x}$ |

**$\Delta$ 离散化极限**：同理，网格体积项在概率比值中相互抵消，故
$$
D(P\|Q)=\lim_{\Delta\to 0^+}D(P_\Delta\|Q_\Delta)
$$

### 共同性质

1. **非负性**：$D(P\|Q)\geq 0$，等号成立 $\iff$ $P=Q\ \text{a.s.}$
2. **不对称性**：一般 $D(P\|Q)\neq D(Q\|P)$
3. **不满足三角不等式**
4. **凸性**：对第一个参数 $P$ 线性（仿射），对第二个参数 $Q$ 凸
5. **互信息表示**：$I(X;Y)=D(P_{XY}\,\|\,P_X\otimes P_Y)$

### 不同性质

| 性质 | 离散（一维/多维） | 连续（一维/多维） |
| ---- | ----------------- | ----------------- |
| **无穷大触发** | $\exists x: p(x)>0,q(x)=0\Rightarrow D=+\infty$ | $P$ 不关于 $Q$ 绝对连续（支撑集不同或奇异分量）$\Rightarrow D=+\infty$ |
| **坐标不变性** | 与坐标无关 | 保持不变 |
| **局部近似** | $P\approx Q$ 时 $D(P\|Q)\approx\frac{1}{2}\chi^2(P,Q)$ | 同样成立，但 Fisher 信息矩阵展开需在测度论框架下严格化 |
