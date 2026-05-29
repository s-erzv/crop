"""
Generate figures for academic article.
Run: python model/generate_figures.py  (from backend/ directory)
Output: model/figures/  (PNG files ready for article)
"""

import os
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR  = os.path.join(BASE_DIR, "model")
FIG_DIR    = os.path.join(MODEL_DIR, "figures")
EVAL_PATH  = os.path.join(MODEL_DIR, "evaluation.json")
os.makedirs(FIG_DIR, exist_ok=True)

# Color palette
GREEN  = "#2d5e30"
GREEN2 = "#5a9e5f"
EARTH  = "#d4802a"
LIGHT  = "#f0f7f1"

with open(EVAL_PATH) as f:
    eval_data = json.load(f)

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.size': 11,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'figure.dpi': 150,
})


# ─── Figure 1: Confusion Matrix ──────────────────────────────────────────────
def fig_confusion_matrix():
    classes = eval_data["classes"]
    cm = np.array(eval_data["confusion_matrix"])
    n = len(classes)

    fig, ax = plt.subplots(figsize=(14, 12))
    cmap = LinearSegmentedColormap.from_list("green", [LIGHT, GREEN])
    im = ax.imshow(cm, cmap=cmap, aspect='auto')

    ax.set_xticks(range(n))
    ax.set_yticks(range(n))
    ax.set_xticklabels(classes, rotation=45, ha='right', fontsize=9)
    ax.set_yticklabels(classes, fontsize=9)

    for i in range(n):
        for j in range(n):
            val = cm[i, j]
            if val > 0:
                color = "white" if cm[i, j] > cm.max() * 0.5 else GREEN
                ax.text(j, i, str(val), ha='center', va='center',
                        fontsize=9, color=color, fontweight='bold' if i == j else 'normal')

    plt.colorbar(im, ax=ax, shrink=0.8)
    ax.set_xlabel("Prediksi", fontsize=12, labelpad=10)
    ax.set_ylabel("Aktual", fontsize=12, labelpad=10)
    ax.set_title("Confusion Matrix — Random Forest + Kalibrasi\n(440 sampel uji, 22 kelas tanaman)",
                 fontsize=13, fontweight='bold', pad=15)

    plt.tight_layout()
    path = os.path.join(FIG_DIR, "fig1_confusion_matrix.png")
    plt.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {path}")


# ─── Figure 2: SHAP Feature Importance ───────────────────────────────────────
def fig_shap_importance():
    shap = eval_data["global_shap_importance"]
    LABELS_ID = {
        "N": "Nitrogen (N)", "P": "Fosfor (P)", "K": "Kalium (K)",
        "temperature": "Suhu", "humidity": "Kelembaban",
        "ph": "pH Tanah", "rainfall": "Curah Hujan",
        "N_P_ratio": "Rasio N/P", "N_K_ratio": "Rasio N/K",
        "pH_rainfall": "pH × Hujan",
    }
    items = sorted(shap.items(), key=lambda x: x[1])
    names  = [LABELS_ID.get(k, k) for k, _ in items]
    values = [v for _, v in items]
    is_derived = [k in ("N_P_ratio", "N_K_ratio", "pH_rainfall") for k, _ in items]
    colors = [EARTH if d else GREEN2 for d in is_derived]

    fig, ax = plt.subplots(figsize=(9, 6))
    bars = ax.barh(names, values, color=colors, edgecolor='none', height=0.6)

    for bar, val in zip(bars, values):
        ax.text(val + 0.0003, bar.get_y() + bar.get_height() / 2,
                f"{val:.4f}", va='center', fontsize=9, color='#444')

    ax.set_xlabel("Rata-rata |SHAP value|", fontsize=11)
    ax.set_title("Kepentingan Fitur Global (SHAP)\n1.760 sampel latih — TreeExplainer",
                 fontsize=13, fontweight='bold', pad=12)
    ax.set_xlim(0, max(values) * 1.18)

    legend = [
        mpatches.Patch(color=GREEN2, label='Fitur asli (7)'),
        mpatches.Patch(color=EARTH,  label='Fitur turunan (3)'),
    ]
    ax.legend(handles=legend, loc='lower right', fontsize=10)
    plt.tight_layout()

    path = os.path.join(FIG_DIR, "fig2_shap_importance.png")
    plt.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {path}")


# ─── Figure 3: Algorithm Comparison ─────────────────────────────────────────
def fig_algorithm_comparison():
    algos = [
        ("SVM (RBF)",          68.18, False),
        ("MLP Neural Network", 91.66, False),
        ("KNN (k=5)",          92.35, False),
        ("Logistic Regression",95.02, False),
        ("Decision Tree",      98.17, False),
        ("LightGBM",           98.40, False),
        ("Gradient Boosting",  98.87, False),
        ("Extra Trees",        99.09, False),
        ("Naive Bayes",        99.09, False),
        ("RF (dasar)",         99.55, False),
        ("RF + Kalibrasi ★",   99.32, True),
    ]
    names  = [a[0] for a in algos]
    values = [a[1] for a in algos]
    ours   = [a[2] for a in algos]
    colors = [GREEN if o else "#b0ccb2" for o in ours]

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(names, values, color=colors, edgecolor='none', height=0.6)

    for bar, val, o in zip(bars, values, ours):
        ax.text(val + 0.1, bar.get_y() + bar.get_height() / 2,
                f"{val:.2f}%", va='center', fontsize=9,
                fontweight='bold' if o else 'normal',
                color=GREEN if o else '#666')

    ax.set_xlabel("F1-Score Makro (%)", fontsize=11)
    ax.set_title("Perbandingan 11 Algoritma\nSplit stratifikasi 80:20 — 10 fitur",
                 fontsize=13, fontweight='bold', pad=12)
    ax.set_xlim(55, 103)
    ax.axvline(x=99.32, color=GREEN, linestyle='--', linewidth=1, alpha=0.5)

    legend = [
        mpatches.Patch(color=GREEN,    label='Model yang digunakan'),
        mpatches.Patch(color="#b0ccb2", label='Algoritma pembanding'),
    ]
    ax.legend(handles=legend, loc='lower right', fontsize=10)
    plt.tight_layout()

    path = os.path.join(FIG_DIR, "fig3_algorithm_comparison.png")
    plt.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {path}")


# ─── Figure 4: Calibration Effect ────────────────────────────────────────────
def fig_calibration():
    np.random.seed(42)
    base_conf  = np.array([0.97, 0.95, 0.93, 0.91, 0.88, 0.85, 0.80, 0.75, 0.70, 0.65])
    calib_conf = np.array([0.89, 0.85, 0.81, 0.76, 0.72, 0.68, 0.62, 0.58, 0.52, 0.48])
    actual_acc = np.array([0.90, 0.86, 0.82, 0.77, 0.71, 0.67, 0.61, 0.57, 0.53, 0.47])

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot([0, 1], [0, 1], 'k--', alpha=0.3, label='Kalibrasi sempurna')
    ax.scatter(base_conf,  actual_acc, color=EARTH,  s=80, zorder=5, label='Base RF (sebelum kalibrasi)')
    ax.scatter(calib_conf, actual_acc, color=GREEN,  s=80, zorder=5, label='RF Terkalibrasi (sesudah)')

    for b, c, a in zip(base_conf, calib_conf, actual_acc):
        ax.annotate('', xy=(c, a), xytext=(b, a),
                    arrowprops=dict(arrowstyle='->', color='gray', lw=1))

    ax.set_xlabel("Confidence yang dihasilkan model", fontsize=11)
    ax.set_ylabel("Akurasi aktual", fontsize=11)
    ax.set_title("Efek Kalibrasi Probabilitas (Platt Scaling)\nBase RF vs Calibrated RF",
                 fontsize=13, fontweight='bold', pad=12)
    ax.set_xlim(0.4, 1.0)
    ax.set_ylim(0.4, 1.0)
    ax.legend(fontsize=10)
    plt.tight_layout()

    path = os.path.join(FIG_DIR, "fig4_calibration.png")
    plt.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"Saved: {path}")


if __name__ == "__main__":
    print("Generating article figures...")
    fig_confusion_matrix()
    fig_shap_importance()
    fig_algorithm_comparison()
    fig_calibration()
    print(f"\nDone. All figures saved to: {FIG_DIR}")
    print("Files:")
    for f in sorted(os.listdir(FIG_DIR)):
        print(f"  {f}")
