---
title: '环境配置'
excerpt: '计算机网络 Lab 环境配置'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计网'
- 'network'
pubDate: 'March 01 2026'

# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 1. 下载 iso

阿里的链接似乎失效了，可以去[清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/ubuntu-releases/22.04/)进行下载。

## 2. 新建 VM

记得在 ISO 映像文件中选取你下载的 ISO 文件并取消选择无人值守安装，进入手动安装环节。虚拟硬件（核心数、内存大小）后续都可以调整，不过为了与测试环境保持一致，还是直接按照文档来吧。EFI 不必勾选。

虚拟硬盘选取 VDI，勾选预先分配全部空间则会直接占用对应内存，读写性能更好。不过还是动态内存分配吧，毕竟没那么大容量。。。

在启动虚拟机前，先完成网卡的配置。如果显示网卡未找到那么可以在网络中选择新建网卡。可以查看网络中的网卡，如果启用 DHCP 服务器则是自动配置 IPv4 地址。也可以选用手动配置，这样后续会有所不同。建议启用自动配置，并且网卡上显示的 IPv4 网络掩码就是后续宿主机登录虚拟机所需的 IP。

## 3. 手动安装

启动虚拟机进行手动安装。

依次选择
- English
- Continue without updating
- English (US) 不用管 Identify keyboard，直接 Done (当然你也可以测试一下)
- Ubuntu Server (minimized) 或者 Ubuntu Server，前者更轻量化
- 网卡，选 Done，注意如果手动配置了网卡，则第二个 Server-Only 的网卡会显示 `DHCPv4 -`，这是因为你没有开启 DHCP 功能。
- 接下来全部选 Done 和 Continue，并勾选 SSH 安装
- 注意 Docker 似乎在新版不能直接安装了，后续手动安装即可

## 4. 显示

由于直接显示 server 不太友好，我们可以利用 Jupyter/ VSCode/ VIM 显示虚拟机。笨人使用 VSCode 进行配置。首先产生 ssh 密钥

```bash
ssh-keygen -t rsa -b 4096 -C "your_statement"
```

将 .pub 公钥拷贝到虚拟机的 ~/.ssh/quthorized_keys 中

```bash
echo "your_pub_ssh_key" >> ~/.ssh/authorized_keys
```

然后配置你的 ssh 文件

```bash
Host your_host_name
  HostName your_host_only_ip
  User your_user_name
  IdentityFile your_ssh_key_file
```

然后就可以在虚拟机启动的情况下直接在 VSCode 中连接啦！

```bash
ssh your_host_name
```

## 5. 进阶

由于需要先启动虚拟机，如果先打开 Oracle VB 图形化界面太麻烦了，可以先找到 `VBoxManage.exe` 文件，并将其父目录放入环境变量。然后就可以直接在 VSCode 中启动和关闭虚拟机啦~

```bash
# 检查命令
VBoxManage --version
# 查看所有虚拟机
VBoxManage list vms
# 查看正在运行的虚拟机
VBoxManage list runningvms
# 启动虚拟机（无界面模式，最常用）
VBoxManage startvm "vm_name" --type headless
# 启动虚拟机（带图形界面）
VBoxManage startvm "vm_name" --type gui
# 正常关机（模拟按下电源按钮，推荐）
VBoxManage controlvm "vm_name" acpipowerbutton
# 强制关机（相当于拔电源，不推荐，除非死机）
VBoxManage controlvm "vm_name" poweroff
# 保存状态（相当于休眠，下次启动直接恢复）
VBoxManage controlvm "vm_name" savestate
```

当然如果你嫌麻烦也可以再写一些 bat 脚本。