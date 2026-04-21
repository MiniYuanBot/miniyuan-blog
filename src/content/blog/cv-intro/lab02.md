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

### 符号定义

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

### 前向传播

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

### 反向传播

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

### 参数更新

$$
\mathbf{W}_1 \leftarrow \mathbf{W}_1 - \alpha \frac{\partial L}{\partial \mathbf{W}_1}
$$

$$
\mathbf{W}_2 \leftarrow \mathbf{W}_2 - \alpha \frac{\partial L}{\partial \mathbf{W}_2}
$$

---
