---
title: 'CUDA 的软硬件生态'
excerpt: '26 春 并行程序设计 L44'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'GPU'
- 'CUDA'
pubDate: 'June 14 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## CUDA 版本发展历史与硬件架构演进

CUDA 自 2006 年正式推出，与 NVIDIA GPU 架构迭代紧密绑定，关键里程碑如下：

| 版本 | 时间 | 对应架构 | 核心亮点 |
| :--- | :--- | :--- | :--- |
| CUDA 1.x | 2006–2007 | G80 | 诞生 CUDA 编程模型，确立 `__global__` / `__shared__`、线程层级、`__syncthreads()`、基础原子操作，GPU 正式转向通用计算（GPGPU） |
| CUDA 2.x | 2008–2009 | GT200 | 统一虚拟内存雏形、更多标准数学库、基础纹理内存优化 |
| CUDA 3.x | 2010–2011 | Fermi (sm_2.x) | 真正的 L1 数据缓存（可读写），完善 cuBLAS / cuFFT / cuSPARSE，支持 C++ 基础语法 |
| CUDA 4.x | 2011–2012 | Kepler (sm_3.x) | 原生多 GPU 支持，推出统一虚拟内存（UVM），设备端动态并行 |
| CUDA 5.x–6.x | 2013–2014 | — | 优化编译器 nvcc、调试工具 cuda-gdb、性能分析工具，简化工程编译与部署 |
| CUDA 7.x–8.x | 2015–2016 | Pascal (sm_6.x) | 全面支持 C++11，优化 Warp 执行与指令调度，FP64 双精度大幅提速 |
| CUDA 9.x | 2017 | Volta (sm_7.0, V100) | **分水岭版本**：推出 Tensor Core（张量核心），新增 `__syncwarp()`，协作组 Cooperative Groups 支持跨 Block 全局同步 |
| CUDA 10.x | 2018 | Turing (sm_7.5, RTX 20) | CUDA Graph（合并任务降低启动开销），强化低精度推理 |
| CUDA 11.x | 2020 | Ampere (sm_8.x, A100/RTX 30) | 第三代 Tensor Core，新增 TF32 / BF16，MIG 显卡切分，全面支持 C++17，多卡互联与内存模型大幅优化，**目前工业界与集群最常用版本** |
| CUDA 12.x | 2022– | Hopper / Blackwell | 架构解耦、驱动与工具链分离，编译链路重构，强化多机多卡与分布式计算 |

> [!warning] 注意
> 不同架构对应不同算力 `sm_xx`、指令集与硬件特性（如 Tensor Core、RT Core、NVLink）。开发时需根据目标 GPU 的 `compute capability` 选择编译参数。

---

## CUDA 软硬件生态全景

CUDA 是 NVIDIA 面向 GPU 计算的**全栈软硬件生态**，整体分为七大板块：

### 硬件层

| 组件 | 说明 |
| :--- | :--- |
| 通用计算 GPU | 消费级（RTX 系列）、数据中心级（A100 / H100 / RTX 6000 等） |
| 硬件架构 | Ampere（安培）、Ada（阿达洛夫）、Hopper（霍普）、Blackwell（布莱克韦尔）等 |
| 互联方案 | PCIe、NVLink、GPU Direct，负责多卡 / 卡-机通信 |

### 编译与工具链

| 工具 | 全称与功能 |
| :--- | :--- |
| `nvcc` | **NVIDIA CUDA Compiler** - CUDA 专属前端编译器，拆分 Host / Device 代码，联动系统 C/C++ 编译器（GCC / Clang / MSVC） |
| `ptxas` | **PTX Assembler** - PTX 汇编转 GPU 二进制 |
| `nvlink` | **NVIDIA Linker** - 设备代码链接器 |
| `cuobjdump` / `nvdisasm` | 反汇编、查看 GPU 指令 |

### 运行时与驱动层

| API 层级 | 头文件 | 特点 |
| :--- | :--- | :--- |
| Runtime API（运行时 API） | `cuda_runtime.h` | 高层封装，接口简洁，自动管理上下文，**日常开发首选** |
| Driver API（驱动 API） | `cuda.h` | 偏底层，手动管理上下文、模块、核函数加载，多用于框架底层开发 |

> [!note] 严禁混用
> `cuda_runtime.h` 与 `cuda.h` 禁止在同一上下文中混用两套 API。

### 标准核心库

| 库名 | 全称与用途 |
| :--- | :--- |
| `cuBLAS` | **CUDA Basic Linear Algebra Subroutines** - GPU 线性代数库（矩阵乘、向量运算），深度学习 / 科学计算刚需 |
| `cuSPARSE` | **CUDA Sparse** - 稀疏矩阵运算库 |
| `cuFFT` | **CUDA Fast Fourier Transform** - 快速傅里叶变换 |
| `cuRAND` | **CUDA Random Number Generation** - GPU 随机数生成 |
| `cuSOLVER` | **CUDA Solver** - 线性方程组、特征值求解 |
| `cuDNN` | **CUDA Deep Neural Network** - 深度神经网络核心库（卷积、池化、激活等） |
| `NPP` | **NVIDIA Performance Primitives** - GPU 图像 / 视频处理库 |
| `NVJPEG` / `NVENC` / `NVDEC` | 编解码库，音视频场景专用 |

### 并行编程扩展组件

| 组件 | 功能定位 |
| :--- | :--- |
| `NCCL` | **NVIDIA Collective Communications Library** - 多卡数据并行通信，补齐单机多卡 / 多机多卡并行能力 |
| Cooperative Groups | 灵活线程组同步，拓展原生 `__syncthreads()` 能力 |
| MPI + CUDA | 多机多卡分布式并行，支持 GPU 显存直传 |
| OpenMP + CUDA | 异构并行混合编程，CPU + GPU 协同 |
| `Thrust` | GPU 标准算法库，类似 C++ STL，提供排序、规约、遍历等 |
| `CUB` | **CUDA Unbound** - 高效 GPU 原语库（规约、扫描、洗牌），性能极致 |

### 开发、调试与性能分析工具

| 工具 | 功能 |
| :--- | :--- |
| `Nsight Compute` | GPU 内核性能剖析、瓶颈定位（显存、指令、线程分化） |
| `Nsight Systems` | 系统级 profiling，分析 CPU-GPU 调度与数据流 |
| `nvidia-smi` | 查看 GPU 状态、显存、占用、温度 |
| `cuda-gdb` | GPU 代码调试器 |
| `cuda-memcheck` | 检测显存越界、内存泄漏、数据竞争 |

### 高层框架与生态应用

- **深度学习框架**：TensorFlow、PyTorch、MXNet、PaddlePaddle 等，底层均深度依赖 CUDA + cuDNN
- **科学计算与 HPC**：分子动力学、第一性原理软件（如 ABACUS）、流体力学、气象模拟等
- **推理与部署**：TensorRT（模型编译优化、量化，提升线上推理性能）
- **图形与渲染**：OptiX（光线追踪）、DLSS、游戏 / 影视渲染管线

---

## CUDA Runtime API 核心头文件

### `cuda_runtime.h` 与 `cuda.h` 的区别

| 特性 | `cuda_runtime.h`（Runtime API） | `cuda.h`（Driver API） |
| :--- | :--- | :--- |
| 层级 | 高层，封装好 | 低层，接近硬件驱动 |
| 函数前缀 | `cuda`（如 `cudaMalloc`） | `cu`（如 `cuMemAlloc`） |
| 初始化 | 懒加载，自动初始化 | 必须手动 `cuInit(0)` |
| Context 管理 | 自动创建 / 绑定主 Context | 手动 `cuCtxCreate` / 切换 |
| 安装来源 | 随 CUDA Toolkit 安装 | 随 NVIDIA 显卡驱动安装 |
| 适用场景 | **绝大多数 CUDA 开发** | 需极致控制、多 Context、兼容老驱动 |

> `cuda_runtime.h` 是 CUDA Runtime API 的核心头文件，封装了设备管理、内存管理、数据传输、核函数调用、流 / 事件、错误处理、上下文控制等全套主机端接口，**仅用于 CPU 主机代码**。设备端（核函数）无需包含此头文件。

### `cuda_runtime.h` 功能模块概览

#### 数据类型与枚举、宏定义

- `cudaError_t`（**CUDA Error Type** - 所有 Runtime API 的返回值类型，标识函数执行状态）
- `cudaSuccess`（**CUDA Success** - 执行成功状态码）
- `__CUDART_VERSION`（**CUDA Runtime Version** - 判断 CUDA 运行时版本）
- `cudaMemcpyKind`（**CUDA Memory Copy Kind** - 拷贝方向枚举）：
  - `cudaMemcpyHostToDevice`（主机到设备）
  - `cudaMemcpyDeviceToHost`（设备到主机）
  - `cudaMemcpyDeviceToDevice`（设备到设备）
  - `cudaMemcpyHostToHost`（主机到主机）
- `cudaDeviceProp`（**CUDA Device Properties** - 存储 GPU 算力、显存、核心数、时钟频率、最大线程 / 块尺寸等硬件信息）

#### 错误处理模块

CUDA 所有调用都建议配合错误检查。标准错误检查模板：

```cpp
#include <cuda_runtime.h>

#define CHECK_CUDA_ERROR(err) \
    if (err != cudaSuccess) { \
        fprintf(stderr, "[%s:%d] CUDA Error: %s\n", \
                __FILE__, __LINE__, cudaGetErrorString(err)); \
        exit(1); \
    }
```

- `cudaGetLastError()`（**CUDA Get Last Error** - 获取并清空当前线程上一次 CUDA 调用产生的错误码）
- `cudaGetErrorString()`（**CUDA Get Error String** - 接收 `cudaError_t` 类型错误码，返回对应的人类可读英文错误描述字符串）

#### 设备管理模块

| 函数 | 英文释义与功能 |
| :--- | :--- |
| `cudaGetDeviceCount()` | 获取本机可用 GPU 数量 |
| `cudaSetDevice()` | 指定当前线程使用的 GPU（**多卡必用**） |
| `cudaGetDevice()` | 查询当前正在使用的设备 ID |
| `cudaGetDeviceProperties()` | 读取 GPU 硬件参数（返回 `cudaDeviceProp` 结构体） |
| `cudaDeviceReset()` | 重置当前设备，释放所有资源（显存、流、事件、模块、上下文等），恢复到初始空闲状态 |
| `cudaDeviceSynchronize()` | **阻塞主机**，等待当前设备上所有已提交任务（核函数、数据拷贝、流任务等）全部执行完成 |

> `cudaDeviceSynchronize()` 调用后会清空设备错误状态，可配合错误检查。但频繁调用会打断流水线，正式上线代码需按需使用。

#### 内存管理模块

| 函数 | 英文释义与功能 |
| :--- | :--- |
| `cudaMalloc()` | **CUDA Memory Allocate** - 在 GPU 显存上分配全局内存 |
| `cudaFree()` | **CUDA Free** - 释放设备显存 |
| `cudaMallocHost()` | 分配主机锁页内存（Page-Locked Memory），拷贝速度更快，支持高速 DMA 传输 |
| `cudaFreeHost()` | 释放锁页内存 |
| `cudaMemGetInfo()` | 查询设备剩余显存与总显存 |

#### 数据传输模块

- `cudaMemcpy()`（**CUDA Memory Copy** - 同步拷贝，阻塞主机，执行期间主机等待拷贝完成）

  ```cpp
  cudaError_t cudaMemcpy(void* dst, const void* src, size_t count, cudaMemcpyKind kind);
  ```

- `cudaMemcpyAsync()`（**CUDA Memory Copy Async** - 异步拷贝，依赖 CUDA 流，主机不阻塞，可实现计算与拷贝重叠）

  ```cpp
  cudaError_t cudaMemcpyAsync(void* dst, const void* src, size_t count,
                               cudaMemcpyKind kind, cudaStream_t stream = 0);
  ```

#### 流与事件模块

**流（`cudaStream_t`）** 是 GPU 上的任务队列，**同流内任务串行，不同流可并行**。

| 函数 | 英文释义与功能 |
| :--- | :--- |
| `cudaStreamCreate()` | 创建流 |
| `cudaStreamDestroy()` | 销毁流 |
| `cudaStreamSynchronize()` | 等待单个流所有任务完成 |
| `cudaStreamWaitEvent()` | 流等待事件，实现任务依赖 |

**事件（`cudaEvent_t`）** 用于精确计时、标记任务节点、流间同步。

| 函数 | 英文释义与功能 |
| :--- | :--- |
| `cudaEventCreate()` | 创建事件 |
| `cudaEventRecord()` | **CUDA Event Record** - 在流中记录时间点 |
| `cudaEventElapsedTime()` | **CUDA Event Elapsed Time** - 计算两个事件的时间差（单位：毫秒） |
| `cudaEventSynchronize()` | 等待事件完成 |
| `cudaEventDestroy()` | 销毁事件 |

> [!note] 性能优化要点
> 异步拷贝、核函数放入不同流，配合事件计时，是 CUDA 性能调优基础。

---

## 代码示例

### 示例一：CUDA 程序的错误检查

```cpp
#include <iostream>
#include <cuda_runtime.h>

#define CHECK_CUDA_ERROR(err) \
    if (err != cudaSuccess) { \
        std::cerr << "CUDA Error: " << cudaGetErrorString(err) << std::endl; \
        return 1; \
    }

__global__ void hello_PKU() {
    const int index = threadIdx.x;
    printf("Hello from GPU %d!\n", index);
}

int main() {
    std::cout << "Hello from CPU!" << std::endl;

    // 1. 配置 kernel 参数
    int num_blk = 1;
    int num_thd = 8;

    // 2. 启动 kernel
    hello_PKU<<<num_blk, num_thd>>>();

    // 3. 【检查点一】立即检查 kernel 启动错误
    cudaError_t err = cudaGetLastError();
    if (err != cudaSuccess) {
        std::cerr << "Kernel launch failed: " << cudaGetErrorString(err) << std::endl;
        return -1;
    }
    std::cout << "Kernel launched successfully, no immediate launch error." << std::endl;

    // 4. 等待 GPU 执行完毕并检查执行错误
    err = cudaDeviceSynchronize();
    if (err != cudaSuccess) {
        std::cerr << "Kernel execution failed: " << cudaGetErrorString(err) << std::endl;
        return -1;
    }
    std::cout << "Kernel executed and synchronized successfully." << std::endl;

    // 5. 重置设备并检查错误
    err = cudaDeviceReset();
    if (err != cudaSuccess) {
        std::cerr << "cudaDeviceReset failed: " << cudaGetErrorString(err) << std::endl;
        return -1;
    }

    std::cout << "Program finished successfully." << std::endl;
    return 0;
}
```

**执行流程说明**：

1. 定义核函数 `hello_PKU`，每个线程打印自身 `threadIdx.x`
2. 以 `<<<1, 8>>>` 配置启动 1 个 Block、8 个线程
3. `cudaGetLastError()` 检查核函数启动是否成功（异步启动本身可能立即报错）
4. `cudaDeviceSynchronize()` 阻塞主机，等待 GPU 全部任务完成，并捕获执行期错误
5. `cudaDeviceReset()` 释放所有资源，将设备恢复初始状态

### 示例二：打印 CUDA 设备信息

```cpp
#include <iostream>
#include <cuda_runtime.h>

#define CHECK_CUDA_ERROR(err) \
    if (err != cudaSuccess) { \
        std::cerr << "CUDA Error: " << cudaGetErrorString(err) << std::endl; \
        return 1; \
    }

int main() {
    int deviceCount;
    cudaError_t err = cudaGetDeviceCount(&deviceCount);
    CHECK_CUDA_ERROR(err);

    if (deviceCount == 0) {
        std::cout << "没有找到 CUDA 设备" << std::endl;
        return 1;
    }

    std::cout << "找到 " << deviceCount << " 个 CUDA 设备" << std::endl;

    for (int i = 0; i < deviceCount; ++i) {
        cudaDeviceProp prop;
        err = cudaGetDeviceProperties(&prop, i);
        CHECK_CUDA_ERROR(err);

        std::cout << "设备 " << i << ": " << prop.name << std::endl;
        std::cout << "  计算能力: " << prop.major << "." << prop.minor << std::endl;
        std::cout << "  全局内存: "
                  << static_cast<float>(prop.totalGlobalMem) / (1024 * 1024 * 1024.0)
                  << " GB" << std::endl;
        std::cout << "  多处理器数量: " << prop.multiProcessorCount << std::endl;
        std::cout << "  每个多处理器的最大线程数: " << prop.maxThreadsPerMultiProcessor << std::endl;
        std::cout << "  每个块的最大线程数: " << prop.maxThreadsPerBlock << std::endl;
        std::cout << "  每个块的最大维度: ("
                  << prop.maxThreadsDim[0] << ", "
                  << prop.maxThreadsDim[1] << ", "
                  << prop.maxThreadsDim[2] << ")" << std::endl;
        std::cout << "  网格的最大维度: ("
                  << prop.maxGridSize[0] << ", "
                  << prop.maxGridSize[1] << ", "
                  << prop.maxGridSize[2] << ")" << std::endl;
        std::cout << "  共享内存/块: " << prop.sharedMemPerBlock / 1024.0 << " KB" << std::endl;
        std::cout << "  常量内存: " << prop.totalConstMem / 1024.0 << " KB" << std::endl;
        std::cout << "  Warp 大小: " << prop.warpSize << std::endl;
        std::cout << "  内存时钟速率: " << prop.memoryClockRate / 1000000.0 << " GHz" << std::endl;
        std::cout << "  显存总线宽度: " << prop.memoryBusWidth << " bits" << std::endl;
    }

    return 0;
}
```

**典型输出（RTX 3090）**：

```
找到 2 个 CUDA 设备
设备 0: NVIDIA GeForce RTX 3090
  计算能力: 8.6
  全局内存: 23.6835 GB
  多处理器数量: 82
  每个多处理器的最大线程数: 1536
  每个块的最大线程数: 1024
  每个块的最大维度: (1024, 1024, 64)
  网格的最大维度: (2147483647, 65535, 65535)
  共享内存/块: 48 KB
  常量内存: 64 KB
  Warp 大小: 32
  内存时钟速率: 9.751 GHz
  显存总线宽度: 384 bits
```

---

## NVCC 编译器与内置机制

NVCC（**NVIDIA CUDA Compiler**）包含数百个命令，常用约 30–50 个。以下命令由 nvcc **直接识别、内置处理**，无需 `#include "cuda_runtime.h"`。

### 常用内置变量

| 变量 | 类型 | 英文释义与含义 |
| :--- | :--- | :--- |
| `gridDim` | `dim3` | **Grid Dimension** - 网格尺寸（x, y, z） |
| `blockIdx` | `uint3` | **Block Index** - 块在网格中的全局索引 |
| `blockDim` | `dim3` | **Block Dimension** - 块尺寸（每个 Block 的线程数） |
| `threadIdx` | `uint3` | **Thread Index** - 线程在块内的局部索引 |
| `warpSize` | `int` | **Warp Size** - 线程束大小，固定为 32 |

### 执行与内存空间修饰符

| 修饰符 | 英文释义 | 功能说明 |
| :--- | :--- | :--- |
| `__global__`（**global** - 全局的） | 可从 Host 调用并在 Device 上执行的核函数 | 只能被 CPU 发起调用，函数体内是 GPU 线程执行逻辑；**无返回值** |
| `__device__`（**device** - 设备端的） | 仅在 GPU 上调用和执行的函数 | 标记设备端函数 / 变量 |
| `__host__`（**host** - 主机端的） | 仅在 CPU 上执行的普通函数 | 可省略，默认即为 `__host__` |
| `__forceinline__` | 强制内联 | 强制编译器将函数内联，减少调用开销（设备端常用） |
| `__noinline__` | 禁止内联 | 保留函数调用形式 |

### 同步与内存栅栏

**线程同步** = 等待线程执行步调；**内存栅栏** = 保证数据读写可见性与指令顺序。二者常配合使用。

| 函数 | 作用域 | 英文释义与功能 |
| :--- | :--- | :--- |
| `__syncthreads()` | Block 内 | **Synchronize Threads** - 整个线程块内所有线程到达此点才能继续 |
| `__syncwarp(unsigned mask)` | Warp 内 | **Synchronize Warp** - 当前线程束（32 线程）同步；`mask` 可指定仅同步部分线程 |
| `__threadfence()` | Grid 内 | **Thread Fence** - 保证栅栏前的全局 / 共享内存操作对**本 Block 所有线程**可见 |
| `__threadfence_block()` | Block 内 | 数据对当前 GPU 上**全部线程**可见 |
| `__threadfence_system()` | 系统级 | 刷新 PCIe、系统级缓存，GPU 与主机 / 多卡之间数据完全可见 |

### Warp 级内置函数（Shuffle / Lane 操作）

GPU 调度的基本单位：**1 个 Warp = 32 个线程**（lane 0~31）。

| 函数 | 英文释义与功能 |
| :--- | :--- |
| `__shfl_sync(unsigned mask, T val, int lane)` | **Shuffle** - 从指定 lane 读取值 |
| `__shfl_up_sync(...)` | 从相对当前 lane 向上偏移的 lane 读取 |
| `__shfl_down_sync(...)` | 从相对当前 lane 向下偏移的 lane 读取 |
| `__shfl_xor_sync(...)` | 按位异或交换，常用于 Butterfly 规约 |

> Warp 级内置函数是同一 Warp 内部快速同步、投票、数据交换、规约、匹配的**硬件级指令封装**，比共享内存 / 原子操作快得多，只能在 `__device__` / `__global__` 里使用。

### 原子操作

多线程同时读写同一个内存地址时，避免数据竞争、保证操作不可拆分、串行执行。

| 函数 | 英文释义 |
| :--- | :--- |
| `atomicAdd()` | **Atomic Add** - 原子加 |
| `atomicSub()` | **Atomic Subtract** - 原子减 |
| `atomicExch()` | **Atomic Exchange** - 原子交换 |
| `atomicMin()` / `atomicMax()` | **Atomic Min / Max** - 原子最小 / 最大值 |
| `atomicInc()` / `atomicDec()` | **Atomic Increment / Decrement** - 原子自增 / 自减 |
| `atomicCAS()` | **Atomic Compare And Swap** - 原子比较并交换 |
| `atomicAnd()` / `atomicOr()` / `atomicXor()` | **Atomic And / Or / Xor** - 原子位运算 |

> 原子操作仅支持三类设备端内存：**全局内存、共享内存、常量内存**。不支持线程私有局部内存、寄存器以及主机内存。支持类型包括 `int`、`unsigned int`、`long long`、`unsigned long long`、`float`、`double` 等。

### 位运算与算术内置函数

| 函数 | 英文释义与功能 |
| :--- | :--- |
| `__popc(unsigned int)` | **Population Count** - 统计二进制中 1 的个数 |
| `__popcll(unsigned long long)` | 64 位版本 |
| `__clz(int)` | **Count Leading Zeros** - 统计前导零个数 |
| `__clzll(long long)` | 64 位版本 |
| `__ffs(int)` | **Find First Set** - 查找最低位 1 的位置 |

> 以上为**单条硬件指令**，极快，替代循环移位判断。用途场景：哈希、编码、压缩、排序、图计算、随机数、底层算法优化。

### 地址空间判断

| 函数 | 英文释义与功能 |
| :--- | :--- |
| `__isGlobal(const void*)` | 判断指针是否指向**全局显存**（Global Memory） |
| `__isShared(const void*)` | 判断指针是否指向线程块**共享内存**（Shared Memory） |
| `__isConstant(const void*)` | 判断指针是否指向**常量内存**（Constant Memory） |
| `__isLocal(const void*)` | 判断指针是否指向线程**局部内存**（Local Memory） |

> 仅设备端代码可用，**不能用来判断主机内存指针**。

### 内置数学函数

`sinf`、`cosf`、`logf`、`expf`、`sqrtf`、`rsqrtf`、`fma` 等，设备端直接可用，底层为硬件优化实现。

### 编译时宏

| 宏 | 英文释义与功能 |
| :--- | :--- |
| `__CUDACC__` | 区分代码是用 nvcc 还是普通 gcc / clang 编译 |
| `__CUDA_ARCH__` | 代表当前编译目标的 GPU 算力架构，如 `750` = `sm_75`（Turing），`800` = `sm_80`（Ampere） |
| `CUDA_ARCH` | 架构家族，粗粒度区分大代际（如 700 系列、800 系列） |

```cpp
#if __CUDA_ARCH__ >= 800
    // 使用 Ampere 及以上新指令
#endif
```

---

## 内存模型对比

| 内存类型 | 英文全称 | 位置 | 速度 | 作用域 | 生命周期 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Register` | 寄存器 | SM 上 | **最快** | 线程私有 | 线程 |
| `Shared Memory` | 共享内存 | SM 上的 SRAM | **很快** | Block 内共享 | Block |
| `Global Memory` | 全局内存 | GPU DRAM | 慢 | 全局可见 | 程序 / 手动管理 |
| `Constant Memory` | 常量内存 | 带缓存的全局区域 | 较快（命中时） | 只读，全局可见 | 程序 |
| `Local Memory` | 局部内存 | 实际位于全局内存 | 慢 | 线程私有 | 线程 |
| `Unified Memory` | 统一内存 | Host-Device 共享地址空间 | 自动管理 | 全局可见 | 自动 |

---

## 本节总结

- CUDA 生态涵盖硬件、编译器、运行时库、标准计算库、调试工具与高层框架七大板块，形成完整的 GPU 计算全栈。
- `cuda_runtime.h` 提供高层 Runtime API，自动管理上下文，是日常开发首选；`cuda.h` 提供底层 Driver API，需手动管理上下文，适用于框架开发。
- **错误检查**是 CUDA 编程的必备习惯，建议使用 `CHECK_CUDA_ERROR` 宏结合 `__FILE__` 与 `__LINE__` 精准定位问题。
- `cudaDeviceSynchronize()` 阻塞主机等待设备完成，适合调试与结果校验，但正式上线应避免频繁调用以免打断流水线。
- NVCC 内置的 `__syncthreads()`、`__syncwarp()`、原子操作与 Warp Shuffle 是控制并行执行步调与数据竞争的核心工具。

### 思考题

1. 为什么 `cuda_runtime.h` 与 `cuda.h` 禁止在同一上下文中混用？
2. `cudaDeviceSynchronize()` 与 `__syncthreads()` 的作用域有何不同？
3. 为什么 Shared Memory 比 Global Memory 快？Bank Conflict 如何产生及如何避免？
4. 如何根据 `cudaDeviceProp` 中的 `maxThreadsPerBlock` 与 `warpSize` 合理配置核函数启动参数？
5. 原子操作 `atomicAdd` 与 Warp Shuffle 归约各适用于什么场景？性能差异来源是什么？
