---
title: '大模型 2：Video Transformers 与多模态基础模型'
excerpt: '26 春 计算机视觉导论 L14'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'May 31 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Video Transformers

### 视频表示与 token 爆炸

设单帧图像大小为 $224\times224$，ViT 使用 $16\times16$ patch，则每帧有：
$$
14\times14=196
$$

个视觉 token。若输入 $T=16$ 帧，则 token 数约为：
$$
196\times16=3136
$$

标准 self-attention 需要计算所有 token 两两之间的关系，复杂度为：
$$
O((TN)^2)=O(T^2N^2)
$$

其中 $T$ 为帧数，$N$ 为每帧 patch token 数。对短视频分类尚可接受，但对几分钟级别的长视频，token 数可能达到百万量级，直接输入 Transformer 在计算和显存上都不可扩展。

**注**：视频理解的关键不是简单把所有帧堆进 ViT，而是在保留时空信息的同时控制 attention 复杂度和 token 数量。

### 两类效率改进策略

Video Transformer 的效率改进大致分为两类：

| 策略 | 核心思想 | 代表方法 |
| :--- | :--- | :--- |
| 修改 **Attention** 算子 | 不让所有 token 直接做全局 attention | Divided Space-Time Attention、Video Swin Transformer |
| 减少输入 token 数 | 降低送入 Transformer 的 token 长度 | MViT、Tubelet Embedding、Adaptive Token Selection |

二者不是互斥关系。实际视频模型通常同时使用局部 attention、多尺度 token 压缩和时间轴采样，以适配更长视频。

### Joint Space-Time Attention

最直接的做法是 **Joint Space-Time Attention**：将所有帧的所有 patch token 展平成一个长序列，然后做标准 self-attention。

若每帧有 $N$ 个 token，共 $T$ 帧，则共有 $TN$ 个 token，attention matrix 大小为：
$$
TN\times TN
$$

该方法的优点是建模能力最直接，任意两个时空位置都可以在一层中交互；缺点是复杂度为 $O(T^2N^2)$，对视频极其昂贵。

### Divided Space-Time Attention

**Divided Space-Time Attention** 将视频 attention 分解为空间 attention 和时间 attention：

1. **Temporal Attention**：对每个固定空间位置，只在不同帧之间做 attention。
2. **Spatial Attention**：对每一帧内部的 patch token 做 attention。

复杂度从：
$$
O(T^2N^2)
$$

降低为：
$$
O(NT^2 + TN^2)=O(TN(T+N))
$$

其中 $O(NT^2)$ 来自时间 attention，$O(TN^2)$ 来自空间 attention。

**Pipeline**：

1. 将视频切成 $T$ 帧，每帧切成 $N$ 个 patch token。
2. 对每个空间 patch 位置，沿时间轴计算 attention，聚合同一位置在不同帧的信息。
3. 对每一帧内部的所有 patch 计算空间 attention，建模同一时刻的物体和场景关系。
4. 多层堆叠后，时间信息与空间信息通过层间传播实现间接全局交互。

**注**：分解 attention 牺牲了一层内的完全时空交互，但大幅降低计算量。经过多层网络后，不同时间、不同空间位置的信息仍能逐步传播。

### Video Swin Transformer

**Video Swin Transformer** 将 Swin Transformer 的局部窗口思想扩展到视频。它在三维时空体中定义局部窗口，例如 $2\times7\times7$ 或更小的时间-高度-宽度窗口，并只在窗口内部计算 attention。

其核心机制包括：

1. **3D Local Window Attention**：每个 token 只与同一局部时空窗口内的 token 交互。
2. **Shifted Window**：相邻层移动窗口划分方式，使前一层不同窗口中的 token 在后一层进入同一窗口。
3. **Hierarchical Feature**：随着网络加深，分辨率降低、通道数增加，形成类似 CNN 的层级表示。

局部窗口降低了 attention 复杂度，移动窗口则避免信息长期局限在固定窗口内。

### MViT 与多尺度 token 压缩

**Multiscale Vision Transformer**（MViT）的思路是：随着网络加深，逐步减少 token 数量、增加特征通道数。这与 CNN / ResNet 中空间分辨率逐层降低、语义抽象逐层增强的设计类似。

在 attention 中，计算成本主要来自 query 与 key 的两两匹配。MViT 可以通过 pooling 或 strided convolution 对 token 做下采样，尤其是减少 **Key** 和 **Value** 的长度：
$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

若 $K,V$ 的 token 数从 $N$ 降到 $N/16$，attention 计算和显存都显著下降。与此同时，保留下来的 token 通常具有更高通道维度，用于表达更高层语义。

### Tubelet Embedding

图像 ViT 的 patch embedding 只在二维空间切 patch。视频中可以进一步使用 **Tubelet Embedding**：在时间维度也做局部聚合，把连续若干帧中的同一空间区域作为一个三维 tubelet。

例如每 $4$ 帧聚合一次，则时间维度 token 数减少为原来的 $1/4$。单个 token 不再只表示一帧中的 patch，而是表示一个短时间片段中的局部时空体。

**Pipeline**：

1. 将视频划分为若干时间片段。
2. 在每个时间片段内按空间位置切分 3D tubelet。
3. 将 tubelet flatten 或用 3D convolution 投影为 token embedding。
4. 将这些时空 token 输入后续 Transformer。

Tubelet 的优点是减少 token 数并让低层 token 自带短时运动信息；缺点是时间分辨率会下降，过大的 tubelet 可能损失快速动作细节。

### Adaptive Token Selection

对于超长视频，完整输入所有帧通常没有必要。**Adaptive Token Selection** 的目标是根据任务动态选择相关片段或相关 token。

典型做法包括：

1. 用轻量模型或检索模块先筛选候选帧。
2. 保留与当前问题、导航目标或行为预测最相关的历史 token。
3. 丢弃冗余帧、静态背景或任务无关片段。
4. 将筛选后的 token 输入大模型进行精细推理。

在大模型 agent 场景中，还可以在推理时动态抽帧：模型先判断问题需要关注哪段视频，再提取对应关键帧或片段进行视觉编码。

**注**：长视频理解的难点不只是模型容量，还包括“看哪里”的选择问题。测试时动态抽帧本质上把部分计算预算从密集感知转移到决策式信息检索。

### 从短视频分类到 VideoLLM

早期视频理解常聚焦于固定类别的短视频分类，例如 action recognition。模型输入短 clip，输出一个类别标签。

现代 **Video Language Understanding** 或 **VideoLLM** 则直接将视频接入语言模型，输出自由文本。它可以处理：

1. 视频问答；
2. 视频 caption；
3. 事件定位；
4. 长视频摘要；
5. 视觉导航和具身任务中的状态理解。

这种范式的变化在于：输出不再受固定分类标签限制，而是由语言模型以开放文本形式表达视觉理解结果。

## Foundation Models

### 基础模型范式

**Foundation Model** 指在大规模、多样化数据上预训练得到的通用模型。它不针对单一任务训练，而是通过自监督、弱监督或多模态对齐学习通用表示，再通过 prompt、zero-shot、few-shot 或 fine-tuning 适配下游任务。

基础模型的典型类别包括：

| 类别 | 代表模型 | 主要能力 |
| :--- | :--- | :--- |
| **Language** | ELMo、BERT、GPT、T5 | 文本理解与生成 |
| **Classification / Alignment** | CLIP、CoCa | 图文对齐、零样本分类 |
| **LM + Vision** | LLaVA、Flamingo、GPT、Gemini、Qwen、Molmo | 视觉问答、多模态对话、图文推理 |
| **And More** | SAM、Whisper、DALL-E、Stable Diffusion、Imagen | 分割、语音、图像生成等 |

本讲重点讨论视觉基础模型与语言模型结合的路线：先通过 CLIP-style 模型学习图文对齐，再把视觉 token 接入 LLM，形成端到端的视觉语言模型。

### 从 SimCLR 到 CLIP

**SimCLR** 是自监督视觉表示学习方法。它对同一张图像做两种数据增强，得到两个 view，并训练 encoder 使同一图像的不同 view 在特征空间中接近，不同图像的 view 远离。

**CLIP** 将这一思想扩展到图像-文本对齐。它使用大规模互联网图文对训练两个 encoder：

- **Image Encoder**：将图像编码为向量；
- **Text Encoder**：将文本编码为向量。

训练目标是让同一图文对的向量相似度高，不匹配图文对的相似度低。

对于一个 batch 中的 $N$ 个图文对，设图像特征为 $I_i$，文本特征为 $T_j$，相似度为：
$$
s_{ij}=\frac{I_i^\top T_j}{\tau}
$$

其中 $\tau$ 为 temperature。图像到文本方向的对比损失可写为：
$$
L_{I\rightarrow T}
=
-\frac{1}{N}\sum_i
\log
\frac{\exp(s_{ii})}{\sum_j\exp(s_{ij})}
$$

文本到图像方向类似，最终常取二者平均：
$$
L=\frac{1}{2}(L_{I\rightarrow T}+L_{T\rightarrow I})
$$

该目标使 batch 对角线上的正确图文配对得分最高，非对角线的错误配对得分较低。

### CLIP 的零样本分类

CLIP 可以直接用于 **Zero-shot Classification**（零样本分类）。流程如下：

1. 将候选类别名称写成自然语言 prompt，例如 `"a photo of a dog"`。
2. 用 Text Encoder 得到每个类别的文本向量。
3. 用 Image Encoder 得到待分类图像的图像向量。
4. 计算图像向量与所有类别文本向量的相似度。
5. 选择相似度最高的类别作为预测结果。

使用 prompt template 和多模板 ensemble 通常可以提升分类性能。例如相比直接输入 `"dog"`，`"a photo of a dog"` 更接近 CLIP 训练时见过的自然语言描述。

CLIP 的关键价值是把分类权重从固定的 learned classifier 变成可由文本动态生成的类别向量。只要类别可以用语言描述，模型就可以在不重新训练分类头的情况下做开放类别识别。

### CLIP-style 模型的优势

CLIP-style 模型的优势包括：

| 优势 | 说明 |
| :--- | :--- |
| 大规模弱监督 | 互联网图文对比人工标注更容易获得 |
| 开放词表 | 类别由文本定义，不限于训练时固定标签集合 |
| 迁移能力强 | 学到的图像表示可用 linear probe 或 zero-shot 迁移到多个数据集 |
| 跨模态检索 | 图像和文本共享向量空间，可用于图搜文、文搜图 |

这类模型推动视觉模型从封闭标签空间转向开放语义空间。

### SigLIP

**SigLIP** 是 CLIP 的常见变体。CLIP 使用 batch 内 softmax 竞争：每张图像在一个 batch 的所有文本中选择正确文本，每段文本也在所有图像中选择正确图像。

SigLIP 则使用 sigmoid loss，把图文配对看作独立的二分类问题：匹配对为正样本，不匹配对为负样本。其核心差异是减少对全局 batch softmax 的依赖，训练在大 batch 或分布式场景中更灵活。

**注**：SigLIP 仍属于图文对齐模型，目标仍是学习共享语义空间；变化主要在 contrastive loss 的形式。

### CLIP 的局限：组合性与事件结构

CLIP 学习的是图像和整句文本的全局相似度。这使它在开放分类和检索上很强，但对细粒度组合语义理解不足。

典型问题是 **Language Compositionality**（语言组合性）。例如两句文本包含相同实体和相同事件词，但角色相反：

- “protester attacks police”
- “police attacks protester”

若图像中同时有 protester 和 police，普通 CLIP 可能主要捕捉对象共现和事件词，而没有充分理解谁是 agent、谁是 target。

全局图文对比不强制模型学习事件结构，原因包括：

1. 文本被压缩为单个全局句向量，局部角色关系容易丢失。
2. batch 内负样本多数是普通不匹配文本，未必包含结构上相似但语义相反的 hard negative。
3. 即使扩大 batch，也不保证能出现“同对象、同事件、角色交换”的关键负样本。

**注**：CLIP 的“看懂关键词”不等价于“理解结构”。事件角色、空间关系、计数、动作因果等细粒度语义通常需要更强监督或生成式目标。

### CoCa：对比学习与 caption 生成结合

**CoCa**（Contrastive Captioners）尝试补足 CLIP 的细粒度理解不足。它同时优化两个目标：

1. **Contrastive Loss**：保持图像和文本的全局对齐能力。
2. **Captioning Loss**：让模型根据图像生成 caption，迫使文本 decoder 关注图像局部内容。

其结构可以理解为在 CLIP-style 双塔对齐之外，引入带 cross-attention 的文本生成模块。文本解码时可以 attend 到图像 patch token，从而学习物体属性、空间关系和局部细节。

**Pipeline**：

1. 图像输入 Vision Encoder，得到视觉 token。
2. 文本输入 Text Encoder / Decoder，得到文本表示。
3. 中间的全局文本表示与图像表示做对比学习。
4. 文本 decoder 通过 cross-attention 读取图像 token，并预测 caption token。
5. 总损失由对比损失和 captioning loss 共同构成。

CoCa 的核心思想是：全局对齐适合检索与 zero-shot 分类，生成 caption 则提供更细粒度的视觉-语言监督。

## Vision + Language Model Family

### 从图文对齐到 LLM 接入视觉

CLIP 和 CoCa 学到的是图像-文本共享表示，但它们本身不是完整的对话式语言模型。下一步是把视觉信息接入预训练 **Large Language Model**（LLM），利用 LLM 的自回归生成能力完成开放问答和多轮对话。

基本问题是：视觉 encoder 输出的是图像特征或 patch token，而 LLM 接收的是文本 token embedding。视觉语言模型需要一个桥接模块，将视觉 token 映射到 LLM 的 embedding space。

### LLaVA

**LLaVA** 是轻量视觉语言对齐的代表方法。它使用预训练 CLIP Vision Encoder 提取图像 patch token，再通过可学习的 linear projection 映射到 LLM 的输入空间，并与文本 token 拼接后输入 decoder-only LLM。

**Architecture Pipeline**：

1. 图像输入 CLIP Vision Encoder，得到视觉 patch tokens。
2. 取 CLIP 的倒数第二层视觉特征，而不是只取最后的 class token。
3. 用 linear projection 将视觉 token 映射到 LLM token embedding 维度。
4. 将视觉 token 与文本 prompt token 拼接。
5. 输入自回归 LLM，生成回答文本。

选择倒数第二层的原因是：CLIP 最后一层通常更服务于全局图文对齐，class token 受到最强监督，而 patch token 的局部信息可能被压缩。倒数第二层通常保留更丰富的局部视觉细节。

### LLaVA 的训练策略

LLaVA 通常采用两阶段训练：

1. **Alignment Pretraining**：冻结 Vision Encoder 和 LLM，只训练 projection 层，使视觉 token 对齐到语言 embedding 空间。
2. **Instruction Tuning**：使用高质量图文指令数据，微调 LLM 或部分模块，使模型学会按用户指令回答视觉问题。

这种设计的数据效率很高，因为大部分视觉语义来自 CLIP，大部分语言能力来自 LLM。训练重点变成学习“如何把图像特征翻译成 LLM 可读的 token”。

**注**：LLaVA 的能力上限受视觉 encoder、投影层信息瓶颈和指令数据质量共同影响。若视觉 token 本身缺少细粒度空间信息，LLM 再强也难以凭空恢复。

### Flamingo

**Flamingo** 是另一类视觉接入 LLM 的方法。它不简单把视觉 token 拼接进语言 token 序列，而是在预训练语言模型中插入 **Gated Cross-Attention** 层，让文本 token 在生成过程中读取视觉特征。

其关键组件包括：

| 组件 | 作用 |
| :--- | :--- |
| Frozen Vision Encoder | 提取图像或视频视觉特征 |
| Perceiver Resampler | 将变长视觉特征压缩为固定数量的视觉 token |
| Frozen Language Model | 保留预训练 LLM 的语言能力 |
| Gated Cross-Attention | 让语言 token 按需读取视觉 token |

**Gated Cross-Attention** 中的 gate 通常初始化为接近 0，使模型训练初期几乎保持原始语言模型行为，随后逐渐学习引入视觉信息。这样可以降低破坏 LLM 预训练能力的风险。

### Flamingo 的图文交错与 in-context learning

Flamingo 的重要特点是支持图文交错输入，例如：

```text
<image> caption 1
<image> caption 2
<image> question
```

模型可以利用上下文中的图文示例执行 **In-context Learning**（上下文学习）。也即，不需要对每个新任务单独微调，而是在 prompt 中提供几个图文示例，模型便能按示例格式回答新图像的问题。

**Pipeline**：

1. 多张图像或视频帧分别经过视觉 encoder。
2. Perceiver Resampler 将每个视觉输入压缩为固定长度 token。
3. 文本 token 在自回归 LLM 中逐步解码。
4. 插入的 gated cross-attention 层让文本 token 读取当前上下文相关的视觉 token。
5. 模型输出 caption、答案或其他自由文本。

Flamingo 的核心贡献是将强语言模型、视觉编码器和图文交错数据结合，使多模态模型具备少样本泛化能力。

### Qwen2-VL

**Qwen2-VL** 代表了更现代的开源 VLM 实践，重点在原生分辨率、多尺度视觉特征和视频时间建模。

其关键设计包括：

1. **Native Resolution**：不把所有图像强行 resize 到固定尺寸，而是根据原始分辨率动态生成不同数量的视觉 token。高分辨率图像保留更多细节，低分辨率图像节省 token。
2. **SigLIP-style Vision Encoder**：使用更适合大规模图文对齐的视觉 encoder，并通过额外自监督目标增强表示稳定性。
3. **多尺度特征融合**：同时利用底层细节特征和高层语义特征，以兼顾 OCR、定位、属性识别和语义问答。
4. **视频时间编码**：为视频帧引入时间位置编码，并在文本侧显式表示时间戳，使模型能够回答与绝对时间相关的问题。

**注**：原生分辨率是 VLM 的重要趋势。固定 $224\times224$ 输入适合分类预训练，但会损失文字、小物体和精细空间关系，对文档理解、界面理解和高分辨率图像问答尤其不利。

### Molmo 与 PixMo

**Molmo** 强调完全开源与高质量数据：不仅开放模型权重，也开放训练数据、代码和完整 pipeline，并避免依赖闭源模型蒸馏。

其相关数据集 **PixMo** 的核心观点是：数据质量可以比数据数量更关键。相比海量弱图文对，高质量、密集、人工描述的数据能提供更丰富的空间关系、物体属性和场景细节监督。

一种数据收集方式是要求标注员围绕单张图像连续语音描述 60-90 秒，再通过 ASR 转写为详细文本。这样得到的 caption 往往包含：

1. 物体类别与属性；
2. 物体之间的空间关系；
3. 场景背景与光照；
4. 动作、状态和交互；
5. 可能被普通 alt-text 忽略的小细节。

**注**：对于 VLM，训练数据不是越多越好这一单变量问题。低质量图文对容易带来噪声、偏置和表层相关；高质量密集描述能更直接监督模型学习细粒度视觉语义。

## Omni Models

### 超越视觉与语言

最后的趋势是 **Omni Models** 或原生多模态模型，即不仅处理图像和文本，还将音频、视频、语音等模态纳入同一个端到端系统。

传统语音交互常由三段 pipeline 组成：

1. **ASR**：语音识别，将音频转文本。
2. **LLM**：文本理解与生成。
3. **TTS**：文本转语音。

该链路可复用成熟模块，但存在延迟高、错误级联和副语言信息丢失等问题。例如语气、停顿、笑声、情绪和重音在转写成文本后可能被弱化。

原生多模态模型则直接输入音频 token、视觉 token 和文本 token，并直接输出文本或音频 token。其目标是实现低延迟、流式、端到端的自然交互。

### 多模态统一的关键问题

多模态基础模型的核心挑战包括：

| 问题 | 说明 |
| :--- | :--- |
| Tokenization | 如何把图像、视频、音频转为可与文本对齐的 token |
| Alignment | 不同模态 token 如何进入同一语义空间 |
| Long Context | 视频和音频序列很长，attention 成本高 |
| Fine-grained Grounding | 模型是否能定位具体区域、时间和事件角色 |
| Data Quality | 多模态数据是否准确、密集、覆盖足够多场景 |
| Latency | 实时交互要求流式输入输出和低延迟推理 |

这些问题也解释了为什么 Video Transformer 的效率、CLIP 的对齐、LLaVA/Flamingo 的视觉接入、Qwen2-VL 的原生分辨率和 Molmo 的数据质量会在同一讲中连成一条主线。

## Summary

### 方法脉络

| 方向 | 代表方法 | 核心贡献 | 主要局限 |
| :--- | :--- | :--- | :--- |
| Video Transformer | Divided Attention、Video Swin、MViT | 降低视频 attention 与 token 成本 | 长视频仍需选择性计算 |
| 图文对齐 | CLIP、SigLIP | 开放词表、零样本分类、图文检索 | 细粒度组合语义不足 |
| 对齐 + 生成 | CoCa | 同时学习全局对齐与 caption 生成 | 仍依赖数据覆盖和生成目标质量 |
| 视觉接入 LLM | LLaVA | 用 projection 轻量连接 CLIP 与 LLM | 视觉 token 信息瓶颈明显 |
| 图文交错 LLM | Flamingo | Gated cross-attention 与 in-context learning | 架构和数据 pipeline 更复杂 |
| 现代开源 VLM | Qwen2-VL、Molmo | 原生分辨率、多尺度、数据质量与开放 pipeline | 高质量数据和长上下文成本仍是瓶颈 |

### 核心结论

视频理解与多模态基础模型都围绕同一个问题展开：如何把高维、长序列、多模态信息转成可计算、可对齐、可生成的 token 表示。

Video Transformer 解决的是视觉 token 在时间维度上的效率问题；CLIP-style 模型解决的是视觉和文本的语义对齐问题；LLaVA、Flamingo 等 VLM 进一步把视觉 token 接入语言模型，使模型可以通过自然语言表达视觉理解；Qwen2-VL、Molmo 和 Omni Models 则代表当前趋势：更高分辨率、更细粒度、更高质量数据，以及更原生的端到端多模态交互。

**注**：多模态模型的进步不是单靠更大的 LLM 完成的。视觉 tokenizer、attention 效率、训练数据质量、细粒度 grounding 和系统延迟共同决定模型的实际能力。
