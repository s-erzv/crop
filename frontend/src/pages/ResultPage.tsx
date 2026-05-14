import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
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
  temperature: 'Suhu', humidity: 'Kelembaban', ph: 'pH Tanah', rainfall: 'Curah Hujan'
}

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
  const navigate = useNavigate()

  if (!result) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="font-body text-forest-500 mb-4">Belum ada hasil rekomendasi.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Kembali ke Form
        </button>
      </div>
    )
  }

  const shapData = Object.entries(result.shap_values)
    .map(([key, val]) => ({
      feature: FEATURE_LABELS[key] || key,
      value: parseFloat(val.toFixed(4)),
      absValue: Math.abs(val)
    }))
    .sort((a, b) => b.absValue - a.absValue)

  const maxAbs = Math.max(...shapData.map(d => d.absValue))

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 font-body text-sm text-forest-600 hover:text-forest-900 mb-8 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Kembali ke Form
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main recommendation card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top crop card */}
          <div
            className="card overflow-hidden animate-fade-up"
            style={{ animationFillMode: 'forwards' }}
          >
            <div className="bg-gradient-to-br from-forest-700 to-forest-900 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-field-pattern opacity-10" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={16} className="text-earth-300" />
                      <span className="font-mono text-xs text-earth-300 uppercase tracking-widest">Rekomendasi Utama</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-5xl">{CROP_EMOJI[result.recommended_crop] || '🌱'}</span>
                      <div>
                        <h2 className="font-display text-3xl font-bold capitalize leading-tight">
                          {result.recommended_crop}
                        </h2>
                        <p className="font-body text-forest-300 text-sm mt-0.5">
                          Tanaman yang direkomendasikan AI
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-4xl font-bold text-earth-300">
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="font-mono text-xs text-forest-300 uppercase tracking-wide">Keyakinan</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="h-1.5 bg-forest-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-earth-400 rounded-full transition-all duration-1000"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
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
                  <p key={i} className={`font-body text-sm leading-relaxed ${i === 0 ? 'font-medium text-forest-900 mb-2' : 'text-forest-700'}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* SHAP waterfall chart */}
          <div className="card p-5 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 bg-earth-400 rounded-full" />
              <h3 className="font-display text-base font-semibold text-forest-900">
                Pengaruh Fitur (SHAP Values)
              </h3>
            </div>
            <p className="font-body text-xs text-forest-500 mb-4">
              Nilai positif mendukung rekomendasi. Nilai negatif mengurangi keyakinan. Batang diurutkan dari yang paling berpengaruh.
            </p>

            {/* Legend */}
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

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={shapData} layout="vertical" margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5efea" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#5a7a5d' }}
                  tickFormatter={v => v.toFixed(3)}
                  domain={[-maxAbs * 1.1, maxAbs * 1.1]}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={100}
                  tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#2d5e30' }}
                />
                <Tooltip content={<ShapTooltip />} />
                <ReferenceLine x={0} stroke="#9bb89e" strokeWidth={1.5} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {shapData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value >= 0 ? '#3d8642' : '#d4802a'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Feature value annotations */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {shapData.map(item => {
                const rawKey = Object.entries(FEATURE_LABELS).find(([, v]) => v === item.feature)?.[0] || ''
                const inputVal = formValues[rawKey as keyof typeof formValues]
                const Icon = item.value > 0.01 ? TrendingUp : item.value < -0.01 ? TrendingDown : Minus
                const color = item.value > 0.01 ? 'text-forest-600' : item.value < -0.01 ? 'text-earth-600' : 'text-forest-400'
                return (
                  <div key={item.feature} className="bg-forest-50/60 rounded-lg p-2 text-center">
                    <div className="font-mono text-xs text-forest-500">{item.feature.split(' ')[0]}</div>
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

        {/* Sidebar: alternatives + inputs */}
        <div className="space-y-5">
          {/* Alternative crops */}
          <div className="card p-5 animate-slide-right animate-delay-100" style={{ animationFillMode: 'forwards' }}>
            <h3 className="font-display text-sm font-semibold text-forest-800 uppercase tracking-wide mb-4">
              Alternatif Lain
            </h3>
            <div className="space-y-3">
              {result.alternatives.map((alt, i) => (
                <div key={alt.crop} className="flex items-center gap-3 p-3 rounded-xl bg-forest-50/60 hover:bg-forest-100/60 transition-colors">
                  <span className="font-display text-sm font-bold text-forest-400 w-5">#{i + 2}</span>
                  <span className="text-xl">{CROP_EMOJI[alt.crop] || '🌱'}</span>
                  <div className="flex-1">
                    <div className="font-body text-sm font-medium text-forest-900 capitalize">{alt.crop}</div>
                    <div className="h-1 bg-forest-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-forest-400 rounded-full"
                        style={{ width: `${alt.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-mono text-xs text-forest-600">
                    {(alt.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Input summary */}
          <div className="card-earth p-5 animate-slide-right animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <h3 className="font-display text-sm font-semibold text-earth-800 uppercase tracking-wide mb-4">
              Input Anda
            </h3>
            <div className="space-y-2">
              {Object.entries(formValues).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-1.5 border-b border-earth-100 last:border-0">
                  <span className="font-body text-xs text-earth-600">{FEATURE_LABELS[key] || key}</span>
                  <span className="font-mono text-sm font-medium text-earth-900">{typeof val === 'number' ? val.toFixed(1) : val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
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
