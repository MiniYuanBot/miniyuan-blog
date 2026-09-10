---
title: 'ATP'
excerpt: '鼠鼠我呀'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'INC'
pubDate: 'July 23 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<iframe src="/others/blog/research/04-atp-01-interactive-learning.html" width="100%" height="1080"
        title="ATP 交互式协议演示"></iframe>

## 背景与动机

### 分布式深度学习训练

**定义**：将深度神经网络（Deep Neural Network, DNN）的训练任务分布到多个工作节点（Worker）上并行执行（Distributed DNN Training, DT），以加速模型收敛。

**核心思想**：采用数据并行（Data Parallelism）策略，将训练数据划分到多个 Worker，每个 Worker 独立计算梯度（Gradient），再通过参数服务器（Parameter Server, PS）聚合全局梯度。

**背景与目的**：随着模型规模增大，单设备训练时间过长，分布式训练成为刚需。然而，**通信开销**逐渐成为瓶颈，尤其是梯度聚合阶段，Worker 需将梯度上传至 PS，聚合后再下发更新参数。

**注**：传统网络设计遵循端到端原则（end-to-end principle），仅在网络层实现路由与转发。但数据中心网络的可编程化趋势（如 Tofino 交换机）为网内计算（in-network computation）提供了新机会。

### 网络内聚合

**定义**：利用网络设备（如可编程交换机）在数据包传输过程中直接完成梯度聚合操作，而非将所有梯度传至 PS 后在端主机上求和。

**核心思想**：将应用层常见的归约（Reduce）操作下沉到网络数据平面，利用交换机的有状态寄存器（Register）在流水线中累加梯度值。

**现有 SwitchML 的问题**：

| 维度 | SwitchML 方案 | 多租户场景下的问题 |
| :--- | :--- | :--- |
| 资源分配 | 静态分区（Static Partitioning） | 作业进入通信关闭阶段时，聚合器（Aggregator）空闲，资源浪费 |
| 聚合范围 | 单机架（Single Rack） | 跨机架作业流量仍需全部汇聚到 PS，无法利用多级交换机 |
| 容错性 | 依赖超时重传 | 多租户下竞争加剧，丢包恢复效率低 |
| 扩展性 | 单作业独占 | 无法公平共享有限的交换机资源 |

---

## ATP 核心设计

### 系统概述

**定义**：ATP（Aggregation Transmission Protocol）是一个面向多机架、多租户分布式训练场景的**传输层网络服务**，利用可编程交换机实现动态、尽力而为（best-effort）的梯度聚合。

**核心思想**：

1. **动态聚合器分配**：交换机资源（聚合器）不静态绑定作业，而是按需分配、用完即释
2. **两级聚合**：仅在架顶交换机（ToR, Top-of-Rack）执行聚合，也即 Worker 侧 ToR（第一级）和 PS 侧 ToR（第二级）
3. **尽力而为**：若交换机资源不足或发生冲突，数据包直接转发至 PS 聚合，保证训练不中断
4. **传输层协同设计**：重新设计可靠性（Reliability）与拥塞控制（Congestion Control）机制，适配网内聚合语义

**设计原则**：

- **卸载可复用原语**：聚合是 DT 的通用需求，作为网络服务提供
- **保持命运共享（Fate Sharing）**：交换机故障时自动回退到端主机聚合
- **将状态移出网络**：端主机负责丢包恢复与部分聚合处理
- **最小化干扰**：仅在 ToR 聚合，避免核心层路由变化带来的复杂性

### ATP 头部

**结构示意**：

```text
[IP Header] [ATP Header (16 bytes)] [Data (梯度值)]
```

ATP 头部关键字段：

| 字段 | 位数 | 作用 |
| :--- | :--- | :--- |
| `jobIDAndSequenceNumber` | 32 bits | 标识作业 ID 与梯度片段序列号，用于匹配同一作业的 Worker 数据包 |
| `bitmap0` / `bitmap1` | 各 32 bits | 两级聚合的位图，记录哪些 Worker 已被聚合 |
| `fanInDegree0` / `fanInDegree1` | 各 5 bits | 对应两级聚合的扇入度（Worker 数量） |
| `edgeSwitchIdentifier` | 1 bit | 标识当前包处于第一级还是第二级聚合路径 |
| `resend` | 1 bit | 重传标志，触发交换机释放部分聚合状态 |
| `collision` | 1 bit | 聚合器冲突标志，通知 PS 重新哈希 |
| `ecn` | 1 bit | 显式拥塞通知（Explicit Congestion Notification）标志 |
| `isAck` | 1 bit | 标识参数包（Parameter Packet），即聚合完成后的确认/回传包 |
| `aggregatorIndex` | 16 bits | 聚合器索引，由哈希 `<JobID, Sequence>` 计算得到 |

**注**：

- `job`：一个 job = 一个模型架构 + 一组超参数 + 一个数据集，被多个 worker 数据并行训练，每个 worker 拿不同 batch 的数据算梯度。
- `sequence`：一个 sequence = 一次迭代中梯度张量的一个片段，ATP 中一个片段为 248B。

故 <`jobID`=3, `sequence`=5> 的完整语义是 Job 3 在当前这次迭代中，梯度张量的第 5 个 248 字节片段。

### ToR Switch Logic

交换机将寄存器内存组织为固定大小的聚合器数组：

| 字段 | 说明 |
| :--- | :--- |
| `value` | 248 bytes，存储聚合后的梯度值 |
| `bitmap` | 32 bits，记录已聚合的 Worker 位图 |
| `counter` | 32 bits，已聚合的 Worker 数量 |
| `job ID` / `sequence number` | 标识该聚合器归属的 job 与 sequence |
| `timestamp` | 最后更新时间，用于检测孤儿聚合器（内存泄漏防护） |
| `ecn` | 1 bit，记录是否有任何被聚合的包标记了拥塞 |

**核心流程**：

1. **聚合器分配（Allocation）**
   - **输入**：到达的梯度片段包
   - **操作**：检查 `aggregatorIndex` 对应的聚合器是否空闲（`job ID` 为空）
     - **若空闲**：写入包的 `<Job ID, Sequence>`，拷贝梯度值到 `value`，初始化 `bitmap` 和 `counter`
     - **若被占用且标识不匹配**：哈希冲突（Collision），设置 `collision` 和 `resend` 标志，转发至 PS
     - **若被占用且标识匹配**：进入聚合步骤

2. **梯度聚合（Aggregation）**
   - **输入**：匹配成功的梯度包
   - **操作**：
     - 检查位图：若该 Worker 已被聚合（`bitmap` 已置位），丢弃重复包
     - 否则：将包的梯度值**累加**到聚合器 `value`，按位或（OR）更新 `bitmap`，`counter++`
   - **输出**：若 `counter < fanInDegree`，丢弃该包（节省上行带宽）；若相等，聚合完成

3. **聚合完成转发**
   - **输入**：聚合完成的聚合器
   - **操作**：将聚合器 `value` 和 `bitmap` 写入最后一个到达的 Worker 数据包，转发至 PS
   - **目的**：将聚合结果推向 PS，而非回传 Worker

4. **聚合器释放（Deallocation）**
   - **输入**：PS 回传的参数包（Parameter Packet，即 ACK）
   - **操作**：检查参数包的 `<Job ID, Sequence>` 与聚合器匹配，清空聚合器所有字段
   - **目的**：回收资源供其他作业使用

```c
Initialize State:
  A = number of aggregators
  n = max workers per aggregation
  aggr_val[A, 62], aggr_bmp[A], aggr_cnt[A] := {0}
  aggr_job[A], aggr_seq[A], aggr_ts[A], aggr_ecn[A] := {0}
  T = orphan timeout threshold

upon receive packet p(job, seq, bitmap0, bitmap1, fanIn0, fanIn1, edge, resend, collision, ecn, isAck, aggrIdx, vector):
  // 出端口队列拥塞标记
  if output_queue_length > ECN_THRESH then
    p.ecn <- 1
  
  a <- p.aggrIdx % A
  if p.isAck = 1 then        // 聚合器释放
    if aggr_job[a] = p.job and aggr_seq[a] = p.seq then
      aggr_val[a], aggr_bmp[a], aggr_cnt[a] := {0}
      aggr_job[a], aggr_seq[a], aggr_ts[a], aggr_ecn[a] := {0}
    multicast p
  
  else
    if p.edge = 0 then       // 第一级聚合
      fan <- p.fanIn0
      bmp <- p.bitmap0
    else                     // 第二级聚合
      fan <- p.fanIn1
      bmp <- p.bitmap1
    if aggr_job[a] = 0 then  // 聚合器空闲
      aggr_job[a] <- p.job
      aggr_seq[a] <- p.seq
      aggr_val[a] <- p.vector
      aggr_bmp[a] <- bmp
      aggr_cnt[a] <- 1
      aggr_ts[a] <- now
      aggr_ecn[a] <- p.ecn
      drop p
    else if aggr_job[a] != p.job or aggr_seq[a] != p.seq then  // 哈希冲突
      p.collision <- 1
      p.resend <- 1
      forward p to server
    else
      if (aggr_bmp[a] and bmp) != 0 then                       // 丢弃重复包
        aggr_ecn[a] <- aggr_ecn[a] or p.ecn
        drop p
      else                                                     // 正常聚合
        aggr_val[a] <- aggr_val[a] + p.vector
        aggr_bmp[a] <- aggr_bmp[a] or bmp
        aggr_cnt[a] <- aggr_cnt[a] + 1
        aggr_ecn[a] <- aggr_ecn[a] or p.ecn
        aggr_ts[a] <- now

        if aggr_cnt[a] = fan then
          p.vector <- aggr_val[a]
          if p.edge = 0 then
            p.bitmap0 <- aggr_bmp[a]
          else
            p.bitmap1 <- aggr_bmp[a]
          p.ecn <- aggr_ecn[a]
          p.edge <- (p.edge + 1) % 2
          forward p to server
          aggr_val[a], aggr_bmp[a], aggr_cnt[a] := {0}
          aggr_job[a], aggr_seq[a], aggr_ts[a], aggr_ecn[a] := {0}
        else
          drop p

upon timeout /* Orphan Scan */:
  for a in 0:A-1 do
    if aggr_job[a] != 0 and now - aggr_ts[a] > T then
      aggr_val[a], aggr_bmp[a], aggr_cnt[a] := {0}
      aggr_job[a], aggr_seq[a], aggr_ts[a], aggr_ecn[a] := {0}
```

### End-host Logic

#### Worker 侧

**梯度推送（Push）**：

1. ATP 网络栈拦截框架的 `Push` / `Pull` 调用
2. 将梯度张量切分为固定大小片段（306B 包：58B 头 + 248B 数据）
3. 浮点数量化为 32 位整数（见 [浮点处理](#浮点处理)）
4. 通过滑动窗口发送梯度片段包，等待 PS 回传的参数包作为 ACK

**丢包检测**：

- 维护期望序列号（Expected Sequence Number）
- 若收到 3 个连续的乱序参数包，判定对应梯度包丢失
- 重传时设置 `resend=1`，通知交换机处理部分聚合状态

```c
Initialize State:
  n = number of workers
  S = number of sequences
  W = window size
  SCALE <- 10^8
  k = chunk size
  expected_seq <- 0
  ooo_cnt <- 0   // out of order
  pending[S], sent[S] := {0}
  U = gradient tensor
  my_job, my_wid
  MY_BMP <- single-bit mask with only my_wid-th bit set

upon push gradient U:
  for seq in 0:S-1 do    // 切分梯度张量并发送
    p.job <- my_job
    p.seq <- seq
    p.vector <- round(U[seq · k : seq · k + k] · SCALE)
    p.bitmap0 <- MY_BMP
    p.fanIn0 <- n
    p.fanIn1 <- n
    p.edge <- 0
    p.resend <- 0
    p.collision <- 0
    p.ecn <- 0
    p.isAck <- 0
    p.aggrIdx <- hash(my_job, seq)
    pending[seq] <- 1
    sent[seq] <- p.vector
    send p
  start_timer(retransmit)

upon receive packet p(seq, ecn, isAck, vector):
  if p.isAck = 1 then
    if p.seq = expected_seq then
      expected_seq <- expected_seq + 1
      ooo_cnt <- 0
      pending[p.seq] <- 0
      W <- W + 1
    else if p.seq > expected_seq then
      ooo_cnt <- ooo_cnt + 1
      if ooo_cnt = 3 then   // 3 个乱序包
        q.job <- my_job
        q.seq <- expected_seq
        q.vector <- sent[expected_seq]
        q.resend <- 1
        q.aggrIdx <- hash(my_job, expected_seq)
        send q
        W <- W / 2
        ooo_cnt <- 0
    if p.ecn = 1 then
      W <- W / 2

upon timeout /* Retransmit */:
  for seq in 0:S-1 do
    if pending[seq] = 1 then
      p.job <- my_job
      p.seq <- seq
      p.vector <- sent[seq]
      p.resend <- 1
      p.aggrIdx <- hash(my_job, seq)
      send p
  start_timer(retransmit)
```

#### PS 侧

**梯度收集与聚合**：

- 为每个作业维护一个数组，索引为序列号，元素为 `<bitmap, value>`
- 接收梯度包或部分聚合包，检查位图重叠：
  - 无重叠：累加到存储值，更新位图
  - 有重叠（重复）：丢弃
- 聚合完成后，发送参数包（设置 `isAck=1`）经交换机多播回 Worker

**哈希冲突处理**：

- 若收到标记 `collision=1` 的包，PS 重新计算哈希值
- 通过参数包的未使用位图字段将新 `aggregatorIndex` 下发给 Worker
- Worker 后续使用该新索引，动态避免冲突

```c
Initialize State:
  n = number of workers
  S = number of sequences
  pool_val[S], pool_bmp[S] := {0}
  ALL_ONES <- low n bits all set to 1
  SCALE <- 10^8
  my_job

upon receive packet p(job, seq, bitmap0, bitmap1, edge, vector, collision, resend, isAck):
  if p.collision = 1 then  // 哈希冲突处理
    new_idx <- rehash(p.job, p.seq)
    ctrl.seq <- p.seq
    ctrl.aggrIdx <- new_idx
    multicast ctrl
  else if p.isAck = 0 then
    if p.job != my_job then  // 错误包丢弃
      drop p
    else
      if p.edge = 0 then
        bmp <- p.bitmap0
      else
        bmp <- p.bitmap1
      if (pool_bmp[p.seq] and bmp) != 0 then  // 重复包丢弃
        drop p
      else
        pool_val[p.seq] <- pool_val[p.seq] + p.vector
        pool_bmp[p.seq] <- pool_bmp[p.seq] or bmp
        if pool_bmp[p.seq] = ALL_ONES then
          p.vector <- pool_val[p.seq] / SCALE
          p.isAck <- 1
          p.ecn <- 0
          multicast p
          pool_val[p.seq], pool_bmp[p.seq] := {0}
```

### 跨机架聚合

**问题**：若 Worker 与 PS 位于不同机架，仅在 Worker 本地 ToR 聚合后，仍需将部分聚合结果跨机架传至 PS，造成不必要的核心网流量。

**ATP 方案**：

- **第一级聚合**：Worker 本地 ToR 聚合多个 Worker 的梯度
- **第二级聚合**：PS 侧 ToR 聚合来自不同机架的部分聚合结果
- **限制**：ATP 仅在 ToR 交换机执行聚合，不在核心层或汇聚层交换机聚合

**协调机制**：

- 数据包头部包含两组 `bitmap` 和 `fanInDegree`（`bitmap0/1`, `fanInDegree0/1`）
- `edgeSwitchIdentifier` 标志位指示当前交换机应使用哪一组字段
- 第一级聚合完成后，交换机翻转 `edgeSwitchIdentifier`，为第二级聚合做准备

**扩展性**：

- 32 位 `bitmap` 支持最多 32 个 Worker 直接连接到一个 ToR
- 两级位图通过笛卡尔积可支持最多 $32 \times 32 = 1024$ 个 Worker
- 若交换机支持 $n$ 位位图，理论上可支持 $n^2$ 个 Worker

### 可靠性与拥塞控制

#### Reliability

**挑战**：网内聚合打破了端到端语义——梯度包在交换机内被"消费"（累加后丢弃），传统 TCP 会将其误判为丢包。

**ATP 方案**：

- **丢包检测**：Worker 通过**乱序参数包**（Out-of-sequence Parameter ACK）推断梯度包丢失，而非依赖超时
- **重传语义**：
  - **第一级交换机**：收到 `resend=1` 的包时，若聚合器存在且该 Worker 未聚合，则累加后**立即释放聚合器**，将部分结果转发至下游；后续重传包直接透传
  - **第二级交换机**：直接丢弃聚合状态，转发所有重传包至 PS（因无法合并部分结果）
- **内存泄漏防护**：通过参数包携带的时间戳检查，若聚合器超时未释放，强制回收

**与 SwitchML 对比**：

| 机制 | SwitchML | ATP |
| :--- | :--- | :--- |
| 丢包检测 | 超时重传（Timeout-based） | 乱序 ACK 检测（更快） |
| 重传聚合 | 不支持网内重传聚合 | 支持部分结果下传并释放聚合器 |
| 内存泄漏 | 依赖作业正常结束 | 超时机制强制回收 |

#### Congestion Control

**挑战**：

- 多租户下网络资源（带宽、交换机缓存、聚合器数量）动态变化
- 传统 RTT 或丢包信号不适用：RTT 包含 Worker 间同步延迟，丢包在网内聚合语义下含义不同

**ATP 方案**：

- **拥塞信号**：采用 **ECN（Explicit Congestion Notification）**
  - 交换机输出队列长度超过阈值时，标记 ECN
  - 聚合过程中，ECN 位被逐包累加（OR 操作）到聚合器 ECN 字段
  - 聚合完成后，ECN 位随参数包返回所有 Worker
- **窗口控制**：AIMD（Additive Increase Multiplicative Decrease）
  - 初始窗口：200 个包（约 60KB，适配 100Gbps 网络的带宽时延积）
  - 慢启动：每收到一个 ACK，窗口增加 1 个 MTU（1500B）
  - 拥塞避免：超过阈值后，每 RTT 增加 1 个 MTU
  - 拥塞响应：收到 ECN 或 3 个乱序 ACK，窗口减半

**关键优势**：所有 Worker 收到相同的 ECN 信号，**天然同步拥塞窗口调整**，避免传统分布式训练中各 Worker 独立调整导致的不公平。

### 浮点处理

**问题**：当前可编程交换机不支持 32 位浮点运算，仅支持整数运算。

**量化方案**：

- Worker：将浮点梯度值乘以缩放因子 $s = 10^8$，四舍五入为 32 位整数
- 交换机：对整数执行累加聚合
- PS：将聚合结果除以 $s$ 恢复为浮点数

**溢出处理（Reactive Overflow Correction）**：

- **问题**：大梯度值累加可能溢出 32 位整数范围（$\pm 2^{31}$）
- **ATP 选择**：**反应式**（Reactive）而非预防式（Proactive）
  - 所有包先尝试在交换机聚合
  - 若发生溢出，交换机利用饱和（Saturation）特性将值设为最大/最小整数
  - PS 检测到饱和值后，请求所有 Worker 以原始浮点格式重传该片段，由 PS 直接聚合
- **开销**：最坏情况下一次迭代的全部梯度包重传，但实验显示溢出频率极低（$<0.00002\%$）

**缩放因子选择**：

- $s = 10^8$ 对应 32 位浮点的 7 位十进制精度
- 与 SwitchML 的"基于经验上界动态计算 $s$"不同，ATP 固定大 $s$ 以保证精度，接受极低的溢出代价

**精度损失**：

- 量级小于 $10^{-8}$ 的梯度值会被量化为 0
- ResNet50 中仅 $0.00002\%$ 的梯度值处于此范围，对最终模型精度无影响

---

## 实现优化

### 可编程交换机实现

**两阶段流水线（Two-pass）**：

- **挑战**：Tofino 交换机流水线阶段和解析能力有限，单轮处理限制包大小为 184B
- **方案**：利用 Resubmit 和 Recirculate 特性，对同一包处理两轮
  - 第 1 轮：聚合前半段梯度值
  - 第 2 轮：聚合后半段梯度值
- **效果**：最大包大小提升至 **306B**（58B 头 + 248B 数据）

**寄存器访问限制处理**：

- 限制：每个包对每个寄存器只能访问一次（读或写）
- 技巧：通过操作重排序（如位图写操作前置）或拆分为两个包（梯度包分配、参数包释放）规避限制

### 端主机网络栈

**小数据包优化**：

- 基于 Mellanox RAW Ethernet 用户态网络编程模型
- **TSO（TCP Segmentation Offload）**：将包切分卸载到网卡，减少 CPU 开销，提升 PCIe 带宽利用率
- **MP-QP（Multi-Packet QP）**：接收端使用连续缓冲区描述符，减少网卡内存占用 512 倍以上
- **效果**：TSO + MP-QP + Two-pass 综合提升 **6 倍** 吞吐量

**多线程调度**：

- 每个 Worker 维护集中式调度器，根据各线程负载动态分配张量发送任务，避免负载不均

---

## 实验评估

### 实验设置

- **测试平台**：9 台机器，8 张 NVIDIA RTX 2080Ti，Mellanox ConnectX-5 100G 网卡，Barefoot Tofino 32x100G 可编程交换机
- **对比基线**：
  - BytePS + TCP / RDMA（Nto1 和 NtoN）
  - Horovod + TCP / RDMA（Ring All-reduce）
  - SwitchML（单机架网内聚合）
- **模型**：AlexNet、VGG11/16/19、ResNet50/101/152（ImageNet 数据集）

### 单作业性能

**训练吞吐量（images/sec）**：

| 模型 | ATP | SwitchML | BytePS NtoN RDMA | Horovod RDMA |
| :--- | :--- | :--- | :--- | :--- |
| VGG16 | **最优** | 1.5x 慢于 ATP | 1.5x 慢于 ATP | 1.24x 慢于 ATP |
| ResNet50 | **最优** | - | 接近 | 接近 |

- **网络密集型模型**（VGG 系列）收益最大，ATP 比 BytePS NtoN TCP 快 **8.7x**
- **计算密集型模型**（ResNet 系列）收益较小，因通信占比低
- ATP 优于 SwitchML 主要得益于更大的包大小（306B vs 184B）

### 跨机架聚合效果

- 在典型多机架拓扑中，ATP 相比机架级方案（RSS）减少 **66%** 的 PS 接收流量
- 原因：RSS 在各机架局部聚合后将部分结果发往 PS；ATP 在 PS 侧 ToR 进行二次聚合，进一步减少上行流量

### 丢包恢复开销

- 在 0.001% 到 1% 的丢包率下，ATP 吞吐量下降远小于 SwitchML
- ATP 的乱序 ACK 检测比 SwitchML 的超时机制响应更快
- 当丢包率 $<0.1\%$ 时，训练吞吐量几乎无下降

### 时间到精度（Time-to-Accuracy, TTA）

- **单作业**：
  - VGG16 达到 75% Top-5 精度：ATP 比 BytePS 快 **1.25x**
  - ResNet50 达到 93% Top-5 精度：ATP 与 BytePS 接近（1.02x），因计算密集
  - AlexNet：快 **2.39x**
- **多作业**（2 个 VGG16 作业共享网络）：
  - ATP 比最快的 BytePS 作业快 **1.20x**，比 Horovod 快 **1.25x**
  - 两个 ATP 作业完成时间几乎相同，体现公平性

### 多租户动态共享

**动态 vs 静态分配**：

- 3 个 VGG16 作业共享交换机，聚合器数量从峰值（1980 个）逐步减少至 33%（660 个）
- **静态分配**：每个作业固定 1/3 聚合器，资源利用率低（作业通信有 on-off 阶段）
- **动态分配**：作业在 off 阶段释放聚合器供其他作业使用
- **结果**：当聚合器为 33% PTA 时，动态分配吞吐量比静态高 **38%**

**哈希方案有效性**：

- 8 个微基准作业并发时，基于哈希的动态分配与静态分配性能相当
- 无哈希的线性分配（Sequential）性能显著下降，因连续序列号冲突导致大量重传

### 拥塞控制有效性

- **与非 ATP 流量共存**：ATP 能与背景 TCP/RDMA 流量公平共享带宽，达到近似 max-min 公平
- **ATP 作业间共存**：当仅 50% 聚合器可用时（模拟竞争）
  - 有拥塞控制：聚合 goodput 稳定在 7.5 Gbps，训练吞吐量 66.8 img/s
  - 无拥塞控制：goodput 在 0-4 Gbps 剧烈波动，训练吞吐量仅 23.2 img/s（下降 **65%**）

---

## 总结与对比

### ATP 与相关工作的对比

| 特性 | SwitchML | Horovod (Ring All-reduce) | BytePS | ATP |
| :--- | :--- | :--- | :--- | :--- |
| 架构 | Worker-Switch（无 PS） | Ring All-reduce | Worker-PS | Worker-PS + In-network |
| 聚合位置 | 单机架 ToR | 端主机间 | PS 端主机 | 多级 ToR 动态聚合 |
| 多租户支持 | 静态分区，不支持 | 依赖应用层调度 | 应用层调度 | **动态尽力而为共享** |
| 跨机架优化 | 无 | 无 | 无 | **两级 ToR 聚合** |
| 可靠性 | 超时重传 | 依赖底层 RDMA/TCP | 依赖底层 | **乱序 ACK + 重传语义** |
| 拥塞控制 | 无 | 无 | 依赖底层 | **ECN-based AIMD** |
| 浮点支持 | 量化整数 | 原生浮点 | 原生浮点 | **大缩放因子 + 溢出回退** |
| 包大小 | 180B | 不限 | 不限 | **306B（Two-pass）** |

### ATP 的核心贡献

1. **多租户动态共享**：首次系统性地解决多作业共享可编程交换机资源的问题，通过去中心化 FCFS 分配和软状态实现高效复用
2. **传输层协同设计**：针对网内聚合重新设计可靠性与拥塞控制，ECN 信号保证多 Worker 同步调整窗口
3. **实用性与鲁棒性**：尽力而为聚合确保资源竞争时优雅降级；反应式溢出处理避免复杂预判；内存泄漏防护机制保障长期稳定运行
4. **性能提升**：单作业最高 **8.7x** 加速（对比 BytePS TCP），多租户竞争场景比静态分配提升 **38%**

---

## 常见疑问与解答

### 💡 常见疑问与解答

**Q1: 为什么 ATP 只在 ToR 交换机聚合，而不在汇聚层或核心层交换机也部署聚合？**
> 核心层和汇聚层通常使用 ECMP 等动态负载均衡，路由非确定性，导致无法预先知道哪些 Worker 的数据包会在哪个交换机汇聚。若在非确定性路径的交换机上部署聚合，需要复杂的路由-聚合协同机制，大幅增加系统复杂度。ATP 选择仅在 ToR（确定性接入点）聚合，在复杂度与性能间取得平衡。

**Q2: 为什么 ATP 选择 $10^8$ 作为缩放因子，而不像 SwitchML 那样根据梯度上界动态调整？**
> 动态调整缩放因子需要预先知道梯度值的上界 $B$，对于新模型需要完整训练一次才能估计，代价高昂。且当 Worker 数量增加时，为避免溢出，缩放因子必须减小，导致小梯度值被量化为 0 的比例上升（如 ResNet50 在 100 Worker 下可能有 18% 的小梯度完全失精）。ATP 固定使用 $10^8$，充分利用 32 位浮点的 7 位十进制精度，仅在最罕见的大梯度溢出时触发一次重传，实验表明对训练精度和速度几乎无影响。

---

## 关键公式汇总

### 缩放因子与精度损失

精度损失上界（SwitchML 理论）：
$$
\text{Precision Loss} \leq \frac{n}{s}
$$

其中：

- $n$：Worker 数量
- $s$：缩放因子

无溢出条件（SwitchML）：
$$
B \leq \frac{2^{31} - n}{n \cdot s}
$$

其中：

- $B$：梯度值上界
- $2^{31}$：32 位有符号整数上限

ATP 选择固定 $s = 10^8$，牺牲极低的溢出概率换取一致的高精度。

### Ring All-reduce vs PS 架构通信量

Ring All-reduce 每 Worker 通信量：
$$
4(n-1) \frac{|U|}{n}
$$

ATP（PS 架构）每 Worker 通信量：
$$
2|U|
$$

其中：

- $|U|$：待聚合的总字节数
- $n$：Worker 数量

**含义解释**：当 $n$ 较大时，Ring All-reduce 的通信量趋近于 $4|U|$，而 ATP 始终为 $2|U|$，因此 ATP 在网络流量上更优，对共存的背景流量更友好。
