---
title: 'CUDA 的流和事件'
excerpt: '26 春 并行程序设计 L45'
author: 'miniyuan'
position: 'Beijing'
tags:
- '并行程序设计'
- 'GPU'
- 'CUDA'
pubDate: 'June 15 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## 流 Stream

### 概念解释

`cudaStream_t`（**CUDA Stream Type** - CUDA 流类型）是 CUDA 编程模型中的一个抽象句柄，代表一个**序列化的操作队列**。流中的操作（如内存传输、核函数执行等）按照它们被添加到流中的**顺序依次执行**。不同流之间的操作则可以**并行执行**，从而显著提高 GPU 利用率。

如果没有显式创建流，所有操作都会默认在一个特殊的流中执行，称为**默认流（Default Stream / Zero Stream / Null Stream）**。默认流中的操作是**同步阻塞**的，会阻塞主机端执行直到 GPU 操作完成。

> **最佳实践提示**：对于需要最大化吞吐量的应用，应显式创建多个非默认流，将独立任务分配到不同流中，以实现计算与数据传输的流水线重叠。

### 核心 API 详解

| API 函数 | 英文释义 | 功能说明 |
| :--- | :--- | :--- |
| `cudaStreamCreate(&stream)` | **CUDA Stream Create** - 创建 CUDA 流 | 初始化一个新的非默认流，返回句柄 `cudaStream_t` |
| `cudaStreamDestroy(stream)` | **CUDA Stream Destroy** - 销毁 CUDA 流 | 释放流占用的资源，需在流内所有任务完成后调用 |
| `cudaStreamSynchronize(stream)` | **CUDA Stream Synchronize** - 流同步 | **阻塞主机线程**，直到指定流中**所有先前提交的任务**执行完毕 |
| `cudaDeviceSynchronize()` | **CUDA Device Synchronize** - 设备同步 | **阻塞主机线程**，直到**整个设备**上所有流的所有任务完成 |
| `cudaMemcpyAsync(..., stream)` | **CUDA Memory Copy Async** - 异步内存拷贝 | 在指定流中发起异步数据传输，**不阻塞主机** |

### 异步数据传输

`cudaMemcpyAsync()`（**CUDA Memory Copy Async** - 异步内存拷贝）与同步的 `cudaMemcpy()` 的关键区别在于：

- `cudaMemcpy()`：**阻塞主机线程**，直到传输完成才返回
- `cudaMemcpyAsync()`：**立即返回**，将传输操作放入指定流的队列中异步执行

使用 `cudaMemcpyAsync` 的前提条件：

- 主机内存必须是 **Pinned Memory（Page-Locked Memory）**（页锁定内存，不可被操作系统换出，支持高速 DMA 传输）
- 必须指定一个有效的 `cudaStream_t` 流对象

> **常见错误**：若主机内存未使用 `cudaMallocHost()` 或 `cudaHostAlloc()` 分配为 Pinned Memory，`cudaMemcpyAsync` 可能隐式同步或报错。

### 代码示例：单流异步执行

```cpp
// 核函数：每个线程对数组元素做无操作循环（仅用于耗时演示）
__global__ void kernel(double* array, int array_len)
{
    int thd = blockIdx.x * blockDim.x + threadIdx.x;  // 全局线程索引
    int num_iters = array_len / blockDim.x;
    for (int j = 0; j < num_iters; ++j) {
        int i = j * blockDim.x + thd;
        for (int k = 0; k < 1000; ++k) {
            array[i] *= 10.0;
            array[i] /= 10.0;  // 保持数值不变，仅产生计算负载
        }
    }
}

int main()
{
    int array_len = 1024 * 1024;
    int size = array_len * sizeof(double);

    // Host 端内存分配与初始化
    double* array = (double*)malloc(size);
    for (int i = 0; i < array_len; i++) {
        array[i] = 1.0;
    }

    // Device 端显存分配
    double* d_array = nullptr;
    cudaMalloc(&d_array, size);

    // 创建 CUDA 流
    cudaStream_t stream;
    cudaStreamCreate(&stream);

    // 异步拷贝：Host -> Device（放入 stream 队列）
    cudaMemcpyAsync(d_array, array, size, cudaMemcpyHostToDevice, stream);

    // 在 stream 中启动核函数（<<<1, 128, 0, stream>>>）
    // 1: gridDim.x, 128: blockDim.x, 0: sharedMem, stream: 目标流
    kernel<<<1, 128, 0, stream>>>(d_array, array_len);

    // 流同步：阻塞主机，直到 stream 中所有任务完成
    cudaStreamSynchronize(stream);

    // 清理资源
    cudaFree(d_array);
    free(array);
    cudaStreamDestroy(stream);

    return 0;
}
```

**执行流程说明**：

1. `cudaStreamCreate` 创建新流
2. `cudaMemcpyAsync` 将 H2D 拷贝任务入队到 `stream`
3. `kernel<<<...stream>>>` 将核函数入队到 `stream`（**流内顺序保证**：拷贝完成后才会执行 kernel）
4. `cudaStreamSynchronize` 阻塞主机等待流完成
5. 销毁流释放资源

---

## 多流并行与计算传输重叠

### 概念解释

当任务之间**没有数据依赖**时，可以将它们分配到**不同的流**中。不同流的操作由 CUDA 驱动调度，在硬件资源允许的情况下**并发执行**。

典型的重叠场景：

- **Stream 1**：拷贝数据 A 到 GPU -> 执行 Kernel A -> 拷贝结果 A 回 CPU
- **Stream 2**：拷贝数据 B 到 GPU -> 执行 Kernel B -> 拷贝结果 B 回 CPU

在支持 **Hyper-Q** 的 GPU 架构上，多个流可以真正实现并发；在较早架构上，不同流的操作也可能被序列化，但仍优于默认流的完全串行。

### 代码示例：双流并行（数据分块）

```cpp
// 保持与单流示例相同的核函数
__global__ void kernel(double* array, int array_len);

int main()
{
    int array_len = 1024 * 512;  // 数据量减半，准备分两份
    int size = array_len * sizeof(double);

    // Host 端分配两个数组
    double* array1 = (double*)malloc(size);
    double* array2 = (double*)malloc(size);
    for (int i = 0; i < array_len; i++) {
        array1[i] = 1.0;
        array2[i] = 1.0;
    }

    // Device 端分配两份显存
    double* d_array1 = nullptr;
    double* d_array2 = nullptr;
    cudaMalloc(&d_array1, size);
    cudaMalloc(&d_array2, size);

    // 创建两个流
    cudaStream_t stream1, stream2;
    cudaStreamCreate(&stream1);
    cudaStreamCreate(&stream2);

    // Stream 1 处理数据 1
    cudaMemcpyAsync(d_array1, array1, size, cudaMemcpyHostToDevice, stream1);
    kernel<<<1, 128, 0, stream1>>>(d_array1, array_len);
    cudaMemcpyAsync(array1, d_array1, size, cudaMemcpyDeviceToHost, stream1);

    // Stream 2 处理数据 2（与 Stream 1 并行执行）
    cudaMemcpyAsync(d_array2, array2, size, cudaMemcpyHostToDevice, stream2);
    kernel<<<1, 128, 0, stream2>>>(d_array2, array_len);
    cudaMemcpyAsync(array2, d_array2, size, cudaMemcpyDeviceToHost, stream2);

    // 同步两个流
    cudaStreamSynchronize(stream1);
    cudaStreamSynchronize(stream2);

    // 清理
    cudaFree(d_array1);
    cudaFree(d_array2);
    free(array1);
    free(array2);
    cudaStreamDestroy(stream1);
    cudaStreamDestroy(stream2);

    return 0;
}
```

**执行时间对比**：

| 模式 | 数据量 | 执行方式 | 典型耗时 |
| :--- | :--- | :--- | :--- |
| 单流串行 | 1024×1024 | 传输 -> 计算 | ~3.2s |
| 双流并行 | 2 × (1024×512) | 传输1∥传输2 -> 计算1∥计算2 | ~1.6s |

> **结果分析**：双流模式下，两个流的 H2D 拷贝和 Kernel 计算可以**重叠执行**，总耗时接近单流的一半，实现了近 **2× 的加速比**。

### 单流 vs 多流 时间线对比

```
单流串行（例1）：
[==== 传输数据 1024×1024 ====][======== 执行 Kernel ========]

双流并行（例2）：
[==== 传输数据 1024×512 ====][=== 执行 Kernel ===]
     [==== 传输数据 1024×512 ====][=== 执行 Kernel ===]
```

---

## 事件 Event

### 概念解释

`cudaEvent_t`（**CUDA Event Type** - CUDA 事件类型）是依附于 CUDA 流的**GPU 侧标记点**，本质是一个轻量级的同步原语。它运行在 **GPU 时钟域** 中，因此可以精确测量 GPU 指令的真实耗时，避免 CPU 与 GPU 时钟不同步带来的误差。

### 事件的核心功能

1. **GPU 运行耗时统计**：精确计算核函数或内存拷贝的真实 GPU 耗时（毫秒级）
2. **流同步控制**：替代 `cudaDeviceSynchronize()` 的全局阻塞，实现**细粒度的流级同步**
3. **任务依赖编排**：通过 `cudaStreamWaitEvent` 实现**跨流依赖**，让某个流等待另一个流中的事件完成后再继续

### 核心 API 详解

| API 函数 | 英文释义 | 功能说明 |
| :--- | :--- | :--- |
| `cudaEventCreate(&event)` | **CUDA Event Create** - 创建事件 | 初始化一个 GPU 事件对象 |
| `cudaEventDestroy(event)` | **CUDA Event Destroy** - 销毁事件 | 释放事件资源 |
| `cudaEventRecord(event, stream)` | **CUDA Event Record** - 记录事件 | 在指定流中插入一个标记点；当流执行到此处时，事件被标记为"完成" |
| `cudaEventSynchronize(event)` | **CUDA Event Synchronize** - 事件同步 | **阻塞主机线程**，直到事件被标记完成 |
| `cudaEventElapsedTime(&ms, start, stop)` | **CUDA Event Elapsed Time** - 计算事件间隔 | 计算两个事件之间的时间差，**单位毫秒** |
| `cudaStreamWaitEvent(stream, event, flags)` | **CUDA Stream Wait Event** - 流等待事件 | 使 `stream` 暂停，直到 `event` 完成后才继续执行后续任务 |

> **注意事项**：`cudaEventElapsedTime` 的两个事件必须属于同一个 CUDA Context，且都已被 `cudaEventRecord` 标记。

### 代码示例：使用 Event 精确计时

```cpp
// 创建开始和结束事件
cudaEvent_t start, stop;
cudaEventCreate(&start);
cudaEventCreate(&stop);

float time_div, time_eff;

// ========== 计时有分支发散的核函数 ==========
cudaEventRecord(start, 0);  // 在默认流中记录开始事件
divergent_branch_kernel<<<gridSize, blockSize>>>(d_input, d_output, size);
cudaEventRecord(stop, 0);   // 在默认流中记录结束事件
cudaEventSynchronize(stop); // 阻塞主机，等待 stop 事件完成
cudaEventElapsedTime(&time_div, start, stop);  // 计算耗时（ms）

// ========== 计时优化后的核函数 ==========
cudaEventRecord(start, 0);
warp_efficient_kernel<<<gridSize, blockSize>>>(d_input, d_output, size);
cudaEventRecord(stop, 0);
cudaEventSynchronize(stop);
cudaEventElapsedTime(&time_eff, start, stop);

printf("Divergent kernel time: %.3f ms\n", time_div);
printf("Efficient kernel time: %.3f ms\n", time_eff);
printf("Speedup: %.2fx\n", time_div / time_eff);

// 清理事件
cudaEventDestroy(start);
cudaEventDestroy(stop);
```

**计时结果示例**：

```
Performance Result
Divergent kernel time: 0.279 ms
Efficient kernel time: 0.208 ms
Speedup: 1.34x
```

> **结论**：通过 `fmaxf()` 消除 `if-else` 分支发散后，核函数性能提升 **1.34×**。这说明 **Warp Divergence（分支发散）** 对 GPU 效率有显著影响。

---

## 跨流依赖：Event 实现流间同步

### 概念解释

在多流编程中，有时流 B 的操作**依赖于**流 A 的某个前置任务完成。例如：

- **Stream 1**：负责将数据从 CPU 拷贝到 GPU
- **Stream 2**：负责在 GPU 上执行核函数计算

此时 Stream 2 的核函数必须等待 Stream 1 的拷贝完成后才能启动。这种**跨流依赖**可以通过 `cudaEventRecord` + `cudaStreamWaitEvent` 组合实现，而无需全局阻塞。

### 代码示例：Event 驱动的流间依赖

```cpp
#include <cuda_runtime.h>
#include <iostream>
#include <cstdlib>

// 统一 CUDA 错误检查宏
#define CHECK_CUDA_ERROR(err) \
    do { \
        if (err != cudaSuccess) { \
            std::cerr << "CUDA Error: " << cudaGetErrorString(err) \
                      << " at line " << __LINE__ << std::endl; \
            std::exit(EXIT_FAILURE); \
        } \
    } while(0)

// 简单核函数：每个线程对元素 +5
__global__ void kernel(int* devPtr)
{
    const int tid = threadIdx.x;
    devPtr[tid] += 5;
}

int main()
{
    const size_t numElements = 1024;
    const size_t size = numElements * sizeof(int);

    // 1. 分配并初始化主机内存（Pinned Memory 更优，此处简化）
    int* h_data = static_cast<int*>(std::malloc(size));
    for (size_t i = 0; i < numElements; ++i) {
        h_data[i] = static_cast<int>(i);
    }

    // 2. 分配设备显存
    int* d_data = nullptr;
    CHECK_CUDA_ERROR(cudaMalloc(&d_data, size));

    // 3. 创建两个 CUDA 流
    cudaStream_t stream1, stream2;
    CHECK_CUDA_ERROR(cudaStreamCreate(&stream1));
    CHECK_CUDA_ERROR(cudaStreamCreate(&stream2));

    // 4. 创建 CUDA 事件（用于标记 stream1 的拷贝完成）
    cudaEvent_t event;
    CHECK_CUDA_ERROR(cudaEventCreate(&event));

    // 5. Stream 1: 主机 -> 设备 异步拷贝
    CHECK_CUDA_ERROR(cudaMemcpyAsync(d_data, h_data, size,
                                     cudaMemcpyHostToDevice, stream1));

    // 6. 在 stream1 中记录事件，标记拷贝完成
    CHECK_CUDA_ERROR(cudaEventRecord(event, stream1));

    // 7. Stream 2 等待 event 完成后，再执行核函数
    // 保证数据就绪后才启动计算
    CHECK_CUDA_ERROR(cudaStreamWaitEvent(stream2, event, 0));

    // 8. Stream 2 启动核函数（此时数据已拷贝完成）
    kernel<<<1, numElements, 0, stream2>>>(d_data);
    CHECK_CUDA_ERROR(cudaGetLastError());  // 检查核函数启动错误

    // 9. Stream 1: 设备 -> 主机 异步回拷（可与 stream2 的 kernel 重叠）
    CHECK_CUDA_ERROR(cudaMemcpyAsync(h_data, d_data, size,
                                     cudaMemcpyDeviceToHost, stream1));

    // 10. 同步两个流
    CHECK_CUDA_ERROR(cudaStreamSynchronize(stream1));
    CHECK_CUDA_ERROR(cudaStreamSynchronize(stream2));

    // 11. 结果校验
    bool pass = true;
    for (size_t i = 0; i < numElements; ++i) {
        if (h_data[i] != static_cast<int>(i) + 5) {
            std::cerr << "Mismatch at index " << i << std::endl;
            pass = false;
            break;
        }
    }
    if (pass) {
        std::cout << "Results correct!" << std::endl;
    }

    // 12. 统一释放资源
    std::free(h_data);
    CHECK_CUDA_ERROR(cudaFree(d_data));
    CHECK_CUDA_ERROR(cudaStreamDestroy(stream1));
    CHECK_CUDA_ERROR(cudaStreamDestroy(stream2));
    CHECK_CUDA_ERROR(cudaEventDestroy(event));

    return pass ? EXIT_SUCCESS : EXIT_FAILURE;
}
```

**依赖关系图解**：

```
Stream 1: [H2D 拷贝] ----[Event Record]----[D2H 回拷]
                                │
                                │ cudaStreamWaitEvent
                                ▼
Stream 2:                      [Kernel 计算]
```

> **关键点**：`cudaStreamWaitEvent(stream2, event, 0)` 使得 Stream 2 在 Event 完成前暂停，实现了**细粒度的跨流同步**，而不影响 Stream 1 中后续的回拷操作。

---

## 多 GPU 编程

### 概念解释

现代计算节点可能配备**多块 GPU**。CUDA 提供了设备管理 API，允许程序在运行时检测 GPU 数量、切换当前操作的 GPU，并为每块 GPU 创建独立的流。

| API 函数 | 英文释义 | 功能说明 |
| :--- | :--- | :--- |
| `cudaGetDeviceCount(&count)` | **CUDA Get Device Count** - 获取设备数量 | 返回系统中可用的 GPU 数量 |
| `cudaSetDevice(dev_id)` | **CUDA Set Device** - 设置当前设备 | 将当前线程的 CUDA Context 切换到指定 GPU |
| `cudaDeviceReset()` | **CUDA Device Reset** - 重置设备 | 销毁当前 GPU 上的所有流、事件和内存分配 |

> **重要规则**：`cudaStreamCreate` 创建的流**绑定到当前设备**。切换设备后，必须重新创建流，不能跨设备复用流句柄。

### 代码示例：双 GPU + 双流

```cpp
#include <cuda_runtime.h>
#include <iostream>

__global__ void hello(int gpu_id)
{
    printf("GPU %d | Thread %d: Hello\n", gpu_id, threadIdx.x);
}

int main()
{
    int dev_num;
    cudaGetDeviceCount(&dev_num);
    if (dev_num < 2) {
        std::cerr << "Need at least 2 GPUs!" << std::endl;
        return -1;
    }
    std::cout << "Detect " << dev_num << " GPUs\n\n";

    // 为 GPU 0 和 GPU 1 分别创建流
    cudaStream_t stream0, stream1;

    // 操作 GPU 0
    cudaSetDevice(0);
    cudaStreamCreate(&stream0);
    hello<<<1, 4, 0, stream0>>>(0);  // 4 个线程

    // 操作 GPU 1
    cudaSetDevice(1);
    cudaStreamCreate(&stream1);
    hello<<<1, 4, 0, stream1>>>(1);

    // 分别同步两个 GPU 的流
    cudaSetDevice(0);
    cudaStreamSynchronize(stream0);
    cudaSetDevice(1);
    cudaStreamSynchronize(stream1);

    // 销毁流
    cudaStreamDestroy(stream0);
    cudaStreamDestroy(stream1);

    // 重置设备
    cudaSetDevice(0);
    cudaDeviceReset();
    cudaSetDevice(1);
    cudaDeviceReset();

    return 0;
}
```

**运行结果**：

```
Detect 2 GPUs

GPU 0 | Thread 0: Hello
GPU 0 | Thread 1: Hello
GPU 0 | Thread 2: Hello
GPU 0 | Thread 3: Hello
GPU 1 | Thread 0: Hello
GPU 1 | Thread 1: Hello
GPU 1 | Thread 2: Hello
GPU 1 | Thread 3: Hello
```

---

## 常见错误与调试技巧

> **错误 1**：`cudaMemcpyAsync` 使用普通 `malloc` 分配的内存，导致隐式同步或段错误。
> **解决**：使用 `cudaMallocHost()` 或 `cudaHostAlloc()` 分配 **Pinned Memory**。

> **错误 2**：核函数调用后未检查错误，导致后续 `cudaMemcpy` 失败时难以定位问题。
> **解决**：在 `kernel<<<...>>>` 后调用 `cudaGetLastError()` 检查启动错误。

> **错误 3**：在默认流中混合使用同步和异步操作，导致意外的全局阻塞。
> **解决**：显式创建非默认流，避免依赖默认流的隐式同步行为。

> **错误 4**：多 GPU 编程时，流句柄跨设备使用。
> **解决**：每块 GPU 独立创建流，切换设备后不复用其他设备的流。

> **错误 5**：`cudaEventElapsedTime` 计算结果为负值或极大值。
> **解决**：确保两个事件都已通过 `cudaEventSynchronize` 或 `cudaStreamSynchronize` 完成。

---

## 本节总结

| 概念 | 核心要点 |
| :--- | :--- |
| **Stream** | 序列化操作队列，同流顺序执行，异流可并行 |
| **Default Stream** | 零流，同步阻塞，会隐式与所有非默认流同步 |
| **cudaMemcpyAsync** | 异步传输，需 Pinned Memory + 指定流 |
| **Event** | GPU 侧标记点，用于精确计时和跨流依赖 |
| **cudaStreamWaitEvent** | 实现流间同步，不阻塞主机 |
| **多 GPU** | 通过 `cudaSetDevice` 切换，`cudaGetDeviceCount` 检测 |

### 思考题

1. **为什么 `cudaMemcpyAsync` 需要 Pinned Memory？** 操作系统页换出机制会阻止 DMA 直接访问可换页内存，Pinned Memory 锁定物理页，允许 GPU 直接 DMA 传输。

2. **单流 vs 多流的加速上限由什么决定？** 由 GPU 的 **Copy Engine（拷贝引擎）** 和 **Compute Unit（计算单元）** 的独立性与数量决定。若 GPU 只有单个 Copy Engine，多流的 H2D 拷贝仍可能串行，但拷贝与计算仍可重叠。

3. **`cudaStreamSynchronize` 与 `cudaDeviceSynchronize` 的区别？** 前者仅阻塞指定流，后者阻塞整个设备的所有流。在多流程序中应优先使用前者以减少不必要的等待。

4. **为什么 `cudaEvent` 比 CPU 计时器更精确？** `cudaEvent` 运行在 GPU 时钟域，直接记录 GPU 指令的完成时间，避免了 CPU 与 GPU 异步执行带来的测量误差。

5. **多 GPU 编程中，流能否跨设备共享？** **不能**。`cudaStream_t` 绑定到创建时的 CUDA Context（即特定 GPU），切换设备后必须重新创建流。
