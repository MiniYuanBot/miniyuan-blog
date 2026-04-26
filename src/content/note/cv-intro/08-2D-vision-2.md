---
title: '2D 视觉 2'
excerpt: '26 春 计算机视觉导论 L08'
author: 'miniyuan'
position: 'Beijing'
tags:
  - 'CV'
  - '计算机视觉'
pubDate: 'April 26 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Object Detection

### Definitions and Basic Concepts

- **Semantic Segmentation**：语义分割，逐像素预测类别，不区分同类不同实例。
- **Instance Segmentation**：实例分割，逐像素预测类别，且区分同类不同实例。
- **Object Detection**：介于二者之间，需要区分同类不同实例，但是不用精确到 pixel，只需精确到 **tight bounding box**（bbox）。
- **Bbox**：axis-aligned 的边界框，参数化为 $(x, y, h, w)$，其中 $x, y$ 为左上角坐标。每个候选框还需附加一个 score 作为类别置信度。
- **Backbone CNN**：特征提取网络，通常由 pretrained 分类网络去除末层 FC 得到。输入原始图像，输出下采样后的 Feature Map。
- **IoU**：定义边界框间的重叠程度，后续用于 RPN 样本划分、NMS 及评估。
    $$
    \text{IoU}(A,B) = \frac{\text{area}(A\cap B)}{\text{area}(A\cup B)}
    $$
    其中 $A,B$ 是两个边界框，$\text{area}(\cdot)$ 为框所覆盖的像素面积。

### Single Object Detection

在 Backbone CNN 之后接两个 FC heads：

- **Classification Head**：输出 $K$ 维向量，经 Softmax 得到 $K$ 个类别的概率分布，使用 **Cross-Entropy Loss**（Softmax Loss）监督；
- **Regression Head**：输出 $4$ 维向量，表示 bbox coordinates，使用 **L2 Loss**（MSE Loss）监督。

训练时，两个损失加权相加作为总损失，联合进行优化。

### Regression Losses

定位部分本质上是连续坐标预测，所以是一个回归问题，称为 Regression Head。其中 Regression Loss 的选择尤为重要。

记 $\Delta_i$ 为第 $i$ 个回归分量，则：

- **L1 Loss**：
    $$
    \ell_{\text{L1}}(\Delta) = \sum_i |\Delta_i|
    $$
    优点为对大误差不敏感，robust；
    缺点为梯度恒定，收敛困难。

- **L2 Loss**：
    $$
    \ell_{\text{L2}}(\Delta) = \sum_i \Delta_i^2
    $$
    优点为收敛性更好；
    缺点为梯度随误差线性增大，对大误差敏感。

- **RMSE**（Root Mean Squared Error）：
    $$
    \ell_{\text{RMSE}}(\Delta) = \sqrt{\frac{1}{N}\sum_i \Delta_i^2}
    $$
    缺点为误差接近 0 时使梯度不稳定，存在奇点。

- **Smooth L1 loss**：
    $$
    \text{smooth}_{L1}(x) =
    \begin{cases}
    0.5x^2, & \text{if } |x| \lt 1\\
    |x| - 0.5, & \text{otherwise}
    \end{cases}
    $$
    也即当误差小于阈值（通常取 1）时使用 L2，利于收敛；当误差大时使用 L1，利于鲁棒。

**注**：smooth L1 就是 Huber Loss。

### Multi-Object Detection Overview

多目标检测要求输出**可变数量**的边界框。

#### Proposals vs RoIs

先生成一组可能包含物体的候选框 **Proposals**，数量较多（约为 2k），经筛选后得到 **RoIs**（Regions of Interest），后续只对 RoI 进行操作。

- **R-CNN / Fast R-CNN**：Proposals 由 Selective Search 生成（无置信度分数），直接投影后进入 RoI Pool。
- **Faster R-CNN**：Proposals 由 RPN 生成（带 **objectness score**），经 NMS 与正负采样筛选后得到 RoIs。

#### Proposal Generation

- **Selective Search**（R-CNN / Fast R-CNN）：基于手工特征子识别。
- **RPN**（Faster R-CNN）：在 Backbone 输出的 Feature Map 使用可学习网络识别。

#### Sliding-Window

在图像上以不同大小的窗口滑动，对每种大小的每个窗口进行 Single Object。
显然计算量很大，效率很低。

#### Detection Paradigms

- **Two-Stage Detectors**：先提取 Region Proposal，再对每个区域进行分类与回归（精度高）。
- **Single-Stage Detectors**：直接在 feature map 上密集预测类别与边框，避免 proposal 生成阶段（速度快）。

### Two-Stage Detectors

核心思想：先提取 Region Proposal，再对每个 proposal 进行**类别分类**与**边框回归**。

#### R-CNN

Region-based CNN。

1. 用 Selective Search 生成 **Proposals**。
2. 每个 **Proposal** 使用 bilinear 插值放缩到固定大小，然后带入 Backbone CNN 中提取特征。
3. 最后经过 cls head 和 reg head。

**问题**：

- 每个 Proposal 都要独立前向通过 Backbone CNN，计算重复且慢。
- 多个部件（CNN、Cls、Reg）分别训练，非 end-to-end。
- cropped 的 Proposal 缺失全图 context，导致边框回归时 **Information Inefficient**！

#### Fast R-CNN

既然先 crop 后 conv 会丢失 context，不妨**先 conv 再 crop**。

1. Backbone CNN 提取 feature map。
2. 用 Selective Search 生成 **Proposals**。
3. 将 **Proposals** 投影到 feature map 上，边界吸附到最近的网格点中，得到对应的 **RoI**。
4. 使用 **RoI Pool** 进行 resize。也即将这些 RoI 划分为固定数量的 bin，在每个 bin 上做 max pooling。
5. 最后经过 cls head 和 reg head。

- 优点：减少重复计算，显著加速；部分端到端，训练更方便。
- 缺点：速度受 Selective Search 制约；有一定精度误差。

#### Faster R-CNN

核心在于采用 RPN 替代了 Selective Search，直接在共享的 feature map 上生成 proposals，从而实现近似的端到端训练。

**Pipeline**：

1. Backbone CNN 提取 feature map。
2. 用 RPN 在 feature map 上生成高质量 **Proposals**。
3. 经 RoI Generation 筛选后的 **RoIs** 通过 RoI Pooling resize 到固定尺寸。
4. 最后经过 cls head 和 reg head。

- 训练：RPN 与 heads 共用 Backbone，可以交替训练或联合训练。
- 优点：速度快、候选更准确且可学习、整体性能提升显著。

**RoI Generation**：

RPN 输出的 Proposals 需经后处理才能成为 RoIs：

1. **NMS**：按 RPN 预测的 **objectness score** 降序，去除与高分框 IoU 过高的冗余框（通常 $\tau=0.7$）；
2. **Top-K**：保留分数最高的 $K$ 个；
3. **正负采样**（train only）：计算与 GT 的 IoU，划分为 Positive 和 Negative。按比例采样得到恒定数量的 RoIs，送入后续 Heads。

**Faster R-CNN Paradigm**：

- **Run once per image**：Backbone 提取 feature map，RPN 生成 Proposals 并筛选出 RoIs。
- **Run once per region**：RoI Pool / Align，two-heads。

#### RPN

预定义一组固定尺寸与纵横比的参考框，称为 **Anchor**。
在 feature map 的每个位置上放置多个 Anchors，以覆盖不同大小与形状的目标。

对每个 anchor，两个 heads 输出：

- **cls**：预测该 anchor 是否为前景，得到 **objectness score**。
- **reg**：预测该 anchor 相对于真实框的**坐标偏移量**。

**Parameterization**：

由于尺寸、纵横比差异大，故需对回归的目标进行归一化改进，减小尺度差异带来的数值问题。

给定候选框 $(x_a, y_a, w_a, h_a)$ 和真实框 $(x_g, y_g, w_g, h_g)$，回归目标通常定义为：
$$
t_x = \frac{x_g - x_a}{w_a},\quad
t_y = \frac{y_g - y_a}{h_a},\quad
t_w = \log\frac{w_g}{w_a},\quad
t_h = \log\frac{h_g}{h_a}
$$

**Training**：

计算每个 anchor 与所有 GT 框的 IoU，按阈值划分样本：

- **Positive**：$\text{IoU} \gt 0.7$，或与某 GT 的 IoU 最大；
- **Negative**：$\text{IoU} \lt 0.3$；
- **Ignore**：$\text{IoU} \in [0.3, 0.7]$，不参与训练。

**Loss Function**：

1. **Classification Loss**：

    对每个 anchor $i$，objectness confidence 为 $p_i$，one-hot label 为 $p_i^* \in \{0, 1\}$。采用二分类交叉熵：
    $$
    L_{\text{cls}} = -\frac{1}{N_{\text{cls}}} \sum_i \Bigl[ p_i^* \log(p_i) + (1-p_i^*) \log(1-p_i) \Bigr]
    $$

    其中 $N_{\text{cls}}$ 为参与分类训练的 anchor 数量（通常为正负样本采样后的总数）。

2. **Regression Loss**：

    仅对 positive（$p_i^* = 1$）计算边框偏移。设预测偏移量为 $t_i = (t_x, t_y, t_w, t_h)$，真实目标偏移为 $t_i^*$，则：

    $$
    L_{\text{reg}} = \frac{1}{N_{\text{reg}}} \sum_i p_i^* \cdot \text{Smooth}_{L1}(t_i - t_i^*)
    $$

    其中 $\text{Smooth}_{L1}$ 定义为：

    $$
    \text{Smooth}_{L1}(x) =
    \begin{cases}
    0.5 x^2, & |x| \lt 1 \\[6pt]
    |x| - 0.5, & |x| \geq 1
    \end{cases}
    $$
    负样本时 $p_i^*=0$，不参与回归。

3. **Total Loss**：

    将两部分加权求和：

    $$
    L(\{p_i\}, \{t_i\}) = L_{\text{cls}} + \lambda L_{\text{reg}}
    $$

    其中 $\lambda$ 为平衡系数。

### Single-Stage Detectors

Single-Stage Detectors 直接在 feature map 上密集预测类别与边框，避免候选生成阶段，因而推理速度快。

代表方法包括 **YOLO**（You Only Look Once）、**SSD**（Single Shot MultiBox Detector）、**RetinaNet** 等。

**Core Mechanism**：

将图像（或 feature map）划分为 $H \times W$ 的网格。在每个 grid cell 上预置 $B$ 个不同尺度与纵横比的 **anchors**。网络直接输出：

- **reg**：对每个 anchor 预测中心偏移 $(\Delta x, \Delta y)$、尺寸偏移 $(\Delta h, \Delta w)$，以及该框的 objectness。
- **cls**：对 $K$ 个类别（包含背景）输出 score。

输出张量维度为 $H \times W \times (5B + C)$。

本质上，RPN 只区分前景和背景，而 Single-Stage Detector 是 **category-specific**。

### NMS

使用 NMS 删除重复且重叠的检测框，确保 single response constraint。

**Input**：候选框集合 $B$，对应的 class score $S$，IoU 阈值 $\tau$。  
**Output**：最终检测结果集合 $D$。

**Algorithm**：

1. 初始化：$D \leftarrow \varnothing$。
2. 按 class score $S$ 将 $B$ 中所有候选框**降序排序**。
3. 从 $B$ 中选取当前分数最高的框 $b$，将其从 $B$ 移除，并加入 $D$。
4. 将 $b$ 与 $B$ 中剩余所有候选框逐一计算 IoU，若 $\text{IoU}(b, b') \gt \tau$，则将 $b'$ 从 $B$ 中移除。
5. 重复步骤 3–4，直到 $B$ 为空。
6. 返回 $D$。

**Variants**：

- **Soft-NMS**：不直接删除高 IoU 框，而是根据重叠程度衰减其置信度分数，从而降低硬删除造成的召回损失。
- **Class-wise NMS**：对每个类别独立执行 NMS，避免不同类别的检测框互相抑制。

**Notes**：

- Soft-NMS 可以缓解多个真实目标在空间中确实高度重叠的问题，如拥挤、遮挡场景。
- Class-wise NMS 可以缓解不同类别的框即使空间重叠也应分别保留的问题，如人和背包的重叠。

### Evaluation Metrics

检测任务的评估不仅要考虑 classification accuracy，还要考虑定位精度和重复检测。核心指标为 **AP**（Average Precision）与 **mAP**（mean AP）。

**Basic Definitions**：

- **Precision**：
    $$
    \text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}
    $$
- **Recall**：
    $$
    \text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}
    $$
- **TP**：类别正确，$\text{IoU}(\text{pred}, \text{gt}) \ge \tau$，且该 GT 框此前未被其他更高置信度的预测框匹配过。
- **FP**：类别错误，$\text{IoU}(\text{pred}, \text{gt}) \lt \tau$，或匹配到已被占用的 GT 的预测框。
- **FN**：未被预测框匹配的 GT 框。

**AP**（Average Precision）：

对单个类别，将检测结果按 class score 降序，计算不同阈值下（依次遍历每个检测结果的 class score 即可）的 precision 与 recall，绘制 Precision-Recall 曲线。

AP 是 PR 曲线下的面积。通常采用 11-point 插值来算：
$$
\text{AP} = \frac{1}{11}\sum_{\text{Recall}_i} \text{Precision}(\text{Recall}_i)
$$

**mAP**（mean AP）：

对多个类别取平均，或对不同 IoU 阈值取平均，或对类别和阈值一起取平均。

---

## Instance Segmentation: Mask R-CNN

实例分割，逐像素预测类别，且区分同类不同实例。

主流思路分为 bottom-up 与 top-down 两类。

| 方法 | 思路 | 优点 | 缺点 |
| :--- | :--- | :--- | :--- |
| **Bottom-up** | 先做 pixel grouping，再将每个 group 标注为不同实例 | 不依赖 object detector，能处理重叠严重物体 | pixel grouping 困难 |
| **Top-down** | 先做 object detection，再在每个框内标记 binary mask | 与 object detector 结合紧密，直观可扩展 | 依赖 object detection 质量 |
| **Hybrid** / **Proposal-free** | 直接做 transformer-based 的集合预测 | 可实现 end-to-end | 设计与训练较复杂 |

**Mask R-CNN** 是一种典型的 **Top-down** 框架，基于 Faster R-CNN 结构，额外增加了一个 mask head 用于预测每个 RoI 的 binary mask。

### Pipeline

1. Backbone CNN 提取 feature map。
2. 使用 RPN 在 feature map 上生成 proposals。
3. 对每个 proposal 使用 RoIAlign 从 feature map 中裁剪固定大小的 RoI。
4. 将 RoI 特征分别送入三个并行分支：
   - cls head：预测 classification。
   - reg head：回归 bbox。
   - mask head：为该 RoI 预测一个同分辨率的 binary mask。

**注**：在训练时，只对 positive 进行 mask head。

### RoIAlign

原始的 RoI Pool 在将 proposal 区域映射到 feature map 并划分 bin 时，会进行离散化（quantization），导致误差。

为解决这一问题，Mask R-CNN 引入了 **RoIAlign**：

1. Proposal project 得到的浮点位置不变，直接划分 bin。
2. 对每个 bin 采样若干点（常用 4 个点），对采样点使用 bilinear interpolation 进行取值，然后做 max 或 average pooling。
3. 输出固定大小的 RoI。

**注**：这一看似微小的改进能大大提升精度，尤其是高阈值时的 AP 提升明显。

### Mask Head Design

#### Output: Multinomial vs Independent

**Multinomial**（per pixel Softmax）：

标准语义分割的做法，对每个像素输出 $K$ 维向量并经 Softmax，得到 $K$ 个类别的概率分布。
但在 Mask R-CNN 中，类别已经**由 cls head 单独判定**，mask head 只需判断前景/背景。
若使用 Softmax，不同类别的掩码概率会相互挤压（class competition），导致掩码预测与分类结果冲突。

**Independent**（per pixel Sigmoid）：Mask R-CNN 采用此方式。每像素独立做二分类，与类别完全解耦，避免概率竞争，使 mask head 专注于实例形状。

#### Architecture: Class-specific vs Class-agnostic

在确定了 Sigmoid 二分类的形式后，还需决定是否为每个类别维护独立的掩码通道。

**Class-specific**：输出 $K$ 通道，也即为 $K$ 个类别各预测一个 binary mask。

- 优点：自然编码类别相关的形状先验（如人与车的形状不同）。
- 缺点：参数量随类别数线性增长，类别较多时代价高。

**Class-agnostic**：输出 $1$ 通道，也即所有类别共享同一个 binary mask。

- 优点：参数量小，训练更简洁。在许多场景下性能接近 class-specific。

Mask R-CNN 采用 **class-specific** 的 $K$ 通道输出，但训练与推理时仅使用 cls head 预测的类别所对应的那个通道。

#### Loss: Per-Pixel Binary CE

Mask R-CNN 对每个 RoI 的掩码使用 **Per-Pixel Binary Cross-Entropy**：
$$
\mathcal{L}_{mask}
= -\frac{1}{m^2} \sum_{u=1}^{m} \sum_{v=1}^{m}
\left[ y_{uv} \log \hat{y}_{uv} + (1 - y_{uv}) \log (1 - \hat{y}_{uv}) \right]
$$

其中：

- $m$：掩码分辨率（如 $28 \times 28$），与 RoI 的分辨率相同；
- $y_{uv}\in\{0,1\}$：对应位置的真实掩码像素；
- $\hat{y}_{uv}\in(0,1)$：网络预测的该位置属于该实例的概率；

**注**：训练时**仅对该 RoI 的 GT 类别所对应的通道计算 BCE Loss**，其余通道不参与梯度回传，避免了不同类别掩码之间的梯度干扰。
