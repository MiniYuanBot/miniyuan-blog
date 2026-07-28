---
title: 'GPU 的核函数与线程'
excerpt: '26 春 并行程序设计 L41'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'GPU'
pubDate: 'June 11 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 异构并行与核函数

### 异构并行概述

**异构并行**（**Heterogeneous Parallelism**）是一种并行计算技术，指在计算系统中使用不同类型处理器或加速器（例如 CPU、GPU、FPGA 等）同时执行计算任务。不同处理器根据其特点和优势处理相应任务，从而提高整个系统性能和计算能力。

在 CUDA 编程中，典型的 **CPU-GPU 异构并行流程**如下：

1. **数据拷贝**：将数据从 CPU 内存（**Host Memory**）拷贝到 GPU 显存（**Device Memory**）
2. **核函数调用**：调用核函数对存储在 GPU 显存中的数据进行并行操作
3. **结果回传**：将数据从 GPU 显存传送回 CPU 内存
4. **资源释放**：销毁分配的内存并进行同步

> **注意**：Host（主机）指 CPU 及其内存，Device（设备）指 GPU 及其显存。两者通过 **PCIe**（**Peripheral Component Interconnect Express** - 高速串行计算机扩展总线标准）总线连接。

---

### 核函数定义与执行空间修饰符

核函数（**Kernel Function**）是在 GPU 上运行的特殊类型函数，由 CPU（Host）调用，但在 GPU（Device）上执行。由于 GPU 具有大量的并行处理单元，核函数可以同时处理多个数据元素，从而大幅提高计算性能。

CUDA 使用**执行空间修饰符**来指定函数的运行位置：

| 修饰符 | 英文含义 | 调用位置 | 执行位置 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `__global__` | **global** - 全局的 | Host | Device | 可从 Host 调用并在 Device 上执行的核函数 |
| `__device__` | **device** - 设备端的 | Device | Device | 仅在 GPU 上调用和执行的函数 |
| `__host__` | **host** - 主机端的 | Host | Host | 仅在 CPU 上执行的普通函数，可省略 |

> **核心要点**：以 `__global__` 为标识的函数即为核函数。核函数由 Host 端发起调用，由 Device 端负责执行，**核函数将被每一个发起的 CUDA 线程执行**。

---

### 核函数调用语法

核函数调用使用特殊的**执行配置**（**Execution Configuration** / **Kernel Launch**）语法 `<<< >>>`：

```cpp
kernel_func<<<num_blk, num_thd>>>(param1, param2, ...);
```

- `num_blk`：线程块（**Block**）数量，至少为 1
- `num_thd`：每个线程块中的线程（**Thread**）数量，至少为 1
- 两者可以是字面常量，也可以是变量

---

### Hello World 示例

```cpp
#include <iostream>

using namespace std;

// 定义核函数
__global__ void hello_PKU()
{
    const int index = threadIdx.x;  // 当前线程在其 Block 内的局部编号
    printf("Hello from GPU %d!\n", index);
}

int main()
{
    cout << "Hello from CPU!" << endl;

    int num_blk = 1;  // 设置 1 个 block
    int num_thd = 8;  // 设置 8 个线程

    // 调用核函数
    hello_PKU<<<num_blk, num_thd>>>();

    cudaDeviceReset();  // 释放和清空当前进程中与当前设备有关的所有资源
    return 0;
}
```

**编译与运行**：

```bash
nvcc 01_hello.cu      # 编译 CUDA 程序
./a.out               # 运行可执行文件
```

- `nvcc`（**NVIDIA CUDA Compiler**）是 NVIDIA 专门用于编译 CUDA 代码的命令行编译器，类似于 `mpicxx` 编译 MPI 程序
- `nvcc` 可以编译 CUDA C/C++ 代码，生成 GPU 可执行文件 `a.out`

---

## CUDA 执行模型与线程组织

### Grid、Block 与 Thread 的层级关系

CUDA 采用**三级层级结构**组织并行线程：

| 层级 | 英文全称 | 含义 | 硬件映射 |
| :--- | :--- | :--- | :--- |
| **Grid** | **Grid** - 网格 | 由多个 Block 组成的完整核函数执行空间 | 由多个 SM 组成的完整 GPU |
| **Block** | **Thread Block** - 线程块 | 由多个线程组成的协作执行单元，可共享 Shared Memory | 由 **SM**（**Streaming Multiprocessor** - 流式多处理器，GPU 的核心计算单元）执行 |
| **Thread** | **Thread** - 线程 | CUDA 执行的最小单位，一条完整的指令流 | 由 **SP** / **Core**（**Streaming Processor** / **CUDA Core** - 流处理器 / CUDA 核心，SM 内的基本计算单元）执行 |

**软件工程师视角 vs 硬件工程师视角**：

- **Thread**：最细粒度的独立执行单元，一条完整的指令流
- **Thread Block**：线程的逻辑分组，同一 Block 内线程可共享内存、同步协作
- **Kernel Grid**：整个核函数的所有线程，按 Block 组织成二维/三维网格

---

### 内建变量与线程索引

CUDA 提供以下**内建变量**（**Built-in Variables**）用于线程定位：

| 变量 | 英文构成 | 含义 |
| :--- | :--- | :--- |
| `threadIdx` | **thread index** - 线程索引 | 当前线程在其 Block 内的局部编号 |
| `blockIdx` | **block index** - 块索引 | 当前 Block 在 Grid 内的全局编号 |
| `blockDim` | **block dimension** - 块维度 | 每个 Block 在 x/y/z 方向上的线程数 |
| `gridDim` | **grid dimension** - 网格维度 | Grid 在 x/y/z 方向上的 Block 总数 |

每个变量都有 `.x`、`.y`、`.z` 三个维度属性，因此线程组织可以是一维（处理向量）、二维（处理图像）或三维（处理三维结构）。

---

### 全局线程 ID 计算

**一维情况**（最常用）：

```cpp
const int index = blockIdx.x * blockDim.x + threadIdx.x;
```

**三维情况**：

```cpp
int i = (blockIdx.x * blockDim.x) + threadIdx.x;
int j = (blockIdx.y * blockDim.y) + threadIdx.y;
int k = (blockIdx.z * blockDim.z) + threadIdx.z;
```

> **公式**：线程的全局 ID = 线程块 ID × 线程块的线程数量 + 线程块里的线程 ID

---

### dim3 类型与三维执行配置

`dim3` 是 NVIDIA 的 CUDA 编程中一种自定义的整型向量类型，用于定义 Grid 和 Block 的三维维度。

```cpp
#include <iostream>

__global__ void hello_PKU()
{
    int i = (blockIdx.x * blockDim.x) + threadIdx.x;
    int j = (blockIdx.y * blockDim.y) + threadIdx.y;
    int k = (blockIdx.z * blockDim.z) + threadIdx.z;

    printf("blockIdx (%d %d %d) threadIdx (%d %d %d)\n",
           blockIdx.x, blockIdx.y, blockIdx.z,
           threadIdx.x, threadIdx.y, threadIdx.z);
    printf("global_id %d %d %d\n", i, j, k);
}

int main()
{
    dim3 grid(1, 1, 3);   // Grid: 1×1×3 个 Block
    dim3 block(2, 2, 1);  // Block: 2×2×1 个 Thread

    hello_PKU<<<grid, block>>>();
    cudaDeviceSynchronize();
    return 0;
}
```

**输出结果**（共 12 个线程）：

```
blockIdx (0 0 2) threadIdx (0 0 0)
blockIdx (0 0 2) threadIdx (1 0 0)
...
global_id 0 0 2
global_id 1 0 2
...
```

---

## CUDA Runtime API 详解

### 设备内存管理

| API 函数 | 英文全称 | 功能说明 |
| :--- | :--- | :--- |
| `cudaMalloc()` | **CUDA Memory Allocate** | 在设备端（GPU）分配全局内存 |
| `cudaFree()` | **CUDA Free** | 释放设备端分配的内存 |
| `cudaMemcpy()` | **CUDA Memory Copy** | 在 Host 与 Device 之间，或 Device 之间拷贝数据 |
| `cudaDeviceSynchronize()` | **CUDA Device Synchronize** | 阻塞 Host，直到设备端所有先前任务完成 |
| `cudaDeviceReset()` | **CUDA Device Reset** | 释放和清空当前进程中与当前设备有关的所有资源 |

---

### cudaMalloc 函数原型

```cpp
cudaError_t cudaMalloc(void** devPtr, size_t size);
```

- `void** devPtr`：指向指针的指针，用于存储分配的设备内存地址。传递指针地址而非指针本身，因为 `cudaMalloc` 需要修改指针值
- `size_t size`：分配的内存字节大小（如 `10 * sizeof(float)`）
- 返回值 `cudaError_t`：枚举类型，`cudaSuccess` 表示成功

---

### cudaMemcpy 传输方向

```cpp
cudaMemcpy(dev_a, host_a, nbytes, cudaMemcpyHostToDevice);   // Host -> Device
cudaMemcpy(host_c, dev_c, nbytes, cudaMemcpyDeviceToHost);   // Device -> Host
```

| 方向常量 | 含义 |
| :--- | :--- |
| `cudaMemcpyHostToDevice` | 从主机内存拷贝到设备显存 |
| `cudaMemcpyDeviceToHost` | 从设备显存拷贝到主机内存 |
| `cudaMemcpyDeviceToDevice` | 设备显存之间的拷贝 |

---

### 核函数参数传递规则

- **参数类型**：应该是基本数据类型（如 `int`、`float`、`double` 等）或**指向设备内存的指针**。不要使用 C++ 类或结构体，因为它们可能在 CPU 和 GPU 之间有不同的内存布局和对齐方式
- **传值方式**：基本类型通过值传递，在 kernel 中修改参数值不会影响原始值；指针类型传递的是设备内存地址，修改指针指向的值会影响原始数据
- **设备内存分配**：传递指针前需先用 `cudaMalloc` 分配设备内存，执行完成后用 `cudaMemcpy` 拷贝回主机，并用 `cudaFree` 释放

---

### 标准 Host-Device 数据流示例

```cpp
// 1) 主机端分配内存
double *host_a = new double[nelem];
double *host_b = new double[nelem];
double *host_c = new double[nelem];

// 2) 初始化数据
// ...

// 3) 设备端分配内存
double *dev_a, *dev_b, *dev_c;
size_t nbytes = nelem * sizeof(double);
cudaMalloc((double**)&dev_a, nbytes);
cudaMalloc((double**)&dev_b, nbytes);
cudaMalloc((double**)&dev_c, nbytes);

// 4) Host -> Device 拷贝数据
cudaMemcpy(dev_a, host_a, nbytes, cudaMemcpyHostToDevice);
cudaMemcpy(dev_b, host_b, nbytes, cudaMemcpyHostToDevice);

// 5) 调用核函数
dim3 grid_dim((nelem + 255) / 256);
dim3 block_dim(256);
add_matrices<<<grid_dim, block_dim>>>(dev_a, dev_b, dev_c, nelem);

// 6) 同步等待 GPU 完成
cudaDeviceSynchronize();

// 7) Device -> Host 拷贝结果
cudaMemcpy(host_c, dev_c, nbytes, cudaMemcpyDeviceToHost);

// 8) 释放设备内存
cudaFree(dev_a);
cudaFree(dev_b);
cudaFree(dev_c);

// 9) 释放主机内存
delete[] host_a;
delete[] host_b;
delete[] host_c;
```

---

## 矩阵加法完整示例

### 一维版本（04_matrix_add.cu）

```cpp
#include <iostream>
#include <iomanip>
#include <fstream>

// 从 CPU 读入矩阵的函数
void read_host_data(double *array_in, const int ndata, const std::string &filename)
{
    std::ifstream ifs(filename.c_str());
    if (!ifs)
    {
        std::cout << "cannot find the file: " << filename << std::endl;
        exit(0);
    }
    for (int i = 0; i < ndata; ++i)
    {
        ifs >> array_in[i];
    }
    ifs.close();
}

// 核函数：每个线程处理一个元素
__global__ void add_matrices(double *a, double *b, double *c, const int n)
{
    const int index = threadIdx.x;  // 仅使用一维线程索引
    c[index] = a[index] + b[index];
    printf("Hello from GPU %d!\n", index);
}

int main()
{
    // 初始化、内存分配、拷贝、调用核函数、拷贝回、释放...
    return 0;
}
```

---

### dim3 升级版（05_dim3_matadd.cu）

```cpp
#include <iostream>
#include <iomanip>
#include <fstream>

// 核函数：每个线程对向量 a 和 b 做 100 次加法
__global__ void add_matrices(double *a, double *b, double *c, const int n)
{
    const int index = blockIdx.x * blockDim.x + threadIdx.x;
    if (index < n)
    {
        for (int i = 0; i < 100; ++i)
        {
            c[index] += a[index] + b[index];
        }
    }
}

int main()
{
    const int nelem = 4096;
    const size_t nbytes = nelem * sizeof(double);

    // 主机内存分配与初始化
    double *host_a = new double[nelem];
    double *host_b = new double[nelem];
    double *host_c = new double[nelem];
    for (int i = 0; i < nelem; ++i)
    {
        host_a[i] = 1.0;
        host_b[i] = 1.0;
        host_c[i] = 0.0;
    }

    // 设备内存分配
    double *dev_a, *dev_b, *dev_c;
    cudaMalloc((double**)&dev_a, nbytes);
    cudaMalloc((double**)&dev_b, nbytes);
    cudaMalloc((double**)&dev_c, nbytes);

    // Host -> Device
    cudaMemcpy(dev_a, host_a, nbytes, cudaMemcpyHostToDevice);
    cudaMemcpy(dev_b, host_b, nbytes, cudaMemcpyHostToDevice);

    // 执行配置：16 个 Block，每个 Block 256 个线程
    dim3 grid_dim((nelem + 255) / 256);
    dim3 block_dim(256);

    // 调用核函数
    add_matrices<<<grid_dim, block_dim>>>(dev_a, dev_b, dev_c, nelem);
    cudaDeviceSynchronize();

    // Device -> Host
    cudaMemcpy(host_c, dev_c, nbytes, cudaMemcpyDeviceToHost);

    // 输出结果到文件
    std::ofstream ofs("output.dat");
    for (int i = 0; i < nelem; ++i)
    {
        ofs << std::setw(10) << host_c[i];
        if ((i + 1) % 8 == 0) ofs << std::endl;
    }
    ofs.close();

    // 释放资源
    cudaFree(dev_a);
    cudaFree(dev_b);
    cudaFree(dev_c);
    delete[] host_a;
    delete[] host_b;
    delete[] host_c;

    return 0;
}
```

**计算说明**：
- 对 4096 长度的数组进行相加
- 采用 `4096 / 256 = 16` 个 Blocks
- 每个 Block 采用 256 个线程
- 每个线程根据自己的全局线程号 `index` 对数组中的第 `index` 号元素进行 100 次 `c = a + b` 计算
- `a` 和 `b` 初始值均为 1，因此每个元素最终结果为 `200`

---

## CPU 与 GPU 线程对比

| 对比维度 | CPU 线程 | GPU 线程 |
| :--- | :--- | :--- |
| **设计目的** | 处理各种通用计算任务 | 主要针对图形处理和并行计算 |
| **执行模型** | 独立执行，可单独运行任务；通信同步需复杂机制（如互斥锁） | 以 **Warp**（**Warp** - 线程束，32 个线程组成的执行单位，同一 Warp 内线程以 **SIMT** 方式执行）为单位执行；通信同步使用共享内存和屏障 |
| **资源分配** | 专用寄存器和缓存 | 共享内存、寄存器和缓存；Block 内线程共享 **Shared Memory**（**SMem**） |
| **线程数量** | 较少（4-32 核心） | 上千核心，成千上万个线程 |
| **灵活性** | 高，可处理各种任务和指令 | 较低，通常处理特定类型的并行任务 |
| **能效** | 复杂顺序任务性能高 | 大量并行任务能效更高 |

---

## 常见错误与注意事项

> **错误 1**：核函数内使用 `threadIdx.x` 直接访问全局数组，但当数据量超过一个 Block 的线程数时，会遗漏数据。应使用全局线程 ID：`blockIdx.x * blockDim.x + threadIdx.x`。

> **错误 2**：`cudaMalloc` 的第一个参数需要传递指针的地址（`&dev_ptr`），并进行类型转换（`(double**)&dev_ptr`），而非直接传递指针。

> **错误 3**：核函数参数中的指针必须指向**设备内存**（通过 `cudaMalloc` 分配的地址），不能直接使用主机内存指针。

> **错误 4**：不同 Block 之间的线程**无法直接同步**。`__syncthreads()` 只能同步同一个 Block 内的线程。

> **注意**：`cudaDeviceSynchronize()` 与 `__syncthreads()` 的作用域不同：
> - `cudaDeviceSynchronize()`：Host 端函数，阻塞 CPU 直到 GPU 所有任务完成
> - `__syncthreads()`：Device 端函数，同步**同一个 Block 内**的所有线程

---

## 本节总结

- **异构并行**是 CPU 负责调度控制、GPU 负责密集计算的分工协作模式
- `nvidia-smi` 用于查看 GPU 状态、显存占用、CUDA 版本和驱动信息
- `nvcc` 是 NVIDIA 专门编译 CUDA 代码的编译器
- `__global__` 修饰的核函数由 Host 调用、Device 执行，通过 `<<< >>>` 执行配置指定 Grid 和 Block 维度
- **线程全局 ID** = `blockIdx.x * blockDim.x + threadIdx.x`
- `dim3` 支持三维线程组织，适用于向量、图像、三维结构等不同任务
- 标准 CUDA 程序遵循"分配 -> 拷贝入 -> 执行 -> 同步 -> 拷贝出 -> 释放"的流程

---

## 思考题

1. 为什么 GPU 线程数量远多于 CPU，却更适合并行计算而非通用任务？
2. 如何计算二维线程组织下的全局线程索引？若 `blockDim = (16, 16, 1)`，写出二维全局 ID 公式。
3. 如果核函数中只使用 `threadIdx.x` 而不使用 `blockIdx.x`，当数据量超过 1024 时会发生什么？
4. `cudaDeviceSynchronize()` 与 `__syncthreads()` 的作用域有何不同？分别在什么场景下使用？
5. 为什么核函数参数中的指针必须先通过 `cudaMalloc` 分配设备内存？
6. 在矩阵加法示例中，为什么使用 `dim3 grid_dim((nelem + 255) / 256)` 而不是 `dim3 grid_dim(nelem / 256)`？
