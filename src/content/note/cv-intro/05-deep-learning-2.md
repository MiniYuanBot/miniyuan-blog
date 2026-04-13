---
title: '深度学习 2'
excerpt: '26 春 计算机视觉导论 L04'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'April 02 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

- 术语：人工神经网络（Artificial Neural Network）
  - 生物神经元（Biological Neuron）与类比
  - 脉冲神经网络（Spiking Neural Network）与传统 ANN 的对比
- 使用 MLP 处理视觉信号的问题
- 卷积神经网络（Convolutional Neural Network, **CNN**）简介与动机
  - 二维卷积（复习）
  - 稀疏连接（Sparse Connectivity）与参数共享（Parameter Sharing）
  - 卷积层（Convolutional Layer）结构要点、Padding/Stride/参数量计算
  - 池化（Pooling）：类型与作用
  - 卷积 + 池化作为先验（prior）
- 图像分类（Image Classification）与变换性质（equivariance 与 invariance）
- CNN 的训练流程
  - 数据预处理（Data Preprocessing）
  - 权重初始化（Xavier / He 等）
  - 损失函数与优化（SGD、Momentum、Adam）
  - 学习率（Learning Rate）与调度策略（schedules）、batch 与 epoch 的概念
- 小结与常见疑问（每小节结尾均提供 Q&A）

---

## 术语：人工神经网络（Artificial Neural Network）

### 生物神经元（Biological Neuron）

- 要点（PPT：自学）：
  - 神经元接收许多上游神经元的突触输入；
  - 兴奋性输入产生 EPSP（Excitatory Post-Synaptic Potential），使膜电位上升；
  - 抑制性输入产生 IPSP，使膜电位下降；
  - 神经元对这些输入进行时间积分（temporal integration）；
  - 当膜电位在轴丘（axon hillock / initial segment）处超过阈值时，神经元触发动作电位（spike）；
  - 动作电位沿轴突传播，传给下游神经元。

- 本质理解：神经元是一种时序的阈值非线性单元，包含输入合成、阈值触发和事件传播，强调时间动力学与二值事件传递（spikes）。

### 脉冲神经网络（Spiking Neural Network, **SNN**） vs 传统人工神经网络（**ANN**）

- 对比要点：
  - ANN：连续激活值（continuous activations），通常在每层做一次前向计算，无显式时间状态；
  - SNN：事件驱动（event-driven）以 spikes 表示信息，显式的时间动力学（temporal dynamics），需要时间积分；
  - ANN 更方便做梯度下降与反向传播（backpropagation）；SNN 更接近生物实际，但训练与优化复杂。

类比：ANN 像是在拍静态照片，SNN 像是在记录视频流中每一帧的事件（稀疏、按事件发生）。

💡 常见疑问与解答

- Q: SNN 在视觉任务上有显著优势吗？  
  A: 在功耗和事件驱动传感器（如 event cameras）结合时，SNN 有优势；但在通用视觉任务上，ANN（尤其 CNN）因训练成熟、效果可靠而更常用。
- Q: SNN 为什么训练难？  
  A: 因为 spike 是非微分（非连续）的事件，标准反向传播无法直接应用，需要近似或替代方法（如 surrogate gradient）。

---

## 使用 MLP 处理视觉信号的问题

- 问题 1：将图像展平为向量（flatten）对高分辨率图像代价巨大（参数量、计算量急剧上升）。
  - 例如：一张 256×256 RGB 图像展平为 196,608 维输入，若与较大隐藏层连接参数量非常大，不切实际。
- 问题 2：展平会破坏图像的局部结构（local structure）。图像的空间邻接关系（例如边缘、角点）在展平后丢失，MLP 无法直接利用局部相关性与平移不变性。

解释目的：这正是引入卷积（**Convolution**）的主要动机——利用局部连接与参数共享来高效地处理图像。

💡 常见疑问与解答

- Q: 为什么不直接用更大的 MLP？  
  A: 参数和计算量成为瓶颈，且样本复杂性导致过拟合，无法有效学习局部模式。
- Q: 局部结构具体丢失指什么？  
  A: 比如边缘是相邻像素间的强变化，展平后这些相邻关系不是在输入向量中连续（或不再以二维邻接关系表现），模型难以捕获空间关系。

---

## 卷积神经网络（Convolutional Neural Network, **CNN**）

（PPT 说明大量借用 Stanford CS231N）

### 二维卷积（复习）

- 离散 2D 卷积 / 相关（从 PPT）：
  - 定义（Correlation/Convolution）：  
    $$
    (f * g)[m,n] = \sum_{k=-\infty}^{\infty} \sum_{l=-\infty}^{\infty} f[m+k, n+l]\, g[k,l]
    $$
    - 说明：在离散实现中，通常使用有限大小的 kernel g（例如 F×F），并对图像的相应窗口做加权求和。
  - 高斯核示例（平滑滤波器）：
    $$
    g(x,y) = \frac{1}{2\pi\sigma^2} \exp\left(-\frac{x^2+y^2}{2\sigma^2}\right)
    $$
- 符号解释：
  - f：输入图像（二维离散信号），例如 f[m,n] 表示第 m 行第 n 列像素；
  - g：卷积核（filter / kernel），尺寸通常为 F×F；
  - [f * g](m,n)：卷积后的输出在位置 (m,n) 的值。

- 计算含义：卷积核在输入图像上滑动（sliding window），在每个位置计算加权和，得到特征响应（如边缘、纹理等）。

举例（数值）：

- 输入 3×3 图像 f，kernel 为 2×2：
  - f = [[1,2,3],[4,5,6],[7,8,9]]，g = [[1,0],[0,1]]
  - 在有效（no padding）模式下输出位置 (0,0) = 1*1 + 2*0 + 4*0 + 5*1 = 6。

💡 常见疑问与解答

- Q: 卷积与相关（correlation）有什么区别？  
  A: 数学定义上卷积包含核的翻转，相关没有；在深度学习中，通常实现的是“相关”操作，但仍称为卷积（convolution）。
- Q: 为什么卷积能检测边缘？  
  A: 因为特定的 kernel（如 Sobel）对像素强度梯度响应强，计算加权和后高亮边缘位置。

---

### 卷积层（Convolutional Layer）：重要概念

- 输入尺寸：W1 × H1 × C（宽 × 高 × 通道数）  
- 卷积核（filter）尺寸：F × F × C（深度与输入通道数相同）  
- 卷积核个数（输出通道数 / filters）：K  
- 输出尺寸（在 stride = S, padding = P 下）：
  $$
  W_{out} = \left\lfloor\frac{W_1 - F + 2P}{S}\right\rfloor + 1,\quad
  H_{out} = \left\lfloor\frac{H_1 - F + 2P}{S}\right\rfloor + 1
  $$
  - 符号说明：
    - W1, H1：输入宽/高；
    - F：核尺寸（假设方形）；
    - P：padding（在输入边界补零的宽度）；
    - S：stride（步幅）；
    - 输出大小取整通常采用 floor 或者在部分库中以 ceil 实现不同策略（注意边界）。
- 参数数量：
  $$
  \text{Parameters} = F \times F \times C \times K \quad + \quad K\ (\text{bias})
  $$
  - 每个 filter 有 F×F×C 个可训练权重（每个输出通道一组），通常还会为每个输出通道有一个偏置 b（可选）。
- 计算量（每次前向乘加次数）与参数数量不同：卷积的参数量与输入尺寸无关，只与 kernel 大小、输入通道数 C 和输出通道数 K 有关；但计算量会随输入尺寸 W1×H1 线性增长。

数值例子（PPT 给的例子）：

- 若 W1 = W2 = H1 = H2 = 100，F = C = K = 3：
  - 全连接层（FC）参数量：
    $$
    \text{FC params} = W_1 \times H_1 \times C \times W_2 \times H_2 \times K = 100\times100\times3\times100\times100\times3
    = 900,000,000\ (\text{约 }900\text{M})
    $$
  - 卷积层参数量：
    $$
    \text{Conv params} = F\times F\times C\times K = 3\times3\times3\times3 = 81
    $$
  - 差别非常巨大 —— 卷积更节省参数，且保留空间结构。

#### Padding（填充）

- 目的：控制输出空间尺寸并保留边界信息。
- 常见策略：
  - valid（无填充）：P = 0；
  - same（保持同样尺寸，通常在 stride=1 时）：
    $$
    P = \left\lfloor\frac{F-1}{2}\right\rfloor
    $$
  - 填充的本质是通过在输入周围补零来让 kernel 能在边界位置也有完整的覆盖，从而避免输出尺寸缩小或避免边界信息丢失。

注意点：

- 当 stride > 1 或 padding 非对称时，输出尺寸需要精确计算并注意边界行为。
- 常见易错：忘记加上 bias 或者计算 output size 时没有考虑 floor/ceil 差异导致 shape mismatch。

💡 常见疑问与解答

- Q: 为什么卷积核深度要等于输入通道数 C？  
  A: 每个滤波器需要同时作用于所有输入通道的像素，产生一个标量响应（对通道做线性组合），因此 kernel depth = C。
- Q: padding 为什么一般填零（zero padding）？  
  A: 零填充简单且能在边界处保留 kernel 支持范围；其他填充（镜像、复制边界）也常用但更复杂。

---

### 稀疏连接（Sparse Connectivity）与参数共享（Parameter Sharing）

- 稀疏连接（Sparse Connectivity）：
  - 与 FC（fully connected）不同，卷积只与局部邻域相连（kernel 比输入小），因此每个输出只依赖于输入的局部 patch。
  - 本质：架构中存在许多零连接（未连接或权重不共享），使得参数稀疏。
- 参数共享（Parameter Sharing）：
  - 同一卷积核在整张图像不同位置重复使用（共享同一组参数），即对于所有位置使用相同的 filter。
  - 优点：减少参数量、增强平移不变性（equivariance），提高泛化。
  - 等价：参数共享 = 对位移（translation）的等变性（equivariance with translation）。

直观类比：卷积核像“模板”或“筛子”，在整张图像上筛查相同的特征（例如边缘），不需要为每个位置单独学习权重。

💡 常见疑问与解答

- Q: 参数共享会不会使模型表达能力下降？  
  A: 理论上 FC 是 CNN 的超集（不共享、不稀疏），但在图像任务中，局部性与平移性先验使卷积能以更少参数学到更有泛化性的特征。
- Q: 参数共享对非平移变换（如旋转）有效吗？  
  A: 对旋转、尺度等变换不是天然等变，需要额外机制（旋转卷积、尺度金字塔、数据增强等）。

---

### 池化（Pooling）

- 目的：下采样（spatial downsampling），减小特征图尺寸，提取更抽象、位移不敏感的表示。
- 常见类型：
  - 平均池化（Average pooling）；
  - 最大池化（Max pooling，常用）；
  - 求和池化（Sum pooling，较少使用）。
- 池化操作没有可训练参数（parameters = 0）。
- 池化输出尺寸（以池化窗口大小 = F_p、stride = S_p、padding P_p）类似卷积公式：
  $$
  W_{out} = \left\lfloor\frac{W_{in} - F_p + 2P_p}{S_p}\right\rfloor + 1
  $$
- 最大池化的作用：引入对小范围平移和微小旋转的不变性（invariance）。例如 2×2 max pooling 可以使特征对像素小移动不敏感。

举例：

- 输入 4×4 feature map，使用 2×2 max pooling，stride=2 → 输出 2×2；每个输出是对应 2×2 子区域中的最大值。

💡 常见疑问与解答

- Q: 为什么池化能增加不变性？  
  A: 因为池化把邻域内的响应聚合为一个值（如最大值），对于小范围内的偏移，邻域仍包含激活，从而输出不变或变化小。
- Q: 是否总需要池化？  
  A: 不一定。现今网络中常用卷积步幅（stride>1）替代池化，或使用全局平均池化（GAP）作为分类前的下采样。

---

## 卷积 + 池化 作为先验（Convolution and Pooling as a Prior）

- 论点：
  - 卷积层和池化层堆叠能自然对图像提供局部性和位移不变的先验，使得网络在训练时更容易优化（loss landscape 更可控）。
  - 这些先验减少了样本需求并提升泛化能力。
- 结论：相对于 FC，CNN 对图像任务更适合，且更容易训练与调优。

💡 常见疑问与解答

- Q: 这些先验是否会限制模型能力？  
  A: 在某些特殊任务（例如全局依赖、非平移先验强的任务）可能需要不同网络结构，但对于大多数视觉任务，卷积先验是有益的。

---

## 图像分类（Image Classification）

- 任务定义：将输入图像 x 分类到已知的 N 个类别之一（标签 y ∈ {1,...,N} 或 one-hot 向量）。
- 模型输出常为每类的预测分数或概率（例如 softmax 输出 p(y|x)）。
- 变换性质：
  - 卷积对平移是等变（equivariant）：输入平移导致输出相应平移（如果忽略边界效应）；
  - 池化可引入对局部平移的**不变性（invariance）**：即特征的存在与否比精确位置更重要；
  - 对旋转、尺度变换，卷积并非天然等变/不变，需要数据增强或特化结构。

举例（视觉扰动）：

- 对图像做小幅平移或旋转，理想的分类器应保持预测不变；卷积+池化结构部分实现了这一点，但旋转/尺度变化通常需要额外处理（数据增强、旋转不变卷积等）。

💡 常见疑问与解答

- Q: 如果图片被翻转或旋转，CNN 会失败吗？  
  A: 取决于训练数据。若训练中包含这些变换数据（数据增强），模型能学习到鲁棒性。结构上可设计旋转不变的算子，但更常见的做法是数据增强。

---

## CNN 的训练（Training a CNN）

总体流程（PPT Outline）：

1. 数据准备（Data preparation / preprocessing）
2. 权重初始化（Weight Initialization）
3. 选择损失函数（Set a loss function）
4. 开始优化（Start optimization：选择 optimizer、learning rate、schedule 等）
5. 前向算出输出 → 计算损失 → 反向传播（Backpropagate）→ 更新权重

### 数据预处理（Data Preprocessing）

（PPT 委托自 Stanford CS231N）

- 常见步骤：
  - 标准化（Normalization）：减均值除方差（zero-mean, unit variance）或像素值缩放到 [0,1]；
  - 减去数据集均值（per-channel mean）或使用 Whitening；
  - 数据增强（Data augmentation）：随机裁剪、翻转、旋转、颜色扰动、缩放、平移、弹性变形等，以提高泛化；
  - 分批（batching）与 shuffle：训练时随机打乱并按 mini-batch 训练；
  - 划分数据集：训练集、验证集（val）、测试集（test）。
- 目的：加速训练收敛、减少过拟合、提升鲁棒性。

💡 常见疑问与解答

- Q: 数据增强是否会影响验证集评估？  
  A: 验证集通常不做随机增强（或只做确定性变换），以确保评估一致性。训练集可做随机增强。

### 权重初始化（Weight Initialization）

- 目标：避免训练初期激活/梯度过大或过小，帮助梯度在深层网络中合理传播。
- Xavier/Glorot 初始化（适用于 tanh / sigmoid 等对称激活）：
  - 常见公式（均匀分布）：
    $$
    W \sim \mathcal{U}\left(-\sqrt{\frac{6}{\text{fan\_in}+\text{fan\_out}}},\ \sqrt{\frac{6}{\text{fan\_in}+\text{fan\_out}}}\right)
    $$
  - 或高斯分布：
    $$
    \mathrm{Var}(W) = \frac{2}{\text{fan\_in} + \text{fan\_out}}
    $$
  - 说明：
    - fan_in：该层输入单元数量（例如卷积时为 F×F×C）；
    - fan_out：该层输出单元数量（例如卷积时为 F×F×K）。
- He 初始化（适用于 ReLU / Leaky ReLU）：
  - 常用公式（高斯）：
    $$
    W \sim \mathcal{N}\left(0,\ \frac{2}{\text{fan\_in}}\right)
    $$
  - 或均匀版本对应边界 ±sqrt(6/fan_in) * sqrt(2) 等。
- 注意：初始化仍是研究中的活跃领域（例如针对 Transformer、稀疏网络等有特殊初始化策略）。

举例：

- 一个卷积层 fan_in = F×F×C = 3×3×64 = 576，对 ReLU 使用 He 初始化，方差约 2/576 ≈ 0.00347，标准差 ≈ 0.059。

💡 常见疑问与解答

- Q: 为什么要区分 Xavier 和 He？  
  A: 不同激活函数对输入方差保留的需求不同。ReLU 会把负半轴截断，导致有效方差变化，因此 He 初始化考虑这一点。
- Q: 权重初始化能否解决所有梯度消失/爆炸问题？  
  A: 不是万能的，但合适初始化显著缓解。深层网络训练还依赖 BatchNorm、残差连接（ResNet）等技巧。

### 优化（Optimization）：SGD、Momentum、Adam 等

- 基本更新（**SGD**，Stochastic Gradient Descent）：
  $$
  \theta \leftarrow \theta - \alpha \nabla_\theta \mathcal{L}(\theta)
  $$
  - 符号说明：
    - θ：模型参数；
    - α：学习率（learning rate）；
    - ∇θ L(θ)：针对当前 batch 的梯度。
- 问题与改进：
  - 原始 SGD 噪声大、收敛慢；
  - 常见问题：鞍点停滞、不同方向的缩放不一致导致震荡等。
- 动量（Momentum）：
  $$
  v \leftarrow \mu v - \alpha \nabla_\theta \mathcal{L}(\theta),\quad \theta \leftarrow \theta + v
  $$
  - 其中 μ 是动量系数（例如 0.9），v 是速度（velocity）。动量累积历史梯度，有助于穿越鞍点与加速曲面方向。
- 自适应优化器（Adaptive Optimizers）：Adam（常用）
  - Adam 更新（简要）：
    $$
    m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t
    $$
    $$
    v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2
    $$
    $$
    \hat m_t = \frac{m_t}{1-\beta_1^t},\quad \hat v_t = \frac{v_t}{1-\beta_2^t}
    $$
    $$
    \theta_t = \theta_{t-1} - \alpha \frac{\hat m_t}{\sqrt{\hat v_t} + \epsilon}
    $$
    - g_t 为当前梯度；β1 常设 0.9，β2 常设 0.999，ε ≈ 1e-8。
  - 优点：自适应学习率、收敛快、对超参不敏感，适合初学者作为默认选择。
  - 局限：在一些大型视觉任务中，SGD + Momentum 在最终泛化上有时优于 Adam（但需要更精细调 LR 和 schedule）。

💡 常见疑问与解答

- Q: 选择 Adam 还是 SGD？  
  A: 若是初次尝试某数据集，用 Adam（constant LR）快速查看是否可以收敛；若追求最高性能，常用 SGD + Momentum 并结合学习率调度获得更好泛化。
- Q: Momentum 的 μ 如何选择？  
  A: 常用 0.9；若遇到振荡可减小；若太小，效果退化为普通 SGD。

### 学习率（Learning Rate）与训练细节

- 学习率对训练至关重要：
  - 太小 → 收敛慢或陷入局部最小（undershoot）；
  - 太大 → 发散或在最优附近震荡（overshoot）。
- 常用范围（PPT 指导）：分类任务的初始学习率约 1e-6 ~ 1e-3（具体视 optimizer 而定）。
- 学习率调度（schedules）：
  - 固定学习率；
  - Step decay（每隔若干 epoch 乘以衰减因子）；
  - Exponential decay；
  - Cosine schedule（近几年流行，较少超参）；
  - Linear warmup（训练初期学习率由小线性增大，再衰减）；
  - ReduceLROnPlateau（基于验证集表现自动降低 LR）。
- 学习率预热（warmup）：解决训练初期大 LR 导致不稳定的问题，尤其在大 batch 或 Transformer 等结构中常用。
- 提前停止（Early Stopping）：在验证集上连续若干 epoch 无提升则停止训练以防过拟合。
- Batch size 与学习率的经验法则：
  - 当增大 batch size N 时，常把初始学习率也放大 N 倍（线性缩放规则），这是实践中的经验法则（但非严格理论保证）。
- 迭代概念：
  - Iteration：一次 batch 的梯度下降步骤；
  - Epoch：整个训练集被遍历一次（包含多个 iteration）。

举例（学习率 schedule）：

- 使用 Adam，初始 LR=1e-4，不用衰减可快速收敛；使用 SGD + Momentum，初始 LR 可能 0.01，在训练到 plateau 后 step decay。

💡 常见疑问与解答

- Q: 为什么 batch size 会影响 LR？  
  A: 因为 batch size 改变每次更新的梯度估计方差，较大 batch 提供更准确的梯度估计，允许更大步长（LR）而不致发散（经验上成立）。
- Q: 怎样观察是否需要调整 LR？  
  A: 监控训练/验证损失曲线：如果训练损失下降极慢，LR 可能过小；若震荡或损失突然增大，LR 可能过大。

---

## 小结（Lecture 总结）

- 卷积（Convolution）与池化（Pooling）是图像任务中的核心结构，利用稀疏连接与参数共享显著节省参数并引入空间先验；
- 卷积对平移是等变（equivariant），池化带来局部不变性（invariance），但对旋转 / 缩放等需要额外处理（增强或特殊算子）；
- CNN 训练步骤包括数据预处理、适当的权重初始化（Xavier / He）、选择合适的优化器（Adam / SGD+Momentum）与学习率调度；
- 学习率与 batch size、优化器密切相关，是影响训练的关键超参。

---

## 常见疑问与解答（整体复盘）

1. Q: 卷积与全连接相比，什么时候仍然需要 FC？  
   A: 在需要整合全局信息（如分类的最后阶段），或模型输出维度与具体任务强相关时常用 FC；但现代网络更偏好使用 Global Average Pooling + 1x1 卷积等方式减少参数。
2. Q: 初始化、优化器、学习率哪一个最重要？  
   A: 三者都重要，但对初学者建议先用合理初始化（He/Xavier）+ Adam（默认 LR）快速验证；稳定后尝试 SGD+Momentum + LR schedule 优化最终性能。
3. Q: 如何处理旋转/尺度不变性？  
   A: 常用数据增强；高级方法有旋转卷积（group equivariant conv）、特征金字塔（FPN）、多尺度训练等。
