---
title: 'Arbor'
excerpt: '鼠鼠我呀'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'INC'
pubDate: 'July 22 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

<iframe src="/others/blog/research/03-arbor-01-interactive-learning.html" width="100%" height="1080"
        title="Arbor V3 交互式协议演示"></iframe>

<!-- ![图 1：hhh]() -->

## 为什么需要 Arbor？

### 场景

想象 8 台 GPU 服务器一起训练大模型。每台服务器计算完梯度后，需要把所有梯度加起来，然后每台都得到总和。这就是 **AllReduce**。

### 现有问题

**端侧（GPU/CPU）看到的**：

- "我要把 8 台机器的梯度求和"
- 端侧有精心设计的调度计划，知道哪些数据属于同一轮、应该在哪里合并

**网络设备（交换机）看到的**：

- "收到一个从 A 到 B 的包……又收到一个从 C 到 D 的包……"
- 网络只看见**独立的点对点数据包**

**问题**：

| 网络不知道 | 后果 |
| --------- | ---- |
| 哪些输入属于同一个数据块 | 无法共享聚合状态，重复传输 |
| 它们应该在哪里合并 | 只能端到端传输，浪费带宽 |
| 整组输入何时完成 | 无法判断是否可以提交结果 |
| 丢包了该恢复什么 | 只能重传单条连接，可能破坏聚合状态 |

### 现有系统的局限

| 系统 | 解决了 | 没解决 |
| ---- | ------ | ------ |
| **SwitchML** | 交换机里做加法（聚合） | 路径选哪条？各走各的 |
| **ATP** | 共享交换机内存做聚合 | 拥塞了谁降速？各管各的 |
| **传统传输（TCP/RDMA）** | 保证 A->B 的包不丢 | 丢了一个包，只重传 A->B，不知道整组数据都乱了 |

**核心矛盾**：路径选择、聚合位置、拥塞控制、故障恢复，四件事由四个独立机制管，互不配合。

---

## 核心概念速查表

| 术语 | 通俗解释 | 对应论文概念 |
| ---- | ------- | ----------- |
| **Channel** | 一条"传输管道"：一个老板（responder）和一群员工（requester）之间的固定关系 | 多播-聚合流 |
| **Message** | 一次 collective 调用要传输的数据，切成多个 packet | - |
| **Packet Offset** | "第几页报告"——数据被切成很多页，同一页的所有输入要合并 | packet offset |
| **Credit** | "许可证"——老板发给全组员工的授权，允许发某一页报告 | 组播 credit |
| **Subchannel** | 一棵"聚合树"——员工交报告的具体路线 | 聚合树 |
| **Credit Context** | 许可证上的完整信息：哪页报告、走哪条路、在哪个中转站合并 | `(channel, offset, subchannel)` |
| **Slot** | 中转站的"临时合并文件夹"——记录这页报告已收到几份、当前和是多少 | 聚合状态 |
| **Owner** | 文件夹上的标签——"这是第 5 页报告的文件夹"，防止旧报告混进新文件夹 | owner tag |
| **Fan-in** | 这一级需要凑满多少份输入才能继续往上送 | 凑满数 |
| **AGG_MISS** | "文件夹标签对不上！"——失配通知，触发整组重传 | 失配通知 |
| **Repair** | "大家重新交！"——整组重传机制 | 整组 repair |

---

## Arbor 是什么？

### 定义

Arbor 是一种专门为在网集合通信设计的传输层。
它用组播 credit 把同一数据块的所有输入绑定到统一的聚合上下文中，使路径选择、聚合状态、拥塞控制和故障恢复共享同一个边界。

### 核心思想

**传统做法（点对点）**：

- 每个人单独寄快递给老板
- 快递站只看到 8 个独立包裹
- 有人寄丢了，只重寄那一个人的
- 8 个人走不同路线，有的堵车，有的畅通

**Arbor 做法（组播 credit）**：

- 老板发一张许可证给整组 8 个人
- 许可证上说："这是第 5 页报告，都走 3 号路线，在 2 号中转站汇合"
- 8 个人凭**同一张许可证**出发，快递站知道他们是一伙的
- 有人迟到或丢件，老板发现"第 5 页整组没齐"，**统一通知 8 个人重交**
- 哪条路堵了，老板看"整组完成时间"就知道，下一张许可证换条路线

---

## 四大组成部分

### 端侧

**Requester（请求端/员工）**：

- 被动等待 credit（许可证），凭 credit 发送 request（报告）
- 不主动发包，不维护重传定时器
- 收到 repair credit 后无条件重发

**Responder（响应端/老板）**：

- 发放 credit（许可证）
- 执行拥塞控制（决定发多快、发多少）
- 统一发起恢复（发现丢包就通知全组重传）
- 唯一提交点（确保结果只提交一次）

### 转发与组播平面

- 按 `(group, channel, subchannel)` 选择一棵树
- 负责 normal response/credit 的树内复制
- 负责 request/master 的反向转发

### 逐级聚合平面（交换机/加速器）

**关键特性**（即插即用）：

- 不预装通信组、rank、源 IP 等信息
- 只按 request 携带的位置栈直接定位 slot
- 只按 `(channel identity, packet offset)` 校验 owner
- 凑满 fan-in 数就继续往上送

**共享 allocator**：

- 所有端口、所有 job 共享同一个 slot 池
- 不按 job 划分，空闲 slot 可以被任何 job 借用
- 容量公式：`A >= ⌈λ × R⌉`（推进率 × 最长 RTT）

### 实验适配层

- 把上层 collective 编译成固定 channel 分片
- 为每条 channel 配置 subchannel 树和逐级 fan-in
- 导出统计与断言

---

## 关键机制详解

### 组播 Credit 机制

```text
Responder 发放 credit -> 沿树下行 -> 每级分配 slot、压栈 -> 到达 Requester
                                              ↑
Requester 消费 credit 发 request -> 沿树上行 -> 每级弹栈、聚合 -> 到达 Responder
```

**Credit 的作用**：

1. **授权**：允许 requester 发送某一 offset 的数据
2. **选路**：指定走哪棵 subchannel 树
3. **定位**：下行时逐级分配聚合位置（slot）
4. **同步**：全组 requester 继承同一个 Credit Context

**Credit Context 唯一性**：

- 同一份 credit 在所有 requester 上必须对应同一个 `(channel, offset, subchannel)`
- 防止不同 requester 把同一份 credit 绑定到不同 offset

### 聚合器位置反馈

**下行（压栈）**：

- credit 经过每个聚合级时，分配一个 slot
- 把 slot 编号压入位置栈 `agg_loc[]`
- 设置 owner = `(flow_key, credit_offset)`

**上行（弹栈）**：

- request 携带完整位置栈回显
- 每级读取栈顶 `agg_loc`，验证 owner
- 凑满 fan-in 后弹一层，发出聚合结果

**Owner 失配**：

- 如果 slot 已被新 Credit Context 覆盖（旧数据还没处理完）
- 丢弃 payload，改写为 header-only `AGG_MISS`
- `AGG_MISS` 直达 responder，触发整组 repair

### 端到端拥塞控制

**位置完全在 responder**：

- 交换机不保存任何 CC 状态
- 只可选地标记 CE（拥塞经历）

**两道门**：

1. **速率门（pacing）**：相邻 credit 的最小发放间隔
2. **窗口门（window）**：未完成 credit 的上限

**样本来源**：

- 一份 normal credit 首次完成时产生一个样本
- 覆盖 credit 组播下行 + requester 消费 + request 上行 + fan-in 等待 + 聚合返回
- 是**最慢分支**的闭环完成时延，不是单点 RTT

**支持的控制器**：

| 控制器 | 类型 | 特点 |
| ------ | ---- | ---- |
| Disabled | - | 固定窗口，用于调试 |
| Fixed | - | 给定 rate/window，用于隔离实验 |
| TIMELY | 时延 | 基于 RTT 梯度 |
| Swift | 窗口 | 基于时延与目标队列 |
| DCQCN-style | ECN | 基于显式拥塞通知 |
| Oscar | 混合 | 时延+梯度+参考在途量 |

### 可靠性与重传

**Normal 路径（纯计数）**：

- requester 对每个 Credit Context 至多发一份 normal request
- 加速器按贡献计数完成聚合
- 不需要 requester 身份表

**Repair 路径（身份去重）**：

- responder 是唯一恢复发起者
- 超时或收到 AGG_MISS -> 原子切入 repair mode
- 组播 repair credit（repair trigger）
- 全组 requester 发送 repair request（旁路聚合）
- responder 用位图去重、端侧聚合提交

**关键规则**：

- 进入 repair mode 后，迟到的 normal master 不再提交
- repair request 无条件旁路，不进入原 slot
- 已提交结果从缓存重放，不重新聚合

### 共享 Slot 池

**为什么共享？**

- 多个 job 可以借用空闲 slot
- 不需要为每个 job 预留一份 BDP（带宽时延积）
- 系统只需按全局推进率和 RTT 配置总容量

**安全条件**：

- 同一 slot 两次分配间隔 >= 最长 RTT
- 旧数据要么已完成离开，要么因 owner 失配触发 repair
- 不会混淆不同 Credit Context 的数据

---

## 数据包格式

### 帧结构

```text
[14B Ethernet][20B IPv4][8B UDP][16B/20B Arbor V3 Header][0..8192B Payload]
```

- 单级 profile：58 字节头（16B Arbor + 42B 网络头）
- 多级 profile：62 字节头（20B Arbor + 42B 网络头）

### Arbor V3 Header（20B 满格式）

| 字节 | 字段 | 说明 |
| ---- | ---- | ---- |
| 0[7:6] | version | 恒为 2 |
| 0[5:3] | packet_type | 0=REGISTER, 1=DATA_REQUEST, 2=RESPONSE, 3=END, 4=END_ACK, 5=REGISTER_ACK, 6=AGG_MISS |
| 0[2] | repair | 1=repair/旁路 |
| 0[1:0] | op | 0=NOP, 1=SUM, 2=MAX, 3=MIN |
| 1 | message_id | channel 内消息编号 |
| 2[7] | payload_valid | 是否有 payload |
| 2[6:5] | payload_kind | 0=DATA, 1=COMPLETION, 2=REPLAY |
| 2[4] | credit_valid | 是否携带 credit |
| 2[2:1] | agg_depth | 位置栈深度（0~3） |
| 2[0] | aggregated | 加速器置位（聚合产物） |
| 3-5 | offset_a | response: payload_offset; request: request_offset |
| 6-8 | offset_b | response: credit_offset; request: 贡献计数 |
| 9-10 | agg_loc[0] | 根级 slot 位置 |
| 11-13 | fanin[0..2] | 逐级凑满数 |
| 15 | dtype | 数据类型（f16/bf16/f32/f64/i32/i64） |
| 16-17 | agg_loc[1] | 第二级位置 |
| 18-19 | agg_loc[2] | 第三级位置 |

### 各包类型字段取值

| 字段 | REGISTER | DATA_REQUEST normal | DATA_REQUEST repair | RESPONSE normal | RESPONSE repair | END | AGG_MISS |
| ---- | -------- | ------------------- | ------------------- | --------------- | --------------- | --- | -------- |
| repair | 1 | 0 | 1 | 0 | 1 | 0 | 0 |
| offset_a | start_seq | request_offset | request_offset | payload_offset | payload_offset | start_seq | request_offset |
| offset_b | 0 | 0 | 0 | credit_offset | credit_offset | 0 | 0 |
| payload | 无 | 有/无 | 同 | DATA/COMP | REPLAY | 无 | 无 |
| credit_valid | 0 | 0 | 0 | 1 | 1 | 0 | 0 |
| agg_depth | 0 | 回显 | 0 | 0->压栈 | 0 | 0 | 0 |

---

## 六种集合通信原语

**核心原则**：六种原语共用同一数据通路，差异仅在于 channel 集合和 payload 方向。

| 原语 | Channel 集合 | Request payload | Response payload | 类型 |
| ---- | ----------- | --------------- | ---------------- | ---- |
| **AllReduce** | 每个结果分片的 owner 为 responder | 有 | 有（聚合结果） | pull |
| **Reduce** | root 为 responder | 有 | 无（completion） | pull |
| **ReduceScatter** | 全部 rank | 有 | 无（completion） | pull |
| **Broadcast** | root 为 responder | 无（ACK） | 有（root 数据） | push |
| **AllGather** | 每个源分片的 owner 为 responder | 无（ACK） | 有（各段数据） | push |
| **Barrier** | 全部 rank | 无 | 无（completion） | pull |

**Pull 类**：requester 凭 credit 提交输入，responder 返回聚合结果  
**Push 类**：responder 主动下发数据，requester 回空 ACK

---

## 状态机流程

### 正常 AllReduce 流程（以 offset p->k 为例）

```text
0. 注册阶段
   requester: 提交 message -> 发送 REGISTER(m, start_seq)
   responder: 位图收齐 -> REGISTER_ACK 或首份 credit 确认

1. Responder 发放 credit k
   - 选择 subchannel s(k)
   - 创建 offset 环条目
   - 发送 RESPONSE(p, k)：携带 payload p 和 credit k
   - 记录 first_sent_time

2. Credit 沿树下行（根->叶）
   每级聚合级：
   - 分配 slot（allocator.next()）
   - 压栈：agg_loc[depth] = slot_id
   - 向子树组播复制

3. Requester 收到 credit
   - 交付 payload p（写回用户 buffer）
   - 消费 credit k -> 构造 REQUEST(k)
   - 回显完整位置栈
   - 填入本分支 fan-in 向量

4. Request 沿树上行的（叶->根）
   每级聚合级：
   - 读取栈顶 agg_loc
   - owner 校验
   - 计数 + 聚合 payload
   - 凑满 fan-in -> 弹一层 -> 发出聚合产物

5. Responder 收到根后 master
   - 验证 contribution count == requester 数
   - Commit k（首次且仅一次）
   - 产生 CC 样本
   - 消费记账 done(k)
   - 继续发放下一份 credit...
```

### 故障恢复流程

```text
场景：某 requester 的 request 丢失

1. Responder 对 offset k 超时（50ms）
2. 原子切入 repair mode
3. 组播 repair credit(k) —— 独立预算
4. 全组 requester 收到 repair credit -> 发送 repair request（旁路）
5. Responder 用位图去重
6. 位图收齐 -> 端侧聚合提交（恢复路径）
7. 迟到的 normal master 被 repair_mode 丢弃
```

---

## 实验与评估要点

### 两条证据路径

| 路径 | 内容 | 验证什么 | 不验证什么 |
| ---- | ---- | ------- | --------- |
| **物理原型** | DPDK 主机 + FPGA/VU13P 加速器 | 真实 NIC、交换机、端侧状态机 | 不执行 FP32 运算（header-only 模式） |
| **包级仿真** | ns-3 完整协议实现 | 大规模拓扑、多租户、故障、多种控制器 | 不执行 FP32 数值运算 |

### 关键实验结果

| 实验 | 结果 |
| ---- | ---- |
| 物理 testbed（N=3, 100GbE） | 1-GiB AllReduce header-only 吞吐上界 **94.8 Gbps** |
| star-32 仿真（64-MB AllReduce） | logical goodput **93.6 Gbps** |
| star-32 仿真（1-GB AllReduce） | logical goodput **97.3 Gbps** |
| 一棵树失效（动态 vs 静态） | 动态 **95.2 Gbps** vs 静态 **74.2 Gbps** |
| 8 job 持续通信 | aggregate goodput **525.6 Gbps** |

### 实验建设顺序（建议）

1. **正确性冒烟**：单 job、无背景、充足 slot、fixed rate -> 验证协议不变量
2. **基础性能**：改变 message size、group size -> CCT/goodput
3. **Credit 同步**：增加 rank skew -> 观察 partial slot-time
4. **状态边界**：改变 slot 数 -> 观察 live slot 与 λR 关系
5. **多级聚合**：改变 rank 放置 -> 观察 per-tier 流量削减
6. **多路径**：动态 vs 静态 subchannel 选择 -> 故障恢复能力
7. **拥塞控制**：不同控制器 -> goodput/queue/公平性
8. **多租户**：多个 job 竞争 -> 资源借用、JCT、公平性
9. **可靠性**：注入丢包/延迟/故障 -> 恢复代价、单次提交
10. **AI workload**：真实训练 trace -> 通信暴露、迭代时间

---

## 常见问题 FAQ

### Q1: Arbor 和 NCCL 有什么区别？

**NCCL**：端侧集合通信库，把 AllReduce 展开为点对点传输，网络设备看不到组关系。  
**Arbor**：传输层，让网络设备"看懂"集合通信，在网聚合减少流量。

两者可以共存：NCCL 生成调度计划，Arbor 执行传输。

### Q2: 为什么叫"组播 credit"？

因为一份 credit 同时发给**全组** requester（组播），而不是像传统传输那样每个连接单独授权。

### Q3: 交换机需要多智能？

**不需要很智能**：

- 不维护通信组、rank、IP 表
- 不执行拥塞控制算法
- 只做：解析固定偏移字段 -> 直接索引 slot -> 计数 + 聚合
- 即插即用，不随 job 变化重配置

### Q4: 共享 slot 池安全吗？

**安全**，因为：

- Owner 校验隔离不同 Credit Context
- 轮转深度覆盖最长 RTT 内的分配
- 失配统一走 AGG_MISS -> repair
- 不会混淆不同 job 的数据

### Q5: 为什么 responder 是唯一恢复发起者？

防止多个 requester 对同一份组播 credit 独立产生 NACK，导致重复恢复和状态混乱。

### Q6: 2-rank 场景退化为什么？

全路径 fan-in=1，直接弹栈转发，不访问 slot。Responder 收到原始 normal request，按单输入直接提交。自然退化为点对点通信。

### Q7: 什么是"header-only"模式？

物理原型的一种诊断模式：

- 保留完整的 credit、位置分配、owner/fan-in 校验、完成路径
- 但不启动 FP32 聚合运算
- 返回的 payload 值不是正确聚合结果
- 用于测量系统路径吞吐上界，不是真实性能

### Q8: 多级聚合的 fan-in 怎么确定？

由拓扑编译器在建组时计算：

- `fanin[k]` = 该 rank 路径上第 k 个聚合级覆盖的**原始 requester 贡献数**
- 不是物理子端口数，也不是预计收到的 packet 数
- 不同 rank 的 fan-in 向量可以不同（因所在子树不同）

---

## 附录：思维导图

```text
Arbor
├── 核心思想
│   └── 用"组播 credit"统一协调路径、聚合、拥塞、恢复
├── 四大组成
│   ├── 端侧运行时（requester/responder）
│   ├── 转发与组播平面（树选择、复制）
│   ├── 逐级聚合平面（slot、owner、计数）
│   └── 实验适配层（编译、统计）
├── 关键机制
│   ├── 组播 credit（授权+选路+定位+同步）
│   ├── 位置反馈（下行压栈、上行弹栈）
│   ├── 拥塞控制（responder 两道门）
│   ├── 可靠性（normal 计数 + repair 位图）
│   └── 共享 slot 池（A >= λR）
├── 数据格式
│   ├── 16B/20B Arbor Header
│   └── 7 种 packet type
├── 六种原语
│   └── 共用同一通路，只改 channel 集合和 payload 方向
└── 评估
    ├── 物理原型（header-only 吞吐上界）
    └── 包级仿真（完整协议、大规模）
```
