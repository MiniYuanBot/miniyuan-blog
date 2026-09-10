---
title: 'P4 编程语言'
excerpt: '鼠鼠我呀'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'INC'
pubDate: 'July 11 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## P4 基础

### 硬件层

**常见芯片的对比**：

| 芯片类型 | 灵活性 | 性能/功耗比 | 典型代表 |
| -------- | ----- | ---------- | -------- |
| **CPU** | 最高（啥都能干） | 最低 | Intel Xeon, AMD EPYC |
| **GPU** | 高（图形/并行计算） | 中等 | NVIDIA H100, AMD MI300 |
| **FPGA** | 较高（可反复编程） | 中高 | Xilinx Versal, Intel Agilex |
| **ASIC** | 无（出厂即定型） | 最高 | Google TPU, 博通交换机芯片, 比特大陆矿机芯片 |

ASIC（Application-Specific Integrated Circuit，专用集成电路），是一种为特定任务量身定制的芯片。
网络设备一般采用 ASIC 提高处理 packets 的效率。报文转发是高度规则化的任务（查表、匹配、改写、转发），ASIC 可以线速处理，功耗远低于 CPU。

**ASIC 分类**：

| 特性 | Fixed-Function ASIC | Programmable ASIC |
| ------- | -------------- | ---------- |
| 功能定义 | 制造时固化，不可改 | 可通过软件/语言重新编程 |
| 性能 | 极高（线速转发） | 高（接近线速） |
| 灵活性 | 低，新协议需换硬件 | 高，可自定义协议 |
| 典型应用 | 传统数据中心、运营商核心网 | 云数据中心、SDN、网络功能虚拟化 |
| 代表厂商/产品 | Broadcom Trident/Tomahawk、Cisco 传统 ASIC | Barefoot Tofino、Intel IPU、P4 可编程交换机 |

![图 1：两种 ASIC](01-ASIC.png)

**注**：传统 Fixed-Function ASIC 是硬件决定协议，Programmable ASIC 是协议决定硬件。

### 设计范式

传统 SDN（如 OpenFlow）采用**自底向上**的设计：

- 先有芯片能匹配什么字段（12 种/40 种），应用再适配
- 数据面协议演进需要修改标准、等待芯片支持
- 厂商各自扩展，控制器需处理大量南向接口差异

P4 带来了**自顶向下**的设计范式：**This is how I want the network to behave**。其核心价值在于：

- **协议无关**：不绑定任何特定网络协议，可自定义解析新头部
- **目标无关**：同一份程序可编译到软件交换机、FPGA、NPU 或 ASIC
- **现场可重构**：部署后仍可更新数据面逻辑，无需更换硬件

| 维度 | OpenFlow | P4 |
| ---- | ------- | --- |
| **解析能力** | 固定解析器（只能识别标准字段） | **可编程解析器**（自定义新协议头） |
| **流水线结构** | 固定串联（Match -> Action） | **可编程流水线**（串/并联、多阶段） |
| **动作集合** | 预定义动作集 | **协议无关原语组合**（set/drop/clone 等） |
| **目标绑定** | 绑定特定硬件 | **目标无关**（可编译到 BMv2/FPGA/Tofino/网卡） |

### PISA 架构

**PISA（Protocol-Independent Switch Architecture，协议无关交换机架构）**是 P4 的**抽象执行模型**。一个典型的 PISA 架构包含三个阶段：

![图 2：P4 流水线](02-forwarding-model.png)

1. **Programmable Parser（可编程解析器）**：将输入比特流解析为协议头部。程序员声明需要识别的头部及其顺序。
2. **Programmable Match-Action Pipeline（可编程匹配-动作流水线）**：对解析后的头部执行匹配和动作处理。程序员定义表和处理算法。
3. **Programmable Deparser（可编程重组器）**：将处理后的头部重新序列化为输出比特流。

**相比 OpenFlow 的三点泛化**：

1. **解析器可编程**：OpenFlow 假设固定解析器；P4 支持自定义解析新头部
2. **Match+Action 可并行**：OpenFlow 假设串联；P4 支持串联、并联或组合
3. **动作由协议无关原语组合**：不依赖预定义动作集

**两种操作阶段**：

- **Configure（配置）**：定义解析器、设置表阶段顺序、指定字段
- **Populate（填充）**：向配置好的表中添加/删除规则（通常由控制面通过 P4Runtime 完成）

BMv2（Behavioral Model v2）软件交换机是 P4 的**软件参考交换机**，其上最常用的架构是 **V1Model**，这是对 PISA 的一种具体实现，其流水线顺序为：

```text
Parser -> Checksum Verification -> Ingress Match-Action -> Traffic Manager 
-> Egress Match-Action -> Checksum Update -> Deparser
```

**注**：

- **Traffic Manager** 是固定功能模块（非 P4 编程），负责队列管理、组播复制等。
- **Checksum Verification/Update** 是 V1Model 特有的辅助块，真实硬件 Intel Tofino 芯片 TNA（Tofino Native Architecture）没有这两个独立阶段。

## P4 语言五大核心组件

以下均为 P4_16 语法。

### Headers

Headers（头部定义）描述字段序列、结构、宽度及约束：

```cpp
typedef bit<48>  macAddr_t;
typedef bit<32>  ip4Addr_t;

header ethernet_t {
    macAddr_t dstAddr;
    macAddr_t srcAddr;
    bit<16>   etherType;
}

header ipv4_t {
    bit<4>    version;
    bit<4>    ihl;
    bit<8>    diffserv;
    bit<16>   totalLen;
    bit<16>   identification;
    bit<3>    flags;
    bit<13>   fragOffset;
    bit<8>    ttl;
    bit<8>    protocol;
    bit<16>   hdrChecksum;
    ip4Addr_t srcAddr;
    ip4Addr_t dstAddr;
}
```

**关键类型**：

- `bit<n>`：n 位无符号整数（位串）
- `int<n>`：n 位有符号整数
- `varbit<n>`：变长位串
- `struct`：无序成员集合（常用于 metadata）
- Header Stack：`header_t[N]` 头部数组，支持 `next`、`last`、`push_front`、`pop_front` 等操作

### Parsers

Parsers（解析器）用**有限状态机（FSM）**描述如何识别头部序列。每个解析器有三个预定义状态：`start`、`accept`、`reject`。

```cpp
parser MyParser(packet_in packet,
                out headers hdr,
                inout metadata meta,
                inout standard_metadata_t standard_metadata) {
    state start {
        transition parse_ethernet;
    }
    
    state parse_ethernet {
        packet.extract(hdr.ethernet);
        transition select(hdr.ethernet.etherType) {
            0x0800: parse_ipv4;
            default: accept;
        }
    }
    
    state parse_ipv4 {
        packet.extract(hdr.ipv4);
        transition accept;
    }
}
```

**核心原语**：

- `packet.extract(hdr)`：从比特流中提取头部并置为 valid
- `packet.lookahead<T>()`：预读但不消耗比特
- `packet.advance(n)`：跳过 n 个比特
- `select` 语句：类似 C 的 switch，但无 fall-through，常用于根据已解析字段分支

### Tables

Tables（匹配 + 动作表）是流水线的基本单元，定义匹配字段、匹配类型、可执行动作及表容量：

```cpp
table ipv4_lpm {
    key = {
        hdr.ipv4.dstAddr: lpm;
    }
    actions = {
        ipv4_forward;
        drop;
        NoAction;
    }
    size = 1024;
    default_action = NoAction();
}
```

**匹配类型**：

- `exact`：精确匹配
- `lpm`：最长前缀匹配
- `ternary`：三元匹配（带掩码）
- `range`：范围匹配（部分架构支持）
- `selector`：动作选择器（用于 ECMP）

**表执行语义**：

- 控制面对表进行**填充（Populate）**，写入具体规则（Key -> Action + Action Data）
- 数据面对表进行**匹配（Match）**，命中则执行对应动作，未命中则执行 `default_action`

### Actions

Actions（动作）由**协议无关原语**组合而成，类似 C 函数，支持方向参数（`in`、`out`、`inout`）：

```cpp
action ipv4_forward(macAddr_t dstAddr, bit<9> port) {
    standard_metadata.egress_spec = port;
    hdr.ethernet.srcAddr = hdr.ethernet.dstAddr;
    hdr.ethernet.dstAddr = dstAddr;
    hdr.ipv4.ttl = hdr.ipv4.ttl - 1;
}

action drop() {
    mark_to_drop(standard_metadata);
}
```

**参数方向**：

- **Directional（有方向）**：来自数据面，如 `inout bit<48> srcAddr`
- **Directionless（无方向）**：来自控制面，作为 Action Data 在表项中配置，如 `macAddr_t dstAddr`

| | Directional（有方向） | Directionless（无方向） |
| :-- | :--------------- | :------------------ |
| **修饰符** | 有 `in`/`out`/`inout` | 无修饰符 |
| **值从哪来** | 数据面（报文字段、元数据） | 控制面（流表 Action Data） |
| **谁提供值** | 报文进入流水线时自带 | 控制器/CLI 下发规则时填入 |
| **典型用途** | 读取/修改报文已有内容 | 控制面动态指定下一跳、端口等 |

**支持的操作**：

- 算术：`+`、`-`、`*`（**无除法/取模**）
- 位运算：`~`、`&`、`|`、`^`、`>>`、`<<`
- 比较：`==`、`!=`、`>`、`>=`、`<`、`<=`
- 特殊：位切片 `[m:l]`、位拼接 `++`

**注**：action 可以定义在 `control` 内部（local）或者定义在全局（global）。

### Control Programs

Control Programs（控制程序）用命令式程序描述表之间的执行流程。在 V1Model 中，主要控制块为 `MyIngress` 和 `MyEgress`：

```cpp
control MyIngress(inout headers hdr,
                  inout metadata meta,
                  inout standard_metadata_t standard_metadata) {
    action ipv4_forward(macAddr_t dstAddr, bit<9> port) { ... }
    action drop() { ... }
    
    table ipv4_lpm {
        key = { hdr.ipv4.dstAddr: lpm; }
        actions = { ipv4_forward; drop; NoAction; }
        default_action = NoAction();
    }
    
    apply {
        if (hdr.ipv4.isValid()) {
            ipv4_lpm.apply();
        }
    }
}

control MyEgress(inout headers hdr,
                 inout metadata meta,
                 inout standard_metadata_t standard_metadata) {
    apply { }
}
```

**V1Model 标准元数据（standard_metadata_t）关键字段**：

- `ingress_port`：报文入端口
- `egress_spec`：指定的出端口（Ingress 中设置）
- `egress_port`：实际出端口（Egress 中只读）
- `drop`：置 1 则丢弃报文
- `packet_length`：报文长度
- `checksum_error`：校验和错误标志

### Deparser

Deparser 负责将头部重新序列化为报文。使用 `packet_out` 和 `emit()`：

```cpp
control MyDeparser(packet_out packet, in headers hdr) {
    apply {
        packet.emit(hdr.ethernet);
        packet.emit(hdr.ipv4);
    }
}
```

`emit()` 仅在头部 `isValid()` 为 true 时才会序列化该头部。

### V1Switch 主程序

最后，将所有组件组装为 `V1Switch`：

```cpp
V1Switch(
    MyParser(),
    MyVerifyChecksum(),
    MyIngress(),
    MyEgress(),
    MyComputeChecksum(),
    MyDeparser()
) main;
```

## P4 工具链与 P4Runtime

### 软件工具链

P4 生态的核心开源工具包括：

| 工具 | 作用 |
| ---- | ---- |
| **p4c** | 参考编译器，将 P4 程序编译为目标文件 |
| **BMv2 (Behavioral Model v2)** | 软件交换机，支持 `simple_switch` / `simple_switch_grpc` 目标 |
| **Mininet** | 轻量级网络仿真环境，用于搭建测试拓扑 |
| **P4Runtime** | 控制面与数据面之间的标准运行时接口 |

### 编译与运行流程

1. **编译**：`p4c-bm2-ss --p4v 16 -o test.json --p4runtime-file test.p4info test.p4`
   - 生成 `test.json`：BMv2 目标配置文件
   - 生成 `test.p4info`：P4Runtime 所需的元数据文件（Protobuf 格式）

2. **启动 BMv2**：`simple_switch_grpc --no-p4 --grpc-server-addr 0.0.0.0:50051 test.json`

3. **控制面下发规则**：通过 P4Runtime 将表项写入交换机

### P4Runtime 概述

P4Runtime 是 Google 与 Barefoot 最初贡献的**开源 API + 服务器实现**，基于：

- **Protobuf**：结构化数据序列化
- **gRPC**：基于 HTTP/2 的远程调用框架

**核心特性**：

- **程序无关**：API 不随 P4 程序改变而改变，实现现场可重构
- **目标无关**：同一份控制面代码可管理 BMv2、Tofino ASIC、FPGA 等不同目标
- **支持主从仲裁（Mastership Arbitration）**：多控制器场景下的角色与选举 ID 机制

**P4Runtime 关键消息**：

- `SetForwardingPipelineConfig`：向交换机下发 P4 程序配置
- `Write` / `Read`：读写表项、计数器、寄存器等实体
- `StreamChannel`：双向流，支持 Packet-In / Packet-Out 和主从仲裁

**P4Info 文件**：编译器生成的目标无关元数据，包含表 ID、字段 ID、动作 ID 等，使控制面无需重新编译即可适配新 P4 程序。

## 高级特性与应用场景

### 1. 源路由（Source Routing）

利用 P4 的**头部栈（Header Stack）** 实现源路由。报文头部携带路径栈，每个交换机弹出栈顶并据此转发：

```cpp
#define MAX_HOPS 9
header srcRoute_t {
    bit<1>  bos;      // bottom of stack
    bit<15> port;
}

struct headers {
    ethernet_t              ethernet;
    srcRoute_t[MAX_HOPS]  srcRoutes;
    ipv4_t                ipv4;
}
```

在 Parser 中循环提取 `srcRoutes.next`，直到 `bos == 1`；在 Ingress 中根据 `srcRoutes[0].port` 设置 `egress_spec`，然后 `srcRoutes.pop_front(1)`。

### 2. 简单负载均衡（ECMP-like）

使用 V1Model 内置的 `hash` extern 实现等价多路径：

```cpp
extern void hash<O, T, D, M>(out O result,
                             in HashAlgorithm algo,
                             in T base,
                             in D data,
                             in M max);

// 在 control 中：
hash(meta.ecmp_select, HashAlgorithm.crc16, (bit<16>)0,
     { hdr.ipv4.srcAddr, hdr.ipv4.dstAddr, hdr.ipv4.protocol, meta.l4_src, meta.l4_dst },
     (bit<16>)MAX_ECMP);
```

根据哈希结果选择下一跳，实现细粒度的流量分担。

### 3. 带内网络遥测（INT / Multi-Route Inspection）

在数据面直接嵌入遥测信息，让**报文携带自己的日志**。每个交换机将队列深度、交换机 ID、时间戳等写入自定义头部栈：

```cpp
header switch_t {
    switchID_t swid;
    qdepth_t   qdepth;
}

struct headers {
    ethernet_t          ethernet;
    ipv4_t              ipv4;
    ipv4_option_t       ipv4_option;
    mri_t               mri;         // 记录交换机数量
    switch_t[MAX_HOPS]  swtraces;    // 逐跳遥测栈
}
```

相比传统端侧拥塞检测（RTT、丢包、重复 ACK），INT 让交换机直接暴露内部状态，实现毫秒级故障定位。

### 4. 其他典型应用

- **SilkRoad**：基于交换机的有状态四层负载均衡（SIGCOMM 2017）
- **NDP**：低延迟数据中心拥塞控制（SIGCOMM 2017）
- **NetCache**：网内快速键值缓存（SOSP 2017）
- **NetPaxos**：网内共识加速（SIGCOMM 2015）

## 参考资料

- [P4 Tutorials](https://github.com/p4lang/tutorials)
- [P4 Language Specification](https://p4.org/specs/)
- [P4Runtime Specification](https://p4.org/p4-spec/p4runtime-spec/)
- [BMv2 / p4c GitHub](https://github.com/p4lang/)
