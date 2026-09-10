---
title: 'SwitchML'
excerpt: '鼠鼠我呀'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'INC'
pubDate: 'July 24 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<iframe src="/others/blog/research/05-switchml-01-interactive-learning.html" width="100%" height="1080"
        title="SwitchML 交互式协议演示"></iframe>

## 背景与动机

### 分布式机器学习中的通信瓶颈

**核心问题**：随着 GPU 等计算加速器性能快速提升，网络带宽增长相对滞后，分布式训练中的通信开销逐渐成为瓶颈。

**数据并行 SGD 的基本流程**：

1. 每个 worker 本地计算梯度更新 $\Delta(x^t, D_i^t)$
2. 所有 worker 同步聚合梯度
3. 更新全局模型参数 $x^{t+1} = x^t + \sum_{i=1}^n \Delta(x^t, D_i^t)$

**通信模式对比**：

| 方法 | 通信量(每节点) | 延迟 | 可扩展性 | 架构 | 额外资源 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 参数服务器(Parameter Server) | $2U$ 每 worker，$\frac{2nU}{m}$ 每 PS | 较高 | 纵向加 PS 节点 | 中心化 | 需额外 PS 服务器 |
| Ring All-Reduce | $4U\cdot\frac{n-1}{n}$ | 随 $n$ 增长 | 较好 | 去中心化 | 无 |
| In-Network Aggregation | $2U$ | 亚RTT | 横向换网络设备，受端口限制 | 去中心化 | 仅需交换机 |

其中 $U$ 为单个 worker 产生的模型更新大小（字节数）。
有关 Ring All-Reduce 可参考文章 [手把手推导Ring All-reduce的数学性质](https://zhuanlan.zhihu.com/p/504957661)。

**注**：通信开销与模型大小成正比。当前大模型已超过32GB，且模型规模呈指数增长。

---

## SwitchML 核心设计

### 系统架构

**整体架构**：SwitchML 是交换机数据面、端主机传输层和 ML 框架的协同设计。

**结构示意**：

```text
Worker 1 (GPU) ──┐
Worker 2 (GPU) ──┼──-> [可编程交换机] ──-> 聚合结果分发
Worker 3 (GPU) ──┤     (Tofino 芯片)
Worker n (GPU) ──┘
```

### 四大关键技术

#### 交换机-主机协同架构

**核心思想**：将计算任务合理划分，交换机负责简单的整数聚合，端主机负责可靠性管理和复杂计算。

**原因**：可编程交换机的每包处理能力有限，仅支持简单整数运算，不支持浮点运算和除法。

#### 基于池的流式聚合

**问题**：模型更新通常数百 MB，远超交换机片上存储容量（仅几十 MB）。

**解决方案**：将模型更新分块流式处理。

- 交换机维护一个包含 $s$ 个聚合槽（slot）的池（pool）
- 每个槽聚合 $k$ 个整数的向量
- 工作节点流式发送数据块，交换机即时聚合并转发

**自时钟机制**：

```text
Worker 发送第 j 块 -> Switch 聚合 -> Switch 广播结果 -> Worker 收到后发送第 (j+s) 块
```

**注**：无需显式协调，槽的复用由数据流自动控制。槽大小 $s$ 应满足 $k \cdot s \geq$ 带宽时延积，从而完全利用链路带宽。

#### 容错协议

**挑战**：丢包会导致聚合停滞；简单重传可能导致重复聚合或错误槽位写入。

**解决方案**（双版本阴影复制）：

| 机制 | 作用 | 实现方式 | 解决的网络传输问题 |
| :--- | :--- | :----- | :---------------- |
| 双池版本(ver) | 支持重传已完成的聚合结果 | 每个槽维护两个副本，交替使用 | **重传包写到错误版本/槽位**（因重传延迟到达时，当前轮次已推进到新版本，导致新旧数据混写） |
| Worker 位图(seen) | 防止重复聚合 | 记录哪些 worker 已贡献更新 | **重复累加**（丢包后超时重传，但原包只是延迟并未丢失，同一梯度被累加两次） |
| 超时重传 | 检测丢包 | 端主机计时器驱动 | **丢包导致的聚合停滞**（交换机等待缺失数据，无法完成该槽聚合，后续槽位被阻塞） |

**核心不变量**：任何 worker 在特定槽上最多落后其他 worker 一个数据块。

#### 浮点数量化

**问题**：交换机不支持浮点运算，但 DNN 训练使用浮点数。

**解决方案**（自适应块浮点）：

**量化过程**：

1. 对每个数据块，计算最大绝对值 $h$
2. 确定缩放因子 $f = \frac{2^{31}-1}{n \cdot 2^m}$，其中 $m$ 是 $h$ 向上取整到 2 的幂次
3. Worker 将浮点梯度乘以 $f$ 并取整为 32 位整数
4. 交换机执行整数加法聚合
5. Worker 将结果除以 $f$ 恢复

**精度保证**：

$$
\text{误差界} = \frac{n}{f} \approx \frac{n^2 B}{2^{31}-n}
$$

其中 $B$ 是梯度上界。实际中该误差可忽略不计。

**收敛性验证**：

在 CIFAR-10 上训练 ResNet-110，SwitchML 与 TensorFlow 基线达到相似的测试准确率（约91-93%）。

---

## 算法详解

### Switch 逻辑（无丢包）

```c
Initialize State:
  n = number of workers
  pool[s], count[s] := {0}

upon recieve packet p(idx, off, vector)：
  pool[p.idx] <- pool[p.idx] + p.vector    // 向量加法
  count[p.idx]++

  if count[p.idx] == n then                // 聚合完成
    p.vector <- pool[p.idx]
    pool[p.idx] <- 0; count[p.idx] <- 0    // 重置槽位
    multicast p                            // 分发聚合结果
  else
    drop p
```

### Worker 逻辑（无丢包）

```c
// 初始发送 s 个包
for i in 0:s do
  p.idx <- i
  p.off <- k·i
  p.vector <- U[p.off : p.off+k]
  send p

// 自时钟循环
repeat
  recieve p(idx, off, vector)
  A[p.off : p.off+k] <- p.vector          // 收集聚合结果

  p.off <- p.off + k·s                    // 推进到下一个块
  if p.off < size(U) then
    p.vector <- U[p.off : p.off+k]
    send p                                // 复用同一槽位
until A is complete
```

### Switch 逻辑（解决丢包）

```c
Initialize State: 
  n = number of workers
  pool[2, s], count[2, s], seen[2, s, n] := {0}

upon receive p(wid, ver, idx, off, vector)
  if seen[p.ver, p.idx, p.wid] = 0 then
    seen[p.ver, p.idx, p.wid] <- 1
    seen[(p.ver+1)%2, p.idx, p.wid] <- 0     // 清除旧版本位图，准备下一轮
    count[p.ver, p.idx] <- (count[p.ver, p.idx] + 1) % n  // 模 n 计数，0 表示刚好收齐
    if count[p.ver, p.idx] = 1 then
      pool[p.ver, p.idx] <- p.vector         // 首个到达，直接赋值
    else
      pool[p.ver, p.idx] <- pool[p.ver, p.idx] + p.vector
    if count[p.ver, p.idx] = 0 then          // 聚合完成（回到0）
      p.vector <- pool[p.ver, p.idx]
      multicast p
    else
      drop p

  else
    if count[p.ver, p.idx] = 0 then          // 聚合已完成，该包为重传
      p.vector <- pool[p.ver, p.idx]
      forward p to p.wid                     // 单播聚合结果给该 worker
    else
      drop p
```

### Worker 逻辑（解决丢包）

```c
for i in 0:s do
  p.wid <- Worker ID
  p.ver <- 0                               // 初始版本为 0
  p.idx <- i
  p.off <- k · i
  p.vector <- U[p.off : p.off + k]
  send p
  start_timer(p)                           // 启动超时计时器

repeat
  receive p(wid, ver, idx, off, vector)
  cancel_timer(p)                          // 收到确认，取消计时
  A[p.off : p.off + k] <- p.vector
  p.off <- p.off + k· s
  if p.off < size(U) then
    p.ver <- (p.ver+1)%2                   // 切换版本
    p.vector U[p.off : p.off + k]
    send p
    start_timer(p)                         // 发送新块后重新计时
until A is incomplete

upon timeout p /* Timeout Handler */
  send p                                   // 超时重传
  start_timer(p)                           // 重传后重新计时
```

---

## 实验评估

### 测试环境

- **硬件**：8 台服务器，各配 1×NVIDIA P100 GPU，Wedge100BF-65X 可编程交换机（Tofino 芯片）
- **网络**：10Gbps / 100Gbps
- **框架**：PyTorch DistributedDataParallel, TensorFlow + Horovod

### 微基准测试（张量聚合）

**ATE/s（每秒聚合元素数）对比**：

| 配置 | 10Gbps | 100Gbps |
| :--- | :--- | :--- |
| SwitchML RDMA 256 | ~280×10⁶ | ~2800×10⁶ |
| SwitchML DPDK 64 | ~240×10⁶ | ~1800×10⁶ |
| NCCL-RDMA | ~200×10⁶ | ~1200×10⁶ |
| NCCL-TCP | ~120×10⁶ | ~400×10⁶ |
| Gloo | ~200×10⁶ | ~1000×10⁶ |

**注**：SwitchML RDMA 256 配置达到接近理论最大 goodput 的98%。

### 端到端训练加速

**100Gbps 下 batch 处理加速比**（相对NCCL）：

| 模型 | vs NCCL-TCP | vs NCCL-RDMA | 通信占比 |
| :--- | :--- | :--- | :--- |
| DeepLight | 5.5× | 2.27× | 97% -> 79% |
| LSTM | 3.5× | 1.71× | 94% -> 46% |
| BERT | 2.41× | 1.24× | 67% -> 17% |
| NCF | 1.14× | 1.13× | 72% -> 23% |

**关键发现**：

- 通信占比高的模型（DeepLight, LSTM）获益最大
- 即使 100Gbps 网络，SwitchML 仍能显著加速通信密集型模型
- 使用更快 GPU（10×）时，通信瓶颈更突出，SwitchML 优势更大

### 与梯度压缩对比

| 方法 | 加速比 | 精度损失 | 额外开销 |
| :--- | :--- | :--- | :--- |
| SwitchML | 1.67× (100Gbps) | 无 | 可忽略 |
| QSGD-64 | 0.93× | 无 | 编解码计算 |
| QSGD-256 | 0.78× | 无 | 编解码计算 |
| Top-k 10% | 0.47× | -0.9%~-3.3% | 稀疏编码 |
| Top-k 1% | 2.96× | 可能不收敛 | 稀疏编码 |

**关键点**：梯度压缩虽减少数据量，但编解码计算开销常抵消通信收益；高压缩比虽快但可能损害收敛。

---

## 扩展性讨论

### 超越单机架

**层次化聚合架构**：

```text
Worker ──-> ToR Switch ──-> Tier-1 Aggregation Switch ──-> Root Switch
  (机架内聚合)      (跨机架部分聚合)              (全局聚合+多播)
```

**规模估算**：使用当前 64 端口、4 流水线、100Gbps 交换机：

- 两层架构：支持最多 240 个 worker
- 三层架构：支持最多 3600 个 worker

### 资源占用

- 聚合逻辑仅使用交换机入口流水线
- 内存占用<10%的交换机资源
- 支持多租户：每个任务独立聚合池

---

## 总结与思考

### 核心贡献

1. 首次在商用可编程以太网交换机上实现线速网络内聚合
2. 提出流式聚合+自时钟机制，解决交换机内存有限问题
3. 设计轻量级容错协议，无需交换机参与重传决策
4. 提出自适应量化方案，在整数聚合与浮点精度间取得平衡

### 设计启示

**本质**：网络内计算的关键不在于把尽可能多的计算放到网络中，而在于找到网络擅长什么、主机擅长什么的最佳分工边界。

- 交换机擅长：简单并行运算、低延迟转发、状态查找
- 交换机受限：复杂运算、大状态存储、浮点运算
- 主机擅长：复杂协议逻辑、浮点运算、大内存管理

### 局限性

- 当前原型限于单机架规模（64-256 节点）
- 需要特定可编程交换机硬件（Tofino 等）
- 仅针对同步 SGD，不支持异步训练
- 加密流量支持需额外研究

### 后续研究方向

- 稀疏梯度聚合的交换机支持
- 更低精度（16位/8位）量化在交换机上的实现
- 与更先进拥塞控制算法的结合
- 多任务调度与资源隔离机制
