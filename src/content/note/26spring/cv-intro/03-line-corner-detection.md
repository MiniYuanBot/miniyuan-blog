---
title: '线检测与角点检测'
excerpt: '26 春 计算机视觉导论 L03'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'March 20 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Convolution Operator

### Convolution VS Cross-Correlation

**卷积**与**互相关**的核心思想相同：滑动一个核（kernel）在输入图像上，在每个位置计算对应元素乘积的和。

#### 1D

卷积：
$$
(f * g)[n] = \sum_{m=-\infty}^{\infty} f[m] \, g[n - m]
$$
互相关：
$$
(f \star g)[n] = \sum_{m=-\infty}^{\infty} f[m] \, g[n + m]
$$

#### 2D

卷积：
$$
(f * g)[i, j] = \sum_{m=-\infty}^{\infty} \sum_{n=-\infty}^{\infty} f[i - m, j - n] \, g[m, n]
$$
互相关：
$$
(f \star g)[i, j] = \sum_{m=-\infty}^{\infty} \sum_{n=-\infty}^{\infty} f[i + m, j + n] \, g[m, n]
$$

#### Difference

卷积在滑动前会将核翻转（flip），在一维中是时间反转；互相关不翻转核。我们一般使用的是互相关运算，但是库函数称之为 `convolution`，实际上两者不同。

| | **卷积 (Convolution)** | **互相关 (Correlation)** |
| :--- | :--- | :--- |
| **直观理解** | 滤波 (Filter) | 模板匹配 (Template matching) |
| **交换律** | Y | N |
| **结合律** | Y | N |
| **分配律** | Y | N |
| **卷积定理** | $\mathcal{F}(f * g) = \mathcal{F}(f) \cdot \mathcal{F}(g)$ <br>（时域卷积 = 频域乘积） | $\mathcal{F}(f \star g) = \mathcal{F}(f) \cdot \overline{\mathcal{F}(g)}$ <br>（频域包含复共轭） |

### Padding

#### Importance

- 防止输出空间尺寸缩小（spatial shrinkage），在深网络中保持尺寸一致很重要。
- 保留边缘信息。若不 padding，图像边缘像素被卷积核覆盖次数少，信息利用率低。

#### Padding Types

- Zero padding：以 0 填充。
- Replicate padding：以边缘像素复制填充。

#### Output Size

注意这是对某个方向 output size 的计算。各个方向应该分别计算。

$$
W_{out} = \left\lfloor \frac{W_{in} + 2P - K}{S} \right\rfloor + 1
$$
其中：

- $W_{in}$：该方向的输入宽度。
- $P$：该方向每侧的填充像素数，假设两侧填充一致。
- $K$：该方向的卷积核宽度。
- $S$：该方向的步幅。
- $W_{out}$：该方向的输出宽度。

### Implementation of Convolution

用循环实现卷积在 CPU/GPU 上效率低。想办法将卷积转化为矩阵乘法并使用并行可以大大提高速率。

#### im2col

**符号定义**：

| 符号 | 含义 | 维度 |
| :--- | :--- | :--- |
| $\mathbf{X} \in \mathbb{R}^{C_{in} \times H \times W}$ | 输入特征图 | $(C_{in}, H, W)$ |
| $\mathbf{K} \in \mathbb{R}^{C_{out} \times C_{in} \times K \times K}$ | 卷积核权重 | $(C_{out}, C_{in}, K, K)$ |
| $\mathbf{b} \in \mathbb{R}^{C_{out}}$ | 偏置向量 | $(C_{out},)$ |
| $\mathbf{Y} \in \mathbb{R}^{C_{out} \times H_{out} \times W_{out}}$ | 输出特征图 | $(C_{out}, H_{out}, W_{out})$ |
| $(s_h, s_w)$ | 步长 | - |
| $(p_h, p_w)$ | 填充 | - |

其中输出空间尺寸：
$$
H_{out} = \left\lfloor \frac{H + 2p_h - K}{s_h} \right\rfloor + 1,
\quad W_{out} = \left\lfloor \frac{W + 2p_w - K}{s_w} \right\rfloor + 1
$$

令 $N = H_{out} \cdot W_{out}$ 表示输出位置的总数。

**Kernel Flattening**：

将每个输出通道的卷积核**展平为行向量**：

$$
\mathbf{W}_{i} = \text{vec}\left(\mathbf{K}_{i, :, :, :}\right)^\top \in \mathbb{R}^{1 \times (C_{in} \cdot K^2)}
$$

其中 $\text{vec}(\cdot)$ 表示按通道优先顺序展平：
$$
\text{vec}\left(\mathbf{K}_{i, :, :, :}\right)
= \left[ \text{vec}\left(\mathbf{K}_{i, 0, :, :}\right)^\top, \text{vec}\left(\mathbf{K}_{i, 1, :, :}\right)^\top,
\ldots, \text{vec}\left(\mathbf{K}_{i, C_{in}-1, :, :}\right)^\top \right]^\top
$$

堆叠所有输出通道形成**权重矩阵**：
$$
\mathbf{W} = \begin{bmatrix} \mathbf{W}_0 \\ \mathbf{W}_1 \\ \vdots \\ \mathbf{W}_{C_{out}-1} \end{bmatrix}
\in \mathbb{R}^{C_{out} \times (C_{in} \cdot K^2)}
$$

**Patch Flattening**：

对于每个输出位置 $(i, j)$，$i \in [0, H_{out})$, $j \in [0, W_{out})$，定义对应的输入感受野：

$$
\mathcal{P}_{i,j} = \left\{ (c, h, w) \,\middle|\, c \in [0, C_{in}),\, h \in [h_0, h_0+K),\, w \in [w_0, w_0+K) \right\}
$$
其中 $(h_0, w_0) = (i \cdot s_h - p_h, j \cdot s_w - p_w)$。

提取 patch 并**展平为列向量**：
$$
\mathbf{x}_{i,j} = \text{vec}\left(\mathbf{X}_{:, h_0:h_0+K, w_0:w_0+K}\right) \in \mathbb{R}^{C_{in} \cdot K^2}
$$

**im2col**：

将所有输出位置对应的列向量按列拼接，形成 **im2col 矩阵**：
$$
\mathbf{X}_{col} =
\begin{bmatrix} \mathbf{x}_{0,0} & \cdots & \mathbf{x}_{0,W_{out}-1} & \mathbf{x}_{1,0} & \cdots
& \mathbf{x}_{H_{out}-1,W_{out}-1} \end{bmatrix} \in \mathbb{R}^{(C_{in} \cdot K^2) \times N}
$$

其中列索引 $t = i \cdot W_{out} + j$ 对应输出位置 $(i, j)$。

**GEMM**：

执行矩阵乘法并加上偏置：
$$
\mathbf{Y}_{mat}
= \mathbf{W} \cdot \mathbf{X}_{col} + \mathbf{b} \cdot \mathbf{1}_N^\top \in \mathbb{R}^{C_{out} \times N}
$$

其中 $\mathbf{1}_N \in \mathbb{R}^{N}$ 为全 1 向量，偏置通过广播机制相加。

**Reconstruction**：

将结果矩阵 reshape 回张量形式：

$$
\mathbf{Y} = \text{reshape}\left(\mathbf{Y}_{mat}, (C_{out}, H_{out}, W_{out})\right)
$$

具体地，对于每个输出通道 $c_{out}$ 和空间位置 $(i, j)$：
$$
\begin{aligned}
\mathbf{Y}_{c_{out}, i, j}
&= \left[\mathbf{Y}_{mat}\right]_{c_{out},\, i \cdot W_{out} + j} \\
&= \sum_{d=0}^{C_{in} \cdot K^2 - 1} \mathbf{W}_{c_{out}, d} \cdot
\left[\mathbf{X}_{col}\right]_{d, i \cdot W_{out} + j} + \mathbf{b}_{c_{out}} \\
&= \mathbf{W}_{c_{out}} \cdot \mathbf{x}_{i, j} + \mathbf{b}_{c_{out}}
\end{aligned}
$$

**全过程**：

$$
\mathbf{X}
\xrightarrow{\text{im2col}} \mathbf{X}_{col}
\xrightarrow{\mathbf{W} \cdot (\cdot) + \mathbf{b}} \mathbf{Y}_{mat}
\xrightarrow{\text{reshape}} \mathbf{Y}
$$

**注**：

- im2col 把许多重叠 patch 展示为独立列，内存开销较大。实现时需权衡内存与速度（例如分块实现、使用 cuDNN 优化或直接使用卷积算法）。
- GEMM 高度向量化并在 GPU 上有专门加速（BLAS/cuBLAS），所以比逐点循环快很多。

#### Toplitz

---

## Line Fitting

直线可以描述许多目标，因此线检测是经典任务。仅仅做边缘检测并不能直接得到直线，因为可能受到遮挡、非直线结构、多条线如何选择等。
两种思路：

- 先检测边缘，再做拟合。
- 使用投票方法（Hough Transform）或鲁棒拟合（RANSAC）。

### Least Squares

若已知一系列点 $(x_i, y_i)$，希望拟合直线 $y = kx + m$。可以用最小二乘法通过最小化残差平方和求解参数。
也即：
$$
\min_{k,m} \sum_{i=1}^n (y_i - (k x_i + m))^2
$$
矩阵形式：
$$
\min_{\boldsymbol{\theta}} \| A\boldsymbol{\theta} - \boldsymbol{y} \|_2^2
\Leftrightarrow \min_{\boldsymbol{\theta}} (A\boldsymbol{\theta} - \boldsymbol{y})^T (A\boldsymbol{\theta} - \boldsymbol{y})
$$
其中
$$
A = \begin{bmatrix} x_1 & 1 \\ x_2 & 1 \\ \vdots & \vdots \\ x_n & 1 \end{bmatrix},\quad
\boldsymbol{\theta} = \begin{bmatrix} k \\ m \end{bmatrix},\quad
\boldsymbol{y} = \begin{bmatrix} y_1 \\ y_2 \\ \vdots \\ y_n \end{bmatrix}
$$
最小二乘解析解：
$$
\boldsymbol{\theta} = (A^\top A)^{-1} A^\top \boldsymbol{y}
$$
**注**：
若拟合直线接近竖直，原有斜率参数不稳定。

### Imperoved Least Squares

由于前述方法下，当直线竖直时，斜率无穷，最小二乘解不稳定。故我们应当使用一般直线方程求解。也即：
$$
\min_{a,b,d} \sum_{i=1}^n (a x_i + b y_i - d)^2
$$
但是为了解的唯一性（并且防止平凡解 $a = b = d = 0$），我们可以添加约束 $a^2 + b^2 + d^2 = 1$。得到矩阵形式：
$$
\min_{\boldsymbol{h}} \|A \boldsymbol{h}\|^2
$$
其中
$$
A = \begin{bmatrix} x_1 & y_1 & 1 \\ x_2 & y_2 & 1 \\ \vdots & \vdots & \vdots \\ x_n & y_n & 1 \end{bmatrix},\quad
\boldsymbol{h} = \begin{bmatrix} a \\ b \\ d \end{bmatrix},\quad
\|\boldsymbol{h}\| = 1
$$

我们可以通过 **SVD** 求解。对矩阵 $A$ 进行奇异值分解得：
$$
A_{n\times 3} = U_{n\times n} D_{n\times 3} V_{3\times 3}^\top
$$
其中 $U$ 为 $n \times n$ 正交阵，$V = \begin{bmatrix} \boldsymbol{v}_1^T \\ \boldsymbol{v}_2^T \\ \boldsymbol{v}_3^T \end{bmatrix}$
为 $3 \times 3$ 正交阵，$D = \begin{bmatrix} diag\{\lambda_1, \lambda_2, \lambda_3\} \\ O_{(n-3) \times 3} \end{bmatrix}$
为类对角矩阵，包含奇异值 $|\lambda_1| \ge |\lambda_2| \ge |\lambda_3|$。
将 $h$ 分解到 $V$ 的正交标架下：
$$
\boldsymbol{h} = \alpha_1 \boldsymbol{v}_1 + \alpha_2 \boldsymbol{v}_2 + \alpha_3 \boldsymbol{v}_3
$$
由于 $ \|\boldsymbol{h}\| = 1 $ 从而 $\alpha_1^2 + \alpha_2^2 + \alpha_3^2 = 1$ ：
$$
\begin{aligned}
\| Ah \| = \| U D V^T h \| = \| D V^T h \| \\
= \| D \begin{bmatrix} \alpha_1 \\ \alpha_2 \\ \alpha_3 \end{bmatrix} \|
= \| \begin{bmatrix} \lambda_1 \alpha_1 \\ \lambda_2 \alpha_2 \\ \lambda_3 \alpha_3 \\ O^T \end{bmatrix} \|
= (\lambda_1 \alpha_1)^2 + (\lambda_2 \alpha_2)^2 + (\lambda_3 \alpha_3)^2
\end{aligned}
$$
从而解析解为 $\boldsymbol{h} = \pm \boldsymbol{v}_3$. 几何直观即：解为最小伸缩的方向。

### RANSAC

最小二乘对异常值（outliers）非常敏感，少数严重偏离点会破坏整体拟合。

随机采样一致性算法（**RAN**dom **SA**mple **C**onsensus）可以解决这个问题。
思想是通过大量随机采样最小样本集，生成候选模型并统计内点，最终选择支持内点最多的模型。

#### Step of RANSAC

1. 确定构成模型所需的最小样本数 $s$、残差阈值 $\delta$、期望成功概率 $p$（或最大迭代次数 $N$）。
2. 从数据集中随机选择 $s$ 个样本。
3. 根据所选样本拟合一个假设模型（putative model）。
4. 计算所有点相对于该模型的残差（residual），并判断哪些点为内点（$residual \lt \delta$）。
5. 若当前模型的内点数历史最佳，则更新模型与内点集。
6. 重复上述步骤 $N$ 次。结束后，用内点集合重新拟合得到最终模型（可用最小二乘或 SVD）。

#### The Number of Sample

上述步骤中，选择合适的迭代次数 $N$ 是很重要的。

假设数据集整体服从一个真实模型。我们应当使得完成迭代后，出现一次优秀抽样（抽的 $s$ 个样本全是真实模型的内点）的概率尽量大。假设构成模型所需的最少样本数为 $s$，真实模型中外点比例为 $e$，期望出现优秀抽样的概率为 $p$。

则一次抽样为非优秀抽样（ $s$ 个样本中存在真实模型外点）的概率：
$$
1 - (1 - e)^s
$$
$N$ 次抽样中不存在优秀抽样的概率：
$$
(1 - (1 - e)^s)^N = 1 - p
$$
解得：
$$
N = \frac{\log(1 - p)}{\log(1 - (1 - e)^s)}
$$

#### Imperovement

1. 对于超参数 threshold 的选取很重要，可以动态调整进行选取。
2. 由于对噪声的敏感性，仅做一次 RANSAC 不一定能建立很好的模型，但是可以排除很多 outliers。我们可以对剩下的 inliers 再做 Line Fitting（如使用 Least Squares 或者 SVD）.

### Hough Transform

霍夫变换课上不做要求，此处仅简要介绍。

给定图像空间中的样本点。我们的原始任务是：找到**尽可能多点经过的直线**；而我们可以利用点和线的对偶关系，把图像空间中的样本点与参数空间的曲线进行一一对应。从而任务转化为：找到**尽可能多直线相交的点**。

我们常采用直线的法线式方程建立对偶关系：
$$
\rho = x \cos{\theta} + y \sin{\theta}
$$
从而图像空间的点 $(x_0, \; y_0)$ 对应参数空间 $(\rho, \; \theta)$ 中的曲线 $\rho = x_0 \cos{\theta} + y_0 \sin{\theta}$；图像空间的点共线对应参数空间的曲线共点。

**注**：Hough Transform 还可以拓展到圆锥曲线，但是计算复杂度明显上升。

### RANSAC VS Hough

对比：

- 本质上两者都可以视作一种 voting，但是 RANSAC 是在原始图像空间中进行 vote，而 Hough  Transform 是在参数空间中进行 vote。
- RANSAC 适合单模态（single mode）问题（一般检测一条直线）；而 Hough Transform 对多模态效果好（能同时检测多个直线）。
- RANSAC 鲁棒性更好，而 Hough Transform 对噪声不够鲁棒。
- RANSAC 和 Hough Transform 都有一定的超参数，RANSAC 需要选取合适的 threshold，而 Hough Transform 需要选取合适的参数空间离散程度、直线聚类参数等。

---

## Corner Detection

### Corners as Keypoints

图像的关键点应具有如下**性质**：

- Saliency（显著性）：与周围区域有明显区别。
- Repeatability（可重复性）：在不同视角/光照/尺度下能被稳定检测。
- Accurate localization（精准定位）：不能是一个大范围区域。
- Quantity（数量充足）：一张图片应当具有许多关键点。

角点（Corners）一般满足上述性质，是一类好的关键点。我们给出角点的数学定义，依旧使用梯度：角点处，梯度的幅值应当在两个或更多方向上取局部极大值。

### Harris Detector

思想：若窗口向任意方向平移，窗口内像素强度都会显著变化，则该点可能为角点。

#### The Definition fo Energy

考虑一个以 $(x_0,y_0)$ 为中心的窗口 $N(x_0,y_0)$，平移 $(u,v)$，窗口内像素强度的变化程度定义为该点处的**能量**：
$$
E_{x_0,y_0}(u,v) = \sum_{(x,y)\in N(x_0,y_0)} [I(x+u,y+v) - I(x,y)]^2
$$
其中 $I(\cdot,\cdot)$ 为图像强度。
使用一阶泰勒展开（假设 $u, \; v$ 很小）可得：
$$
I(x+u,y+v) - I(x,y) \approx I_x(x,y) u + I_y(x,y) v
$$
代回能量：
$$
E(u,v) \approx \sum_{(x,y)\in N} (I_x(x,y) u + I_y(x,y) v)^2
$$
利用二次型化简得：
$$
E(u,v) \approx \begin{bmatrix} u & v \end{bmatrix}
M(x_0,y_0)
\begin{bmatrix} u \\ v \end{bmatrix}
$$
其中
$$
M(x_0,y_0)
= \sum_{(x,y)\in N(x_0,y_0)} \begin{bmatrix} I_x^2(x,y) & I_x(x,y) I_y(x,y) \\ I_x(x,y) I_y(x,y) & I_y^2(x,y) \end{bmatrix}
$$

#### Window Function

我们可以进一步将二次型 $M$ 表示为卷积形式。常见的有以下两种窗口：

- Rectangle window：窗函数对窗内均匀加权，不具旋转不变性。

  $$
  M(x_0,y_0)
  =
  \begin{bmatrix}
  w(x_0,y_0) * I_x^2 & w(x_0,y_0) * I_x I_y \\
  w(x_0,y_0) * I_x I_y & w(x_0,y_0) * I_y^2
  \end{bmatrix}
  $$
  其中 $w(x_0, y_0) = \begin{cases} 1, \quad if (x, y) \in N(x_0, y_0) \\ 0, \quad otherwise\end{cases}$

- Gaussian window：用高斯核加权，具有旋转不变性和平滑性。

  $$
  M(x_0,y_0)
  =
  \begin{bmatrix}
  g_\sigma(x_0,y_0) * I_x^2 & g_\sigma(x_0,y_0) * I_x I_y \\
  g_\sigma(x_0,y_0) * I_x I_y & g_\sigma(x_0,y_0) * I_y^2
  \end{bmatrix}
  $$
  其中高斯窗口：
  $$
  g_\sigma(x_0,y_0) = \frac{1}{2\pi\sigma^2} \exp \big(-\frac{x_0^2+y_0^2}{2\sigma^2}\big)
  $$

当然由于卷积是一种线性变换，我们可以统一写为：
$$
M(x_0,y_0)
=
\begin{bmatrix}
\mathcal{F}^{(x_0, y_0)}(I_x^2) & \mathcal{F}^{(x_0, y_0)}(I_x I_y) \\
\mathcal{F}^{(x_0, y_0)}(I_x I_y) & \mathcal{F}^{(x_0, y_0)}(I_y^2)
\end{bmatrix}
$$
其中 $\mathcal{F}^{(x_0, y_0)}: \mathbb{R}^{n \times n} \rightarrow \mathbb{R}$

#### Eigenvalues for Classification

$M$ 是对称正半定矩阵，可做特征值分解：
$$
M = Q \begin{bmatrix} \lambda_1 & 0 \\ 0 & \lambda_2 \end{bmatrix} Q^\top
$$
其中 $\lambda_1, \lambda_2 \ge 0$ 为 $M$ 的特征值。
由此得：
$$
E_{(x_0, y_0)}(u, v) \approx \lambda_1 u'^2 + \lambda_2 v'^2
$$
其中 $\begin{bmatrix} u' \\ v' \end{bmatrix} = Q \begin{bmatrix} u \\ v \end{bmatrix}$.

由此可见 $E(u, v)$ 是一个抛物面，两个特征值分别对应抛物面在主轴方向上的曲率。依据 $\lambda_1, \lambda_2$ 的大小可判定点的类型：

- 平坦区域（Flat）：能量在任方向都很小，也即 $\lambda_1 \approx 0, \lambda_2 \approx 0$。
- 边缘（Edge）：沿边缘方向平移能量变化小，垂直方向平移变化大，也即一个特征值大，另一个接近 0。
- 角点（Corner）：沿任意方向平移都会引起能量较大变化，也即两个特征值都大。

#### Corner Response Function

上述判断需要做特征分解，计算成本略高。我们使用一个近似响应函数用以判断角点。
希望角点满足：
$$
1/k \lt \lambda_1/\lambda_2 \lt k \qquad \tag{1}
$$
$$
\lambda_1, \lambda_2 \gt b \qquad \tag{2}
$$
令
$$
\begin{aligned}
\theta
&= \frac{1}{2} \underbrace{(\lambda_1 \lambda_2 - 2 \alpha (\lambda_1 + \lambda_2)^2)}_{(1)}
+ \frac{1}{2} \underbrace{(\lambda_1 \lambda_2 - 2t)}_{(2)} \\
&= \lambda_1 \lambda_2 - \alpha (\lambda_1 + \lambda_2)^2 - t \\
&= \det{M} - \alpha (\mathbb{tr}M)^2 - t \\
&= (\mathcal{F}(I_x^2) \mathcal{F}(I_y^2) - \mathcal{F}(I_x I_y)^2)
- \alpha (\mathcal{F}(I_x^2) + \mathcal{F}(I_y^2))^2 - t
\end{aligned}
$$
即为 Harris 响应。若 $\theta$ 大且为正则为角点；若 $\theta$ 负并且绝对值大则为边缘；若 $\theta$ 接近 0 则为平坦区域。

**注**：其中 $\alpha, \; t$ 均为超参数。

#### Step of Harris

Harris Detector 在实际实现中通常步骤为：

1. 计算图像梯度 $I_x, I_y$，并计算 $I_x^2, I_y^2, I_x I_y$，得到与原图像同维度的三张梯度图。
2. 对上述三图用高斯滤波 $g_\sigma$ 卷积得到三张与原图像同维度的高斯图。
3. 对于像素点 $(x_0, y_0)$，使用三张高斯图对应位置的三个数构成二阶对称阵，计算 $\theta$，并进行阈值二值化 $\theta > 0$。
4. 非极大值抑制（**NMS**） 保留局部极大值作为关键点位置。

#### Equivariance & Invariance

设输入信号空间 $\mathbb{V}$，输出表示空间 $\mathbb{W}$，信号检测函数 $f: \mathbb{V} \rightarrow \mathbb{W}$。

记 $\mathcal{T}$ 为抽象变换集合（如平移 5 像素、旋转 $\pi/2$）。对每个 $\tau \in \mathcal{T}$，同时定义：

- $T_{\mathbb{V}}^{(\tau)}: \mathbb{V} \rightarrow \mathbb{V}$（$\tau$ 在输入空间的实现）
- $T_{\mathbb{W}}^{(\tau)}: \mathbb{W} \rightarrow \mathbb{W}$（$\tau$ 在输出空间的实现）

**Equivariance**（等变性）：对输入信号做变换，输出表示也同样变换。
$$
T_{\mathbb{W}}^{(\tau)}[f(X)] = f(T_{\mathbb{V}}^{(\tau)}(X)), \quad \forall \tau \in \mathcal{T}
$$

**Invariance**（不变性）：对输入信号做变换，输出表示不变。
$$
f(X) = f(T_{\mathbb{V}}^{(\tau)}(X)), \quad \forall \tau \in \mathcal{T}
$$

**注**：上述性质都是检测函数 $f$ 的。

**Harris Detector 的性质**：

记输入图像为 $A \in \mathbb{R}^{n \times n}$。

$$
M(x_0,y_0)
=
\begin{bmatrix}
\mathcal{F}^{(x_0, y_0)}(I_x^2) & \mathcal{F}^{(x_0, y_0)}(I_x I_y) \\
\mathcal{F}^{(x_0, y_0)}(I_x I_y) & \mathcal{F}^{(x_0, y_0)}(I_y^2)
\end{bmatrix}
$$

$$
\theta
= (\mathcal{F}(I_x^2) \mathcal{F}(I_y^2) - \mathcal{F}(I_x I_y)^2)
- \alpha (\mathcal{F}(I_x^2) + \mathcal{F}(I_y^2))^2 - t
$$

$$
\Theta(A) = [\theta(i, j)] \in \mathbb{R}^{n \times n}
$$

以下的讨论不考虑边缘处。

- **所有**的 $\Theta$ 对图像**平移（Translation）等变**：

  记 $T_{u, v}$ 表示平移 $(u, v)$ 个像素，也即 $(T_{u,v}(A))_{x, y} = A_{x-u, y-v}$。则有：
  $$
  T_{u, v}(\Theta(A)) = \Theta(T_{u, v}(A))
  $$

  **证明**：

  只需证明以下三个引理，具体证略。

  - 平移与梯度可交换
    $$
    T_{u,v}\left(\frac{\partial A}{\partial x}\right)
    = \frac{\partial T_{u,v}(A)}{\partial x}, \quad
    T_{u,v}\left(\frac{\partial A}{\partial y}\right)
    = \frac{\partial T_{u,v}(A)}{\partial y}
    $$
  - 平移与代数运算可交换
    $$
    T_{u,v}(A \cdot B) = T_{u,v}(A) \cdot T_{u,v}(B)
    $$
  - 平移与卷积可交换
    $$
    T_{u,v}(g * A) = g * T_{u,v}(A)
    $$

- **各向同性（Isotropic）** 的 filter 产生的 $\Theta$ 对**图像旋转（Rotation）等变**：

  记 $R_\phi$ 表示图像旋转 $\phi$ 角度，即 $(R_\phi(A))_{x,y} = A_{x',y'}$，其中 $(x', y')$ 是 $(x,y)$ 旋转 $-\phi$ 后的坐标。
  filter 为各向同性的核 $g$。
  则有：
  $$
  R_\phi(\Theta(A)) = \Theta(R_\phi(A))
  $$

  **证明**：

  只需证明以下三个引理，具体证略。

  - 旋转与梯度可交换
    $$
    R_\phi\left(\frac{\partial A}{\partial x}\right)
    = \frac{\partial R_\phi(A)}{\partial x'}, \quad
    R_\phi\left(\frac{\partial A}{\partial y}\right)
    = \frac{\partial R_\phi(A)}{\partial y'}
    $$
  - 旋转与代数运算可交换
    $$
    R_\phi(A \cdot B) = R_\phi(A) \cdot R_\phi(B)
    $$
  - 旋转与卷积可交换
    $$
    R_\phi(g * A) \approx g * R_\phi(A)
    $$

  **注**：
  - 约等于是因为在像素网格中考虑，旋转后必须采用插值方式计算像素值。
  - kernel 的 rotation **invariant** 对应于 kernel convolution 的 rotation **equivariant**。

- 对**尺度（Scale）不等变**：
  放大缩小 viewpoint 会导致角点检测结果变化。
  
  **注**：SIFT 的 DoG 检测或 SURF 等是尺度不变的。
