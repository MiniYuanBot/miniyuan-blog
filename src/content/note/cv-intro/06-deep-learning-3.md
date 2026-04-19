---
title: '深度学习 3'
excerpt: '26 春 计算机视觉导论 L06'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'April 19 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

- 常见架构模板（卷积网络）：
  - [(Conv - **BN** - ReLU) *N - Pool?]* m - (FC - BN - ReLU) * K - FC - Softmax
  - 注意：一般最后一层不做 BatchNorm。
- 深度网络训练技巧：归一化（**BatchNorm** / **GroupNorm**）、残差连接（**Residual / Skip**）、正则化与数据增强（Data Augmentation / Dropout）

## Set a loss function

对于一个具体的图像识别问题，假设进行图像识别的类别总数已知，也即 **closed vocabulary** 问题。

由于分类总数变多，我们需要使用新的**多分类**函数与对应的损失函数。

**任务定义**：

将输入图像 $x$ 分类到已知的 $K$ 个类别之一

- 输入 $x$ 为 RGB 图像。
- 标签 $y$ 为 one-hot 向量。
- 输出为每类的预测分数（概率）。

**注**：实际上现在的 LLM 处理的已经是 **open vocabulary** 问题了，也即识别类别没有界限。

### Softmax Activation

$$
\sigma(z)_i = \frac{\exp(\beta z_i)}{\sum_{j=1}^K \exp(\beta z_j)},\quad i=1,\dots,K
$$
其中：

- $z$：原始输出，$z_i$ 为第 $i$ 类的原始打分（**logit**）
- $K$：类别总数
- $β$：温度参数（默认为 1）

当 $\beta \to \infty$ 时 $\sigma \to \text{one-hot}$，当 $\beta \to 0$ 时 $\sigma \to \text{Uniform}$。
一般地， 温度越高（$\beta$ 越大）概率分布会越硬化，也即放大 logit 之间的差异。

**注**：

- one-hot 输出 01 向量，argmax 输出索引值
- 当 $K=2$ 时 Softmax 与 Sigmoid 等价。也即：
    $$
    \sigma\left(\begin{bmatrix} z \\ 0 \end{bmatrix} \right)_1 = \text{Sigmoid}(z)
    $$

### Cross-Entropy

常用 NLL/CE：
$$
\mathcal{L}_{CE} = -\sum_{k=1}^K P(k)\log Q(k) = H(P, Q)
$$
其中 $P(k)$ 为真实标签，$Q(k)$ 为模型预测概率。

当真实标签是类别 $k$ 的 one-hot 向量时，单个样本的损失即为：
$$
\ell = -\log Q(k)
$$

**性质**：

- $\mathcal{L}_{CE} = H(P, Q) \in [0, +\infty)$
- 对于随机权重初始化下，初始计算出的损失约为 $\mathcal{L}_{CE}^{(0)} \approx \log K$，其中 $K$ 为类别总数。
    事实上，随机初始化下首次预测应是公平的。

### KL divergence

KL 散度用于比较两个分布 $P$ 与 $Q$ 之间的差异。
$$
D_{KL}(P\|Q)
= \sum_{x\in\mathcal{X}} P(x)\log\frac{P(x)}{Q(x)}
= H(P, Q) - H(P)
$$
其中 $H(P, Q)$ 为交叉熵，$H(P)$ 为熵。

**性质**：

- 非负性：$D_KL(P\|Q) \ge 0$，等号当且仅当 $P = Q$
- 非对称性：$D_KL(P\|Q) \ne D_KL(Q\|P)$
- 不满足三角不等式

**注**：

- 衡量 $Q$ 对 $P$ 的描述能力差多少。故用于多分类损失函数时，取 $P$ 为真实标签，$Q$ 为模型预测概率。
- 对于固定的真实标签，$H(P)$ 为常数。特殊地，one-hot 时 $H(P) = 0$。故 KL 散度和 CE/NLL 是等价的。

---

## Normalization

对于深层神经网络，由于层与层之间的参数分布差异会随训练逐渐显著，而每次 backpropagation 使用相同的学习率，可能导致最终浅层网络与深层网络的 error 差异显著。

解决办法是进行 Batch Normalization。通过对 mini-batch 内每个激活做归一化来稳定训练、加速收敛，并在一定程度上起到正则化作用。

### BatchNorm Layer

**Train Mode**：

设当前 mini-batch 为 $B$，包含 $N = |B|$ 个样本。
激活值 $x \in \mathbb{R}^{N \times C \times H \times W}$，其中 $C$ 为通道数，$H, W$ 为高和宽。

对每个通道 $c$，在该 batch $B$ 上的所有激活值集合大小为
$$
m = N \times H \times W
$$
则 $B$ 中通道 $c$ 的均值为：
$$
\mu_{B, c} = \frac{1}{m}\sum_{n=1}^N \sum_{h=1}^H \sum_{w=1}^W x_{n, c, h, w}
$$
$B$ 中通道 $c$ 的方差为：
$$
\sigma_{B, c}^2 = \frac{1}{m}\sum_{n=1}^N \sum_{h=1}^H \sum_{w=1}^W (x_{n, c, h, w} - \mu_{B, c})^2
$$
归一化：
$$
\hat x_{n, c, h, w} = \frac{x_{n, c, h, w} - \mu_{B, c}}{\sqrt{\sigma_{B, c}^2 + \epsilon}}
$$
线性变换：
$$
y_{n, c, h, w} = \gamma_c \hat x_{n, c, h, w} + \beta_c
$$
其中 $\epsilon$ 为小常数，$\gamma_c, \beta_c$ 为需要学习的尺度和平移参数。

**注**：

- 共需学习 $2C$ 个参数，注意参数是与 batch 无关的。
- 在 backpropagation 时，上述 $\gamma_c, \beta_c, \mu, \sigma$ 都会用到。

**Eval Mode**：

训练中维护每个通道的**滑动平均**均值和方差（running mean and variance）：
$$
\mu_{\text{run}, c} \leftarrow \rho \cdot \mu_{\text{run}, c} + (1 - \rho) \cdot \mu_{B, c}
$$
$$
\sigma^2_{\text{run}, c} \leftarrow \rho \cdot \sigma^2_{\text{run}, c} + (1 - \rho) \cdot \sigma^2_{B, c}
$$
其中 $\rho$ 为动量，通常取 0.9 或 0.99，初始时 $\mu_{\text{run}, c} = 0, \sigma^2_{\text{run}, c} = 1$。

验证/测试时：
$$
\hat x_{n,c,h,w} = \frac{x_{n,c,h,w} - \mu_{\text{run}, c}}{\sqrt{\sigma^2_{\text{run}, c} + \epsilon}}
$$
$$
y_{n,c,h,w} = \gamma_c \hat x_{n,c,h,w} + \beta_c
$$

也即等价于一个 Linear Layer。

**注**：

- 最后一层不使用 BatchNorm，因为最后输出不应该假设服从 Gauss 分布。
- 有时候还会把 running variance 修正为无偏估计量，也即：
    $$
    \sigma^2_{\text{run}, c} \leftarrow \rho \cdot \sigma^2_{\text{run}, c}
    + (1-\rho) \cdot \frac{m}{m-1} \sigma^2_{B, c}
    $$

### BatchNorm Pros

- BatchNorm 最初的想法是减少 **internal covariate shift**（内部协变量偏移），也即网络中间层的输入分布在训练过程中不断漂移，导致训练困难。
    而 BatchNorm 归一化了每层输入的分布，减少了这种 shift
- 后续研究认为更加重要的是 BatchNorm 可以平滑化 **loss landscape**，也即使得损失函数更加平滑，
    从而使梯度方向更一致、尺度更稳定，允许更大的学习率、更快收敛。
- 存在 batch dependence，也即同一 batch 中的样本会相互影响。从而引入了微小的 **batch noise** 带来轻微的正则化。

### BatchNorm Cons

- 也是由于 batch dependence 的存在，当 batch size 很小时，batch mean / variance 不稳定，
    并且训练时使用 batch mean / variance，验证/测试时使用 running mean / variance，导致**性能不一致**。
- 本质上 BatchNorm 假设了所有 $N \times H \times W$ 个数值独立同分布，从而对**分布高度相关**的实例不适用。

### Other Normalizations[^1]

- **LayerNorm**：按单个样本做归一化，常用于 RNN / Transformer。
- **InstanceNorm**：按单个样本的单个通道做归一化，常用于具有明显样本风格的图像工作。
- **GroupNorm**：把通道分组后在组内归一化，适合小 batch 或样本高度相关场景。

![图 1：Normalizations，每个都是对蓝色区域进行归一化 | width=100%](/images/note/cv-intro/06-deep-learning-3-01-normalizations.png)

[^1]: 图片来自 [Wu, Y., & He, K. (2018). Group Normalization.](https://doi.org/10.1007/978-3-030-01261-8_1)

**注**：

- 当蓝色覆盖 $N$ 的维度时即不会有 batch dependence，故这三者均没有。
- 实际上，实验证明 BatchNorm 的问题在 batch size 足够大时影响很小，并且效果也是最好的。当资源有限时，使用 GroupNorm 是一种权宜之计。

---

## 结构性解决方式：残差连接（Residual / Skip）

- ResNet 提出的残差块把恒等映射加入层内：
  - 原始块：y = F(x) + x
- 从反向传播视角，skip link 为梯度提供了旁路（bypass），缓解梯度消失/爆炸并促进训练更深的网络。
- 课件引用研究：skip connections 促成更平坦的最小值（flat minima），从而改善可训练性和泛化。

## Loss Landscape（损失地形）

- 随着网络加深，损失地形可能由近似凸转为高度混沌（chaotic），导致训练困难。skip connections 有助于保持可控的损失地形。

**Q1: 残差网络能无限深入吗？**  
> 虽然残差结构显著缓解了深层训练难题，但无限加深并不总是带来好处，仍受计算资源、数据量和正则化等因素制约。

**Q2: “平坦最小值”为什么更好？**  
> 平坦最小值意味着在参数微小扰动下损失变化不敏感，通常与更好的泛化性能相关。

---

## Regularization（正则化）、Data Augmentation 与 Dropout

目标是减少模型在训练集上学习噪声（overfitting），提升在未见数据上的泛化能力。

### 常见正则化技术

- L2 正则化（权重衰减）：在损失上加项 λ ||W||^2：

$$
\mathcal{L}_{reg} = \mathcal{L}_{main} + \frac{\lambda}{2}\|W\|^2
$$

- Dropout（丢弃法）：
  - 训练时随机以概率 p 将神经元输出置 0（相当于随机子网络训练）。
  - 测试时通常按保留概率做缩放（或在训练时缩放激活）。
  - 目的是减少神经元之间的共同适应性，作为一种模型正则化方法。
- Early stopping（提前停止）：根据验证集性能停止训练，避免过拟合。
- BatchNorm 也起到一定正则化效果（因 batch 内统计带来的噪声）。

#### Dropout 的数学/实践要点

- 训练阶段：对于每个神经元 i，采样 r_i ∼ Bernoulli(1-p)，输出变为 r_i * a_i。
- 测试阶段：使用全部神经元，但将输出乘以 (1-p) 或在训练时对激活做缩放（inverted dropout），以保证期望一致。
- 适用场景：对大型全连接层较有效，卷积层上通常使用较少或不用（现代 CNN 更依赖 BN）。

#### 数据增强的细化

- Magnitude（强度）控制很重要：过强会破坏关键信息，过弱作用有限。通常通过超参数调优或经验设定。

**Q1: Dropout 与 BatchNorm 可以一起用吗？**  
> 在实践中，BatchNorm 已带来一定正则化效果，很多卷积网络在使用 BatchNorm 后可以减少或不使用 Dropout；对于大 FC 层仍常见使用 Dropout。

**Q2: L2 与 Dropout 哪个更重要？**  
> 两者侧重点不同：L2 限制权重大小，Dropout 引入结构噪声以避免共同适应。常结合使用，效果更稳健。

---

## 小结

**Q2: 学习率太大导致训练发散，怎么办？**  
> 尝试减小 lr、加上 warmup、使用梯度裁剪（gradient clipping），或临时换到更稳健的优化器（如 Adam）观察变化。
