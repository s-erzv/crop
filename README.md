# CropSage — Prescriptive Analytics DSS for Crop Recommendation

Sistem rekomendasi tanaman berbasis **Analitik Preskriptif** yang menggabungkan Random Forest terkalibrasi, SHAP explainability, dan deteksi out-of-distribution. Dibangun sebagai studi kasus mata kuliah Gudang Data dan Kecerdasan Bisnis.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| ML | scikit-learn (Random Forest + CalibratedClassifierCV) |
| XAI | SHAP TreeExplainer |
| OOD | IsolationForest |
| Data Warehouse | SQLite (Star Schema) |
| API | FastAPI + Uvicorn |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Charts | Recharts |

---

## Struktur Folder

```
crop/
├── backend/
│   ├── main.py                  # FastAPI app, semua endpoint
│   ├── requirements.txt         # Python dependencies
│   ├── model/
│   │   ├── train.py             # Training pipeline + ETL ke DW
│   │   ├── predict.py           # Inference pipeline
│   │   ├── evaluation.json      # Metrik model + model_version (generated)
│   │   ├── feature_stats.json   # P1/P99 per fitur untuk OOD (generated)
│   │   ├── crop_model.pkl       # Base RF untuk SHAP (generated)
│   │   ├── calibrated_model.pkl # Calibrated RF untuk confidence (generated)
│   │   ├── shap_explainer.pkl   # TreeExplainer (generated)
│   │   └── ood_detector.pkl     # IsolationForest (generated)
│   └── crop_dw.db               # SQLite DW (generated)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx     # Form input + slider
│   │   │   ├── ResultPage.tsx   # SHAP chart, confidence, feedback
│   │   │   ├── AnalyticsPage.tsx# Dashboard analitik + CSV export
│   │   │   └── AboutPage.tsx    # Dokumentasi sistem
│   │   └── components/
│   │       ├── RecommendationContext.tsx
│   │       ├── RecentTable.tsx  # History + pagination + filter
│   │       ├── ErrorBoundary.tsx
│   │       └── Layout.tsx
│   └── package.json
│
├── data/
│   └── Crop_recommendation.csv  # Dataset (taruh di sini)
└── .gitignore
```

---

## Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+ & pnpm
- Dataset: [Crop Recommendation Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset) → simpan ke `backend/data/Crop_recommendation.csv`

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Train model + build data warehouse (jalankan sekali)
python3 model/train.py

# Start API server
uvicorn main:app --reload --port 8000
```

> API docs tersedia di http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

> Buka http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/health` | Cek status artifacts & DB |
| POST | `/recommend` | Prediksi + SHAP + OOD check |
| GET | `/history` | Riwayat prediksi user (`?crop=rice&limit=10&offset=0`) |
| GET | `/analytics` | Statistik agregat + performa model |
| GET | `/feature-importance` | Global SHAP importance (10 fitur) |
| POST | `/feedback` | Submit feedback 👍/👎 per prediksi |

### Contoh Request

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"N": 90, "P": 42, "K": 43, "temperature": 25, "humidity": 70, "ph": 6.5, "rainfall": 150}'
```

### Contoh Response

```json
{
  "recommended_crop": "rice",
  "confidence": 0.843,
  "calibrated": true,
  "margin": 0.612,
  "ambiguous": false,
  "shap_baseline": 0.0456,
  "shap_values": { "N": 0.12, "P": -0.03, "K": 0.08, "..." : "..." },
  "explanation": "Rekomendasikan Padi karena...",
  "ood_warning": false,
  "alternatives": [{"crop": "jute", "confidence": 0.23}, "..."]
}
```

---

## Arsitektur Model

```
7 fitur input
    ↓ Feature Engineering
10 fitur (+ N/P ratio, N/K ratio, pH×rainfall)
    ├──→ base RandomForest → SHAP TreeExplainer
    └──→ CalibratedClassifierCV (Sigmoid/Platt) → confidence score

OOD Detection:
    ├── Range check (P1–P99 per fitur)
    ├── IsolationForest (kombinasi anomali)
    └── Degenerate check (N+P+K < 1)
```

### Data Warehouse — Star Schema

```
Dim_Soil ──┐
Dim_Climate─┤
Dim_Crop ───┼──→ Fact_CropRecommendation (shap + confidence + feedback)
Dim_Time ───┘
```

1760 baris training di-ETL ke DW beserta nilai SHAP-nya saat `train.py` dijalankan.

---

## Performa Model

| Metrik | Nilai |
|---|---|
| Accuracy | 99.32% |
| Precision (macro) | 99.35% |
| Recall (macro) | ~99% |
| F1-score (macro) | 99.32% |
| Kelas | 22 tanaman |
| Fitur | 10 (7 asli + 3 turunan) |

> Akurasi tinggi karena dataset Kaggle ini bersifat sintetis dan well-separated per kelas.

---

## Dataset

- **Sumber**: [Kaggle — Crop Recommendation Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)
- **Baris**: 2200 (100 per crop × 22 crops)
- **Fitur**: N, P, K, temperature, humidity, pH, rainfall
- **Target**: 22 jenis tanaman
