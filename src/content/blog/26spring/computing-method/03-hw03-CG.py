import numpy as np

x = np.array([0, 0, 0], dtype=float)
A = np.array([[4, 3, 0], [3, 4, -1], [0, -1, 4]], dtype=float)
b = np.array([24, 30, -24], dtype=float)
r = b - A @ x
d = r.copy()
r_norm = np.dot(r, r)         # 存储 ||r||^2

print(f"x^(0) = {x}")
print(f"r^(0) = {r}")
print(f"d^(0) = {d}")

for k in range(3):
    t = A @ d
    s = np.dot(d, t)
    alpha = np.dot(r, d) / s  # 步长
    x += alpha * d            # 更新解
    r -= alpha * t            # 更新残差

    r_norm_new = np.dot(r, r)
    beta = r_norm_new / r_norm
    r_norm = r_norm_new

    d = r + beta * d          # 更新搜索方向
    print(f"alpha^({k}) = {alpha:.5f}")
    print(f"beta^({k}) = {beta:.5f}")
    print(f"x^({k+1}) = {x}")
    print(f"r^({k+1}) = {r}")
    print(f"d^({k+1}) = {d}")
