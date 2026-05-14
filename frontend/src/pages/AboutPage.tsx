import { BookOpen, Cpu, Database, GitBranch, Layers, Zap } from 'lucide-react'

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

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-px h-6 bg-earth-400" />
          <span className="font-mono text-xs text-earth-600 uppercase tracking-widest">Dokumentasi Sistem</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-forest-950 mb-3">
          Cara Kerja CropSage
        </h1>
        <p className="font-body text-forest-500 text-lg max-w-2xl">
          Sistem rekomendasi tanaman berbasis Analitik Preskriptif yang menggabungkan Random Forest dengan SHAP untuk menghasilkan saran yang dapat dijelaskan.
        </p>
      </div>

      {/* Architecture flow */}
      <div className="card p-6 mb-8 animate-fade-up animate-delay-100" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-2 mb-5">
          <Layers size={16} className="text-forest-600" />
          <h2 className="font-display text-lg font-semibold text-forest-900">Alur Sistem</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {[
            { label: 'Dataset CSV\n(2200 baris)', bg: 'bg-earth-100 text-earth-800 border-earth-300' },
            { label: '→', bg: 'transparent text-forest-400' },
            { label: 'ETL Pipeline\nSQLite DW', bg: 'bg-forest-100 text-forest-800 border-forest-300' },
            { label: '→', bg: 'transparent text-forest-400' },
            { label: 'Random Forest\nClassifier', bg: 'bg-forest-200 text-forest-900 border-forest-400' },
            { label: '→', bg: 'transparent text-forest-400' },
            { label: 'SHAP\nExplainer', bg: 'bg-earth-200 text-earth-900 border-earth-400' },
            { label: '→', bg: 'transparent text-forest-400' },
            { label: 'FastAPI\nREST API', bg: 'bg-forest-100 text-forest-800 border-forest-300' },
            { label: '→', bg: 'transparent text-forest-400' },
            { label: 'React\nDashboard', bg: 'bg-parchment-200 text-bark-800 border-parchment-400' },
          ].map((step, i) => (
            step.label === '→' ? (
              <span key={i} className="font-display text-xl text-forest-300 font-bold">{step.label}</span>
            ) : (
              <div key={i} className={`px-4 py-3 rounded-xl border text-center text-xs font-mono font-medium whitespace-pre-line ${step.bg}`}>
                {step.label}
              </div>
            )
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Star schema */}
        <div className="card p-6 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-5">
            <Database size={16} className="text-forest-600" />
            <h2 className="font-display text-lg font-semibold text-forest-900">Star Schema Data Warehouse</h2>
          </div>
          <div className="flex flex-col items-center gap-3">
            {/* Fact table center */}
            <div className="bg-forest-700 text-white rounded-xl border-2 border-forest-600 p-3 text-center w-full max-w-xs">
              <div className="font-mono text-xs font-bold mb-1 uppercase tracking-wider text-earth-300">Fact_CropRecommendation</div>
              <div className="font-mono text-xs opacity-80 space-y-0.5">
                <div>fact_id, soil_id, climate_id</div>
                <div>crop_id, time_id</div>
                <div>confidence_score</div>
                <div>shap_n, shap_p, shap_k...</div>
              </div>
            </div>
            {/* Dimension tables */}
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

        {/* Algorithm explanation */}
        <div className="space-y-5">
          <div className="card p-5 animate-slide-right animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch size={16} className="text-forest-600" />
              <h3 className="font-display text-base font-semibold text-forest-900">Random Forest</h3>
            </div>
            <div className="space-y-2 font-body text-sm text-forest-600">
              <p>Ensemble dari 100 decision tree yang dilatih pada berbagai subset data dan fitur secara paralel.</p>
              <div className="bg-forest-50 rounded-xl p-3 font-mono text-xs space-y-1 text-forest-700">
                <p>n_estimators = 100</p>
                <p>random_state = 42</p>
                <p>n_jobs = -1 (semua CPU)</p>
                <p>stratified split = 80/20</p>
              </div>
              <p>Prediksi akhir = voting mayoritas dari semua tree. Probabilitas per kelas = rata-rata vote.</p>
            </div>
          </div>

          <div className="card p-5 animate-slide-right animate-delay-300" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-earth-600" />
              <h3 className="font-display text-base font-semibold text-forest-900">SHAP (Shapley Values)</h3>
            </div>
            <div className="space-y-2 font-body text-sm text-forest-600">
              <p>SHAP mengukur kontribusi setiap fitur terhadap prediksi berdasarkan teori permainan kooperatif.</p>
              <p><strong>TreeExplainer</strong> dioptimalkan untuk tree-based models — jauh lebih cepat dari KernelExplainer.</p>
              <div className="bg-earth-50 rounded-xl p-3 font-mono text-xs text-earth-700 space-y-1">
                <p>φᵢ(f, x) = Σ [|S|!(M-|S|-1)!/M!]</p>
                <p>        × [f(S∪{"{i}"}) - f(S)]</p>
                <p className="text-earth-500 mt-1">// S = subset fitur, M = total fitur</p>
              </div>
              <p>Nilai SHAP positif = fitur mendukung prediksi ini. Negatif = fitur mengurangi keyakinan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="card p-6 animate-fade-up animate-delay-400" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-2 mb-5">
          <Cpu size={16} className="text-forest-600" />
          <h2 className="font-display text-lg font-semibold text-forest-900">Tech Stack</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { layer: 'ML', tech: 'scikit-learn', desc: 'Random Forest Classifier' },
            { layer: 'XAI', tech: 'SHAP', desc: 'TreeExplainer' },
            { layer: 'DW', tech: 'SQLite', desc: 'Star Schema' },
            { layer: 'API', tech: 'FastAPI', desc: 'REST + Pydantic' },
            { layer: 'UI', tech: 'React 18', desc: 'TypeScript + Vite' },
            { layer: 'Style', tech: 'Tailwind CSS', desc: 'Utility-first CSS' },
            { layer: 'Charts', tech: 'Recharts', desc: 'Composable SVG' },
            { layer: 'HTTP', tech: 'Axios', desc: 'Promise-based client' },
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
            { label: 'Total Baris', value: '2.200' },
            { label: 'Fitur', value: '7' },
            { label: 'Kelas Tanaman', value: '22' },
            { label: 'Baris per Kelas', value: '100' },
          ].map(s => (
            <div key={s.label} className="bg-white/60 rounded-xl p-3 text-center">
              <div className="font-display text-2xl font-bold text-earth-800">{s.value}</div>
              <div className="font-body text-xs text-earth-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="font-body text-sm text-earth-700">
          <strong>22 jenis tanaman:</strong> padi, jagung, buncis arab, kacang merah, kacang gude, kacang moth, kacang hijau, kacang hitam, lentil, delima, pisang, mangga, anggur, semangka, melon, apel, jeruk, pepaya, kelapa, kapas, rami, kopi.
        </div>
      </div>
    </div>
  )
}
