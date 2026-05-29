"""
Algorithm comparison for crop recommendation.
Compares RF (base + calibrated) against 7 other classifiers
using the same stratified 80:20 split and feature engineering.

Run: python model/compare_algorithms.py  (from backend/ directory)
"""

import os
import json
import time
import warnings
import numpy as np
import pandas as pd
warnings.filterwarnings("ignore")

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "Crop_recommendation.csv")
OUT_PATH  = os.path.join(BASE_DIR, "model", "comparison_results.json")

ORIGINAL_FEATURES   = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
ENGINEERED_FEATURES = ["N_P_ratio", "N_K_ratio", "pH_rainfall"]
ALL_FEATURES        = ORIGINAL_FEATURES + ENGINEERED_FEATURES


def add_derived_features(df):
    df = df.copy()
    df["N_P_ratio"]   = df["N"] / (df["P"] + 1e-6)
    df["N_K_ratio"]   = df["N"] / (df["K"] + 1e-6)
    df["pH_rainfall"] = df["ph"] * df["rainfall"]
    return df


def evaluate(name, model, X_train, y_train, X_test, y_test):
    t0 = time.time()
    model.fit(X_train, y_train)
    train_time = round(time.time() - t0, 3)

    t1 = time.time()
    y_pred = model.predict(X_test)
    infer_time = round((time.time() - t1) * 1000, 2)  # ms

    acc  = round(accuracy_score(y_test, y_pred) * 100, 2)
    prec = round(precision_score(y_test, y_pred, average="macro", zero_division=0) * 100, 2)
    rec  = round(recall_score(y_test, y_pred, average="macro", zero_division=0) * 100, 2)
    f1   = round(f1_score(y_test, y_pred, average="macro", zero_division=0) * 100, 2)

    result = {
        "model": name,
        "accuracy":        acc,
        "precision_macro": prec,
        "recall_macro":    rec,
        "f1_macro":        f1,
        "train_time_s":    train_time,
        "infer_time_ms":   infer_time,
    }
    print(f"  {name:<40} Acc={acc:.2f}%  F1={f1:.2f}%  Train={train_time}s")
    return result


def main():
    print("=" * 70)
    print("ALGORITHM COMPARISON — Crop Recommendation Dataset")
    print("=" * 70)

    df = pd.read_csv(DATA_PATH)
    df = add_derived_features(df)

    X = df[ALL_FEATURES].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}, Features: {len(ALL_FEATURES)}\n")

    models = [
        # Tree-based
        ("Decision Tree",
         DecisionTreeClassifier(random_state=42)),

        ("Random Forest (base)",
         RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)),

        ("Random Forest + Calibration (OURS)",
         CalibratedClassifierCV(
             RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
             method="sigmoid", cv=5
         )),

        ("Extra Trees",
         ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1)),

        ("Gradient Boosting",
         GradientBoostingClassifier(n_estimators=100, random_state=42)),

        # Instance-based
        ("K-Nearest Neighbors (k=5)",
         KNeighborsClassifier(n_neighbors=5, n_jobs=-1)),

        # Linear
        ("Logistic Regression",
         LogisticRegression(max_iter=1000, random_state=42, n_jobs=-1)),

        # Probabilistic
        ("Naive Bayes",
         GaussianNB()),

        # Neural
        ("MLP Neural Network",
         MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=500, random_state=42)),

        # SVM
        ("SVM (RBF kernel)",
         SVC(kernel="rbf", probability=True, random_state=42)),
    ]

    if HAS_LGB:
        models.append((
            "LightGBM",
            lgb.LGBMClassifier(n_estimators=100, random_state=42, n_jobs=-1, verbose=-1)
        ))

    results = []
    for name, model in models:
        try:
            r = evaluate(name, model, X_train, y_train, X_test, y_test)
            results.append(r)
        except Exception as e:
            print(f"  {name:<40} ERROR: {e}")

    # Sort by F1
    results.sort(key=lambda x: x["f1_macro"], reverse=True)

    print("\n" + "=" * 70)
    print(f"{'Rank':<5} {'Model':<42} {'Acc%':>6} {'Prec%':>6} {'Rec%':>6} {'F1%':>6} {'Train(s)':>9}")
    print("-" * 70)
    for i, r in enumerate(results, 1):
        marker = " ◄ OUR MODEL" if "OURS" in r["model"] else ""
        print(f"{i:<5} {r['model']:<42} {r['accuracy']:>6.2f} {r['precision_macro']:>6.2f} "
              f"{r['recall_macro']:>6.2f} {r['f1_macro']:>6.2f} {r['train_time_s']:>9.3f}{marker}")

    with open(OUT_PATH, "w") as fh:
        json.dump(results, fh, indent=2)
    print(f"\nResults saved to: {OUT_PATH}")


if __name__ == "__main__":
    main()
