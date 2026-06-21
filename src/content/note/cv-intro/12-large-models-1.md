---
title: '大模型 1：Attention 与 Transformer'
excerpt: '26 春 计算机视觉导论 L12'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
  - 'Transformer'
pubDate: 'May 17 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Large Models I: Attention & Transformer

### 课程定位

本讲从上一讲的 **RNN** 与 **LSTM** 出发，进入现代大模型的核心结构：**Attention**（注意力机制）与 **Transformer**。课程主线包括：

1. 早期视觉-语言任务如何用 **CNN + RNN** 建模，例如 **Image Captioning** 和 **VQA**。
2. **Sequence-to-Sequence** 中固定长度 context vector 的瓶颈如何催生 Attention。
3. Attention 如何被形式化为 **Query-Key-Value**（QKV）机制，并进一步构成 **Self-Attention**。
4. Transformer 如何用 attention 替代 RNN 的顺序递推，成为语言、视觉、语音等大模型的基础架构。
5. **Vision Transformer**（ViT）如何把图像 patch token 化，从而将视觉任务接入统一的 Transformer 框架。

上一讲讨论的 RNN 并不是 NLP 专属结构。任何可以被序列化的输入都可以作为 token 序列处理，例如文本 token、视频帧、语音片段，甚至图像中的 patch。Transformer 的关键价值正是在于提供了一种通用的 token 交互机制。

## Image Captioning

### 任务定义

**Image Captioning**（图像描述生成）要求输入一张图像，输出一句自然语言描述。它是早期典型的多模态生成任务，通常采用：

- **CNN Encoder**：从图像中提取视觉特征；
- **RNN / LSTM Decoder**：基于视觉特征逐词生成 caption。

若使用 word-level 语言模型，每个 token 对应 vocabulary 中的一个词。实际现代系统常使用 **sub-word** 分词，例如 BPE，以降低词表规模并提升未知词处理能力。

### CNN + RNN 架构

早期 Image Captioning 的基本架构是将图像编码成向量，再作为 RNN 的初始条件或额外输入。

**Pipeline**：

1. 使用在 ImageNet 上预训练的 CNN 提取图像特征。
2. 选择 CNN 的高层特征，并通过线性层映射到 RNN hidden state 的维度。
3. 将 `<START>` token 输入 RNN，开始生成第一个词。
4. 每一步根据当前 hidden state 输出 vocabulary 上的 softmax 概率。
5. 从概率分布中采样或选择下一个词，并作为下一步输入。
6. 当模型输出 `<END>` token 时终止生成。

RNN 的基本更新可写为：

$$
h_t = \tanh(W_{hh}h_{t-1} + W_{hx}x_t + b_h)
$$

其中 $x_t$ 是当前输入 token 的 embedding，$h_t$ 是当前 hidden state。图像特征通常在初始步作为额外偏置或初始状态注入 decoder。

### CNN 特征层选择

对于预训练分类 CNN，选择哪一层作为图像表示非常关键。

| 特征层 | 特点 | 适用性 |
| :--- | :--- | :--- |
| **FC1000 / logits** | 贴近 ImageNet 1000 类分类标签 | 信息过窄，容易只保留类别而丢失细节 |
| **FC4096 / penultimate feature** | 更通用的高层语义特征 | 更适合 caption，需要保留物体、属性和场景信息 |

例如，logits 层可能只强烈表达“person”，但 caption 需要“straw hat”“surfboard”等更细粒度信息。因此图像描述通常使用倒数第二层或更通用的视觉特征，而不是最终分类 logits。

### Special Tokens

Caption decoder 通常需要两个特殊 token：

- `<START>`：生成开始标志，作为 decoder 的第一个输入。
- `<END>`：生成结束标志，采样到它时停止生成。

**注**：`<END>` 不等价于句号。训练数据中一个 caption 可能包含多个句子，句号只是普通标点，而 `<END>` 表示整个序列终止。

### 训练策略

早期 Image Captioning 常固定 CNN 参数，只训练 RNN decoder 或少量投影层。原因是 CNN 参数量大且已在大规模图像数据上预训练，若在小规模图文对数据集上端到端微调，成本高且容易过拟合。

Caption 训练使用从 `<START>` 到 `<END>` 的完整 **Backpropagation Through Time**（BPTT）。与长文本语言模型不同，这里通常不适合截断 BPTT，因为后续词的生成强依赖初始图像特征。

### 生成还是检索

早期 CNN + RNN captioning 在小数据集上可能出现一种退化行为：模型表面生成流畅句子，实际更接近 **nearest neighbor retrieval**。

其机制是：

1. CNN 将图像映射到 feature space。
2. 模型在训练集中找到相似图像的视觉表示。
3. RNN 学会复现训练集中相似样本的 caption。

这说明“架构理论上能生成语言”和“模型实际学会组合式语言能力”是两回事。神经网络会优先选择降低 loss 的简单路径，因此需要通过错误案例分析模型到底在做生成、检索还是记忆。

## Visual Question Answering

### VQA 任务

**Visual Question Answering**（VQA）输入一张图像和一个自然语言问题，输出答案。例如给定图像和问题 "How many horses are in this image?"，模型需要回答数量。

在早期设置中，VQA 常被建模为分类问题：将最常见的答案集合离散化，例如限定为 1000 个候选答案，再用 softmax 输出类别。

### 多模态融合

典型 VQA 架构如下：

1. 用 CNN 提取图像特征。
2. 用 LSTM 编码问题文本，得到问题向量。
3. 将图像特征与问题特征做融合，例如 concatenation 或 point-wise multiplication。
4. 融合特征经过全连接层和 softmax，预测答案类别。

对于选择题形式，还可以将每个候选答案也编码为向量，再计算图像-问题联合特征与各答案向量的相似度，选择得分最高的答案。

**注**：早期 VQA 的一个核心问题是语言偏置。模型可能不真正看图，而是根据问题模式猜答案，例如 "What color is the sky?" 常预测 "blue"。因此多模态任务必须分析模型是否真的使用了视觉信息。

## Sequence-to-Sequence

### Encoder-Decoder 框架

**Sequence-to-Sequence**（Seq2Seq）是机器翻译等任务的基础框架。输入为源语言序列 $x_1,\dots,x_T$，输出为目标语言序列 $y_1,\dots,y_{T'}$，二者长度不必相同。

Encoder RNN 逐步读取源序列：

$$
h_t = f_W(x_t,h_{t-1})
$$

Decoder RNN 以 encoder 的最终状态作为初始条件，逐步生成目标序列：

$$
s_t = g_U(y_{t-1},s_{t-1},c)
$$

其中 $c$ 是 **context vector**，常取 encoder 的最后一个 hidden state $h_T$。

### Teacher Forcing

Seq2Seq 训练时常使用 **Teacher Forcing**：即使 decoder 上一步预测错误，下一步输入仍使用 ground truth token，而不是模型自己预测的 token。

训练和测试的差异是：

| 阶段 | 下一步输入 |
| :--- | :--- |
| 训练 | ground truth token |
| 测试 | 上一步模型生成的 token |

Teacher Forcing 可以稳定训练，但也会带来 exposure bias：测试时模型必须面对自己生成的历史错误，而训练时没有完全见过这种分布。

### 固定 Context Vector 瓶颈

传统 Seq2Seq 将整个输入序列压缩到一个固定长度的 context vector $c$。当输入很短时该方法可行，但当 $T$ 很大时会出现瓶颈：

- 单个向量容量有限，难以保存长句的全部细节；
- 长距离信息需要通过 RNN hidden state 连续传递，仍受梯度消失影响；
- decoder 每一步都只能间接访问源序列，无法按需回看输入中的局部片段。

Attention 的核心思想正是让 decoder 在每个输出步都能访问 encoder 的所有 hidden states，而不是只依赖一个固定向量。

## Attention

### Additive Attention

在带 attention 的 Seq2Seq 中，encoder 仍产生一组 hidden states：

$$
h_1,h_2,\dots,h_T
$$

decoder 在第 $t$ 步根据上一时刻状态 $s_{t-1}$ 与每个 encoder hidden state $h_i$ 计算 alignment score：

$$
e_{ti} = v^\top \tanh(W_s s_{t-1}+W_h h_i)
$$

再用 softmax 得到 attention weight：

$$
\alpha_{ti} =
\frac{\exp(e_{ti})}{\sum_j \exp(e_{tj})}
$$

最后对 encoder states 加权求和，得到当前步 context vector：

$$
c_t = \sum_i \alpha_{ti}h_i
$$

其中 $\alpha_{ti}$ 表示 decoder 第 $t$ 步对输入第 $i$ 个 token 的关注程度。该对齐关系无需人工标注，可通过端到端训练自动学得。

### Attention 的直观流程

**Pipeline**：

1. Encoder 读取完整输入序列，得到每个位置的 hidden state。
2. Decoder 在当前步拿自己的状态作为查询。
3. 将该状态与每个 encoder state 计算相关性分数。
4. 对所有分数做 softmax，得到权重分布。
5. 用权重对 encoder states 加权求和，得到当前 context。
6. Decoder 使用该 context 生成当前输出 token。

Attention 可以看作一种可学习的软寻址机制：decoder 不再被迫从单一向量中读取全部信息，而是每一步按需要从输入序列中取信息。

### Scaled Dot-Product Attention

现代 Transformer 使用更简洁的 **Scaled Dot-Product Attention**：

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

其中 $Q$ 是 **Query**，$K$ 是 **Key**，$V$ 是 **Value**，$d_k$ 是 key/query 的维度。

缩放因子 $\sqrt{d_k}$ 的作用是避免点积值随维度增大而过大。若 $Q$ 和 $K$ 的各维近似独立且方差为 1，则点积 $Q^\top K$ 的方差约为 $d_k$。不缩放时 softmax 容易饱和，导致梯度变小。

### Query-Key-Value 视角

QKV 形式可以理解为检索过程：

| 向量 | 作用 |
| :--- | :--- |
| **Query** $Q$ | 当前 token 想要查询什么信息 |
| **Key** $K$ | 每个候选 token 的索引或匹配特征 |
| **Value** $V$ | 被加权汇聚的实际内容 |

Attention 并不是直接用原始输入做加权平均，而是先通过可学习矩阵映射：

$$
Q = XW_Q,\quad K = XW_K,\quad V = XW_V
$$

这样模型可以分别学习“如何匹配”和“匹配后读取什么内容”。

## Self-Attention

### 基本定义

**Self-Attention** 是指 $Q,K,V$ 都来自同一组输入 token。设输入为：

$$
X \in \mathbb{R}^{N\times D_{\text{in}}}
$$

则：

$$
Q=XW_Q,\quad K=XW_K,\quad V=XW_V
$$

相似度矩阵、attention 权重与输出为：

$$
E=\frac{QK^\top}{\sqrt{d_k}},\quad
A=\operatorname{softmax}(E),\quad
Y=AV
$$

输出中每个 token 表示都是所有 value 的加权组合：

$$
Y_i=\sum_j A_{ij}V_j
$$

因此 self-attention 允许每个 token 一步访问全局上下文。

### Cross-Attention 与 Self-Attention

| 类型 | Q 来源 | K,V 来源 | 典型用途 |
| :--- | :--- | :--- | :--- |
| **Cross-Attention** | decoder tokens | encoder tokens | 翻译、图文生成等 encoder-decoder 结构 |
| **Self-Attention** | 同一组 tokens | 同一组 tokens | Transformer encoder、decoder、语言模型 |

Cross-attention 让目标序列读取源序列信息；self-attention 则让同一序列内部的 token 彼此交换信息。

### Permutation Equivariance

纯 self-attention 对输入顺序是 **permutation equivariant**（置换等变）的：

$$
F(\sigma(X)) = \sigma(F(X))
$$

也即，如果输入 token 顺序被打乱，输出也只是按相同方式打乱，具体数值不变。这说明 self-attention 本身不知道 token 的顺序。

因此 Transformer 必须显式加入 **Position Encoding**（位置编码）。常见方法包括：

- **Absolute Position Embedding**：为每个绝对位置学习或定义一个位置向量，并与 token embedding 相加。
- **2D Position Embedding**：在视觉任务中编码 patch 的二维位置。
- **RoPE**（Rotary Position Embedding）：通过旋转 query 和 key，使点积自然携带相对位置信息。

RoPE 的核心性质可写为：

$$
(R(\theta_i)q_i)^\top(R(\phi_j)k_j)
=
q_i^\top R(\phi_j-\theta_i)k_j
$$

该式说明，旋转后 query-key 点积依赖相对位置差，而不仅是绝对位置。

### Masked Self-Attention

语言模型训练目标是 **next token prediction**。若第 $i$ 个 token 在训练时可以看到后续 token，就会泄漏答案，与测试时自回归生成不一致。

**Masked Self-Attention** 使用 causal mask，将当前位置之后的 attention score 置为 $-\infty$：

$$
E_{ij} =
\begin{cases}
E_{ij}, & j \le i \\
-\infty, & j > i
\end{cases}
$$

softmax 后，未来 token 的权重为 0。因此每个 token 只能 attend 到自己及其之前的 tokens。

### Multi-Head Attention

**Multi-Head Attention** 将 $Q,K,V$ 投影到多组子空间中，并行执行多次 attention：

$$
\operatorname{head}_i
=
\operatorname{Attention}(QW_i^Q,KW_i^K,VW_i^V)
$$

再拼接各 head 输出并通过输出投影融合：

$$
\operatorname{MultiHead}(Q,K,V)
=
\operatorname{Concat}(\operatorname{head}_1,\dots,\operatorname{head}_h)W_O
$$

不同 head 可以关注不同关系，例如局部邻近、长距离依赖、语法结构或视觉区域之间的关联。

### 计算复杂度

Self-attention 的主要成本来自 $QK^\top$：

$$
QK^\top \in \mathbb{R}^{N\times N}
$$

因此计算复杂度和 attention matrix 显存都随序列长度呈二次增长：

$$
O(N^2)
$$

当 $N$ 很大时，例如十万级或百万级 token，直接保存完整 attention matrix 会非常昂贵。

**Flash Attention** 通过 IO-aware tiling 和重计算优化显存访问，在不近似 attention 结果的前提下降低显存占用。它计算的是 **exact attention**，区别于将 attention 近似为线性复杂度的 **Linear Attention**。

## Transformer

### 与 RNN / CNN 的对比

Transformer 用 self-attention 作为 token 之间的信息交互机制。相比 RNN 和 1D CNN，它在并行性和长距离建模上具有明显优势。

| 特性 | RNN | 1D CNN | Self-Attention |
| :--- | :--- | :--- | :--- |
| 并行性 | 顺序计算，难并行 | 高度并行 | 高度并行 |
| 感受野 | 理论全局，实际受梯度影响 | 局部，随层数扩大 | 单层即可全局交互 |
| 位置信息 | 天然顺序 | 局部结构隐含顺序 | 需显式位置编码 |
| 长距离依赖 | 容易遗忘 | 需堆叠多层 | 可直接建立连接 |
| 主要代价 | 时间方向顺序执行 | 卷积层数与核大小 | $O(N^2)$ attention |

RNN 的优势是线性时间步处理，但无法充分并行；CNN 可并行但局部感受野增长慢；self-attention 以更高的空间和计算开销换取全局交互。

### Transformer Block

原始 Transformer block 主要由两部分组成：

1. **Multi-Head Self-Attention**：负责 token mixing，也即 token 之间的信息交互。
2. **Feed-Forward Network**（FFN）：对每个 token 独立执行 MLP，负责 channel mixing 和非线性变换。

典型 block 流程：

1. 输入 token 序列 $X$。
2. 经过 multi-head self-attention 得到全局上下文表示。
3. 加 residual connection，并进行 layer normalization。
4. 经过两层 MLP，即 FFN。
5. 再次加 residual connection 和 layer normalization。

FFN 常写为：

$$
\operatorname{FFN}(X)=\sigma(XW_1+b_1)W_2+b_2
$$

其中 $W_1$ 通常将维度从 $D$ 扩展到 $4D$，$W_2$ 再投影回 $D$。

### Layer Normalization

Transformer 中通常使用 **Layer Normalization**。它对每个 token 的 channel 维度独立归一化，而不是跨 batch 或序列长度归一化。

对于 token 表示 $x$，LayerNorm 可写为：

$$
\operatorname{LayerNorm}(x)
=
\gamma\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta
$$

LayerNorm 适合 NLP 和多模态场景，因为 batch 中不同样本、不同 token 的统计分布差异很大，跨 batch 归一化并不稳定。

### Transformer 用于语言模型

在语言模型中，Transformer 的输入输出流程如下：

1. 将 token id 通过 embedding matrix 映射为 $D$ 维向量。
2. 加入位置编码。
3. 堆叠多个 masked Transformer blocks。
4. 将每个位置的输出向量通过 projection matrix 映射到 vocabulary 大小。
5. 使用 softmax + cross-entropy 训练 next token prediction。

若词表大小为 $V$，模型维度为 $D$，则：

- embedding matrix 形状为 $V\times D$；
- 输出 projection matrix 形状为 $D\times V$。

**注**：decoder-only 语言模型必须使用 causal mask；若不 mask，模型训练时会直接看到未来 token，next token prediction 任务会失效。

## Transformer 的现代改进

### Pre-Norm Transformer

原始 Transformer 常采用 **Post-Norm**，即先 residual addition，再做 LayerNorm。现代大模型更常使用 **Pre-Norm**：

$$
X' = X + \operatorname{Attention}(\operatorname{LN}(X))
$$

$$
Y = X' + \operatorname{FFN}(\operatorname{LN}(X'))
$$

Pre-Norm 将归一化放到 attention 和 FFN 之前，使 residual path 更接近直接恒等映射，深层网络训练更稳定。

### QK-Norm 与 RMSNorm

**QK-Norm** 在计算 attention similarity 前对 queries 和 keys 做归一化：

$$
Q=\operatorname{normalize}(XW_Q),\quad
K=\operatorname{normalize}(XW_K)
$$

这样可以控制 $QK^\top$ 的尺度，减少梯度尖峰，使训练更稳定。

现代模型也常使用 **RMSNorm** 替代 LayerNorm。RMSNorm 不减均值，只按均方根缩放：

$$
\operatorname{RMSNorm}(x)_i
=
\frac{x_i}{\operatorname{RMS}(x)}\gamma_i
$$

其中：

$$
\operatorname{RMS}(x)=
\sqrt{\epsilon+\frac{1}{d}\sum_{j=1}^{d}x_j^2}
$$

RMSNorm 计算更简单，实践中常用于大语言模型。

### SwiGLU MLP

经典 FFN 为：

$$
Y=\sigma(XW_1)W_2
$$

其中 $W_1\in\mathbb{R}^{D\times 4D}$，$W_2\in\mathbb{R}^{4D\times D}$。

**SwiGLU** 使用门控结构增强 FFN 表达能力：

$$
Y =
\left(\operatorname{SiLU}(XW_1)\odot XW_2\right)W_3
$$

其中 $W_1,W_2\in\mathbb{R}^{D\times H}$，$W_3\in\mathbb{R}^{H\times D}$。门控项使模型可以动态选择哪些 channel 信息通过。

### Mixture of Experts

**Mixture of Experts**（MoE）将每个 Transformer block 中的 FFN 替换为多个 expert MLP。每个 token 只被路由到少数几个 expert：

- 共有 $E$ 个 expert；
- 每个 token 激活 $A<E$ 个 expert；
- 总参数量约增加 $E$ 倍；
- 单 token 计算量只约增加 $A$ 倍。

**Pipeline**：

1. Router 根据 token 表示计算各 expert 的得分。
2. 选择 top-$A$ 个 expert。
3. token 分别经过被选中的 expert MLP。
4. 按 router 权重聚合 expert 输出。
5. 与 residual path 结合进入下一层。

MoE 的优势是扩大总参数量而不等比例增加每次 forward 的计算量。难点在于负载均衡：若 router 总把 token 分给少数 expert，会导致部分 expert 过载、部分 expert 几乎不训练。

## Vision Transformer

### Patch Embedding

**Vision Transformer**（ViT）将图像切分为固定大小 patch，并把每个 patch 当作一个视觉 token。

以 $224\times224\times3$ 图像和 $16\times16$ patch 为例：

1. 图像被切分为 $14\times14=196$ 个 patch。
2. 每个 patch 大小为 $16\times16\times3=768$。
3. 将每个 patch flatten 成 768 维向量。
4. 通过线性层投影到模型维度 $D$。
5. 加入 2D position embedding。
6. 输入 Transformer。

分类时，可对所有 patch 输出做 average pooling，再接线性分类层；也可以加入额外的 **[CLS] token**，用其输出表示整张图像。

### ViT Pipeline

**Pipeline**：

1. 输入图像 $H\times W\times C$。
2. 按 $P\times P$ 划分为 $N=\frac{HW}{P^2}$ 个 patch。
3. 每个 patch flatten 后线性投影为 token embedding。
4. 加入二维位置编码。
5. 输入若干层 Transformer encoder。
6. 汇聚 token 表示，输出图像级分类结果。

与语言模型不同，ViT 分类任务不需要 causal mask。每个 image patch 都可以 attend 到其他所有 patch。

### ViT 与 CNN 的归纳偏置

**Inductive Bias**（归纳偏置）指模型结构中预设的先验假设。CNN 与 ViT 的核心区别在于归纳偏置强弱不同。

| 模型 | 归纳偏置 | 特点 |
| :--- | :--- | :--- |
| **CNN** | 局部性、平移等变、层级感受野 | 数据效率高，适合中小规模视觉数据 |
| **ViT** | 弱局部先验，依赖位置编码 | 更灵活，依赖大规模数据学习空间关系 |

CNN 的卷积核天然关注局部区域，并通过堆叠形成 edge、texture、part、object 的层级特征。ViT 则从第一层开始允许全局 token 交互，没有内置的局部层级结构，因此在小数据集上往往不如 CNN 稳定。

### 数据规模效应

ViT 的性能高度依赖训练数据规模：

| 数据规模 | 典型现象 |
| :--- | :--- |
| ImageNet-1K 级别 | CNN 往往优于原始 ViT |
| ImageNet-21K 级别 | ViT 与 CNN 差距缩小 |
| JFT-300M 级别 | ViT 可显著超过 CNN |

这说明 ViT 并不是简单“比 CNN 更强”，而是在大数据条件下更能发挥弱归纳偏置和全局建模的优势。

### 多模态统一

ViT 的核心价值在于 **tokenization**：图像 patch 被转化为与文本 token 同质的向量序列。这样视觉 token 和语言 token 可以进入同一个 Transformer，通过 self-attention 直接交互。

在 **Vision-Language Model**（VLM）中，视觉 token 可以 attend 到语言 token，语言 token 也可以 attend 到图像区域。例如文本中的 "straw" 可以与图像中草帽区域建立 attention 连接。这为图文理解、视觉问答、多模态对话和图像生成提供了统一架构基础。

## 方法论总结

### 架构、数据与实际行为

本讲最后强调了深度学习研究中的三层问题：

1. **能不能**：架构在理论上是否具备完成任务的表达能力。
2. **数据支不支持**：数据量、多样性和标注质量是否足以支撑模型学习真正规律。
3. **训出来什么样**：模型实际学到的是泛化规律，还是记忆、检索或利用数据偏置。

Image Captioning 和 VQA 都说明，神经网络会优先选择最容易降低 loss 的路径。若数据或训练目标允许捷径，模型可能不会学习研究者期望的语义能力。

### 从 RNN 到 Transformer

RNN、LSTM 和 GRU 通过 hidden state 递推建模序列，但长距离依赖受梯度和顺序计算限制。Attention 让模型在每一步直接访问相关 token，Transformer 则将 attention 作为基础构件，彻底改变了序列建模方式。

Transformer 的关键贡献可以概括为：

- 用 self-attention 实现全局 token 交互；
- 用位置编码补足顺序信息；
- 用 multi-head 提升关系建模能力；
- 用 FFN 提供 token 内部的非线性变换；
- 用 residual 与 normalization 支撑深层训练；
- 通过 tokenization 将语言、视觉和其他模态纳入统一框架。

**注**：Transformer 已成为现代大模型的核心骨架，但它并不是无代价的结构。其主要瓶颈仍是长序列下的 $O(N^2)$ attention 计算，因此 Flash Attention、稀疏 attention、linear attention 和 MoE 等技术都围绕效率与规模化展开。
