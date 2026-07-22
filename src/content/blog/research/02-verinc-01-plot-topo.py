import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# 设置中文字体
plt.rcParams['axes.unicode_minus'] = False

# 创建图形
fig, ax = plt.subplots(1, 1, figsize=(12, 10))

# 定义节点位置（手动布局，让拓扑清晰）
nodes = {
    'c1': (1, 8),      # Client 1
    'c2': (3, 8),      # Client 2
    'c3': (5, 8),      # Client 3
    'sw': (3, 5),      # Switch (中心)
    'ctrl': (1, 2),    # Controller
    's': (5, 2),       # Server
}

# 节点类型和颜色
node_types = {
    'c1': 'Client', 'c2': 'Client', 'c3': 'Client',
    'sw': 'Switch',
    'ctrl': 'Controller',
    's': 'Server'
}

colors = {
    'Client': '#4CAF50',      # 绿色
    'Switch': '#FF9800',      # 橙色
    'Controller': '#2196F3',  # 蓝色
    'Server': '#F44336',      # 红色
}

shapes = {
    'Client': 'o',      # 圆形
    'Switch': 's',      # 方形
    'Controller': 'o',   # 圆形
    'Server': 'o',      # 圆形
}

# 链路定义 (无向)
links = [
    ('c1', 'sw'), ('c2', 'sw'), ('c3', 'sw'),  # clients to switch
    ('sw', 'ctrl'), ('sw', 's'),                # switch to ctrl/server
    ('ctrl', 's'),                               # ctrl to server (direct)
]

# 绘制链路
for n1, n2 in links:
    x1, y1 = nodes[n1]
    x2, y2 = nodes[n2]
    # 实线
    ax.plot([x1, x2], [y1, y2], 'k-', linewidth=2, alpha=0.8, zorder=1)

# 绘制节点
for name, (x, y) in nodes.items():
    ntype = node_types[name]
    color = colors[ntype]
    shape = shapes[ntype]

    # 绘制节点
    ax.scatter(x, y, s=2000, c=color, marker=shape, edgecolors='black',
               linewidths=2, zorder=3)

    # 节点标签
    ax.text(x, y, name, ha='center', va='center', fontsize=14,
            fontweight='bold', color='white', zorder=4)

    # 类型标签（在节点下方）
    ax.text(x, y - 0.7, ntype, ha='center', va='top', fontsize=10,
            color='#555', style='italic')

# 添加链路标注
# c1-sw
ax.text(2, 6.7, 'reliable', fontsize=9, color='#666', ha='center',
        style='italic', rotation=60)
# c2-sw
ax.text(3, 6.7, 'reliable', fontsize=9, color='#666', ha='center',
        style='italic')
# c3-sw
ax.text(4, 6.7, 'reliable', fontsize=9, color='#666', ha='center',
        style='italic', rotation=-60)
# sw-ctrl
ax.text(1.8, 3.5, 'reliable', fontsize=9, color='#666', ha='center',
        style='italic', rotation=55)
# sw-s
ax.text(4.2, 3.5, 'reliable', fontsize=9, color='#666', ha='center',
        style='italic', rotation=-55)
# ctrl-s (direct)
ax.text(3, 2, 'reliable', fontsize=9, color='#666', ha='center',
        style='italic')

# 添加图例
legend_elements = [
    mpatches.Patch(color='#4CAF50', label='Client'),
    mpatches.Patch(color='#FF9800', label='Switch'),
    mpatches.Patch(color='#2196F3', label='Controller'),
    mpatches.Patch(color='#F44336', label='Server'),
]
ax.legend(handles=legend_elements, loc='right', fontsize=11,
          framealpha=0.9)

# 添加标题
# ax.set_title('Network Topology', fontsize=16, fontweight='bold', pad=20)

# 设置坐标轴
ax.set_xlim(-0.5, 6.5)
ax.set_ylim(0.5, 9.5)
ax.set_aspect('equal')
ax.axis('off')

plt.tight_layout()
plt.savefig('./topology.png', dpi=150, bbox_inches='tight',
            facecolor='white')
plt.show()
print("拓扑图已保存")
