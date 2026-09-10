---
title: 'VeriNC'
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

## 研究背景

### INC 的优势

可编程交换机（Barefoot Tofino、Cisco Silicon One、Broadcom Trident、Juniper Trio、Huawei NetEngine）使在数据转发过程中直接执行计算成为可能。

**INC 优势**：提升网络利用率、降低延迟至亚 RTT、节省链路带宽、维持高吞吐量。

### INC 的挑战

**核心问题**：INC 破坏传统网络透明性，开发者必须显式处理网络异常。

**两大本质困难**：

| 困难 | 说明 |
| ---- | ---- |
| **网络不可靠性导致计算错误** | TCP 可靠性仅保证端点之间，不延伸到交换机。交换机仍可能观察到丢包、重复、乱序，导致状态不一致、数据丢失、系统无法终止 |
| **交换机可编程性受限** | 无循环、每流水线阶段仅能单次读写内存、数据平面不支持可靠通信。异常发生时，交换机可能缺乏必要的状态信息或逻辑处理能力 |

---

## VeriNC 设计与实现

### 系统架构

```text
┌──────────┐     Specification      ┌──────────┐
│          │ ─────────────────────> │          │
│ Developer│                        │ Compiler │
│          │ <───────────────────── │          │
└──────────┘     Violation Trace    └────┬─────┘
     ^                                   │
     │                                   │ Specification
     │                                   ▼
     │                              ┌──────────┐
     │                              │  Model   │
     │                              │ Checker  │
     │                              └────┬─────┘
     │                                   │ Violation
     │                                   ▼
     │                              ┌──────────┐
     └──────────────────────────────│ Reporter │
                                    └──────────┘
```

**四大组件**：

1. **Specification Language**：高层抽象，包含网络拓扑、传输原语
2. **Compiler**：编译为 TLA+ 状态转换表示
3. **Model Checker**：TLA+ 状态空间探索
4. **Reporter**：违规轨迹翻译回网络级抽象

### 抽象模型

**节点（Node）**：对应一台机器，含多个线程（应用、接收、重传等），线程通过私有变量同步。

**线程执行**：并发交错执行，可在任意时刻中断切换。支持 `wait(condition)` 阻塞、`exit()` 终止节点。

**网络模型**：节点通过链路连接，包发送后立即到下一跳（交错执行模拟延迟），超时任意时刻触发。

**三种网络环境**：

| 环境 | 特性 |
| ---- | ---- |
| Reliable | 所有包按序到达 |
| Lossy | 包可能丢失 |
| Out-of-order | 后发送的包可能先到达 |

### 优化策略

| 优化 | 原理 | 效果 |
| ---- | ---- | ---- |
| **输入空间缩减** | INC 应用处理逻辑独立对象，交换机每对象仅极少状态变量，短请求序列即可暴露不一致 | 显著减少状态空间 |
| **对称状态消除** | 同类型节点行为相同，若新状态的置换已被探索则丢弃 | 验证时间 -88.1%，不同状态数 -95.5% |
| **网络非确定性约束** | 少量非确定性即可暴露风险，通过 `MAX_LOSS`、`MAX_OUT_OF_ORDER`、`DUPLICATION` 限制 | 状态空间可控 |

---

## 规范语言用法

### 文件结构（4 个 Section）

```c
Spec ::= Section*
Section ::= "configuration" "{" Config* "}"
          | "topology" "{" Topology* "}"
          | "protocol" "{" Protocol* "}"
          | "property" "{" Property* "}"
```

### Configuration

```c
Config ::= Assign ";"
Assign ::= IDENT ("[" Comma<Exp> "]")* "=" Exp
```

| 配置项 | 含义 | 示例 |
| ------ | ---- | ---- |
| `MAX_LOSS` | 最大丢包数 | `0`, `1`, `2` |
| `MAX_OUT_OF_ORDER` | 最大乱序包数 | `0`, `1` |
| `DUPLICATION` | 是否允许重复 | `0`, `1` |
| `TERMINATION_CHECK` | 是否检查终止性 | `0`, `1` |
| `CLIENT_NUM` | 客户端数量 | `3` |
| `REQ_NUM` | 每个客户端请求数 | `5` |

```sql
configuration {
    MAX_LOSS = 0; MAX_OUT_OF_ORDER = 0; DUPLICATION = 0;
    TERMINATION_CHECK = 1; CLIENT_NUM = 3; REQ_NUM = 5;
}
```

### Topology

```c
Topology ::= "nodetype" Comma<Type> ";"
           | "node" "(" Type ")" Comma<IDENT ("=" Exp)?> ";"
           | "link" "(" ("reliable" | "unreliable") ")" Comma<IDENT> ("--" Comma<IDENT>)* ";"
           | "route" "(" Comma<IDENT> ")" "{" RouteEntry* "}"
RouteEntry ::= Comma<IDENT> ":" IDENT ";"
```

**关键规则**：

- `--` 表示**全连接**：`a, b -- c, d` 建立 a-c, a-d, b-c, b-d
- 链路类型：`link(reliable)` 或 `link(unreliable)`
- 节点可附初始值：`node(Client) c1, c2 = some_value;`

```sql
topology {
    nodetype Client, Switch, Controller, Server;
    node(Client) c1, c2, c3;
    node(Switch) sw;
    node(Controller) ctrl;
    node(Server) s;
    link(reliable) c1, c2, c3 -- sw -- ctrl, s;
    link(reliable) ctrl -- s;
    route(c1, c2, c3) { s: sw; }
    route(s) { c1, c2, c3, sw: sw; ctrl: ctrl; }
}
```

![图 1：示例拓扑](01-topology.png)

### Protocol

```c
Protocol ::= ("var" | "const") "(" (Type | "all") ")" Comma<Assign | Choice> ";"
           | "fn" IDENT "(" Comma<IDENT> ")" "=" Exp ";"
           | "macro" IDENT "(" Comma<IDENT>? ")" "{" Stmt+ "}"
           | "thread" "(" Type ")" IDENT "{" Stmt+ "}"
```

**变量声明**：

| 声明 | 作用域 | 示例 |
| ---- | ------ | ---- |
| `var(Type) x = ...;` | 该类型所有节点 | `var(Client) base = 1;` |
| `const(Type) x = ...;` | 该类型所有节点（常量） | `const(all) MAX = 10;` |
| `var(all) x = ...;` | 全局（所有节点可见） | `var(all) counter = 0;` |

**线程定义**：`thread(Type) ThreadName { Stmt+ }`

线程**并发交错执行**，在**断点**处可切换。

**语句**：

```c
Stmt ::= Breakpoint ":"
       | Comma<Assign> ";"          // 赋值
       | ";"                        // 空语句
       | PrimCall ";"               // 原语调用
       | IDENT "(" Comma<Exp>? ")" ";"  // 宏调用
       | "temp" Comma<Assign | Choice> ";"  // 临时变量
       | "if" "(" Exp ")" "{" Stmt* "}" ("elif" ...)* ("else" ...)?
       | "while" "(" Exp ")" "{" Stmt* "}"
```

**断点规则**：

**强制断点**（线程切换只能发生于此）：

- `send`, `unicast`, `multicast`, `receive`
- `wait`, `exit`, `assert`

**自定义断点**：任意 `IDENT ":"`

**关键约束**：相邻断点间，**每个变量最多修改一次**。`temp` 变量不受限。

**原语**：

| 原语 | 用法 | 说明 |
| ---- | ---- | ---- |
| `send(pkt)` | `send(request);` | 单播到下一跳 |
| `unicast(pkt, dst)` | `unicast(pkt, next);` | 指定目的地单播 |
| `multicast(pkt, set)` | `multicast(pkt, {c1, c2});` | 复制到多目的地 |
| `receive()` | `temp pkt = receive();` | 阻塞接收 |
| `wait(cond)` | `wait(buffer != empty);` | 阻塞等待 |
| `exit()` | `exit();` | 终止当前节点所有线程 |
| `assert(expr, msg)` | `assert(x > 0, "msg");` | FOL 属性验证 |

**临时变量（temp）**：

- 作用域：仅在**相邻两个断点之间**
- **不属于系统状态**，不增加状态空间

```sql
temp acquire_request = {type: ACQUIRE, client: self};
send(acquire_request);
```

**表达式**：

```c
Exp ::= "forall" IDENT "in" Exp ":" Exp
      | "exists" IDENT "in" Exp ":" Exp
      | "let" IDENT "=" Exp "in" Exp
      | Exp BinaryOp Exp
      | UnaryOp Exp
      | "(" Exp ")"
      | Func "(" Comma<Exp> ")"
      | PrimCall
      | IDENT ("[" Comma<Exp> "]")?   // 字典访问
      | LiteralValue
      | "self"                        // 当前节点
```

**包（Packet）**：字典结构。

```sql
// 构造
temp request = {type: READ, key: "k1", value: null};

// 访问
if (pkt.type == GRANT) {
    temp val = pkt.value;
}
```

**线程实例**（锁操作）：

```sql
thread(Client) LockOp {
Acquire:
    temp acquire_request = {type: ACQUIRE, mode: EXCLUSIVE, client: self};
    send(acquire_request);
    
Release:
    temp pkt = receive();
    assert(pkt.type == GRANT, "unexpected packet type");
    temp release_request = {type: RELEASE, client: self};
    send(release_request);
    
End:
    temp pkt = receive();
    assert(pkt.type == ACK_OF_RELEASE, "unexpected packet type");
    exit();
}
```

执行流程：

1. `Acquire` 断点 -> 发送获取请求
2. 阻塞在 `receive()` 等待授权
3. 收到授权，验证，进入 `Release` 断点 -> 发送释放请求
4. 阻塞等待 ACK
5. 收到 ACK，验证 -> `exit()` 终止

### Property

```c
Property ::= IDENT "=" Ctl ";"
Ctl ::= Exp | "[]" Exp | "<>" Exp
```

| 算子 | 含义 | 示例 |
| ---- | ---- | ---- |
| `[]P` | 总是 P（Globally） | `[]NoDeadlock` |
| `<>P` | 最终 P（Eventually） | `<>(active_nodes == {})` |

```sql
property {
    Termination = <>(active_nodes == {});
    LockExclusion = [](forall c1 in Clients, c2 in Clients:
        (c1 != c2 && holds[c1] == EXCLUSIVE) => holds[c2] == NONE);
}
```

---

## 完整实例：NetCache

```sql
configuration {
    MAX_LOSS = 0; MAX_OUT_OF_ORDER = 0; DUPLICATION = 0;
    TERMINATION_CHECK = 1; CLIENT_NUM = 3; REQ_NUM = 5;
}

topology {
    nodetype Client, Switch, Controller, Server;
    node(Client) c1, c2, c3;
    node(Switch) sw;
    node(Controller) ctrl;
    node(Server) s;
    link(reliable) c1, c2, c3 -- sw -- ctrl, s;
    link(reliable) ctrl -- s;
    route(c1, c2, c3) { s: sw; }
    route(s) { c1, c2, c3, sw: sw; ctrl: ctrl; }
}

protocol {
    var(Client) base = 1, requests = {1,2,3,4,5}, replies = {};
    var(Switch) cached = 0, valid = 0, value = null;
    var(Server) store = {k1: V0};

    thread(Client) ClientApp {
    Start:
        temp req = choose(requests);
        if (req == null) { exit(); }
        temp pkt = {type: WRITE, key: "k1", value: req};
        send(pkt);
    WaitReply:
        temp reply = receive();
        assert(reply.client == self, "wrong client");
        replies = replies union {reply};
        goto Start;
    }

    thread(Switch) SwitchRecv {
    Loop:
        temp pkt = receive();
        if (pkt.type == READ) {
            if (valid == 1) {
                temp reply = {type: REPLY, key: pkt.key, value: value, client: pkt.client};
                send(reply);
            } else {
                send(pkt);
            }
        } elif (pkt.type == WRITE) {
            if (valid == 1) { valid = 0; }
            send(pkt);
        } elif (pkt.type == UPD) {
            value = pkt.value; valid = 1;
            temp ack = {type: ACK_UPD, key: pkt.key};
            send(ack);
        }
        goto Loop;
    }
}
```

---

## 验证结果

| 系统 | 网络环境 | 违规属性 | 根因 |
| ---- | -------- | -------- | ---- |
| SwitchML | 乱序 | 计算正确性 | 乱序破坏"已完成请求不会重现"假设 |
| ATP | 乱序 | 内存泄漏 | 聚合完成后原始请求到达，永久占用聚合器 |
| NetReduce | 丢包 | 终止性 | CLT 更新导致先前消息聚合无法完成 |
| NetCache | 丢包 | 缓存一致性 | 更新包丢失 + 事件交错 |
| NetCache | 丢包 | 终止性 | 写操作期间缓存驱逐 |
| FarReach | 可靠 | 缓存一致性 | 准入与在途回复竞争 |
| NetLock | 延迟 | 锁互斥 | 重传释放请求导致多出队 |
| FISSLOCK | 延迟 | 锁互斥 | 延迟获取触发释放+重获取 |

---

## 快速参考

| 需求 | 写法 |
| ---- | ---- |
| 可靠网络 | `MAX_LOSS = 0; MAX_OUT_OF_ORDER = 0;` |
| 丢包网络 | `MAX_LOSS = 1;` |
| 乱序网络 | `MAX_OUT_OF_ORDER = 1;` |
| 全连接 | `a, b -- c, d;` |
| 节点变量 | `var(Type) x = init;` |
| 全局常量 | `const(all) MAX = 100;` |
| 阻塞接收 | `temp pkt = receive();` |
| 条件等待 | `wait(condition);` |
| 内联断言 | `assert(expr, "msg");` |
| 终止性 | `<>(active_nodes == {})` |
| 安全属性 | `[]Invariant` |

---

## 常见错误

| 错误 | 原因 | 修复 |
| ---- | ---- | ---- |
| 编译报错：变量多次修改 | 相邻断点间修改同一变量超过一次 | 插入中间断点或拆分步骤 |
| 状态空间爆炸 | 请求数过多、非确定性过大 | 减少 `REQ_NUM`，限制 `MAX_LOSS` |
| 验证不终止 | 活锁或无限重传 | 检查重传上限，确认终止性属性 |
| 误报违规 | 网络环境配置过于严苛 | 根据实际部署环境调整参数 |
