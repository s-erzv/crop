"""
Train Random Forest crop recommendation model + ETL into SQLite star schema.
All 6 fixes applied: feature engineering, calibration, OOD, full SHAP in DW.
Run: python model/train.py (from backend/ directory)
"""

import os
import json
import sqlite3
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "Crop_recommendation.csv")
MODEL_DIR = os.path.join(BASE_DIR, "model")
DB_PATH = os.path.join(BASE_DIR, "crop_dw.db")

ORIGINAL_FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
ENGINEERED_FEATURES = ["N_P_ratio", "N_K_ratio", "pH_rainfall"]
ALL_FEATURES = ORIGINAL_FEATURES + ENGINEERED_FEATURES

CROP_CATEGORIES = {
    "rice": "Grains", "maize": "Grains",
    "chickpea": "Legumes", "kidneybeans": "Legumes", "pigeonpeas": "Legumes",
    "mothbeans": "Legumes", "mungbean": "Legumes", "blackgram": "Legumes", "lentil": "Legumes",
    "pomegranate": "Fruits", "banana": "Fruits", "mango": "Fruits", "grapes": "Fruits",
    "watermelon": "Fruits", "muskmelon": "Fruits", "apple": "Fruits", "orange": "Fruits",
    "papaya": "Fruits", "coconut": "Fruits",
    "cotton": "Cash Crops", "jute": "Cash Crops", "coffee": "Cash Crops"
}

CROP_DESCRIPTIONS = {
    "rice": "Staple grain requiring flooded paddies and high humidity",
    "maize": "Versatile grain crop adaptable to many climates",
    "chickpea": "Drought-tolerant legume rich in protein",
    "kidneybeans": "High-protein legume, grows well in moderate conditions",
    "pigeonpeas": "Drought-resistant legume suited for tropical regions",
    "mothbeans": "Heat-tolerant legume for arid climates",
    "mungbean": "Fast-growing legume for warm humid conditions",
    "blackgram": "Protein-rich legume for tropical climates",
    "lentil": "Cool-season legume needing well-drained soil",
    "pomegranate": "Fruit tree thriving in hot dry climates",
    "banana": "Tropical fruit requiring high humidity and warmth",
    "mango": "Tropical tree fruit needing warm temperatures",
    "grapes": "Vine fruit requiring warm dry summers",
    "watermelon": "Warm-season fruit needing sandy well-drained soil",
    "muskmelon": "Warm-season melon requiring dry conditions",
    "apple": "Cool-climate fruit requiring cold winters",
    "orange": "Citrus fruit thriving in subtropical climates",
    "papaya": "Fast-growing tropical fruit tree",
    "coconut": "Tropical palm requiring coastal conditions",
    "cotton": "Cash crop needing warm long growing seasons",
    "jute": "Fiber crop requiring high rainfall and humidity",
    "coffee": "Shade-grown tropical shrub for highland regions"
}


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """Fix 1: Compute derived features."""
    df = df.copy()
    df["N_P_ratio"] = df["N"] / (df["P"] + 1e-6)
    df["N_K_ratio"] = df["N"] / (df["K"] + 1e-6)
    df["pH_rainfall"] = df["ph"] * df["rainfall"]
    return df


def compute_feature_stats(df: pd.DataFrame) -> dict:
    """Fix 3: Compute per-feature stats for OOD detection (original features only)."""
    stats = {}
    for feat in ORIGINAL_FEATURES:
        col = df[feat]
        stats[feat] = {
            "mean": float(col.mean()),
            "std": float(col.std()),
            "min": float(col.min()),
            "max": float(col.max()),
            "p1": float(col.quantile(0.01)),
            "p99": float(col.quantile(0.99)),
        }
    return stats


def shap_to_canonical(shap_vals_all, n_train: int, n_features: int, n_classes: int) -> np.ndarray:
    """Normalize SHAP output to (n_train, n_features, n_classes) regardless of API version."""
    if isinstance(shap_vals_all, list):
        # Old API: list of n_classes arrays, each (n_train, n_features)
        arr = np.stack(shap_vals_all, axis=2)
    else:
        arr = np.array(shap_vals_all)
        if arr.shape == (n_classes, n_train, n_features):
            # Old ndarray layout
            arr = arr.transpose(1, 2, 0)
        # New API: already (n_train, n_features, n_classes)
    return arr  # (n_train, n_features, n_classes)


def create_star_schema(conn):
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS Dim_Soil (
            soil_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nitrogen REAL NOT NULL,
            phosphorus REAL NOT NULL,
            potassium REAL NOT NULL,
            ph REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Dim_Climate (
            climate_id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            rainfall REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Dim_Crop (
            crop_id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Dim_Time (
            time_id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            date TEXT NOT NULL,
            hour INTEGER NOT NULL,
            day_of_week TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Fact_CropRecommendation (
            fact_id          INTEGER PRIMARY KEY AUTOINCREMENT,
            soil_id          INTEGER NOT NULL REFERENCES Dim_Soil(soil_id),
            climate_id       INTEGER NOT NULL REFERENCES Dim_Climate(climate_id),
            crop_id          INTEGER NOT NULL REFERENCES Dim_Crop(crop_id),
            time_id          INTEGER NOT NULL REFERENCES Dim_Time(time_id),
            confidence_score REAL NOT NULL,
            is_training      INTEGER NOT NULL DEFAULT 0,
            true_label       TEXT,
            shap_n           REAL,
            shap_p           REAL,
            shap_k           REAL,
            shap_temperature REAL,
            shap_humidity    REAL,
            shap_ph          REAL,
            shap_rainfall    REAL,
            shap_n_p_ratio   REAL,
            shap_n_k_ratio   REAL,
            shap_ph_rainfall REAL,
            user_feedback    INTEGER DEFAULT NULL,
            model_version    TEXT
        );
    """)
    conn.commit()
    print("Star schema created (with engineered SHAP columns + is_training + true_label).")


def populate_dim_crop(conn, labels):
    cur = conn.cursor()
    for label in labels:
        category = CROP_CATEGORIES.get(label, "Other")
        description = CROP_DESCRIPTIONS.get(label, f"{label.capitalize()} crop")
        cur.execute(
            "INSERT OR IGNORE INTO Dim_Crop (label, category, description) VALUES (?, ?, ?)",
            (label, category, description)
        )
    conn.commit()
    print(f"Dim_Crop populated with {len(labels)} crops.")


def etl_training_with_shap(conn, df_train: pd.DataFrame, classes: np.ndarray,
                            shap_for_preds: np.ndarray, confidences: np.ndarray,
                            y_train: np.ndarray, model_version: str = ""):
    """Fix 4: Store ALL training rows to DW with full SHAP values."""
    cur = conn.cursor()
    now = datetime.now()
    ts = now.isoformat()
    date_str = now.date().isoformat()
    dow = now.strftime("%A")

    # Pre-fetch crop_id map
    cur.execute("SELECT label, crop_id FROM Dim_Crop")
    crop_id_map = {row[0]: row[1] for row in cur.fetchall()}

    # Insert shared Dim_Time row (all training rows share same training timestamp)
    cur.execute(
        "INSERT INTO Dim_Time (timestamp, date, hour, day_of_week) VALUES (?, ?, ?, ?)",
        (ts, date_str, now.hour, dow)
    )
    time_id = cur.lastrowid

    count = 0
    for i, (_, row) in enumerate(df_train.iterrows()):
        cur.execute(
            "INSERT INTO Dim_Soil (nitrogen, phosphorus, potassium, ph) VALUES (?, ?, ?, ?)",
            (row["N"], row["P"], row["K"], row["ph"])
        )
        soil_id = cur.lastrowid

        cur.execute(
            "INSERT INTO Dim_Climate (temperature, humidity, rainfall) VALUES (?, ?, ?)",
            (row["temperature"], row["humidity"], row["rainfall"])
        )
        climate_id = cur.lastrowid

        true_label = row["label"]
        crop_id = crop_id_map[true_label]
        confidence = float(confidences[i])
        sv = shap_for_preds[i]  # (10,) — all features in ALL_FEATURES order

        cur.execute("""
            INSERT INTO Fact_CropRecommendation
            (soil_id, climate_id, crop_id, time_id, confidence_score,
             is_training, true_label,
             shap_n, shap_p, shap_k, shap_temperature, shap_humidity, shap_ph, shap_rainfall,
             shap_n_p_ratio, shap_n_k_ratio, shap_ph_rainfall,
             model_version)
            VALUES (?, ?, ?, ?, ?, 1, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?)
        """, (
            soil_id, climate_id, crop_id, time_id, confidence,
            true_label,
            float(sv[0]), float(sv[1]), float(sv[2]),
            float(sv[3]), float(sv[4]), float(sv[5]), float(sv[6]),
            float(sv[7]), float(sv[8]), float(sv[9]),
            model_version,
        ))
        count += 1

        if count % 500 == 0:
            conn.commit()
            print(f"  Stored {count}/{len(df_train)} training rows...")

    conn.commit()
    print(f"ETL complete: {count} training rows stored with SHAP values.")


def train():
    print("=" * 65)
    print("CROP RECOMMENDATION MODEL TRAINING  (v3 — all fixes applied)")
    print("=" * 65)

    model_version = datetime.now().isoformat()

    # ── 1. Load + feature engineering ─────────────────────────────────────
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} rows, {df['label'].nunique()} crops")
    df = add_derived_features(df)
    print(f"Derived features added: {ENGINEERED_FEATURES}")

    # ── 2. Feature stats for OOD ──────────────────────────────────────────
    feature_stats = compute_feature_stats(df)
    with open(os.path.join(MODEL_DIR, "feature_stats.json"), "w") as fh:
        json.dump(feature_stats, fh, indent=2)
    print("feature_stats.json saved.")

    # ── 3. Stratified split (keep index mapping for df_train) ─────────────
    all_idx = np.arange(len(df))
    train_idx, test_idx = train_test_split(
        all_idx, test_size=0.2, random_state=42, stratify=df["label"].values
    )
    df_train = df.iloc[train_idx].reset_index(drop=True)
    df_test  = df.iloc[test_idx].reset_index(drop=True)

    X_train = df_train[ALL_FEATURES].values
    X_test  = df_test[ALL_FEATURES].values
    y_train = df_train["label"].values
    y_test  = df_test["label"].values
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")

    # ── 4. Train base RF (for SHAP — TreeExplainer needs raw tree model) ──
    print("Training base RandomForest (for SHAP)...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    # ── 5. Fix 2: Calibrated model — sigmoid (Platt Scaling) avoids 1.0-collapse
    print("Training calibrated model (Sigmoid/Platt Scaling, cv=5)...")
    calib_rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    calibrated_clf = CalibratedClassifierCV(calib_rf, method="sigmoid", cv=5)
    calibrated_clf.fit(X_train, y_train)
    print("Calibration complete.")

    # ── 6. Evaluate (use calibrated model for final metrics) ──────────────
    y_pred = calibrated_clf.predict(X_test)
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="macro", zero_division=0)
    rec  = recall_score(y_test, y_pred, average="macro", zero_division=0)
    f1   = f1_score(y_test, y_pred, average="macro", zero_division=0)
    cm   = confusion_matrix(y_test, y_pred, labels=sorted(calibrated_clf.classes_)).tolist()
    print(f"Accuracy(calib):  {acc:.4f}")
    print(f"Precision(macro): {prec:.4f}")
    print(f"F1(macro):        {f1:.4f}")

    # ── 7. Fix 1+4: SHAP explainer on base RF ─────────────────────────────
    print("Building SHAP TreeExplainer on base RF...")
    explainer = shap.TreeExplainer(rf)

    n_classes  = len(rf.classes_)
    n_features = len(ALL_FEATURES)
    n_train    = len(X_train)

    print(f"Computing SHAP for all {n_train} training samples...")
    shap_vals_all = explainer.shap_values(X_train)
    # Normalize to canonical (n_train, n_features, n_classes)
    arr = shap_to_canonical(shap_vals_all, n_train, n_features, n_classes)
    print(f"SHAP array shape (canonical): {arr.shape}")

    # Global feature importance: mean |SHAP| across all samples & classes
    mean_abs_shap = np.abs(arr).mean(axis=(0, 2))   # (n_features,)
    global_shap = {f: float(v) for f, v in zip(ALL_FEATURES, mean_abs_shap)}
    print("Global SHAP importance:", {k: round(v, 5) for k, v in global_shap.items()})

    # Per-sample: SHAP for the predicted class (from calibrated model)
    proba_train   = calibrated_clf.predict_proba(X_train)   # (n_train, n_classes)
    pred_idx_train = np.argmax(proba_train, axis=1)
    confidence_train = proba_train[np.arange(n_train), pred_idx_train]
    # arr[i, :, pred_idx_train[i]] — vectorized via list comp
    shap_for_preds = np.array([arr[i, :, pred_idx_train[i]] for i in range(n_train)])

    # ── 8. Setup DW + ETL training data ───────────────────────────────────
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    create_star_schema(conn)
    populate_dim_crop(conn, sorted(df["label"].unique().tolist()))
    etl_training_with_shap(conn, df_train, calibrated_clf.classes_,
                           shap_for_preds, confidence_train, y_train, model_version)
    conn.close()

    # ── 9. Fix 3: IsolationForest OOD detector (on original 7 features) ──
    print("Training IsolationForest for OOD detection...")
    X_orig_all = df[ORIGINAL_FEATURES].values
    ood_detector = IsolationForest(contamination=0.05, random_state=42, n_jobs=-1)
    ood_detector.fit(X_orig_all)
    print("OOD detector trained.")

    # ── 10. Save all artifacts ────────────────────────────────────────────
    joblib.dump(rf,              os.path.join(MODEL_DIR, "crop_model.pkl"))
    joblib.dump(calibrated_clf,  os.path.join(MODEL_DIR, "calibrated_model.pkl"))
    joblib.dump(explainer,       os.path.join(MODEL_DIR, "shap_explainer.pkl"))
    joblib.dump(ood_detector,    os.path.join(MODEL_DIR, "ood_detector.pkl"))

    evaluation = {
        "model_version": model_version,
        "accuracy": round(acc, 4),
        "precision_macro": round(prec, 4),
        "recall_macro": round(rec, 4),
        "f1_macro": round(f1, 4),
        "classes": sorted(calibrated_clf.classes_.tolist()),
        "n_features": len(ALL_FEATURES),
        "original_features": ORIGINAL_FEATURES,
        "engineered_features": ENGINEERED_FEATURES,
        "all_features": ALL_FEATURES,
        "confusion_matrix": cm,
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
        "global_shap_importance": global_shap,
        "feature_stats": feature_stats,
    }
    with open(os.path.join(MODEL_DIR, "evaluation.json"), "w") as fh:
        json.dump(evaluation, fh, indent=2)

    print("=" * 65)
    print("Artifacts: crop_model.pkl, calibrated_model.pkl, shap_explainer.pkl")
    print("           ood_detector.pkl, feature_stats.json, evaluation.json")
    print("Training complete!")


if __name__ == "__main__":
    train()
