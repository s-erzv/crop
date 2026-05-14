# Crop Recommendation — Prescriptive Analytics DSS

## Project Purpose

A Prescriptive Analytics Decision Support System for farmers. Given soil composition (N, P, K, pH) and climate conditions (temperature, humidity, rainfall), the system recommends the optimal crop to plant and **explains why** using SHAP (SHapley Additive exPlanations).

This is not just a prediction system — it prescribes actionable advice: "Plant rice because your N level is optimal. Increase K to improve yield further."

---

## Architecture Overview

```
CSV Dataset
    ↓ ETL
SQLite Data Warehouse (Star Schema)
    ↓
Random Forest Classifier (scikit-learn)
    ↓ SHAP Explainer
Prescriptive Explanations
    ↓
FastAPI REST API
    ↓
React + TypeScript Frontend (Vite)
```

---

## Data Warehouse — Star Schema (SQLite)

```
                    ┌─────────────────────┐
                    │  Fact_CropRecom-    │
                    │  mendation          │
                    │─────────────────────│
                    │ fact_id (PK)        │
              ┌────►│ soil_id (FK)        │◄────┐
              │     │ climate_id (FK)     │     │
              │     │ crop_id (FK)        │     │
              │     │ time_id (FK)        │     │
              │     │ confidence_score    │     │
              │     │ shap_n              │     │
              │     │ shap_p              │     │
              │     │ shap_k              │     │
              │     │ shap_temperature    │     │
              │     │ shap_humidity       │     │
              │     │ shap_ph             │     │
              │     │ shap_rainfall       │     │
              │     └─────────────────────┘     │
              │                                 │
    ┌─────────┴───────┐           ┌─────────────┴──┐
    │   Dim_Soil      │           │   Dim_Climate   │
    │─────────────────│           │─────────────────│
    │ soil_id (PK)    │           │ climate_id (PK) │
    │ nitrogen (N)    │           │ temperature     │
    │ phosphorus (P)  │           │ humidity        │
    │ potassium (K)   │           │ rainfall        │
    │ ph              │           └─────────────────┘
    └─────────────────┘
              
    ┌─────────────────┐           ┌─────────────────┐
    │   Dim_Crop      │           │   Dim_Time      │
    │─────────────────│           │─────────────────│
    │ crop_id (PK)    │           │ time_id (PK)    │
    │ label           │           │ timestamp       │
    │ category        │           │ date            │
    │ description     │           │ hour            │
    └─────────────────┘           │ day_of_week     │
                                  └─────────────────┘
```

### ETL Pipeline
1. Load `Crop_recommendation.csv` (2200 rows, 8 columns)
2. Normalize into dimension tables
3. Load fact table with foreign keys
4. All queries use star schema joins for analytics

---

## ML Pipeline

### Training (`model/train.py`)
1. Load CSV → Pandas DataFrame
2. ETL into SQLite star schema
3. Split: 80% train, 20% test (stratified)
4. Train `RandomForestClassifier(n_estimators=100, random_state=42)`
5. Generate `shap.TreeExplainer` from trained model
6. Evaluate: accuracy, precision, recall, F1 (macro), confusion matrix
7. Save artifacts: `model/crop_model.pkl`, `model/shap_explainer.pkl`
8. Save evaluation: `model/evaluation.json`

### Prediction (`model/predict.py`)
1. Load model + SHAP explainer
2. Predict class probabilities for all 22 crops
3. Generate SHAP values for input → per-feature contribution
4. Build prescriptive text in Bahasa Indonesia
5. Store to DW (insert into all dimension + fact tables)
6. Return structured JSON response

### Model Info
- **Algorithm**: Random Forest (ensemble of 100 decision trees)
- **Features**: N, P, K, temperature, humidity, pH, rainfall (7 features)
- **Classes**: 22 crop types
- **Expected Accuracy**: ~99% on this dataset

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/recommend` | Get crop recommendation + SHAP |
| GET | `/history` | Recommendation history from DW |
| GET | `/analytics` | Aggregated stats (descriptive) |
| GET | `/feature-importance` | Global SHAP feature importance |

### POST /recommend — Request Body
```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.9,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```

### POST /recommend — Response
```json
{
  "recommended_crop": "rice",
  "confidence": 0.97,
  "alternatives": [
    {"crop": "jute", "confidence": 0.02},
    {"crop": "coconut", "confidence": 0.01}
  ],
  "shap_values": {
    "N": 0.23,
    "P": -0.05,
    "K": 0.18,
    "temperature": 0.31,
    "humidity": 0.12,
    "ph": -0.08,
    "rainfall": 0.19
  },
  "explanation": "Tanam padi karena suhu optimal (20.9°C) dan kelembaban tinggi (82%) sangat cocok. Nitrogen (90) berada di level ideal. Tingkatkan K untuk hasil lebih optimal.",
  "timestamp": "2026-05-14T10:00:00"
}
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| ML | scikit-learn RandomForest | Fast, interpretable, works great on tabular data |
| Explainability | SHAP TreeExplainer | Native tree support, fast, faithful explanations |
| Data Warehouse | SQLite | Embedded, zero-config, perfect for single-server DSS |
| API | FastAPI + Uvicorn | Async, auto-docs, Pydantic validation |
| Frontend | React + TypeScript + Vite | Type safety, fast HMR |
| Styling | Tailwind CSS | Utility-first, responsive |
| Charts | Recharts | Composable, works with React |
| HTTP | Axios | Promise-based, interceptors |
| Routing | React Router v6 | SPA routing |

---

## How to Run

### Backend
```bash
cd crop/backend
pip install -r requirements.txt
python model/train.py        # Train model + build DW
uvicorn main:app --reload    # Start API on :8000
```

### Frontend
```bash
cd crop/frontend
pnpm install
pnpm dev                     # Start dev server on :5173
```

### API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Dataset

- **Source**: `Crop_recommendation.csv`
- **Rows**: 2200 (100 per crop × 22 crops)
- **Features**: N, P, K, temperature, humidity, pH, rainfall
- **Target**: label (22 crop types)
- **Crops**: rice, maize, chickpea, kidneybeans, pigeonpeas, mothbeans, mungbean, blackgram, lentil, pomegranate, banana, mango, grapes, watermelon, muskmelon, apple, orange, papaya, coconut, cotton, jute, coffee
