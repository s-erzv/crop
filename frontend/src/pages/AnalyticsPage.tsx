import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { BarChart2, TrendingUp, Database, Cpu } from 'lucide-react'

interface Analytics {
  total_recommendations: number
  crop_distribution: { label: string; category: string; count: number }[]
  confidence_by_crop: { crop: string; avg_confidence: number }[]
  by_category: { category: string; count: number }[]
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
}

const FEATURE_LABELS: Record<string, string> = {
  N: 'Nitrogen', P: 'Fosfor', K: 'Kalium',
  temperature: 'Suhu', humidity: 'Kelembaban', ph: 'pH Tanah', rainfall: 'Curah Hujan'
}

const COLORS = [
  '#2d6b32', '#3d8642', '#5ea362', '#8ec390', '#bbdcbc',
  '#d4802a', '#e3a040', '#ecc170', '#b96320', '#974a1d'
]

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className={`card p-5 flex items-center gap-4 animate-fade-up`} style={{ animationFillMode: 'forwards' }}>
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
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [featureImp, setFeatureImp] = useState<FeatureImportance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:8000/analytics'),
      axios.get('http://localhost:8000/feature-importance')
    ]).then(([a, f]) => {
      setAnalytics(a.data)
      setFeatureImp(f.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-20 flex items-center justify-center gap-3 text-forest-400">
      <div className="w-5 h-5 border-2 border-forest-300 border-t-forest-600 rounded-full animate-spin" />
      <span className="font-body">Memuat data analitik...</span>
    </div>
  )

  const perf = analytics?.model_performance

  const featData = featureImp?.feature_importance.map(f => ({
    feature: FEATURE_LABELS[f.feature] || f.feature,
    importance: parseFloat((f.importance * 1000).toFixed(4)),
    raw: f.importance
  })) || []

  const maxFeat = Math.max(...featData.map(d => d.importance), 1)

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-px h-6 bg-earth-400" />
          <span className="font-mono text-xs text-earth-600 uppercase tracking-widest">Dashboard Analitik</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-forest-950">
          Wawasan & Statistik
        </h1>
        <p className="font-body text-forest-500 mt-2">
          Distribusi rekomendasi, performa model, dan kepentingan fitur secara global.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Rekomendasi"
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
          label="Jenis Tanaman"
          value={String(analytics?.crop_distribution?.length || 0)}
          icon={<BarChart2 size={22} className="text-white" />}
          color="bg-earth-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Crop distribution */}
        {analytics?.crop_distribution && analytics.crop_distribution.length > 0 ? (
          <div className="card p-5 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-forest-500 rounded-full" />
              <h3 className="font-display text-base font-semibold text-forest-900">Distribusi Tanaman</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.crop_distribution.slice(0, 10)} margin={{ left: -10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5efea" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontFamily: 'DM Sans', fontSize: 10, fill: '#5a7a5d' }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
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
          </div>
        ) : (
          <div className="card p-5 flex items-center justify-center text-forest-400">
            <p className="font-body text-sm">Belum ada data rekomendasi.</p>
          </div>
        )}

        {/* Feature importance */}
        <div className="card p-5 animate-fade-up animate-delay-300" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-earth-500 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">Kepentingan Fitur Global (SHAP)</h3>
          </div>
          <div className="space-y-3">
            {featData.map((f, i) => (
              <div key={f.feature} className="group">
                <div className="flex justify-between mb-1">
                  <span className="font-body text-sm text-forest-700">{f.feature}</span>
                  <span className="font-mono text-xs text-forest-500">{f.raw.toFixed(4)}</span>
                </div>
                <div className="h-2 bg-forest-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(f.importance / maxFeat) * 100}%`,
                      background: i < 3 ? '#2d6b32' : i < 5 ? '#5ea362' : '#8ec390',
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-forest-400 mt-4">
            Nilai rata-rata |SHAP| dari sampel training. Semakin tinggi = semakin berpengaruh dalam prediksi.
          </p>
        </div>
      </div>

      {/* Model performance detail */}
      <div className="card p-5 animate-fade-up animate-delay-400" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 bg-forest-700 rounded-full" />
          <h3 className="font-display text-base font-semibold text-forest-900">Performa Model — Random Forest</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Accuracy', value: perf?.accuracy },
            { label: 'Precision (Macro)', value: perf?.precision_macro },
            { label: 'Recall (Macro)', value: perf?.recall_macro },
            { label: 'F1 Score (Macro)', value: perf?.f1_macro },
          ].map(m => (
            <div key={m.label} className="bg-forest-50/60 rounded-xl p-4 text-center">
              <div className="font-mono text-2xl font-bold text-forest-800">
                {m.value != null ? `${(m.value * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="font-body text-xs text-forest-500 mt-1">{m.label}</div>
              {m.value != null && (
                <div className="mt-2 h-1 bg-forest-100 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-500 rounded-full" style={{ width: `${m.value * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="font-body text-xs text-forest-400 mt-4">
          Evaluasi pada 20% test set (440 sampel, 22 kelas tanaman, stratified split).
        </p>
      </div>

      {/* Average inputs */}
      {analytics?.average_inputs && (
        <div className="card p-5 mt-6 animate-fade-up animate-delay-500" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-earth-500 rounded-full" />
            <h3 className="font-display text-base font-semibold text-forest-900">Rata-rata Input Pengguna</h3>
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
