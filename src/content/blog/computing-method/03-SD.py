import numpy as np

x = np.array([0, 0, 0], dtype=float)
A = np.array([[4, 3, 0], [3, 4, -1], [0, -1, 4]], dtype=float)
b = np.array([24, 30, -24], dtype=float)
r = b - A @ x

print(f"x^(0) = {x}")
print(f"r^(0) = {r}")

for k in range(3):
    t = A @ r
    alpha = np.dot(r, r) / np.dot(r, t)  # 步长
    x += alpha * r                       # 更新解
    r -= alpha * t                       # 更新残差
    print(f"alpha^({k}) = {alpha:.5f}")
    print(f"x^({k+1}) = {x}")
    print(f"r^({k+1}) = {r}")
