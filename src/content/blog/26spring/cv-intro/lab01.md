---
title: '传统视觉'
excerpt: '26 春 计算机视觉导论 Lab1'
author: 'miniyuan'
position: 'Beijing'
tags:
- 'cv'
- '计算机视觉'
pubDate: 'March 29 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## Task 1

测试时创建 result 文件夹

一定要注意 y 轴向下啊啊啊啊！！！www

有白边似乎是正常情况，需要将 gaussian 换成 replicate

```python
def cross_correlation_naive(img, kernel, padding=False):
    """
    使用 for 循环的相关性计算（不翻转kernel）

    Parameters:
    -----------
    img: array(float)
        输入图像
    kernel: array(float)
        卷积核
    padding: bool
        False - valid卷积，输出尺寸 (H-K+1, W-K+1)
        True - zero padding，输出尺寸与输入相同 (H, W)

    Returns:
    --------
    output: array(float)
        相关计算结果
    """
    H, W = img.shape
    K = kernel.shape[0]

    if not padding:
        # valid卷积：不填充，输出缩小
        H_out = H - K + 1
        W_out = W - K + 1
        padded_img = img.copy()

    else:
        # zero padding：填充0，输出尺寸不变
        H_out = H
        W_out = W
        pad_size = (K - 1) // 2
        # 创建填充后的图像
        padded_img = np.zeros((H + 2*pad_size, W + 2*pad_size))
        padded_img[pad_size:pad_size+H, pad_size:pad_size+W] = img

    # 初始化输出
    output = np.zeros((H_out, W_out))

    # 计算互相关
    for i in range(H_out):
        for j in range(W_out):
            # 提取窗口
            window = padded_img[i:i+K, j:j+K]
            # 逐元素相乘后求和
            output[i, j] = np.sum(window * kernel)

    return output
```
