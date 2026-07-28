---
title: 'CUDA 的标准核心库'
excerpt: '26 春 并行程序设计 L46'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'GPU'
- 'CUDA'
pubDate: 'June 16 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 概念解释

### CUDA 标准库概览

在 CUDA 开发工具套装（CUDA Toolkit）中，NVIDIA 提供了覆盖多个领域的标准库，避免开发者重复编写底层核函数：

| 库名 | 全称 / 含义 | 应用领域 |
| :--- | :--- | :--- |
| `Thrust` | **Thrust**（推力/冲刺） | 类似 C++ STL 的 GPU 并行算法与容器库 |
| `cuBLAS` | **CUDA Basic Linear Algebra Subprograms** | 基本线性代数（矩阵乘法、向量运算等） |
| `cuFFT` | **CUDA Fast Fourier Transform** | 快速傅里叶变换（信号处理、图像滤波等） |
| `cuSPARSE` | **CUDA Sparse Matrix** | 稀疏矩阵求解 |
| `cuRAND` | **CUDA Random Number Generation** | 随机数生成 |
| `cuDNN` | **CUDA Deep Neural Network** | 深度学习原语加速库 |

> **最佳实践**：优先使用官方标准库而非手写核函数。这些库经过深度优化，通常能达到接近峰值的性能，且节省开发时间。

---

## Thrust 库详解

### 核心概念

`Thrust`（**Thrust** - 英伟达推出的高性能 GPU 并行开发库）是 CUDA 的 **C++ STL 等价物**，提供了高层抽象，使开发者无需直接编写 `__global__` 核函数即可完成并行计算。

### 核心数据结构

Thrust 的主要数据结构是 **向量容器（Vector Container）**，分为两类：

| 类型 | 声明方式 | 存储位置 | 访问方式 |
| :--- | :--- | :--- | :--- |
| 主机向量 | `thrust::host_vector<T>` | Host（CPU）内存 | 标准 C++ 数组下标 `[]` |
| 设备向量 | `thrust::device_vector<T>` | Device（GPU）全局内存 | 标准 C++ 数组下标 `[]` |

> **关键特性**：`thrust::device_vector` 的赋值与访问会自动处理 **Host-Device 数据拷贝**，隐藏了 `cudaMalloc` / `cudaMemcpy` / `cudaFree` 的底层细节。

### 代码示例：Thrust 向量基本操作

```cpp
#include <thrust/host_vector.h>
#include <thrust/device_vector.h>
#include <iostream>

int main() {
    // 分配主机内存，4 个 int
    thrust::host_vector<int> H(4);

    // 初始化元素
    H[0] = 14;
    H[1] = 20;
    H[2] = 38;
    H[3] = 46;

    // H.size() 返回向量大小
    std::cout << "H has size " << H.size() << std::endl;

    // 打印数组内容
    for (int i = 0; i < H.size(); i++) {
        std::cout << "H[" << i << "] = " << H[i] << std::endl;
    }

    // 重新分配数组大小
    H.resize(2);
    std::cout << "H now has size " << H.size() << std::endl;

    // 拷贝主机向量 H 到设备向量 D（自动完成 Device 内存分配与数据传输）
    thrust::device_vector<int> D = H;

    // 在设备上修改数值（此处通过 Thrust 的隐式机制在 GPU 上执行）
    D[0] = 99;
    D[1] = 88;

    // 打印修改后的数值（自动拷贝回 Host）
    for (int i = 0; i < D.size(); i++) {
        std::cout << "D[" << i << "] = " << D[i] << std::endl;
    }

    // H 和 D 在函数返回时自动释放（RAII 机制）
    return 0;
}
```

**编译命令**：
```bash
nvcc 10_thrust_e2.cu
```

**运行结果**：
```
H has size 4
H[0] = 14
H[1] = 20
H[2] = 38
H[3] = 46
H now has size 2
D[0] = 99
D[1] = 88
```

> **注意**：`thrust::device_vector` 的 `operator[]` 在主机代码中调用时会触发隐式同步与数据拷贝，频繁访问会导致性能下降。批量操作应使用 Thrust 算法（如 `thrust::copy`, `thrust::fill`, `thrust::reduce`）。

---

## cuBLAS 库详解

### 核心概念

`cuBLAS`（**CUDA Basic Linear Algebra Subprograms**）是基本线性代数子程序的 GPU 版本实现，对标 CPU 端的 BLAS 库。它遵循 BLAS 的 API 规范（列优先存储，Fortran 风格）。

### 核心 API 与执行流程

使用 cuBLAS 的典型流程遵循 **句柄（Handle）模式**：

| 步骤 | 函数 | 英文释义 |
| :--- | :--- | :--- |
| 创建句柄 | `cublasCreate(&handle)` | 创建 cuBLAS 库上下文 |
| 执行计算 | `cublasSgemm(...)` | **Single-precision General Matrix Multiply** - 单精度通用矩阵乘法 |
| 销毁句柄 | `cublasDestroy(handle)` | 释放 cuBLAS 资源 |

### 代码示例：矩阵乘法（Sgemm）

```cpp
#include <iostream>
#include <cuda_runtime.h>
#include <cublas_v2.h>

// 初始化矩阵：每个元素为 1
void fillMatrix(float *matrix, int rows, int cols) {
    for (int i = 0; i < rows; ++i) {
        for (int j = 0; j < cols; ++j) {
            matrix[i * cols + j] = 1.0f;
        }
    }
}

int main() {
    // 矩阵维度：A(m,k) * B(k,n) = C(m,n)
    int m = 3, n = 3, k = 2;

    float *A, *B, *C;          // Host 端指针
    float *d_A, *d_B, *d_C;    // Device 端指针

    // 分配主机内存（C 风格 malloc）
    A = (float *)malloc(m * k * sizeof(float));
    B = (float *)malloc(k * n * sizeof(float));
    C = (float *)malloc(m * n * sizeof(float));

    // 填充 A 和 B
    fillMatrix(A, m, k);
    fillMatrix(B, k, n);

    // 分配设备内存
    cudaMalloc((void **)&d_A, m * k * sizeof(float));
    cudaMalloc((void **)&d_B, k * n * sizeof(float));
    cudaMalloc((void **)&d_C, m * n * sizeof(float));

    // 拷贝数据 Host -> Device
    cudaMemcpy(d_A, A, m * k * sizeof(float), cudaMemcpyHostToDevice);
    cudaMemcpy(d_B, B, k * n * sizeof(float), cudaMemcpyHostToDevice);

    // 创建 cuBLAS 句柄
    cublasHandle_t handle;
    cublasCreate(&handle);

    // 设置标量参数
    float alpha = 1.0f;
    float beta  = 0.0f;

    // 执行矩阵乘法：C = alpha * A * B + beta * C
    // 注意：cuBLAS 默认列优先（Column-Major）存储
    cublasSgemm(handle,
                CUBLAS_OP_N, CUBLAS_OP_N,  // 不转置
                m, n, k,                   // 维度
                &alpha,                    // 标量 alpha
                d_A, m,                    // A 矩阵及 leading dimension
                d_B, k,                    // B 矩阵及 leading dimension
                &beta,                     // 标量 beta
                d_C, m);                   // C 矩阵及 leading dimension

    // 拷贝结果 Device -> Host
    cudaMemcpy(C, d_C, m * n * sizeof(float), cudaMemcpyDeviceToHost);

    // 清理资源
    cublasDestroy(handle);
    cudaFree(d_A);
    cudaFree(d_B);
    cudaFree(d_C);
    free(A);
    free(B);
    free(C);

    return 0;
}
```

**编译命令**：
```bash
nvcc 11_cublas.cu -lcublas
```

> **常见错误**：cuBLAS 使用 **列优先（Column-Major）** 存储，而 C/C++ 数组是 **行优先（Row-Major）**。若直接传递 C 数组而不调整，会导致结果逻辑上等价于计算了 `A^T * B^T`。对于行优先数据，可通过调整 `lda`, `ldb`, `ldc` 参数或显式转置来适配。

---

## cuFFT 库详解

### 核心概念

`cuFFT`（**CUDA Fast Fourier Transform**）提供了 GPU 版本的快速傅里叶变换实现，支持：
- **维度**：一维、二维、三维 FFT
- **类型**：复数到复数（`C2C`）、实数到复数（`R2C`）、复数到实数（`C2R`）

### 核心 API 与执行流程

cuFFT 使用 **Plan（计划/方案）** 模式，先创建执行计划，再执行变换：

| 步骤 | 函数 | 英文释义 |
| :--- | :--- | :--- |
| 创建计划 | `cufftPlan1d(&plan, N, CUFFT_R2C, 1)` | 创建一维 FFT 计划 |
| 执行变换 | `cufftExecR2C(plan, d_data, d_complex)` | 执行实数到复数变换 |
| 销毁计划 | `cufftDestroy(plan)` | 释放 FFT 计划资源 |

### 代码示例：实数到复数 FFT（R2C）

```cpp
#include <iostream>
#include <cuda_runtime.h>
#include <cufft.h>

int main() {
    const int N = 8;
    const int SIZE = N * sizeof(float);

    // 在主机上创建并初始化数据
    float h_data[N];
    for (int i = 0; i < N; ++i) {
        h_data[i] = static_cast<float>(i);
    }

    // 分配设备内存
    float *d_data;
    cudaMalloc(&d_data, SIZE);

    // 主机 -> 设备
    cudaMemcpy(d_data, h_data, SIZE, cudaMemcpyHostToDevice);

    // 创建并设置 FFT 计划：一维，N 点，实数->复数，batch=1
    cufftHandle plan;
    cufftResult res = cufftPlan1d(&plan, N, CUFFT_R2C, 1);
    if (res != CUFFT_SUCCESS) {
        std::cerr << "Error in cufftPlan1d: " << res << std::endl;
        return 1;
    }

    // 分配复数结果内存（R2C 输出 N/2+1 个复数）
    cufftComplex *d_complex;
    cudaMalloc(&d_complex, (N / 2 + 1) * sizeof(cufftComplex));

    // 执行 FFT
    res = cufftExecR2C(plan, d_data, d_complex);
    if (res != CUFFT_SUCCESS) {
        std::cerr << "Error in cufftExecR2C: " << res << std::endl;
        return 1;
    }

    // 拷贝结果回主机
    cufftComplex h_complex[N / 2 + 1];
    cudaMemcpy(h_complex, d_complex,
               (N / 2 + 1) * sizeof(cufftComplex),
               cudaMemcpyDeviceToHost);

    // 清理
    cufftDestroy(plan);
    cudaFree(d_data);
    cudaFree(d_complex);

    // 打印结果
    for (int i = 0; i < N / 2 + 1; ++i) {
        std::cout << "FFT[" << i << "] = "
                  << h_complex[i].x << " + "
                  << h_complex[i].y << "i" << std::endl;
    }

    return 0;
}
```

**编译命令**：
```bash
nvcc 12_cufft.cu -lcufft
```

**运行结果**（输入 `[0, 1, 2, 3, 4, 5, 6, 7]`）：
```
FFT[0] = 28 + 0i
FFT[1] = -4 + 9.65685i
FFT[2] = -4 + 4i
FFT[3] = -4 + 1.65685i
FFT[4] = -4 + 0i
```

> **注意**：`cufftComplex` 是 cuFFT 定义的复数类型，包含 `.x`（实部）和 `.y`（虚部）。对于 R2C 变换，由于实数输入的共轭对称性，只需存储 `N/2+1` 个复数输出。

---

## 库函数对比总结

| 特性 | Thrust | cuBLAS | cuFFT |
| :--- | :--- | :--- | :--- |
| **抽象层级** | 高（类似 STL） | 中（数学 API） | 中（数学 API） |
| **显式内存管理** | 隐式（RAII） | 显式（`cudaMalloc`） | 显式（`cudaMalloc`） |
| **核心对象** | `host_vector` / `device_vector` | `cublasHandle_t` | `cufftHandle` |
| **数据流向** | 自动拷贝 | 手动 `cudaMemcpy` | 手动 `cudaMemcpy` |
| **适用场景** | 快速原型、算法验证 | 大规模矩阵运算 | 信号/图像频域处理 |
| **编译依赖** | 头文件即可 | `-lcublas` | `-lcufft` |

---

## 硬件生态与架构演进

### 从 GPU 到专用 AI 加速器

| 时间 | 硬件/架构 | 关键特性 |
| :--- | :--- | :--- |
| 2016 | **TPU v1**（Google） | 张量处理单元，专为 TensorFlow 设计 |
| 2017 | **Pascal**（NVIDIA） | 引入 NVLink 高速互联，支持量化加速 |
| 2021 | **TPU v4**（Google） | 光电路开关（OCS）互连，exaFLOPS 规模 |
| 2022 | **Hopper H100**（NVIDIA） | **Transformer Engine**，FP8/FP16 混合精度，7296 CUDA Core，80GB HBM2，NVLink 4.0 |
| 2024 | **Blackwell B200**（NVIDIA） | 2080 亿晶体管，NVLink 5.0，定位"新工业革命引擎" |
| 2024 | **国产芯片** | 华为昇腾、摩尔线程 MTT S4000、壁仞、沐曦、曙光等 |

### 关键术语解析

- **`TPU`**（**Tensor Processing Unit** - 张量处理单元）：Google 专为机器学习定制的 ASIC，相比 GPU 在特定 AI 任务上能效更高。
- **`NVLink`**（**NVIDIA Link**）：英伟达高速双向互联技术，用于多 GPU/多节点间直连，远超 PCIe 带宽。
- **`HBM`**（**High Bandwidth Memory**）：高带宽显存，3D 堆叠封装，为 GPU 提供 TB/s 级内存带宽。
- **`Tensor Core`**（张量核心）：NVIDIA GPU 中专用于矩阵乘累加（MMA）的加速单元，支持低精度计算（FP16, BF16, FP8, INT8）。
- **`Transformer Engine`**：Hopper 架构引入的硬件单元，可动态管理 FP8 与 FP16 精度，专为 Transformer 大模型训练优化。

### H100 架构亮点

- **144 个 SM**（**Streaming Multiprocessor**），每个 SM 含 **128 个 FP32 CUDA Core**
- 引入 **FP8 精度** 与 **Transformer Engine**，训练速度提升高达 9 倍
- **第四代 NVLink**：带宽 900 GB/s
- **台积电 4N 工艺**：800 亿晶体管，面积 814 mm²

---

## 本节总结

1. **Thrust** 提供了最高层的抽象，适合快速开发与验证，但精细控制需回归底层 CUDA。
2. **cuBLAS/cuFFT** 遵循"创建句柄/计划 -> 执行 -> 销毁"的模式，需手动管理 `cudaMalloc` 与 `cudaMemcpy`。
3. 使用 cuBLAS 时必须注意其 **列优先存储** 与 C 语言的差异。
4. cuFFT 的 R2C 变换利用共轭对称性，输出规模为 `N/2+1`。
5. AI 硬件正从通用 GPU 向 **专用化（TPU）** 与 **超大规模互联（Blackwell, TPU v4 Pod）** 演进。

### 思考题

1. 为什么 Thrust 的 `device_vector` 在主机代码中通过 `[]` 访问效率较低？如何避免？
2. cuBLAS 的列优先存储对 C/C++ 程序员意味着什么？如何在不转置矩阵的情况下适配行优先数据？
3. cuFFT 的 R2C 与 C2C 变换在内存占用上有什么区别？为什么 R2C 输出是 `N/2+1`？
4. 对比 NVIDIA GPU 与 Google TPU 的设计哲学：通用性 vs 专用性，各有什么优劣？
5. 从 H100 的 **Transformer Engine** 可以看出，硬件架构如何随着算法（Transformer）的流行而演进？这对并行程序设计课程的学习有何启示？

---

> **课程结语**：正如《终身成长》所言——"这太难了，太有意思了！" 从固定型思维转向成长型思维，正是掌握 CUDA 并行编程的关键。面对复杂的内存模型与线程索引，拥抱挑战、持续迭代，方能真正驾驭 GPU 的并行之力。