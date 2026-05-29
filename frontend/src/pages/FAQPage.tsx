import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/* ── Mini visual components ─────────────────────────────────────────────── */

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-green-300 leading-relaxed overflow-x-auto my-3">
      {children}
    </div>
  )
}

function Callout({ type, children }: { type: 'info' | 'warning' | 'tip', children: React.ReactNode }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    tip:     'bg-forest-50 border-forest-200 text-forest-800',
  }
  const icons = { info: 'ℹ️', warning: '⚠️', tip: '💡' }
  return (
    <div className={`border rounded-xl p-3 my-3 text-sm ${styles[type]}`}>
      <span className="mr-2">{icons[type]}</span>{children}
    </div>
  )
}

function CompareTable({ rows, headers }: { rows: string[][], headers: string[] }) {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="bg-forest-700 text-white px-3 py-2 text-left font-mono text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-forest-50' : 'bg-white'}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-xs text-forest-700 border-b border-forest-100">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VotingDiagram() {
  return (
    <div className="bg-gray-950 rounded-xl p-5 my-3 font-mono text-xs">
      <p className="text-gray-400 mb-3">// 100 pohon keputusan, masing-masing kasih jawaban</p>
      <div className="space-y-1.5">
        {[
          { label: 'PADI', count: 95, color: 'bg-green-500' },
          { label: 'JUTE', count: 3,  color: 'bg-amber-500' },
          { label: 'KELAPA', count: 2, color: 'bg-orange-400' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-gray-400 w-14">{item.label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2 transition-all`}
                style={{ width: `${item.count}%` }}
              >
                <span className="text-white text-xs font-bold">{item.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-800 text-green-400">
        → Suara terbanyak: PADI &nbsp;|&nbsp; Confidence = 95/100 = <strong>95%</strong>
      </div>
    </div>
  )
}

function TreeDiagram() {
  return (
    <div className="bg-gray-950 rounded-xl p-4 my-3 font-mono text-xs text-gray-300 leading-loose">
      <p className="text-gray-500 mb-2">// Contoh satu pohon keputusan:</p>
      <p>Kelembaban &gt; 80?</p>
      <p className="pl-4">├── <span className="text-green-400">Ya</span> → Suhu &gt; 20°C?</p>
      <p className="pl-8">│    ├── <span className="text-green-400">Ya</span> → <span className="text-yellow-300 font-bold">🌾 PADI</span></p>
      <p className="pl-8">│    └── <span className="text-red-400">Tidak</span> → <span className="text-blue-300">JUTE</span></p>
      <p className="pl-4">└── <span className="text-red-400">Tidak</span> → pH &gt; 6?</p>
      <p className="pl-8">     ├── <span className="text-green-400">Ya</span> → <span className="text-orange-300">JAGUNG</span></p>
      <p className="pl-8">     └── <span className="text-red-400">Tidak</span> → <span className="text-pink-300">KAPAS</span></p>
    </div>
  )
}

function SHAPDiagram() {
  const features = [
    { name: 'Kelembaban (82%)', val: 0.032,  dir: 1 },
    { name: 'Nitrogen (90)',    val: 0.023,  dir: 1 },
    { name: 'Curah Hujan',     val: 0.019,  dir: 1 },
    { name: 'Fosfor (42)',     val: -0.005, dir: -1 },
    { name: 'pH (6.5)',        val: -0.008, dir: -1 },
  ]
  const maxAbs = 0.035
  return (
    <div className="bg-gray-950 rounded-xl p-4 my-3">
      <p className="font-mono text-xs text-gray-400 mb-3">// Kontribusi tiap fitur ke prediksi PADI:</p>
      <div className="space-y-2">
        {features.map(f => (
          <div key={f.name} className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400 w-36 shrink-0">{f.name}</span>
            <div className="flex-1 flex items-center">
              {f.dir > 0 ? (
                <>
                  <div className="w-1/2" />
                  <div
                    className="h-5 bg-green-500 rounded-r flex items-center justify-end pr-1.5"
                    style={{ width: `${(f.val / maxAbs) * 50}%` }}
                  >
                    <span className="font-mono text-xs text-white font-bold">+{f.val.toFixed(3)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="h-5 bg-amber-500 rounded-l flex items-center justify-start pl-1.5 ml-auto"
                    style={{ width: `${(Math.abs(f.val) / maxAbs) * 50}%` }}
                  >
                    <span className="font-mono text-xs text-white font-bold">{f.val.toFixed(3)}</span>
                  </div>
                  <div className="w-1/2" />
                </>
              )}
            </div>
          </div>
        ))}
        <div className="border-t border-gray-700 mt-2 pt-2 font-mono text-xs text-green-400">
          Baseline: 0.045 + semua kontribusi = 0.106 → <strong>PADI ✓</strong>
        </div>
      </div>
    </div>
  )
}

function CalibrationDiagram() {
  const data = [
    { raw: '97%', cal: '89%', label: 'Kondisi jelas' },
    { raw: '92%', cal: '81%', label: 'Kondisi normal' },
    { raw: '85%', cal: '72%', label: 'Agak borderline' },
    { raw: '71%', cal: '58%', label: 'Borderline' },
    { raw: '60%', cal: '52%', label: 'Ambigu' },
  ]
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr>
            <th className="bg-gray-100 px-3 py-2 text-left text-gray-600">Kondisi</th>
            <th className="bg-amber-50 px-3 py-2 text-center text-amber-700">Base RF bilang</th>
            <th className="px-2 py-2 text-center text-gray-400">→</th>
            <th className="bg-green-50 px-3 py-2 text-center text-green-700">Setelah kalibrasi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-3 py-2 text-gray-600">{row.label}</td>
              <td className="px-3 py-2 text-center text-amber-700 font-bold">{row.raw}</td>
              <td className="px-2 py-2 text-center text-gray-400">→</td>
              <td className="px-3 py-2 text-center text-green-700 font-bold">{row.cal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2 text-center italic">Kalibrasi "menarik turun" angka yang terlalu tinggi → confidence lebih jujur</p>
    </div>
  )
}

function StarSchemaSimple() {
  return (
    <svg viewBox="0 0 420 260" className="w-full my-3" style={{ maxHeight: 260 }}>
      {/* Lines */}
      {[
        { x1: 210, y1: 130, x2: 65, y2: 50 },
        { x1: 210, y1: 130, x2: 355, y2: 50 },
        { x1: 210, y1: 130, x2: 65, y2: 210 },
        { x1: 210, y1: 130, x2: 355, y2: 210 },
      ].map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#5a9e5f" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />
      ))}
      {/* Fact */}
      <rect x="140" y="88" width="140" height="84" rx="8" fill="#2d5e30" />
      <text x="210" y="107" textAnchor="middle" fill="#d4a574" fontSize="8" fontWeight="bold" fontFamily="monospace">FACT_CROP</text>
      <text x="210" y="120" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7" fontFamily="monospace">soil_id · climate_id</text>
      <text x="210" y="131" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7" fontFamily="monospace">crop_id · time_id</text>
      <text x="210" y="142" textAnchor="middle" fill="#90c8f0" fontSize="7" fontFamily="monospace">confidence · shap_n…</text>
      <text x="210" y="153" textAnchor="middle" fill="#d4a574" fontSize="7" fontFamily="monospace">is_training · feedback</text>
      {/* Dims */}
      {[
        { x: 10,  y: 20,  w: 110, h: 60, fill: '#f0f7f1', stroke: '#4a8a4d', title: 'DIM_SOIL', items: ['soil_id PK','nitrogen','phosphorus','potassium','ph'], tc: '#2d5e30', ic: '#5a7a5d' },
        { x: 300, y: 20,  w: 110, h: 56, fill: '#eff6ff', stroke: '#93c5fd', title: 'DIM_CLIMATE', items: ['climate_id PK','temperature','humidity','rainfall'], tc: '#1e40af', ic: '#3b82f6' },
        { x: 10,  y: 180, w: 110, h: 56, fill: '#fefce8', stroke: '#d97706', title: 'DIM_CROP', items: ['crop_id PK','label','category','description'], tc: '#92400e', ic: '#b45309' },
        { x: 300, y: 180, w: 110, h: 60, fill: '#faf5ff', stroke: '#a855f7', title: 'DIM_TIME', items: ['time_id PK','timestamp','date','hour','day_of_week'], tc: '#6b21a8', ic: '#9333ea' },
      ].map(d => (
        <g key={d.title}>
          <rect x={d.x} y={d.y} width={d.w} height={d.h} rx="6" fill={d.fill} stroke={d.stroke} strokeWidth="1.5" />
          <text x={d.x + d.w/2} y={d.y + 14} textAnchor="middle" fill={d.tc} fontSize="7.5" fontWeight="bold" fontFamily="monospace">{d.title}</text>
          {d.items.map((item, i) => (
            <text key={item} x={d.x + d.w/2} y={d.y + 24 + i*10} textAnchor="middle" fill={item.includes('PK') ? d.tc : d.ic} fontSize="7" fontFamily="monospace" fontWeight={item.includes('PK') ? 'bold' : 'normal'}>{item}</text>
          ))}
        </g>
      ))}
    </svg>
  )
}

function OODLayerDiagram() {
  return (
    <div className="space-y-2 my-3">
      {[
        { num: '1', title: 'Degenerate Check', ex: 'N+P+K < 1', detail: 'Cek paling kasar. Tanah produktif tidak mungkin nol semua.', bg: 'bg-red-50', border: 'border-red-200', numBg: 'bg-red-500' },
        { num: '2', title: 'Range P1–P99', ex: 'rainfall = 400mm (max normal: 268mm)', detail: 'Tiap fitur dicek satu per satu. Kalau keluar dari rentang normal data training → peringatan.', bg: 'bg-amber-50', border: 'border-amber-200', numBg: 'bg-amber-500' },
        { num: '3', title: 'IsolationForest', ex: 'N=140, pH=3.5, hujan=290 — tiap fitur OK, tapi kombinasinya tidak pernah ada', detail: 'Paling canggih. Deteksi kombinasi aneh meski tiap fitur individu masih dalam rentang.', bg: 'bg-orange-50', border: 'border-orange-200', numBg: 'bg-orange-500' },
      ].map(l => (
        <div key={l.num} className={`flex gap-3 p-3 rounded-xl border ${l.bg} ${l.border}`}>
          <div className={`w-6 h-6 rounded-full ${l.numBg} text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5`}>{l.num}</div>
          <div>
            <p className="font-semibold text-sm text-gray-800">{l.title}</p>
            <code className="text-xs bg-white/70 px-2 py-0.5 rounded my-1 inline-block">{l.ex}</code>
            <p className="text-xs text-gray-600">{l.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── FAQ data ────────────────────────────────────────────────────────────── */

interface FAQItem { q: string; a: React.ReactNode }

const SECTIONS: { title: string; emoji: string; items: FAQItem[] }[] = [
  {
    title: '7 Variabel Input',
    emoji: '🌱',
    items: [
      {
        q: 'Apa itu N, P, K dan kenapa ketiganya penting?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>NPK itu tiga "makanan utama" tanaman. Analoginya seperti makanan manusia: karbohidrat, protein, lemak — kalau salah satunya kurang, tubuh tidak bisa tumbuh optimal.</p>
            <CompareTable
              headers={['Nutrisi', 'Fungsi Utama', 'Kekurangan', 'Diukur dengan']}
              rows={[
                ['N — Nitrogen', 'Pertumbuhan daun & batang', 'Daun kuning, tumbuh lambat', 'Uji lab / sensor tanah'],
                ['P — Fosfor', 'Perkembangan akar & buah', 'Akar lemah, buah sedikit', 'Uji lab tanah'],
                ['K — Kalium', 'Ketahanan penyakit & kekeringan', 'Mudah layu, buah buruk', 'Uji lab tanah'],
              ]}
            />
            <Callout type="tip">Satuan kg/ha artinya berapa kilogram unsur itu ada per satu hektar tanah.</Callout>
          </div>
        ),
      },
      {
        q: 'Apa itu pH, Suhu, Kelembaban, dan Curah Hujan?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <CompareTable
              headers={['Variabel', 'Analoginya', 'Rentang Normal', 'Diukur dengan']}
              rows={[
                ['pH Tanah', 'Seperti rasa tanah — asam atau basa. Kebanyakan tanaman suka "netral".', 'Optimal 6–7 (netral)', 'pH meter / kertas lakmus'],
                ['Suhu (°C)', 'Padi suka hangat, apel butuh "musim dingin" untuk berbuah.', '20–35°C tropis', 'Termometer / stasiun cuaca'],
                ['Kelembaban (%)', 'Seberapa "lembab" udara. Terlalu kering = layu, terlalu lembab = jamur.', '60–90% ideal', 'Hygrometer'],
                ['Curah Hujan (mm)', 'Total air hujan setahun. Padi butuh banjiran, kopi butuh cukup.', '50–250mm bervariasi', 'Penakar hujan / BMKG'],
              ]}
            />
          </div>
        ),
      },
    ],
  },

  {
    title: 'Rekayasa Fitur',
    emoji: '🔬',
    items: [
      {
        q: 'Kenapa ditambah 3 fitur turunan padahal sudah ada 7 fitur?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Masalahnya:</strong> model cuma bisa lihat tiap angka secara terpisah. Dia tidak bisa "membagi" dua fitur sendiri.</p>
            <p>Bayangin kamu punya dua cangkir kopi:</p>
            <CodeBlock>
              <p className="text-gray-400">// Dua tanah dengan N yang sama persis:</p>
              <p>Tanah A: N=90, P=<span className="text-red-400">10</span>  → N/P ratio = <span className="text-red-400 font-bold">9.0</span>  ← nitrogen jauh lebih banyak</p>
              <p>Tanah B: N=90, P=<span className="text-green-400">45</span>  → N/P ratio = <span className="text-green-400 font-bold">2.0</span>  ← seimbang</p>
              <p className="text-gray-500 mt-2">Model lihat N=90 di keduanya → dianggap SAMA. Padahal beda banget!</p>
            </CodeBlock>
            <p>Makanya kita tambah fitur N/P ratio secara eksplisit supaya model bisa membedakan keduanya.</p>
            <CompareTable
              headers={['Fitur Turunan', 'Rumus', 'Artinya']}
              rows={[
                ['N/P ratio', 'N ÷ (P + ε)', 'Keseimbangan nitrogen vs fosfor. Tinggi = nitrogen dominan.'],
                ['N/K ratio', 'N ÷ (K + ε)', 'Keseimbangan pertumbuhan vs ketahanan tanaman.'],
                ['pH × Curah Hujan', 'pH × rainfall', 'Tanah asam + hujan deras = nutrisi cepat tercuci. Sama-sama asam tapi efeknya beda kalau hujannya beda.'],
              ]}
            />
            <Callout type="info">ε (epsilon) = angka sangat kecil (0.000001) supaya tidak ada pembagian dengan nol.</Callout>
          </div>
        ),
      },
    ],
  },

  {
    title: 'Predictive vs Prescriptive',
    emoji: '🎯',
    items: [
      {
        q: 'Apa bedanya sistem ini dengan sistem prediksi biasa?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <CompareTable
              headers={['Level', 'Pertanyaan yang dijawab', 'Contoh output']}
              rows={[
                ['Predictive', 'Apa yang akan terjadi?', '"Tanaman cocok: padi"'],
                ['Explanatory', 'Kenapa bisa begitu?', '"Padi cocok karena kelembaban tinggi"'],
                ['Prescriptive ✓', 'Apa yang harus dilakukan?', '"Tanam padi. Kelembaban optimal. Tingkatkan kalium!"'],
              ]}
            />
            <p>Yang bikin jadi prescriptive bukan cuma SHAP — tapi fungsi <code className="text-xs bg-gray-100 px-1 rounded">build_explanation()</code> yang mengubah angka SHAP jadi kalimat saran:</p>
            <CodeBlock>
              <p className="text-gray-400">// SHAP negatif + nilai rendah → sarankan ditingkatkan</p>
              <p>shap_K = -0.021, nilai K = 43  →  <span className="text-yellow-300">"Tingkatkan Kalium untuk hasil lebih baik"</span></p>
              <p className="mt-2 text-gray-400">// SHAP positif + nilai optimal → konfirmasi</p>
              <p>shap_lembab = +0.032, lembab = 82%  →  <span className="text-green-400">"Kelembaban optimal untuk padi"</span></p>
            </CodeBlock>
          </div>
        ),
      },
    ],
  },

  {
    title: 'Data Warehouse & Star Schema',
    emoji: '🏛️',
    items: [
      {
        q: 'Kenapa harus bikin Data Warehouse, bukannya langsung simpan di CSV?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>Analoginya: kalau kamu hanya mau catat pengeluaran hari ini, notes HP cukup. Tapi kalau mau tahu "bulan lalu rata-rata pengeluaran makan siang berapa?" — kamu butuh spreadsheet atau aplikasi keuangan.</p>
            <CompareTable
              headers={['Skenario', 'CSV cukup?', 'Butuh DW?']}
              rows={[
                ['Hanya prediksi sekali jalan', '✅ Cukup', '–'],
                ['Simpan riwayat semua prediksi', '❌ Susah di-query', '✅'],
                ['"Tanaman apa paling sering direkomendasikan?"', '❌', '✅'],
                ['Analitik SHAP per tanaman historis', '❌', '✅'],
                ['Dashboard real-time', '❌', '✅'],
              ]}
            />
            <Callout type="tip">Setiap kali ada yang klik "Dapatkan Rekomendasi", hasilnya otomatis tersimpan ke database — termasuk kondisi tanah, tanaman yang direkomendasikan, dan nilai SHAP-nya.</Callout>
          </div>
        ),
      },
      {
        q: 'Apa itu Star Schema dan kenapa dipilih?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>Star Schema = cara menyusun database supaya query analitik cepat. Namanya "star" karena kalau digambar, bentuknya seperti bintang — satu tabel fakta di tengah, dimensi-dimensi di sudut-sudutnya.</p>
            <StarSchemaSimple />
            <p><strong>Kenapa tidak satu tabel besar?</strong> Karena data akan diulang-ulang. Kalau 1000 prediksi semuanya di Bandung, kata "Bandung" tersimpan 1000 kali. Dengan Star Schema, "Bandung" cukup tersimpan sekali di Dim_Climate.</p>
            <Callout type="tip">1.760 baris data training + nilai SHAP-nya langsung di-ETL ke DW saat training. Makanya halaman Analitik langsung punya data dari hari pertama, tidak perlu nunggu pengguna.</Callout>
          </div>
        ),
      },
    ],
  },

  {
    title: 'Random Forest',
    emoji: '🌲',
    items: [
      {
        q: 'Apa itu Random Forest dan cara kerjanya?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>Bayangin kamu mau beli HP baru. Kamu tanya <strong>1 teman</strong> → dia bilang iPhone. Kamu ikutin. Tapi teman itu mungkin bias karena dia fanboy Apple.</p>
            <p>Sekarang kamu tanya <strong>100 teman berbeda</strong> — yang ngerti teknisi, yang suka kamera, yang cari yang murah, dll. Lalu ambil suara terbanyak. Hasilnya jauh lebih bisa dipercaya.</p>
            <p>Itulah Random Forest. <strong>100 "teman"</strong> = 100 pohon keputusan. Masing-masing dilatih dari subset data yang sedikit berbeda supaya tidak semua punya opini yang sama persis.</p>
            <VotingDiagram />
            <p>Setiap pohon punya struktur seperti ini di dalamnya:</p>
            <TreeDiagram />
            <Callout type="warning">Masalah: voting 100 pohon ini menghasilkan angka yang terlalu percaya diri. 95 dari 100 pohon bilang padi → confidence langsung 95%, meski kondisinya sebenarnya borderline. Makanya perlu dikalibrasi.</Callout>
          </div>
        ),
      },
      {
        q: 'Kenapa Random Forest dipilih, bukan algoritma lain?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <CompareTable
              headers={['Algoritma', 'Akurasi', 'SHAP TreeExplainer', 'Butuh Normalisasi', 'Confidence OK']}
              rows={[
                ['RF + Kalibrasi ✦', '99,32%', '✅ Ya', '❌ Tidak perlu', '✅ Setelah kalibrasi'],
                ['RF (dasar)', '99,55%', '✅ Ya', '❌ Tidak perlu', '❌ Overconfident'],
                ['Extra Trees', '99,09%', '✅ Ya', '❌ Tidak perlu', '❌ Overconfident'],
                ['Naive Bayes', '99,09%', '❌ Tidak bisa', '❌ Tidak perlu', '–'],
                ['SVM', '68,18%', '❌ Tidak bisa', '✅ Harus', '–'],
                ['MLP Neural Network', '92,05%', '❌ Tidak bisa', '✅ Harus', '–'],
              ]}
            />
            <Callout type="tip">Tidak ada algoritma lain yang memenuhi SEMUA syarat sekaligus: akurasi tinggi + SHAP TreeExplainer + confidence realistis + tidak butuh normalisasi.</Callout>
          </div>
        ),
      },
    ],
  },

  {
    title: 'Kalibrasi Probabilitas',
    emoji: '⚖️',
    items: [
      {
        q: 'Kenapa ada dua model RF (Base dan Calibrated)?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>Karena tidak ada satu model yang bisa melayani dua kebutuhan sekaligus:</p>
            <CodeBlock>
              <p className="text-gray-400">// Input yang sama, dikirim ke dua model berbeda secara paralel:</p>
              <p>Input: N=90, P=42, K=43...</p>
              <p className="pl-4">├──→ <span className="text-green-400">Base RF</span>        → nilai SHAP (penjelasan kenapa)</p>
              <p className="pl-4">└──→ <span className="text-blue-400">Calibrated RF</span>  → confidence yang jujur + tanaman</p>
            </CodeBlock>
            <p><strong>Kenapa tidak bisa satu model saja?</strong> Karena setelah kalibrasi, RF dibungkus lapisan Logistic Regression. SHAP TreeExplainer tidak bisa masuk ke dalamnya — dia hanya bisa baca pohon murni.</p>
            <p>Analoginya: dokter untuk diagnosa (Base RF) vs apoteker untuk dosis obat (Calibrated RF). Tugasnya beda, tidak bisa digabung jadi satu orang.</p>
          </div>
        ),
      },
      {
        q: 'Apa itu Platt Scaling / kalibrasi probabilitas?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>RF menghasilkan confidence dari voting — 95 pohon bilang padi = 95%. Tapi angka ini <strong>tidak jujur</strong>. Dari data validasi (440 baris yang tidak dilihat model waktu training), ketahuan bahwa:</p>
            <CalibrationDiagram />
            <p>Platt Scaling belajar pola koreksi ini dari data validasi, lalu buat rumus: <em>"kalau RF bilang X%, yang sebenernya adalah Y%."</em> Rumus ini yang dipakai selamanya untuk prediksi baru.</p>
            <Callout type="info">Ini penting supaya peringatan "prediksi ambigu" (margin &lt; 20%) bisa berfungsi benar. Tanpa kalibrasi, confidence hampir selalu 90%+ dan peringatan tidak pernah muncul.</Callout>
          </div>
        ),
      },
      {
        q: 'Bisa tidak RF base dan Calibrated RF berbeda pendapat?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Bisa.</strong> Keduanya dilatih independen dari data yang sama. Hampir selalu sepakat, tapi di kondisi yang sangat borderline bisa terjadi:</p>
            <CodeBlock>
              <p className="text-red-400">// Kasus paling buruk (jarang, tapi bisa terjadi):</p>
              <p>Base RF → 51 pohon pilih PADI → SHAP bilang "karena kelembaban mendukung padi"</p>
              <p>Calibrated RF → setelah koreksi → rekomendasikan <span className="text-yellow-300">JUTE</span></p>
              <p className="text-gray-400 mt-2">→ Output: rekomendasikan jute, tapi penjelasannya bicara soal padi 😬</p>
            </CodeBlock>
            <Callout type="warning">Ini adalah keterbatasan nyata sistem ini yang belum ada mekanisme handling-nya. Terjadi hanya di kondisi yang benar-benar borderline.</Callout>
          </div>
        ),
      },
    ],
  },

  {
    title: 'SHAP & Explainability',
    emoji: '💡',
    items: [
      {
        q: 'Apa itu SHAP dan bagaimana cara kerjanya?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>SHAP menjawab pertanyaan: <em>"dari semua fitur yang dimasukkan, mana yang paling mendorong model ke keputusan ini?"</em></p>
            <p>Analoginya: kamu dapat nilai 85 di ujian. SHAP itu seperti dosen yang merinci: "kamu dapat +30 dari esai, +25 dari pilihan ganda, -10 karena salah di bagian hitungan."</p>
            <SHAPDiagram />
            <p>Angka positif = fitur ini <strong>mendukung</strong> prediksi padi. Angka negatif = fitur ini <strong>melawan</strong>. Semua dijumlahkan dari baseline → dapat prediksi akhir.</p>
          </div>
        ),
      },
      {
        q: 'Kenapa pakai TreeExplainer, bukan cara SHAP yang lain?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <CompareTable
              headers={['Metode', 'Cara kerja', 'Kecepatan', 'Akurasi']}
              rows={[
                ['KernelExplainer', 'Coba-coba ribuan kombinasi input (estimasi)', '🐢 Lambat banget', 'Estimasi, tidak eksak'],
                ['TreeExplainer ✓', 'Langsung baca struktur pohon tiap cabang', '⚡ Sangat cepat', 'Eksak, 100% akurat'],
              ]}
            />
            <p>Analoginya: KernelExplainer seperti coba-coba kunci satu per satu sampai pintu terbuka. TreeExplainer sudah punya kunci master — langsung masuk.</p>
          </div>
        ),
      },
      {
        q: 'Kenapa nilai SHAP 1.760 baris training disimpan ke Data Warehouse?',
        a: (
          <div className="space-y-2 text-sm text-gray-700">
            <p>Bukan untuk model atau kalibrasi. Murni untuk <strong>halaman Analitik</strong>.</p>
            <p>Kalau tidak disimpan waktu training → halaman Analitik kosong sampai ada cukup pengguna. Dengan menyimpannya waktu training, dashboard langsung punya data dari hari pertama — bisa tampilkan kepentingan fitur per tanaman, distribusi kondisi tanah, dll.</p>
          </div>
        ),
      },
    ],
  },

  {
    title: 'OOD Detection',
    emoji: '🛡️',
    items: [
      {
        q: 'Apa itu Out-of-Distribution (OOD) dan kenapa perlu dideteksi?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>Model dilatih dari data tertentu. Dia hanya "mengenal" kondisi dalam rentang itu. Kalau ada input yang sangat berbeda dari data training, model tidak punya cara untuk bilang "hei, ini aneh."</p>
            <CodeBlock>
              <p className="text-gray-400">// Tanpa OOD detection:</p>
              <p>Input: N=0, P=0, K=0, suhu=0, lembab=0, pH=0, hujan=0</p>
              <p>Output: <span className="text-red-400">"Tanam padi, confidence 87%"</span>  ← tidak masuk akal!</p>
            </CodeBlock>
            <p>OOD detection menambahkan lapisan pertahanan supaya sistem tidak memberikan rekomendasi yang kelihatan meyakinkan padahal inputnya tidak valid.</p>
          </div>
        ),
      },
      {
        q: 'Bagaimana 3 lapis OOD detection bekerja?',
        a: (
          <div className="space-y-2 text-sm text-gray-700">
            <OODLayerDiagram />
            <Callout type="info">contamination=0.05 artinya IsolationForest menganggap ~5% data training (sekitar 110 dari 2200 baris) adalah data paling "aneh" — dan menjadikannya patokan batas anomali.</Callout>
          </div>
        ),
      },
    ],
  },

  {
    title: 'Hasil & Evaluasi',
    emoji: '📊',
    items: [
      {
        q: 'Akurasi 99,32% itu masuk akal atau terlalu bagus?',
        a: (
          <div className="space-y-3 text-sm text-gray-700">
            <p>Untuk dataset ini, masuk akal — tapi ada catatan penting.</p>
            <p>Dataset Kaggle ini <strong>sintetis dan sangat bersih</strong>. 22 tanaman masing-masing punya kondisi ideal yang sangat terpisah satu sama lain. Hampir tidak ada overlap antar kelas.</p>
            <CompareTable
              headers={['Kondisi', 'Ekspektasi akurasi']}
              rows={[
                ['Dataset Kaggle ini (sintetis, bersih)', '~99% — wajar'],
                ['Data lapangan nyata (variabilitas tinggi)', '~75-85% — lebih realistis'],
              ]}
            />
            <p>Itulah salah satu alasan kenapa kalibrasi dan OOD detection penting — supaya sistem tetap jujur dan tidak overconfident meski di kondisi yang lebih kompleks dari data training.</p>
          </div>
        ),
      },
    ],
  },
]

/* ── Accordion item ──────────────────────────────────────────────────────── */

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-2xl overflow-hidden mb-3 transition-all ${open ? 'border-forest-300 shadow-sm' : 'border-gray-200'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-start justify-between px-5 py-4 text-left transition-colors gap-3
          ${open ? 'bg-forest-50' : 'bg-white hover:bg-gray-50'}`}
      >
        <span className={`font-body text-sm font-semibold leading-snug ${open ? 'text-forest-900' : 'text-gray-800'}`}>
          {item.q}
        </span>
        <span className={`shrink-0 mt-0.5 transition-colors ${open ? 'text-forest-600' : 'text-gray-400'}`}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 bg-white border-t border-gray-100">
          {item.a}
        </div>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-px h-6 bg-earth-400" />
          <span className="font-mono text-xs text-earth-600 uppercase tracking-widest">Internal Notes</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-forest-950 mb-2">FAQ Sistem CropSage</h1>
        <p className="font-body text-sm text-forest-500">
          Kumpulan pertanyaan dan jawaban tentang cara kerja sistem — dari variabel input sampai OOD detection.
          Ditulis dengan bahasa yang mudah dipahami.
        </p>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2 mt-4">
          {SECTIONS.map(s => (
            <a key={s.title} href={`#${s.title}`}
               className="px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-xs font-body text-forest-700 hover:bg-forest-100 transition-colors">
              {s.emoji} {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {SECTIONS.map(section => (
          <div key={section.title} id={section.title}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <span className="text-lg">{section.emoji}</span>
              <h2 className="font-display text-lg font-bold text-forest-950">{section.title}</h2>
            </div>
            {section.items.map((item, i) => (
              <FAQAccordion key={i} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
