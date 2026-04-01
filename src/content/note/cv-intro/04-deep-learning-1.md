---
title: '深度学习 1'
excerpt: '26 春 计算机视觉导论 L04'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'April 01 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Classical CV Pipeline

### Pipeline

1. **Keypoint detector**

   关键点检测器，找到图像中有意义的点（角点、斑点等）。
   例如 Harris corner detector。
2. **Keypoint descriptor**

   关键点描述子，在兴趣点周围提取局部特征向量。
   例如 SIFT。
3. **Image representation**

   图像表示，把多局部特征聚合成固定长度向量（如直方图），便于分类器处理。
   例如 Bag-of-Visual-Words。
4. **Classifier**

   分类器，在聚合表示上训练浅模型完成最终分类任务。
   例如 SVM, logistic regression

### Keypoint detector

Where to look。传统算法多基于梯度、Hessian、角点响应等设计启发式准则。常见的方法有 Harris，DoG 等。

### Descriptor

What is around that point。常见的方法有 **SIFT（Scale-Invariant Feature Transform）**，配合 DoG 使用可以做到尺度等变性。

SIFT 的步骤：

本质上是把每个关键点映射成一个定长的特征向量，且这种映射具有鲁棒性。

1. 检测出**关键点**。
2. 为每个关键点确定**主方向**（orientation），通常使用圆形邻域进行 vote（注意需要按距离加权）。并做方向归一化，也即进行旋转使主方向朝向 $0 \degree$。
3. 旋转后，在关键点周围选取一个 $16 \times 16$ 的 **patch**，注意坐标不一定整数，需用双线性插值。
4. 将该 patch 划分为 $4 \times 4$ 个子区域，每子区域 $4 \times 4$ 像素。
   把 $360 \degree$ 分成 $8$ 个 bins，每个子区域像素以梯度大小为权加入 bins，最后每个子区域得到一个 **$8$ 维向量**。
5. 合起来得到 $128$ 维描述子，最后进行归一化、阈值截断、再归一化。其中归一化是避免整体亮度变化影响，阈值截断是避免局部阴影的影响。

### Aggregation

How the whole image is。常见的方法有 **Bag-of-Visual-Words**。

BoVW 的步骤：

本质上是把不确定数量的局部描述子映射成固定长度的全局表示。

1. 收集**描述子**。
2. 使用聚类算法（如 **k-means**）把描述子聚成 $K$ 个簇中心，称为 **visual words**。
3. 对一张图中每个描述子找最近的 visual word，可以是**硬分配**（单独分配）或**软分配**（分配权重）。
4. 统计每个词的出现次数，得到长度为 $K$ 的全局表示向量。

**注**：BoVW 统计词频，不记录词出现的相对位置，故会丢失空间信息。比如鼻子长在眼睛上，BoVW 并不能发现差异。

### Classifier

Decision for the task。常用浅学习模型，如 **logistic regression**（二分类）、**SVM**、小型神经网络等。
本质上是把聚合好的向量映射到类别概率或类别标签。

**注**：这些分类器只看聚合后的全局表示，不直接访问原像素。

### Problems

- 依赖人工设计的特征和启发式规则。
- 流水线会产生错误累积。
- 难以理解高层语义，比如部分（part）、种类（category）、语境（context）等。
- 难以利用海量数据进行优化
- 对某一事物的识别不易泛化到另外事物。

---

## Learning-based CV

### Advantages

传统 CV 是设计特征，学习型 CV 是从数据中学习特征。

**好处**：

- **端到端（end-to-end）**，能直接针对最终任务优化所有参数，避免手工设计中各阶段不一致的目标。
- 自动学习高层语义，从边缘到部分再到对象/场景。
- 能够随数据规模增长而提高性能。

**注**：学习型方法虽然在很多视觉任务中表现更好，但在数据稀缺或**实时/嵌入式场景**中经典方法仍有价值。

### Why It Took Off

- 算法（**Algorithm**）：深度学习架构（多层神经网络、反向传播、优化方法）与研究突破（如 ReLU、BatchNorm、ResNet 等）。
- 数据（**Data**）：ImageNet 等大规模标注数据集让复杂模型能被充分训练。
- 计算资源（**Compute**）：GPU、TPU 等硬件加速以及高效并行使大模型训练成为可能。当然电能也非常重要。

---

## Machine Learning

### Set Up the Task

假设我们想要实现 MNIST 二分类，也即给定一张手写数字图像，判断它是否为数字 5。

输入：$x \in \mathbb{R}^{784}$，表示 $28 \times 28$ 灰度图像展平的 $784$ 维向量。

标签：$y \in \set{0,1}$，是否为数字 5 的标签。

输出：

- 软分类：$p(y = 1 | x) \in [0, 1]$
- 硬分类：$p(y=1|x) \ge \tau$，则预测为 1，否则为 0。

模型：$h(x; \theta)$，其中 $\theta$ 为待优化参数。

### Prepare the Data

使用 **MNIST** 数据集。

**预处理**：

1. 标准化：
   - 将像素值除 $255$ 从 $[0,255]$ 缩放到 $[0,1]$。
   - 或做零均值单位方差标准化 $x' = \frac{x-\mu}{\sigma}$。
2. 数据增强：随机平移、旋转少量角度、缩放、弹性变形等。
3. 转换为模型需要的数据结构：
   - 对于线性模型/MLP：展平为 (784,) 向量。
   - 对于 CNN：保留形状 (1, 28, 28) 。
4. 划分数据集：
   - 划分为训练集和测试集。
   - 按照训练方法进一步划分，比如划分出 mini-batch。

### Build a Model

模型负责利用给定的输入产生输出，也即给出一个函数 $h(x; \theta) \in [0, 1]$，其中 $\theta$ 为待优化参数。

#### Logistic Regression

逻辑回归，线性模型。

令 $z = \theta^\top x + b$ 为输入的线性打分。则模型为：
$$
h(x; \theta, b) = \sigma(z) = \frac{1}{1+e^{-z}}
$$
其中参数 $\theta \in \mathbb{R}^{784}$，$b\in\mathbb{R}$。

#### MLP

多层感知器，非线性模型，可以处理非线性可分问题。

若干**线性层**（矩阵乘法）与**非线性激活函数**交替堆叠。

每层 $h = g(Wx + b)$，其中 $g$ 是激活函数。

通过施加多层**非线性变换**， MLP 可以把原来**线性不可分**的点集映射到一个新的特征空间中，使其**更线性可分**。

**训练流程**：

1. **Forward**（前向传播）：由输入计算输出概率与 Loss。
2. **Backpropagation**（反向传播）：计算参数梯度。
3. **Gradient Descent**（梯度下降）：如 SGD / Mini-batch。
4. 重复直到收敛或达到训练轮次。

**常用策略**：

- 初始化：
    Xavier/Glorot、He 初始化，根据激活函数选择，避免初始时梯度消失/爆炸。
- 正则化：
  - L2 正则化：在损失中加入 $$\frac{\lambda}{2}\|\theta\|^2$$。
  - Dropout：MLP 时常用。
- 输出层选择：
  - 二分类用 sigmoid + NLL。
  - 多分类用 softmax + cross-entropy。
- 批归一化（BatchNorm）：对深层 MLP 重要。

### Define the Loss Function

我们要给出具体的损失函数与训练目标（optimization objective）。

#### MLE

最大似然估计（Maximum Likelihood Estimation）。

把模型看作给定输入时产生输出标签的概率模型：
$$
p(y=1|x;\theta)=h(x; \theta),\quad p(y=0|x;\theta)=1-h(x; \theta).
$$

假设样本独立，则对整个训练集出现的概率估计（似然函数）为：
$$
p(Y|X;\theta)=\prod_{i=1}^n h(x^{(i)}; \theta)^{y^{(i)}} (1-h(x^{(i)}; \theta))^{1-y^{(i)}}.
$$
其中 $Y$ 为标签向量，$X$ 为输入向量，$y^{(i)}$ 为第 $i$ 个样本的标签，$x^{(i)}$ 为第 $i$ 个样本的输入。

每个模型（参数）都可以计算出对应的训练集似然。我们应当选取一个模型（参数），使得这个模型（参数）计算出的训练集似然是在整个模型空间（参数空间）中最大的。此即最大似然估计：
$$
\theta^* = \argmax_\theta p(Y|X;\theta)
$$

#### NLL/Cross-Entropy

最小化负对数似然（Negative Log-Likelihood）

最大化似然等同于最小化负对数似然，为了使得梯度大小与样本数无关，我们取**平均形式**：
$$
\begin{aligned}
\mathcal{L}(\theta)
&= -\frac{1}{n} \log p(Y|X;\theta) \\
&= -\frac{1}{n} \sum_{i=1}^n \left[ y^{(i)}\log h(x^{(i)}; \theta) + (1-y^{(i)})\log(1-h(x^{(i)}; \theta)) \right]
\end{aligned}
$$
这也是常说的二元交叉熵（binary cross-entropy）损失。

对单样本的损失：
$$
\ell^{(i)}(\theta) = -\left[ y^{(i)}\log h(x^{(i)}; \theta) + (1-y^{(i)})\log(1-h(x^{(i)}; \theta)) \right]
$$
若加入 L2 正则化：
$$
\mathcal{L}_{\text{reg}}(\theta) = \mathcal{L}(\theta) + \frac{\lambda}{2}\|\theta\|^2
$$
其中 $\lambda$ 为超参数。

**注**：

- NLL 使用对数，在概率极小时数值仍然稳定，且对于小概率惩罚更大。
- NLL 使用对数，将复杂乘法转化为加法。
- 二元 NLL 和二元交叉熵在数学上等价。

### Perform Fitting

训练等价于最小化损失函数。下面详细推导梯度并给出常用优化方法。

#### GD

梯度下降（Gradient Descent）。

设 Logistic Regression 模型为：

- 线性项 $z = \theta^\top x$
- 输出 $h = \sigma(z) = 1/(1+e^{-z})$
- 单样本损失 $\ell(\theta) = -[ y\log h + (1-y)\log(1-h) ]$

**链式法则求导**：

1. 对 $h$ 求导：
    $$
    \frac{\partial \ell}{\partial h} = -\left(\frac{y}{h} - \frac{1-y}{1-h}\right)
    $$
2. 对 $z$ 求导：
    $$
    \frac{\partial h}{\partial z} = h(1 - h)
    $$
    从而：
    $$
    \frac{\partial \ell}{\partial z}
    = \frac{\partial \ell}{\partial h} \frac{\partial h}{\partial z}
    = h - y
    $$
3. 对 $\theta$ 求导：
    $$
    \frac{\partial \ell}{\partial \theta}
    = \frac{\partial \ell}{\partial z} \frac{\partial z}{\partial \theta}
    = (h - y) x
    $$

**全量梯度**：
$$
\begin{aligned}
\nabla_\theta \mathcal{L}(\theta)
&= \frac{1}{n} \sum_{i=1}^n (h(x^{(i)}; \theta) - y^{(i)}) x^{(i)} \\
&= \frac{1}{n} X^T (H - Y)
\end{aligned}
$$

**注**：

$h(x^{(i)}; \theta) - y^{(i)}$ 是模型的**预测误差**（残差），乘以输入 $x^{(i)}$ 得到该样本对梯度的贡献。
误差的绝对值越大，说明在该样本上的预测越差，该样本对参数更新的影响越大，从而引导模型向减小该误差的方向调整。

### Method

1. 全量批量梯度下降（**Full-batch GD**）：

    $$
    \theta' = \theta - \alpha \nabla_\theta \mathcal{L}(\theta)
    $$

    - 优点：稳定。
    - 缺点：每步计算量大，不能很好地并行和进行实时更新。

2. 随机梯度下降（Stochastic GD，**SGD**）：

    每次取一个样本更新：
    $$
    \theta' = \theta - \alpha (h_\theta(x^{(i)}) - y^{(i)}) x^{(i)}
    $$

    - 优点：更新频繁、噪声可帮助跳出鞍点。
    - 缺点：噪声导致收敛震荡，不稳定。

3. 小批量梯度下降（**Mini-batch GD**）：

    取 batch 为 $\mathcal{B}$，size 为 $B$：
    $$
    \theta' = \theta - \alpha \frac{1}{B}\sum_{i\in\mathcal{B}}(h_\theta(x^{(i)})-y^{(i)}) x^{(i)}
    $$

    在 GPU 上常用，平衡效率与稳定性。

4. 自适应优化器（**Adaptive Optimizers**）：

    - 动量法：Momentum
    - 自适应学习率：Adam、RMSProp 等

### Learning Rate

学习率 $\alpha$ 的选择对训练很关键。

**常用策略**：

- 固定学习率
- 学习率衰减：
  - step decay：每隔若干 epoch 乘以一个衰减因子
  - exponential decay：每轮指数衰减
- 基于验证集自动调整：
    监控验证集表现，若连续若干轮不提升，自动降低学习率。如 PyTorch 的 `ReduceLROnPlateau`
- 学习率预热：
    训练初期用小学习率 warm up，逐渐增加到目标值，再衰减。
- 提前停止：
    监控验证集误差，若连续若干轮不下降则停止训练，防止过拟合。

### Testing

训练完成后要在测试集上评估模型的泛化能力（generalization）。

#### 常用评估指标

- Accuracy（准确率）：$$\frac{\text{正确预测数}}{\text{总样本数}}$$
- Precision（精确率）：$$\frac{\text{TP}}{\text{TP}+\text{FP}}$$
- Recall（召回率）：$$\frac{\text{TP}}{\text{TP}+\text{FN}}$$
- F1-score：调和平均 $$2\cdot\frac{\text{precision}\cdot\text{recall}}{\text{precision}+\text{recall}}$$
- Confusion Matrix（混淆矩阵）：展示 TP/FP/TN/FN 的分布
- ROC 曲线 与 AUC：通过变化阈值绘制 TPR vs FPR 曲线，AUC 衡量整体判别能力
- PR 曲线：类不平衡场景下更 informative

#### Generalization Gap

- 定义：训练误差与测试误差的差距。
- 导致原因：过拟合（模型在训练集上学到噪声或特殊性）、正则化不足、数据集分布不同等。
- 缓解方法：增加数据、数据增强、正则化（L2、dropout）、简化模型、早停（early stopping）。

- 对概率输出可给出置信度解释；对于高不确定样本可以拒绝预测或触发人工审查。
- 若需要更严谨的概率校准，可用温度缩放（temperature scaling）等后处理方法校准概率。

1. Q：0.5 不是固定阈值吗？为什么还需调？  
   A：当错误代价不对称或数据不平衡时，0.5 不是最佳阈值，需在验证集上选取最合适的 τ。
2. Q：如何判断模型是否真的学到了泛化能力？  
   A：观察测试集/验证集的性能、绘制学习曲线（训练/验证误差随 epoch 变化），并在独立数据集上评估。
3. Q：为什么 AUC 是有用的指标？  
   A：AUC 与阈值无关，衡量分类器在不同阈值下的整体区分能力，适合比较不同模型的判别力。

### Difficulty

神经网络训练是非凸优化，常见问题：

- 局部极小值（local minima）与更常见的鞍点（saddle points）。
- 高维空间中大量平坦区域（flat plateaus），一些方向对损失几乎没有影响（过参数化导致）。
- 因此，直接基于全量批量 GD 在深度学习中往往不够鲁棒，SGD 的噪声反而有帮助。

1. Q：为什么鞍点比局部最小更常见？  
   A：在高维空间，随机函数的 Hessian 往往有混合正负特征值，鞍点（同时存在上升/下降方向）比局部极小更常见。
2. Q：Mini-batch 的噪声如何帮助训练？  
   A：噪声能提供随机扰动，帮助跳出鞍点或浅陷阱，并避免过早陷入坏的局部盆地。
3. Q：何时使用 Adam 等自适应方法？  
   A：在很多任务中 Adam 等能加速收敛、自动调整学习率，但有时可能泛化性能略差。实践中常在预热/微调阶段结合多种优化器。

---

## Backpropagation

### 链式法则抽象形式

如果复合函数 $f(g(x))$，则：
$$
\frac{d}{dx} f(g(x)) = f'(g(x)) \cdot g'(x).
$$
在多变量、多层情形中把每层的上游梯度乘以本层局部导数即可得到下游梯度。

### 线性层的反向传播

- 对于线性层：$y = W x + b$，若已知 $\frac{\partial L}{\partial y} = \delta$（上游梯度），则：
  - $$\frac{\partial L}{\partial W} = \delta \, x^\top$$
  - $$\frac{\partial L}{\partial x} = W^\top \delta$$
  - $$\frac{\partial L}{\partial b} = \delta \quad(\text{按元素求和/或保持维度一致})$$
- 这些公式是实现向量化反向传播的基础。

Q：反向传播会很慢吗？  
A：通过矩阵化与 GPU 并行，实现的反向传播效率很高；关键在于合理使用批量与向量化。

---

## 激活函数与 ReLU

### 常见激活函数

- Sigmoid：$g(z) = \frac{1}{1+e^{-z}}$，输出 (0,1)，易饱和导致梯度消失。
- Tanh：$\tanh(z)$，输出 (−1,1)，也易饱和但中心化。
- ReLU（**Rectified Linear Unit**）：$g(z) = \max(0,z)$，几乎已成为许多深度网络的默认选择。

### ReLU 的优点

- 计算简单（门控只需阈值化），比指数类函数更快。
- 在正区间梯度恒为 1，缓解了梯度消失问题（相较 sigmoid/tanh）。
- 稀疏激活：负输入为 0 导致部分神经元不激活，可带来稀疏性好处（效率与正则化效应）。
- 实践上收敛更快、效果更好（尤其是深层网络）。

### ReLU 的缺点与注意

- Dead ReLU：若学习率过大或初始化不当，某些神经元长期输出 0（无法恢复），导致容量下降。改良激活包括 Leaky ReLU、ELU 等。
- ReLU 在负轴导数为 0，可能影响部分训练动态。

1. Q：为什么不总用 sigmoid？  
   A：sigmoid 在深层网络中会导致梯度消失（导数小于 1），使训练变慢甚至停滞。
2. Q：什么时候用 Leaky ReLU？  
   A：当担心 Dead ReLU 问题或想要少量负轴斜率以保持梯度流动时使用。

---

## MLP 在视觉信号上的问题

- 将图像平坦化（flatten）为向量：
  - 会破坏图像的局部结构（空间邻接关系被抹去）。
  - 对高分辨率图像参数量膨胀（参数数目随像素数线性增长），计算与内存负担大。
- 因此在视觉任务中更常用 **Convolutional Neural Networks（CNNs）**，保留空间结构并通过参数共享大幅减少参数量。

---

Q：反向传播会随网络深度数值不稳定吗？  
   A：是的，尤其 sigmoid/tanh 会导致梯度消失问题；使用 ReLU、合适初始化与批归一化（BatchNorm）可缓解。
