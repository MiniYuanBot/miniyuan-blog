---
title: 'GPU 的内存管理'
excerpt: '26 春 并行程序设计 L42'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'GPU'
pubDate: 'June 12 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 概念解释

### CPU-GPU 异构计算系统

CPU 和 GPU 基于不同的硬件设计架构，在编程模型上具有显著差异，这类系统称为 **Heterogeneous Computing System**（异构计算系统）。

一个典型的 GPU 计算流程包含四个阶段：

1. **Host -> Device**：通过 `cudaMemcpy` 将待处理数据从主机内存（Host Memory）拷贝到设备显存（Device Memory / Global Memory）。
2. **Kernel Launch**：CPU 初始化并启动 GPU 计算任务（调用 `__global__` 核函数）。
3. **Parallel Execution**：GPU 上的大量线程（Thread）在流多处理器（SM）中并行执行计算。
4. **Device -> Host**：通过 `cudaMemcpy` 将计算结果从显存拷贝回主机内存。

### GPU 内存层次结构

GPU 采用 **多级存储架构**，遵循 **"越靠近计算单元，速度越快、容量越小"** 的原则：

| 内存类型 | 英文全称 | 物理位置 | 速度 | 容量 | 可见性 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 寄存器 | Register | SM 内部 | 极快 | 64 KiB / Processing Block | 线程私有 |
| L0 指令缓存 | L0 Instruction Cache | SM 内部 | 极快 | 12 KiB | Block 私有 |
| L1 数据缓存 / 共享内存 | L1 Data Cache / Shared Memory | SM 内部 | 快 | 128 KiB / SM | Block 内共享 |
| L1 常量缓存 | L1 Constant Cache | SM 内部 | 快 | 2 KiB | SM 内共享 |
| L2 缓存 | L2 Cache | GPU 全局 | 较快 | 6144 KiB | 全 GPU 共享 |
| 全局内存 / 显存 | Global Memory / DRAM | GPU 片外 DRAM | 慢 | ~16 GiB | 全 GPU 共享 |
| 常量内存 | Constant Memory | GPU 片外 DRAM | 较慢（但带缓存） | 有限 | 全 GPU 只读 |
| 纹理内存 | Texture Memory | GPU 片外 DRAM | 较慢（但带专用缓存） | 有限 | 全 GPU 只读 |

> [!warning] 注意
> 共享内存（Shared Memory）与 L1 数据缓存 **物理上共享同一块 SRAM**，区别仅在于共享内存是 **可编程的**（程序员显式控制），而 L1 缓存对程序员 **透明**。

---

## 核心修饰符与执行配置

### 执行空间修饰符

| 修饰符 | 英文含义 | 调用位置 | 执行位置 | 用途 |
| :--- | :--- | :--- | :--- | :--- |
| `__global__` | **global** - 全局的 | Host（CPU） | Device（GPU） | 定义核函数（Kernel），可从主机调用并在设备上执行 |
| `__device__` | **device** - 设备端的 | Device | Device | 定义设备函数或设备变量，仅在 GPU 上调用和执行 |
| `__host__` | **host** - 主机端的 | Host | Host | 定义普通 CPU 函数，可省略 |
| `__shared__` | **shared** - 共享的 | 核函数内声明 | SM 片上内存 | 声明在 Block 内各线程共享的高速片上内存 |
| `__constant__` | **constant** - 常量 | 全局作用域 | GPU 常量缓存 | 声明只读且带缓存的全局内存区域 |
| `__texture__` | **texture** - 纹理 | 全局作用域 | GPU 纹理缓存 | 声明特殊的只读内存，用于图像/信号处理 |

### 内置变量与执行配置

| 符号 | 英文全称 | 含义 |
| :--- | :--- | :--- |
| `threadIdx` | **thread index** | 线程索引，当前线程在其 Block 内的局部编号（x/y/z） |
| `blockIdx` | **block index** | 块索引，当前 Block 在 Grid 内的全局编号（x/y/z） |
| `blockDim` | **block dimension** | 块维度，每个 Block 在 x/y/z 方向上的线程数 |
| `gridDim` | **grid dimension** | 网格维度，Grid 在 x/y/z 方向上的 Block 总数 |
| `<<< >>>` | **Execution Configuration** / **Kernel Launch** | 执行配置，用于指定 Grid 和 Block 的维度 |

---

## API 详解

### 内存分配与释放

| 函数 | 英文全称 | 功能说明 |
| :--- | :--- | :--- |
| `cudaMalloc()` | **CUDA Memory Allocate** | 在设备端（GPU）分配全局内存 |
| `cudaFree()` | **CUDA Free** | 释放设备端通过 `cudaMalloc` 分配的内存 |
| `cudaMallocManaged()` | **CUDA Managed Memory Allocate** | 分配统一内存（Unified Memory），Host 和 Device 可用同一指针访问 |

### 数据传输

| 函数 | 英文全称 | 功能说明 |
| :--- | :--- | :--- |
| `cudaMemcpy()` | **CUDA Memory Copy** | 在 Host 与 Device 之间，或 Device 之间拷贝数据 |
| `cudaMemcpyToSymbol()` | **CUDA Memory Copy To Symbol** | 将数据从主机内存复制到 GPU 的符号变量（`__device__` / `__constant__`） |
| `cudaMemcpyFromSymbol()` | **CUDA Memory Copy From Symbol** | 将 GPU 符号变量的数据复制回主机内存 |

### 同步与错误处理

| 函数 | 英文全称 | 功能说明 |
| :--- | :--- | :--- |
| `cudaDeviceSynchronize()` | **CUDA Device Synchronize** | 阻塞 Host，直到设备端所有先前任务完成 |
| `cudaGetLastError()` | **CUDA Get Last Error** | 获取最近一次 CUDA 调用的错误码 |
| `cudaGetErrorString()` | **CUDA Get Error String** | 将错误码转换为可读字符串 |

---

## 内存模型详解

### 寄存器（Register）

**Register**（寄存器）是 **SM 上最快的存储资源**，位于 GPU 处理单元内部，每个线程私有。

- **特点**：每个时钟周期可完成读写；存储线程局部变量和中间计算结果；线程间不可互相访问。
- **限制**：数量有限。若内核使用的寄存器过多，会导致 **Register Spilling**（寄存器溢出），数据被存放到 **Local Memory**（实际位于 Global Memory 中），性能急剧下降。

### 全局内存（Global Memory）

**Global Memory**（全局内存）是 GPU 的 **主 DRAM**，容量最大（通常数 GB 到数十 GB），但延迟最高（数百个时钟周期）。

- **特点**：所有线程均可访问；用于存储大规模运算数据；与 CPU 内存不互通，必须通过显式拷贝传输。
- **动态分配**：使用 `cudaMalloc()` 在主机端分配，使用 `cudaFree()` 释放。
- **设备变量**：使用 `__device__` 在全局作用域声明的变量存放在全局内存中，生命周期贯穿整个应用程序。主机端不可直接访问，必须通过 `cudaMemcpyToSymbol()` / `cudaMemcpyFromSymbol()` 读写。

### 共享内存（Shared Memory）

**Shared Memory**（共享内存，缩写 **SMEM**）是 GPU 性能优化的 **核心手段**。它位于每个 SM 的片上 SRAM 中，被同一个线程块（Block）内的所有线程共享。

- **特点**：访问延迟比全局内存 **低 20~30 倍**，带宽 **高约 10 倍**；可编程管理，需显式声明和使用。
- **静态分配**：在核函数内使用 `__shared__` 关键字，编译时确定大小。
- **动态分配**：使用 `extern __shared__` 声明不定长数组，实际大小在核函数调用时的 `<<< grid, block, sharedMemSize >>>` 第三个参数中指定。
- **容量限制**：如 A100 每 SM 共享内存为 48 KB，需合理规划。

### 常量内存（Constant Memory）

**Constant Memory**（常量内存）是 **只读** 的全局内存区域，拥有独立的 **Constant Cache**（常量缓存）。

- **特点**：对核函数只读，对主机代码可读可写；生存周期与应用程序相同；所有线程均可访问。
- **性能优势**：当 **同一个 Warp** 内的所有线程读取 **同一常量地址** 时，硬件只需从常量缓存读取一次，然后 **广播** 给所有线程，延迟极低。
- **声明**：使用 `__constant__` 修饰符。

### 纹理内存（Texture Memory）

**Texture Memory**（纹理内存）是 CUDA 中一类特殊的只读内存，一般用于 **图像处理、信号处理、采样计算** 等存在 **Spatial Locality**（空间局部性）的场景。

- **特点**：与全局内存各有独立的 L1 缓存，但共享同一个 L2 缓存；同样位于 DRAM 中。
- **声明**：使用 `__texture__` 修饰符。

### 统一内存（Unified Memory）

**Unified Memory**（统一内存）从 CUDA 6.0 引入，通过 **内存托管池**（Managed Memory Pool）实现。

- **特点**：允许 Host 和 Device 使用 **相同的指针** 访问同一块内存；简化编程，无需手动 `cudaMemcpy`。
- **分配**：使用 `cudaMallocManaged()`。
- **同步要求**：GPU 改写后 CPU 读取前需调用 `cudaDeviceSynchronize()`，确保 CPU 拿到最新数据。
- **性能提示**：简化代码，但 **不带来性能优势**，底层仍可能发生页错误（Page Fault）和隐式数据迁移。

---

## 同步与原子操作

### 线程同步

| 函数 | 英文全称 | 作用域 | 功能说明 |
| :--- | :--- | :--- | :--- |
| `__syncthreads()` | **synchronize threads** | Block 内 | 线程块内所有线程到达此点才能继续，附带内存栅栏效果 |
| `cudaDeviceSynchronize()` | **CUDA Device Synchronize** | 全局 | 阻塞 Host，直到设备端所有先前任务完成 |

> [!abstract] 关键区别
> `__syncthreads()` 是 **Block 级** 同步（核函数内调用），`cudaDeviceSynchronize()` 是 **Grid/Host 级** 同步（主机端调用）。

### 原子操作

**Atomic Operations**（原子操作）保证对共享变量的 **"读取—修改—写入"** 过程在多线程环境下不可被打断，用于消除 **Data Race**（数据竞争）。

| 函数 | 英文全称 | 功能 |
| :--- | :--- | :--- |
| `atomicAdd()` | **atomic add** | 原子加法：`value += add_num` |
| `atomicSub()` | **atomic subtract** | 原子减法：`value -= sub_num` |
| `atomicExch()` | **atomic exchange** | 原子赋值：`value = num` |
| `atomicMax()` | **atomic maximum** | 原子取大：`value = max(value, num)` |
| `atomicMin()` | **atomic minimum** | 原子取小：`value = min(value, num)` |
| `atomicInc()` | **atomic increment** | 向上计数 |
| `atomicDec()` | **atomic decrement** | 向下计数 |
| `atomicCAS()` | **atomic compare and swap** | 比较并交换 |
| `atomicAnd()` | **atomic AND** | 原子按位与 |
| `atomicOr()` | **atomic OR** | 原子按位或 |
| `atomicXor()` | **atomic XOR** | 原子按位异或 |

---

## 代码示例

### 示例 1：设备变量与原子操作（数据竞争演示）

以下代码演示了 **64 个线程同时对一个全局设备变量执行 `+= 1`** 的场景。若使用普通加法，会产生数据竞争；使用 `atomicAdd` 可得到正确结果。

```cpp
#include <iostream>
#include <cuda_runtime.h>

// 全局设备变量，存放在 Global Memory 中
__device__ int deviceVar;

// 核函数：每个线程尝试给 deviceVar 加 1
__global__ void addOneToDeviceVar() {
    // 错误写法：deviceVar += 1;  // 存在数据竞争，结果不确定
    atomicAdd(&deviceVar, 1);     // 正确：原子加法，防止数据竞争
}

int main() {
    int h_var = 100;
    int h_var_from_device = 0;

    // 将主机数据拷贝到设备符号变量
    cudaMemcpyToSymbol(deviceVar, &h_var, sizeof(int));

    // 启动 1 个 Block，64 个线程
    addOneToDeviceVar<<<1, 64>>>();
    cudaDeviceSynchronize();

    // 将结果拷贝回主机
    cudaMemcpyFromSymbol(&h_var_from_device, deviceVar, sizeof(int));

    std::cout << "Value copied to device: " << h_var << std::endl;
    std::cout << "Value after adding one on device: " 
              << h_var_from_device << std::endl;  // 正确输出：164

    cudaDeviceReset();
    return 0;
}
```

**执行逻辑说明**：

- `cudaMemcpyToSymbol` 将主机变量 `h_var`（值为 100）拷贝到设备符号 `deviceVar`。
- 64 个线程并行执行 `atomicAdd`，每个线程原子地将 `deviceVar` 加 1。
- 由于原子操作保证不可分割，最终结果为 **164**（100 + 64）。
- 若去掉 `atomicAdd` 改用 `deviceVar += 1`，由于数据竞争，结果可能小于 164。

---

### 示例 2：静态共享内存与线程同步

以下代码演示了 **静态共享内存** 的声明、使用以及与 `__syncthreads()` 的配合。

```cpp
#include <cuda_runtime.h>
#include <iostream>
#include <iomanip>

// 核函数：使用静态共享内存将输入数据乘以 2
__global__ void copyData(const int *input, int *output) {
    // 静态分配共享内存数组（编译时确定大小，Block 内所有线程共享）
    __shared__ int sharedData[64];

    // 计算全局线程索引
    int tid = blockIdx.x * blockDim.x + threadIdx.x;

    // 将全局内存数据读入共享内存
    sharedData[threadIdx.x] = input[tid] * 2;

    // 线程块内同步：确保所有线程完成写入后，再统一继续执行
    __syncthreads();

    // 将共享内存写回全局内存
    output[tid] = sharedData[threadIdx.x];
}

int main() {
    int numElements = 64;
    size_t size = numElements * sizeof(int);

    // 主机端分配与初始化
    int *h_input = new int[numElements];
    int *h_output = new int[numElements];
    for (int i = 0; i < numElements; ++i) {
        h_input[i] = i;
    }

    // 设备端分配
    int *d_input, *d_output;
    cudaMalloc((void**)&d_input, size);
    cudaMalloc((void**)&d_output, size);

    // Host -> Device
    cudaMemcpy(d_input, h_input, size, cudaMemcpyHostToDevice);

    // 启动 2 个 Block，每 Block 32 个线程（共 64 线程）
    copyData<<<2, 32>>>(d_input, d_output);
    cudaDeviceSynchronize();

    // Device -> Host
    cudaMemcpy(h_output, d_output, size, cudaMemcpyDeviceToHost);

    // 输出结果（每个数乘以 2）
    for (int i = 0; i < numElements; ++i) {
        std::cout << std::setw(15) << h_input[i]
                  << std::setw(15) << h_output[i] << std::endl;
    }

    // 清理资源
    delete[] h_input;
    delete[] h_output;
    cudaFree(d_input);
    cudaFree(d_output);

    return 0;
}
```

**执行逻辑说明**：

- `__shared__ int sharedData[64]` 在 **每个 Block** 的片上 SRAM 中分配 64 个 int 的空间。
- 线程 `threadIdx.x` 负责将对应位置数据读入共享内存并做计算（`* 2`）。
- `__syncthreads()` 作为 **执行屏障**，确保 Block 内全部 32 个线程都完成写入后，再统一执行后续读取。
- 若不使用 `__syncthreads()`，可能产生 **Read-After-Write 竞争**。

---

### 示例 3：动态共享内存分配

以下代码演示了 **动态共享内存** 的分配方法，大小在核函数调用时通过第三个参数传入。

```cpp
#include <iostream>
#include <cuda_runtime.h>

// 全局设备变量，用于累加结果
__device__ float d_sum = 0.0f;

// 核函数：使用动态共享内存存储线程索引，再原子累加
__global__ void dynamicSharedMemoryKernel(unsigned int ndim) {
    // 动态分配共享内存：extern __shared__ 表示大小由外部调用时指定
    extern __shared__ float shared_array[];

    int tid = threadIdx.x;

    // 将线程索引写入共享内存
    shared_array[tid] = static_cast<float>(tid);

    // 同步确保所有线程完成写入
    __syncthreads();

    // 原子累加到全局设备变量（防止数据竞争）
    atomicAdd(&d_sum, shared_array[tid]);
}

int main() {
    unsigned int ndim = 100;

    dim3 grid(1);          // 1 个 Block
    dim3 block(ndim);      // 100 个线程

    float c_sum = 0.0f;

    // 第三个参数：ndim * sizeof(float) 指定动态共享内存字节数
    dynamicSharedMemoryKernel<<<grid, block, ndim * sizeof(float)>>>(ndim);

    // 错误检查
    cudaError_t err = cudaGetLastError();
    if (err != cudaSuccess) {
        std::cout << "Kernel Error: " << cudaGetErrorString(err) << std::endl;
        return -1;
    }

    cudaDeviceSynchronize();

    // 将结果拷贝回主机
    cudaMemcpyFromSymbol(&c_sum, d_sum, sizeof(float));

    std::cout << "Sum from 0 to 99 = " << c_sum << std::endl;  // 输出：4950

    return 0;
}
```

**执行逻辑说明**：

- `extern __shared__ float shared_array[]` 声明动态共享内存，实际大小由 `<<<grid, block, ndim * sizeof(float)>>>` 的 **第三个参数** 决定。
- 每个线程将自己的 `threadIdx.x` 写入共享内存，经 `__syncthreads()` 同步后，通过 `atomicAdd` 累加到全局变量 `d_sum`。
- 结果应为 **0 + 1 + ... + 99 = 4950**。
- **容量提示**：A100 每 SM 共享内存为 48 KB，若存储 `double`（8 字节），最多支持 `48 * 1024 / 8 = 6144` 个元素。

---

### 示例 4：设备函数（Device Function）

**Device Function**（设备函数）是 GPU 线程执行流中的 **子函数**，用于封装可复用的并行计算逻辑，不能从主机端调用。

```cpp
#include <cuda_runtime.h>

// 设备函数：仅在 GPU 上调用和执行
__device__ float add(float a, float b) {
    return a + b;
}

// 核函数：调用设备函数完成向量加法
__global__ void vectorAdd(const float *A, const float *B, float *C, int numElements) {
    int i = blockDim.x * blockIdx.x + threadIdx.x;
    if (i < numElements) {
        C[i] = add(A[i], B[i]);  // 调用 __device__ 函数
    }
}
```

**执行逻辑说明**：

- `__device__ float add(...)` 定义了一个仅能在 GPU 上调用的辅助函数。
- `__global__ void vectorAdd(...)` 是核函数，从主机端启动，内部调用 `add()` 完成逐元素加法。
- 设备函数 **不能** 从主机代码（CPU 端）直接调用。

---

### 示例 5：常量内存的使用与性能对比

以下代码对比了 `__device__`（全局内存）与 `__constant__`（常量内存）在 **Warp 广播读取** 场景下的差异。

```cpp
#include <cuda_runtime.h>

// 全局内存中的设备变量（无专用缓存，每次访问直接读 DRAM）
__device__ double global_factor = 2.0;

// 常量内存中的变量（拥有专用常量缓存，支持 Warp 广播）
__constant__ double constant_factor = 2.0;

// 核函数：矩阵加法并乘以系数
__global__ void addMatrices(double *a, double *b, double *c, const int n) {
    const int index = blockIdx.x * blockDim.x + threadIdx.x;
    if (index < n) {
        for (int i = 0; i < 100000; ++i) {
            // 使用全局内存变量：每次循环每个线程都发起一次全局内存读取（延迟高）
            // c[index] += (a[index] + b[index]) * global_factor;

            // 使用常量内存变量：同一线程束内所有线程读取同一地址时，
            // 硬件只需从常量缓存读一次，然后广播给所有线程（延迟极低）
            c[index] += (a[index] + b[index]) * constant_factor;
        }
    }
}
```

**执行逻辑说明**：

- `__device__ double global_factor` 存放在 **Global Memory** 中，没有专用缓存，每次访问需直接读取 DRAM（数百个时钟周期）。
- `__constant__ double constant_factor` 存放在 **Constant Memory** 中，拥有 **L1 Constant Cache** 和 **L2 Constant Cache**。当同一线程束（Warp）内所有线程读取同一地址时，硬件只需读取一次并 **广播**，极大降低延迟。
- 常量内存对核函数 **只读**，但主机端可通过 `cudaMemcpyToSymbol` 修改其值。

---

### 示例 6：统一内存（Unified Memory）

以下代码演示了 `cudaMallocManaged` 的基本用法，Host 和 Device 使用同一指针访问内存。

```cpp
#include <cuda_runtime.h>
#include <iostream>

// 核函数：向量加法
__global__ void sumMatrixGPU(float *A, float *B, float *C, int nx, int ny) {
    int ix = blockIdx.x * blockDim.x + threadIdx.x;
    int iy = blockIdx.y * blockDim.y + threadIdx.y;
    int idx = iy * nx + ix;
    if (ix < nx && iy < ny) {
        C[idx] = A[idx] + B[idx];
    }
}

int main() {
    int nxy = 1024;
    int nBytes = nxy * nxy * sizeof(float);

    float *A, *B, *gpuRef;

    // 分配统一内存：Host 和 Device 使用同一指针
    cudaMallocManaged((void**)&A, nBytes);
    cudaMallocManaged((void**)&B, nBytes);
    cudaMallocManaged((void**)&gpuRef, nBytes);

    // 主机端初始化数据
    for (int i = 0; i < nxy * nxy; ++i) {
        A[i] = 1.0f;
        B[i] = 2.0f;
    }

    // 配置执行参数
    dim3 block(16, 16);
    dim3 grid((nxy + block.x - 1) / block.x, (nxy + block.y - 1) / block.y);

    // 启动核函数（直接传入托管内存指针）
    sumMatrixGPU<<<grid, block>>>(A, B, gpuRef, nxy, nxy);

    // 内存栅栏：确保 GPU 完成后，CPU 才能读取最新数据
    cudaDeviceSynchronize();

    // 主机端验证结果
    std::cout << "gpuRef[0] = " << gpuRef[0] << std::endl;  // 应输出 3.0

    // 释放统一内存
    cudaFree(A);
    cudaFree(B);
    cudaFree(gpuRef);

    return 0;
}
```

**执行逻辑说明**：

- `cudaMallocManaged()` 分配的内存对 CPU 和 GPU **透明共享**，无需手动 `cudaMemcpy`。
- **关键同步**：GPU 改写后 CPU 读取前必须调用 `cudaDeviceSynchronize()`，否则 CPU 可能读到旧数据。
- 统一内存简化了编程模型，但底层仍可能发生 **隐式数据迁移** 和 **页错误**，不带来性能优势。

---

## 内存模型对比

### 核心内存类型对比

| 特性 | 寄存器 Register | 共享内存 Shared Memory | 全局内存 Global Memory | 常量内存 Constant Memory |
| :--- | :--- | :--- | :--- | :--- |
| **物理位置** | SM 内部 | SM 片上 SRAM | GPU 片外 DRAM | GPU 片外 DRAM |
| **速度** | 极快（1 周期） | 快（~20-30 周期） | 慢（数百周期） | 较慢（但带缓存广播） |
| **容量** | 极小（~64 KB / Block） | 小（~48-128 KB / SM） | 大（数 GB 到数十 GB） | 有限（通常 64 KB） |
| **可见性** | **线程私有** | **Block 内共享** | **全 GPU 共享** | **全 GPU 只读** |
| **声明方式** | 局部变量自动分配 | `__shared__` | `cudaMalloc` / `__device__` | `__constant__` |
| **生命周期** | 核函数执行期间 | 核函数执行期间 | 显式分配释放 / 程序周期 | 程序周期 |
| **编程控制** | 不可控（编译器管理） | **可编程** | 可编程 | 只读（主机端可写） |

### 同步机制对比

| 函数 | 作用域 | 调用位置 | 功能 |
| :--- | :--- | :--- | :--- |
| `__syncthreads()` | Block 内 | 核函数内 | 线程块内所有线程到达屏障后继续，附带内存栅栏 |
| `cudaDeviceSynchronize()` | 全局 | 主机端 | 阻塞 Host，等待设备端所有先前任务完成 |
| `__threadfence()` | Grid / Block | 核函数内 | 确保内存写操作对 Grid/Block 内其他线程可见 |

### 数据拷贝方式对比

| 方式 | 函数 | 特点 | 适用场景 |
| :--- | :--- | :--- | :--- |
| 显式拷贝 | `cudaMemcpy` | 手动管理，性能可控 | 大规模数据，追求极致性能 |
| 统一内存 | `cudaMallocManaged` | 自动迁移，编程简单 | 快速原型开发，指针结构复杂时 |
| 符号拷贝 | `cudaMemcpyToSymbol` | 针对 `__device__` / `__constant__` | 小量常量/全局变量初始化 |

---

## 常见错误与调试技巧

> [!failure] 错误 1：忘记 `cudaDeviceSynchronize()`
> 在主机端读取 GPU 计算结果前（尤其是使用统一内存时），必须调用 `cudaDeviceSynchronize()`，否则可能拿到未完成的数据。

> [!failure] 错误 2：共享内存越界
> 共享内存容量有限（如 A100 为 48 KB / SM）。若每个 Block 分配过多共享内存，会导致核函数无法启动或隐式退化为全局内存访问。需计算：`max_elements = shared_mem_size / sizeof(data_type)`。

> [!failure] 错误 3：数据竞争（Data Race）
> 多个线程同时读写同一全局内存地址时，必须使用 `atomicAdd` 等原子操作，或通过 `__syncthreads()` + 共享内存分阶段处理，否则结果不确定。

> [!failure] 错误 4：Bank Conflict（存储体冲突）
> 当 Warp 内多个线程同时访问 Shared Memory 的 **同一 Bank** 的不同地址时，会发生 Bank Conflict，导致访问串行化。避免方法：确保线程访问的共享内存地址按特定 stride 分布（如 stride 为 32 的倍数时，需考虑 Bank 数量）。

> [!failure] 错误 5：寄存器溢出（Register Spilling）
> 若内核使用过多局部变量，寄存器不够用，编译器会将数据放入 **Local Memory**（实际在 Global Memory 中），导致性能暴跌。可通过 `__launch_bounds__` 或编译选项控制寄存器使用。

> [!tip] 调试技巧：错误检查宏
> 建议封装如下宏，包裹所有 CUDA API 调用：
>
> ```cpp
> #define cudaCheckError(ans) { gpuAssert((ans), __FILE__, __LINE__); }
> inline void gpuAssert(cudaError_t code, const char *file, int line, bool abort=true) {
>     if (code != cudaSuccess) {
>         fprintf(stderr, "GPUassert: %s %s %d\n", cudaGetErrorString(code), file, line);
>         if (abort) exit(code);
>     }
> }
> // 使用：cudaCheckError(cudaMalloc(...));
> ```

---

## 本节总结

1. **GPU 内存层次**：寄存器（最快，线程私有）-> 共享内存 / L1（快，Block 共享）-> L2（较快，全 GPU）-> 全局内存 / 常量内存 / 纹理内存（慢，DRAM）。
2. **共享内存优化**：通过 `__shared__` 将全局内存数据缓存到片上 SRAM，配合 `__syncthreads()` 同步，可显著降低访存延迟。
3. **原子操作**：`atomicAdd` 等函数保证不可分割的 "读-改-写"，是消除全局/共享内存数据竞争的直接手段。
4. **常量内存优势**：当 Warp 内线程读取同一常量时，通过常量缓存广播，延迟远低于全局内存。
5. **统一内存简化**：`cudaMallocManaged` 让 Host 和 Device 共享指针，但需注意 `cudaDeviceSynchronize()` 同步，且不自动提升性能。
6. **设备函数封装**：`__device__` 函数仅在 GPU 内调用，用于模块化核函数逻辑。

---

## 思考题

1. **为什么 Shared Memory 比 Global Memory 快？** 它们的物理位置差异是什么？
2. **如何计算一维线程的全局索引？** 写出 `tid` 与 `blockIdx.x`、`blockDim.x`、`threadIdx.x` 的关系式。
3. **Bank Conflict 是如何产生的？** 在 32 Bank 的架构下，如何避免？
4. **为什么核函数内不能调用 `malloc`？** GPU 线程的栈和堆管理有何特殊之处？
5. **`cudaDeviceSynchronize()` 与 `__syncthreads()` 的作用域有何不同？** 分别在什么场景下使用？
6. **使用 `__constant__` 内存时，什么情况下性能收益最大？** 如果 Warp 内线程读取不同常量地址，性能会如何变化？
7. **统一内存的 `cudaMallocManaged` 内部是否完全不需要数据拷贝？** 其底层机制是什么？
