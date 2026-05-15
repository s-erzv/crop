import { BookOpen, Cpu, Database, GitBranch, Layers, Zap, Shield, Activity, FlaskConical } from 'lucide-react'

function SchemaNode({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className={`rounded-xl border-2 p-3 ${color} min-w-36`}>
      <div className="font-mono text-xs font-bold mb-2 uppercase tracking-wider">{title}</div>
      {items.map(item => (
        <div key={item} className="font-mono text-xs text-current opacity-75 py-0.5">{item}</div>
      ))}
    </div>
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

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-px h-6 bg-earth-400" />
          <span className="font-mono text-xs text-earth-600 uppercase tracking-widest">Dokumentasi Sistem — v3</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-forest-950 mb-3">
          Cara Kerja CropSage
        </h1>
        <p className="font-body text-forest-500 text-base sm:text-lg max-w-2xl">
          Sistem rekomendasi tanaman berbasis Analitik Preskriptif yang menggabungkan Random Forest
          terkalibrasi, deteksi out-of-distribution, dan SHAP untuk menghasilkan saran yang dapat dijelaskan.
        </p>
      </div>

      {/* Architecture flow */}
      <div className="card p-6 mb-8 animate-fade-up animate-delay-100" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={<Layers size={16} />} title="Alur Sistem" />
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {[
            { label: 'Dataset CSV\n(2200 baris)', bg: 'bg-earth-100 text-earth-800 border-earth-300' },
            { label: '→', bg: '' },
            { label: 'Feature\nEngineering', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
            { label: '→', bg: '' },
            { label: 'Base RF\n+ SHAP ETL', bg: 'bg-forest-200 text-forest-900 border-forest-400' },
            { label: '→', bg: '' },
            { label: 'Calibrated RF\n(Sigmoid/Platt)', bg: 'bg-forest-100 text-forest-800 border-forest-300' },
            { label: '→', bg: '' },
            { label: 'OOD\nDetector', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
            { label: '→', bg: '' },
            { label: 'FastAPI\nREST API', bg: 'bg-forest-100 text-forest-800 border-forest-300' },
            { label: '→', bg: '' },
            { label: 'React\nDashboard', bg: 'bg-parchment-200 text-bark-800 border-parchment-400' },
          ].map((step, i) => (
            step.label === '→' ? (
              <span key={i} className="font-display text-xl text-forest-300 font-bold">→</span>
            ) : (
              <div key={i} className={`px-4 py-3 rounded-xl border text-center text-xs font-mono font-medium whitespace-pre-line ${step.bg}`}>
                {step.label}
              </div>
            )
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Feature Engineering */}
        <div className="card p-5 animate-fade-up animate-delay-150" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<FlaskConical size={16} />} title="Feature Engineering (10 Fitur)" />
          <div className="space-y-3 font-body text-sm text-forest-600">
            <p>Dari 7 fitur asli, sistem membuat 3 fitur turunan untuk menangkap interaksi antar variabel:</p>
            <div className="bg-forest-50 rounded-xl p-3 font-mono text-xs text-forest-700 space-y-2">
              <div><span className="text-earth-600">N_P_ratio</span>    = N / (P + ε)</div>
              <div><span className="text-earth-600">N_K_ratio</span>    = N / (K + ε)</div>
              <div><span className="text-earth-600">pH_rainfall</span>  = ph × rainfall</div>
            </div>
            <p>Seluruh 10 fitur digunakan untuk training Random Forest dan dihitung nilai SHAP-nya.
               Hanya 7 fitur asli yang ditampilkan di chart untuk kemudahan interpretasi pengguna.</p>
          </div>
        </div>

        {/* Calibration */}
        <div className="card p-5 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<Activity size={16} />} title="Kalibrasi Probabilitas (Sigmoid)" />
          <div className="space-y-2 font-body text-sm text-forest-600">
            <p>Raw Random Forest cenderung menghasilkan probabilitas ekstrem (terlalu yakin).
               Sistem menggunakan <strong>Platt Scaling (Sigmoid)</strong> dengan cross-validation 5-fold untuk menghasilkan confidence yang lebih realistis.</p>
            <div className="bg-forest-50 rounded-xl p-3 font-mono text-xs text-forest-700 space-y-1">
              <p>CalibratedClassifierCV(</p>
              <p className="pl-4">method="sigmoid",  <span className="text-forest-400">// Platt Scaling</span></p>
              <p className="pl-4">cv=5</p>
              <p>)</p>
            </div>
            <p>Model SHAP tetap menggunakan Random Forest dasar (TreeExplainer tidak kompatibel dengan wrapper kalibrasi).</p>
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
            <p>Dua lapisan pemeriksaan untuk input yang tidak biasa:</p>
            <div className="space-y-2">
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="font-semibold text-amber-800 text-xs mb-1">1. Range Check (P1–P99)</p>
                <p className="text-xs text-amber-700">Setiap fitur diperiksa apakah berada dalam rentang persentil 1–99 dari data training. Fitur di luar rentang langsung diberi peringatan.</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="font-semibold text-amber-800 text-xs mb-1">2. IsolationForest Anomaly</p>
                <p className="text-xs text-amber-700">Deteksi kombinasi fitur yang tidak biasa secara keseluruhan, meskipun setiap fitur masih dalam range. contamination=0.05.</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <p className="font-semibold text-red-800 text-xs mb-1">3. Degenerate Input Check</p>
                <p className="text-xs text-red-700">N+P+K total &lt; 1 → input tidak valid secara agronomis (tidak mungkin tanah mengandung hampir nol nutrisi).</p>
              </div>
            </div>
          </div>
        </div>

        {/* SHAP */}
        <div className="card p-5 animate-slide-right animate-delay-300" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<Zap size={16} />} title="SHAP (Shapley Values)" />
          <div className="space-y-2 font-body text-sm text-forest-600">
            <p>SHAP mengukur kontribusi setiap fitur terhadap prediksi berdasarkan teori permainan kooperatif.</p>
            <div className="bg-earth-50 rounded-xl p-3 font-mono text-xs text-earth-700 space-y-1">
              <p>φᵢ(f, x) = Σ [|S|!(M-|S|-1)!/M!]</p>
              <p>        × [f(S∪&#123;i&#125;) - f(S)]</p>
              <p className="text-earth-500 mt-1">// S = subset fitur, M = total fitur</p>
            </div>
            <p><strong>TreeExplainer</strong> digunakan pada base RF (bukan calibrated wrapper) untuk efisiensi dan keakuratan.</p>
            <p className="text-xs text-forest-500">
              <strong>Baseline E[f(x)]</strong>: garis putus-putus oranye di chart SHAP menunjukkan prediksi rata-rata model (expected value), sebagai referensi seberapa jauh setiap fitur mendorong prediksi dari baseline.
            </p>
            <p className="text-xs text-forest-500">
              1760 sampel training di-ETL ke DW beserta nilai SHAP-nya, memungkinkan analitik per-crop dari data historis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Star schema */}
        <div className="card p-6 animate-fade-up animate-delay-300" style={{ animationFillMode: 'forwards' }}>
          <SectionHeader icon={<Database size={16} />} title="Star Schema Data Warehouse" />
          <div className="flex flex-col items-center gap-3">
            <div className="bg-forest-700 text-white rounded-xl border-2 border-forest-600 p-3 text-center w-full max-w-xs">
              <div className="font-mono text-xs font-bold mb-1 uppercase tracking-wider text-earth-300">Fact_CropRecommendation</div>
              <div className="font-mono text-xs opacity-80 space-y-0.5">
                <div>fact_id, soil_id, climate_id, crop_id</div>
                <div>time_id, confidence_score</div>
                <div>shap_n … shap_ph_rainfall (10)</div>
                <div className="text-earth-300">user_feedback, model_version</div>
                <div className="text-earth-300">is_training, true_label</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 w-full">
              <SchemaNode
                title="Dim_Soil"
                items={['soil_id PK', 'nitrogen', 'phosphorus', 'potassium', 'ph']}
                color="border-forest-400 bg-forest-50 text-forest-700"
              />
              <SchemaNode
                title="Dim_Climate"
                items={['climate_id PK', 'temperature', 'humidity', 'rainfall']}
                color="border-blue-300 bg-blue-50 text-blue-700"
              />
              <SchemaNode
                title="Dim_Crop"
                items={['crop_id PK', 'label', 'category', 'description']}
                color="border-earth-400 bg-earth-50 text-earth-700"
              />
              <SchemaNode
                title="Dim_Time"
                items={['time_id PK', 'timestamp', 'date', 'hour', 'day_of_week']}
                color="border-purple-300 bg-purple-50 text-purple-700"
              />
            </div>
          </div>
        </div>

        {/* RF + Feedback */}
        <div className="space-y-4">
          <div className="card p-5 animate-slide-right animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <SectionHeader icon={<GitBranch size={16} />} title="Random Forest (2 Model)" />
            <div className="space-y-2 font-body text-sm text-forest-600">
              <p>Sistem menggunakan dua model RF secara terpisah:</p>
              <div className="bg-forest-50 rounded-xl p-3 font-mono text-xs space-y-1 text-forest-700">
                <p><span className="text-earth-600">base_rf</span>: untuk SHAP (TreeExplainer)</p>
                <p><span className="text-earth-600">calib_rf</span>: untuk confidence (Sigmoid)</p>
                <p className="text-forest-400">n_estimators=100, random_state=42</p>
                <p className="text-forest-400">stratified split 80/20</p>
              </div>
            </div>
          </div>

          <div className="card p-5 animate-slide-right animate-delay-300" style={{ animationFillMode: 'forwards' }}>
            <SectionHeader icon={<Activity size={16} />} title="Feedback & Model Versioning" />
            <div className="space-y-2 font-body text-sm text-forest-600">
              <p>Pengguna dapat memberikan feedback 👍/👎 pada setiap prediksi. Feedback disimpan di kolom <span className="font-mono text-xs bg-forest-50 px-1 rounded">user_feedback</span> pada Fact table.</p>
              <p>Setiap training menghasilkan <span className="font-mono text-xs bg-forest-50 px-1 rounded">model_version</span> (timestamp ISO) yang disimpan bersama setiap prediksi — memungkinkan analisis apakah model lama vs baru menghasilkan distribusi rekomendasi berbeda.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="card p-6 animate-fade-up animate-delay-400" style={{ animationFillMode: 'forwards' }}>
        <SectionHeader icon={<Cpu size={16} />} title="Tech Stack" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { layer: 'ML',     tech: 'scikit-learn',   desc: 'RF + CalibratedClassifierCV' },
            { layer: 'XAI',    tech: 'SHAP',           desc: 'TreeExplainer (10 features)' },
            { layer: 'OOD',    tech: 'IsolationForest',desc: 'Anomaly + range detection' },
            { layer: 'DW',     tech: 'SQLite',         desc: 'Star Schema + user_feedback' },
            { layer: 'API',    tech: 'FastAPI',        desc: 'Async + structured logging' },
            { layer: 'UI',     tech: 'React 18',       desc: 'TypeScript + Vite + ErrorBoundary' },
            { layer: 'Style',  tech: 'Tailwind CSS',   desc: 'Utility-first CSS' },
            { layer: 'Charts', tech: 'Recharts',       desc: 'SHAP waterfall + bar charts' },
          ].map(s => (
            <div key={s.tech} className="bg-forest-50/60 rounded-xl p-3">
              <div className="font-mono text-xs text-forest-400 uppercase tracking-wide mb-1">{s.layer}</div>
              <div className="font-display text-sm font-semibold text-forest-900">{s.tech}</div>
              <div className="font-body text-xs text-forest-500">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset info */}
      <div className="card-earth p-6 mt-6 animate-fade-up animate-delay-500" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-earth-600" />
          <h2 className="font-display text-lg font-semibold text-earth-900">Dataset</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Baris',       value: '2.200' },
            { label: 'Fitur Asli',        value: '7' },
            { label: 'Fitur Total',       value: '10' },
            { label: 'Kelas Tanaman',     value: '22' },
          ].map(s => (
            <div key={s.label} className="bg-white/60 rounded-xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-earth-800">{s.value}</div>
              <div className="font-body text-xs text-earth-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="font-body text-sm text-earth-700">
          <strong>22 jenis tanaman:</strong> padi, jagung, buncis arab, kacang merah, kacang gude, kacang moth,
          kacang hijau, kacang hitam, lentil, delima, pisang, mangga, anggur, semangka, melon, apel, jeruk, pepaya, kelapa, kapas, rami, kopi.
        </div>
        <div className="mt-3 font-body text-xs text-earth-500">
          1760 sampel training disimpan ke Data Warehouse beserta nilai SHAP-nya saat training, sehingga halaman Analitik memiliki data dari hari pertama.
        </div>
      </div>
    </div>
  )
}
