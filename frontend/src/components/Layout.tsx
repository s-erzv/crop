import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Leaf, BarChart2, Info, Menu, X } from 'lucide-react'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'active' : ''}`

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 glass border-b border-forest-100/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group" onClick={() => setMenuOpen(false)}>
            <span className="font-display font-bold text-xl text-forest-950">
              Crop<span className="text-earth-500">Sage</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Leaf size={14} />
                Rekomendasi
              </span>
            </NavLink>
            <NavLink to="/analytics" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <BarChart2 size={14} />
                Analitik
              </span>
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Info size={14} />
                Tentang
              </span>
            </NavLink>
          </nav>

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-forest-700 hover:bg-forest-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-forest-100/60 bg-white/90 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
              <NavLink
                to="/" end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3.5 rounded-xl font-body font-medium text-sm transition-colors
                   ${isActive ? 'bg-forest-50 text-forest-900' : 'text-forest-700 hover:bg-forest-50'}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Leaf size={16} />
                Rekomendasi
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3.5 rounded-xl font-body font-medium text-sm transition-colors
                   ${isActive ? 'bg-forest-50 text-forest-900' : 'text-forest-700 hover:bg-forest-50'}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <BarChart2 size={16} />
                Analitik
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3.5 rounded-xl font-body font-medium text-sm transition-colors
                   ${isActive ? 'bg-forest-50 text-forest-900' : 'text-forest-700 hover:bg-forest-50'}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Info size={16} />
                Tentang
              </NavLink>
            </div>
          </nav>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-forest-100 bg-white/40 py-6 text-center px-4">
        <p className="font-body text-xs text-forest-500">
          CropSage — Sistem Pendukung Keputusan Analitik Preskriptif
          <span className="mx-2">·</span>
          Ditenagai Random Forest + SHAP
        </p>
      </footer>
    </div>
  )
}
