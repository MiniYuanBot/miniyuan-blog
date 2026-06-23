import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(10, 6))

# 参数
B = 4.0
f = 2.0
# P 放在 O' 右侧，使 u' 相对右主点为正值
P = np.array([5.5, 5.0])
O = np.array([0.0, 0.0])
O_prime = np.array([B, 0.0])

# 投影点
t_u = f / P[1]
u = O + t_u * (P - O)
u_prime = O_prime + t_u * (P - O_prime)
principal = np.array([O[0], f])
principal_prime = np.array([O_prime[0], f])

# 水平参考线
ax.axhline(y=f, color='gray', linestyle='--', linewidth=0.8, xmin=0.05, xmax=0.95)

# 成像平面（延长以容纳像点）
ax.plot([-1.5, 2.5], [f, f], 'k-', linewidth=3)
ax.plot([B - 0.5, B + 2.0], [f, f], 'k-', linewidth=1.5)

# 基线与光路
ax.plot([O[0], O_prime[0]], [O[1], O_prime[1]], 'k-', linewidth=1)
ax.plot([P[0], O[0]], [P[1], O[1]], 'k-', linewidth=2)
ax.plot([P[0], O_prime[0]], [P[1], O_prime[1]], 'k-', linewidth=2)

# 关键点
ax.plot(*O, 'ko', markersize=8)
ax.plot(*O_prime, 'ko', markersize=8)
ax.plot(*P, 'ko', markersize=8)
ax.plot(*u, 'ro', markersize=8)
ax.plot(*u_prime, 'ro', markersize=8)
ax.plot(*principal, 'ko', markersize=6)
ax.plot(*principal_prime, 'ko', markersize=6)

# 文字标注
ax.text(O[0]-0.15, O[1]-0.35, 'O', fontsize=14, ha='right', va='top')
ax.text(O_prime[0]+0.15, O_prime[1]-0.35, "O'", fontsize=14, ha='left', va='top')
ax.text(P[0]+0.15, P[1]+0.15, 'P', fontsize=14, ha='left', va='bottom')

# f 标注（蓝色双向箭头）
ax.annotate('', xy=(O[0], f), xytext=(O[0], O[1]),
            arrowprops=dict(arrowstyle='<->', color='blue', lw=1.5))
ax.text(O[0]-0.3, f/2, 'f', fontsize=14, color='blue', ha='right', va='center')

# B 标注（橙色双向箭头）
ax.annotate('', xy=(O_prime[0], O_prime[1]-0.5), xytext=(O[0], O[1]-0.5),
            arrowprops=dict(arrowstyle='<->', color='darkorange', lw=1.5))
ax.text(B/2, O[1]-0.8, 'B', fontsize=14, color='darkorange', ha='center', va='top')

# Z 轴（右侧蓝色虚线双向箭头）
z_x = B + 2.5
z_bottom = O[1] - 0.3
z_top = P[1] + 0.3
ax.annotate('', xy=(z_x, z_top), xytext=(z_x, z_bottom),
            arrowprops=dict(arrowstyle='<->', color='blue', lw=1.5, linestyle='--'))
ax.text(z_x+0.25, (z_bottom + z_top)/2, 'Z', fontsize=14,
        color='blue', ha='left', va='center')

# u 和 u' 双向箭头（红色，从主点指向像点，均为正方向）
ax.annotate('', xy=(u[0], u[1]+0.25), xytext=(principal[0], principal[1]+0.25),
            arrowprops=dict(arrowstyle='<->', color='red', lw=1.5))
ax.text((principal[0]+u[0])/2, u[1]+0.45, 'u',
        fontsize=13, color='red', ha='center', va='bottom')

ax.annotate('', xy=(u_prime[0], u_prime[1]+0.25), xytext=(principal_prime[0], principal_prime[1]+0.25),
            arrowprops=dict(arrowstyle='<->', color='red', lw=1.5))
ax.text((principal_prime[0]+u_prime[0])/2, u_prime[1]+0.45,
        "u'", fontsize=13, color='red', ha='center', va='bottom')

# 光心到主点垂线
ax.plot([O[0], principal[0]], [O[1], principal[1]], 'b--', lw=1)
ax.plot([O_prime[0], principal_prime[0]], [O_prime[1], principal_prime[1]], 'b--', lw=1)

ax.set_xlim(-2.5, B + 4.0)
ax.set_ylim(-1.5, P[1] + 1)
ax.set_aspect('equal')
ax.axis('off')

plt.tight_layout()
plt.savefig('./stereo_geometry.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.show()
