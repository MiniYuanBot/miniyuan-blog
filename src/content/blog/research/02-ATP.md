---
title: 'ATP (Aggregation Transmission Protocol) 研读'
excerpt: '临时抱佛脚'
author: 'miniyuan'
position: 'Beijing'
tags:
- '科研'
- '在网计算'
pubDate: 'March 01 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 概述 (Overview)

ATP 是一个领域专用（Domain-Specific）的**网络传输层服务**，专门针对分布式深度神经网络训练（DT）这一特定场景、参数服务器架构（PS Architecture）这一特定计算模式而设计。
其核心目标是通过利用**可编程交换机**在网络中直接聚合梯度，减少 Worker 到参数服务器（PS）之间的流量，从而消除通信瓶颈。

* **核心理念**：动态（Dynamic）、尽力而为（Best-effort）、多租户（Multi-tenant）。
* **适用架构**：主要针对 **Worker-PS** 架构（不适用于 Ring All-Reduce）。

---

## 流量传输与聚合机制 (Traffic Transmission & Aggregation)

ATP 的流量处理流程打破了传统的端到端语义，其传输机制可分为以下几个关键步骤：

### 数据分片与封装 (Chunking)

* **梯度分片 (Fragments)**：Worker 将巨大的梯度张量切割成固定大小的切片（Fragments）。
* **数据包大小**：每个数据包约为 **306 字节**（58B 头部 + 248B 梯度数据）。这是为了匹配可编程交换机有限的流水线处理能力。
* **整数化 (Quantization)**：由于当前交换机不支持浮点运算，Worker 在发送前将 32 位浮点数乘以缩放因子（如 $10^8$）转换为 32 位整数。

### 交换机内的动态聚合逻辑

交换机内存被组织为一组 **Aggregators（聚合条目）**。

1. **分配 (Allocation)**：当一个梯度包到达时，交换机根据 `Hash(Job ID, Seq Number)` 映射到一个 Aggregator 索引。
2. **独占与冲突 (Collision)**：
    * 如果该 Aggregator 为空，当前数据包预留此位置。
    * 如果已被同 Job 同 Seq 的包占用，执行聚合（累加）。
    * **哈希冲突处理（尽力而为）**：如果该位置已被**其他 Job** 或不同的 Seq 占用，交换机**不会等待**，而是直接将该包转发给 PS（即“尽力而为”聚合），并在包头标记 `collision`。
3. **聚合触发**：交换机记录每个 Fragment 应有的 `fan-in`（汇聚因子，即有多少个 Worker 的包应到达此交换机）。
4. **包的消失与产生**：
    * **中间包**：被交换机读取并累加进寄存器后直接**丢弃**（节省了去往 PS 的带宽）。
    * **最后一个包**：当计数器达到 `fan-in` 时，交换机将寄存器中的聚合结果替换到该包的数据段，转发给下一级交换机或 PS。

为了更透彻地理解 ATP 的聚合机制，我们可以将交换机的 **Aggregator（聚合条目）** 想象成酒店的“限时限额更衣柜”。

以下是更深层的逻辑拆解和直观图例说明。

---

### 1. 深度解析：Aggregator 内部到底存了什么？

在可编程交换机（如 Tofino）中，一个 Aggregator 并不是一个简单的内存块，而是一组由三个关键部分组成的**寄存器（Registers）**：

* **Identifier（标签槽）**：存储 `<Job ID, Sequence Number>`。这相当于柜子门上的“房客标志”，用来确定这个柜子现在归哪个任务、哪一波数据管。
* **State（状态槽）**：
  * **Bitmap (位图)**：记录哪些 Worker 的数据已经存进来了（防止重复计算）。
  * **Counter (计数器)**：记录当前已经聚合了几个 Worker 的包。
* **Value（数据槽）**：存储累加后的梯度数值（通常由于位宽限制，每个包同步聚合数百个维度）。

---

### 2. 行为详解：从“占位”到“交卷”

#### 第一阶段：抢占与锁定 (First-Come-First-Serve)

由于交换机内存极其有限（通常仅几 MB），而全网可能有成千上万个梯度包在飞。ATP 采用“先到先得”策略：

* **Hash 映射**：包 A 到达，计算出它应该去柜子 7 号。
* **查看标签**：如果 7 号柜子标签是空的，包 A 立刻把自己的 `Job 1, Seq 100` 贴上去。
* **写入第 1 份数据**：包 A 的梯度存入 Value，计数器置 1。

#### 第二阶段：静默聚合 (Silent Aggregation)

* **匹配成功**：包 B 到达，Hash 也是 7 号。检查标签，发现正是它在等的 `Job 1, Seq 100`。
* **累加**：包 B 的数据加进柜子里，计数器变 2。
* **“消失”的包**：交换机处理完后直接将包 B 销毁（Drop）。**这是减压的核心：大量流量还没出 ToR 交换机就“消失”了，换取了内存里的数值增加。**

#### 第三阶段：动态回退 (Best-effort Fallback)

* **哈希冲突**：此时另一个包 C（属于 `Job 2`）也映射到了 7 号柜子。
* **拒绝服务**：交换机一看标签不匹配，且柜子已被 Job 1 占用。
* **标记转发**：交换机不会让包 C 等待，而是直接送往目的地（PS），并在包头打上一个 `collision` 标记（告诉 PS 和 Worker：交换机资源满了，这次我没帮上忙）。

#### 第四阶段：交卷转发 (The Last Packet)

* **临界点**：当包 D 到达，累加后计数器达到了预设的 `fan-in`（比如该机架下共有 4 个 Worker，计数器到了 4）。
* **身份转换**：交换机将 7 号柜子里的**最终汇总数值**全部倒进包 D 里面，发往 PS。对于 PS 来说，它只收到了一个包，但这个包代表了 4 个 Worker 的总和。

---

### 3. ATP 聚合机制图例 (Visual Explanation)

我们将这一过程可视化，假设一个 Job 有 3 个 Worker，汇聚因子 `fan-in = 3`。

#### 情景 A：完美的网络聚合 (Ideal Case)

```text
交换机寄存器阵列 (Aggregators)
[ Index 7 ] -> { Tag: Empty, Counter: 0, Value: 0 }

1. Worker_1 发送 [Pkt_1] (Seq:100, Data: [1,1])到达
   - 发现 Empty -> 占领 Index 7
   - 寄存器状态: { Tag: <Job1, S100>, Counter: 1, Value: [1,1] }
   - 结果: [Pkt_1] 被丢弃 (Traffic -1)

2. Worker_2 发送 [Pkt_2] (Seq:100, Data: [2,2])到达
   - Tag 匹配成功! -> 执行加法 [1,1]+[2,2]
   - 寄存器状态: { Tag: <Job1, S100>, Counter: 2, Value: [3,3] }
   - 结果: [Pkt_2] 被丢弃 (Traffic -1)

3. Worker_3 发送 [Pkt_3] (Seq:100, Data: [3,3])到达
   - Tag 匹配成功! -> 执行加法 [3,3]+[3,3]
   - 计数器达到 3 (Fan-in Complete!)
   - 寄存器状态: 清空/重置 (注:实际在收到ACK才清空，此处为演示方便)
   - 结果: 将 Value [6,6] 塞进 [Pkt_3] 的躯壳，发送给 PS (Traffic: 1/3)
```

#### 情景 B：哈希冲突回退 (Collision / Best-effort)

```text
交换机寄存器阵列 (已有一项)
[ Index 9 ] -> { Tag: <Job_A, S55>, Counter: 1, Value: [...] }

1. Job_B 的 Worker 发送 [Pkt_X] (Seq:10) 到达
   - 计算 Hash 恰好映射到 Index 9
   - 交换机对比 Tag: <Job_B, S10> != <Job_A, S55>
   - 结果: 交换机无法提供服务。
   - 动作: 在 [Pkt_X] 头部标记 "Collision=1"，直接转发给 PS。
   - 意义: PS 会收到原始数据并手动聚合，保证了任务不会中断，只是没吃到“网络加速”。
```

---

### 4. 关键点小结（为什么这么设计？）

* **不阻塞（Non-blocking）**：ATP 优先保证“通”，如果内存满了就退化成传统的 PS 模式（转发），这就是所谓的 **Best-effort（尽力而为）**。
* **去中心化（Decentralized）**：交换机不需要知道有多少个 Job，每个包自己带着“录取通知书”（Fan-in）和“身份证明”（Job ID），交换机只负责按章办事。
* **低开销**：由于所有逻辑都在流水线（Pipeline）中一次性完成，即使进行这样的复杂对比和累加，依然能维持 **Line Rate (线速率)** 转发，不增加延迟。[^1]

### 多级/跨机架聚合 (Inter-rack Aggregation)

ATP 仅在 **ToR（机架顶）交换机**上部署聚合逻辑，通常分为两级：

* **第一级 (Worker ToR)**：聚合架内所有 Worker 的梯度。
* **第二级 (PS ToR)**：聚合来自不同机架（第一级交换机）的中间结果。
* **协同**：通过包头中的 `bitmap` 和 `edgeSwitchIdentifier` 字段，确保每个包在每一级只被聚合一次。

---

## 可靠性机制 (Reliability)

由于交换机在聚合过程中会丢弃数据包，传统的 TCP 确认机制失效。ATP 引入了专门的设计：

* **参数包即 ACK**：PS 在接收到完整聚合结果后，广播/组播“参数包（Parameter Packets）”给所有 Worker。Worker 将其视为 ACK。
* **丢包检测**：Worker 如果收到序号不连续的参数包，或者发生超时，则认为发生了丢包。
* **重传逻辑 (`resend` 标志)**：
  * Worker 重传缺失的梯度包，并设置 `resend` 位。
  * **交换机处理重传**：为了安全起见，第一级交换机在收到 `resend` 包时，会将当前已有的局部聚合结果连同重传包一起发往 PS，并清空该 Aggregator，确保聚合最终在 PS 端由软件完成，防止死锁。

---

## 拥塞控制机制 (Congestion Control)

ATP 不能使用基于 RTT 的算法（因为 RTT 包含了 Worker 间的同步等待时间）。

* **信号来源**：使用 **ECN（显示拥塞通知）**。
* **信号传递**：交换机若发生队列拥塞，在梯度包上标记 ECN；该标志会随聚合过程一直保留到聚合结果中，最终由 PS 复制到返回给所有 Worker 的“参数包”里。
* **调节算法**：Worker 收到带 ECN 的参数包后，使用 **AIMD（加法增加、乘法减少）** 调整发送窗口。
* **多维度控制**：同时应对链路带宽拥塞和交换机 Aggregator 资源不足导致的流量激增（Incast）。

---

## 多租户资源管理 (Multi-tenancy)

ATP 相比于之前的方案（如 SwitchML）最大的改进在于**动态分配**：

* **去中心化分配**：交换机不为特定 Job 预留静态内存。所有 Job 动态抢占 Aggregator。
* **动态哈希 (Dynamic Hashing)**：如果 PS 发现某个 Job 频繁发生哈希冲突导致无法利用交换机聚合，PS 会在参数包中通知该 Job 的 Worker 采用新的 Hash 种子，避开拥塞区域。
* **利用率最大化**：当一个 Job 处于计算阶段（Off-phase）不发包时，其占用的交换机资源会立即释放给其他正在通信（On-phase）的 Job。

---

## 总结：ATP 的流量路径图

1. **Worker** $\rightarrow$ **梯度包 (306B)** $\rightarrow$ **Worker ToR 交换机** (进行局部累加，丢弃中间包，转发满额包)。
2. **Worker ToR** $\rightarrow$ **中间聚合包** $\rightarrow$ **PS ToR 交换机** (再次聚合)。
3. **PS ToR** $\rightarrow$ **最终/局部聚合包** $\rightarrow$ **PS** (完成最后修补)。
4. **PS** $\rightarrow$ **参数返回包** (携带聚合结果 + ECN) $\rightarrow$ **Worker** (做为 ACK 并指导窗口调整)。
