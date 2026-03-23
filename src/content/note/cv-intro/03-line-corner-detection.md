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

也即卷积在滑动前会将核翻转（flip），在一维中是时间反转；互相关不翻转核。我们一般使用的是互相关运算，但是库函数称之为 `convolution`，实际上两者不同。

|   | Convolution | Correlation |
|---|---|---|
||||

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

**注**：一般定义 $P$ 表示每侧（左右/上下）的填充像素数。

### Implementation of Convolution

用循环实现卷积在 CPU/GPU 上效率低。想办法将卷积转化为矩阵乘法并使用并行可以大大提高速率。

#### Step

假设 kernel/filter 尺寸为 $K \times K$，image 尺寸为 $H \times W$.
1. Kernel Flattening：
   将 $K \times K$ 的 kernel 展平为 $1 \times K^2$ 行向量。若有多个kernel，则形成 $num_{\text{kernels}} \times K^2$ 的权重矩阵。
2. im2col：对于输入图像，遍历每个 sliding window，将每个 $K \times K$ 的 patch 展平为长度 $K^2$ 的列向量，并把这些列向量按列拼接成一个 $K^2 \times N$ 的矩阵，其中 $N = H_{out} * W_{out}$，$H_{out}$、$W_{out}$ 来自计算得到的 output size。
3. GEMM：将 flattening 的核矩阵与 im2col 得到的数据矩阵做矩阵乘法，得到 $num_{\text{kernels}} \times N$ 的结果矩阵。
4. Output Reconstruction：将结果矩阵 reshape 为 $num_{\text{kernels}} \times H_{out} \times W_{out}$。

**注**：
- 还可以使用 Toplitz 的方式实现（16:13）
- im2col 把许多重叠 patch 展示为独立列，内存开销较大。实现时需权衡内存与速度（例如分块实现、使用 cuDNN 优化或直接使用卷积算法）。
- GEMM 高度向量化并在 GPU 上有专门加速（BLAS/cuBLAS），所以比逐点循环快很多。

---

## Line Fitting

直线可以描述许多目标，因此线检测是经典任务。仅仅做边缘检测并不能直接得到直线，因为可能受到遮挡、非直线结构、多条线如何选择等。
两种思路：
- 先检测边缘，再做拟合。
- 使用投票方法（Hough Transform）或鲁棒拟合（RANSAC）。

matrix cookbook

### Least Squares

若已知一系列点 $(x_i, y_i)$，希望拟合直线 $y = kx + m$。可以用最小二乘法通过最小化残差平方和求解参数。
也即：
$$
\min_{k,m} \sum_{i=1}^n (y_i - (k x_i + m))^2
$$
矩阵形式：
$$
\min_{\boldsymbol{\theta}} \| A\boldsymbol{\theta} - \boldsymbol{y} \|_2^2 \Leftrightarrow \min_{\boldsymbol{\theta}} (A\boldsymbol{\theta} - \boldsymbol{y})^T (A\boldsymbol{\theta} - \boldsymbol{y})
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
其中 $U$ 为 $n \times n$ 正交阵，$V = \begin{bmatrix} \boldsymbol{v}_1^T \\ \boldsymbol{v}_2^T \\ \boldsymbol{v}_3^T \end{bmatrix}$ 为 $3 \times 3$ 正交阵，$D = \begin{bmatrix} diag\{\lambda_1, \lambda_2, \lambda_3\} \\ O_{(n-3) \times 3} \end{bmatrix}$ 为类对角矩阵，包含奇异值 $|\lambda_1| \ge |\lambda_2| \ge |\lambda_3|$。
将 $h$ 分解到 $V$ 的正交标架下：
$$
\boldsymbol{h} = \alpha_1 \boldsymbol{v}_1 + \alpha_2 \boldsymbol{v}_2 + \alpha_3 \boldsymbol{v}_3
$$
由于 $ \|\boldsymbol{h}\| = 1 $ 从而 $\alpha_1^2 + \alpha_2^2 + \alpha_3^2 = 1$ ：
$$
\| Ah \| = \| U D V^T h \| = \| D V^T h \| \\
= \| D \begin{bmatrix} \alpha_1 \\ \alpha_2 \\ \alpha_3 \end{bmatrix} \| = \| \begin{bmatrix} \lambda_1 \alpha_1 \\ \lambda_2 \alpha_2 \\ \lambda_3 \alpha_3 \\ O^T \end{bmatrix} \| = (\lambda_1 \alpha_1)^2 + (\lambda_2 \alpha_2)^2 + (\lambda_3 \alpha_3)^2
$$
从而解析解为 $\boldsymbol{h} = \pm \boldsymbol{v}_3$. 几何直观即：解为最小伸缩的方向。

### RANSAC

最小二乘对异常值（outliers）非常敏感，少数严重偏离点会破坏整体拟合。

随机采样一致性算法（**RAN**dom **SA**mple **C**onsensus）可以解决这个问题。
思想是通过大量随机采样最小样本集，生成候选模型并统计内点，最终选择支持内点最多的模型。

#### Step

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

定义窗口大小为 $ (2b+1) \times (2b+1) $，位于 $(x_0,y_0)$，平移量为 $(u,v)$，考虑如下**能量**：
$$
E_{x_0,y_0}(u,v) = \sum_{(x,y)\in N(x_0,y_0)} [I(x+u,y+v) - I(x,y)]^2
$$
其中 $I(\cdot,\cdot)$ 为图像强度，$N(x_0,y_0)$ 为以 $(x_0,y_0)$ 为中心的窗口。
使用一阶泰勒展开（假设 $u$，$v$ 很小）可得：
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
M(x_0,y_0) = \sum_{(x,y)\in N(x_0,y_0)} \begin{bmatrix} I_x^2(x,y) & I_x(x,y) I_y(x,y) \\ I_x(x,y) I_y(x,y) & I_y^2(x,y) \end{bmatrix}
$$
也可以表示为卷积形式：
$$
M(x_0,y_0) = \begin{bmatrix}
w(x_0,y_0) * I_x^2 & w(x_0,y_0) * I_x I_y \\
w(x_0,y_0) * I_x I_y & w(x_0,y_0) * I_y^2
\end{bmatrix}
$$
其中 $w(x_0, y_0) = \begin{cases} 1, \quad if (x, y) \in N(x_0, y_0) \\ 0, \quad otherwise\end{cases}$

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
\theta
= \frac{1}{2} \underbrace{(\lambda_1 \lambda_2 - 2 \alpha (\lambda_1 + \lambda_2)^2)}_{(1)} + \frac{1}{2} \underbrace{(\lambda_1 \lambda_2 - 2t)}_{(2)} \\
= \lambda_1 \lambda_2 - \alpha (\lambda_1 + \lambda_2)^2 - t \\
= \det{M} - \alpha (\mathbb{tr}M)^2 - t
$$
即为 Harris 响应。若 $\theta$ 大且为正则为角点；若 $\theta$ 负并且绝对值大则为边缘；若 $\theta$ 接近 0 则为平坦区域。

**注**：其中 $\alpha$，$t$ 均为超参数

#### Window Function

两类窗口：
- Rectangle window：窗函数对窗内均匀加权，不具旋转不变性。
- Gaussian window：用高斯核加权，具有旋转不变性和平滑性。

其中高斯窗口：
$$
g_\sigma(x,y) = \frac{1}{2\pi\sigma^2} \exp \big(-\frac{x^2+y^2}{2\sigma^2}\big)
$$

#### Step

Harris Detector 在实际实现中通常步骤为：
1. 计算图像梯度 $I_x, I_y$，并计算 $I_x^2, I_y^2, I_x I_y$，得到与原图像同维度的三张梯度图。
2. 对上述三图用高斯滤波 $g_\sigma$ 卷积得到三张与原图像同维度的高斯图。
3. 对于像素点 $(x_0, y_0)$，使用三张高斯图对应位置的三个数构成二阶对称阵，计算 $\theta$，并进行阈值二值化 $\theta > 0$。
4. 非极大值抑制（**NMS**） 保留局部极大值作为关键点位置。

#### Equivariance & Invariance

- 概念区分：
  - Equivariance（等变）：若对输入做变换 $T$，输出也按某方式变化：$T[f(X)] = f(T(X))$。例如像素坐标平移会导致检测结果平移（等变）。
  - Invariance（不变）：若对输入做变换 $T$，输出不变：$f(X) = f(T(X))$。
- Harris Detector 的性质：
  - 对图像平移（Translation）和图像旋转（Rotation）是等变（equivariant）：即检测到的角点在经过平移/旋转后会相应地平移/旋转到新位置（检测器依旧能检测到）。
  - 对尺度（Scale）不具不变性（not scale-invariant）：尺度改变会导致角点检测结果变化（需要使用尺度不变检测器，如 SIFT 的 DoG 检测）。
- PPT 中对等变/不变的形式写法：
  - 若 $T$ 是变换，$f$ 是检测函数，
    - 等变：$T[f(X)] = f(T(X))$。
    - 不变：$f(X) = f(T(X))$。

💡 常见疑问与解答
- Q: “Harris 为什么对尺度不不变？”  
  A: 因为窗口大小与滤波尺度固定，若图像缩放，窗口覆盖不同的结构尺度，M 的统计会变化，从而影响 R。
- Q: “非极大值抑制窗口应多大？”  
  A: 常见是 3×3 或 5×5，窗口大小依关键点密度与精度要求选择；太大可能抑制真实邻近角点，太小可能导致密集重复点。
- Q: “Harris 能不能直接替代 SIFT 的关键点检测？”  
  A: 不行。Harris 主要对旋转和平移等变，但对尺度变化敏感；若需要尺度不变性，应使用 SIFT 的 DoG（Difference of Gaussians）或 SURF 等多尺度检测方法。
