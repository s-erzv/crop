import { useState } from 'react'
import { BookOpen, Cpu, Database, GitBranch, Layers, Zap, Shield, Activity, FlaskConical, BarChart2, CheckCircle2, ChevronDown } from 'lucide-react'

const ALGO_COMPARISON = [
  { rank: 1,  name: 'Random Forest (dasar)',             acc: 99.55, prec: 99.57, rec: 99.55, f1: 99.55, time: '0.15s',  ours: false },
  { rank: 2,  name: 'Random Forest + Kalibrasi (KAMI)', acc: 99.32, prec: 99.35, rec: 99.32, f1: 99.32, time: '0.87s',  ours: true  },
  { rank: 3,  name: 'Extra Trees',                       acc: 99.09, prec: 99.15, rec: 99.09, f1: 99.09, time: '0.10s',  ours: false },
  { rank: 3,  name: 'Naive Bayes',                       acc: 99.09, prec: 99.15, rec: 99.09, f1: 99.09, time: '0.00s',  ours: false },
  { rank: 5,  name: 'Gradient Boosting',                 acc: 98.86, prec: 98.97, rec: 98.86, f1: 98.87, time: '11.12s', ours: false },
  { rank: 6,  name: 'LightGBM',                          acc: 98.41, prec: 98.54, rec: 98.41, f1: 98.40, time: '4.27s',  ours: false },
  { rank: 7,  name: 'Decision Tree',                     acc: 98.18, prec: 98.30, rec: 98.18, f1: 98.17, time: '0.02s',  ours: false },
  { rank: 8,  name: 'Logistic Regression',               acc: 95.00, prec: 95.31, rec: 95.00, f1: 95.02, time: '0.60s',  ours: false },
  { rank: 9,  name: 'K-Nearest Neighbors (k=5)',         acc: 92.50, prec: 92.98, rec: 92.50, f1: 92.35, time: '0.00s',  ours: false },
  { rank: 10, name: 'MLP Neural Network',                acc: 92.05, prec: 93.76, rec: 92.05, f1: 91.66, time: '0.54s',  ours: false },
  { rank: 11, name: 'SVM (kernel RBF)',                  acc: 68.18, prec: 66.03, rec: 68.18, f1: 64.64, time: '0.32s',  ours: false },
]

function StarSchemaDiagram() {
  // All coordinates in SVG units (viewBox 0 0 580 420)
  // Draw order: lines first, then boxes on top
  const factCx = 290, factCy = 210
  const dims = [
    { cx: 82,  cy: 75,  title: 'DIM_SOIL',    items: ['soil_id PK', 'nitrogen', 'phosphorus', 'potassium', 'ph'],              x: 10,  y: 15,  w: 145, h: 118, fill: '#f0f7f1', stroke: '#4a8a4d', titleFill: '#2d5e30', itemFill: '#5a7a5d', pkFill: '#2d5e30' },
    { cx: 497, cy: 65,  title: 'DIM_CLIMATE', items: ['climate_id PK', 'temperature', 'humidity', 'rainfall'],                 x: 425, y: 15,  w: 145, h: 100, fill: '#eff6ff', stroke: '#93c5fd', titleFill: '#1e40af', itemFill: '#3b82f6', pkFill: '#1e40af' },
    { cx: 82,  cy: 352, title: 'DIM_CROP',    items: ['crop_id PK', 'label', 'category', 'description'],                      x: 10,  y: 300, w: 145, h: 100, fill: '#fefce8', stroke: '#d97706', titleFill: '#92400e', itemFill: '#b45309', pkFill: '#92400e' },
    { cx: 497, cy: 355, title: 'DIM_TIME',    items: ['time_id PK', 'timestamp', 'date', 'hour', 'day_of_week'],               x: 425, y: 295, w: 145, h: 118, fill: '#faf5ff', stroke: '#a855f7', titleFill: '#6b21a8', itemFill: '#9333ea', pkFill: '#6b21a8' },
  ]

  return (
    <svg viewBox="0 0 580 420" className="w-full" style={{ fontFamily: 'DM Mono, monospace' }}>
      {/* Connecting lines (drawn first, behind boxes) */}
      {dims.map(d => (
        <g key={d.title + '-line'}>
          <line x1={d.cx} y1={d.cy} x2={factCx} y2={factCy}
            stroke="#5a9e5f" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.55" />
          <circle cx={d.cx} cy={d.cy} r="3" fill={d.stroke} opacity="0.6" />
          <circle cx={factCx} cy={factCy} r="3" fill="#6fba74" opacity="0.4" />
        </g>
      ))}

      {/* Fact table (center, dark green) */}
      <rect x="165" y="125" width="250" height="168" rx="10" fill="#2d5e30" stroke="#4a8a4d" strokeWidth="1.5" />
      <text x={factCx} y="145" textAnchor="middle" fill="#d4a574" fontSize="8.5" fontWeight="bold" letterSpacing="0.8">FACT_CROPRECOMMENDATION</text>
      <line x1="172" y1="150" x2="408" y2="150" stroke="#4a8a4d" strokeWidth="0.5" opacity="0.5" />
      {[
        { t: 'fact_id PK',               c: 'rgba(255,255,255,0.9)', b: true  },
        { t: 'soil_id FK',               c: '#d4a574',              b: false },
        { t: 'climate_id FK',            c: '#d4a574',              b: false },
        { t: 'crop_id FK',              c: '#d4a574',              b: false },
        { t: 'time_id FK',               c: '#d4a574',              b: false },
        { t: 'confidence_score',         c: 'rgba(255,255,255,0.7)', b: false },
        { t: 'shap_n … shap_ph_rainfall',c: '#90c8f0',              b: false },
        { t: 'is_training, true_label',  c: 'rgba(255,255,255,0.6)', b: false },
        { t: 'user_feedback',            c: 'rgba(255,255,255,0.6)', b: false },
        { t: 'model_version',            c: 'rgba(255,255,255,0.6)', b: false },
      ].map((row, i) => (
        <text key={row.t} x={factCx} y={161 + i * 13} textAnchor="middle"
          fill={row.c} fontSize="8" fontWeight={row.b ? 'bold' : 'normal'}>
          {row.t}
        </text>
      ))}

      {/* Dimension boxes */}
      {dims.map(d => (
        <g key={d.title}>
          <rect x={d.x} y={d.y} width={d.w} height={d.h} rx="8" fill={d.fill} stroke={d.stroke} strokeWidth="1.5" />
          <text x={d.cx} y={d.y + 18} textAnchor="middle" fill={d.titleFill} fontSize="8.5" fontWeight="bold" letterSpacing="0.5">
            {d.title}
          </text>
          <line x1={d.x + 6} y1={d.y + 23} x2={d.x + d.w - 6} y2={d.y + 23} stroke={d.stroke} strokeWidth="0.5" opacity="0.4" />
          {d.items.map((item, i) => (
            <text key={item} x={d.cx} y={d.y + 35 + i * 14} textAnchor="middle"
              fill={item.includes('PK') ? d.pkFill : d.itemFill}
              fontSize="8.5" fontWeight={item.includes('PK') ? 'bold' : 'normal'}>
              {item}
            </text>
          ))}
        </g>
      ))}
    </svg>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-forest-600">{icon}</span>
      <h2 className="font-display text-lg font-semibold text-forest-900">{title}</h2>
    </div>
  )
}


const TAHAPAN = [
  { step: '01', label: 'Akuisisi Dataset',               tag: 'Data',  tagColor: 'bg-earth-100 text-earth-700',   desc: 'Mengunduh Crop Recommendation Dataset dari Kaggle — 2.200 baris, 7 fitur numerik, 22 kelas tanaman dengan distribusi seimbang (100 sampel per kelas).' },
  { step: '02', label: 'Rekayasa Fitur',                  tag: 'ML',    tagColor: 'bg-purple-100 text-purple-700', desc: 'Menambah 3 fitur turunan: N/P ratio, N/K ratio, dan pH×Curah Hujan. Total menjadi 10 fitur. Menghitung statistik P1–P99 per fitur untuk OOD detection.' },
  { step: '03', label: 'Desain Data Warehouse',           tag: 'DW',    tagColor: 'bg-blue-100 text-blue-700',     desc: 'Merancang Star Schema (metodologi Kimball): 1 tabel fakta + 4 tabel dimensi. Membuat pipeline ETL yang menyimpan data ke SQLite termasuk 10 kolom SHAP.' },
  { step: '04', label: 'Pelatihan Dua Model RF',          tag: 'ML',    tagColor: 'bg-purple-100 text-purple-700', desc: 'Melatih Base RF untuk SHAP (TreeExplainer hanya kompatibel dengan model pohon dasar), dan Calibrated RF (Platt Scaling, cv=5) untuk skor kepercayaan yang realistis. Split stratifikasi 80:20.' },
  { step: '05', label: 'Komputasi SHAP & ETL ke DW',     tag: 'SHAP',  tagColor: 'bg-forest-100 text-forest-700', desc: 'Menghitung nilai SHAP untuk seluruh 1.760 sampel latih menggunakan TreeExplainer. Menyimpan semua baris beserta nilai SHAP-nya ke Data Warehouse saat training berlangsung.' },
  { step: '06', label: 'Pelatihan OOD Detector',         tag: 'OOD',   tagColor: 'bg-amber-100 text-amber-700',   desc: 'Melatih IsolationForest (contamination=0,05) pada seluruh dataset untuk mendeteksi kombinasi fitur yang anomali. Disimpan bersama artifact model lainnya.' },
  { step: '07', label: 'Pengembangan REST API',           tag: 'API',   tagColor: 'bg-forest-100 text-forest-700', desc: 'Membangun FastAPI dengan endpoint /recommend (prediksi + SHAP + OOD), /analytics, /history, /feature-importance, dan /feedback. Semua response tersimpan ke DW.' },
  { step: '08', label: 'Pengembangan Dashboard React',   tag: 'UI',    tagColor: 'bg-parchment-200 text-bark-700',desc: 'Membangun UI dengan 4 halaman: form input, hasil rekomendasi (SHAP waterfall chart), dashboard analitik (riwayat + statistik), dan halaman tentang. Responsif untuk mobile.' },
]

function TahapanAccordion() {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-forest-100 rounded-2xl overflow-hidden animate-fade-up">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-forest-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-forest-500" />
          <span className="font-display text-base font-semibold text-forest-900">Tahapan Pengerjaan Sistem</span>
          <span className="font-body text-xs text-forest-400">— 8 langkah dari dataset ke produksi</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-forest-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-forest-100">
          <div className="space-y-0">
            {TAHAPAN.map((item, i) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-forest-700 text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {item.step}
                  </div>
                  {i < TAHAPAN.length - 1 && <div className="w-px flex-1 bg-forest-100 my-1" />}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-1 mt-1">
                    <span className="font-display text-sm font-semibold text-forest-900">{item.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium ${item.tagColor}`}>{item.tag}</span>
                  </div>
                  <p className="font-body text-sm text-forest-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-px h-6 bg-earth-400" />
          <span className="font-mono text-xs text-earth-600 uppercase tracking-widest">Dokumentasi Sistem</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-950 mb-3">
          Cara Kerja CropSage
        </h1>
        <p className="font-body text-forest-500 text-base sm:text-lg max-w-2xl">
          Sistem Pendukung Keputusan berbasis Analitik Preskriptif yang menggabungkan Random Forest terkalibrasi,
          SHAP explainability, dan deteksi anomali tiga lapis untuk menghasilkan rekomendasi tanaman yang
          akurat dan dapat dijelaskan.
        </p>
      </div>

      {/* Alur Sistem */}
      <div className="card p-6 mb-8 animate-fade-up animate-delay-100" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={<Layers size={16} />} title="Alur Sistem" />
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {[
            { label: 'Dataset CSV',     bg: 'bg-earth-100 text-earth-800 border-earth-300' },
            { label: 'Rekayasa Fitur',  bg: 'bg-purple-100 text-purple-800 border-purple-300' },
            { label: 'Base RF + SHAP',  bg: 'bg-forest-200 text-forest-900 border-forest-400' },
            { label: 'RF Terkalibrasi', bg: 'bg-forest-100 text-forest-800 border-forest-300' },
            { label: 'Deteksi OOD',     bg: 'bg-amber-100 text-amber-800 border-amber-300' },
            { label: 'FastAPI',         bg: 'bg-forest-100 text-forest-800 border-forest-300' },
            { label: 'Dashboard',       bg: 'bg-parchment-200 text-bark-800 border-parchment-400' },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`px-2.5 py-1.5 rounded-lg border text-center font-mono text-xs font-medium ${step.bg}`}>
                {step.label}
              </div>
              {i < arr.length - 1 && (
                <span className="text-forest-300 font-bold text-xs shrink-0">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performa Model */}
      <div className="card p-6 mb-8 animate-fade-up animate-delay-150" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={<BarChart2 size={16} />} title="Performa Model" />

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Akurasi',          value: '99,32%' },
            { label: 'Presisi (Makro)',  value: '99,35%' },
            { label: 'Recall (Makro)',   value: '99,32%' },
            { label: 'F1-Score (Makro)', value: '99,32%' },
          ].map(m => (
            <div key={m.label} className="bg-forest-50 rounded-xl p-4 text-center border border-forest-100">
              <div className="font-display text-2xl font-bold text-forest-800">{m.value}</div>
              <div className="font-body text-xs text-forest-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Algorithm comparison */}
        <div>
          <h3 className="font-display text-sm font-semibold text-forest-700 uppercase tracking-wide mb-3">
            Perbandingan 11 Algoritma
          </h3>
          <p className="font-body text-xs text-forest-500 mb-3">
            Semua algoritma dievaluasi pada split stratifikasi 80:20 yang sama (1.760 latih / 440 uji) dengan 10 fitur.
            RF + Kalibrasi dipilih karena keseimbangan antara akurasi, kepercayaan yang realistis, dan kompatibilitas SHAP TreeExplainer.
          </p>
          <div className="overflow-x-auto rounded-xl border border-forest-100">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="bg-forest-50 border-b border-forest-100">
                  <th className="text-left px-3 py-2.5 font-semibold text-forest-700">#</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-forest-700">Algoritma</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-forest-700">Akurasi</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-forest-700">Presisi</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-forest-700">Recall</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-forest-700">F1</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-forest-700">Waktu Latih</th>
                </tr>
              </thead>
              <tbody>
                {ALGO_COMPARISON.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-forest-50 last:border-0 transition-colors
                      ${row.ours
                        ? 'bg-forest-700 text-white'
                        : 'hover:bg-forest-50/60'
                      }`}
                  >
                    <td className={`px-3 py-2.5 font-mono ${row.ours ? 'text-earth-300' : 'text-forest-400'}`}>
                      {row.rank}
                    </td>
                    <td className={`px-3 py-2.5 font-medium ${row.ours ? 'text-white' : 'text-forest-800'}`}>
                      {row.name}
                      {row.ours && (
                        <span className="ml-2 px-1.5 py-0.5 bg-earth-500/80 text-earth-100 text-xs font-mono rounded">
                          ✦ dipakai
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${row.ours ? 'text-earth-200' : 'text-forest-700'}`}>
                      {row.acc.toFixed(2)}%
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${row.ours ? 'text-earth-200' : 'text-forest-600'}`}>
                      {row.prec.toFixed(2)}%
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${row.ours ? 'text-earth-200' : 'text-forest-600'}`}>
                      {row.rec.toFixed(2)}%
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono font-semibold ${row.ours ? 'text-white' : 'text-forest-800'}`}>
                      {row.f1.toFixed(2)}%
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${row.ours ? 'text-earth-300' : 'text-forest-500'}`}>
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-body text-xs text-forest-400 mt-2">
            * RF dasar lebih tinggi 0,23% akurasi, tetapi dipilih versi terkalibrasi karena menghasilkan skor kepercayaan yang realistis — krusial untuk peringatan prediksi ambigu dan output preskriptif.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Feature Engineering */}
        <div className="card p-5 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<FlaskConical size={16} />} title="Rekayasa Fitur (10 Fitur)" />
          <div className="space-y-3 font-body text-sm text-forest-600">
            <p>Dari 7 fitur asli, sistem menghitung 3 fitur turunan untuk menangkap interaksi antar variabel:</p>
            <div className="bg-forest-50 rounded-xl p-3 font-mono text-xs text-forest-700 space-y-2">
              <div><span className="text-earth-600">N_P_ratio</span>   = N / (P + ε)  <span className="text-forest-400">// keseimbangan vegetatif vs reproduktif</span></div>
              <div><span className="text-earth-600">N_K_ratio</span>   = N / (K + ε)  <span className="text-forest-400">// pertumbuhan vs ketahanan tanaman</span></div>
              <div><span className="text-earth-600">pH_rainfall</span> = ph × rainfall <span className="text-forest-400">// dinamika drainase nutrisi</span></div>
            </div>
            <p>Nilai SHAP dihitung untuk semua 10 fitur, namun grafik hanya menampilkan 7 fitur asli agar lebih mudah diinterpretasi petani.</p>
          </div>
        </div>

        {/* Calibration */}
        <div className="card p-5 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<Activity size={16} />} title="Kalibrasi Probabilitas (Sigmoid/Platt)" />
          <div className="space-y-2 font-body text-sm text-forest-600">
            <p>Random Forest mentah cenderung menghasilkan probabilitas yang terlalu ekstrem (<em>overconfident</em>). Sistem menggunakan <strong>Platt Scaling</strong> dengan validasi silang 5-fold untuk menghasilkan skor kepercayaan yang lebih realistis.</p>
            <div className="bg-forest-50 rounded-xl p-3 font-mono text-xs text-forest-700 space-y-1">
              <p>CalibratedClassifierCV(</p>
              <p className="pl-4">method="sigmoid",  <span className="text-forest-400">// Platt Scaling</span></p>
              <p className="pl-4">cv=5               <span className="text-forest-400">// validasi silang</span></p>
              <p>)</p>
            </div>
            <p>Model SHAP tetap menggunakan Random Forest dasar karena TreeExplainer tidak kompatibel dengan wrapper kalibrasi.</p>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Margin &lt; 20%</strong>: sistem memunculkan peringatan "prediksi ambigu" agar pengguna mempertimbangkan tanaman alternatif.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* OOD Detection */}
        <div className="card p-5 animate-slide-right animate-delay-200" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<Shield size={16} />} title="Deteksi Out-of-Distribution (OOD)" />
          <div className="space-y-2 font-body text-sm text-forest-600">
            <p>Tiga lapisan pemeriksaan untuk mendeteksi input yang tidak biasa atau tidak valid:</p>
            <div className="space-y-2">
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <p className="font-semibold text-red-800 text-xs mb-1">1. Pemeriksaan Input Degenerat</p>
                <p className="text-xs text-red-700">Total N+P+K &lt; 1 → tidak mungkin secara agronomis. Sistem langsung memperingatkan input tidak valid.</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="font-semibold text-amber-800 text-xs mb-1">2. Pemeriksaan Rentang P1–P99</p>
                <p className="text-xs text-amber-700">Setiap fitur diperiksa apakah berada dalam rentang persentil 1–99 dari data latih. Fitur di luar rentang langsung diberi peringatan beserta detailnya.</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="font-semibold text-amber-800 text-xs mb-1">3. Deteksi Anomali IsolationForest</p>
                <p className="text-xs text-amber-700">Mendeteksi kombinasi fitur yang tidak biasa secara keseluruhan, meskipun tiap fitur individu masih dalam rentang normal. contamination=0,05.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SHAP */}
        <div className="card p-5 animate-slide-right animate-delay-300" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<Zap size={16} />} title="SHAP (Nilai Shapley)" />
          <div className="space-y-2 font-body text-sm text-forest-600">
            <p>SHAP mengukur kontribusi setiap fitur terhadap prediksi berdasarkan teori permainan kooperatif.</p>
            <div className="bg-earth-50 rounded-xl p-3 font-mono text-xs text-earth-700 space-y-1">
              <p>φᵢ(f, x) = Σ [|S|!(M-|S|-1)!/M!]</p>
              <p>        × [f(S∪&#123;i&#125;) - f(S)]</p>
              <p className="text-earth-500 mt-1">// S = subset fitur, M = total fitur</p>
            </div>
            <p><strong>TreeExplainer</strong> digunakan pada Random Forest dasar (bukan wrapper terkalibrasi) untuk efisiensi dan keakuratan nilai SHAP.</p>
            <div className="bg-forest-50 rounded-xl p-3 text-xs text-forest-600 space-y-1">
              <p><strong>Kepentingan fitur global (rata-rata |SHAP|):</strong></p>
              {[
                ['Kelembaban',   '0,0321'], ['Kalium (K)',  '0,0235'],
                ['Nitrogen (N)', '0,0227'], ['Fosfor (P)',  '0,0227'],
                ['Curah Hujan',  '0,0209'], ['pH × Hujan', '0,0114'],
              ].map(([name, val]) => (
                <div key={name} className="flex justify-between font-mono">
                  <span>{name}</span><span className="text-forest-800 font-semibold">{val}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-forest-500">
              1.760 sampel latih disimpan ke Data Warehouse beserta nilai SHAP-nya, memungkinkan analitik per-tanaman dari hari pertama.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Star Schema */}
        <div className="card p-6 animate-fade-up animate-delay-300" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<Database size={16} />} title="Data Warehouse — Star Schema" />
          <StarSchemaDiagram />
        </div>

        {/* Two RF Models */}
        <div className="card p-5 animate-slide-right animate-delay-300" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<GitBranch size={16} />} title="Dua Model Random Forest" />
          <div className="space-y-3 font-body text-sm text-forest-600">
            <p>Sistem memisahkan dua model RF dengan peran berbeda:</p>
            <div className="space-y-2">
              <div className="bg-forest-50 rounded-xl p-3 border border-forest-100">
                <p className="font-semibold text-forest-800 text-xs mb-1">base_rf — untuk SHAP</p>
                <p className="text-xs text-forest-600">RandomForestClassifier standar. Digunakan sebagai input TreeExplainer karena SHAP hanya kompatibel dengan model pohon dasar, bukan wrapper kalibrasi.</p>
              </div>
              <div className="bg-forest-50 rounded-xl p-3 border border-forest-100">
                <p className="font-semibold text-forest-800 text-xs mb-1">calib_rf — untuk kepercayaan</p>
                <p className="text-xs text-forest-600">CalibratedClassifierCV (Sigmoid, cv=5). Digunakan untuk menghasilkan skor kepercayaan pada saat prediksi.</p>
              </div>
            </div>
            <div className="bg-forest-50 rounded-xl p-3 font-mono text-xs text-forest-600">
              <p>n_estimators=100, random_state=42</p>
              <p>split stratifikasi 80/20 (1.760 / 440)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card p-6 mb-6 animate-fade-up animate-delay-400" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={<Cpu size={16} />} title="Tumpukan Teknologi" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { layer: 'ML',      tech: 'scikit-learn',    desc: 'RF + CalibratedClassifierCV' },
            { layer: 'XAI',     tech: 'SHAP',            desc: 'TreeExplainer (10 fitur)' },
            { layer: 'OOD',     tech: 'IsolationForest', desc: 'Deteksi anomali + rentang' },
            { layer: 'Gudang',  tech: 'SQLite',          desc: 'Star Schema + user_feedback' },
            { layer: 'API',     tech: 'FastAPI',         desc: 'Async + dokumentasi otomatis' },
            { layer: 'UI',      tech: 'React 18',        desc: 'TypeScript + Vite' },
            { layer: 'Gaya',    tech: 'Tailwind CSS',    desc: 'Utility-first CSS' },
            { layer: 'Grafik',  tech: 'Recharts',        desc: 'SHAP waterfall + bar chart' },
          ].map(s => (
            <div key={s.tech} className="bg-forest-50/60 rounded-xl p-3">
              <div className="font-mono text-xs text-forest-400 uppercase tracking-wide mb-1">{s.layer}</div>
              <div className="font-display text-sm font-semibold text-forest-900">{s.tech}</div>
              <div className="font-body text-xs text-forest-500">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset */}
      <div className="card-earth p-6 mb-6 animate-fade-up animate-delay-500" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-earth-600" />
          <h2 className="font-display text-lg font-semibold text-earth-900">Dataset</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Baris',    value: '2.200' },
            { label: 'Fitur Asli',     value: '7' },
            { label: 'Fitur Total',    value: '10' },
            { label: 'Kelas Tanaman',  value: '22' },
          ].map(s => (
            <div key={s.label} className="bg-white/60 rounded-xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-earth-800">{s.value}</div>
              <div className="font-body text-xs text-earth-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="font-body text-sm text-earth-700 mb-2">
          <strong>22 jenis tanaman:</strong> padi, jagung, buncis arab, kacang merah, kacang gude, kacang moth,
          kacang hijau, kacang hitam, lentil, delima, pisang, mangga, anggur, semangka, melon, apel, jeruk, pepaya, kelapa, kapas, rami, kopi.
        </div>
        <div className="font-body text-xs text-earth-500 mb-3">
          1.760 sampel latih disimpan ke Data Warehouse beserta nilai SHAP-nya saat <code className="font-mono bg-earth-100 px-1 rounded">train.py</code> dijalankan,
          sehingga halaman Analitik langsung memiliki data dari hari pertama tanpa menunggu interaksi pengguna.
        </div>
        <a
          href="https://www.kaggle.com/code/rizal1015/crop-recomendation/input"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-earth-200
                     font-body text-xs text-earth-700 hover:bg-white hover:border-earth-300 transition-colors"
        >
          <BookOpen size={12} />
          Lihat Dataset di Kaggle →
        </a>
      </div>

      {/* Tahapan Pengerjaan — accordion */}
      <TahapanAccordion />

    </div>
  )
}
