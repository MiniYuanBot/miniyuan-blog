---
title: 'CNN'
excerpt: '26 春 计算机视觉导论 Lab2'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'cv'
- '计算机视觉'
pubDate: 'April 21 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Task1: BackPropagation

### BP: 符号定义

| 符号 | 维度 | 含义 |
| ---- | ---- | ---- |
| $ \mathbf{X} $ | $ 10 \times 784 $ | 输入 |
| $ \mathbf{W}_1 $ | $ 784 \times 16 $ | 第一层权重 |
| $ \mathbf{W}_2 $ | $ 16 \times 1 $ | 第二层权重 |
| $ \mathbf{Z}_1 $ | $ 10 \times 16 $ | 第一层线性输出 |
| $ \mathbf{A}_1 $ | $ 10 \times 16 $ | 第一层激活输出 |
| $ \mathbf{Z}_2 $ | $ 10 \times 1 $ | 第二层线性输出 |
| $ \hat{\mathbf{y}} $ | $ 10 \times 1 $ | 预测值 |
| $ \mathbf{y} $ | $ 10 \times 1 $ | 真实标签 |
| $ L $ | 标量 | 损失函数 |
| $ \alpha $ | 标量 | 学习率 |

### BP: 前向传播

$$
\mathbf{Z}_1 = \mathbf{X} \mathbf{W}_1, \quad \mathbf{Z}_1 \in \mathbb{R}^{10 \times 16}
$$

$$
\mathbf{A}_1 = \sigma(\mathbf{Z}_1) = \frac{1}{1 + e^{-\mathbf{Z}_1}}, \quad \mathbf{A}_1 \in \mathbb{R}^{10 \times 16}
$$

$$
\mathbf{Z}_2 = \mathbf{A}_1 \mathbf{W}_2, \quad \mathbf{Z}_2 \in \mathbb{R}^{10 \times 1}
$$

$$
\hat{\mathbf{y}}
= \sigma(\mathbf{Z}_2)
= \frac{1}{1 + e^{-\mathbf{Z}_2}}, \quad \hat{\mathbf{y}} \in \mathbb{R}^{10 \times 1}
$$

$$
L = -\left[ \mathbf{y}^T \log(\hat{\mathbf{y}})
+ (\mathbf{1} - \mathbf{y})^T \log(\mathbf{1} - \hat{\mathbf{y}}) \right], \quad
L \in \mathbb{R}
$$

**注**：此处 sigmoid 函数为 element-wise 的。

### BP: 反向传播

$$
\frac{\partial L}{\partial \mathbf{Z}_2}
= \hat{\mathbf{y}} - \mathbf{y}, \quad \frac{\partial L}{\partial \mathbf{Z}_2} \in \mathbb{R}^{10 \times 1}
$$

$$
\frac{\partial L}{\partial \mathbf{W}_2}
= \mathbf{A}_1^T \frac{\partial L}{\partial \mathbf{Z}_2}, \quad
\frac{\partial L}{\partial \mathbf{W}_2} \in \mathbb{R}^{16 \times 1}
$$

$$
\frac{\partial L}{\partial \mathbf{A}_1}
= \frac{\partial L}{\partial \mathbf{Z}_2} \mathbf{W}_2^T, \quad
\frac{\partial L}{\partial \mathbf{A}_1} \in \mathbb{R}^{10 \times 16}
$$

$$
\frac{\partial L}{\partial \mathbf{Z}_1}
= \frac{\partial L}{\partial \mathbf{A}_1} \odot \mathbf{A}_1 \odot (\mathbf{1} - \mathbf{A}_1), \quad
\frac{\partial L}{\partial \mathbf{Z}_1} \in \mathbb{R}^{10 \times 16}
$$

$$
\frac{\partial L}{\partial \mathbf{W}_1}
= \mathbf{X}^T \frac{\partial L}{\partial \mathbf{Z}_1}, \quad
\frac{\partial L}{\partial \mathbf{W}_1} \in \mathbb{R}^{784 \times 16}
$$

**注**：$\odot$ 表示逐元素相乘。

### BP: 参数更新

$$
\mathbf{W}_1 \leftarrow \mathbf{W}_1 - \alpha \frac{\partial L}{\partial \mathbf{W}_1}
$$

$$
\mathbf{W}_2 \leftarrow \mathbf{W}_2 - \alpha \frac{\partial L}{\partial \mathbf{W}_2}
$$

---

## Task2: BatchNorm in MLP

### BN: 符号定义

| 符号 | 维度 | 含义 |
| ---- | ---- | ---- |
| $ \mathbf{X} $ | $ N \times D $ | BatchNorm 层输入 |
| $ \boldsymbol{\gamma} $ | $ D $ | 缩放参数 |
| $ \boldsymbol{\beta} $ | $ D $ | 平移参数 |
| $ \boldsymbol{\mu}_B $ | $ D $ | batch 均值 |
| $ \boldsymbol{\sigma}_B^2 $ | $ D $ | batch 方差 |
| $ \hat{\mathbf{X}} $ | $ N \times D $ | 归一化后的值 |
| $ \mathbf{Y} $ | $ N \times D $ | BatchNorm 输出 |
| $ \frac{\partial L}{\partial \mathbf{Y}} $ | $ N \times D $ | 上游梯度 |
| $ \epsilon $ | 标量 | 小常数 |

### BN: 前向传播

$$
\boldsymbol{\mu}_B = \frac{1}{N} \sum_{n=1}^N \mathbf{X}_{n,:}, \quad \boldsymbol{\mu}_B \in \mathbb{R}^{D}
$$

$$
\boldsymbol{\sigma}_B^2
= \frac{1}{N} \sum_{n=1}^N (\mathbf{X}_{n,:} - \boldsymbol{\mu}_B)^2, \quad
\boldsymbol{\sigma}_B^2 \in \mathbb{R}^{D}
$$

$$
\hat{\mathbf{X}}
= \frac{\mathbf{X} - \mathbf{1}\boldsymbol{\mu}_B}{\sqrt{\boldsymbol{\sigma}_B^2 + \epsilon}}, \quad
\hat{\mathbf{X}} \in \mathbb{R}^{N \times D}
$$

$$
\mathbf{Y} = \boldsymbol{\gamma} \odot \hat{\mathbf{X}} + \mathbf{1}\boldsymbol{\beta}, \quad
\mathbf{Y} \in \mathbb{R}^{N \times D}
$$

**注**：$\mathbf{1} \in \mathbb{R}^{N \times 1}$ 为全1列向量，运算为广播机制。

### BN: 反向传播

令 $s = \sqrt{\boldsymbol{\sigma}_B^2 + \epsilon}$，则：

$$
\frac{\partial L}{\partial \boldsymbol{\gamma}} = \sum_{n=1}^N \frac{\partial L}{\partial \mathbf{Y}_{n,:}} \odot \hat{\mathbf{X}}_{n,:}, \quad
\frac{\partial L}{\partial \boldsymbol{\gamma}} \in \mathbb{R}^{D}
$$

$$
\frac{\partial L}{\partial \boldsymbol{\beta}} = \sum_{n=1}^N \frac{\partial L}{\partial \mathbf{Y}_{n,:}}, \quad
\frac{\partial L}{\partial \boldsymbol{\beta}} \in \mathbb{R}^{D}
$$

$$
\frac{\partial L}{\partial \hat{\mathbf{X}}} = \frac{\partial L}{\partial \mathbf{Y}} \odot \boldsymbol{\gamma}, \quad
\frac{\partial L}{\partial \hat{\mathbf{X}}} \in \mathbb{R}^{N \times D}
$$

$$
\frac{\partial L}{\partial \mathbf{X}} = \frac{1}{N s} \odot \left( N \frac{\partial L}{\partial \hat{\mathbf{X}}}
- \mathbf{1} \mathbf{s}_1 - \hat{\mathbf{X}} \mathbf{s}_2 \right), \quad
\frac{\partial L}{\partial \mathbf{X}} \in \mathbb{R}^{N \times D}
$$

其中：

$$
\mathbf{s}_1 = \sum_{n=1}^N \frac{\partial L}{\partial \hat{\mathbf{X}}}_{n,:} \in \mathbb{R}^{D}
$$

$$
\mathbf{s}_2 = \sum_{n=1}^N \frac{\partial L}{\partial \hat{\mathbf{X}}}_{n,:} \odot \hat{\mathbf{X}}_{n,:} \in \mathbb{R}^{D}
$$

**注**：$\odot$ 表示逐元素相乘，除法为逐元素除法，$\mathbf{1} \in \mathbb{R}^{N \times 1}$ 为全1列向量。

### BN: 参数更新

$$
\boldsymbol{\gamma} \leftarrow \boldsymbol{\gamma} - \alpha \frac{\partial L}{\partial \boldsymbol{\gamma}}
$$

$$
\boldsymbol{\beta} \leftarrow \boldsymbol{\beta} - \alpha \frac{\partial L}{\partial \boldsymbol{\beta}}
$$

### 反向传播推导

考虑**单个特征维度**（$D=1$），有 $N$ 个样本：$x_1, x_2, ..., x_N$。

已知 $\frac{\partial L}{\partial \hat{x}_i}$（$i=1..N$），求 $\frac{\partial L}{\partial x_i}$。

#### 第一步：前向传播表达式

$$
\mu = \frac{1}{N} \sum_{k=1}^N x_k \tag{1}
$$

$$
\sigma^2 = \frac{1}{N} \sum_{k=1}^N (x_k - \mu)^2 \tag{2}
$$

$$
s = \sqrt{\sigma^2 + \epsilon} \tag{3}
$$

$$
\hat{x}_i = \frac{x_i - \mu}{s} \tag{4}
$$

#### 第二步：链式法则

$$
\frac{\partial L}{\partial x_i} = \sum_{j=1}^N \frac{\partial L}{\partial \hat{x}_j} \cdot \frac{\partial \hat{x}_j}{\partial x_i} \tag{5}
$$

#### 第三步：计算 $\frac{\partial \hat{x}_j}{\partial x_i}$

由 (4) 对 $x_i$ 求偏导：

$$
\frac{\partial \hat{x}_j}{\partial x_i} = \frac{ \frac{\partial (x_j - \mu)}{\partial x_i} \cdot s - (x_j - \mu) \cdot \frac{\partial s}{\partial x_i} }{s^2} \tag{6}
$$

#### 第四步：计算 $\frac{\partial (x_j - \mu)}{\partial x_i}$

由 (1)：$\frac{\partial \mu}{\partial x_i} = \frac{1}{N}$，所以：

$$
\frac{\partial (x_j - \mu)}{\partial x_i} = \delta_{ij} - \frac{1}{N} \tag{7}
$$

其中 $\delta_{ij} = 1$ 当 $i=j$，否则 $0$。

#### 第五步：计算 $\frac{\partial s}{\partial x_i}$

由 (3)：$\frac{\partial s}{\partial x_i} = \frac{1}{2s} \cdot \frac{\partial \sigma^2}{\partial x_i}$

由 (2) 计算 $\frac{\partial \sigma^2}{\partial x_i}$：

$$
\frac{\partial \sigma^2}{\partial x_i} = \frac{2}{N} \sum_{k=1}^N (x_k - \mu) \left( \delta_{ik} - \frac{1}{N} \right) = \frac{2}{N} (x_i - \mu) \tag{8}
$$

因此：

$$
\frac{\partial s}{\partial x_i} = \frac{x_i - \mu}{N s} \tag{9}
$$

#### 第六步：代入 (6)

将 (7)(9) 代入 (6)：

$$
\frac{\partial \hat{x}_j}{\partial x_i} = \frac{ \left( \delta_{ij} - \frac{1}{N} \right) s - (x_j - \mu) \cdot \frac{x_i - \mu}{N s} }{s^2}
$$

整理得：

$$
\frac{\partial \hat{x}_j}{\partial x_i} = \frac{1}{s} \left( \delta_{ij} - \frac{1}{N} \right) - \frac{1}{N s^3} (x_j - \mu)(x_i - \mu) \tag{10}
$$

#### 第七步：代入链式法则 (5)

$$
\frac{\partial L}{\partial x_i} = \sum_{j=1}^N \frac{\partial L}{\partial \hat{x}_j} \left[ \frac{1}{s} \left( \delta_{ij} - \frac{1}{N} \right) - \frac{1}{N s^3} (x_j - \mu)(x_i - \mu) \right]
$$

拆开三项：

$$
\frac{\partial L}{\partial x_i} = \frac{1}{s} \sum_{j=1}^N \frac{\partial L}{\partial \hat{x}_j} \delta_{ij}
- \frac{1}{N s} \sum_{j=1}^N \frac{\partial L}{\partial \hat{x}_j}
- \frac{1}{N s^3} (x_i - \mu) \sum_{j=1}^N \frac{\partial L}{\partial \hat{x}_j} (x_j - \mu)
$$

第一项中 $\sum_j \frac{\partial L}{\partial \hat{x}_j} \delta_{ij} = \frac{\partial L}{\partial \hat{x}_i}$，所以：

$$
\frac{\partial L}{\partial x_i} = \frac{1}{s} \frac{\partial L}{\partial \hat{x}_i}
- \frac{1}{N s} \sum_{j=1}^N \frac{\partial L}{\partial \hat{x}_j}
- \frac{1}{N s^3} (x_i - \mu) \sum_{j=1}^N \frac{\partial L}{\partial \hat{x}_j} (x_j - \mu) \tag{11}
$$

#### 第八步：用 $\hat{x}$ 替换 $(x - \mu)$

由 (4)：$x_i - \mu = s \hat{x}_i$，代入 (11) 第三项：

$$
\frac{1}{N s^3} (x_i - \mu) \sum_j \frac{\partial L}{\partial \hat{x}_j} (x_j - \mu)
= \frac{1}{N s^3} (s \hat{x}_i) \sum_j \frac{\partial L}{\partial \hat{x}_j} (s \hat{x}_j)
= \frac{1}{N s} \hat{x}_i \sum_j \frac{\partial L}{\partial \hat{x}_j} \hat{x}_j
$$

代回 (11)：

$$
\frac{\partial L}{\partial x_i} = \frac{1}{s} \frac{\partial L}{\partial \hat{x}_i}
- \frac{1}{N s} \sum_j \frac{\partial L}{\partial \hat{x}_j}
- \frac{1}{N s} \hat{x}_i \sum_j \frac{\partial L}{\partial \hat{x}_j} \hat{x}_j
$$

提取公因子 $\frac{1}{N s}$：

$$
\frac{\partial L}{\partial x_i} = \frac{1}{N s} \left( N \frac{\partial L}{\partial \hat{x}_i}
- \sum_j \frac{\partial L}{\partial \hat{x}_j}
- \hat{x}_i \sum_j \frac{\partial L}{\partial \hat{x}_j} \hat{x}_j \right) \tag{12}
$$
