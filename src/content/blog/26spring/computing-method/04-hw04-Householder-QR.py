import numpy as np

np.set_printoptions(precision=4, suppress=True)

A = np.array([[-4, -3, -7],
              [2, 3, 2],
              [4, 2, 7],], dtype=float)

n = A.shape[0]
Q = np.eye(n)
R = np.copy(A)

for k in range(n - 1):
    print(f"===iteration {k + 1} start===")
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

    print(f"Q^({k + 1}) =")
    print(f"{Q}")
    print("R^({k + 1}) =")
    print(f"{R}")
    print("")

print("===all iteration done===")
print(f"Q =")
print(f"{Q}")
print("R =")
print(f"{R}")
print("QR =")
print(f"{Q @ R}")
