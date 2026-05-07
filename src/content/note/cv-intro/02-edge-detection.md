---
title: '边缘检测'
excerpt: '26 春 计算机视觉导论 L02'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'March 18 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Images as Functions

把图像视为离散的二维函数 f(x, y)，值域可以是单通道（灰度值）或者多通道（RGB）。后续可以对其应用滤波（filtering）、微分（derivative）、傅里叶分析等工具，理解纹理、边缘与频谱特性。

**注**：可以通过差分近似（finite difference）解决求导问题。数值上常用中心差分。

---

## Filters and Convolution

以下只考虑线性、时不变的系统/滤波器，也即：

1. 线性性：
   - 齐次性：输入 $ a \cdot x(t) $ $\to$ 输出 $ a \cdot y(t) $
   - 可加性：输入 $ x_1(t) + x_2(t) $ $\to$ 输出 $ y_1(t) + y_2(t) $
2. 时不变性：
    输入 $ x(t   - \tau) $ $\to$ 输出 $ y(t   - \tau) $

### 1D Filter: Moving Average

移动平均就是选取一定的窗口大小，每个输出点是窗口中像素值的加权和。
用卷积表示即：
$$
h[n] = (f * g)[n] = \sum_{k=-K}^{K} f[n-k] \cdot g[k]
$$
其中 $g[k]$ 是滤波器权重。

### Convolution and Flourier Transformer

**Discrete Signal**：

离散卷积：
$$
(f * g)[n] = \sum_{m=-\infty}^{\infty} f[m]\, g[n-m]
$$

离散傅里叶变换：
$$
\mathcal{F}\{f\}(\omega) = \sum_{n=-\infty}^{\infty} f[n]\, e^{-i2\pi\omega n}
$$

**Continuous Signal**：

连续卷积：
$$
(f * g)(x) = \int_{-\infty}^{\infty} f(t)\, g(x   - t)\, dt
$$

连续傅里叶变换：
$$
\mathcal{F}\{f\}(\omega) = \int_{-\infty}^\infty f(t)\, e^{-i2\pi \omega t}\, dt
$$

**Convolution Theory**：

$$
\mathcal{F}\{f * g\} = \mathcal{F}\{f\} \cdot \mathcal{F}\{g\}
$$
也即**时域卷积等于频域相乘**。本质上是傅里叶变换将输入信号分解为无数单一的基信号，而线性时不变滤波器对基信号只有**频率响应**，故在频域只需做独立乘法。

我们之前采用的均匀移动平均在频域中实际上集中在低频，故其为**低通滤波器**，也即 $f * g$ 会抑制高频成分，比如噪声。实际上设计时可以先在频域中绘制滤波图形，然后再逆变换到时域得到 filter.

### 2D Filter: Moving Average

选取一定的窗口大小，每个输出点是窗口中像素的加权和。
卷积表示：
$$
(f * g)[m,n] = \sum_{k}\sum_{\ell} f[k,\ell]\, g[m-k,\, n-\ell]
$$

### Gaussian Filter

高斯滤波是一种常用的低通滤波器。

#### 1D

时域：
$$
g(x) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\left(-\frac{x^2}{2\sigma^2}\right)
$$

频域：
$$
\mathcal{F}\{g\}(\omega) = \exp\left(-\frac{\sigma^2 \omega^2}{2}\right)
$$

傅里叶变换对：
$$
\mathcal{F}\{g\}(\omega) = \int_{-\infty}^{\infty} g(x) e^{-i\omega x} dx
$$

#### 2D

空域：
$$
g(x,y) = \frac{1}{2\pi\sigma^2} \exp\left(-\frac{x^2 + y^2}{2\sigma^2}\right)
$$

频域：
$$
\mathcal{F}\{g\}(\omega_x, \omega_y) = \exp\left(-\frac{\sigma^2 (\omega_x^2 + \omega_y^2)}{2}\right)
$$

傅里叶变换对：
$$
\mathcal{F}\{g\}(\omega_x, \omega_y) = \iint_{-\infty}^{\infty} g(x,y) e^{-i(\omega_x x + \omega_y y)} dx dy
$$

#### Parameter

显然在频域仍为 Gaussian 分布。故 $\sigma$ 越大，频域越锋利，选择的低频成分越多。

---

## Edge Detection

### Causes of Edges

边缘的判断标准：

- 深度（Depth）不连续
- 表面颜色（Surface color）不连续
- 表面朝向（Surface orientation）不连续
- 光照（Illumination）不连续

### The Definition of Edges

**边缘**是图像中在某一方向上像素值显著变化，在其正交方向上变化较小的区域。

边缘的数学定义由**梯度**给出：边缘上，梯度的幅值应当在梯度方向上取得局部极大值，且在梯度的正交方向上基本不变。

梯度向量：
$$
\nabla f(x,y) = \left(\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}\right)
$$
梯度幅值（magnitude）：
$$
|\nabla f| = \sqrt{\left(\frac{\partial f}{\partial x}\right)^2 + \left(\frac{\partial f}{\partial y}\right)^2}
$$
梯度方向（orientation）：
$$
\theta = \operatorname{atan2} \left(\frac{\partial f}{\partial y}, \frac{\partial f}{\partial x}\right)
$$

### Criteria for Edge Detection

边缘检测本质上是一个**二分类问题**，因此可以用以下指标评价：

| 缩写 | 全称 | 含义 |
| :--- | :--- | :--- |
| **TP** | True Positives | 正确检测为边缘的边缘像素 |
| **FP** | False Positives | 错误检测为边缘的非边缘像素 |
| **FN** | False Negatives | 错误检测为非边缘的边缘像素 |
| **TN** | True Negatives | 正确检测为非边缘的非边缘像素 |

由此定义两个核心指标：

**精确率**：
$$
\text{Precision} = \frac{TP}{TP + FP}
$$
也即检测出的边缘中，有多少是真正的边缘

**召回率**：
$$
\text{Recall} = \frac{TP}{TP + FN}
$$
也即真实边缘中，有多少被成功检测出来

三个重要准则：

1. **Good Detection**：
 尽可能检测出所有真实边缘，尽量避免把噪声检测为边缘。也即**精确率**和**召回率**尽量高
2. **Good Localization**：
 检测到的边缘位置必须尽可能接近真实的边缘位置。也即检测边缘与真实边缘之间的**距离**尽量小
3. **Single Response**：
 对于每一条真实的边缘，算法应该只产生**一个**响应，而不是多个。

---

### Finite Difference Approximation

连续偏导数在数字图像上用差分近似：

- 中心差分（2阶准确）：
    $$
    \frac{\partial f}{\partial x}\bigg|_{(m,n)} \approx \frac{f(m+1, n)   - f(m-1,n)}{2}
    $$
    $$
    \frac{\partial f}{\partial y}\bigg|_{(m,n)} \approx \frac{f(m, n+1)   - f(m,n-1)}{2}
    $$
- 前向/后向差分也可用，但精度稍差：
    $$
    \frac{\partial f}{\partial x}\bigg|_{(m,n)} \approx f(m+1,n)   - f(m,n)
    $$

**注**：
在实践中常先平滑再差分，避免对噪声产生大梯度响应。但是也会涉及到平滑-定位权衡（smoothing vs localization）问题。

### Derivative Theorem of Convolution

在先平滑后差分时，我们可以利用**导数定理**进行分步简化计算。

导数定理：
$$
\frac{\partial}{\partial x}(f * g) = f * \frac{\partial g}{\partial x}
$$

这意味着我们可以把先卷积再差分合并成一次卷积（用导数的 Gaussian kernel），节省计算并更好地控制尺度。

具体地，我们用 x、y 导数 Gaussian 对图像做卷积得到两个分量：
$$
G_x = f * \frac{\partial g}{\partial x}, \qquad G_y = f * \frac{\partial g}{\partial y}
$$
从而计算出梯度幅值与方向：
$$
|\nabla f| = \sqrt{G_x^2 + G_y^2}, \quad \theta = \operatorname{atan2} (G_y, G_x)
$$

### Post Processing

实际上前一步结束时我们就已经完成了梯度的计算。接下来需要进一步解决两个问题即可完成边缘检测：一是边缘的 localization/single response，也即边缘最好是**单像素**的；二是边缘的 continuity，也即边缘最好是**连续**的。

#### Non-Maximal Suppression

非极大值抑制（NMS）算法，用以形成**单像素**边缘。

步骤：

1. 对每个像素 $q$ 计算梯度 $g(q)$ 以及梯度幅值 $M(q)$。
2. 沿梯度方向向两侧移动到点 $q_1 = q + g_{dir}(q)$，$q_2 = q   - g_{dir}(q)$，其中 $g_{dir}$ 是归一化梯度向量。
3. 使用双线性插值在 $q_1$、$q_2$ 处计算幅值 $M(q_1)$、$M(q_2)$。
4. 若 $M(q)$ 大于 $M(q_1)$ 和 $M(q_2)$，则保留；否则抑制为 0。

**双线性插值（bilinear interpolation）**：

给定四个格点 $Q_{11}=(x1, y1)$，$Q_{12}=(x1, y2)$，$Q_{21}=(x2, y1)$，$Q_{22}=(x2, y2)$，$P=(x, y)$ 点的双线性插值为：
$$
f(P) = f(Q_{11}) (1-\alpha)(1-\beta) + f(Q_{21}) \alpha (1-\beta) + f(Q_{12}) (1-\alpha)\beta + f(Q_{22}) \alpha \beta
$$
其中 $\alpha = \frac{x   - x_1}{x_2   - x_1}$，$\beta = \frac{y   - y_1}{y_2   - y_1}$.

本质上就是按照距离整点的距离比例进行加权。

![图1：双线性插值](/images/note/cv-intro/02-edge-01-bilinear-interpolation.jpg)

**简化 NMS**：

离散化为 8 个方向并直接比较相邻像素。

#### Hysteresis Thresholding

滞后阈值算法，用以形成**连续**边缘，可以强化边缘并抑制噪声。

首先确定两个阈值：$maxVal$，$minVal$. 可按通过 NMS 的像素平均幅值设定：
$$
maxVal = 0.3 × average \\
minVal = 0.1 × average
$$

对于像素点 $q$，幅值 $M(q)$：

- 若 $M(q) \ge \text{maxVal}$：强边缘，保留并允许连接。
- 若 $M(q) \lt \text{maxVal}$：非边缘，抛弃。
- 若 $minVal \le M(q) \lt \text{maxVal}$：弱边缘，仅在与强边缘连通时保留。

边缘增长（Edge Linking）步骤：

1. 遍历图像，遇到强边缘开始增长；
2. 对当前边缘像素，检查在边缘方向（垂直梯度方向）上的两个相邻像素，若任一像素方向与该像素 bin 相同、幅值足够、通过 NMS 判定，则将其也标记为边缘，并继续增长；
3. 循环直到不能继续增长为止。

### Canny Edge Detector

上述流程即使标准的 Canny 算法：

1. 用导数 Gaussian 计算梯度分量 $G_x$、$G_y$。
2. 计算梯度幅值和方向。
3. 非极大值抑制（NMS）将响应细化到单像素宽。
4. 使用滞后阈值并做边缘连接（Hysteresis + Edge Linking）产生最终的边缘线条。

**注**：

- Canny 算法涉及很多 Hyper Parameter，如 $\sigma$、$maxVal$、$minVal$. 其中尺度选择（$\sigma$）是关键。$\sigma$ 大时噪声更少但定位差；$\sigma$ 小时定位好但对噪声敏感。通常对同一图像做多尺度检测以获得更稳健结果。
- 对颜色图像通常先将颜色图像转换为灰度。也可以使用基于颜色梯度的扩展方法（多通道合并或向量梯度）。
