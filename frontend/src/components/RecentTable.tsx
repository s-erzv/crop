import { useEffect, useState } from 'react'
import axios from 'axios'
import API_BASE from '../api'
import { Clock, Leaf, ChevronDown, RefreshCw } from 'lucide-react'

interface HistoryItem {
  fact_id:    number
  timestamp:  string
  crop:       string
  category:   string
  confidence: number
  inputs:     Record<string, number>
}

const CROP_EMOJI: Record<string, string> = {
  rice: '🌾', maize: '🌽', chickpea: '🫘', kidneybeans: '🫘', pigeonpeas: '🫘',
  mothbeans: '🫘', mungbean: '🫘', blackgram: '🫘', lentil: '🫘',
  pomegranate: '🍎', banana: '🍌', mango: '🥭', grapes: '🍇',
  watermelon: '🍉', muskmelon: '🍈', apple: '🍎', orange: '🍊',
  papaya: '🍑', coconut: '🥥', cotton: '🌿', jute: '🌿', coffee: '☕'
}

const PAGE_SIZE = 8

export default function RecentTable() {
  const [items,   setItems]   = useState<HistoryItem[]>([])
  const [total,   setTotal]   = useState(0)
  const [offset,  setOffset]  = useState(0)
  const [filter,  setFilter]  = useState('')
  const [crops,   setCrops]   = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPage = async (off: number, crop: string) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: off }
      if (crop) params.crop = crop
      const { data } = await axios.get(`${API_BASE}/history`, { params })
      const fetched: HistoryItem[] = data.items || []
      setItems(off === 0 ? fetched : prev => [...prev, ...fetched])
      setTotal(data.total ?? 0)

      // Collect unique crops for the filter dropdown (first load)
      if (off === 0 && !crop) {
        const unique = Array.from(new Set(fetched.map((i: HistoryItem) => i.crop))).sort()
        if (unique.length) setCrops(unique)
      }
    } catch {
      if (off === 0) setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setOffset(0)
    fetchPage(0, filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadMore = () => {
    const next = offset + PAGE_SIZE
    setOffset(next)
    fetchPage(next, filter)
  }

  const hasMore = items.length < total

  if (loading && items.length === 0) return (
    <div className="card p-6 flex items-center justify-center gap-3 text-forest-400">
      <div className="w-4 h-4 border-2 border-forest-300 border-t-forest-600 rounded-full animate-spin" />
      <span className="font-body text-sm">Memuat riwayat...</span>
    </div>
  )

  if (!loading && items.length === 0) return (
    <div className="card p-8 text-center">
      <Leaf className="mx-auto text-forest-300 mb-3" size={32} />
      <p className="font-body text-sm text-forest-400">
        {filter ? `Tidak ada riwayat untuk tanaman "${filter}".` : 'Belum ada riwayat rekomendasi.'}
      </p>
      {!filter && <p className="font-body text-xs text-forest-300 mt-1">Mulai dengan mengisi form di atas.</p>}
    </div>
  )

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-5 border-b border-forest-100">
        <Clock size={16} className="text-forest-600" />
        <h3 className="font-display text-base font-semibold text-forest-900">Riwayat Rekomendasi</h3>

        {/* Filter dropdown */}
        {crops.length > 0 && (
          <div className="relative ml-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1 bg-forest-50 border border-forest-200
                         rounded-lg font-body text-xs text-forest-700 cursor-pointer focus:outline-none
                         focus:ring-2 focus:ring-forest-300"
            >
              <option value="">Semua tanaman</option>
              {crops.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-400 pointer-events-none" />
          </div>
        )}

        <span className="tag-green ml-auto">{total} total entri</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-forest-50/50 border-b border-forest-100">
              <th className="text-left px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Tanaman</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Kategori</th>
              <th className="text-right px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Keyakinan</th>
              <th className="hidden sm:table-cell text-right px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">N / P / K</th>
              <th className="text-right px-4 py-3 font-mono text-xs text-forest-500 uppercase tracking-wide">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.fact_id}
                  className={`border-b border-forest-50 hover:bg-forest-50/40 transition-colors
                              ${i % 2 === 0 ? 'bg-white/40' : 'bg-transparent'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CROP_EMOJI[item.crop] || '🌱'}</span>
                    <span className="font-body font-medium text-sm text-forest-900 capitalize">{item.crop}</span>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-4 py-3">
                  <span className="tag-earth font-body text-xs">{item.category}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-sm font-medium text-forest-700">
                    {(item.confidence * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-right">
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

      {hasMore && (
        <div className="p-4 flex justify-center border-t border-forest-50">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-forest-50 hover:bg-forest-100
                       border border-forest-200 rounded-xl font-body text-sm text-forest-700
                       transition-colors disabled:opacity-50"
          >
            {loading
              ? <><div className="w-3 h-3 border border-forest-400 border-t-forest-700 rounded-full animate-spin" />Memuat...</>
              : <><RefreshCw size={13} />Muat lebih banyak ({total - items.length} tersisa)</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
