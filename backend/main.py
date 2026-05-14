"""
FastAPI backend for Crop Recommendation DSS (v2).
Run: uvicorn main:app --reload  (from backend/ directory)
"""

import json
import os
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model.predict import predict, load_artifacts, load_ood_artifacts

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DB_PATH   = os.path.join(BASE_DIR, "crop_dw.db")
EVAL_PATH = os.path.join(BASE_DIR, "model", "evaluation.json")

app = FastAPI(
    title="Crop Recommendation DSS",
    description="Prescriptive Analytics DSS — calibrated RF + SHAP + OOD detection",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    N:           float = Field(..., ge=0, le=200, description="Nitrogen (kg/ha)")
    P:           float = Field(..., ge=0, le=200, description="Phosphorus (kg/ha)")
    K:           float = Field(..., ge=0, le=200, description="Potassium (kg/ha)")
    temperature: float = Field(..., ge=0, le=60,  description="Temperature (°C)")
    humidity:    float = Field(..., ge=0, le=100, description="Relative humidity (%)")
    ph:          float = Field(..., ge=0, le=14,  description="Soil pH")
    rainfall:    float = Field(..., ge=0, le=500, description="Annual rainfall (mm)")


@app.on_event("startup")
async def startup():
    try:
        load_artifacts()
        load_ood_artifacts()
        print("All model artifacts loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not pre-load artifacts: {e}")


@app.get("/health")
def health():
    artifacts = {
        "crop_model":      os.path.exists(os.path.join(BASE_DIR, "model", "crop_model.pkl")),
        "calibrated_model":os.path.exists(os.path.join(BASE_DIR, "model", "calibrated_model.pkl")),
        "shap_explainer":  os.path.exists(os.path.join(BASE_DIR, "model", "shap_explainer.pkl")),
        "ood_detector":    os.path.exists(os.path.join(BASE_DIR, "model", "ood_detector.pkl")),
        "feature_stats":   os.path.exists(os.path.join(BASE_DIR, "model", "feature_stats.json")),
    }
    return {
        "status": "healthy",
        "database": "connected" if os.path.exists(DB_PATH) else "missing",
        "artifacts": artifacts,
    }


@app.post("/recommend")
def recommend(req: RecommendRequest):
    """Calibrated crop recommendation with SHAP explanation and OOD check."""
    try:
        result = predict(req.model_dump())
        return result
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Model artifacts missing. Run: python model/train.py  ({e})"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
def history(limit: int = 50, offset: int = 0):
    """User recommendation history (is_training=0 rows only)."""
    if not os.path.exists(DB_PATH):
        return {"total": 0, "items": []}

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM Fact_CropRecommendation WHERE is_training = 0")
    total = cur.fetchone()[0]

    cur.execute("""
        SELECT
            f.fact_id,
            dt.timestamp,
            dc.label          AS crop,
            dc.category,
            f.confidence_score,
            ds.nitrogen, ds.phosphorus, ds.potassium, ds.ph,
            dc2.temperature, dc2.humidity, dc2.rainfall,
            f.shap_n, f.shap_p, f.shap_k,
            f.shap_temperature, f.shap_humidity, f.shap_ph, f.shap_rainfall,
            f.shap_n_p_ratio, f.shap_n_k_ratio, f.shap_ph_rainfall
        FROM Fact_CropRecommendation f
        JOIN Dim_Soil     ds  ON f.soil_id    = ds.soil_id
        JOIN Dim_Climate  dc2 ON f.climate_id = dc2.climate_id
        JOIN Dim_Crop     dc  ON f.crop_id    = dc.crop_id
        JOIN Dim_Time     dt  ON f.time_id    = dt.time_id
        WHERE f.is_training = 0
        ORDER BY f.fact_id DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))

    rows = cur.fetchall()
    conn.close()

    items = []
    for r in rows:
        items.append({
            "fact_id":   r["fact_id"],
            "timestamp": r["timestamp"],
            "crop":      r["crop"],
            "category":  r["category"],
            "confidence": round(r["confidence_score"], 4),
            "inputs": {
                "N": r["nitrogen"], "P": r["phosphorus"],
                "K": r["potassium"], "ph": r["ph"],
                "temperature": r["temperature"],
                "humidity":    r["humidity"],
                "rainfall":    r["rainfall"],
            },
            "shap_values": {
                "N":           r["shap_n"],
                "P":           r["shap_p"],
                "K":           r["shap_k"],
                "temperature": r["shap_temperature"],
                "humidity":    r["shap_humidity"],
                "ph":          r["shap_ph"],
                "rainfall":    r["shap_rainfall"],
                "N_P_ratio":   r["shap_n_p_ratio"],
                "N_K_ratio":   r["shap_n_k_ratio"],
                "pH_rainfall": r["shap_ph_rainfall"],
            }
        })

    return {"total": total, "items": items}


@app.get("/analytics")
def analytics():
    """Aggregated analytics — includes training data from DW (populated at training time)."""
    if not os.path.exists(DB_PATH):
        return {}

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # ── User prediction stats ─────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) FROM Fact_CropRecommendation WHERE is_training = 0")
    total_user_recs = cur.fetchone()[0]

    cur.execute("""
        SELECT dc.label, dc.category, COUNT(*) as count
        FROM Fact_CropRecommendation f
        JOIN Dim_Crop dc ON f.crop_id = dc.crop_id
        WHERE f.is_training = 0
        GROUP BY dc.label, dc.category
        ORDER BY count DESC
    """)
    user_crop_distribution = [dict(r) for r in cur.fetchall()]

    # ── Training data stats (always populated after training) ─────────────
    cur.execute("""
        SELECT dc.label, dc.category, COUNT(*) as count
        FROM Fact_CropRecommendation f
        JOIN Dim_Crop dc ON f.crop_id = dc.crop_id
        WHERE f.is_training = 1
        GROUP BY dc.label, dc.category
        ORDER BY count DESC
    """)
    training_crop_distribution = [dict(r) for r in cur.fetchall()]

    # ── Per-crop mean |SHAP| from training data (Fix 4) ──────────────────
    cur.execute("""
        SELECT dc.label,
            AVG(ABS(f.shap_n))           AS shap_n,
            AVG(ABS(f.shap_p))           AS shap_p,
            AVG(ABS(f.shap_k))           AS shap_k,
            AVG(ABS(f.shap_temperature)) AS shap_temperature,
            AVG(ABS(f.shap_humidity))    AS shap_humidity,
            AVG(ABS(f.shap_ph))          AS shap_ph,
            AVG(ABS(f.shap_rainfall))    AS shap_rainfall,
            AVG(ABS(f.shap_n_p_ratio))   AS shap_n_p_ratio,
            AVG(ABS(f.shap_n_k_ratio))   AS shap_n_k_ratio,
            AVG(ABS(f.shap_ph_rainfall)) AS shap_ph_rainfall
        FROM Fact_CropRecommendation f
        JOIN Dim_Crop dc ON f.crop_id = dc.crop_id
        WHERE f.is_training = 1 AND f.shap_n IS NOT NULL
        GROUP BY dc.label
        ORDER BY dc.label
    """)
    crop_shap_rows = cur.fetchall()
    crop_shap_importance = []
    for r in crop_shap_rows:
        crop_shap_importance.append({
            "crop":          r["label"],
            "N":             round(r["shap_n"] or 0, 5),
            "P":             round(r["shap_p"] or 0, 5),
            "K":             round(r["shap_k"] or 0, 5),
            "temperature":   round(r["shap_temperature"] or 0, 5),
            "humidity":      round(r["shap_humidity"] or 0, 5),
            "ph":            round(r["shap_ph"] or 0, 5),
            "rainfall":      round(r["shap_rainfall"] or 0, 5),
            "N_P_ratio":     round(r["shap_n_p_ratio"] or 0, 5),
            "N_K_ratio":     round(r["shap_n_k_ratio"] or 0, 5),
            "pH_rainfall":   round(r["shap_ph_rainfall"] or 0, 5),
        })

    # ── Training data feature distribution (mean per crop) ────────────────
    cur.execute("""
        SELECT dc.label,
            AVG(ds.nitrogen)    AS avg_n,
            AVG(ds.phosphorus)  AS avg_p,
            AVG(ds.potassium)   AS avg_k,
            AVG(ds.ph)          AS avg_ph,
            AVG(dc2.temperature)AS avg_temp,
            AVG(dc2.humidity)   AS avg_humidity,
            AVG(dc2.rainfall)   AS avg_rainfall
        FROM Fact_CropRecommendation f
        JOIN Dim_Soil    ds  ON f.soil_id    = ds.soil_id
        JOIN Dim_Climate dc2 ON f.climate_id = dc2.climate_id
        JOIN Dim_Crop    dc  ON f.crop_id    = dc.crop_id
        WHERE f.is_training = 1
        GROUP BY dc.label
        ORDER BY dc.label
    """)
    training_feature_dist = []
    for r in cur.fetchall():
        training_feature_dist.append({
            "crop":        r["label"],
            "N":           round(r["avg_n"] or 0, 2),
            "P":           round(r["avg_p"] or 0, 2),
            "K":           round(r["avg_k"] or 0, 2),
            "ph":          round(r["avg_ph"] or 0, 2),
            "temperature": round(r["avg_temp"] or 0, 2),
            "humidity":    round(r["avg_humidity"] or 0, 2),
            "rainfall":    round(r["avg_rainfall"] or 0, 2),
        })

    # ── Average inputs from user predictions ──────────────────────────────
    cur.execute("""
        SELECT
            AVG(ds.nitrogen)    AS avg_n,  AVG(ds.phosphorus) AS avg_p,
            AVG(ds.potassium)   AS avg_k,  AVG(ds.ph)         AS avg_ph,
            AVG(dc2.temperature)AS avg_temp,
            AVG(dc2.humidity)   AS avg_humidity,
            AVG(dc2.rainfall)   AS avg_rainfall
        FROM Fact_CropRecommendation f
        JOIN Dim_Soil    ds  ON f.soil_id    = ds.soil_id
        JOIN Dim_Climate dc2 ON f.climate_id = dc2.climate_id
        WHERE f.is_training = 0
    """)
    row = cur.fetchone()
    avg_inputs = {
        "N": round(row["avg_n"] or 0, 2), "P": round(row["avg_p"] or 0, 2),
        "K": round(row["avg_k"] or 0, 2), "ph": round(row["avg_ph"] or 0, 2),
        "temperature": round(row["avg_temp"] or 0, 2),
        "humidity":    round(row["avg_humidity"] or 0, 2),
        "rainfall":    round(row["avg_rainfall"] or 0, 2),
    }

    conn.close()

    model_eval = {}
    if os.path.exists(EVAL_PATH):
        with open(EVAL_PATH) as fh:
            model_eval = json.load(fh)

    return {
        "total_recommendations":    total_user_recs,
        "crop_distribution":        user_crop_distribution,
        "training_crop_distribution": training_crop_distribution,
        "crop_shap_importance":     crop_shap_importance,
        "training_feature_distribution": training_feature_dist,
        "average_inputs":           avg_inputs,
        "model_performance": {
            "accuracy":         model_eval.get("accuracy"),
            "precision_macro":  model_eval.get("precision_macro"),
            "recall_macro":     model_eval.get("recall_macro"),
            "f1_macro":         model_eval.get("f1_macro"),
        }
    }


@app.get("/feature-importance")
def feature_importance():
    """Global SHAP feature importance (all 10 features including engineered)."""
    if not os.path.exists(EVAL_PATH):
        raise HTTPException(status_code=503, detail="Model not trained yet.")

    with open(EVAL_PATH) as fh:
        eval_data = json.load(fh)

    importance = eval_data.get("global_shap_importance", {})
    sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)

    return {
        "feature_importance": [
            {"feature": k, "importance": round(v, 6)} for k, v in sorted_imp
        ],
        "original_features":   eval_data.get("original_features", []),
        "engineered_features": eval_data.get("engineered_features", []),
    }
