import { useEffect, useState } from 'react'
import axios from 'axios'
import { Clock, Leaf } from 'lucide-react'

interface HistoryItem {
  fact_id: number
  timestamp: string
  crop: string
  category: string
  confidence: number
  inputs: Record<string, number>
}

const CROP_EMOJI: Record<string, string> = {
  rice: '🌾', maize: '🌽', chickpea: '🫘', kidneybeans: '🫘', pigeonpeas: '🫘',
  mothbeans: '🫘', mungbean: '🫘', blackgram: '🫘', lentil: '🫘',
  pomegranate: '🍎', banana: '🍌', mango: '🥭', grapes: '🍇',
  watermelon: '🍉', muskmelon: '🍈', apple: '🍎', orange: '🍊',
  papaya: '🍑', coconut: '🥥', cotton: '🌿', jute: '🌿', coffee: '☕'
}

export default function RecentTable() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('http://localhost:8000/history?limit=8')
      .then(r => setItems(r.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="card p-6 flex items-center justify-center gap-3 text-forest-400">
      <div className="w-4 h-4 border-2 border-forest-300 border-t-forest-600 rounded-full animate-spin" />
      <span className="font-body text-sm">Memuat riwayat...</span>
    </div>
  )

  if (items.length === 0) return (
    <div className="card p-8 text-center">
      <Leaf className="mx-auto text-forest-300 mb-3" size={32} />
      <p className="font-body text-sm text-forest-400">Belum ada riwayat rekomendasi.</p>
      <p className="font-body text-xs text-forest-300 mt-1">Mulai dengan mengisi form di atas.</p>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-forest-100">
        <Clock size={16} className="text-forest-600" />
        <h3 className="font-display text-base font-semibold text-forest-900">Riwayat Rekomendasi</h3>
        <span className="tag-green ml-auto">{items.length} entri terbaru</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-forest-50/50 border-b border-forest-100">
              <th className="text-left px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Tanaman</th>
              <th className="text-left px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Kategori</th>
              <th className="text-right px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Keyakinan</th>
              <th className="text-right px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">N / P / K</th>
              <th className="text-right px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.fact_id} className={`border-b border-forest-50 hover:bg-forest-50/40 transition-colors ${i % 2 === 0 ? 'bg-white/40' : 'bg-transparent'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CROP_EMOJI[item.crop] || '🌱'}</span>
                    <span className="font-body font-medium text-sm text-forest-900 capitalize">{item.crop}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="tag-earth font-body text-xs">{item.category}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-sm font-medium text-forest-700">
                    {(item.confidence * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-xs text-forest-500">
                    {item.inputs.N?.toFixed(0)} / {item.inputs.P?.toFixed(0)} / {item.inputs.K?.toFixed(0)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-xs text-forest-400">
                    {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
