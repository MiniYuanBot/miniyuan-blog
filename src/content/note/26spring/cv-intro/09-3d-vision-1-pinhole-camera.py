import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(12, 7))

# 关键参数
f = 3.0
O = np.array([0.0, 0.0])
C_prime = np.array([-f, 0.0])

# 方向向量（画布坐标系）
k_dir = np.array([-1.0, 0.0])   # 水平向左（光轴）
j_dir = np.array([0.0, 1.0])    # 竖直向上
i_dir = np.array([0.7, -0.7])   # 斜向右下（垂直于纸面方向在 2D 中的示意）

# 绘制相机坐标系 i, j, k（在 O 处）
axis_len = 1.3
for dir_vec, label, offset in [(k_dir, 'k', (-0.25, 0.2)),
                               (j_dir, 'j', (-0.4, 0.15)),
                               (i_dir, 'i', (0.15, -0.25))]:
    end = O + axis_len * dir_vec / np.linalg.norm(dir_vec)
    ax.annotate('', xy=end, xytext=O,
                arrowprops=dict(arrowstyle='->', color='black', lw=1.5))
    ax.text(end[0] + offset[0], end[1] + offset[1], label, fontsize=14)

# 光轴 OC'（水平线）
ax.plot([O[0], C_prime[0]], [O[1], C_prime[1]], 'k-', lw=1)

# f 标注：使用双向箭头，文字放在光轴下方，避免与 k 轴箭头重叠
ax.annotate('', xy=C_prime, xytext=O,
            arrowprops=dict(arrowstyle='<->', color='black', lw=1))
ax.text((O[0] + C_prime[0]) / 2, -0.45, r'$f$', fontsize=14, ha='center')

# 成像平面 Π'（无厚度，由 j_dir 和 i_dir 张成的平行四边形）
h = 4.0          # 沿 j_dir 方向高度
w = 2.5          # 沿 i_dir 方向宽度

u_dir = j_dir / np.linalg.norm(j_dir)  # y' 方向单位向量
v_dir = i_dir / np.linalg.norm(i_dir)  # x' 方向单位向量（i_dir 方向）

# 成像平面四个顶点（以 C' 为中心）
p1 = C_prime - (h/2)*u_dir - (w/2)*v_dir
p2 = C_prime + (h/2)*u_dir - (w/2)*v_dir
p3 = C_prime + (h/2)*u_dir + (w/2)*v_dir
p4 = C_prime - (h/2)*u_dir + (w/2)*v_dir

# 绘制平面轮廓（无厚度）
ax.plot([p1[0], p2[0]], [p1[1], p2[1]], 'k-', lw=1.5)
ax.plot([p2[0], p3[0]], [p2[1], p3[1]], 'k-', lw=1.5)
ax.plot([p3[0], p4[0]], [p3[1], p4[1]], 'k-', lw=1.5)
ax.plot([p4[0], p1[0]], [p4[1], p1[1]], 'k-', lw=1.5)

ax.text(p2[0] - 0.2, p2[1] + 0.25, r"$\Pi'$", fontsize=14)

# 右侧物体（圆/球）
# 为了 P' 不在 y' 轴上，给物体一个垂直于纸面的 i 方向分量
# 物体中心的三维坐标 [p_k, p_j, p_i]
obj_p_k = -4.0   # 深度（沿 k 方向，负值表示在 O 右侧）
obj_p_j = 1.5    # 高度
obj_p_i = 1.2    # 侧向（垂直于纸面，非零使 P' 偏离 y' 轴）

# 转换到画布坐标
obj_c = obj_p_k * k_dir + obj_p_j * j_dir + obj_p_i * i_dir
obj_r = 1.5

circle = plt.Circle(obj_c, obj_r, fill=False, color='black', lw=1.5)
ax.add_patch(circle)

# 物点 P（取圆上一点）
theta = np.pi / 5
P = obj_c + obj_r * np.array([np.cos(theta), np.sin(theta)])

# 从画布坐标反推 P 的三维坐标（假设 P 与物体中心有相同的 p_i）
P_p_i = obj_p_i
P_p_k = -(P[0] - 0.7 * P_p_i)  # 由 x = -p_k + 0.7*p_i
P_p_j = P[1] + 0.7 * P_p_i      # 由 y = p_j - 0.7*p_i

# 三维针孔投影到成像平面，再转换到画布坐标
# P' 在 k,j,i 系中的坐标为 [f, f*p_j/p_k, f*p_i/p_k]
P_prime = f * k_dir + (f * P_p_j / P_p_k) * j_dir + (f * P_p_i / P_p_k) * i_dir

# 红色光路
ax.plot([P[0], O[0]], [P[1], O[1]], 'r-', lw=2.5)
ax.plot([O[0], P_prime[0]], [O[1], P_prime[1]], 'r-', lw=2.5)

# 光路箭头
ax.annotate('', xy=O + 0.42*(P - O), xytext=P,
            arrowprops=dict(arrowstyle='->', color='red', lw=2.5))
ax.annotate('', xy=P_prime, xytext=O + 0.58*(P_prime - O),
            arrowprops=dict(arrowstyle='->', color='red', lw=2.5))

# 标记关键点
ax.plot(*O, 'ko', markersize=5)
ax.plot(*C_prime, 'ko', markersize=5)
ax.plot(*P, 'ko', markersize=5)
ax.plot(*P_prime, 'ko', markersize=5)

ax.text(O[0]-0.15, O[1]-0.3, 'O', fontsize=14, ha='right')
ax.text(C_prime[0]-0.15, C_prime[1]-0.3, r"$C'$", fontsize=14, ha='right')
ax.text(P[0]+0.15, P[1]+0.15, 'P', fontsize=14)
ax.text(P_prime[0]-0.15, P_prime[1]-0.25, r"$P'$", fontsize=14, ha='right')

# y' 轴：竖直向上（与 j 平行）
yp_len = 1.2
yp_end = C_prime + yp_len * u_dir
ax.annotate('', xy=yp_end, xytext=C_prime,
            arrowprops=dict(arrowstyle='->', color='black', lw=1.5))
ax.text(yp_end[0] - 0.45, yp_end[1] + 0.1, r"$y'$", fontsize=14)

# x' 轴：沿 -i_dir 方向（与原始代码一致）
xp_len = 1.2
xp_end = C_prime - xp_len * v_dir
ax.annotate('', xy=xp_end, xytext=C_prime,
            arrowprops=dict(arrowstyle='->', color='black', lw=1.5))
ax.text(xp_end[0] - 0.1, xp_end[1] + 0.3, r"$x'$", fontsize=14)

# 画布设置
ax.set_xlim(-6, 8.5)
ax.set_ylim(-4, 4)
ax.set_aspect('equal')
ax.axis('off')

plt.tight_layout()
plt.savefig('./pinhole_camera.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.show()
