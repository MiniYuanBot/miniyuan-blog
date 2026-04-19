import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-5, 5, 1000)

# 激活函数定义
sigmoid = 1 / (1 + np.exp(-x))
tanh = np.tanh(x)
relu = np.maximum(0, x)
alpha_leaky = 0.01
leaky = np.where(x >= 0, x, alpha_leaky * x)
alpha_elu = 1.0
elu = np.where(x >= 0, x, alpha_elu * (np.exp(x) - 1))

# Maxout: 两分支示例
w1, b1 = 1.0, 0.5
w2, b2 = 0.5, -0.5
maxout = np.maximum(w1 * x + b1, w2 * x + b2)


# 通用绘图并保存函数
def plot_and_save(y, title, filename, ylim=None):
    plt.figure(figsize=(6, 4))
    plt.plot(x, y, linewidth=2)
    plt.axvline(0, color='gray', lw=0.6)
    plt.axhline(0, color='gray', lw=0.6)
    plt.title(f"{title}", fontsize=14)
    plt.xlabel('x')
    plt.ylabel('activation')
    if ylim is not None:
        plt.ylim(ylim)
    plt.grid(alpha=0.2)
    plt.tight_layout()
    plt.savefig(filename, dpi=150)
    plt.close()


# 生成并保存每张图
plot_and_save(sigmoid, "Sigmoid",
              "./public/images/note/cv-intro/04-deep-learning-1-02-sigmoid.png", ylim=(-0.1, 1.1))
plot_and_save(tanh, "tanh",
              "./public/images/note/cv-intro/04-deep-learning-1-03-tanh.png", ylim=(-1.1, 1.1))
plot_and_save(relu, "ReLU",
              "./public/images/note/cv-intro/04-deep-learning-1-04-relu.png", ylim=(-1, 5))
plot_and_save(leaky, "Leaky ReLU (α=0.01)",
              "./public/images/note/cv-intro/04-deep-learning-1-05-leaky-relu.png", ylim=(-1, 5))
plot_and_save(elu, "ELU (α=1)",
              "./public/images/note/cv-intro/04-deep-learning-1-06-elu.png", ylim=(-1.5, 5))
plot_and_save(maxout, "Maxout (2 branches)",
              "./public/images/note/cv-intro/04-deep-learning-1-07-maxout.png", ylim=(-3, 5))

print("已保存：sigmoid.png, tanh.png, relu.png, leaky-relu.png, elu.png, maxout.png")
