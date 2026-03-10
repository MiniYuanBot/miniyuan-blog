---
title: '计算机网络 Lab1 协议分析'
excerpt: '26 春 计算机网络 Lab1 使用 Scapy 进行简单的协议分析'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'network'
- '计算机网络'
- '计网'
pubDate: 'March 03 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 一、环境配置

由于习惯使用 VS Code，为了避免不必要的麻烦，可以直接使用 root 登录虚拟机（当然你也可以 `su -`）。修改 `/etc/ssh/sshd_config` 中该行：

```txt
# 禁止远程使用密码登录 root
# PermitRootLogin prohibit-password
# 允许远程使用密码登录 root
PermitRootLogin yes
```

并把宿主机 ssh 配置修改为 root 用户即可。

## 二、基础知识 Scapy

Scapy 是一个用 Python 编写的、能够操作数据包的强大程序。它既可以作为交互式工具使用，也可以作为库导入到你的 Python 代码中。它让你能够发送（send）、嗅探（sniff）、解析（parse）和伪造（forge）网络数据包。

## tutorial.ipynb

1. 打开方式
最好选用 jupyter 打开，避免代码运行时 root 权限获取问题。运行

```bash
jupyter lab --allow-root --no-browser --ip=0.0.0.0 --port=10000 --NotebookApp.token='' --NotebookApp.password=''
```
2. 
由于之前已经下载了 pip 等，所以可以直接选用 python 的 global env。当然你也可以为该 lab 配置专属的 python 环境。

注意要 su 下运行

如果无法执行 `p1.pdfdump('pkt.pdf')`，需要先在此之前，在 jupyter 中先运行

```bash
pip install pyx
```

将 pyx 装入 ipy 内核

```bash
chmod 755 ./lab.py
```

改变文件权限

---

## 二、网络基础概念复习

### 2.1 TCP/IP 协议体系结构模型

TCP/IP 协议栈将网络通信划分为四个层次：

| TCP/IP层 | 功能描述 | 对应OSI层 | 协议示例 |
|----------|----------|----------|----------|
| **应用层** | 用户可直接使用的网络服务 | 5/6/7层（会话、表示、应用） | HTTP, DNS, FTP, NFS, SMTP |
| **传输层** | 端到端通信，数据分段与重组 | 4层（传输） | **TCP**, **UDP**, SCTP |
| **网络层** | 路由与寻址，数据包转发 | 3层（网络） | **IP**, ICMP, ARP |
| **网络接口层**| 物理介质访问，帧传输 | 1/2层（物理、数据链路） | **Ether**, PPP, 802.11 |

**注**：数据从应用层向下传递时，每一层都会**添加自己的头部信息**（封装），接收方则逐层解析。当然有时也会有尾部。

### 2.2 第二层（数据链路层）：Ether 协议

以太网是目前最普及的 LAN 技术。按照以太网协议，其帧（Ethernet Frame）结构如下：

```
┌───────────────┬───────────────┬───────────────┬───────────────────┬───────────────┐
│ Dest MAC (6B) │ Src MAC (6B)  │ EtherType(2B) │ payload(46-1500B) │   FCS (4B)    │
└───────────────┴───────────────┴───────────────┴───────────────────┴───────────────┘
```

其中：
- **MAC地址**：48位（6字节），如 `00:11:22:33:44:55`。每个网卡拥有全球唯一的MAC地址。
- **类型字段（EtherType）**：指示上层协议，常见值：
  - `0x0800`：IPv4
  - `0x0806`：ARP
  - `0x86DD`：IPv6
- **payload**：由于帧最少 64B，故 payload 最少 46B，不足的会添加 padding
- **FCS（帧校验序列）**：用于检测传输错误，但 Scapy 通常不捕获此字段。

### 2.3 第三层（网络层）：IPv4 协议

IP协议负责将数据包（packet/IP分组）从源主机路由到目的主机。其第 4 版 IPv4 协议规定头部结构如下[^1]：

```
0B              1B              2B              3B              4B
|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Ver  |  IHL  |Type of Service|         Total Length          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|        Identification         |Flags|     Fragment Offset     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |   Protocol    |      Header Checksum          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Destination Address                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      Options (Optional)                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

[^1]: 上述数字标注在对应比特的中部

| 字段 | 位数 | 说明 |
|:---|:---:|:---|
| **Ver** (Version) | 4位 | **版本号**。例如 IPv4 取值为 4 |
| **IHL** (Internet Header Length) | 4位 | **互联网首部长度**。实际就是 IPv4 首部长度，以 32 位（4B）为单位。最小值为 5（20B，也即无 Options），最大值为 15（60B） |
| **Type of Service** | 8位 | **服务类型**。用于 QoS（服务质量）和包优先级，现常被 DSCP（区分服务代码点）替代 |
| **Total Length** | 16位 | **总长度**。整个 IP 包的大小（首部 + 数据），以字节为单位。最大值为 65535 字节 |
| **Identification** | 16位 | **标识符**。用于分片与重组，同一原始数据包的所有分片共享相同标识符 |
| **Flags** | 3位 | **标志位**。控制分片行为：<br>• 第 0 位：保留，必须为 0<br>• 第 1 位：DF（Don't Fragment，禁止分片）<br>• 第 2 位：MF（More Fragments，后面还有分片） |
| **Fragment Offset** | 13位 | **片偏移**。当前分片在原始数据包中的位置，以 8 字节为单位，13 + 3 = 16 |
| **Time to Live** (TTL) | 8位 | **生存时间**。每经过一个路由器减 1，减到 0 时丢弃，防止无限循环 |
| **Protocol** | 8位 | **协议号**。标识上层协议：<br>• 6：TCP<br>• 17：UDP<br>• 1：ICMP<br>• 等等 |
| **Header Checksum** | 16位 | **首部校验和**。仅对首部进行错误检测，每经过一个路由器都会重新计算 |
| **Source Address** | 32位 | **源 IP 地址**。发送方的 IPv4 地址 |
| **Destination Address** | 32位 | **目的 IP 地址**。接收方的 IPv4 地址 |
| **Options** | 可变（0-40 字节） | **选项字段**。可选功能（如时间戳、路由记录等），很少使用。如有选项，需用填充位保证首部是 32 位的整数倍 |

**注**：
- **固定首部长度**：不含 Options 时为 **20 字节**
- **最大首部长度**：含 Options 时可达 **60 字节**
- **整个包最大长度**：65535 字节（但链路层通常限制为 1500 字节，超过需分片）


### 2.4 第四层（传输层）：TCP 协议

TCP 协议负责提供**可靠的、面向连接的**数据传输服务，用以传输TCP段（TCP Segment）。其段结构如下：

```
0B              1B              2B              3B              4B
|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |        Destination Port       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                  Sequence Number (SEQ)                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|               Acknowledgment Number (ACK)                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Offset | Rsrvd |     Flags     |          Window Size          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Checksum           |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

| 字段 | 位数 | 说明 |
|:---|:---:|:---|
| **Source Port** | 16位 | **源端口号**。发送方的端口号，用于标识发送应用程序 |
| **Destination Port** | 16位 | **目的端口号**。接收方的端口号，用于标识接收应用程序 |
| **Sequence Number** (SEQ) | 32位 | **序列号**。用于数据流排序：<br>• 如果是 SYN 包，表示初始序列号（ISN）<br>• 如果是数据包，表示本段数据第一个字节的序列号 |
| **Acknowledgment Number** (ACK) | 32位 | **确认号**。只有当 ACK 标志位为 1 时才有效，表示期望收到的下一个字节的序列号 |
| **Offset** | 4位 | **数据偏移**。实际就是 TCP 首部长度，以 32 位（4B）为单位。最小值为 5（20B），最大值为 15（60B） |
| **Rsrvd** (Reserved) | 4位 | **保留位**。预留将来使用，必须为 0 |
| **Flags** | 8位 | **标志位**。每个标志位占 1 位，用于控制连接状态：<br>• **CWR** (Congestion Window Reduced)：拥塞窗口减少<br>• **ECE** (ECN-Echo)：ECN 回显<br>• **URG** (Urgent)：紧急指针字段有效<br>• **ACK** (Acknowledgment)：确认号字段有效<br>• **PSH** (Push)：推送数据，接收方应尽快交给应用层<br>• **RST** (Reset)：重置连接<br>• **SYN** (Synchronize)：同步序列号，用于建立连接<br>• **FIN** (Finish)：发送方已完成数据发送 |
| **Window Size** | 16位 | **窗口大小**。用于流量控制，表示发送方愿意接收的字节数（从确认号开始） |
| **Checksum** | 16位 | **校验和**。对整个 TCP 段（首部 + 数据）进行错误检测，还包括伪首部（含源 IP、目的 IP 等） |
| **Urgent Pointer** | 16位 | **紧急指针**。只有当 URG 标志位为 1 时才有效，表示紧急数据在段中的结束位置 |

**注**：
- **TCP 固定首部长度**：不含选项时为 **20 字节**
- **TCP 最大首部长度**：含选项时可达 **60 字节**
- **伪首部**（Pseudo Header）：校验和计算时，需要 12 字节信息（源 IP、目的 IP、协议号、TCP 长度），否则校验和中不包含 IP 信息，也即接收方的传输层无法利用其确定 IP 分组是否是正确传给自己的。但是为了职责分离，传输层不应直接操作 IP，故而向网络层索要服务，网络层给予它一个伪首部用于临时计算，并不传输。

```
0B              1B              2B              3B              4B
|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|0 1 2 3 4 5 6 7|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source IP Address                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Destination IP Address                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Padding Zero  |   Protocol    |          TCP Length           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

- **标志位**位于TCP头部的第14个字节，共8位：

| 标志 | 名称 | 含义 |
|------|------|------|
| **SYN** | 同步标志 | 请求建立连接 |
| **ACK** | 确认标志 | 确认号有效 |
| **FIN** | 结束标志 | 请求断开连接 |
| **RST** | 重置标志 | 连接异常中断 |
| **PSH** | 推送标志 | 接收方应尽快交给应用层 |
| **URG** | 紧急标志 | 紧急指针有效 |

**Scapy中标志位的表示**：
- 数值表示：`SYN=0x02`, `ACK=0x10`, `SYN+ACK=0x12`
- 字符串表示：`'S'`(SYN), `'A'`(ACK), `'SA'`(SYN+ACK)

### 2.5 TCP 三次握手

TCP建立连接需要三次握手。

```
【第一次握手】客户端 → 服务器
    客户端发送：SYN=1, Seq=x
    含义：客户端请求建立连接，初始序列号为x
    状态：客户端进入 SYN_SENT 状态

【第二次握手】服务器 → 客户端  ← Q3要找的包
    服务器发送：SYN=1, ACK=1, Seq=y, Ack=x+1
    含义：服务器同意建立连接，确认收到客户端的SYN
    状态：服务器进入 SYN_RCVD 状态

【第三次握手】客户端 → 服务器
    客户端发送：ACK=1, Seq=x+1, Ack=y+1
    含义：客户端确认收到服务器的SYN+ACK
    状态：双方进入 ESTABLISHED 状态，连接建立成功
```

### 2.6 TCP 四元组与流的概念

一个TCP流由以下四个元素唯一标识，称为**四元组**：

```
(源IP地址, 目的IP地址, 源端口, 目的端口)
```

**注**：通信是双向的，同一个流有两个方向的包。以下就是同一个流。

```
客户端 → 服务器： (192.168.1.2, 192.168.1.1, 54321, 80)
服务器 → 客户端： (192.168.1.1, 192.168.1.2, 80, 54321)
```

---

## 三、Scapy 中的 Packet数据结构

### 2.1 Scapy的包模型：多层协议的叠加

在Scapy中，一个网络包是由多个协议层**叠加**而成的：

```python
from scapy.all import *

# 创建一个HTTP请求包（从以太网到应用层）
packet = Ether()/IP(dst="192.168.1.1")/TCP(dport=80)/Raw(load="GET / HTTP/1.1\r\n\r\n")

# 可视化层次：
# └── Ether      (数据链路层)
#     └── IP      (网络层)
#         └── TCP (传输层)
#             └── Raw (应用层数据)
```

### 2.2 Packet的核心属性

| 属性名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `.name` | str | 协议名称 | `'Ethernet'`, `'IP'`, `'TCP'` |
| **`.time`** | **float** | **包的时间戳（实验Q3）** | `1645234567.123456` |
| **`.len`** | **int** | **包的总长度（实验Q7）** | `1518` |
| `.payload` | Packet | 下一层协议数据[^2] | `pkt.payload` |
| `.underlayer` | Packet | 上一层协议数据 | `pkt.underlayer` |
| `.src` | str | 源地址[^3] | 因层而异 |
| `.dst` | str | 目的地址 | 因层而异 |

[^2]: 协议数据指 head + payload
[^3]: 包含 MAC 地址、IP 地址、端口号

### 2.3 Packet的核心方法

#### 2.3.1 查看包信息

```python
# 1. 带格式的详细输出（调试利器）
pkt.show()
"""
###[ Ethernet ]### 
  dst= ff:ff:ff:ff:ff:ff
  src= 00:11:22:33:44:55
  type= 0x800
###[ IP ]### 
  src= 192.168.1.1
  dst= 192.168.1.2
###[ TCP ]### 
  sport= 20
  dport= 80
  flags= S
"""
```

```python
# 2. 一行摘要
pkt.summary()  
# 输出: 'Ether / IP / TCP 192.168.1.1:20 > 192.168.1.2:80 S'
```

```python
# 3. 十六进制查看
pkt.hexdump()
# 输出原始字节的十六进制和ASCII表示
```

#### 2.3.2 检查协议层

```python
# 方法1：haslayer()
pkt.haslayer(IP)    # True - 检查是否包含IP层
pkt.haslayer(TCP)   # True
pkt.haslayer(UDP)   # False

# 方法2：in操作符[更简洁]
IP in pkt           # True
TCP in pkt          # True
```

#### 2.3.3 获取特定协议层

```python
# 方法1：getlayer()
pkt.getlayer(IP)    # 返回IP层对象

# 方法2：索引语法[更简洁]
pkt[IP]             # 获取IP层
pkt[TCP]            # 获取TCP层
pkt[Ether]          # 获取以太网层

# 按层索引获取
pkt[0]              # 第一层（通常是Ether）
pkt[1]              # 第二层（通常是IP）
pkt[2]              # 第三层（通常是TCP）
```

#### 2.3.4 获取多层信息

```python
# 获取所有层
layers = pkt.layers()  # 返回层类型列表

# 获取最后一层
last = pkt.lastlayer()

# 遍历所有层
for layer in pkt:
    print(layer.name)
```

#### 2.3.5 复制和修改

```python
# 深拷贝
pkt2 = pkt.copy()

# 修改字段
pkt2[IP].src = "10.0.0.1"  # 修改源IP
```

### 2.4 各层协议字段访问大全

#### **Ether层（数据链路层）**

```python
# 前提：Ether in pkt
pkt[Ether].src      # 源MAC地址 (字符串)
pkt[Ether].dst      # 目的MAC地址 (字符串)
pkt[Ether].type     # 上层协议类型 (整数)
# 常用type: 0x0800=IP, 0x0806=ARP
```

#### **IP层（网络层）**

```python
# 前提：IP in pkt
pkt[IP].src         # 源IP地址 (字符串)
pkt[IP].dst         # 目的IP地址 (字符串)
pkt[IP].proto       # 上层协议 (整数)
# 常用proto: 6=TCP, 17=UDP, 1=ICMP

pkt[IP].len         # IP总长度 (首部+数据)
pkt[IP].ihl         # IP首部长度 (4字节为单位)
pkt[IP].ttl         # 生存时间
```

#### **TCP层（传输层）**

```python
# 前提：TCP in pkt
pkt[TCP].sport      # 源端口 (整数)
pkt[TCP].dport      # 目的端口 (整数)
pkt[TCP].seq        # 序列号 (整数)
pkt[TCP].ack        # 确认号 (整数)
pkt[TCP].flags      # 标志位

# flags标志位的多种检查方式
pkt[TCP].flags == 0x02        # 只包含SYN
pkt[TCP].flags == 'S'         # Scapy的符号表示
'S' in pkt[TCP].flags         # 检查是否有SYN标志

# 常用flags值：
# 0x02 = 'S'  (SYN)
# 0x10 = 'A'  (ACK)
# 0x12 = 'SA' (SYN+ACK)
# 0x11 = 'FA' (FIN+ACK)
```

#### **UDP层（传输层）**

```python
# 前提：UDP in pkt
pkt[UDP].sport      # 源端口
pkt[UDP].dport      # 目的端口
pkt[UDP].len        # UDP长度
```

#### **Raw层（应用层数据）**

```python
# 前提：Raw in pkt
pkt[Raw].load       # 原始载荷数据 (bytes)
# HTTP请求内容（如"GET / HTTP/1.1"）就在这里
```

### 2.5 常用辅助函数

#### 2.5.1 嗅探函数[^4]

```python
# 抓取5秒的包
pkts = sniff(timeout=5)           # 抓5秒

# 抓取指定数量的包
pkts = sniff(count=10)             # 抓10个包

# 带过滤条件的抓包
pkts = sniff(filter="tcp port 80", timeout=5)  # 只抓HTTP流量
```

[^4]: 这里的包实际上是指数据链路层的 Frame

**BPF过滤语法示例**：
- `"tcp"`：只抓TCP包
- `"udp"`：只抓UDP包
- `"port 80"`：端口为80
- `"host 192.168.1.1"`：主机为192.168.1.1
- `"tcp and port 80"`：TCP且端口80

#### 2.5.2 读写文件

```python
# 读取pcap文件
pkts = rdpcap("http.cap")

# 写入pcap文件
wrpcap("output.cap", pkts)

# 查看文件中的包数量
count = len(pkts)
```

#### 2.5.3 包列表操作

```python
# 索引访问
first_pkt = pkts[0]      # 第一个包
second_pkt = pkts[1]     
last_pkt = pkts[-1]       # 最后一个包

# 切片
subset = pkts[5:10]       # 第6-10个包

# 遍历
for pkt in pkts:
    # 处理每个包
    pass
```

#### 2.5.4 过滤包

```python
# 方法1：列表推导式（最灵活）
http_pkts = [p for p in pkts if TCP in p and p[TCP].dport == 80]

# 方法2：filter函数
http_pkts = list(filter(lambda p: TCP in p and p[TCP].dport == 80, pkts))
```

### 2.6 遍历数据包的每一层（调试用）

```python
def explore_packet(pkt):
    """遍历包的每一层，打印字段信息"""
    print(f"\n=== 包摘要: {pkt.summary()} ===")
    
    layer_num = 0
    layer = pkt
    
    while layer:
        print(f"\n--- 第{layer_num}层: {layer.name} ---")
        
        # 获取该层的所有字段
        if hasattr(layer, 'fields_desc'):
            for field in layer.fields_desc:
                field_name = field.name
                field_value = layer.getfieldval(field_name)
                print(f"  {field_name}: {field_value}")
        
        # 进入下一层
        layer = layer.payload
        layer_num += 1

# 使用示例
explore_packet(pkt)
```

### 2.7 调试技巧

```python
# 调试打印函数
def debug_packet(pkt, msg=""):
    print(f"\n=== {msg} ===")
    print(f"时间戳: {pkt.time}")
    print(f"摘要: {pkt.summary()}")
    
    if IP in pkt:
        print(f"IP: {pkt[IP].src} -> {pkt[IP].dst}")
    
    if TCP in pkt:
        print(f"TCP: {pkt[TCP].sport} -> {pkt[TCP].dport}")
        print(f"标志位: {pkt[TCP].flags} (数值: {ord(pkt[TCP].flags) if isinstance(pkt[TCP].flags, str) else pkt[TCP].flags})")
    
    print("="*40)
```

---

## 第三部分：实验任务与Scapy实现详解

### Q1：持续抓包5秒，保存为http.cap

```python
from scapy.all import *

Trace1 = "http.cap"

def MySniff():
    """
    抓包5秒，保存到http.cap
    """
    # 抓包5秒
    packets = sniff(timeout=5)
    
    # 保存到文件
    wrpcap(Trace1, packets)
    
    return len(packets)  # 返回抓到的包数量（用于验证）
```

**关键点**：
- `sniff(timeout=5)` 抓取5秒，自动停止
- `wrpcap()` 保存为pcap格式

### Q2：找到第一个目的端口为80的TCP分组，返回源MAC和目的MAC

```python
def Q2():
    """
    在http.cap中寻找第一个目的端口为80的TCP分组，
    返回源MAC地址和目的MAC地址（格式为字符串）
    """
    # 读取文件
    packets = rdpcap(Trace1)
    
    # 遍历所有包
    for pkt in packets:
        # 检查是否包含TCP层且目的端口为80
        if TCP in pkt and pkt[TCP].dport == 80:
            # 返回源MAC和目的MAC，用逗号分隔
            return f"{pkt[Ether].src},{pkt[Ether].dst}"
    
    # 没找到返回空
    return None
```

**关键点**：
- `rdpcap()` 读取pcap文件
- `TCP in pkt` 检查是否有TCP层
- `pkt[TCP].dport == 80` 目的端口为80
- `pkt[Ether].src` 和 `pkt[Ether].dst` 获取MAC地址

### Q3：返回Q2分组的应答分组的二层type、三层proto、时间戳

```python
def Q3():
    """
    返回Q2中的分组的应答分组（ACK分组）的：
    - 二层type字段（整数）
    - 三层proto字段（整数）
    - 报文的时间戳
    """
    # 读取文件
    packets = rdpcap(Trace1)
    
    # 先找到第一个目的端口为80的包（第一次握手SYN）
    syn_pkt = None
    syn_index = -1
    
    for i, pkt in enumerate(packets):
        if TCP in pkt and pkt[TCP].dport == 80:
            syn_pkt = pkt
            syn_index = i
            break
    
    if syn_pkt is None:
        return None
    
    # 从SYN包的下一个开始找应答包（第二次握手SYN+ACK）
    for pkt in packets[syn_index+1:]:
        # 条件是：有TCP层，源端口为80，标志位包含SYN和ACK
        if (TCP in pkt and 
            pkt[TCP].sport == 80 and 
            'S' in pkt[TCP].flags and 
            'A' in pkt[TCP].flags):
            
            # 返回(二层type, 三层proto, 时间戳)
            return (pkt[Ether].type, pkt[IP].proto, pkt.time)
    
    return None
```

**关键点**：
- 理解三次握手：应答包是**第二次握手的SYN+ACK包**
- 标志位检查：`'S' in flags and 'A' in flags`
- `pkt[Ether].type`：二层类型（通常是0x0800）
- `pkt[IP].proto`：三层协议（TCP是6）
- `pkt.time`：包的时间戳

### Q4：返回记录中分组数量

```python
def Q4(trace_file):
    """
    返回记录中分组数量
    trace_file: pcap文件路径
    """
    packets = rdpcap(trace_file)
    return len(packets)
```

### Q5：返回IP分组、TCP分组、UDP分组的数量

```python
def Q5(trace_file):
    """
    返回记录中IP分组、TCP分组、UDP分组的数量
    返回值格式: (ip_count, tcp_count, udp_count)
    """
    packets = rdpcap(trace_file)
    
    ip_count = 0
    tcp_count = 0
    udp_count = 0
    
    for pkt in packets:
        # 统计IP分组（只要包含IP层）
        if IP in pkt:
            ip_count += 1
            
            # 统计TCP和UDP（包含在IP分组内）
            if TCP in pkt:
                tcp_count += 1
            elif UDP in pkt:
                udp_count += 1
    
    return (ip_count, tcp_count, udp_count)
```

**关键点**：
- `IP in pkt` 检查是否有IP层
- TCP和UDP是互斥的，所以用`elif`

### Q6：返回TCP流的数量

```python
def Q6(trace_file):
    """
    返回记录中TCP流的数量
    TCP流由四元组唯一标识，需处理双向流
    """
    packets = rdpcap(trace_file)
    
    # 使用集合存储归一化后的流标识
    tcp_flows = set()
    
    for pkt in packets:
        # 只处理同时包含IP和TCP的包
        if IP in pkt and TCP in pkt:
            # 提取四元组
            ip_src = pkt[IP].src
            ip_dst = pkt[IP].dst
            sport = pkt[TCP].sport
            dport = pkt[TCP].dport
            
            # 归一化：将双向流表示为同一个标识
            # 方法：将(源IP,源端口)和(目的IP,目的端口)排序后组成元组
            flow = tuple(sorted([(ip_src, sport), (ip_dst, dport)]))
            
            # 加入集合（自动去重）
            tcp_flows.add(flow)
    
    return len(tcp_flows)
```

**关键点**：
- 归一化方法：`tuple(sorted([(ip_src, sport), (ip_dst, dport)]))`
- 无论包的方向如何，排序后都会得到相同的元组
- 集合自动去重

### Q7：返回IP分组长度的最小值、中位数、最大值

```python
def Q7(trace_file):
    """
    返回记录中所有IP分组长度的最小值、中位数、最大值
    IP分组长度 = 整个以太网帧长度（以scapy计算为准）
    """
    packets = rdpcap(trace_file)
    
    # 收集所有IP分组的长度
    lengths = []
    
    for pkt in packets:
        if IP in pkt:
            # 直接使用len(pkt)获取整个帧的长度（scapy的计算方式）
            lengths.append(len(pkt))
    
    if not lengths:
        return (0, 0, 0)
    
    # 排序（用于计算中位数）
    lengths.sort()
    
    # 最小值
    min_len = lengths[0]
    
    # 最大值
    max_len = lengths[-1]
    
    # 中位数
    n = len(lengths)
    if n % 2 == 1:
        # 奇数个，取中间
        median_len = lengths[n // 2]
    else:
        # 偶数个，取中间两个的平均值
        median_len = (lengths[n // 2 - 1] + lengths[n // 2]) // 2
    
    return (min_len, median_len, max_len)
```

**关键点**：
- **根据题目提示**：以scapy的计算方式为准，直接使用`len(pkt)`
- 中位数计算：排序后取中间值（偶数个取平均）

---

## 附录：快速参考表

### 实验任务速查表

| 问题 | 核心功能 | 关键Scapy函数/属性 |
|------|----------|-------------------|
| Q1 | 抓包保存 | `sniff(timeout=5)`, `wrpcap()` |
| Q2 | 找第一个HTTP请求 | `rdpcap()`, `TCP in pkt`, `pkt[TCP].dport==80`, `pkt[Ether].src/dst` |
| Q3 | 找SYN+ACK应答 | `pkt[TCP].sport==80`, `'S' in flags and 'A' in flags`, `pkt.time` |
| Q4 | 总分组数 | `len(packets)` |
| Q5 | 协议统计 | `IP/TCP/UDP in pkt` |
| Q6 | TCP流数量 | 集合、四元组归一化 |
| Q7 | 长度统计 | `len(pkt)`, 列表排序与中位数 |

### 常用字段速查表

| 字段 | 访问方式 | 含义 | 实验 |
|------|----------|------|------|
| 源MAC | `pkt[Ether].src` | 源MAC地址 | Q2 |
| 目的MAC | `pkt[Ether].dst` | 目的MAC地址 | Q2 |
| 以太网类型 | `pkt[Ether].type` | 上层协议类型 | Q3 |
| 源IP | `pkt[IP].src` | 源IP地址 | Q6 |
| 目的IP | `pkt[IP].dst` | 目的IP地址 | Q6 |
| IP协议 | `pkt[IP].proto` | 上层协议（6=TCP） | Q3 |
| 源端口 | `pkt[TCP].sport` | TCP源端口 | Q2,Q3,Q6 |
| 目的端口 | `pkt[TCP].dport` | TCP目的端口 | Q2,Q3,Q6 |
| TCP标志 | `pkt[TCP].flags` | TCP标志位 | Q3 |
| 时间戳 | `pkt.time` | 包的时间戳 | Q3 |
| 包长度 | `len(pkt)` | 整个包的长度 | Q7 |
