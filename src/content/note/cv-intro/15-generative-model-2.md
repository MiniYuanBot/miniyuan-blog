---
title: '生成模型 2：Diffusion Model'
excerpt: '26 春 计算机视觉导论 L15'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'June 7 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Generative Model II

### 课程定位

本讲进入 **Generative Model II**，重点讨论当前高质量生成模型的主流路线：**Diffusion Model**（扩散模型）、**Flow Matching**、**Latent Diffusion Model**（LDM）与 **Diffusion Transformer**（DiT）。

Diffusion Model 可以从上一讲的 **Variational Autoencoder**（VAE）自然延伸而来：VAE 使用一个 latent code 解释图像，而 Diffusion 将 latent 变量展开成很长的马尔可夫链，用多步小扰动逐渐把数据变成噪声，再学习反向去噪过程。其训练目标最终可以简化为一句话：**给干净图像加已知噪声，然后训练网络预测这部分噪声**。

## Diffusion Models

### 从 VAE 到层级隐变量模型

单层 VAE 的生成过程为 $z\to x$。一个 latent code 需要同时编码 object category、shape、pose、texture 与 fine details，这对高维图像生成非常困难。若 decoder 使用简单高斯条件分布，多个合理输出还会被均值化，导致图像模糊。

自然的扩展是引入多个 latent variables。以两个隐变量为例：
$$
p_\theta(x,z_1,z_2)=p(z_1)p_\theta(z_2\mid z_1)p_\theta(x\mid z_2)
$$

这类模型称为 **Hierarchical VAE**。Diffusion Model 可以看作一种特殊的层级 VAE：隐变量不再只有一两个，而是形成 $x_0,x_1,\dots,x_T$ 的长链。

### 马尔可夫链视角

Diffusion Model 定义一组变量：

- $x_0$：观测数据，也即真实图像；
- $x_1,\dots,x_T$：逐步加噪后的 latent variables；
- $x_T$：最终应近似标准高斯分布 $\mathcal{N}(0,I)$。

该序列构成 **Markov Chain**（马尔可夫链），即每一步只依赖相邻状态。生成方向为 $x_T\to x_{T-1}\to\cdots\to x_0$，推断或加噪方向为 $x_0\to x_1\to\cdots\to x_T$。

与普通 VAE 不同，Diffusion 的 inference model 没有可学习参数，而是人为设计一个固定的 forward diffusion process，使数据最终收敛到标准高斯噪声。

## Forward Diffusion Process

### 单步加噪

前向过程定义为逐步向图像加入高斯噪声：
$$
q(x_t\mid x_{t-1})
=
\mathcal{N}\left(x_t;\sqrt{1-\beta_t}x_{t-1},\beta_t I\right)
$$

其中 $\beta_t$ 是预设的 **Noise Schedule**（噪声调度），控制第 $t$ 步加入多少噪声。令 $\alpha_t=1-\beta_t$，可写成重参数化形式：
$$
x_t=\sqrt{\alpha_t}x_{t-1}+\sqrt{1-\alpha_t}\epsilon_{t-1},
\quad
\epsilon_{t-1}\sim\mathcal{N}(0,I)
$$

这表示每一步保留一部分上一时刻信号，并加入一部分标准高斯噪声。

### Diffusion Kernel

由于每一步都是线性高斯变换，可以直接从 $x_0$ 跳到任意 $x_t$。定义：
$$
\bar{\alpha}_t=\prod_{i=1}^{t}\alpha_i
$$

则有：
$$
q(x_t\mid x_0)
=
\mathcal{N}\left(x_t;\sqrt{\bar{\alpha}_t}x_0,(1-\bar{\alpha}_t)I\right)
$$

采样形式为：
$$
x_t=\sqrt{\bar{\alpha}_t}x_0+\sqrt{1-\bar{\alpha}_t}\epsilon,
\quad
\epsilon\sim\mathcal{N}(0,I)
$$

该公式称为 **Diffusion Kernel**。它使训练时不必真的从 $1$ 到 $t$ 逐步加噪，而是可以随机采样一个 $t$ 后一步得到 $x_t$。

### Noise Schedule

DDPM 中常用线性噪声调度：
$$
\beta_t=\beta_{\min}+\frac{t-1}{T-1}(\beta_{\max}-\beta_{\min})
$$

典型设置为 $\beta_{\min}\approx10^{-4}$、$\beta_{\max}=0.02$、$T=1000$。设计目标是让 $\bar{\alpha}_T\to0$，使：
$$
q(x_T\mid x_0)\approx\mathcal{N}(0,I)
$$

也即无论初始图像是什么，经过足够多步加噪后都近似成为纯高斯噪声。

## Reverse Denoising Process

### 反向分布建模

生成图像需要从噪声 $x_T$ 逐步恢复到数据 $x_0$。真实反向分布 $q(x_{t-1}\mid x_t)$ 不可直接得到，因此引入可学习模型：
$$
p_\theta(x_{t-1}\mid x_t)
=
\mathcal{N}\left(x_{t-1};\mu_\theta(x_t,t),\sigma_t^2I\right)
$$

其中 $\mu_\theta(x_t,t)$ 由神经网络预测，$\sigma_t$ 可固定或部分学习。实际网络通常输入噪声图 $x_t$ 和时间步 $t$，输出与图像同维度的预测量。

### ELBO 目标

Diffusion Model 的联合分布为：
$$
p_\theta(x_{0:T})
=
p(x_T)\prod_{t=1}^{T}p_\theta(x_{t-1}\mid x_t)
$$

对 $\log p_\theta(x_0)$ 使用变分下界可得：
$$
\log p_\theta(x_0)
\ge
\mathbb{E}_{q(x_{1:T}\mid x_0)}
\left[
\log\frac{p_\theta(x_{0:T})}{q(x_{1:T}\mid x_0)}
\right]
$$

展开后主要包含三类项：

| 项 | 含义 |
| :--- | :--- |
| $L_T$ | 约束 $q(x_T\mid x_0)$ 接近先验 $p(x_T)$，通常近似为 0 |
| $L_{t-1}$ | 让模型反向一步 $p_\theta(x_{t-1}\mid x_t)$ 匹配真实后验 $q(x_{t-1}\mid x_t,x_0)$ |
| $L_0$ | 最后一步重建数据 $x_0$ |

其中核心项为：
$$
L_{t-1}
=
D_{\mathrm{KL}}
\left(
q(x_{t-1}\mid x_t,x_0)
\|
p_\theta(x_{t-1}\mid x_t)
\right)
$$

由于前向过程是高斯链，真实后验 $q(x_{t-1}\mid x_t,x_0)$ 也是高斯分布，因此可将优化目标化为高斯均值之间的匹配。

### 噪声预测参数化

DDPM 的关键简化是：不直接预测 $\mu_\theta$，而是让网络预测加到 $x_0$ 上的噪声 $\epsilon$。均值可由预测噪声重参数化为：
$$
\mu_\theta(x_t,t)
=
\frac{1}{\sqrt{\alpha_t}}
\left(
x_t-\frac{1-\alpha_t}{\sqrt{1-\bar{\alpha}_t}}\epsilon_\theta(x_t,t)
\right)
$$

最终训练目标可简化为：
$$
\mathcal{L}
=
\mathbb{E}_{x_0\sim\mathcal{D},\,t\sim[1,T],\,\epsilon\sim\mathcal{N}(0,I)}
\left[
\left\|
\epsilon-
\epsilon_\theta
\left(
\sqrt{\bar{\alpha}_t}x_0+\sqrt{1-\bar{\alpha}_t}\epsilon,
t
\right)
\right\|^2
\right]
$$

也即网络输入 $x_t$ 和 $t$，输出预测噪声 $\epsilon_\theta(x_t,t)$，损失为真实噪声与预测噪声之间的 L2 距离。

**注**：Diffusion 训练不是让网络直接从噪声图预测干净图，而是预测“当前图像中被加入的噪声成分”。干净图可由 $x_t$ 和预测噪声间接恢复。

### DDPM 训练流程

**Training Pipeline**：

1. 从数据集采样干净图像 $x_0$。
2. 随机采样时间步 $t\in\{1,\dots,T\}$。
3. 采样高斯噪声 $\epsilon\sim\mathcal{N}(0,I)$。
4. 用 Diffusion Kernel 构造噪声图：
$$
x_t=\sqrt{\bar{\alpha}_t}x_0+\sqrt{1-\bar{\alpha}_t}\epsilon
$$

5. 将 $(x_t,t)$ 输入去噪网络，得到 $\epsilon_\theta(x_t,t)$。
6. 最小化 $\|\epsilon-\epsilon_\theta(x_t,t)\|_2^2$。

### DDPM 采样流程

**Sampling Pipeline**：

1. 从标准高斯采样初始噪声 $x_T\sim\mathcal{N}(0,I)$。
2. 对 $t=T,T-1,\dots,1$：
   - 用网络预测噪声 $\epsilon_\theta(x_t,t)$；
   - 根据反向高斯分布计算 $x_{t-1}$；
   - 除最后一步外，可额外注入高斯随机性。
3. 得到最终样本 $x_0$。

这一过程通常需要很多去噪步，因此原始 DDPM 的采样速度慢于 GAN，但图像质量与模式覆盖通常更好。

### 网络结构与时间条件

早期 DDPM 常使用 **U-Net** 作为去噪网络。输入为噪声图 $x_t$，输出为同维度噪声预测 $\epsilon_\theta$。U-Net 的 encoder-decoder 结构和 skip connections 有利于同时处理全局语义与局部细节。

时间步 $t$ 需要被注入网络，常见方法包括：

1. 使用类似 Transformer 的 sinusoidal embedding 将 $t$ 编码为向量。
2. 经 MLP 得到调制参数。
3. 通过 **Adaptive Group Normalization**（AdaGN）或 scale/shift 调制中间特征。

**注**：标准像素空间 DDPM 中，$x_t$ 与图像 $x_0$ 同维度；这不同于普通 VAE 中低维 latent code 的设置。

### 其他视角：Score 与 SDE

Diffusion 也可从 **Score Function** 角度理解。对任意分布 $p(x)$，score function 定义为：
$$
s(x)=\nabla_x\log p(x)
$$

它是一个指向高概率密度区域的向量场。Score-based generative model 训练网络近似数据分布在不同噪声水平下的 score，从而指导样本从噪声区域移动到数据高密度区域。

连续时间下，加噪过程还可写成 **Stochastic Differential Equation**（SDE）：
$$
d\mathbf{x}=f(\mathbf{x},t)dt+g(t)d\mathbf{w}
$$

其中 $d\mathbf{w}$ 表示布朗运动噪声。Diffusion 的生成可理解为学习并求解反向时间 SDE。

## Flow Matching

### 基本思想

**Flow Matching** 提供了另一种生成视角：从噪声分布 $p_{\mathrm{noise}}$ 到数据分布 $p_{\mathrm{data}}$ 学习一个连续速度场。设：
$$
z\sim p_{\mathrm{noise}},\quad x\sim p_{\mathrm{data}},\quad t\sim\mathrm{Uniform}(0,1)
$$

使用线性插值得到中间状态：
$$
x_t=(1-t)x+tz
$$

对应速度为：
$$
v=z-x
$$

因为：
$$
\frac{dx_t}{dt}=z-x=v
$$

因此训练网络 $v_\theta(x_t,t)$ 预测该速度场：
$$
\mathcal{L}
=
\mathbb{E}_{x,z,t}
\left[
\left\|
v_\theta(x_t,t)-(z-x)
\right\|_2^2
\right]
$$

### 训练与采样

**Training Pipeline**：

1. 采样数据 $x\sim p_{\mathrm{data}}$。
2. 采样噪声 $z\sim p_{\mathrm{noise}}$。
3. 采样时间 $t\sim\mathrm{Uniform}(0,1)$。
4. 构造 $x_t=(1-t)x+tz$。
5. 令目标速度 $v=z-x$，训练 $v_\theta(x_t,t)$ 预测 $v$。

**Sampling Pipeline**：

1. 采样初始点 $x_1\sim p_{\mathrm{noise}}$。
2. 选择步数 $T$，例如 $T=50$。
3. 从 $t=1$ 向 $t=0$ 数值积分：
$$
x_{t-\Delta t}=x_t-v_\theta(x_t,t)\Delta t
$$

4. 得到 $x_0$ 作为生成样本。

Flow Matching 的采样本质上是在解一个 **ODE**（常微分方程），而 DDPM 的反向采样通常带有随机噪声，更接近 **SDE**。

### 与 Diffusion 的统一形式

更一般地，可写成：
$$
x_t=a_t x+b_t z
$$

网络预测某个目标：
$$
c_t x+d_t z
$$

不同生成模型对应不同的系数设计：

| 方法 | $a_t$ | $b_t$ | 网络目标 |
| :--- | :--- | :--- | :--- |
| **Flow Matching** | $1-t$ | $t$ | $z-x$ |
| **Diffusion** | $\sqrt{\bar{\alpha}_t}$ | $\sqrt{1-\bar{\alpha}_t}$ | 噪声 $\epsilon$ 或 score |

该统一视角说明：Diffusion 与 Flow Matching 都是在不同噪声水平下学习“如何从噪声状态回到数据状态”的向量场，只是路径、目标参数化和采样方程不同。

### 条件 Flow Matching

若希望进行条件生成，只需将条件 $y$ 加入网络：
$$
v_\theta(x_t,t,y)
$$

训练时使用成对数据 $(x,y)$，例如图像与类别标签、图像与文本描述、视频与文本描述。采样时固定 $y$，即可生成满足条件的样本。

## Latent Diffusion Models

### 动机

直接在像素空间做 Diffusion 代价很高。例如 $1024\times1024\times3$ 图像包含数百万像素，若每次去噪都运行大型网络，训练与采样成本都非常大。

**Latent Diffusion Model**（LDM）的核心思想是：先将图像压缩到低维 latent space，再在 latent 上做 Diffusion。这样既保留主要语义和结构，又显著减少计算量。

### Autoencoder 压缩

先训练一个 encoder-decoder：
$$
x\in\mathbb{R}^{H\times W\times3}
\to
z\in\mathbb{R}^{\frac{H}{D}\times\frac{W}{D}\times C}
$$

例如：
$$
256\times256\times3\to32\times32\times16
$$

Encoder 和 Decoder 通常是 CNN，并可加入 attention。训练完成后冻结 encoder/decoder，只在 latent space 训练 diffusion model。

### Encoder-Decoder 的训练

LDM 中的 autoencoder 通常是 VAE 变体：

1. 使用很小权重的 KL prior，使 latent space 保持一定连续性和可采样性。
2. 加入 reconstruction loss，保证 latent 能重构图像。
3. 为避免 VAE decoder 输出模糊，可加入 **Discriminator**，使用 GAN loss 提升重构图像的真实感。

因此现代 LDM pipeline 可概括为：
$$
\text{VAE}+\text{GAN}+\text{Diffusion}
$$

### LDM 训练与生成流程

**Training Pipeline**：

1. 训练 autoencoder，将图像 $x$ 编码为 latent $z$ 并重构回图像。
2. 冻结 encoder 和 decoder。
3. 对 latent $z$ 加噪，得到 noisy latent $z_t$。
4. 训练 diffusion model 在 latent space 中预测噪声或速度场。

**Sampling Pipeline**：

1. 从 latent space 采样随机噪声。
2. 在 latent space 中迭代去噪，得到 clean latent。
3. 用冻结的 decoder 将 clean latent 解码为图像。

**注**：Latent diffusion 是当前图像生成中最常见的工程范式。它把“高质量图像合成”拆成两个问题：视觉压缩与 latent 空间生成。

## Conditional Diffusion and Diffusion Transformer

### 条件 Diffusion

无条件 Diffusion 学习 $p(x)$，条件 Diffusion 学习 $p(x\mid y)$。条件 $y$ 可以是类别、文本、边缘图、深度图、人体姿态、分割图或参考图像。

常见条件注入方式包括：

| 条件类型 | 注入方式 | 代表应用 |
| :--- | :--- | :--- |
| 类别标签 | embedding 后通过 scale/shift 调制网络 | class-conditional generation |
| 文本 | text encoder + cross-attention | text-to-image |
| 空间控制图 | 额外分支或 ControlNet | edge/depth/pose control |
| 时间步 $t$ | timestep embedding + normalization modulation | 所有 diffusion 模型 |

以 cross-attention 为例，条件信号 $y$ 先经过领域编码器 $\tau(y)$，被去噪信号 $x_t$ 经过网络得到特征 $\phi(x_t)$，再构造：
$$
Q=W_Q\phi(x_t),\quad K=W_K\tau(y),\quad V=W_V\tau(y)
$$

这样去噪过程中的视觉 token 可以读取文本或其他条件 token。

### ControlNet

**ControlNet** 用于给预训练 diffusion model 添加空间控制信号，例如 canny edge、depth map、pose 或 segmentation map。其目标是在保持原模型生成能力的同时，让输出图像遵循额外结构约束。

**Pipeline**：

1. 输入文本 prompt 与控制图。
2. 文本通过 text encoder 得到 text embeddings。
3. 控制图通过额外网络分支提取空间条件特征。
4. 去噪网络在 cross-attention 与控制分支共同作用下迭代去噪。
5. 输出同时满足文本语义与空间控制的图像。

### Diffusion Transformer

**Diffusion Transformer**（DiT）用标准 Transformer blocks 替换 U-Net 作为去噪网络。基本流程为：

1. 将 latent image 切分为 patches，并视作 token 序列。
2. 输入 Transformer blocks。
3. 输出每个 patch 对应的噪声、velocity 或 clean latent 预测。

DiT 的核心问题是如何注入条件，尤其是 timestep $t$ 与文本条件。常见做法包括：

1. 对 timestep 使用 embedding，经 MLP 预测 scale/shift。
2. 通过 **Adaptive Layer Normalization**（AdaLN）调制 Transformer block。
3. 对文本、图像等条件使用 cross-attention 或 joint attention。

### Text-to-Image Pipeline

现代 text-to-image LDM/DiT 可概括为：

1. 文本 prompt 输入预训练 text encoder，例如 T5 或 CLIP。
2. 随机采样 noisy latents。
3. Diffusion timestep 作为标量条件注入 DiT。
4. DiT 结合 text embeddings 与 noisy latents，预测去噪方向。
5. 多步迭代后得到 clean latents。
6. Decoder 将 clean latents 解码为输出图像。

以 FLUX.1 一类模型为例，常见配置包括 T5 + CLIP text encoder、8x8 latent downsampling、大规模 DiT，以及 latent patchify 后的 image tokens。

### Text-to-Video Pipeline

视频生成将 latent 从二维扩展到三维时空张量：
$$
z_t\in\mathbb{R}^{T\times H'\times W'\times C}
$$

流程与 text-to-image 类似，但 DiT 需要同时建模时间、空间与文本条件：

1. 文本 prompt 经 text encoder 得到文本 token。
2. 采样 noisy video latents。
3. DiT 在时空 latent tokens 上迭代去噪。
4. Decoder 将 clean video latents 解码为视频帧序列。

视频生成的难点在于长时序一致性、物体身份保持、运动合理性和物理交互。现代视频 diffusion 模型通常使用更大的 DiT、更强文本编码器和时空压缩 autoencoder。

## Applications and Frontiers

### 多模态生成应用

Diffusion 与 Flow Matching 已扩展到多种生成任务：

| 应用 | 目标 |
| :--- | :--- |
| **Text-to-Image** | 根据文本生成图像 |
| **Image Editing** | 根据文本或 mask 修改已有图像 |
| **Personalization** | 学习特定主体或风格并在新场景中生成 |
| **Text-to-3D** | 利用 2D diffusion prior 优化 3D 表示 |
| **Text-to-Music** | 根据文本生成音乐或音频 |
| **Text-to-Video** | 根据文本生成时序一致的视频 |

其中 conditional generation 尤其重要，因为实际应用往往不是“随机生成一张图”，而是生成满足文本、结构、风格、主体或时序约束的内容。

### 生成模型发展脉络

| 模型 | 密度/采样方式 | 优点 | 局限 |
| :--- | :--- | :--- | :--- |
| **GAN** | 隐式密度，直接采样 | 图像清晰，采样快 | 训练不稳定，mode collapse |
| **Autoregressive Model** | 显式分解，逐 token 采样 | 似然清晰，可扩展到离散 token | 高分辨率视觉采样慢 |
| **Diffusion Model** | 迭代去噪，可由 ELBO 推导 | 质量与模式覆盖较均衡 | 采样步数多，计算成本高 |
| **Latent Diffusion** | 在压缩 latent 上迭代去噪 | 大幅降低成本，当前主流 | 依赖 autoencoder 质量 |
| **Flow Matching** | 学习 ODE 速度场 | 训练简洁，采样路径直观 | 仍需数值积分与条件建模 |

### 核心结论

Diffusion Model 的重要性在于，它把高维图像生成转化为一系列局部、可监督的去噪问题。虽然完整 ELBO 推导较复杂，但最终训练目标极其简单：随机选时间步、加已知噪声、预测噪声。

Latent Diffusion 解决了像素空间计算量过大的问题，Conditional Diffusion 与 ControlNet 使生成过程可控，DiT 则将扩散模型接入 Transformer scaling law。当前图像和视频生成的主流系统，通常就是 text encoder、latent autoencoder、DiT/U-Net 去噪器与条件控制模块的组合。
