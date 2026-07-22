---
title: '生成模型 1：VAE 与 GAN'
excerpt: '26 春 计算机视觉导论 L13'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'May 24 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Overview of Generative Models

### Comparison Between Three Models

设图像或数据为 $X$，标签或条件为 $Y$。

| 模型 | 学习目标 | 典型用途 |
| :--- | :--- | :--- |
| **Discriminative Model** | $p(Y\mid X)$ | 给定数据预测标签，如图像分类 |
| **Generative Model** | $p(X)$ | 建模数据本身的概率，可检测异常并采样生成 |
| **Conditional Generative Model** | $p(X\mid Y)$ | 给定条件生成数据，如类别到图像、文本到图像 |

三者可由联合分布联系起来：
$$
p(X,Y)=p(X)p(Y\mid X)=p(Y)p(X\mid Y)
$$

由贝叶斯公式可得：
$$
p(X\mid Y)=\frac{p(Y\mid X)p(X)}{p(Y)}
$$

理论上可以由判别式模型 $p(Y\mid X)$、无条件生成模型 $p(X)$ 和标签先验 $p(Y)$ 构造条件生成模型，但实际中通常直接训练条件生成模型。

### Probability-Based Competition

判别式模型在给定 $X$ 后，让所有可能标签竞争概率质量：
$$
\sum_{y\in \mathcal{Y}} p(y\mid X)=1
$$

因此即使输入是不合理图像，模型也必须给出一个标签分布，无法自然拒绝异常输入。

生成模型则在所有可能数据之间分配概率质量。合理图像应获得较高密度，不合理输入可以获得极低概率，因此生成模型可用于 **Outlier Detection**（异常检测）和无监督特征学习。

### Why We Need Generative Model

生成模型适合处理一对多和多解问题。给定同一条件 $Y$，可能存在许多合理输出 $X$，因此更自然的目标是建模完整条件分布 $p(X\mid Y)$，而不是只预测一个确定答案。

典型应用包括：

1. **Language Modeling**：根据前文生成后续文本。
2. **Text-to-Image**：根据文本描述生成图像。
3. **Image-to-Video**：根据图像或短视频预测未来帧。
4. **World Model**：建模 $p(s_{t+1}\mid s_t,\text{text/action})$，预测动作或指令作用后的世界状态。

### Taxonomy of Generative Models

生成模型可按是否显式计算数据密度 $p(X)$ 分类。

| 类型 | 代表模型 | 核心特点 |
| :--- | :--- | :--- |
| **Tractable Explicit Density** | **Autoregressive Model** | 可精确计算 $p(X)$，通过链式法则分解联合分布 |
| **Approximate Explicit Density** | **VAE** | 通过变分推断优化对数似然下界 |
| **Implicit Density, Direct Sampling** | **GAN** | 不显式计算 $p(X)$，直接从噪声映射到样本 |
| **Implicit / Approximate Sampling** | **Diffusion Model** | 通过迭代去噪过程近似从数据分布采样 |

显式密度模型的优势是可以进行概率推断，例如评估样本是否合理；但高维图像分布的密度建模很难。

隐式模型不一定能计算 $p(X)$，但可以更直接地生成高质量样本。

### Training Object

若模型显式给出密度 $p_\theta(X)$，最常见目标是 **Maximum Likelihood Estimation**（MLE，最大似然估计）：
$$
\max_\theta \sum_{X_i\in\mathcal{D}}\log p_\theta(X_i)
$$

也即让训练数据在模型分布下具有尽可能高的对数似然。不同生成模型的区别在于：$p_\theta(X)$ 是否可直接计算、是否需要近似、以及如何采样。

## Autoregressive Model

### Language Modeling

对序列 $x_1,\dots,x_T$，**Autoregressive Model** 使用链式法则分解联合概率：
$$
p(x_1,\dots,x_T)=\prod_{t=1}^{T}p(x_t\mid x_1,\dots,x_{t-1})
$$

语言模型即典型自回归生成模型。训练时，模型根据历史 token 预测下一个 token；生成时，从预测分布中逐步采样新 token。

Transformer 中的 **Causal Mask** 保证位置 $t$ 只能看到 $1,\dots,t-1$ 的历史信息，从而满足自回归因果结构。

### Image Modeling

图像也可以被展开为序列并逐像素生成，但高分辨率图像的像素序列极长，计算代价很高。现代方法常把图像切分为 patch 或离散视觉 token，再像语言模型一样逐 token 生成。

**注**：自回归模型可精确计算序列概率，但高维视觉数据的生成顺序并不天然，逐步采样效率也较低。

## Variational Autoencoder

### From Autoencoder to Variational Autoencoder

**Autoencoder**（AE）由 Encoder 和 Decoder 组成：

1. Encoder 将输入图像 $X$ 压缩为低维隐变量 $Z$。
2. Decoder 根据 $Z$ 重构 $\hat{X}$。
3. 训练目标通常是重构误差，如 $\|X-\hat{X}\|_2^2$。

AE 可以学习低维表示，但不是完整生成模型。原因是普通 AE 不约束隐变量 $Z$ 的分布，因此无法可靠地从隐空间采样一个新 $Z$ 并生成合理图像。

**VAE** 将 AE 概率化：假设隐变量服从先验分布 $p(Z)$，通常为标准正态分布 $\mathcal{N}(0,I)$；
Decoder 建模条件分布 $p_\theta(X\mid Z)$。生成时先采样 $Z\sim p(Z)$，再由 Decoder 生成 $X$。

### Marginal Likelihood

VAE 希望最大化数据边际似然：
$$
p_\theta(X)=\int p(Z)p_\theta(X\mid Z)\,dZ
$$

该积分需要对所有可能隐变量 $Z$ 积分，一般无解析解。

举例来说，不妨假设 $p(Z)$ 与 $p_\theta(X\mid Z)$ 都是高斯，也即：

- 先验 $p(Z) = \mathcal{N}(0, I)$
- 似然 $p_\theta(X\mid Z) = \mathcal{N}\big(X;\ \mu_\theta(Z),\ \sigma_\theta^2(Z)\big)$

由于均值和方差都是神经网络拟合出 $Z$ 的非线性函数，所以此时积分通常没有解析解。

朴素 Monte Carlo 近似为：
$$
p_\theta(X)\approx \frac{1}{K}\sum_{k=1}^{K}p_\theta(X\mid Z_k),\quad Z_k\sim p(Z)
$$

但在高维隐空间中，大多数从先验采样的 $Z$ 与当前 $X$ 无关，使 $p_\theta(X\mid Z)$ 接近 0，估计方差极大，训练效率很低。

### Variational Posterior and ELBO

**推理**是指通过被观测变量 $X$ 推理隐变量 $Z$ 后验概率分布 $p_{\theta}(Z|X)$ 的问题。

**变分**是指通过简单的先验假设概率分布 $q_\phi(Z\mid X)$ 近似后验概率分布 $p_\theta(Z\mid X)$。

真实后验推理为：
$$
p_\theta(Z\mid X)=\frac{p(Z)p_\theta(X\mid Z)}{p_\theta(X)}
$$

由于分母 $p_\theta(X)$ 不可解，后验也不可解，VAE 引入可学习的变分后验 $q_\phi(Z\mid X)$ 来近似真实后验 $p_\theta(Z\mid X)$。
通常 $q_\phi$ 由 Encoder 参数化，并输出高斯分布的均值与方差。

直接考虑分布 $q_\phi$ 与 $p_{\theta}$ 的相似度：
$$
\begin{aligned}
D_{\mathrm{KL}}(q_\phi(Z\mid X)\|p_\theta(Z\mid X))
&=\mathbb{E}_{Z\sim q_\phi(Z\mid X)}[\log q_\phi(Z\mid X) - \log p_\theta(Z\mid X)] \\
&=\mathbb{E}_{Z\sim q_\phi(Z\mid X)}[\log q_\phi(Z\mid X) - \log p_\theta(X\mid Z) - \log p_\theta(Z) + \log p_\theta(X)] \\
&=-\mathbb{E}_{Z\sim q_\phi(Z\mid X)}[\log p_\theta(X\mid Z)] + D_{\mathrm{KL}}(q_\phi(Z\mid X)\|p_\theta(Z)) + \log p_\theta(X)
\end{aligned}
$$

我们希望最小化该 KL 散度，由于 $\log p_\theta(X)$ 为定值，因此等价于最大化：
$$
\mathbb{E}_{q_\phi}[\log p_\theta(X\mid Z)]
-D_{\mathrm{KL}}(q_\phi(Z\mid X)\|p(Z))
\triangleq \mathrm{ELBO}
$$

当然我们也可以从最大似然来理解。因为我们可以算得：
$$
\log p_\theta(X) \ge ELBO
$$
从而 ELBO 为对数似然的下界。最大化 ELBO 可以间接最大化真实似然。

**ELBO**（Evidence Lower Bound，证据下界）由两部分组成：

| 项 | 含义 |
| :--- | :--- |
| $\mathbb{E}_{q_\phi}[\log p_\theta(X\mid Z)]$ | 重构项，要求 Decoder 能由 $Z$ 重构输入 |
| $D_{\mathrm{KL}}(q_\phi(Z\mid X)\|p(Z))$ | 正则项，要求 Encoder 的隐变量分布接近先验 |

最大化 ELBO 等价于同时提升重构质量，并让训练时的隐变量分布接近采样时使用的先验分布。

### Gaussian KL and Reconstruction Loss

若 $q_\phi(Z\mid X)=\mathcal{N}(\mu,\operatorname{diag}(\sigma^2))$，且 $p(Z)=\mathcal{N}(0,I)$，则 KL 项有解析形式：
$$
D_{\mathrm{KL}}(q_\phi(Z\mid X)\|\mathcal{N}(0,I))
=
\frac{1}{2}\sum_{j=1}^{d}
(\mu_j^2+\sigma_j^2-\log\sigma_j^2-1)
$$

若进一步把 Decoder 的协方差固定为单位矩阵，则重构对数似然等价于最小化均方误差：
$$
\|X-\mu_{X\mid Z}\|_2^2
$$

其中 $\mu_{X\mid Z}$ 是 Decoder 输出的重构均值。

### Reparameterization Trick

为了从 $q_\phi(Z\mid X)$ 采样并让梯度回传到 Encoder，VAE 使用 **Reparameterization Trick**（重参数化技巧）：
$$
Z=\mu_{Z\mid X}+\varepsilon\odot\sigma_{Z\mid X},
\quad
\varepsilon\sim\mathcal{N}(0,I)
$$

这样随机性由与参数无关的 $\varepsilon$ 提供，而 $Z$ 对 $\mu_{Z\mid X}$ 和 $\sigma_{Z\mid X}$ 可微，梯度可以穿过采样过程。

### VAE Pipeline

**Training Pipeline**：

1. 输入训练样本 $X$。
2. Encoder 输出 $q_\phi(Z\mid X)$ 的均值 $\mu_{Z\mid X}$ 和方差 $\sigma_{Z\mid X}$。
3. 使用重参数化技巧采样 $Z$。
4. Decoder 输出 $p_\theta(X\mid Z)$ 的参数，通常是重构均值 $\mu_{X\mid Z}$。
5. 最大化 ELBO，等价于最小化重构损失 + KL 正则。

**Sampling Pipeline**：

1. 从先验 $Z\sim\mathcal{N}(0,I)$ 采样。
2. 将 $Z$ 输入 Decoder。
3. 输出 $\mu_{X\mid Z}$ 作为生成样本。

实际生成图像时通常不再额外从 Decoder 的输出高斯中加噪声，而直接使用均值，以避免图像进一步变模糊。

### The Problem of VAE

VAE 的两项损失存在天然张力：

1. 若 KL 项过强，使 $q_\phi(Z\mid X)\approx \mathcal{N}(0,I)$，则 $Z$ 很少携带关于 $X$ 的信息，Decoder 难以重构。
2. 若重构项过强，Encoder 会把输入信息大量编码进 $Z$，导致 $q_\phi(Z\mid X)$ 偏离标准正态，采样时质量下降。

VAE 生成图像常出现 **Blurry Problem**（模糊问题）。在高斯似然和 MSE 损失下，Decoder 倾向输出条件均值；当一个隐变量对应多个可能细节时，均值会把多种模式平均起来，导致纹理和边缘变模糊。

**注**：VAE 的优势是优化目标与整体数据分布相关，模式覆盖较好，隐空间也较有结构；缺点是先验表达能力有限，生成视觉质量通常不如 GAN 或 Diffusion。

### The Meaning of Variational

Variational 来自 **Variational Inference**（变分推断）。
在概率隐变量模型中，真实后验 $p_\theta(Z\mid X)$ 往往不可解，于是引入一族可计算分布 $q_\phi(Z\mid X)$，在分布函数空间中寻找最接近真实后验的近似。

固定 $\theta$ 时，最大化 ELBO 等价于最小化：
$$
D_{\mathrm{KL}}(q_\phi(Z\mid X)\|p_\theta(Z\mid X))
$$

因此 VAE 本质上是用神经网络实现的变分推断框架。

### Multi-Latent VAE

VAE 可以扩展到多个隐变量。例如有 $Z_1,Z_2$ 时，可考虑联合分布：
$$
p_\theta(X,Z_1,Z_2)=p(Z_1)p_\theta(Z_2\mid Z_1)p_\theta(X\mid Z_2)
$$

相应地引入变分后验近似真实后验，并得到新的 ELBO。扩散模型可以从这一方向理解为具有大量层级隐变量的生成模型。

## Generative Adversarial Network

### Motivation

**GAN** 不显式建模 $p(X)$，而是学习一个从噪声到图像的生成器：
$$
G: Z\mapsto X,\quad Z\sim p(Z)
$$

同时训练一个 **Discriminator**（判别器）$D$，用于判断输入图像来自真实数据还是生成器。生成器 $G$ 的目标是生成足以欺骗 $D$ 的样本；判别器 $D$ 的目标是区分真实样本与生成样本。

### Minimax Object

原始 GAN 是一个双人极小极大博弈：
$$
\min_G \max_D
\left[
\mathbb{E}_{x\sim p_{\mathrm{data}}}[\log D(x)]
+
\mathbb{E}_{z\sim p(z)}[\log(1-D(G(z)))]
\right]
$$

其中：

- $D(x)$ 表示样本为真实数据的概率；
- $D$ 希望真实图像得分接近 1，生成图像得分接近 0；
- $G$ 希望 $D(G(z))$ 接近 1。

**Training Pipeline**：

1. 采样真实图像 $x\sim p_{\mathrm{data}}$ 与噪声 $z\sim p(z)$。
2. 用 $G(z)$ 得到生成图像。
3. 固定 $G$，更新 $D$，提高真假判别能力。
4. 固定 $D$，更新 $G$，提高欺骗判别器的能力。
5. 交替重复上述步骤。

### Saturating Loss and Non-Saturating Loss

原始生成器目标来自极小化：
$$
\mathbb{E}_{z\sim p(z)}[\log(1-D(G(z)))]
$$

训练早期，生成样本质量很差，$D(G(z))\approx 0$。此时 $\log(1-D(G(z)))$ 容易进入饱和区，生成器梯度很小，训练困难。

实践中常使用 **Non-Saturating Loss**：
$$
\max_G \mathbb{E}_{z\sim p(z)}[\log D(G(z))]
$$

该目标在 $D(G(z))$ 很小时仍能提供较强梯度，因此更适合训练生成器。

### DCGAN, Progressive GAN, StyleGAN

早期 GAN 使用卷积架构后显著提升图像质量。后续发展包括：

| 方法 | 核心思想 | 影响 |
| :--- | :--- | :--- |
| **DCGAN** | 使用卷积生成器与卷积判别器 | 使 GAN 更适合图像生成 |
| **Progressive GAN** | 从低分辨率开始，逐步增加网络层和图像分辨率 | 提升高分辨率人脸生成稳定性 |
| **BigGAN** | 大规模条件 GAN，扩大模型和 batch | 提升 ImageNet 类别图像生成质量 |
| **StyleGAN** | 使用 style-based generator 调控不同尺度视觉属性 | 在高质量人脸生成中表现突出 |

**注**：人脸生成相对更容易，因为结构模式较固定；开放类别、复杂室内场景或多物体关系生成仍更困难。

### The Problem of GAN

GAN 的主要问题是 **Mode Collapse**（模式坍塌）。由于生成器只需骗过当前判别器，它可能只生成真实分布中的少数模式，而不是覆盖完整数据分布。

例如在多峰分布中，$G$ 可能只学到几个高质量样本区域。只要这些样本足以让 $D$ 难以区分，训练目标并不会直接惩罚缺失的模式。

| 模型 | 分布覆盖 | 生成清晰度 | 主要问题 |
| :--- | :--- | :--- | :--- |
| **VAE** | 通常较好 | 容易模糊 | 高斯似然与 MSE 导致均值化 |
| **GAN** | 可能不足 | 通常清晰 | 训练不稳定、Mode Collapse |

**注**：VAE 倾向覆盖分布但视觉质量偏模糊；GAN 倾向生成清晰样本但可能遗漏模式。这也是后来 Diffusion Model 受到重视的重要原因之一。

### Evaluation of GANs

GAN 的生成器没有直接优化一个可解释的似然目标，因此评估通常需要结合定性与定量方法。

常见定性评估包括：

1. **Nearest Neighbor**：将生成样本与训练集中最近邻样本对比，检查是否记忆训练集。
2. **User Study**：让用户判断图像真假或比较不同模型的生成质量。
3. **Mode Drop / Mode Collapse 检查**：在已知类别或已知模式的数据集上，检查生成样本是否覆盖所有模式。

**FID**（Fréchet Inception Distance）是常用定量指标。其流程为：

1. 用 Inception Network 或其他 CNN 的中间层提取真实图像与生成图像特征。
2. 分别估计两组特征的均值和协方差。
3. 将两组特征分布近似为多元高斯。
4. 计算两个高斯分布之间的 Fréchet 距离。

FID 公式为：
$$
\mathrm{FID}
=
\|\mu_r-\mu_g\|_2^2
+
\operatorname{Tr}\left(
\Sigma_r+\Sigma_g-2(\Sigma_r\Sigma_g)^{1/2}
\right)
$$

其中 $(\mu_r,\Sigma_r)$ 为真实图像特征的均值与协方差，$(\mu_g,\Sigma_g)$ 为生成图像特征的均值与协方差。FID 越小，表示生成分布与真实分布越接近。

**注**：FID 同时反映生成质量与多样性，但它依赖特征提取网络，并且对噪声、模糊、黑块污染、旋涡变形等图像失真较敏感。

## Summary

| 模型 | 密度建模 | 采样方式 | 优点 | 局限 |
| :--- | :--- | :--- | :--- | :--- |
| **Autoregressive** | 显式且可精确计算 | 逐 token 采样 | 似然可算，理论清晰 | 高维视觉生成效率低 |
| **VAE** | 显式但通过 ELBO 近似 | 从先验采样后解码 | 隐空间有结构，模式覆盖较好 | 生成图像常模糊 |
| **GAN** | 隐式密度 | 噪声直接映射到样本 | 图像清晰，采样快 | 训练不稳定，容易 Mode Collapse |
| **Diffusion** | 与 ELBO 有联系，采样为迭代过程 | 逐步去噪 | 质量与覆盖较均衡 | 采样成本较高 |

生成模型的核心问题可以概括为：如何学习复杂高维数据分布，并在质量、覆盖、多样性、似然可解释性与采样效率之间取得平衡。
VAE 与 GAN 分别代表了**近似似然优化**和**对抗式隐式采样**两条路线，后续 Diffusion Model 将进一步结合分布覆盖与高质量生成的优势。
