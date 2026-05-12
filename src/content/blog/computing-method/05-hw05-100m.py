import numpy as np
from scipy.interpolate import CubicSpline
import matplotlib.pyplot as plt

# 三组数据
datasets = [
    {
        'split_times': np.array([1.89, 2.88, 3.78, 4.64, 5.47, 6.29, 7.10, 7.92, 8.75, 9.58]),
        't_react_lit': 0.146,
        'label': 'Dataset 1'
    },
    {
        'split_times': np.array([1.85, 2.87, 3.78, 4.65, 5.50, 6.32, 7.14, 7.96, 8.79, 9.69]),
        't_react_lit': 0.165,
        'label': 'Dataset 2'
    },
    {
        'split_times': np.array([1.541, 2.639, 3.663, 4.666, 5.653, 6.655, 7.651, 8.677, 9.717, 10.829]) + 0.186,
        't_react_lit': 0.186,
        'label': 'Dataset 3'
    }
]

x = np.array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
u = np.sqrt(x)
m_fixed = 9

print("=" * 60)
print(f"方案：t(u) 三次样条外推 —— 固定 m = {m_fixed}")
print("=" * 60)

fig, axes = plt.subplots(1, 3, figsize=(18, 5))
fig.suptitle(f'Cubic Spline Extrapolation t(u) → t(0) with m = {m_fixed}',
             fontsize=14, fontweight='bold')

summary_results = []

for idx, data in enumerate(datasets):
    split_times = data['split_times']
    t_react_lit = data['t_react_lit']
    label = data['label']

    # 使用前 m_fixed 个点
    u_m = u[:m_fixed]
    t_m = split_times[:m_fixed]

    cs = CubicSpline(u_m, t_m)
    t_react_cs = cs(0)
    error_ms = abs(t_react_cs - t_react_lit) * 1000
    T_pure = split_times[-1] - t_react_cs

    summary_results.append((label, t_react_cs, error_ms, T_pure))

    print(f"\n{label}:")
    print(f"  外推反应时  t_react = {t_react_cs:.4f} s")
    print(f"  文献反应时  t_react = {t_react_lit:.4f} s")
    print(f"  误差              = {error_ms:.1f} ms")
    print(f"  实测总时间  T_total = {split_times[-1]:.4f} s")
    print(f"  纯跑时间    T_pure  = {T_pure:.4f} s")

    # 绘图
    ax = axes[idx]
    ax.scatter(u_m, t_m, color='red', s=80, zorder=5, label=f'First {m_fixed} points')
    ax.scatter(u[m_fixed:], split_times[m_fixed:], color='gray', s=50, zorder=4,
               alpha=0.4, label='Unused points')
    ax.scatter([0], [0], color='gray', marker='x', s=100, label='Start line')

    u_fine = np.linspace(0, 10, 500)
    ax.plot(u_fine, cs(u_fine), 'b-', lw=2, label='Cubic spline t(u)')
    ax.axvline(x=0, color='gray', ls='-', lw=0.5)
    ax.scatter([0], [t_react_cs], color='blue', marker='*', s=200, zorder=6,
               label=f'Est. $t_{{react}}$={t_react_cs:.3f}s')
    ax.scatter([0], [t_react_lit], color='orange', marker='D', s=80, zorder=6,
               label=f'True $t_{{react}}$={t_react_lit:.3f}s')

    ax.text(5, max(split_times)*0.15, f'Error: {error_ms:.1f} ms',
            fontsize=11, ha='center', fontweight='bold',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))

    ax.set_xlabel('u = √x (m^{1/2})', fontsize=11)
    ax.set_ylabel('Cumulative Time t (s)', fontsize=11)
    ax.set_title(f'{label}\nm = {m_fixed} (first {m_fixed} points)', fontsize=12)
    ax.legend(loc='lower right', fontsize=7)
    ax.set_xlim(-0.5, 10.5)
    ax.grid(True, alpha=0.3)

# 汇总
print("\n" + "=" * 60)
print("汇总对比")
print("=" * 60)
print(f"{'Dataset':<12} {'Est. t_react':>12} {'True t_react':>12} {'Error (ms)':>10} {'T_pure':>8}")
print("-" * 55)

errors = []
for label, t_react_cs, error_ms, T_pure in summary_results:
    data = datasets[[d['label'] for d in datasets].index(label)]
    print(
        f"{label:<12} {t_react_cs:>12.4f} {data['t_react_lit']:>12.4f} {error_ms:>10.1f} {T_pure:>8.4f}")
    errors.append(error_ms)

print(f"\n平均误差: {np.mean(errors):.1f} ms")
print(f"最大误差: {np.max(errors):.1f} ms")

plt.tight_layout(rect=[0, 0.03, 1, 0.92])
plt.savefig('./sprint_m3_fixed.png', dpi=200, bbox_inches='tight')
plt.show()

print("\n图表已保存")
