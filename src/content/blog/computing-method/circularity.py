import matplotlib.pyplot as plt
import numpy as np
import math
from typing import Set, List, Tuple, Dict
from scipy.optimize import curve_fit


class DigitalCircularity:
    """
    数字圆度分析类：输入边界像素点，自动选择最优步长计算圆度
    """

    def __init__(self, boundary_pixels: Set[Tuple[int, int]]):
        if not boundary_pixels:
            raise ValueError("boundary_pixels 不能为空")
        self.pts_set = set(boundary_pixels)
        self.ordered = self._trace_boundary(self.pts_set)
        if len(self.ordered) < 3:
            raise ValueError("无法构成多边形：有序顶点不足")

        # 计算基本几何量
        self.area = self._polygon_area(self.ordered)
        self.B = self._boundary_lattice_points(self.ordered)
        self.I = self.area - self.B/2 + 1
        self.perimeter = self._exact_perimeter(self.ordered)
        self.centroid = self._polygon_centroid(self.ordered)

        # 估计半径
        xs = [p[0] for p in self.pts_set]
        ys = [p[1] for p in self.pts_set]
        self.estimated_radius = (max(xs) - min(xs) + max(ys) - min(ys)) / 4.0

        # 初始化步长相关变量
        self.optimal_stride = None
        self.optimal_xi = None

    # ----- 辅助几何方法（保留核心方法）-----
    def _trace_boundary(self, pts: Set[Tuple[int, int]]) -> List[Tuple[int, int]]:
        """边界追踪"""
        pts_copy = set(pts)
        start = min(pts_copy, key=lambda p: (p[1], p[0]))
        ordered = [start]
        cur = start
        dirs = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
        prev_dir = 6
        max_steps = len(pts_copy) * 10
        steps = 0

        while True:
            steps += 1
            if steps > max_steps:
                break
            found = False
            start_idx = (prev_dir - 1) % 8
            for i in range(8):
                idx = (start_idx + i) % 8
                dx, dy = dirs[idx]
                nxt = (cur[0] + dx, cur[1] + dy)
                if nxt in pts_copy:
                    if len(ordered) > 1 and nxt == ordered[-2]:
                        continue
                    ordered.append(nxt)
                    cur = nxt
                    prev_dir = idx
                    found = True
                    break
            if not found:
                break
            if len(ordered) > 2 and ordered[0] == ordered[-1]:
                ordered.pop()
                break

        if len(ordered) < 3:
            ordered = sorted(list(pts_copy), key=lambda p: (p[0], p[1]))
        return ordered

    @staticmethod
    def _polygon_area(verts: List[Tuple[int, int]]) -> float:
        """多边形面积"""
        s = 0
        n = len(verts)
        for i in range(n):
            x1, y1 = verts[i]
            x2, y2 = verts[(i+1) % n]
            s += x1*y2 - x2*y1
        return abs(s) / 2.0

    @staticmethod
    def _boundary_lattice_points(verts: List[Tuple[int, int]]) -> int:
        """边界格点数"""
        B = 0
        n = len(verts)
        for i in range(n):
            x1, y1 = verts[i]
            x2, y2 = verts[(i+1) % n]
            dx = abs(x2 - x1)
            dy = abs(y2 - y1)
            g = math.gcd(dx, dy)
            B += g
        return B

    @staticmethod
    def _exact_perimeter(verts: List[Tuple[int, int]]) -> float:
        """精确周长"""
        per = 0.0
        n = len(verts)
        for i in range(n):
            x1, y1 = verts[i]
            x2, y2 = verts[(i+1) % n]
            per += math.hypot(x2-x1, y2-y1)
        return per

    @staticmethod
    def _polygon_centroid(verts: List[Tuple[int, int]]) -> Tuple[float, float]:
        """质心位置"""
        n = len(verts)
        if n == 0:
            return (0, 0)

        area = 0
        cx = cy = 0

        for i in range(n):
            x0, y0 = verts[i]
            x1, y1 = verts[(i+1) % n]
            cross = x0*y1 - x1*y0
            area += cross
            cx += (x0 + x1) * cross
            cy += (y0 + y1) * cross

        if area == 0:
            # 退化多边形，返回顶点平均值
            xs = [v[0] for v in verts]
            ys = [v[1] for v in verts]
            return (sum(xs)/n, sum(ys)/n)

        area *= 0.5
        cx /= (6 * area)
        cy /= (6 * area)
        return (cx, cy)

    def find_optimal_stride(self, max_stride: int = None) -> Tuple[int, float]:
        """
        寻找最优步长：使圆度最接近π的步长
        返回: (最优步长, 对应的圆度)
        """
        if self.optimal_stride is not None:
            return self.optimal_stride, self.optimal_xi

        verts = self.ordered
        n = len(verts)

        # 根据半径自动确定最大搜索步长
        if max_stride is None:
            R = self.estimated_radius
            # 步长随半径增大而增大，但不超过总点数的1/8
            max_stride = max(1, int(R / 8))

        best_stride = 1
        best_xi = (self.perimeter ** 2) / (4.0 * self.area)
        best_error = abs(best_xi - math.pi)

        # 测试不同步长
        for stride in range(2, max_stride + 1):
            if n < stride + 2:
                continue

            total_xi = 0.0
            count = 0

            # 多个起始位置取平均
            for start in range(stride):
                sampled = []
                for i in range(start, n, stride):
                    sampled.append(verts[i])

                if len(sampled) < 3:
                    continue

                # 计算采样多边形的周长和面积
                per = 0.0
                area = 0.0
                m = len(sampled)

                for i in range(m):
                    x1, y1 = sampled[i]
                    x2, y2 = sampled[(i+1) % m]
                    per += math.hypot(x2 - x1, y2 - y1)
                    area += x1 * y2 - x2 * y1

                area = abs(area) / 2.0
                if area > 0:
                    xi = (per * per) / (4.0 * area)
                    total_xi += xi
                    count += 1

            if count > 0:
                avg_xi = total_xi / count
                error = abs(avg_xi - math.pi)

                if error < best_error:
                    best_error = error
                    best_xi = avg_xi
                    best_stride = stride

        self.optimal_stride = best_stride
        self.optimal_xi = best_xi
        return best_stride, best_xi

    def isoperimetric_circularity(self) -> float:
        """
        使用最优步长计算等周型圆度
        """
        if self.optimal_stride is None:
            self.find_optimal_stride()

        if self.optimal_stride == 1:
            return (self.perimeter ** 2) / (4.0 * self.area)

        return self.optimal_xi

    def curvature_circularity(self) -> float:
        """曲率型圆度"""
        verts = self.ordered
        n = len(verts)
        if n < 3:
            return float('inf')

        cx, cy = self.centroid
        sum_rho_ds = 0.0
        sum_rho2_ds = 0.0

        for i in range(n):
            x, y = verts[i]
            rho = math.hypot(x - cx, y - cy)
            x2, y2 = verts[(i+1) % n]
            ds = math.hypot(x2 - x, y2 - y)

            sum_rho_ds += rho * ds
            sum_rho2_ds += (rho * rho) * ds

        if sum_rho_ds == 0:
            return float('inf')

        return math.pi * self.perimeter * sum_rho2_ds / (sum_rho_ds ** 2)

    def summary(self) -> Dict[str, float]:
        """汇总信息"""
        xi_iso = self.isoperimetric_circularity()
        xi_cur = self.curvature_circularity()
        return {
            "半径估计": self.estimated_radius,
            "顶点数": len(self.ordered),
            "最优步长": self.optimal_stride,
            "周长": self.perimeter,
            "面积": self.area,
            "等周型圆度": xi_iso,
            "曲率型圆度": xi_cur,
            "等周型相对误差": (xi_iso/math.pi - 1) * 100,
            "曲率型相对误差": (xi_cur/math.pi - 1) * 100
        }


# ----- 边界生成器 -----
def generate_disk_boundary(radius: int) -> Set[Tuple[int, int]]:
    """Bresenham 圆生成算法"""
    pts = set()
    x = 0
    y = radius
    d = 3 - 2 * radius

    def add8(a, b):
        pts.update({(a, b), (-a, b), (a, -b), (-a, -b),
                    (b, a), (-b, a), (b, -a), (-b, -a)})

    while x <= y:
        add8(x, y)
        if d < 0:
            d = d + 4*x + 6
        else:
            d = d + 4*(x - y) + 10
            y -= 1
        x += 1
    return pts


# ----- 分析函数 -----
def analyze_circularity_range(start_radius: int, end_radius: int,
                              method: str = "ISO", step: int = 1,
                              find_optimal: bool = True) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    批量分析圆度

    参数:
        start_radius: 起始半径
        end_radius: 结束半径
        method: "ISO"等周型 / "CUR"曲率型
        step: 步长
        find_optimal: 是否使用最优步长

    返回:
        radii: 半径数组
        xis: 圆度数组
        strides: 步长数组（仅find_optimal=True时有效）
    """
    radii = []
    xis = []
    strides = []

    method_name = "等周型" if method == "ISO" else "曲率型"
    opt_str = "（使用最优步长）" if find_optimal else ""
    print(f"\n分析{method_name}{opt_str} 半径范围 [{start_radius}, {end_radius}], 步长={step}")
    print("-" * 60)

    progress_step = max(1, (end_radius - start_radius) // 10)

    for R in range(start_radius, end_radius + 1, step):
        try:
            boundary = generate_disk_boundary(R)
            dc = DigitalCircularity(boundary)

            if find_optimal:
                stride, xi = dc.find_optimal_stride()
                strides.append(stride)
            else:
                xi = dc.isoperimetric_circularity() if method == "ISO" else dc.curvature_circularity()
                strides.append(1)

            radii.append(R)
            xis.append(xi)

            if R % progress_step == 0 or R == end_radius:
                if find_optimal:
                    print(
                        f"  R={R:4d}: stride={strides[-1]:2d}, ξ={xi:.8f}, 误差={xi-math.pi:.8f}")
                else:
                    print(f"  R={R:4d}: ξ={xi:.8f}, 误差={xi-math.pi:.8f}")

        except Exception as e:
            print(f"  R={R} 计算失败: {e}")

    return np.array(radii), np.array(xis), np.array(strides)


def fit_power_law(radii: np.ndarray, xis: np.ndarray) -> Dict:
    """
    拟合幂律: ξ(R) = π + α / R^β
    """
    errors = xis - math.pi

    # 使用较大的半径进行拟合（避免小半径波动）
    min_fit_radius = max(10, radii[len(radii)//3])
    mask = radii >= min_fit_radius

    R_fit = radii[mask]
    error_fit = errors[mask]

    if len(R_fit) < 5:
        return {'alpha': 0, 'beta': 0, 'r2': 0, 'formula': '数据不足'}

    def power_law(R, alpha, beta):
        return alpha / (R ** beta)

    try:
        # 对数变换获取初始值
        log_R = np.log(R_fit)
        log_error = np.log(error_fit)
        slope, intercept = np.polyfit(log_R, log_error, 1)
        beta_init = -slope
        alpha_init = np.exp(intercept)

        # 非线性拟合
        popt, _ = curve_fit(power_law, R_fit, error_fit,
                            p0=[alpha_init, beta_init],
                            maxfev=5000)
        alpha, beta = popt

        # 计算R^2
        residuals = error_fit - power_law(R_fit, alpha, beta)
        ss_res = np.sum(residuals**2)
        ss_tot = np.sum((error_fit - np.mean(error_fit))**2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        return {
            'alpha': alpha,
            'beta': beta,
            'r2': r2,
            'formula': f"ξ(R) = π + {alpha:.6f}/R^{beta:.4f}"
        }
    except Exception as e:
        return {'alpha': 0, 'beta': 0, 'r2': 0, 'formula': f'拟合失败'}


# ----- 可视化函数 -----
def plot_circularity_analysis(radii: np.ndarray, xis: np.ndarray,
                              strides: np.ndarray = None,
                              fit_result: Dict = None,
                              method_name: str = "等周型"):
    """
    综合可视化分析结果
    """
    fig = plt.figure(figsize=(16, 10))

    errors = xis - math.pi

    # 1. 圆度随半径变化
    ax1 = plt.subplot(2, 3, 1)
    ax1.plot(radii, xis, 'b-', linewidth=1, alpha=0.6, label='数字圆')
    ax1.axhline(y=math.pi, color='r', linestyle='--', linewidth=2,
                label=f'π = {math.pi:.8f}')

    min_idx = np.argmin(xis)
    ax1.scatter(radii[min_idx], xis[min_idx], color='green', s=100,
                marker='*', zorder=5, label=f'最小值: R={radii[min_idx]}')

    ax1.set_xlabel('半径 R')
    ax1.set_ylabel(f'{method_name}圆度 ξ')
    ax1.set_title('圆度随半径变化')
    ax1.legend(fontsize=8)
    ax1.grid(True, alpha=0.3)

    # 2. 误差衰减（对数坐标）
    ax2 = plt.subplot(2, 3, 2)
    ax2.loglog(radii, errors, 'b.', markersize=3, alpha=0.5, label='数据点')

    if fit_result and fit_result['beta'] > 0:
        R_smooth = np.logspace(np.log10(radii[0]), np.log10(radii[-1]), 100)
        error_smooth = fit_result['alpha'] / (R_smooth ** fit_result['beta'])
        ax2.loglog(R_smooth, error_smooth, 'r-', linewidth=2,
                   label=f"拟合: {fit_result['alpha']:.4f}/R^{fit_result['beta']:.4f}")

        # 参考线
        R_ref = np.logspace(np.log10(radii[0]), np.log10(radii[-1]), 10)
        ax2.loglog(R_ref, 1/R_ref, 'g--', alpha=0.5, label='1/R')
        ax2.loglog(R_ref, 1/(R_ref**2), 'y--', alpha=0.5, label='1/R^2')

    ax2.set_xlabel('半径 (对数)')
    ax2.set_ylabel('误差 (对数)')
    ax2.set_title('误差衰减规律')
    ax2.legend(fontsize=8)
    ax2.grid(True, alpha=0.3, which='both')

    # 3. 误差直方图
    ax3 = plt.subplot(2, 3, 3)
    ax3.hist(errors, bins=30, edgecolor='black', alpha=0.7)
    ax3.axvline(x=np.mean(errors), color='r', linestyle='--',
                label=f'均值: {np.mean(errors):.6f}')
    ax3.set_xlabel('误差')
    ax3.set_ylabel('频次')
    ax3.set_title('误差分布')
    ax3.legend(fontsize=8)
    ax3.grid(True, alpha=0.3)

    # 4. 步长分析（如果有）
    if strides is not None and len(strides) == len(radii):
        ax4 = plt.subplot(2, 3, 4)
        ax4.plot(radii, strides, 'bo-', markersize=3, alpha=0.6)
        ax4.set_xlabel('半径 R')
        ax4.set_ylabel('最优步长')
        ax4.set_title('最优步长与半径关系')
        ax4.grid(True, alpha=0.3)

        # 拟合步长公式
        try:
            def log_fit(R, a, b):
                return a * np.log(R) + b
            popt, _ = curve_fit(log_fit, radii, strides)
            R_smooth = np.linspace(radii[0], radii[-1], 100)
            stride_fit = log_fit(R_smooth, *popt)
            ax4.plot(R_smooth, stride_fit, 'r--',
                     label=f'拟合: {popt[0]:.2f}·ln(R) + {popt[1]:.2f}')
            ax4.legend(fontsize=8)
        except:
            pass

    # 5. 相对误差分布
    ax5 = plt.subplot(2, 3, 5)
    rel_errors = (xis/math.pi - 1) * 100
    ax5.hist(rel_errors, bins=30, edgecolor='black', alpha=0.7)
    ax5.axvline(x=np.mean(rel_errors), color='r', linestyle='--',
                label=f'均值: {np.mean(rel_errors):.4f}%')
    ax5.set_xlabel('相对误差 (%)')
    ax5.set_ylabel('频次')
    ax5.set_title('相对误差分布')
    ax5.legend(fontsize=8)
    ax5.grid(True, alpha=0.3)

    # 6. 统计信息
    ax6 = plt.subplot(2, 3, 6)
    ax6.axis('off')

    info = f"""
    【{method_name}圆度分析统计】
    ============================
    半径范围: [{radii[0]}, {radii[-1]}]
    样本数量: {len(radii)}
    
    圆度:
        最小值: {np.min(xis):.10f} (R={radii[np.argmin(xis)]})
        最大值: {np.max(xis):.10f}
        平均值: {np.mean(xis):.10f}
    
    误差:
        最小值: {np.min(errors):.10f}
        平均值: {np.mean(errors):.10f}
    
    相对误差:
        最小值: {(np.min(xis)/math.pi-1)*100:.6f}%
        平均值: {(np.mean(xis)/math.pi-1)*100:.6f}%
    
    理想圆度 = {math.pi:.10f}
    """

    if fit_result and fit_result['beta'] > 0:
        info += f"""
    
    拟合结果:
        {fit_result['formula']}
        拟合优度 R^2 = {fit_result['r2']:.6f}
    """

    if strides is not None and len(strides) == len(radii):
        info += f"""
    
    步长统计:
        平均步长: {np.mean(strides):.2f}
        最大步长: {np.max(strides)}
        最小步长: {np.min(strides)}
    """

    ax6.text(0.05, 0.95, info, transform=ax6.transAxes,
             fontsize=9, verticalalignment='top',
             bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))

    plt.suptitle(f'数字圆{method_name}圆度分析 (半径范围: {radii[0]}-{radii[-1]})',
                 fontsize=14, y=1.02)
    plt.tight_layout()
    plt.show()


def print_optimal_radii(radii: np.ndarray, xis: np.ndarray, strides: np.ndarray = None):
    """
    打印最优半径（局部最小值）
    """
    # 寻找局部最小值
    local_min_indices = []
    for i in range(1, len(xis)-1):
        if xis[i] < xis[i-1] and xis[i] < xis[i+1]:
            local_min_indices.append(i)

    print("\n" + "="*70)
    print("【局部最优半径（圆度局部最小值）】")
    print("="*70)
    print("半径\t圆度\t\t误差\t\t相对误差%\t" + ("步长" if strides is not None else ""))
    print("-" * 70)

    # 按误差排序，显示最好的10个
    candidates = [(radii[i], xis[i], strides[i] if strides is not None else 1)
                  for i in local_min_indices]
    candidates.sort(key=lambda x: x[1])  # 按圆度排序

    for R, xi, s in candidates[:15]:
        error = xi - math.pi
        rel_error = (xi/math.pi - 1) * 100
        if strides is not None:
            print(f"{R:4d}\t{xi:.10f}\t{error:.10f}\t{rel_error:.6f}%\t{s:2d}")
        else:
            print(f"{R:4d}\t{xi:.10f}\t{error:.10f}\t{rel_error:.6f}%")

    # 全局最小值
    global_min_idx = np.argmin(xis)
    print("\n" + "="*70)
    print("【全局最小值】")
    print("="*70)
    print(f"最优半径: {radii[global_min_idx]}")
    print(f"最小圆度: {xis[global_min_idx]:.10f}")
    print(f"与π的误差: {xis[global_min_idx] - math.pi:.10f}")
    print(f"相对误差: {(xis[global_min_idx]/math.pi - 1)*100:.8f}%")
    if strides is not None:
        print(f"最优步长: {strides[global_min_idx]}")


# ==================== 主程序 ====================
if __name__ == "__main__":
    # 设置中文显示
    try:
        plt.rcParams['font.sans-serif'] = ['Noto Serif CJK SC']
        plt.rcParams['font.weight'] = 'normal'
        plt.rcParams['axes.unicode_minus'] = True  # 使用 Unicode 减号
    except:
        pass

    # 分析参数
    R_MIN, R_MAX, R_STEP = 50, 5000, 5

    print("="*70)
    print("数字圆圆度分析")
    print("="*70)

    # 1. 等周型圆度分析
    radii_iso, xis_iso, strides_iso = analyze_circularity_range(
        R_MIN, R_MAX, method="ISO", step=R_STEP, find_optimal=True)

    # 拟合等周型
    fit_iso = fit_power_law(radii_iso, xis_iso)

    # 可视化等周型
    plot_circularity_analysis(radii_iso, xis_iso, strides_iso, fit_iso, "等周型")

    # 打印最优半径
    print_optimal_radii(radii_iso, xis_iso, strides_iso)

    # 2. 曲率型圆度分析
    radii_cur, xis_cur, _ = analyze_circularity_range(
        R_MIN, R_MAX, method="CUR", step=R_STEP, find_optimal=False)

    # 拟合曲率型
    fit_cur = fit_power_law(radii_cur, xis_cur)

    # 可视化曲率型
    plot_circularity_analysis(radii_cur, xis_cur, None, fit_cur, "曲率型")

    # 打印曲率型最优半径
    print_optimal_radii(radii_cur, xis_cur)

    # 3. 最终结论
    print("\n" + "="*70)
    print("【最终结论】")
    print("="*70)

    min_idx_iso = np.argmin(xis_iso)
    min_idx_cur = np.argmin(xis_cur)

    print(f"""
通过对半径范围 [{R_MIN}, {R_MAX}] 的数字圆进行系统分析，得到以下结论：

1. 等周型圆度 (ξ_iso = P^2/(4A))：
    • 最小值: ξ_min = {xis_iso[min_idx_iso]:.10f} (R={radii_iso[min_idx_iso]}, 步长={strides_iso[min_idx_iso]})
    • 与π的误差: {xis_iso[min_idx_iso]-math.pi:.10f}
    • 相对误差: {(xis_iso[min_idx_iso]/math.pi-1)*100:.8f}%
    • 误差衰减规律: {fit_iso['formula']}
    • 拟合优度: R^2 = {fit_iso['r2']:.6f}

2. 曲率型圆度 (ξ_cur)：
    • 最小值: ξ_min = {xis_cur[min_idx_cur]:.10f} (R={radii_cur[min_idx_cur]})
    • 与π的误差: {xis_cur[min_idx_cur]-math.pi:.10f}
    • 相对误差: {(xis_cur[min_idx_cur]/math.pi-1)*100:.8f}%
    • 误差衰减规律: {fit_cur['formula']}
    • 拟合优度: R^2 = {fit_cur['r2']:.6f}

这意味着在像素网格中，我们只能无限接近完美圆，但永远无法画出真正的圆。
    """)
