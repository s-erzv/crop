import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Loader2, Sprout, Droplets, Thermometer, Wind, FlaskConical, CloudRain, Leaf } from 'lucide-react'
import { useRecommendation, FormValues } from '../components/RecommendationContext'
import RecentTable from '../components/RecentTable'

const FIELD_CONFIG: {
  key: keyof FormValues
  label: string
  unit: string
  min: number
  max: number
  step: number
  icon: React.ReactNode
  description: string
}[] = [
  { key: 'N', label: 'Nitrogen', unit: 'kg/ha', min: 0, max: 200, step: 1, icon: <FlaskConical size={14} />, description: 'Kandungan Nitrogen' },
  { key: 'P', label: 'Fosfor', unit: 'kg/ha', min: 0, max: 200, step: 1, icon: <FlaskConical size={14} />, description: 'Kandungan Fosfor' },
  { key: 'K', label: 'Kalium', unit: 'kg/ha', min: 0, max: 200, step: 1, icon: <FlaskConical size={14} />, description: 'Kandungan Kalium' },
  { key: 'temperature', label: 'Suhu', unit: '°C', min: 0, max: 55, step: 0.1, icon: <Thermometer size={14} />, description: 'Suhu rata-rata' },
  { key: 'humidity', label: 'Kelembaban', unit: '%', min: 0, max: 100, step: 1, icon: <Wind size={14} />, description: 'Kelembaban relatif udara' },
  { key: 'ph', label: 'pH Tanah', unit: '', min: 0, max: 14, step: 0.1, icon: <Droplets size={14} />, description: 'Tingkat keasaman tanah' },
  { key: 'rainfall', label: 'Curah Hujan', unit: 'mm', min: 0, max: 500, step: 1, icon: <CloudRain size={14} />, description: 'Curah hujan tahunan' },
]

export default function HomePage() {
  const { formValues, setFormValues, setResult } = useRecommendation()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Fix 5: Show toast message forwarded from ResultPage redirect
  useEffect(() => {
    const msg = (location.state as { toast?: string } | null)?.toast
    if (msg) {
      setToast(msg)
      setTimeout(() => setToast(null), 4000)
    }
  }, [location.state])

  const handleChange = (key: keyof FormValues, value: number) => {
    setFormValues({ ...formValues, [key]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post('http://localhost:8000/recommend', formValues)
      setResult(data)
      navigate('/result')
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message
        : 'Terjadi kesalahan'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Fix 5: Toast notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-forest-800 text-white
                        text-sm font-body px-5 py-3 rounded-xl shadow-xl border border-forest-600
                        animate-fade-up max-w-[90vw] text-center">
          {toast}
        </div>
      )}
      {/* Hero Header */}
      <div className="mb-8 sm:mb-12 animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-px h-8 bg-earth-400" />
          <span className="font-mono text-xs text-earth-600 uppercase tracking-widest">Analitik Preskriptif</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-forest-950 leading-tight mb-4">
          Temukan Tanaman<br />
          <span className="text-gradient">Terbaik untuk Lahanmu</span>
        </h1>
        <p className="font-body text-forest-600 text-base sm:text-lg max-w-xl leading-relaxed">
          Masukkan kondisi tanah dan iklim lahan. Sistem akan merekomendasikan tanaman optimal dengan penjelasan berbasis AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3">
          <div className="card p-6 bg-field-pattern">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
                <Leaf className="text-parchment-100" size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-forest-900">Parameter Lahan</h2>
                <p className="font-body text-xs text-forest-500">Komposisi tanah & kondisi iklim</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FIELD_CONFIG.map((field, i) => (
                <div
                  key={field.key}
                  className="animate-fade-up opacity-0-init"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                >
                  <label className="label-field">
                    <span className="flex items-center gap-1.5">
                      {field.icon}
                      {field.label}
                      {field.unit && <span className="text-forest-400 normal-case">({field.unit})</span>}
                    </span>
                  </label>
                  <p className="font-body text-xs text-forest-400 mb-2">{field.description}</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={formValues[field.key]}
                      onChange={e => handleChange(field.key, parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={formValues[field.key]}
                      onChange={e => handleChange(field.key, parseFloat(e.target.value))}
                      className="input-field w-20 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="font-body text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Sprout size={18} />
                  Dapatkan Rekomendasi
                </>
              )}
            </button>
          </div>
        </form>

        {/* Side info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Current values summary */}
          <div className="card-earth p-5 animate-fade-up animate-delay-300" style={{ animationFillMode: 'forwards' }}>
            <h3 className="font-display text-sm font-semibold text-earth-800 mb-3 uppercase tracking-wide">Kondisi Saat Ini</h3>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_CONFIG.map(field => (
                <div key={field.key} className="bg-white/60 rounded-xl p-2.5">
                  <div className="font-mono text-xs text-earth-500 uppercase tracking-wide">{field.label}</div>
                  <div className="font-display text-lg font-semibold text-earth-900">
                    {field.step < 1 ? formValues[field.key].toFixed(1) : formValues[field.key]}
                    <span className="font-body text-xs font-normal text-earth-400 ml-1">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card p-5">
            <h3 className="font-display text-sm font-semibold text-forest-800 mb-3">Panduan Nilai</h3>
            <div className="space-y-2 font-body text-xs text-forest-600">
              <p>• <strong>N 40–120 kg/ha</strong>: Rentang umum tanaman pangan</p>
              <p>• <strong>pH 6.0–7.5</strong>: Optimal untuk kebanyakan tanaman</p>
              <p>• <strong>Suhu 20–35°C</strong>: Ideal untuk tanaman tropis</p>
              <p>• <strong>Kelembaban 60–90%</strong>: Mendukung pertumbuhan optimal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent recommendations */}
      <div className="mt-12">
        <RecentTable />
      </div>
    </div>
  )
}
