---
title: 'Lab1'
excerpt: '计算机网络 Lab1'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'network'
- '计算机网络'
pubDate: 'March 03 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

#PermitRootLogin prohibit-password
PermitRootLogin yes

## Scapy

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