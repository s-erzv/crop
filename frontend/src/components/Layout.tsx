import { Outlet, NavLink } from 'react-router-dom'
import { Leaf, BarChart2, Info, Sprout } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 glass border-b border-forest-100/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-forest-700 rounded-lg flex items-center justify-center shadow-md group-hover:bg-forest-600 transition-colors">
              <Sprout className="w-4.5 h-4.5 text-parchment-100" size={18} />
            </div>
            <span className="font-display font-bold text-xl text-forest-950">
              Crop<span className="text-earth-500">Sage</span>
            </span>
          </NavLink>

          {/* Nav links */}
          <nav className="flex items-center gap-6">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="flex items-center gap-1.5">
                <Leaf size={14} />
                Rekomendasi
              </span>
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="flex items-center gap-1.5">
                <BarChart2 size={14} />
                Analitik
              </span>
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="flex items-center gap-1.5">
                <Info size={14} />
                Tentang
              </span>
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-forest-100 bg-white/40 py-6 text-center">
        <p className="font-body text-xs text-forest-500">
          CropSage — Sistem Pendukung Keputusan Analitik Preskriptif
          <span className="mx-2">·</span>
          Powered by Random Forest + SHAP
        </p>
      </footer>
    </div>
  )
}
