"""
Prediction pipeline: load calibrated model + SHAP, OOD check, predict, store to DW.
"""

import json
import os
import sqlite3
import joblib
import numpy as np
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")
DB_PATH   = os.path.join(BASE_DIR, "crop_dw.db")

ORIGINAL_FEATURES   = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
ENGINEERED_FEATURES = ["N_P_ratio", "N_K_ratio", "pH_rainfall"]
ALL_FEATURES        = ORIGINAL_FEATURES + ENGINEERED_FEATURES

FEATURE_LABELS_ID = {
    "N": "Nitrogen (N)", "P": "Fosfor (P)", "K": "Kalium (K)",
    "temperature": "Suhu", "humidity": "Kelembaban",
    "ph": "pH Tanah", "rainfall": "Curah Hujan",
    "N_P_ratio": "Rasio N/P", "N_K_ratio": "Rasio N/K", "pH_rainfall": "pH × Hujan"
}

CROP_NAMES_ID = {
    "rice": "Padi", "maize": "Jagung", "chickpea": "Buncis Arab",
    "kidneybeans": "Kacang Merah", "pigeonpeas": "Kacang Gude",
    "mothbeans": "Kacang Moth", "mungbean": "Kacang Hijau",
    "blackgram": "Kacang Hitam", "lentil": "Lentil",
    "pomegranate": "Delima", "banana": "Pisang", "mango": "Mangga",
    "grapes": "Anggur", "watermelon": "Semangka", "muskmelon": "Melon",
    "apple": "Apel", "orange": "Jeruk", "papaya": "Pepaya",
    "coconut": "Kelapa", "cotton": "Kapas", "jute": "Rami", "coffee": "Kopi"
}

# ── Artifact cache ────────────────────────────────────────────────────────────
_calibrated_model = None
_base_model       = None
_explainer        = None
_ood_detector     = None
_feature_stats    = None


def load_artifacts():
    global _calibrated_model, _base_model, _explainer
    if _calibrated_model is None:
        _calibrated_model = joblib.load(os.path.join(MODEL_DIR, "calibrated_model.pkl"))
    if _base_model is None:
        _base_model = joblib.load(os.path.join(MODEL_DIR, "crop_model.pkl"))
    if _explainer is None:
        _explainer = joblib.load(os.path.join(MODEL_DIR, "shap_explainer.pkl"))
    return _calibrated_model, _base_model, _explainer


def load_ood_artifacts():
    global _ood_detector, _feature_stats
    if _ood_detector is None:
        _ood_detector = joblib.load(os.path.join(MODEL_DIR, "ood_detector.pkl"))
    if _feature_stats is None:
        with open(os.path.join(MODEL_DIR, "feature_stats.json")) as fh:
            _feature_stats = json.load(fh)
    return _ood_detector, _feature_stats


def add_derived_features(input_data: dict) -> dict:
    """Fix 1: Compute derived features from raw user input."""
    d = dict(input_data)
    d["N_P_ratio"]   = d["N"] / (d["P"] + 1e-6)
    d["N_K_ratio"]   = d["N"] / (d["K"] + 1e-6)
    d["pH_rainfall"] = d["ph"] * d["rainfall"]
    return d


def check_ood(input_data: dict) -> dict:
    """Fix 3: Check if input is out-of-distribution."""
    ood_detector, feature_stats = load_ood_artifacts()

    out_of_range = []
    detail_parts = []

    for feat in ORIGINAL_FEATURES:
        val   = input_data[feat]
        stats = feature_stats[feat]
        if val < stats["p1"] or val > stats["p99"]:
            label = FEATURE_LABELS_ID[feat]
            out_of_range.append(feat)
            detail_parts.append(
                f"{label} ({val:.1f}) di luar rentang tipikal "
                f"({stats['p1']:.1f}–{stats['p99']:.1f})"
            )

    # IsolationForest anomaly check
    X_orig = np.array([[input_data[f] for f in ORIGINAL_FEATURES]])
    anomaly_score  = float(ood_detector.decision_function(X_orig)[0])
    is_anomaly     = ood_detector.predict(X_orig)[0] == -1

    ood_warning = bool(out_of_range) or is_anomaly

    if detail_parts:
        ood_details = (
            "Input di luar distribusi data training: "
            + "; ".join(detail_parts)
            + ". Confidence mungkin tidak akurat."
        )
    elif is_anomaly:
        ood_details = (
            "Kombinasi nilai input tidak biasa dibandingkan data training "
            "(IsolationForest score: {:.3f}). Confidence mungkin tidak akurat.".format(anomaly_score)
        )
    else:
        ood_details = ""

    return {
        "ood_warning": ood_warning,
        "ood_details": ood_details,
        "out_of_range_features": out_of_range,
        "anomaly_score": anomaly_score,
    }


def build_explanation(crop: str, shap_dict: dict, input_data: dict) -> str:
    crop_id = CROP_NAMES_ID.get(crop, crop.capitalize())
    # Use only original features for explanation (engineered features are less intuitive)
    orig_shap = {k: v for k, v in shap_dict.items() if k in ORIGINAL_FEATURES}
    sorted_features = sorted(orig_shap.items(), key=lambda x: abs(x[1]), reverse=True)

    parts = [f"Rekomendasikan **{crop_id}** karena:"]
    thresholds = {
        "N": (40, 80), "P": (30, 70), "K": (30, 70),
        "temperature": (15, 35), "humidity": (50, 90),
        "ph": (5.5, 7.5), "rainfall": (50, 200)
    }

    for feat, shap_val in sorted_features[:4]:
        val   = input_data[feat]
        label = FEATURE_LABELS_ID[feat]
        low, high = thresholds.get(feat, (0, 100))

        if shap_val > 0.01:
            if val < low:
                parts.append(f"• {label} ({val:.1f}) cukup rendah, tetapi masih mendukung pertumbuhan {crop_id}")
            elif val > high:
                parts.append(f"• {label} ({val:.1f}) tinggi, sangat mendukung {crop_id}")
            else:
                parts.append(f"• {label} ({val:.1f}) berada di rentang optimal untuk {crop_id}")
        elif shap_val < -0.01:
            if val < low:
                parts.append(f"• {label} ({val:.1f}) perlu ditingkatkan untuk hasil lebih baik")
            elif val > high:
                parts.append(f"• {label} ({val:.1f}) terlalu tinggi, perlu dikurangi")

    return " ".join(parts[:1]) + "\n" + "\n".join(parts[1:])


def store_to_dw(conn, input_data_orig: dict, input_data_full: dict,
                crop: str, confidence: float, shap_dict: dict) -> int:
    cur = conn.cursor()
    now = datetime.now()

    cur.execute(
        "INSERT INTO Dim_Soil (nitrogen, phosphorus, potassium, ph) VALUES (?, ?, ?, ?)",
        (input_data_orig["N"], input_data_orig["P"],
         input_data_orig["K"], input_data_orig["ph"])
    )
    soil_id = cur.lastrowid

    cur.execute(
        "INSERT INTO Dim_Climate (temperature, humidity, rainfall) VALUES (?, ?, ?)",
        (input_data_orig["temperature"], input_data_orig["humidity"],
         input_data_orig["rainfall"])
    )
    climate_id = cur.lastrowid

    cur.execute("SELECT crop_id FROM Dim_Crop WHERE label = ?", (crop,))
    row = cur.fetchone()
    if row:
        crop_id = row[0]
    else:
        cur.execute(
            "INSERT INTO Dim_Crop (label, category, description) VALUES (?, ?, ?)",
            (crop, "Other", crop.capitalize())
        )
        crop_id = cur.lastrowid

    ts = now.isoformat()
    cur.execute(
        "INSERT INTO Dim_Time (timestamp, date, hour, day_of_week) VALUES (?, ?, ?, ?)",
        (ts, now.date().isoformat(), now.hour, now.strftime("%A"))
    )
    time_id = cur.lastrowid

    cur.execute("""
        INSERT INTO Fact_CropRecommendation
        (soil_id, climate_id, crop_id, time_id, confidence_score,
         is_training, true_label,
         shap_n, shap_p, shap_k, shap_temperature, shap_humidity, shap_ph, shap_rainfall,
         shap_n_p_ratio, shap_n_k_ratio, shap_ph_rainfall)
        VALUES (?, ?, ?, ?, ?, 0, NULL,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?)
    """, (
        soil_id, climate_id, crop_id, time_id, confidence,
        shap_dict.get("N"),           shap_dict.get("P"),
        shap_dict.get("K"),           shap_dict.get("temperature"),
        shap_dict.get("humidity"),    shap_dict.get("ph"),
        shap_dict.get("rainfall"),
        shap_dict.get("N_P_ratio"),   shap_dict.get("N_K_ratio"),
        shap_dict.get("pH_rainfall"),
    ))
    conn.commit()
    return int(cur.lastrowid)


def predict(input_data: dict) -> dict:
    """Full prediction pipeline with calibration, feature engineering, OOD, and SHAP."""
    calibrated_model, base_model, explainer = load_artifacts()

    # Fix 1: Add derived features
    full_input = add_derived_features(input_data)
    X = np.array([[full_input[f] for f in ALL_FEATURES]])

    classes = calibrated_model.classes_
    n_classes = len(classes)

    # Fix 2: Use calibrated model for probability
    proba = calibrated_model.predict_proba(X)[0]
    top_idx = np.argsort(proba)[::-1]
    recommended_crop = classes[top_idx[0]]
    confidence       = float(proba[top_idx[0]])

    alternatives = [
        {"crop": str(classes[i]), "confidence": float(proba[i])}
        for i in top_idx[1:4]
    ]

    # SHAP on base model (TreeExplainer only supports tree-based models)
    shap_vals_all = explainer.shap_values(X)
    predicted_class_idx = int(np.where(classes == recommended_crop)[0][0])

    if isinstance(shap_vals_all, list):
        shap_for_pred = np.array(shap_vals_all[predicted_class_idx][0])
    else:
        arr = np.array(shap_vals_all)
        if arr.ndim == 3:
            if arr.shape[-1] == n_classes:
                # (n_samples=1, n_features, n_classes)
                shap_for_pred = arr[0, :, predicted_class_idx]
            else:
                # (n_classes, n_samples, n_features)
                shap_for_pred = arr[predicted_class_idx, 0, :]
        else:
            shap_for_pred = arr[0] if arr.ndim == 2 else arr

    shap_dict = {f: float(v) for f, v in zip(ALL_FEATURES, shap_for_pred)}

    explanation = build_explanation(recommended_crop, shap_dict, input_data)

    # Fix 3: OOD detection
    ood_result = check_ood(input_data)

    # Store to DW
    conn    = sqlite3.connect(DB_PATH)
    fact_id = store_to_dw(conn, input_data, full_input, recommended_crop, confidence, shap_dict)
    conn.close()

    return {
        "recommended_crop": recommended_crop,
        "confidence": confidence,
        "calibrated": True,
        "alternatives": alternatives,
        "shap_values": shap_dict,
        "explanation": explanation,
        "ood_warning": ood_result["ood_warning"],
        "ood_details": ood_result["ood_details"],
        "out_of_range_features": ood_result["out_of_range_features"],
        "anomaly_score": ood_result["anomaly_score"],
        "fact_id": fact_id,
        "timestamp": datetime.now().isoformat(),
    }
