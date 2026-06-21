---
title: '序列模型'
excerpt: '26 春 计算机视觉导论 L11'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
  - 'Sequential Models'
pubDate: 'May 10 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 3D Deep Learning 收尾

### 课程定位

本讲标题为 **Sequential Models**（序列模型），但课程前半部分先收尾三维深度学习内容：从 **PointNet++** 的层级点云特征学习讲到 **Sparse Convolution**（稀疏卷积）。后半部分正式进入 **RNN**、**LSTM** 与 **GRU**，讨论序列建模、语言模型采样以及循环网络的梯度问题。

三维视觉任务与二维视觉任务高度对应，例如 classification、segmentation、detection 等感知任务都可以迁移到 3D 数据上。区别在于 3D 数据表征更复杂：点云、体素、网格、隐式函数等都不是标准二维栅格，因此网络结构必须处理不规则性、空间邻域和计算复杂度。

## PointNet++

### PointNet 的局限

**PointNet** 直接处理无序点集。其基本流程是：

1. 输入点云坐标 $XYZ$。
2. 对每个点独立使用共享 **MLP**，得到逐点 latent feature。
3. 对所有点特征做 **Max Pooling**，得到全局特征。
4. 用全局特征完成 classification，或与逐点特征拼接后完成 segmentation。

其核心优势是 **permutation invariance**（置换不变性）。由于点云是集合而不是序列，点的输入顺序不应影响最终结果。PointNet 通过共享 MLP 和对称池化函数实现这一性质。

但 PointNet 的主要问题是缺少局部几何建模。每个点本质上只经过 single-point receptive field 的 $1\times1$ 处理，随后直接全局 pooling。这类似于对图像中每个像素独立做 $1\times1$ conv 后直接全局池化，难以捕捉局部结构。

**注**：点云的 $XYZ$ 坐标本身携带空间位置信息，因此 PointNet 在一些任务上仍然有效；但当任务依赖局部形状、曲面结构或 part-level pattern 时，仅靠单点特征明显不足。

### PointNet++ 的核心思想

**PointNet++** 的基本思想是：在局部区域内递归应用 PointNet，从而实现层级化点集特征学习。

它希望同时满足三类性质：

- **Hierarchical feature learning**：从 local feature 到 part-level feature，再到 global feature。
- **Local translation invariance**：局部几何特征应尽量不受局部区域整体平移影响。
- **Permutation invariance**：每个局部点集内部仍然是无序集合。

相比 PointNet 直接从单点跳到全局，PointNet++ 更接近 CNN 的层级 receptive field：低层聚合小邻域，高层聚合更大尺度的结构。

### 局部邻域定义

PointNet++ 需要先为每个中心点定义局部邻域。常见方法包括 **KNN** 和 **Ball Query**。

| 方法 | 定义 | 优点 | 局限 |
| :--- | :--- | :--- | :--- |
| **KNN** | 选取距离最近的 $K$ 个点 | 点数固定，便于批处理 | 几何范围随点密度变化 |
| **Ball Query** | 选取半径 $r$ 球内的点 | 几何尺度固定，符合局部感受野 | 点数不固定 |

PointNet++ 通常采用 **Ball Query**。球半径是超参数，表示局部区域的空间尺度。为了便于 GPU 并行，实际实现会限制每个球最多取 $K$ 个点：

1. 若球内点数大于 $K$，随机采样 $K$ 个点。
2. 若球内点数小于 $K$，重复复制部分点补足。
3. 重复点不会影响 PointNet 的 max pooling 结果。

**注**：Ball Query 固定的是几何尺度，而不是点数。这使得局部特征更像 CNN 中固定大小的 receptive field。

### Set Abstraction Layer

**Set Abstraction Layer** 是 PointNet++ 的核心模块，可理解为点云上的“降采样 + 局部特征提取”。

**Pipeline**：

1. **Sampling**：使用 **Farthest Point Sampling**（FPS）从原始点集中选择中心点，使采样点尽可能覆盖整体几何轮廓。
2. **Grouping**：以每个中心点为球心做 Ball Query，得到局部点集。
3. **Local coordinate normalization**：将邻域点坐标减去中心点坐标，得到相对坐标 $(x-x_c,y-y_c,z-z_c)$。
4. **Local PointNet**：对每个局部点集使用共享 PointNet，提取 translation-invariant 的局部几何特征。
5. **Feature construction**：输出新的点集，每个采样中心点携带其局部区域的高维特征。

坐标中心化使局部 PointNet 更关注局部形状，而不是绝对位置。与此同时，中心点的绝对坐标仍可与特征拼接，保留全局空间信息。

通过多层 Set Abstraction，点云分辨率逐层降低，特征维度逐层升高。分类任务最终可得到少量点甚至单个全局特征，再接 fully connected layers 输出 class scores。

### Segmentation 与上采样

点云 segmentation 需要输出 per-point label，因此仅有低分辨率全局特征不够，还必须恢复到原始点分辨率。PointNet++ 通过插值和 skip connection 实现 feature propagation。

**Feature Propagation Pipeline**：

1. 将低分辨率点集的特征上采样到更高分辨率点集。
2. 对新增点，寻找低分辨率点集中的若干 nearest neighbors。
3. 按距离倒数对邻居特征做加权插值：

$$
f_{\text{new}} =
\frac{\sum_{i=1}^{3} f_i / d_i}{\sum_{i=1}^{3} 1 / d_i}
$$

其中 $f_i$ 是邻居点特征，$d_i$ 是新点到邻居点的距离。

4. 将插值特征与 encoder 中同分辨率的 skip feature 拼接。
5. 再通过 unit PointNet 或 MLP 更新逐点特征，最终输出 per-point class scores。

**注**：PointNet++ 的 decoder 并不是简单复制特征，而是插值后再通过可学习网络更新局部特征，因此可以看作点云上的 up-convolution。

### PointNet++ 与 CNN 的差异

若把图像看成带颜色的二维点云，$(u,v)$ 是坐标，$(r,g,b)$ 是特征，那么理论上 PointNet++ 也可以处理图像。但它与 CNN 有本质差异。

| 方法 | 局部权重机制 | 位置建模方式 |
| :--- | :--- | :--- |
| **CNN** | 每个相对位置有独立可学习卷积核权重 | 显式建模 anisotropic spatial kernel |
| **PointNet++** | 局部点共享同一个 MLP | 通过相对坐标作为输入隐式区分位置 |

CNN 的 $3\times3$ 卷积核中不同位置有不同参数，因此天然支持空间各向异性；PointNet++ 的局部 PointNet 对所有邻域点共享权重，位置差异主要由相对坐标输入表达，因此局部建模能力弱于标准卷积。

后续点云卷积方法尝试弥补这一点。例如 **KPConv** 在球内设置多个 kernel points，每个 kernel point 学习独立权重；也可以使用 **Hypernetwork** 根据点的位置动态预测局部网络权重。

## Sparse Convolution

### Voxel Networks 的动机

另一类处理 3D 数据的思路是将点云或形状体素化为规则三维栅格，再使用 **3D CNN**。体素表示的优点是规则、可索引，能够直接继承二维卷积中的局部卷积、平移等变性和层级特征结构。

但 dense voxel grid 的复杂度很高。若分辨率为 $N\times N\times N$，存储和计算量随 $O(N^3)$ 增长。低分辨率体素会带来明显信息损失，高分辨率体素又难以承受内存和计算开销。

**注**：PPT 中用 $30^3$ 的 occupancy grid 说明，即使看似很低的三维分辨率，体素数量也已接近 $224\times224$ 图像像素数的一半；若提高到 $128^3$，开销会迅速膨胀。

### 稀疏性的利用

真实三维物体通常主要由表面构成，空间中绝大多数体素为空。**Sparse Convolution** 的核心思想是：

1. 只存储 occupied grids，也即表面附近的 sparse surface signals。
2. 只在非空体素及其相关邻域附近执行计算。
3. 使用稀疏索引结构维护体素邻接关系，避免 dense grid 的全空间扫描。

这样既保留了规则网格的索引优势，又显著降低了 dense 3D convolution 的冗余计算。

### 优缺点与适用场景

| 方法 | 优点 | 局限 |
| :--- | :--- | :--- |
| **Sparse Conv** | 比 dense conv 高效；规则网格支持索引；表达能力接近 2D Conv；具有类似卷积的 translation equivariance | 仍有 discretization error；分辨率受限 |
| **Point Cloud Networks** | 高分辨率；直接处理原始点；容易快速尝试 | FPS 与 Ball Query 较慢；局部卷积核表达弱；大规模场景性能可能受限 |

**Sparse Conv** 更适合大规模场景，例如自动驾驶 LiDAR 点云；点云网络更适合需要保留高分辨率表面细节或快速构建 baseline 的任务。

常见实现包括 **SparseConvNet**、**MinkowskiEngine**、**TorchSparse** 和 **Tensorflow3D**。

## Sequence Modeling

### 序列数据与任务类型

序列数据具有顺序性和因果性，例如文本、语音、视频帧和时间序列。序列建模的核心目标是根据历史信息预测未来或生成后续元素：

$$
P(x_{t+1}\mid x_1,x_2,\dots,x_t)
$$

不同输入输出形式可归纳为：

| 类型 | 形式 | 示例 |
| :--- | :--- | :--- |
| **One-to-one** | 单输入到单输出 | 标准图像分类 |
| **One-to-many** | 单输入到序列输出 | Image Caption |
| **Many-to-one** | 序列输入到单输出 | Video Action Classification |
| **Many-to-many** | 序列输入到序列输出 | Video Caption、Language Modeling |

**RNN**（Recurrent Neural Network）通过 hidden state 在时间维度传递历史信息，是早期序列建模的基本结构。

### Vanilla RNN

Vanilla RNN 在每个时间步接收当前输入 $x_t$ 和上一时刻 hidden state $h_{t-1}$，并输出新的 hidden state $h_t$：

$$
h_t = \tanh(W_h h_{t-1} + W_x x_t)
$$

输出通常由 hidden state 线性映射得到：

$$
y_t = W_y h_t
$$

其中 $W_h,W_x,W_y$ 在所有时间步共享。将 RNN 按时间展开后，可以看作一个深度等于序列长度的计算图，参数在各层之间共享。

**注**：$h_0$ 通常初始化为零向量，也可以作为可学习参数或由其他网络生成。

### Backpropagation Through Time

RNN 的训练使用 **Backpropagation Through Time**（BPTT）。由于展开后的计算图沿时间方向很长，完整 BPTT 会带来较高内存和计算开销。

实际训练常使用 **Truncated BPTT**：

1. 从长序列中截取固定长度窗口 $\Delta T$。
2. 只在该窗口内展开 RNN 并反向传播。
3. 窗口外的长期依赖不会直接受到训练约束。

**注**：若训练窗口长度为 $\Delta T$，模型很难从梯度信号中学习长于 $\Delta T$ 的 temporal relationship。这是 RNN 处理 long-term dependence 的重要限制之一。

## RNN Language Model

### 字符级语言模型

以 **Character-Level Language Model** 为例，给定训练字符串 "HELLO"，模型在每个时间步用当前字符预测下一个字符：

1. 输入 $H$，预测 $E$。
2. 输入 $E$，预测 $L$。
3. 输入 $L$，预测下一个 $L$。
4. 输入 $L$，预测 $O$。

每个字符通常先转为 one-hot 或 embedding，再输入 RNN。输出 $y_t$ 经 softmax 得到下一字符的概率分布，训练损失为 **Cross-Entropy Loss**。

**注**：embedding layer 有时可使用固定的 pretrained word embedding，也可以随语言模型一起训练。

### 采样策略

语言模型生成时，需要从当前 softmax 概率分布中选择下一个 token。不同采样策略在确定性、多样性和计算成本之间取舍。

| 策略 | 机制 | 特点 |
| :--- | :--- | :--- |
| **Greedy Sampling** | 每步选择概率最大的 token | 确定性强，只能生成一个序列，容易重复 |
| **Weighted Sampling** | 按预测概率分布随机采样 | 多样性更好，但可能采到低质量 token |
| **Exhaustive Search** | 枚举长度为 $T$ 的所有序列并找最大概率 | 复杂度 $O(V^T)$，不可行 |
| **Beam Search** | 每步保留 $K$ 个最可能的部分序列 | 比 exhaustive search 高效，但不保证全局最优 |
| **Top-p Sampling** | 从累计概率达到 $p$ 的最小 token 集中采样 | 动态截断低概率尾部，兼顾质量和多样性 |

Beam Search 的 $K$ 称为 **beam size**。$K$ 越大，搜索覆盖面越广，但计算成本越高。

**注**：即使生成结果局部看似合理，若训练和测试时都受有限序列长度限制，模型仍可能无法捕捉长距离全局关系，生成“局部通顺但整体无意义”的文本。

## RNN 的梯度问题

### Gradient Vanishing 与 Explosion

RNN 展开后相当于很深的网络，梯度需要沿时间反向传播。对最后一步 loss $L_T$ 而言，梯度会包含大量连乘项：

$$
\frac{\partial L_T}{\partial W}
\propto
\prod_t
\frac{\partial h_t}{\partial h_{t-1}}
=
\prod_t
\operatorname{diag}(\tanh'(\cdot))W_h
$$

由于：

$$
\tanh'(x)=1-\tanh^2(x)\in[0,1]
$$

时间步较长时，连乘会导致两类问题：

- **Gradient Vanishing**：若整体雅可比矩阵的谱半径小于 1，梯度随时间距离指数衰减。
- **Gradient Explosion**：若谱半径大于 1，梯度随时间距离指数增长。

Gradient Explosion 可通过 **gradient clipping** 或 rescaling 缓解；Gradient Vanishing 更难处理，因为远处的梯度信号会被近处信号淹没，模型参数主要学习 short-term effects，而不是 long-term effects。

### 长期依赖为何困难

语言模型中常见的长期依赖包括主谓一致、指代关系和跨句信息。例如一句话前面出现 "tickets"，很久之后的空格也应预测 "tickets"。若远处梯度已经衰减，RNN 无法从该训练样本中学习这类依赖关系。

提高 RNN 容量可以使用 **Multilayer RNNs**，即在每个时间步堆叠多层 RNN。但多层结构主要增强表示能力，并不能从根本上解决时间方向的梯度消失问题。

## LSTM

### 基本设计

**LSTM**（Long Short-Term Memory）通过引入独立的 **cell state** $c_t$ 缓解长期依赖问题。每个时间步同时维护：

- **Hidden state** $h_t$：用于当前输出和传递短期状态。
- **Cell state** $c_t$：用于存储长期信息。

LSTM 可以对 cell state 执行 read、erase 和 write，这些操作由门控向量动态控制。门的取值来自 sigmoid，范围在 $0$ 到 $1$ 之间，表示某一维信息保留或通过的程度。

### 门控公式

将上一时刻 hidden state 与当前输入拼接为 $[h_{t-1},x_t]$，LSTM 计算四组信号：

$$
\begin{aligned}
i_t &= \sigma(W_i[h_{t-1},x_t]+b_i) \\
f_t &= \sigma(W_f[h_{t-1},x_t]+b_f) \\
o_t &= \sigma(W_o[h_{t-1},x_t]+b_o) \\
\tilde{c}_t &= \tanh(W_c[h_{t-1},x_t]+b_c)
\end{aligned}
$$

其中 $i_t$ 是 **input gate**，$f_t$ 是 **forget gate**，$o_t$ 是 **output gate**，$\tilde{c}_t$ 是候选 cell content。

状态更新为：

$$
\begin{aligned}
c_t &= f_t \odot c_{t-1} + i_t \odot \tilde{c}_t \\
h_t &= o_t \odot \tanh(c_t)
\end{aligned}
$$

其中 $\odot$ 表示 element-wise multiplication。

### 梯度流解释

LSTM 的关键在于 cell state 的加性更新：

$$
c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t
$$

这使得梯度可以沿 $c_t$ 方向通过一条较直接的路径回传，而不是每一步都反复乘以同一个 $W_h$ 和 $\tanh'$。因此 LSTM 更容易学习保留跨越许多时间步的信息。

**注**：LSTM 并不严格保证梯度永不消失或爆炸；如果 forget gate 长期接近 0，旧信息仍会被清除。但相比 vanilla RNN，它在实践中显著改善了 long-term dependence。

## GRU 与总结

### GRU

**GRU**（Gated Recurrent Unit）是 LSTM 的简化变体。它不显式区分 hidden state 和 cell state，而是用两个门控制信息更新：

$$
\begin{aligned}
r_t &= \sigma(W_r[h_{t-1},x_t]) \\
z_t &= \sigma(W_z[h_{t-1},x_t]) \\
\tilde{h}_t &= \tanh(W_h[r_t \odot h_{t-1},x_t]) \\
h_t &= (1-z_t)\odot h_{t-1}+z_t\odot\tilde{h}_t
\end{aligned}
$$

其中 $r_t$ 是 **reset gate**，控制计算候选状态时使用多少过去信息；$z_t$ 是 **update gate**，控制保留旧状态和写入新状态的比例。

GRU 参数量少于 LSTM，结构更简洁，在许多任务中效果接近 LSTM。

### 从 RNN 到 Attention

RNN、LSTM 和 GRU 都是因果序贯处理结构。它们在 $t$ 时刻通常只能直接访问 $1$ 到 $t$ 的历史信息，长距离交互必须经过 hidden state 逐步传递。

后续的 **Attention** 与 **Transformer** 将改变这一点：序列中任意两个位置可以直接建立联系，从而更高效地建模长距离依赖，也更适合并行训练。

**注**：虽然 RNN 类模型在大模型时代不再是主流序列建模框架，但其 hidden state、BPTT、梯度消失、门控记忆等概念仍是理解 Transformer 与现代序列模型的重要基础。
