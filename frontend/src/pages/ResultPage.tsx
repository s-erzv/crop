import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Award, TrendingUp, TrendingDown, Minus,
  ChevronRight, AlertTriangle, Info, ThumbsUp, ThumbsDown
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import axios from 'axios'
import API_BASE from '../api'
import { useRecommendation } from '../components/RecommendationContext'

const CROP_EMOJI: Record<string, string> = {
  rice: '🌾', maize: '🌽', chickpea: '🫘', kidneybeans: '🫘', pigeonpeas: '🫘',
  mothbeans: '🫘', mungbean: '🫘', blackgram: '🫘', lentil: '🫘',
  pomegranate: '🍎', banana: '🍌', mango: '🥭', grapes: '🍇',
  watermelon: '🍉', muskmelon: '🍈', apple: '🍎', orange: '🍊',
  papaya: '🍑', coconut: '🥥', cotton: '🌿', jute: '🌿', coffee: '☕'
}

const FEATURE_LABELS: Record<string, string> = {
  N: 'Nitrogen (N)', P: 'Fosfor (P)', K: 'Kalium (K)',
  temperature: 'Suhu', humidity: 'Kelembaban', ph: 'pH Tanah', rainfall: 'Curah Hujan',
  N_P_ratio: 'Rasio N/P', N_K_ratio: 'Rasio N/K', pH_rainfall: 'pH × Hujan'
}

// ── Fix 6: Confidence components ─────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-forest-300 hover:text-forest-100 transition-colors"
        aria-label="Info"
      >
        <Info size={13} />
      </button>
      {show && (
        <span className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-forest-950 text-white
                         text-xs font-body rounded-xl p-3 shadow-2xl leading-relaxed
                         border border-forest-700 whitespace-normal">
          {text}
        </span>
      )}
    </span>
  )
}

function ConfidenceBar({ value, calibrated }: { value: number; calibrated: boolean }) {
  const pct = value * 100
  const barColor  = pct > 80 ? 'bg-forest-400' : pct > 60 ? 'bg-earth-400' : 'bg-red-400'
  const textColor = pct > 80 ? 'text-forest-200' : pct > 60 ? 'text-earth-300' : 'text-red-300'
  const label     = pct > 80 ? 'Tinggi' : pct > 60 ? 'Sedang' : 'Rendah'

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-2 mb-1">
        <span className="font-mono text-xs text-forest-400 uppercase tracking-wide">
          Kepercayaan Model
        </span>
        <InfoTooltip text="Skor probabilitas terkalibrasi menggunakan Sigmoid (Platt Scaling) dari 100 decision tree. Nilai ini mencerminkan keyakinan model yang lebih realistis dibanding raw probability." />
        {calibrated && (
          <span className="px-1.5 py-0.5 bg-earth-700/60 text-earth-300 text-xs font-mono rounded-md border border-earth-600/40">
            Terkalibrasi
          </span>
        )}
      </div>
      <div className={`font-display text-4xl font-bold ${textColor} leading-none`}>
        {pct.toFixed(1)}%
      </div>
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className={`text-xs font-body ${textColor} opacity-80`}>{label}</span>
        <div className="w-32 h-1.5 bg-forest-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-1000`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── SHAP chart tooltip ────────────────────────────────────────────────────────
interface ShapTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function ShapTooltip({ active, payload, label }: ShapTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-white/95 border border-forest-200 rounded-xl p-3 shadow-lg">
      <p className="font-body text-xs text-forest-600 mb-1">{label}</p>
      <p className={`font-mono text-sm font-medium ${val >= 0 ? 'text-forest-700' : 'text-earth-700'}`}>
        {val >= 0 ? '+' : ''}{val.toFixed(4)}
      </p>
      <p className="font-body text-xs text-forest-400 mt-0.5">
        {val > 0 ? 'Mendukung rekomendasi' : val < 0 ? 'Melawan rekomendasi' : 'Netral'}
      </p>
    </div>
  )
}

export default function ResultPage() {
  const { result, formValues } = useRecommendation()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [toast, setToast]         = useState<string | null>(null)
  const [feedback, setFeedback]   = useState<1 | -1 | null>(null)
  const [fbSent, setFbSent]       = useState(false)

  const submitFeedback = async (val: 1 | -1) => {
    if (fbSent || !result) return
    setFeedback(val)
    setFbSent(true)
    try {
      await axios.post(`${API_BASE}/feedback`, { fact_id: result.fact_id, feedback: val })
    } catch { /* fire-and-forget */ }
  }

  // Fix 5: Redirect with toast if no result and no localStorage
  useEffect(() => {
    if (!result) {
      navigate('/', { replace: true, state: { toast: 'Silakan isi kondisi tanah terlebih dahulu.' } })
    }
  }, [result, navigate])

  // Show toast from navigate state (e.g., from Analytics clear)
  useEffect(() => {
    const msg = (location.state as { toast?: string } | null)?.toast
    if (msg) {
      setToast(msg)
      setTimeout(() => setToast(null), 4000)
    }
  }, [location.state])

  if (!result) return null

  // Filter to only show original 7 features in SHAP chart (engineered are supporting)
  const ORIG_KEYS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
  const shapData = Object.entries(result.shap_values)
    .filter(([key]) => ORIG_KEYS.includes(key))
    .map(([key, val]) => ({
      feature:  FEATURE_LABELS[key] || key,
      key,
      value:    parseFloat(val.toFixed(4)),
      absValue: Math.abs(val)
    }))
    .sort((a, b) => b.absValue - a.absValue)

  const maxAbs = Math.max(...shapData.map(d => d.absValue), 0.001)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-forest-800 text-white
                        text-sm font-body px-5 py-3 rounded-xl shadow-xl border border-forest-600
                        animate-fade-up max-w-[90vw] text-center">
          {toast}
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 font-body text-sm text-forest-600
                   hover:text-forest-900 mb-8 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Kembali ke Form
      </button>

      {/* Fix 3: OOD warning card */}
      {result.ood_warning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl
                        flex gap-3 animate-fade-up shadow-sm">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-body font-semibold text-amber-800 text-sm mb-1">
              Peringatan: Input Di Luar Distribusi Training
            </p>
            <p className="font-body text-amber-700 text-sm leading-relaxed">
              {result.ood_details}
            </p>
            {result.out_of_range_features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.out_of_range_features.map(f => (
                  <span key={f} className="px-2 py-0.5 bg-amber-200 text-amber-800
                                           text-xs font-mono rounded-full">
                    {FEATURE_LABELS[f] || f}
                  </span>
                ))}
              </div>
            )}
            <p className="font-body text-xs text-amber-600 mt-2">
              Pertimbangkan validasi dengan ahli pertanian lokal sebelum mengambil keputusan.
            </p>
          </div>
        </div>
      )}

      {/* Ambiguity warning */}
      {result.ambiguous && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl
                        flex gap-3 animate-fade-up shadow-sm">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-body font-semibold text-blue-800 text-sm mb-1">
              Prediksi Ambigu — Margin Rendah
            </p>
            <p className="font-body text-blue-700 text-sm leading-relaxed">
              Selisih keyakinan antara rekomendasi utama dan alternatif teratas hanya{' '}
              <span className="font-mono font-semibold">{((result.margin ?? 0) * 100).toFixed(1)}%</span>.
              Pertimbangkan juga tanaman alternatif di bawah.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main area */}
        <div className="lg:col-span-2 space-y-6">

          {/* Top crop card */}
          <div className="card overflow-hidden animate-fade-up" style={{ animationFillMode: 'forwards' }}>
            <div className="bg-gradient-to-br from-forest-700 to-forest-900 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-field-pattern opacity-10" />
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={16} className="text-earth-300" />
                      <span className="font-mono text-xs text-earth-300 uppercase tracking-widest">
                        Rekomendasi Utama
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl sm:text-5xl">{CROP_EMOJI[result.recommended_crop] || '🌱'}</span>
                      <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold capitalize leading-tight">
                          {result.recommended_crop}
                        </h2>
                        <p className="font-body text-forest-300 text-sm mt-0.5">
                          Tanaman yang direkomendasikan AI
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fix 6: Replaced bare % with ConfidenceBar */}
                  <ConfidenceBar value={result.confidence} calibrated={result.calibrated} />
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-5">
              <h3 className="font-display text-sm font-semibold text-forest-700 uppercase tracking-wide mb-3">
                Penjelasan Preskriptif
              </h3>
              <div className="bg-parchment-100/60 rounded-xl p-4 border border-parchment-300/40">
                {result.explanation.split('\n').map((line, i) => (
                  <p key={i}
                     className={`font-body text-sm leading-relaxed
                       ${i === 0 ? 'font-medium text-forest-900 mb-2' : 'text-forest-700'}`}>
                    {line}
                  </p>
                ))}
              </div>

              {/* Feedback */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-forest-100">
                <span className="font-body text-xs text-forest-400">Apakah rekomendasi ini membantu?</span>
                {fbSent ? (
                  <span className="font-body text-xs text-forest-500 flex items-center gap-1">
                    {feedback === 1 ? <ThumbsUp size={13} className="text-forest-500" /> : <ThumbsDown size={13} className="text-earth-500" />}
                    Terima kasih atas feedback-mu!
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => submitFeedback(1)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-50 hover:bg-forest-100
                                 border border-forest-200 text-forest-600 transition-colors"
                      aria-label="Helpful"
                    >
                      <ThumbsUp size={13} />
                      <span className="font-body text-xs">Ya</span>
                    </button>
                    <button
                      onClick={() => submitFeedback(-1)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-earth-50 hover:bg-earth-100
                                 border border-earth-200 text-earth-600 transition-colors"
                      aria-label="Not helpful"
                    >
                      <ThumbsDown size={13} />
                      <span className="font-body text-xs">Tidak</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SHAP waterfall chart */}
          <div className="card p-5 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-earth-400 rounded-full" />
              <h3 className="font-display text-base font-semibold text-forest-900">
                Pengaruh Fitur (SHAP Values)
              </h3>
            </div>
            <p className="font-body text-xs text-forest-500 mb-4">
              Nilai positif mendukung rekomendasi. Nilai negatif mengurangi keyakinan.
              Ditampilkan 7 fitur asli; fitur turunan (N/P ratio dll.) turut mempengaruhi prediksi.
            </p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-forest-500 rounded-sm" />
                <span className="font-body text-xs text-forest-600">Positif (mendukung)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-earth-500 rounded-sm" />
                <span className="font-body text-xs text-forest-600">Negatif (mengurangi)</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={shapData} layout="vertical"
                        margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5efea" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#5a7a5d' }}
                  tickFormatter={v => v.toFixed(3)}
                  domain={[-maxAbs * 1.15, maxAbs * 1.15]}
                />
                <YAxis
                  type="category" dataKey="feature" width={85}
                  tick={{ fontFamily: 'DM Sans', fontSize: 10, fill: '#2d5e30' }}
                />
                <Tooltip content={<ShapTooltip />} />
                <ReferenceLine x={0} stroke="#9bb89e" strokeWidth={1.5} />
                {result.shap_baseline != null && (
                  <ReferenceLine
                    x={result.shap_baseline}
                    stroke="#d4802a" strokeWidth={1} strokeDasharray="4 3"
                    label={{ value: `E[f]=${result.shap_baseline.toFixed(3)}`, position: 'insideTopRight', fontSize: 9, fill: '#d4802a' }}
                  />
                )}
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {shapData.map((entry, i) => (
                    <Cell key={i} fill={entry.value >= 0 ? '#3d8642' : '#d4802a'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Feature value annotations */}
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {shapData.map(item => {
                const inputVal = formValues[item.key as keyof typeof formValues]
                const Icon  = item.value > 0.01 ? TrendingUp : item.value < -0.01 ? TrendingDown : Minus
                const color = item.value > 0.01 ? 'text-forest-600' : item.value < -0.01 ? 'text-earth-600' : 'text-forest-400'
                return (
                  <div key={item.key} className="bg-forest-50/60 rounded-lg p-2 text-center">
                    <div className="font-mono text-xs text-forest-500">{item.key}</div>
                    <div className="font-display text-sm font-semibold text-forest-900">
                      {typeof inputVal === 'number' ? inputVal.toFixed(1) : '—'}
                    </div>
                    <Icon size={12} className={`mx-auto mt-0.5 ${color}`} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Fix 6: Alternatives with ranked confidence bars */}
          <div className="card p-5 animate-slide-right animate-delay-100" style={{ animationFillMode: 'forwards' }}>
            <h3 className="font-display text-sm font-semibold text-forest-800 uppercase tracking-wide mb-4">
              Alternatif Lain
            </h3>
            <div className="space-y-3">
              {result.alternatives.map((alt, i) => {
                const pct = alt.confidence * 100
                const barColor = pct > 80 ? 'bg-forest-500' : pct > 60 ? 'bg-earth-400' : 'bg-forest-300'
                return (
                  <div key={alt.crop}
                       className="flex items-center gap-3 p-3 rounded-xl bg-forest-50/60
                                  hover:bg-forest-100/60 transition-colors">
                    <span className="font-display text-sm font-bold text-forest-400 w-5">#{i + 2}</span>
                    <span className="text-xl">{CROP_EMOJI[alt.crop] || '🌱'}</span>
                    <div className="flex-1">
                      <div className="font-body text-sm font-medium text-forest-900 capitalize mb-1">
                        {alt.crop}
                      </div>
                      <div className="h-1.5 bg-forest-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`}
                             style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-forest-600 whitespace-nowrap">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Input summary */}
          <div className="card-earth p-5 animate-slide-right animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <h3 className="font-display text-sm font-semibold text-earth-800 uppercase tracking-wide mb-4">
              Input Anda
            </h3>
            <div className="space-y-2">
              {Object.entries(formValues).map(([key, val]) => (
                <div key={key}
                     className="flex justify-between items-center py-1.5 border-b border-earth-100 last:border-0">
                  <span className="font-body text-xs text-earth-600">{FEATURE_LABELS[key] || key}</span>
                  <span className="font-mono text-sm font-medium text-earth-900">
                    {typeof val === 'number' ? val.toFixed(1) : val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            Coba Input Berbeda
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
