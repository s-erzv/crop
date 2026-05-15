import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { BarChart2, TrendingUp, Database, Cpu, Trash2, Download } from 'lucide-react'
import { STORAGE_KEY } from '../components/RecommendationContext'

interface CropShapRow {
  crop: string
  [feature: string]: number | string
}

interface TrainingDistRow {
  crop: string
  [feature: string]: number | string
}

interface Analytics {
  total_recommendations: number
  crop_distribution: { label: string; category: string; count: number }[]
  training_crop_distribution: { label: string; category: string; count: number }[]
  crop_shap_importance: CropShapRow[]
  training_feature_distribution: TrainingDistRow[]
  average_inputs: Record<string, number>
  model_performance: {
    accuracy: number | null
    precision_macro: number | null
    recall_macro: number | null
    f1_macro: number | null
  }
}

interface FeatureImportance {
  feature_importance: { feature: string; importance: number }[]
  original_features: string[]
  engineered_features: string[]
}

const FEATURE_LABELS: Record<string, string> = {
  N: 'Nitrogen', P: 'Fosfor', K: 'Kalium',
  temperature: 'Suhu', humidity: 'Kelembaban', ph: 'pH Tanah', rainfall: 'Curah Hujan',
  N_P_ratio: 'Rasio N/P', N_K_ratio: 'Rasio N/K', pH_rainfall: 'pH×Hujan'
}

const COLORS = [
  '#2d6b32', '#3d8642', '#5ea362', '#8ec390', '#bbdcbc',
  '#d4802a', '#e3a040', '#ecc170', '#b96320', '#974a1d'
]

const ORIG_FEATURES = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

function MetricCard({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="card p-5 flex items-center gap-4 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="font-body text-xs text-forest-500 uppercase tracking-wide">{label}</p>
        <p className="font-display text-2xl font-bold text-forest-950">{value}</p>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics]   = useState<Analytics | null>(null)
  const [featureImp, setFeatureImp] = useState<FeatureImportance | null>(null)
  const [loading, setLoading]       = useState(true)
  const [selectedCrop, setSelectedCrop]       = useState<string>('rice')
  const [selectedDistFeat, setSelectedDistFeat] = useState<string>('N')
  const [cleared, setCleared]       = useState(false)

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:8000/analytics'),
      axios.get('http://localhost:8000/feature-importance')
    ]).then(([a, f]) => {
      setAnalytics(a.data)
      setFeatureImp(f.data)
      // Default to first crop in shap importance
      if (a.data.crop_shap_importance?.length) {
        setSelectedCrop(a.data.crop_shap_importance[0].crop as string)
      }
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCleared(true)
    setTimeout(() => setCleared(false), 3000)
  }

  const handleDownloadCSV = async () => {
    try {
      const { data } = await axios.get('http://localhost:8000/history', { params: { limit: 5000, offset: 0 } })
      const rows: Record<string, unknown>[] = data.items || []
      if (!rows.length) return

      const headers = ['fact_id', 'timestamp', 'crop', 'category', 'confidence', 'N', 'P', 'K', 'ph', 'temperature', 'humidity', 'rainfall']
      const csv = [
        headers.join(','),
        ...rows.map((r: Record<string, unknown>) => {
          const inp = r.inputs as Record<string, number>
          return [
            r.fact_id, r.timestamp, r.crop, r.category,
            (r.confidence as number).toFixed(4),
            inp?.N, inp?.P, inp?.K, inp?.ph,
            inp?.temperature, inp?.humidity, inp?.rainfall
          ].join(',')
        })
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `cropsage_history_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-20 flex items-center justify-center gap-3 text-forest-400">
      <div className="w-5 h-5 border-2 border-forest-300 border-t-forest-600 rounded-full animate-spin" />
      <span className="font-body">Memuat data analitik...</span>
    </div>
  )

  const perf = analytics?.model_performance

  // Global SHAP feature importance — all 10 features
  const allFeatData = featureImp?.feature_importance.map(f => ({
    feature:    FEATURE_LABELS[f.feature] || f.feature,
    key:        f.feature,
    importance: f.importance,
    isEngineered: featureImp.engineered_features.includes(f.feature)
  })) || []
  const maxFeatImp = Math.max(...allFeatData.map(d => d.importance), 0.001)

  // Per-crop SHAP data for selected crop
  const selectedCropShap = analytics?.crop_shap_importance
    .find(r => r.crop === selectedCrop)
  const cropShapData = selectedCropShap
    ? ORIG_FEATURES.map(f => ({
        feature: FEATURE_LABELS[f],
        key: f,
        value: (selectedCropShap[f] as unknown as number) || 0
      })).sort((a, b) => b.value - a.value)
    : []
  const maxCropShap = Math.max(...cropShapData.map(d => d.value), 0.001)

  // Training distribution for selected feature
  const distData = (analytics?.training_feature_distribution || [])
    .map(r => ({
      crop:  r.crop,
      value: (r[selectedDistFeat] as unknown as number) || 0
    }))
    .sort((a, b) => b.value - a.value)

  // Crop options from shap importance (all 22)
  const cropOptions = analytics?.crop_shap_importance.map(r => r.crop) || []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-px h-6 bg-earth-400" />
            <span className="font-mono text-xs text-earth-600 uppercase tracking-widest">Dashboard Analitik</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-950">
            Wawasan & Statistik
          </h1>
          <p className="font-body text-forest-500 mt-2 text-sm sm:text-base">
            Distribusi rekomendasi, performa model, dan kepentingan fitur dari {(analytics?.training_crop_distribution || []).reduce((s, r) => s + r.count, 0)} sampel training.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-forest-50 hover:bg-forest-100
                         border border-forest-200 text-forest-700 rounded-xl font-body text-sm
                         transition-colors duration-200"
            >
              <Download size={14} />
              Ekspor CSV
            </button>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100
                         border border-red-200 text-red-600 rounded-xl font-body text-sm
                         transition-colors duration-200"
            >
              <Trash2 size={14} />
              Hapus Riwayat
            </button>
          </div>
          {cleared && (
            <span className="font-body text-xs text-green-600 animate-fade-in">
              Riwayat lokal dihapus.
            </span>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Rekomendasi Pengguna"
          value={analytics?.total_recommendations?.toString() || '0'}
          icon={<Database size={22} className="text-white" />}
          color="bg-forest-700"
        />
        <MetricCard
          label="Akurasi Model"
          value={perf?.accuracy != null ? `${(perf.accuracy * 100).toFixed(1)}%` : '—'}
          icon={<Cpu size={22} className="text-white" />}
          color="bg-forest-600"
        />
        <MetricCard
          label="F1 Score (Macro)"
          value={perf?.f1_macro != null ? `${(perf.f1_macro * 100).toFixed(1)}%` : '—'}
          icon={<TrendingUp size={22} className="text-white" />}
          color="bg-earth-600"
        />
        <MetricCard
          label="Data Training di DW"
          value={String((analytics?.training_crop_distribution || []).reduce((s, r) => s + r.count, 0))}
          icon={<BarChart2 size={22} className="text-white" />}
          color="bg-earth-700"
        />
      </div>

      {/* Row 1: Training distribution + global SHAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Training crop distribution (always populated from DW) */}
        <div className="card p-5 animate-fade-up animate-delay-100" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-forest-500 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">
              Distribusi Data Training
            </h3>
          </div>
          <p className="font-body text-xs text-forest-400 mb-4">
            1760 sampel training dalam Data Warehouse — tersedia sejak hari pertama.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={analytics?.training_crop_distribution.slice(0, 12)}
              margin={{ left: -10, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5efea" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontFamily: 'DM Sans', fontSize: 9, fill: '#5a7a5d' }}
                angle={-40} textAnchor="end" interval={0}
              />
              <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#5a7a5d' }} />
              <Tooltip
                contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: '12px', border: '1px solid #bbdcbc' }}
                formatter={(v: number) => [v, 'Sampel']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(analytics?.training_crop_distribution.slice(0, 12) || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Global SHAP feature importance — all 10 features */}
        <div className="card p-5 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-earth-500 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">
              Kepentingan Fitur Global (SHAP)
            </h3>
          </div>
          <p className="font-body text-xs text-forest-400 mb-4">
            Rata-rata |SHAP| dari 1760 sampel training (10 fitur termasuk fitur turunan).
          </p>
          <div className="space-y-2.5">
            {allFeatData.map((f, i) => (
              <div key={f.key}>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-1.5 font-body text-sm text-forest-700">
                    {f.feature}
                    {f.isEngineered && (
                      <span className="px-1.5 py-0 bg-earth-100 text-earth-600
                                       text-xs font-mono rounded-md">eng</span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-forest-500">
                    {f.importance.toFixed(5)}
                  </span>
                </div>
                <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(f.importance / maxFeatImp) * 100}%`,
                      background: f.isEngineered
                        ? (i < 3 ? '#b96320' : '#d4802a')
                        : (i < 3 ? '#2d6b32' : i < 6 ? '#5ea362' : '#8ec390')
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-forest-500 rounded-sm" />
              <span className="font-body text-xs text-forest-400">Fitur asli</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-earth-500 rounded-sm" />
              <span className="font-body text-xs text-forest-400">Fitur turunan (Fix 1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Per-crop SHAP breakdown (Fix 4) */}
      <div className="card p-5 mb-6 animate-fade-up animate-delay-300" style={{ animationFillMode: 'forwards' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-forest-700 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">
              SHAP per Tanaman — Fitur Mana yang Paling Berpengaruh?
            </h3>
          </div>
          <select
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
            className="input-field w-auto pr-8 text-sm"
          >
            {cropOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="font-body text-xs text-forest-400 mb-4">
          Rata-rata |SHAP| untuk tanaman <strong className="text-forest-700 capitalize">{selectedCrop}</strong> dari data training.
          Fitur dengan nilai lebih tinggi = lebih menentukan rekomendasi tanaman ini.
        </p>
        {cropShapData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cropShapData} layout="vertical"
                      margin={{ left: 10, right: 50, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5efea" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#5a7a5d' }}
                tickFormatter={v => v.toFixed(3)}
                domain={[0, maxCropShap * 1.1]}
              />
              <YAxis
                type="category" dataKey="feature" width={105}
                tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#2d5e30' }}
              />
              <Tooltip
                contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: '12px', border: '1px solid #bbdcbc' }}
                formatter={(v: number) => [v.toFixed(5), 'Mean |SHAP|']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {cropShapData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="font-body text-sm text-forest-400 text-center py-8">Tidak ada data SHAP tersedia.</p>
        )}
      </div>

      {/* Row 3: Training feature distribution per crop (Fix 4) */}
      <div className="card p-5 mb-6 animate-fade-up animate-delay-400" style={{ animationFillMode: 'forwards' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-earth-500 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">
              Distribusi Fitur Training per Tanaman
            </h3>
          </div>
          <select
            value={selectedDistFeat}
            onChange={e => setSelectedDistFeat(e.target.value)}
            className="input-field w-auto pr-8 text-sm"
          >
            {ORIG_FEATURES.map(f => (
              <option key={f} value={f}>{FEATURE_LABELS[f]}</option>
            ))}
          </select>
        </div>
        <p className="font-body text-xs text-forest-400 mb-4">
          Nilai rata-rata <strong className="text-forest-700">{FEATURE_LABELS[selectedDistFeat]}</strong> per tanaman dari data training (diurutkan dari tertinggi).
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={distData} margin={{ left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5efea" vertical={false} />
            <XAxis
              dataKey="crop"
              tick={{ fontFamily: 'DM Sans', fontSize: 9, fill: '#5a7a5d' }}
              angle={-45} textAnchor="end" interval={0}
            />
            <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#5a7a5d' }} />
            <Tooltip
              contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: '12px', border: '1px solid #bbdcbc' }}
              formatter={(v: number) => [v.toFixed(2), FEATURE_LABELS[selectedDistFeat]]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {distData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 4: User predictions + model performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User recommendations */}
        <div className="card p-5 animate-fade-up animate-delay-300" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-forest-500 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">
              Rekomendasi Pengguna
            </h3>
          </div>
          <p className="font-body text-xs text-forest-400 mb-4">
            Tanaman yang direkomendasikan kepada pengguna (akumulasi real-time).
          </p>
          {analytics?.crop_distribution && analytics.crop_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.crop_distribution.slice(0, 10)} margin={{ left: -10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5efea" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontFamily: 'DM Sans', fontSize: 10, fill: '#5a7a5d' }}
                  angle={-35} textAnchor="end" interval={0}
                />
                <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#5a7a5d' }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: '12px', border: '1px solid #bbdcbc' }}
                  formatter={(v: number) => [v, 'Rekomendasi']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.crop_distribution.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-forest-300">
              <p className="font-body text-sm">Belum ada rekomendasi pengguna.</p>
            </div>
          )}
        </div>

        {/* Model performance */}
        <div className="card p-5 animate-fade-up animate-delay-400" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-forest-700 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">
              Performa Model — RF + Isotonic Calibration
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Accuracy',          value: perf?.accuracy },
              { label: 'Precision (Macro)', value: perf?.precision_macro },
              { label: 'Recall (Macro)',    value: perf?.recall_macro },
              { label: 'F1 Score (Macro)',  value: perf?.f1_macro },
            ].map(m => (
              <div key={m.label} className="bg-forest-50/60 rounded-xl p-3 text-center">
                <div className="font-mono text-xl font-bold text-forest-800">
                  {m.value != null ? `${(m.value * 100).toFixed(2)}%` : '—'}
                </div>
                <div className="font-body text-xs text-forest-500 mt-1">{m.label}</div>
                {m.value != null && (
                  <div className="mt-2 h-1 bg-forest-100 rounded-full overflow-hidden">
                    <div className="h-full bg-forest-500 rounded-full"
                         style={{ width: `${m.value * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-forest-400 mt-3">
            Evaluasi pada 440 sampel test (20%), 22 kelas, stratified split. Model dikalibrasi
            dengan Isotonic Regression (cv=5).
          </p>
        </div>
      </div>

      {/* Average user inputs */}
      {analytics?.average_inputs && analytics.total_recommendations > 0 && (
        <div className="card p-5 animate-fade-up animate-delay-500" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-earth-500 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">
              Rata-rata Input Pengguna
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(analytics.average_inputs).map(([key, val]) => (
              <div key={key} className="card-earth p-3 text-center">
                <div className="font-body text-xs text-earth-600 mb-1">{FEATURE_LABELS[key] || key}</div>
                <div className="font-mono text-lg font-bold text-earth-900">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
