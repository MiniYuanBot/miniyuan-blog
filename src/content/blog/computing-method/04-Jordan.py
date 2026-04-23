import numpy as np

np.set_printoptions(precision=4, suppress=True)

A = np.array([[4, 2, 2],
              [2, 5, 1],
              [2, 1, 6],], dtype=float)

k = 0
n = A.shape[0]
V = np.eye(n)
N = 1000
EPS = 1e-6

while k < N:
    k += 1
    print(f"===iteration {k} start===")

    # 选最大非对角元
    p, q = 0, 1
    max_off = 0
    for i in range(n):
        for j in range(i + 1, n):
            if abs(A[i, j]) > max_off:
                max_off = abs(A[i, j])
                p, q = i, j
    print(f"A^({k-1})[{p}, {q}] = {A[p, q]:.4f}")

    if max_off < EPS:
        print("")
        print("===all iteration done===")
        break

    # 计算旋转参数
    tau = (A[p, p] - A[q, q]) / (2 * A[p, q])
    if tau >= 0:
        t = -1 / (tau + np.sqrt(1 + tau**2))
    else:
        t = 1 / (-tau + np.sqrt(1 + tau**2))
    c = 1 / np.sqrt(1 + t**2)
    s = c * t
    print(f"cot2^({k}) = {tau:.4f}")
    print(f"tan^({k}) = {t:.4f}")
    print(f"cos^({k}) = {c:.4f}")
    print(f"sin^({k}) = {s:.4f}")

    # 更新 A
    a_pp, a_qq, a_pq = A[p, p], A[q, q], A[p, q]
    A[p, p] = c**2 * a_pp + s**2 * a_qq - 2*s*c*a_pq
    A[q, q] = s**2 * a_pp + c**2 * a_qq + 2*s*c*a_pq
    A[p, q] = A[q, p] = 0

    for i in range(n):
        if i != p and i != q:
            a_ip, a_iq = A[i, p], A[i, q]
            A[i, p] = A[p, i] = c*a_ip - s*a_iq
            A[i, q] = A[q, i] = s*a_ip + c*a_iq
    print(f"A^({k}) =")
    print(f"{A}")

    # 累积 V
    for i in range(n):
        v_ip, v_iq = V[i, p], V[i, q]
        V[i, p] = c*v_ip - s*v_iq
        V[i, q] = s*v_ip + c*v_iq
    print(f"V^({k}) =")
    print(f"{V}")
    print("")

eigvals = np.diag(A)
idx = np.argsort(eigvals)[::-1]  # 从大到小排序
eigvals = eigvals[idx]
eigvecs = V[:, idx]

print(f"eigvals:")
for i in range(n):
    print(f"  lambda_{i} = {eigvals[i]:.4f}")
