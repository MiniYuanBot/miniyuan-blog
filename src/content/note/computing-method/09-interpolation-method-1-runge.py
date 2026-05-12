
import numpy as np
import matplotlib.pyplot as plt


# Runge function
def runge(x):
    return 1.0 / (1.0 + 25.0 * x**2)


# Barycentric Lagrange interpolation
def barycentric_lagrange(x_nodes, y_nodes, x_eval):
    n = len(x_nodes)
    w = np.ones(n)
    for j in range(n):
        for k in range(n):
            if k != j:
                w[j] *= 1.0 / (x_nodes[j] - x_nodes[k])

    x_eval = np.asarray(x_eval)
    y_eval = np.zeros_like(x_eval, dtype=float)

    for i, x in enumerate(x_eval):
        exact = np.isclose(x, x_nodes)
        if np.any(exact):
            y_eval[i] = y_nodes[np.argmax(exact)]
            continue
        num = np.sum(w * y_nodes / (x - x_nodes))
        den = np.sum(w / (x - x_nodes))
        y_eval[i] = num / den

    return y_eval


fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()

x_fine = np.linspace(-1, 1, 1000)
y_true = runge(x_fine)

degrees = [5, 10, 15, 20]
colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6']

for ax, n, color in zip(axes, degrees, colors):
    x_eq = np.linspace(-1, 1, n + 1)
    y_eq = runge(x_eq)
    y_interp = barycentric_lagrange(x_eq, y_eq, x_fine)

    ax.plot(x_fine, y_true, 'k-', linewidth=2, label=r'$f(x)=\frac{1}{1+25x^2}$')
    ax.plot(x_fine, y_interp, color=color, linewidth=1.5, label=f'Lagrange, $n={n}$')
    ax.scatter(x_eq, y_eq, color=color, s=30, zorder=5)

    ax.set_xlim(-1, 1)
    ax.set_ylim(-0.5, 1.2)
    ax.set_xlabel('$x$', fontsize=12)
    ax.set_ylabel('$y$', fontsize=12)
    ax.set_title(f'Equally-spaced nodes ($n={n}$)', fontsize=13)
    ax.legend(loc='upper right')
    ax.grid(True, alpha=0.3)
    ax.axhline(y=0, color='gray', linewidth=0.5)

plt.suptitle('Runge Phenomenon: Oscillation at Endpoints with High-Degree Interpolation',
             fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig('./runge_phenomenon.png', dpi=200, bbox_inches='tight')
plt.show()
