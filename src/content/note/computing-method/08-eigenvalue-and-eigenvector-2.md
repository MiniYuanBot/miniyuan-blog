---
title: '特征值和特征向量的计算（QR 分解，SVD 分解）'
excerpt: '26 春 计算方法 L08'
author: 'miniyuan'
position: 'Beijing'
tags:
- '计算方法'
- '线性方程组'
pubDate: 'April 18 2026'
# updatedDate
heroImageLight: '@/assets/images/light/light-01.png'
heroImageDark: '@/assets/images/dark/dark-01.png'
---

## QR 分解

我们想要对 $A \in \mathbb{R}^{n \times n}$ 进行 QR 分解，也即：
$$
A = QR
$$
其中 $Q$ 为正交阵，$R$ 为上三角阵。

### Householder 变换

对单位向量 $w \in \mathbb{R}^n$，Householder 矩阵定义为：
$$
H = I - 2ww^T
$$

**性质**：

- 对称：$H^T = H$
- 正交：$H^T H = I \Rightarrow H^2 = I$

**几何意义**：将向量 $x$ 关于与 $w$ 正交的超平面 $\{y \mid w^T y = 0\}$ 镜像反射。

**定理**：

对非零向量 $x \in \mathbb{R}^n$，存在 Householder 矩阵 $H$，使得：
$$
Hx = \sigma e_1, \quad \sigma = -\text{sign}(x_1)\|x\|_2
$$
其中 $e_1 = [1,0,\dots,0]^T$。

**证明**：

只需证明如下引理：对非零向量 $x, y \in \mathbb{R}^n$ 且 $\|x\|_2 = \|y\|_2$，存在 Householder 矩阵 $H$，使得：
$$
Hx = y
$$

由几何直观，构造 $w = \dfrac{x - y}{\|x - y\|_2}$ 即可。

**注**：
定理中的 $-\text{sign}(x_1)$ 用于确保计算 $\|x - [-\text{sign}(x_1)\|x\|_2]\|_2$ 时数值稳定，因为此时第一个元素绝对值肯定不会变小。

### Householder QR 分解

**输入**：$ A \in \mathbb{R}^{n \times n} $

**输出**：正交矩阵 $ Q $ 和上三角矩阵 $ R $，使得 $ A = QR $

1. 初始化 $ A^{(1)} = A $，$ Q^{(1)} = I_n $
2. 对 $ k = 1, 2, \dots, n-1 $：
   1. 取 $ x^{(k)} = A^{(k)}[k:n, k] \in \mathbb{R}^{(n-k+1)} $
   2. 构造 Householder 矩阵 $ H^{(k)} \in \mathbb{R}^{(n-k+1) \times (n-k+1)} $ 使
    $ H^{(k)} x^{(k)} = -\text{sign}(x_1^{(k)})\|x^{(k)}\|_2 e_1 $
   3. 令 $ \tilde{H}^{(k)} = \begin{bmatrix} I_{k-1} & 0 \\ 0 & H^{(k)} \end{bmatrix} $，注意其仍为 Householder 矩阵
   4. $ A^{(k+1)} = \tilde{H}^{(k)} A^{(k)} $
   5. $ Q^{(k+1)} = Q^{(k)} (\tilde{H}^{(k)})^T $
3. 令 $ Q = Q^{(n)} $，$ R = A^{(n)} $，输出 $ Q, R $ 即为所求

**证明**：

下归纳证明第 $ k-1 $ 步后，$ A^{(k)} $ 具有以下结构：

$$
A^{(k)} =
\begin{bmatrix}
R^{(k)} & C^{(k)} \\
0 & D^{(k)}
\end{bmatrix}
$$
其中 $ R^{(k)} \in \mathbb{R}^{(k-1) \times (k-1)} $ 是上三角矩阵，$ D^{(k)} \in \mathbb{R}^{(n-k+1) \times (n-k+1)} $。

$ k=1 $ 时，$ A^{(1)} = A $，$ R^{(1)} $ 为空，成立。假设 $k-1$ 时成立，下证 $k$ 时成立。

设 $ x^{(k)} = D^{(k)}[:, 1] $。
构造 $ H^{(k)} $ 使 $ H^{(k)} x^{(k)} = \|x^{(k)}\|_2 e_1 $。
令 $ \tilde{H}^{(k)} = \text{diag}(I_{k-1}, H^{(k)}) $，则：

$$
A^{(k+1)} = \tilde{H}^{(k)} A^{(k)} =
\begin{bmatrix}
R^{(k)} & C^{(k)} \\
0 & H^{(k)} D^{(k)}
\end{bmatrix}
$$

由于 $ H^{(k)} D^{(k)} $ 的第一列变为 $ -\text{sign}(x_1^{(k)})\|x^{(k)}\|_2 e_1 $，故 $ A^{(k+1)} $ 的左上角 $ k \times k $ 块

$$
\begin{bmatrix}
R^{(k)} & C^{(k)}_{:,1} \\
0 & -\text{sign}(x_1^{(k)})\|x^{(k)}\|_2
\end{bmatrix}
$$

是上三角矩阵。记此块为 $ R^{(k+1)} $，则：

$$
A^{(k+1)} =
\begin{bmatrix}
R^{(k+1)} & C^{(k+1)} \\
0 & D^{(k+1)}
\end{bmatrix}
$$

满足归纳假设。

**复杂度**：$\mathcal{O}(2n^3/3)$ 次浮点运算，优于 Givens。但稀疏时 Givens 更优。

### Householder QR 分解代码

```python
n = A.shape[0]
Q = np.eye(n)
R = np.copy(A)

for k in range(n - 1):
    x = R[k:, k]  # (n - k,)
    norm_x = np.linalg.norm(x)

    if norm_x < 1e-15:  # 全 0 列则跳过
        continue

    y = np.zeros((n - k,))  # (n - k,)
    y[0] = -np.sign(x[0]) * norm_x
    w = (x - y) / np.linalg.norm(x - y)  # (n - k,)

    # H = np.eye(n) - 2 * np.outer(w, w)
    sub_R = R[k:, k:]  # (n - k, n - k)
    sub_Q = Q[:, k:]  # (n, n - k)

    sub_R -= 2 * np.outer(w, w @ sub_R)
    sub_Q -= 2 * np.outer(sub_Q @ w, w)
```

### Givens 旋转变换

Givens 旋转用于有选择地消去矩阵中的特定元素，每次只影响两行（列）。

**2×2 Givens 旋转**：

对向量 $\begin{bmatrix} a \\ b \end{bmatrix}$，构造旋转矩阵：
$$
G = \begin{bmatrix} c & s \\ -s & c \end{bmatrix}, \quad c = \frac{a}{\sqrt{a^2+b^2}}, \quad s = \frac{b}{\sqrt{a^2+b^2}}
$$

则：
$$
G \begin{bmatrix} a \\ b \end{bmatrix} = \begin{bmatrix} \sqrt{a^2+b^2} \\ 0 \end{bmatrix}
$$

也即将向量 $(a,b)$ 旋转到 $x$ 轴正方向。

**n×n Givens 旋转**：

构造 $G_{ij}(\theta) \in \mathbb{R}^{n \times n}$，仅在以下位置非单位元：

- $G_{ii} = c,\quad G_{jj} = c$
- $G_{ij} = s,\quad G_{ji} = -s$
- 其余对角元为 1，其余非对角元为 0

从而：

- 左乘 $G_{ij}^T$：只修改第 $i$ 行和第 $j$ 行
- 右乘 $G_{ij}$：只修改第 $i$ 列和第 $j$ 列

**注**：
显然之前的 [Jacobi 法求特征值](../07-eigenvalue-and-eigenvector-1#jacobi-法)也是利用了 Givens 旋转。

### Givens QR 分解

**输入**：$ A \in \mathbb{R}^{n \times n} $

**输出**：正交矩阵 $ Q $ 和上三角矩阵 $ R $，使得 $ A = QR $

1. 初始化 $ A^{(1)} = A $，$ Q^{(1)} = I_n $
2. 对 $ k = 1, 2, \dots, n-1 $，
   对 $ i = k+1, \dots, n $：
     1. 取 $ a = A^{(k)}[k, k] $，$ b = A^{(k)}[i, k] $
     2. 计算 $ c = \frac{a}{\sqrt{a^2+b^2}} $，$ s = \frac{b}{\sqrt{a^2+b^2}} $
     3. 构造 Givens 矩阵 $ G_{ik} \in \mathbb{R}^{n \times n} $：
        $$
        G_{ik} = \begin{bmatrix}
        1 & & & & & \\
        & \ddots & & & & \\
        & & c & \cdots & s & \\
        & & \vdots & \ddots & \vdots & \\
        & & -s & \cdots & c & \\
        & & & & & 1
        \end{bmatrix}
        $$
        其中非零元位于 $ (k,k), (k,i), (i,k), (i,i) $ 位置
     4. $ A^{(k+1)} = G_{ik}^T A^{(k)} $
     5. $ Q^{(k+1)} = Q^{(k)} G_{ik} $
3. 令 $ Q = Q^{(n)} $，$ R = A^{(n)} $，输出 $ Q, R $ 即为所求

**证明**：

第 $ k $ 步固定，对 $ i = k+1, \dots, n $ 依次消去 $ A[i, k] $。

设消去 $ A[i, k] $ 前，当前矩阵为 $ A $。取 $ a = A[k, k] $，$ b = A[i, k] $，构造 $ G_{ik} $ 使得：
$$
G_{ik}^T \begin{bmatrix} a \\ b \end{bmatrix} = \begin{bmatrix} \sqrt{a^2+b^2} \\ 0 \end{bmatrix}
$$

左乘 $ G_{ik}^T $ 只修改第 $ k $ 行和第 $ i $ 行，故：

- 新 $ (i, k) $ 位置变为 0
- 第 $ k $ 行第 $ k $ 列变为 $ \sqrt{a^2+b^2} $
- 其他已消零的位置不受影响

对 $ k = 1, \dots, n-1 $ 依次执行，最终 $ A^{(n)} $ 下三角全为 0，即为上三角矩阵 $ R $。

且正交阵乘积 $ Q = G_{12} G_{13} \cdots G_{n-1,n} $ 仍为正交阵。

**复杂度**：$ \mathcal{O}(4n^3/3) $ 次浮点运算，比 Householder 多约一倍。但 Givens 每次只改两行，适合稀疏矩阵和并行计算。

### 两种 QR 分解对比

| 方法 | 每次操作 | 适用场景 |
| :--- | :--- | :--- |
| **Householder** | 消去一整列 | 稠密矩阵 |
| **Givens** | 消去单个元素 | 稀疏矩阵、并行计算 |

## QR 算法

我们知道：

- 容易求特征值的矩阵：对角阵、上三角阵、分块上三角阵（对角块小）
- 保持特征值的变换：相似变换，正交相似变换（数值稳定）

我们利用好的变换把原矩阵化为好的矩阵，也即通过正交相似变换变为拟上三角矩阵，从而求解特征值和特征向量，这就是 QR 算法。

### 实 Schur 分解

定义**拟上三角矩阵**（quasi-upper triangular）为对角块为 1 阶或 2 阶的分块上三角矩阵。

**实 Schur 分解**：

对任意 $A \in \mathbb{R}^{n \times n}$，存在正交矩阵 $Q \in \mathbb{R}^{n \times n}$，使：
$$
Q^T A Q = S
$$
其中 $S$ 为拟上三角矩阵，且：  

- 1 阶对角块对应一个实特征值  
- 2 阶对角块对应一对共轭复特征值

**证明**：略

### QR 算法步骤

**迭代步骤**：

1. QR 分解：$A^{(k)} = Q^{(k)} R^{(k)}$
2. 更新：$A^{(k+1)} = R^{(k)} Q^{(k)} = (Q^{(k)})^T A^{(k)} Q^{(k)}$

显然 $A^{(k+1)}$ 与 $A^{(k)}$ 正交相似，故特征值不变。

**收敛性**：

设 $A$ 是 $n \times n$ 实矩阵，特征值满足：
$$
|\lambda_1| \ge |\lambda_2| \ge \cdots \ge |\lambda_n|
$$
且等号仅出现在共轭复特征值对（即 $\lambda = a \pm bi, b \ne 0$）的情形。

则 QR 迭代产生的 $A^{(k)}$ 收敛到拟上三角矩阵（实 Schur 标准型）。

**证明**：略

**注**：实际中常加入位移（shift）加速收敛。

### QR 算法实现

```python
k = 0

while k < N:
    k += 1

    # QR 分解
    Q, R = qr_decomposition(A)
    # 进行迭代
    A = R @ Q
    
    # 检查收敛
    if np.all(np.abs(np.diag(A, k=-1)) < EPS): # 次对角线
        break
```

---

## 3×3 实对称矩阵的特征对

### 3×3 实对称矩阵的特征值

对实对称矩阵 $A = [a_{ij}] \in \mathbb{R}^{3\times 3}$，特征方程为：
$$
P(\lambda) = \lambda^3 - I_1 \lambda^2 + I_2 \lambda - I_3 = 0
$$
其中：

- $I_1 = \text{tr}(A) = a_{11}+a_{22}+a_{33}$
- $I_2 = \frac{1}{2}[(\text{tr} A)^2 - \text{tr}(A^2)]
    = a_{11}a_{22} + a_{22}a_{33} + a_{33}a_{11} - a_{12}^2 - a_{23}^2 - a_{13}^2$
- $I_3 = \det A$

令：
$$
\begin{aligned}
p &= I_1^2 - 3I_2 \\
q &= \frac{27}{2}I_3 + I_1^3 - \frac{9}{2}I_1 I_2 \\
\phi &= \frac{1}{3} \arctan\left(\frac{\sqrt{p^3 - q^2}}{q}\right)
\end{aligned}
$$
则三个实特征值为：
$$
\begin{aligned}
\lambda_1 &= \frac{2\sqrt{p}}{3} \cos\phi + \frac{I_1}{3} \\
\lambda_2 &= \frac{2\sqrt{p}}{3} \cos\left(\phi + \frac{2\pi}{3}\right) + \frac{I_1}{3} \\
\lambda_3 &= \frac{2\sqrt{p}}{3} \cos\left(\phi + \frac{4\pi}{3}\right) + \frac{I_1}{3}
\end{aligned}
$$

**注**：对于实对称阵而言，$p^3 - q^2 \ge 0$ 恒成立。

### 3×3 实对称矩阵的特征向量

对特征值 $\lambda_i$，解 $(A - \lambda_i I)v_i = 0$。

取转置：
$$
v_i^T (A - \lambda_i I) = 0
$$

右乘 $e_1, e_2$ 得：
$$
\begin{aligned}
v_i^T (a_1 - \lambda_i e_1) &= 0 \\
v_i^T (a_2 - \lambda_i e_2) &= 0
\end{aligned}
$$

当 $a_1 - \lambda_i e_1, a_1 - \lambda_i e_1$ 线性无关时，取：
$$
v_i = (a_1 - \lambda_i e_1) \times (a_2 - \lambda_i e_2)
$$
即可。

**注**：当两向量线性相关时（如重特征值），需改用其他列组合或 SVD 求解

---

## SVD 分解

### SVD 分解的数学原理

对 $A \in \mathbb{R}^{m \times n}$，若存在 $\sigma \ge 0,\ u \in \mathbb{R}^m,\ v \in \mathbb{R}^n$ 满足：
$$
Av = \sigma u, \quad A^T u = \sigma v
$$
且 $\|u\|_2 = \|v\|_2 = 1$，则称 $\sigma$ 为**奇异值**，$u/v$ 为对应的**左/右奇异向量**。

**SVD 分解**：

任意 $A \in \mathbb{R}^{m \times n}$ 存在正交矩阵 $U \in \mathbb{R}^{m\times m},\ V \in \mathbb{R}^{n\times n}$ 和
$$
\Sigma = \begin{bmatrix} \mathrm{diag}(\sigma_1,\dots,\sigma_r) & 0 \\ 0 & 0 \end{bmatrix} \in \mathbb{R}^{m\times n}
$$
使得
$$
A = U \Sigma V^T
$$
其中 $\sigma_1 \ge \sigma_2 \ge \cdots \ge \sigma_r > 0$。

**证明**：略

**性质**：

1. $\sigma_i^2$ 是 $A^T A$（以及 $AA^T$）的非零特征值。

    **证明**：
    $$
    A^T A v_i = A^T (\sigma_i u_i) = \sigma_i A^T u_i = \sigma_i (\sigma_i v_i) = \sigma_i^2 v_i
    $$
    类似：
    $$
    AA^T u_i = A (\sigma_i v_i) = \sigma_i A v_i = \sigma_i^2 u_i
    $$
    所以 $\sigma_i^2$ 是特征值，$v_i,\ u_i$ 是对应特征向量。

2. $v_i$ 是 $A^T A$ 的特征向量，$u_i$ 是 $AA^T$ 的特征向量。

    **证明**：由上一步直接得出。

3. $u_i = \frac{1}{\sigma_i} A v_i$

    **证明**：
    从 $A v_i = \sigma_i u_i$，两边除以 $\sigma_i > 0$ 即得。

4. 对 $i \ne j$：
    $$
    u_i^T u_j = 0,\quad v_i^T v_j = 0
    $$

    **证明**：
    取 $i \ne j$：
    $$
    \sigma_j u_i^T u_j = u_i^T A v_j = (A^T u_i)^T v_j = \sigma_i v_i^T v_j
    $$
    若 $\sigma_i \ne \sigma_j$ 或 $i \ne j$ 对应不同特征值，由对称矩阵 $A^T A$ 的特征向量正交性得 $v_i^T v_j = 0$，进而 $u_i^T u_j = 0$。
    若特征值相同，可通过 Gram–Schmidt 正交化选正交基。

5. 设 $r = \mathrm{rank}(A)$，则：
   - $\{v_1,\dots,v_r\}$ 张成行空间 $C(A^T)$
   - $\{v_{r+1},\dots,v_n\}$ 张成零空间 $N(A)$
   - $\{u_1,\dots,u_r\}$ 张成列空间 $C(A)$
   - $\{u_{r+1},\dots,u_m\}$ 张成左零空间 $N(A^T)$

    **证明**：
    - $Av_i = \sigma_i u_i \ne 0 \implies v_i \perp N(A)$，且 $\dim C(A^T) = r$，因此 $\{v_1,\dots,v_r\}$ 是 $C(A^T)$ 的一组正交基。
    - $v_{r+1},\dots,v_n$ 对应 $\sigma=0$，即 $Av_i=0$，故属于 $N(A)$，维数 $n-r$。
    - 类似得 $u_i$ 的结论。

6. $\mathrm{rank}(A) = \#\{\sigma_i > 0\}$

    **证明**：
    $A v_i = \sigma_i u_i$，前 $r$ 个 $u_i$ 线性无关且属于 $C(A)$，后 $n-r$ 个 $v_i$ 映射到 0。因此 $\dim C(A) = r$。

7. $\|A\|_2 = \sigma_1$

    **证明**：
    对任意单位 $x \in \mathbb{R}^n$，$x = \sum \alpha_i v_i$，则
    $$
    \|Ax\|^2 = \sum \sigma_i^2 \alpha_i^2 \le \sigma_1^2
    $$
    且 $x=v_1$ 时等号成立。

### Eckart-Young-Mirsky 定理

设矩阵的**谱分解**为 $A = \sum_{i=1}^r \sigma_i u_i v_i^T$，对 $k < r$，定义截断 SVD：
$$
A_k = \sum_{i=1}^k \sigma_i u_i v_i^T
$$
则 $A_k$ 是所有秩 $\le k$ 矩阵中，在谱范数（2-范数）下对 $A$ 的**最佳逼近**：
$$
\|A - A_k\|_2 = \min_{\text{rank}(B) \le k} \|A - B\|_2 = \sigma_{k+1}
$$

**证明**：略

**注**：也即能量集中在前几个奇异值。

### 应用1：图像压缩

- 灰度图等价于矩阵 $A \in \mathbb{R}^{m \times n}$
- 作低秩近似，计算 $A_k = U_k \Sigma_k V_k^T$
- 压缩率：原存储 $mn$，压缩后 $k(m+n+1)$（$U_k, V_k$ 各 $k$ 列，$\Sigma_k$ 有 $k$ 个值）
- 质量：由 $\sigma_{k+1}$ 决定，$k$ 越大越清晰

### 应用2：Netflix 推荐系统

- 用户-电影评分矩阵 $A \in \mathbb{R}^{N \times M}$（稀疏）
- 用SVD分解 $A \approx U_k \Sigma_k V_k^T$
- $U_k$ 的行：用户隐因子向量
  $V_k$ 的列：电影隐因子向量
- 预测用户 $i$ 对电影 $j$ 的评分：$(U_k \Sigma_k V_k^T)_{ij}$

### 应用3：LLM 微调中的 LoRA

- 全参数微调：$W_{\text{fine}} = W_0 + \Delta W$，$\Delta W$ 存储成本高
- 关键观察：$\Delta W$ 的奇异值衰减极快，故可作低秩近似
- LoRA 公式：
    $$
    W_{\text{fine}} = W_0 + B A
    $$
    其中：

  - $W_0 \in \mathbb{R}^{d \times k}$ 为预训练权重矩阵，不参与微调，冻结。
  - $B \in \mathbb{R}^{d \times l}$，$A \in \mathbb{R}^{l \times k}$，$l \ll \min(d,k)$ 为人为选定维数，训练时仅更新 $A, B$。
- $\Delta W$ 的最优低秩近似为 $\Delta W \approx U_l \Sigma_l V_l^T$。
  在数学上，我们可取 $B = U_l \Sigma_l^{1/2}$ 和 $A = \Sigma_l^{1/2} V_l^T$，使得 $BA = U_l \Sigma_l V_l^T$。
  这表明，最优低秩近似确实能被分解为 LoRA 所采用的 $BA$ 形式。

### 应用4：潜在语义分析（LSA）

- 文档-词项矩阵 $A \in \mathbb{R}^{m \times n}$（稀疏，元素为 TF-IDF）
- 用 SVD 分解 $A \approx U_k \Sigma_k V_k^T$
- $U_k \Sigma_k$ 的行：文档的语义向量（$m \times k$）
- $V_k \Sigma_k$ 的行（或 $\Sigma_k V_k^T$ 的列）：词的语义向量（$n \times k$）
- 查询 $q$（词的集合）的语义向量：
  $$
  q_{\text{sem}} = q^T V_k \Sigma_k^{-1}
  $$
  这样 $q_{\text{sem}}$ 与文档语义向量在同一空间，可计算余弦相似度。

---

## 复杂度与方法对比总结

| 方法 | 适用问题 | 时间复杂度 | 空间复杂度 |
| :--- | :--- | :--- | :--- |
| **QR 算法** | 一般矩阵特征值 | $O(n^3)$ / 迭代 | $O(n^2)$ |
| **Householder QR** | QR 分解（稠密） | $O(2n^3/3)$ | $O(n^2)$ |
| **Givens QR** | QR 分解（稀疏/并行） | $O(n^3)$（系数更大） | $O(n^2)$ |
| **3×3 解析法** | 3×3 实对称矩阵 | $O(1)$ | $O(1)$ |
| **SVD** | 低秩近似、非方阵 | $O(mn^2)$ ($m \ge n$) | $O(mn)$ |
