---
title: 'EPIC'
excerpt: '鼠鼠我呀'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'INC'
pubDate: 'August 24 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 背景与动机

### 网络内聚合（In-Network Collective, INC）

**定义**：网络内聚合是一种将集合通信操作（如 **AllReduce**）卸载到网络交换机执行的通信范式。

**核心思想**：传统集合通信在端侧完成，所有数据需经过多次端到端传输；INC 通过在交换机内部对数据包进行聚合（Aggregation）或复制（Replication），减少网络中的总流量和传输跳数。

**背景与目的**：

- 随着大模型训练规模扩大，通信开销已成为性能瓶颈
- 现有方案如 **NVIDIA SHARP** 证明了 INC 的有效性，但多基于专有生态
- 开放以太网（Ethernet）生态成熟且广泛部署，但缺乏统一的 INC 标准

### EPIC 的设计哲学

**定义**：EPIC（Ethernet Polymorphic In-network Collectives）是一个基于**统一抽象，多态实现**原则的 INC 协议规范与参考系统。

**核心思想**：

1. **统一抽象（Unified Abstraction）**：定义与标准以太网兼容的 INC 行为、参与者功能边界和互操作接口
2. **多态实现（Polymorphic Realization）**：允许不同硬件能力的厂商以不同复杂度实现相同语义

**目的**：解决以太网生态中单一参与者难以独立完成跨层 INC 系统的困境，避免通信库、网络栈、网卡、交换机和控制器由不同厂商开发，缺乏互操作性导致投资风险和协调成本过高。

---

## 核心抽象

### IncTree 抽象

**定义**：**IncTree**（In-Network Collective Tree）是 EPIC 用于描述通信组逻辑拓扑的树形结构。

**核心思想**：

- 每个参与通信的进程称为一个 **Rank**，映射到树的叶子节点
- 非叶子节点对应网络中的交换机，负责聚合或复制数据
- 树有一个指定的根节点
- 用无向边连接两个节点；同方向的数据包构成一个 **Flow**

**数学表达**：

- 设树深度为 $H$，节点度数为 $D$
- 两个叶子节点间的路径包含 $2H-2$ 条边

### 端点（Endpoint）与流状态

**定义**：**Endpoint** 是 IncTree 边上位于某个节点一侧的通信端点，用 `<IP, QP>` 元组标识。

**注**：可以将端点理解为边与节点的交点。

**核心思想**：

- 一条边有两个 Endpoint，分别位于两个节点上
- 一个节点可以连接多条边，但每条边在该节点上的 Endpoint 是独立的
- 每个 Flow 的传输状态包括：源端点的发送状态（send state）和目的端点的接收状态（recv state）

### 六种集合通信原语

EPIC 支持六种原语，后三种可由前三种推导：

| 原语 | 语义 | 数据流向 | 推导关系 |
| :--- | :--- | :--- | :--- |
| **AllReduce** | 全规约，所有 Rank 数据求和（或其他操作）后分发给所有 Rank | 双向：先向上聚合，再向下广播 | 基础原语 |
| **Reduce** | 规约，所有 Rank 数据汇总到指定 Root | 单向：向上聚合 | 基础原语 |
| **Broadcast** | 广播，Root 数据分发给所有 Rank | 单向：向下复制 | 基础原语 |
| **Barrier** | 同步屏障 | — | 等价于空数据的 AllReduce |
| **ReduceScatter** | 先规约再散射 | 单向 | 多个 Reduce 的顺序执行 |
| **AllGather** | 全收集 | 单向 | 多个 Broadcast 的顺序执行 |

---

## 多态数据平面

### IncEngine 模块化设计

**核心思想**：将交换机中的 INC 功能解耦为独立模块，通过组合模块实现不同模式（Mode），并支持从简单到复杂的渐进式演进。

**功能模块分类**：

| 模块类型 | 具体模块 | 功能说明 |
| :--- | :--- | :--- |
| 状态与路由 | LookupTable, TranslateHeader | 根据包头查找上下文、修改包头转发 |
| 流传输 | ReceiveAck, SendAck, Retransmission | 处理 ACK/NAK、超时重传 |
| 数据操作 | CheckDuplicate, AggregateData, RecycleBuffer, ReplicateData | 去重、聚合、缓冲区回收、复制 |

**状态分类**：

1. **路由状态（Routing States）**：匹配-动作表规则，决定输出端口
2. **传输状态（Transmission States）**：每个 Endpoint 的发送/接收状态
3. **计算状态（Computation States）**：临时存储中间结果的缓冲区

### Mode-I：连接终止模式（Connection Terminated）

**定义**：Mode-I 是一种"重量级"实现，交换机上运行完整的 **RoCE**（RDMA over Converged Ethernet）协议栈。

**核心思想**：

- 交换机充当参数服务器（Parameter Server, PS）
- 终止主机连接，维护完整的传输状态（重传、确认、包重组）
- 保证逐跳可靠传输

**算法步骤**：

1. **连接建立**
   - 输入：IncManager 下发的路由和上下文配置
   - 操作：交换机与上下游建立完整 RDMA QP（Queue Pair）连接
   - 输出：就绪的传输通道
   - 目的：为后续消息级聚合提供可靠传输基础

2. **消息级聚合**
   - 输入：来自子节点的完整 RDMA 消息
   - 操作：AggregateData 模块对消息载荷求和；ReplicateData 复制结果
   - 输出：聚合结果消息或广播消息
   - 目的：在消息粒度完成 AllReduce/Reduce/Broadcast

3. **可靠传输保障**
   - 输入：RoCE ACK/NAK 包
   - 操作：交换机内部传输层处理重传和状态释放
   - 输出：确认响应或重传数据
   - 目的：确保数据不丢失、不重复、按序到达

**特点**：

- **传输粒度**：消息级（Message Granularity），需收完整个消息（$M \times U$ 字节）才处理
- **适用场景**：高端可编程交换机（如支持完整 RoCE 栈的 ASIC）

### Mode-II：连接转换模式（Connection Translated）

**定义**：Mode-II 是一种"轻量级"设计，交换机不维护完整 RoCE 状态，仅修改并转发数据包，依赖端侧保证可靠性。

**核心思想**：

- 交换机作为透明中间盒（Transparent Middlebox）
- 所有 NIC 端点使用相同的初始 **PSN**（Packet Sequence Number）
- 通过"先聚合再转发"（aggregate-then-forward）机制约束最快和最慢 Rank 的偏差

**算法步骤**：

1. **控制信号发送**
   - 输入：应用层发起集合通信请求
   - 操作：CommLib 发送独立的 RDMA Send with Immediate 消息，携带集合类型、Root、数据大小
   - 输出：控制通知到达交换机
   - 目的：让交换机识别后续数据包的集合上下文

2. **向上聚合（Upward Data）**
   - 输入：来自子节点的数据包（通过 PSN 和包头识别）
   - 操作：
     - CheckDuplicate 检测重传包
     - 首次到达的包执行 AggregateData（按 `pkt.psn % N` 索引累加到 Payload Buffer，Degree 计数加 1）
     - 若 `degree[idx] < FAN-IN`，丢弃包；否则将聚合结果写回包载荷
   - 输出：聚合结果包发往父节点
   - 目的：完成树向上的逐包聚合

3. **缓冲区回收（RecycleBuffer）**
   - 输入：完成聚合的 PSN 索引
   - 操作：清空 `(psn + MW) % (2MW)` 位置的 Payload 和 Degree（该位置已超出所有发送方窗口）
   - 输出：释放的缓冲区槽位
   - 目的：以最小 SRAM 支持流式传输

4. **向下广播（Downward Data）**
   - 输入：来自父节点的结果包
   - 操作：ReplicateData 复制包，TranslateHeader 修改目的 IP/QP，Forward 转发到所有子端口
   - 输出：多个结果包到达子节点

5. **ACK 反射**
   - 输入：端侧 NIC 发来的 RoCE ACK
   - 操作：第一跳交换机将 ACK 反射回发送方 NIC（修改包头）
   - 输出：确认信号到达发送方
   - 目的：触发发送方滑动窗口前进，释放缓冲区

**关键约束**：

- 缓冲区大小为 $2MW$（两倍窗口大小），确保窗口外槽位可被安全回收
- PSN 同步问题：非对称原语（Reduce/Broadcast）会导致不同 Rank 的 PSN 漂移，需通过多子组或 RoCE-Refined 方式解决

### Mode-III：连接增强模式（Connection Augmented）

**定义**：Mode-III 是 Mode-I 和 Mode-II 之间的折中方案，提供逐跳重传，但无需完整的消息包重组。

**核心思想**：引入 **Pipe 抽象** 管理每个跳点的缓冲区就绪和传输可靠性。

**Pipe 抽象**：

- 每个 Pipe 包含 Payload Buffer 和 Degree Buffer（大小均为 $N$）
- 维护 `psnStart`，表示有效 PSN 范围 $[\text{psnStart}, \text{psnStart} + N)$
- 关联多个入端点（Fan-In）和多个出端点

**算法步骤**：

1. **数据包接收处理**
   - 输入：数据包到达入端点
   - 操作：
     - 若 `pkt.psn >= psnStart + N`，丢弃并回复 NAK
     - 若在范围内，回复 ACK，CheckDuplicate 后执行 AggregateData
     - 若聚合完成（`degree[idx] == FAN-IN`），将结果发往出端点
   - 输出：ACK/NAK 或转发数据包
   - 目的：在包粒度实现逐跳确认和聚合

2. **ACK 处理与窗口推进**
   - 输入：出端点收到下游 ACK
   - 操作：更新 `lastAcked`；重新计算 `psnStart = min(\{e.lastAcked \mid e \in \text{出端点}\}) + 1`；回收旧缓冲区
   - 输出：释放的缓冲区空间
   - 目的：通过 ACK 动态推进滑动窗口，实现流控

3. **超时重传**
   - 输入：重传定时器触发
   - 操作：从 `lastAcked + 1` 到 `maxPsnSent` 中，对已完成聚合的索引重新构造数据包发送
   - 输出：重传包
   - 目的：保证逐跳可靠性

**与 Mode-II 的关键区别**：

- Mode-II 的窗口推进由端侧 ACK 和"聚合完成即回收"驱动
- Mode-III 的窗口推进由下游 ACK 驱动，通过 `psnStart` 强制同步所有发送方进度，避免快速 Rank 覆盖慢速 Rank 的数据

---

## 模式分析与对比

### 正确性（Correctness）

**核心思想**：EPIC 的正确性建立在两大支柱上——**计算等价于单节点处理** 和 **协议必然终止**。

**验证方法**：

- 使用 **TLA+** 形式化模型检验（Model Checking）
- 每个网络节点建模为非确定性有限自动机（NFA）
- 全局状态为所有 NFA 的组合
- 模型检验器穷举所有执行分支（包括丢包、乱序、重复）

**验证的不变性质**：

1. **计算准确性**：最终结果与服务器端规约结果一致
2. **活性（Liveness）**：协议最终到达终止状态

**模型检验结果**：

| 模式/原语 | TLA+ 代码行 | 验证时间 | 状态空间直径 |
| :--- | :--- | :--- | :--- |
| Mode-II / AllReduce | 1222 | 20s | 77 |
| Mode-II / Reduce | 1139 | 3s | 57 |
| Mode-II / Broadcast | 1108 | 10s | 60 |
| Mode-III / AllReduce | 1741 | 146min | 115 |
| Mode-III / Reduce | 1394 | 9s | 65 |
| Mode-III / Broadcast | 1386 | 113s | 67 |

**一个设计陷阱（Pitfall）**：
在从 Mode-II 演进至 Mode-III 时，直接将 Mode-II 的 RecycleBuffer 逻辑应用到 Mode-III 是错误的。
Mode-II 中"聚合完成即可回收 `psn + MW` 位置"成立，是因为端侧重传同步了所有 Rank 的窗口；
但 Mode-III 中窗口由各跳 ACK 独立推进，快速 Rank 的窗口可能仍覆盖 `psn + MW` 位置，提前清除会导致计算错误。解决方案是引入 Pipe 抽象，强制通过 `psnStart` 统一可写范围。

### 传输效率

**假设**：AllReduce 在深度为 $H$ 的 IncTree 上执行，数据总量为 $S$，链路带宽为 $B$，MTU 为 $U$，每消息包含 $M$ 个包。

**Mode-I 总时延**：
$$
T_{\text{Mode-I}} = (2H - 2)L + (2H - 3)\frac{MU}{B} + \frac{S}{B}
$$

**Mode-II/III 总时延**：
$$
T_{\text{Mode-II/III}} = (2H - 2)L + (2H - 3)\frac{U}{B} + \frac{S}{B}
$$

**符号说明**：

- $L$：单跳链路传播时延
- $MU$：Mode-I 的消息级存储转发粒度
- $U$：Mode-II/III 的包级存储转发粒度

**含义解释**：Mode-II/III 相对于 Mode-I 减少了 $(2H-3)(M-1)U/B$ 的传输时间，因为包级流水线（Packet Pipelining）允许交换机无需等待完整消息即可转发。

**物理意义**：当消息很大（$S \gg MU$）或很小时，这一优势不明显；在中等消息大小时，包级流水线收益最大。

### 空间复杂度

| 模式 | 缓冲区需求 | 可复现性支持 | 空间开销排序 |
| :--- | :--- | :--- | :--- |
| **Mode-I** | 单跳 BDP（$2BL$），需 $D-1$ 个接收缓冲 + 1 聚合缓冲 + 1 广播缓冲 | 强制可复现 | 小 |
| **Mode-II** | 端到端路径 BDP（$4(H-1)BL$）；支持可复现时需 $4(H-1)(D+1)BL$ | 可选（需额外缓冲） | 大 |
| **Mode-III** | 单跳 BDP（$4BL$）；支持可复现时需 $2BL(D+1)$ | 可选 | 小 |

**符号说明**：

- $B$：链路带宽
- $L$：链路时延
- $H$：树深度
- $D$：节点度数

**含义解释**：Mode-II 需要覆盖端到端路径的带宽时延积，因此空间随树深度线性增长；Mode-I 和 Mode-III 仅需覆盖单跳 BDP，空间开销与树深度无关。

### 丢包容忍度（Loss Tolerance）

**假设**：包成功传输率为 $r$（丢包率为 $1-r$），树深度为 $H$。

**Mode-I & Mode-III**：
$$
T \approx B \cdot r^{2(H-1)}
$$

**Mode-II**：
$$
T \approx B \cdot r^{2(H-1)(D-1)}
$$

**含义解释**：

- Mode-I/III 中，兄弟节点间的传输因独立重传而互不阻塞，父节点吞吐量仅受最慢子节点影响（取最小值）
- Mode-II 中，聚合要求所有相同 PSN 的包同时到达，任一丢包会阻塞整个聚合进度；广播时丢包 Rank 的重传也会拖慢其他无丢包 Rank（乘性模型）

**物理意义**：Mode-I 和 Mode-III 的丢包容忍度显著优于 Mode-II。但在实际部署了无损二层机制（如 PFC/CBFC）时，三者表现接近。

### 综合对比

| 维度 | Mode-I | Mode-II | Mode-III |
| :--- | :--- | :--- | :--- |
| **逻辑复杂度** | 高（完整 RoCE 栈） | 低（透明中间盒） | 中（逐跳可靠） |
| **空间复杂度** | 低（单跳 BDP） | 高（路径 BDP） | 低（单跳 BDP） |
| **传输效率** | 中（消息级存储转发） | 高（包级流水线） | 高（包级流水线） |
| **丢包容忍度** | 高（独立重传） | 低（同步阻塞） | 高（独立重传） |
| **实现门槛** | 高（需完整协议栈） | 低（仅需包头处理） | 中（需 ACK/重传逻辑） |
| **演进路径** | 终点 | 起点 | 中间态 |

---

## 资源管理

### 统一资源模型

**架构**：

- **IncManager**（集中式控制器）：全局拓扑发现、资源管理、策略制定、规则下发
- **IncAgent**（交换机驻留代理）：接收 IncManager 指令，配置本地 IncEngine
- **Indirection Layer**（间接层）：将大容量的瞬态状态（Payload/degree buffer）与固定的 Endpoint 状态解耦

**核心思想**：通过指针将上下文（Context）中的大缓冲区动态映射到 SRAM，避免频繁修改全局转发表，实现敏捷的资源重分配。

### 资源分配策略

| 策略 | 核心思想 | 资源隔离方式 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **Edge-Disjoint Tree (EDT)** | 多棵 IncTree 不共享边 | 物理链路独占 | 传统固定功能硬件 |
| **Spatial Mux（空间复用）** | 静态划分交换机 SRAM，多组并发 | 资源槽位静态分配 | 多租户隔离 |
| **Temporal Mux（时间复用）** | 通信组完成后立即释放资源 | 动态时隙分配 | 3D 并行训练（TP/DP 交替） |

**直观理解**：

- EDT 就像"专用车道"，每棵树独占链路，互不干扰但资源利用率低
- Spatial Mux 就像"分区停车"，每辆车有固定车位，同时停放多辆
- Temporal Mux 就像"错峰停车"，白天上班时停 A 车，晚上停 B 车，提高车位周转率

---

## 实验评估

### 验证方法与实现

| 实现类型 | 验证目标 | 关键结果 |
| :--- | :--- | :--- |
| 模型检验（TLA+） | 正确性 | 所有 3 种模式在可靠/丢包/乱序环境下均正确 |
| Tofino 测试床 | 性能加速 | 集合通信最高 1.59×，训练任务最高 1.38× |
| 虚拟机仿真 | 互操作性、可演进性 | 3 种模式均与 RoCE 互通；Mode-III 复用 61% Mode-II 代码 |
| 流级仿真 | 资源管理收益 | GPT-3 JCT 最高降低 45.8%，多任务 P99 JCT 降低 30.9% |
| 包级仿真 | 丢包容忍度 | Mode-III 显著优于 Mode-II |
| FPGA | 时延、资源开销 | 处理时延 53ns，SRAM 需求 O(1) MB |
| RTL | 芯片可行性 | 3.2 Tbps 单引擎；28nm 工艺下单引擎 4.89 mm² |

### 关键性能数据

**集体通信加速（Tofino 测试床，Tree-2-8）**：

- 小消息（4KB）：EPIC 比 NCCL 快 10–100 倍（降低跳数和软件栈开销）
- 大消息（1GB）：EPIC-II 约 60–90 Gbps，NCCL-Ring 约 48 Gbps
- Barrier：EPIC 约 5μs，NCCL 约 2ms（~400× 提升）

**训练任务迭代时间（测试床）**：

- 数据并行（DP=8）：EPIC 与 NCCL 接近（通信占比较低）
- 张量并行（TP=8）：EPIC 比 NCCL 快 31.3%（Llama-3.2-1B），因 TP 通信密集

**推理性能（测试床，GPT-2 Large）**：

- TTFT（首 Token 时延）：EPIC 26.8ms vs NCCL 37.9ms（降低 29.3%）
- TPOT（每 Token 时延）：EPIC 25.1ms vs NCCL 36.3ms（降低 30.9%）

**资源开销**：

- Mode-II 在 100Gbps/10μs RTT 环境下仅需 250KB SRAM 每任务
- 即使仅 1MB SRAM 分配（支持 4 个并发组），在 3D 训练和多租户环境中仍能显著降低 JCT

---

## 常见疑问与解答

**Q1: 为什么 EPIC 选择基于 RoCE 而非设计全新的传输协议？**
> 因为 RoCE 是 AI 互联的事实标准。随着带宽向 1.6Tbps 发展，硬件传输卸载至关重要。EPIC 将 INC 视为现有基础设施的增强而非替代，使厂商无需为专有协议付出额外成本，确保生态的可演进性和生产就绪性。

**Q2: Mode-II 和 Mode-III 的核心差异是什么？何时应该选择 Mode-III？**
> 两者都是包级处理，但 Mode-II 依赖端侧重传和 PSN 全局同步，而 Mode-III 引入逐跳 ACK 和 Pipe 抽象实现逐跳可靠。当网络存在丢包（如跨集群、拥塞场景）或需要更好容错性时，Mode-III 更优；若追求极简实现且网络接近无损，Mode-II 是更好的起点。

**Q3: EPIC 的模块化设计如何帮助交换机厂商降低投资风险？**
> 厂商可以从最简单的 Mode-II 起步（仅包头处理），逐步复用代码演进至 Mode-III（增加 ACK/重传模块），最终可选地实现 Mode-I（完整协议栈）。这种渐进路径避免了"一次性投入全部功能"的赌博，让厂商根据市场反馈迭代硬件能力。

**Q4: 为什么 Mode-II 的丢包容忍度明显差于 Mode-III？**
> Mode-II 采用"聚合-然后-转发"：一个 PSN 位置需等所有子节点包到齐才能向上转发。任一子节点丢包会阻塞该 PSN 的全局进度。Mode-III 的 Pipe 允许各跳独立确认和重传，丢包仅影响局部链路，不会跨子树传播阻塞。

**Q5: Temporal Mux 相比 Spatial Mux 的优势和风险是什么？**
> 优势是资源利用率更高，通过时间共享让更多任务获得 INC 加速，显著降低尾延迟（P99 JCT）。风险是资源竞争可能导致部分任务被阻塞而回退到主机通信；但在 3D 并行训练等天然交替通信的场景中，这种风险很低，收益显著。
