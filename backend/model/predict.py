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

FEATURE_LABELS = {
    "N": "Nitrogen (N)", "P": "Phosphorus (P)", "K": "Potassium (K)",
    "temperature": "Temperature", "humidity": "Humidity",
    "ph": "Soil pH", "rainfall": "Rainfall",
    "N_P_ratio": "N/P Ratio", "N_K_ratio": "N/K Ratio", "pH_rainfall": "pH × Rainfall"
}

# ── Artifact cache ────────────────────────────────────────────────────────────
_calibrated_model = None
_base_model       = None
_explainer        = None
_ood_detector     = None
_feature_stats    = None
_model_version    = None


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


def load_model_version() -> str:
    global _model_version
    if _model_version is None:
        eval_path = os.path.join(MODEL_DIR, "evaluation.json")
        try:
            with open(eval_path) as fh:
                _model_version = json.load(fh).get("model_version", "unknown")
        except Exception:
            _model_version = "unknown"
    return _model_version


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

    # Degenerate input: N+P+K all near zero is agronomically impossible
    npk_total = input_data["N"] + input_data["P"] + input_data["K"]
    if npk_total < 1.0:
        out_of_range.append("N_P_K_combined")
        detail_parts.append(
            f"Total N+P+K ({npk_total:.1f}) is near zero — input is likely invalid"
        )

    for feat in ORIGINAL_FEATURES:
        val   = input_data[feat]
        stats = feature_stats[feat]
        if val < stats["p1"] or val > stats["p99"]:
            label = FEATURE_LABELS[feat]
            out_of_range.append(feat)
            detail_parts.append(
                f"{label} ({val:.1f}) is outside the typical range "
                f"({stats['p1']:.1f}–{stats['p99']:.1f})"
            )

    # IsolationForest anomaly check
    X_orig = np.array([[input_data[f] for f in ORIGINAL_FEATURES]])
    anomaly_score  = float(ood_detector.decision_function(X_orig)[0])
    is_anomaly     = ood_detector.predict(X_orig)[0] == -1

    ood_warning = bool(out_of_range) or bool(is_anomaly)

    if detail_parts:
        ood_details = (
            "Input is outside the training data distribution: "
            + "; ".join(detail_parts)
            + ". Confidence may not be accurate."
        )
    elif is_anomaly:
        ood_details = (
            "The combination of input values is unusual compared to training data "
            "(IsolationForest score: {:.3f}). Confidence may not be accurate.".format(anomaly_score)
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
    """
    Prescriptive DSS explanation with four sections:
    DECISION · WHY (SHAP) · ACTION PLAN · RISK ASSESSMENT
    """
    name = crop.capitalize()

    # Per-feature agronomic context: (optimal_low, optimal_high, unit, action_if_low, action_if_high, risk_if_low, risk_if_high)
    AGRONOMIC = {
        "N": (40, 80, "mg/kg",
              "Apply nitrogen fertilizer (urea or ammonium sulfate) at 50–80 kg/ha before planting.",
              "Split nitrogen application into 2–3 doses to prevent leaching and root burn.",
              "Low nitrogen limits leaf development and reduces yield by up to 40%.",
              "Excess nitrogen causes excessive vegetative growth, pest susceptibility, and water contamination."),
        "P": (30, 70, "mg/kg",
              "Apply phosphate fertilizer (TSP or DAP) at planting — phosphorus is most effective when soil-incorporated.",
              "Reduce phosphate input; excess P can lock out zinc and iron uptake.",
              "Low phosphorus stunts root development and delays flowering.",
              "Excess phosphorus can trigger iron and zinc deficiency symptoms."),
        "K": (30, 70, "mg/kg",
              "Apply potassium chloride (KCl) or potassium sulfate (K₂SO₄) to boost disease resistance and water efficiency.",
              "Reduce potassium input; excess K can inhibit magnesium and calcium absorption.",
              "Low potassium weakens cell walls, increases disease susceptibility, and reduces drought tolerance.",
              "Excess potassium disrupts cation balance and can cause magnesium deficiency."),
        "temperature": (15, 35, "°C",
                        "Consider planting in a warmer season or use mulching to retain soil heat.",
                        "Plant in a cooler season, provide shade nets, or use drought-tolerant varieties.",
                        "Low temperature slows germination and growth; frost risk below 5°C.",
                        "High temperature causes heat stress, accelerates water loss, and may trigger early flowering."),
        "humidity": (50, 90, "%",
                     "Use drip irrigation or increase watering frequency to raise effective humidity around the crop.",
                     "Improve field drainage and air circulation to prevent fungal diseases.",
                     "Low humidity increases transpiration stress and may require more frequent irrigation.",
                     "High humidity promotes fungal diseases (e.g., downy mildew, blight); apply fungicide preventively."),
        "ph": (5.5, 7.5, "",
               "Apply agricultural lime (CaCO₃) at 1–2 tons/ha to raise pH; retest after 4–6 weeks.",
               "Apply elemental sulfur or aluminum sulfate to lower pH gradually.",
               "Acidic soil locks out phosphorus, calcium, and magnesium — key nutrients become unavailable.",
               "Alkaline soil causes iron, zinc, and manganese deficiency; can reduce yield by 20–30%."),
        "rainfall": (50, 200, "mm",
                     "Supplement with irrigation (drip or sprinkler) at 5–10 mm/day during dry periods.",
                     "Ensure field drainage channels are clear; consider raised beds or ridge planting.",
                     "Insufficient rainfall causes drought stress; prioritize drought-tolerant varieties if irrigation is unavailable.",
                     "Waterlogging causes root anoxia and disease; ensure drainage within 24–48 hours of heavy rain."),
    }

    orig_shap = {k: v for k, v in shap_dict.items() if k in ORIGINAL_FEATURES}
    sorted_features = sorted(orig_shap.items(), key=lambda x: abs(x[1]), reverse=True)

    # ── SECTION 1: DECISION ──────────────────────────────────────────────────
    lines = [f"**DECISION:** Plant {name}."]

    # ── SECTION 2: WHY — top 3 driving features ──────────────────────────────
    lines.append("\n**WHY THIS CROP?**")
    drivers_added = 0
    for feat, shap_val in sorted_features:
        if abs(shap_val) < 0.005:
            continue
        val = input_data[feat]
        label = FEATURE_LABELS[feat]
        ag = AGRONOMIC.get(feat)
        if ag is None:
            continue
        low, high, unit = ag[0], ag[1], ag[2]
        unit_str = f" {unit}" if unit else ""

        if shap_val > 0.01:
            if val < low:
                lines.append(f"• {label} is {val:.1f}{unit_str} (below optimal {low}–{high}) — slightly constraining but {name} can still establish; see action plan.")
            elif val > high:
                lines.append(f"• {label} is {val:.1f}{unit_str} (above optimal {low}–{high}) — {name} is highly adapted to these conditions.")
            else:
                lines.append(f"• {label} is {val:.1f}{unit_str} — squarely in the optimal range ({low}–{high}) for {name}.")
        elif shap_val < -0.01:
            if val < low:
                lines.append(f"• {label} is {val:.1f}{unit_str} — below optimal; this is the main limiting factor for {name} yield.")
            elif val > high:
                lines.append(f"• {label} is {val:.1f}{unit_str} — above optimal; requires corrective action before planting.")
        drivers_added += 1
        if drivers_added >= 3:
            break

    # ── SECTION 3: ACTION PLAN ───────────────────────────────────────────────
    lines.append("\n**ACTION PLAN:**")
    actions_added = 0
    for feat, shap_val in sorted_features:
        val = input_data[feat]
        ag  = AGRONOMIC.get(feat)
        if ag is None:
            continue
        low, high, unit, act_low, act_high, _, _ = ag
        if val < low:
            lines.append(f"• {FEATURE_LABELS[feat]}: {act_low}")
            actions_added += 1
        elif val > high:
            lines.append(f"• {FEATURE_LABELS[feat]}: {act_high}")
            actions_added += 1
        if actions_added >= 3:
            break

    if actions_added == 0:
        lines.append(f"• All key soil and climate parameters are within optimal range. Maintain current conditions and follow standard {name} cultivation practices.")

    # ── SECTION 4: RISK ASSESSMENT ───────────────────────────────────────────
    lines.append("\n**RISK ASSESSMENT:**")
    risks = []
    for feat, shap_val in sorted_features:
        val = input_data[feat]
        ag  = AGRONOMIC.get(feat)
        if ag is None:
            continue
        low, high, unit, _, _, risk_low, risk_high = ag
        if val < low:
            risks.append(f"⚠ {FEATURE_LABELS[feat]} deficit — {risk_low}")
        elif val > high:
            risks.append(f"⚠ {FEATURE_LABELS[feat]} excess — {risk_high}")

    if risks:
        lines.extend(risks[:3])
    else:
        lines.append("✓ No major risk factors detected. Conditions are well-suited for {name} cultivation.".format(name=name))

    return "\n".join(lines)


def store_to_dw(conn, input_data_orig: dict, input_data_full: dict,
                crop: str, confidence: float, shap_dict: dict,
                model_version: str = "") -> int:
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
         shap_n_p_ratio, shap_n_k_ratio, shap_ph_rainfall,
         model_version)
        VALUES (?, ?, ?, ?, ?, 0, NULL,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?)
    """, (
        soil_id, climate_id, crop_id, time_id, confidence,
        shap_dict.get("N"),           shap_dict.get("P"),
        shap_dict.get("K"),           shap_dict.get("temperature"),
        shap_dict.get("humidity"),    shap_dict.get("ph"),
        shap_dict.get("rainfall"),
        shap_dict.get("N_P_ratio"),   shap_dict.get("N_K_ratio"),
        shap_dict.get("pH_rainfall"),
        model_version,
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

    # Prediction margin and ambiguity warning
    top2_conf = float(proba[top_idx[1]]) if len(top_idx) > 1 else 0.0
    margin    = round(confidence - top2_conf, 4)
    ambiguous = margin < 0.20

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

    # SHAP baseline: expected_value for the predicted class
    ev = explainer.expected_value
    if hasattr(ev, '__len__'):
        shap_baseline = float(ev[predicted_class_idx])
    else:
        shap_baseline = float(ev)

    explanation = build_explanation(recommended_crop, shap_dict, input_data)

    # Fix 3: OOD detection
    ood_result = check_ood(input_data)

    model_version = load_model_version()

    # Store to DW
    conn    = sqlite3.connect(DB_PATH)
    fact_id = store_to_dw(conn, input_data, full_input, recommended_crop, confidence, shap_dict, model_version)
    conn.close()

    return {
        "recommended_crop": recommended_crop,
        "confidence": confidence,
        "calibrated": True,
        "margin": margin,
        "ambiguous": ambiguous,
        "alternatives": alternatives,
        "shap_values": shap_dict,
        "shap_baseline": shap_baseline,
        "explanation": explanation,
        "ood_warning": ood_result["ood_warning"],
        "ood_details": ood_result["ood_details"],
        "out_of_range_features": ood_result["out_of_range_features"],
        "anomaly_score": ood_result["anomaly_score"],
        "fact_id": fact_id,
        "model_version": model_version,
        "timestamp": datetime.now().isoformat(),
    }
