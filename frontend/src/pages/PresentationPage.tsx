import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Sun, Moon, LayoutGrid, X,
  Sprout, Database, GitBranch, ShieldCheck, Zap, Layers, Workflow, FlaskConical,
  Scale, Target, TreePine, BarChart3, Microscope, Boxes, ArrowRight, Server, MonitorSmartphone,
  Languages, RotateCcw,
} from 'lucide-react'

/* ════════════════════════════════════════════════════════════════════════════
   UTIL + THEME
════════════════════════════════════════════════════════════════════════════ */
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/* ── i18n ──────────────────────────────────────────────────────────────────
   CUR_LANG is set synchronously at the top of <PresentationPage> render, so
   every slide closure below reads the active language without needing a hook.
   tr(id, en) → returns the string for the active language. */
type Lang = 'id' | 'en'
let CUR_LANG: Lang = 'id'
const tr = (id: string, en: string) => (CUR_LANG === 'en' ? en : id)

const ThemeCtx = createContext(true)
const useDark = () => useContext(ThemeCtx)
const AnimCtx = createContext(true)

type Tokens = {
  bg: string; ink: string; ink2: string; ink3: string; line: string
  card: string; cardLine: string; dot: string; figPanel: string
}
const DARK: Tokens = {
  bg: '#0a0e16', ink: '#ffffff', ink2: 'rgba(255,255,255,0.66)', ink3: 'rgba(255,255,255,0.42)',
  line: 'rgba(255,255,255,0.1)', card: 'rgba(255,255,255,0.045)', cardLine: 'rgba(255,255,255,0.09)',
  dot: 'rgba(255,255,255,0.05)', figPanel: '#ffffff',
}
const LIGHT: Tokens = {
  bg: '#f5f8f5', ink: '#0a1a0c', ink2: '#314e34', ink3: '#7c9a7f',
  line: '#d2e0d3', card: '#ffffff', cardLine: '#d2e0d3',
  dot: 'rgba(16,94,48,0.07)', figPanel: '#ffffff',
}

const ACC = {
  green:  '#10b981',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  violet: '#8b5cf6',
  rose:   '#f43f5e',
  cyan:   '#06b6d4',
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
════════════════════════════════════════════════════════════════════════════ */
function Grad({ from, to, children, className, style }: { from: string; to: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={{
      display: 'inline-block',
      backgroundImage: `linear-gradient(120deg, ${from}, ${to})`,
      backgroundSize: '100% 100%',
      WebkitBackgroundClip: 'text', backgroundClip: 'text',
      WebkitTextFillColor: 'transparent', color: 'transparent',
      // keeps webkit from dropping the clipped fill while ancestors transform
      WebkitBoxDecorationBreak: 'clone', backfaceVisibility: 'hidden',
      ...style,
    }}>{children}</span>
  )
}

function R({ delay = 0, children, className, style }: { delay?: number; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const on = useContext(AnimCtx)
  return <div className={className} style={{ ...style, animation: on ? `pp-fadeUp .55s cubic-bezier(.22,1,.36,1) ${delay}ms both` : undefined }}>{children}</div>
}

function Counter({ to, decimals = 0, suffix = '' }: { to: number; decimals?: number; suffix?: string }) {
  const on = useContext(AnimCtx)
  const [v, setV] = useState(on ? 0 : to)
  useEffect(() => {
    if (!on) { setV(to); return }
    let raf = 0; const t0 = performance.now(); const dur = 1100
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1); const e = 1 - Math.pow(1 - p, 3)
      setV(to * e); if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line
  const txt = decimals ? v.toFixed(decimals).replace('.', ',') : Math.round(v).toLocaleString('id-ID')
  return <>{txt}{suffix}</>
}

function GrowBar({ w, color, children, className, justify = 'end' }: { w: string; color: string; children?: React.ReactNode; className?: string; justify?: 'start' | 'end' }) {
  const on = useContext(AnimCtx)
  return (
    <div className={`h-6 flex items-center ${justify === 'end' ? 'justify-end' : 'justify-start'} ${className || ''}`}
      style={{ ['--w' as string]: w, width: on ? undefined : w, background: color, borderRadius: 8, animation: on ? 'pp-grow 1s cubic-bezier(.22,1,.36,1) both' : undefined } as React.CSSProperties}>
      {children}
    </div>
  )
}

function Card({ children, tint, className = '', style }: { children: React.ReactNode; tint?: string; className?: string; style?: React.CSSProperties }) {
  const dark = useDark(); const c = dark ? DARK : LIGHT
  const bg = tint ? rgba(tint, dark ? 0.1 : 0.08) : c.card
  const border = tint ? rgba(tint, dark ? 0.28 : 0.32) : c.cardLine
  return (
    <div className={`rounded-2xl p-6 border ${className}`}
      style={{ background: bg, borderColor: border, boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  const c = useDark() ? DARK : LIGHT
  return <p className="font-mono text-[12px] uppercase tracking-[0.18em] mb-2" style={{ color: c.ink3 }}>{children}</p>
}
function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  const c = useDark() ? DARK : LIGHT
  return <p className={`font-body text-[17px] leading-relaxed ${className || ''}`} style={{ color: c.ink2 }}>{children}</p>
}
function Strong({ children, color }: { children: React.ReactNode; color?: string }) {
  const c = useDark() ? DARK : LIGHT
  return <span className="font-semibold" style={{ color: color || c.ink }}>{children}</span>
}
function Mono({ children, color }: { children: React.ReactNode; color?: string }) {
  const dark = useDark(); const c = dark ? DARK : LIGHT
  return <code className="font-mono text-[14px] px-1.5 py-0.5 rounded" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(16,94,48,0.08)', color: color || c.ink2 }}>{children}</code>
}

function DotGrid() {
  const c = useDark() ? DARK : LIGHT
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <pattern id="ppdots" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill={c.dot} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ppdots)" />
    </svg>
  )
}

function Base({ accent, children }: { accent: string; children: React.ReactNode }) {
  const dark = useDark(); const c = dark ? DARK : LIGHT
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col px-20 py-14" style={{ background: c.bg }}>
      <DotGrid />
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${rgba(accent, 0)})` }} />
      <div className="absolute -top-32 right-0 w-[640px] h-[440px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${rgba(accent, dark ? 0.13 : 0.07)}, transparent 70%)` }} />
      <div className="relative z-10 flex flex-col h-full">{children}</div>
    </div>
  )
}

function Kicker({ num, label, accent }: { num: string; label: string; accent: string }) {
  const c = useDark() ? DARK : LIGHT
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-sm font-bold" style={{ color: accent }}>{num}</span>
      <span className="h-4 w-px" style={{ background: c.line }} />
      <span className="font-mono text-sm uppercase tracking-[0.22em]" style={{ color: c.ink3 }}>{label}</span>
    </div>
  )
}

function Title({ accent, children }: { accent: string; children: React.ReactNode }) {
  const c = useDark() ? DARK : LIGHT
  return (
    <h2 className="font-display font-bold leading-[1.05] tracking-tight" style={{ fontSize: 54 }}>
      <Grad from={c.ink} to={accent}>{children}</Grad>
    </h2>
  )
}

function Chip({ children, accent }: { children: React.ReactNode; accent: string }) {
  const dark = useDark()
  return (
    <span className="px-3 py-1.5 rounded-full text-[13px] font-mono"
      style={{ background: rgba(accent, dark ? 0.12 : 0.1), border: `1px solid ${rgba(accent, 0.3)}`, color: accent }}>
      {children}
    </span>
  )
}

function IconBadge({ icon: Icon, accent }: { icon: React.ElementType; accent: string }) {
  const dark = useDark()
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: rgba(accent, dark ? 0.14 : 0.1), border: `1px solid ${rgba(accent, 0.28)}` }}>
      <Icon size={20} color={accent} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   SLIDE-SPECIFIC VISUALS
════════════════════════════════════════════════════════════════════════════ */
function VotingRow({ label, count, color }: { label: string; count: number; color: string }) {
  const c = useDark() ? DARK : LIGHT
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-sm w-20 shrink-0" style={{ color: c.ink3 }}>{label}</span>
      <div className="flex-1 rounded-full h-7 overflow-hidden" style={{ background: c.cardLine }}>
        <GrowBar w={`${count}%`} color={color} className="pr-3"><span className="text-white text-sm font-bold">{count}</span></GrowBar>
      </div>
    </div>
  )
}

function ShapRow({ name, value, max }: { name: string; value: number; max: number }) {
  const c = useDark() ? DARK : LIGHT
  const pos = value >= 0
  const w = `${(Math.abs(value) / max) * 46}%`
  return (
    <div className="flex items-center gap-3 h-7">
      <span className="font-mono text-[13px] w-36 text-right shrink-0" style={{ color: c.ink3 }}>{name}</span>
      <div className="flex-1 flex items-center">
        {pos ? (
          <>
            <div className="w-1/2 h-6 border-r" style={{ borderColor: c.line }} />
            <GrowBar w={w} color={ACC.green} justify="end" className="pr-2"><span className="text-white text-[11px] font-bold">+{value.toFixed(3)}</span></GrowBar>
          </>
        ) : (
          <>
            <div className="w-1/2 h-6 border-r flex justify-end" style={{ borderColor: c.line }}>
              <GrowBar w={w} color={ACC.amber} justify="start" className="pl-2"><span className="text-white text-[11px] font-bold">{value.toFixed(3)}</span></GrowBar>
            </div>
            <div className="w-1/2" />
          </>
        )}
      </div>
    </div>
  )
}

function StarSchemaSVG({ big }: { big?: boolean }) {
  const dark = useDark()
  const dims = [
    { cx: 200, cy: 70,  label: 'SOIL',    fill: dark ? '#0a2010' : '#dcfce7', stroke: dark ? '#86efac' : '#16a34a', tc: dark ? '#86efac' : '#15803d' },
    { cx: 330, cy: 200, label: 'CLIMATE', fill: dark ? '#0a1830' : '#dbeafe', stroke: dark ? '#93c5fd' : '#2563eb', tc: dark ? '#93c5fd' : '#1d4ed8' },
    { cx: 200, cy: 330, label: 'CROP',    fill: dark ? '#2a1a08' : '#fef3c7', stroke: dark ? '#fbbf24' : '#d97706', tc: dark ? '#fbbf24' : '#b45309' },
    { cx: 70,  cy: 200, label: 'TIME',    fill: dark ? '#1a0a30' : '#ede9fe', stroke: dark ? '#c084fc' : '#7c3aed', tc: dark ? '#c084fc' : '#6d28d9' },
  ]
  return (
    <svg viewBox="0 0 400 400" className="w-full" style={{ maxWidth: big ? 460 : 360, filter: dark ? 'drop-shadow(0 0 40px rgba(16,185,129,0.18))' : 'drop-shadow(0 4px 30px rgba(16,94,48,0.12))' }}>
      {[160, 120, 80].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={dark ? rgba('#10b981', 0.05 + i * 0.02) : rgba('#10b981', 0.06)} strokeWidth="1" />
      ))}
      {dims.map((d, i) => (
        <line key={d.label} x1="200" y1="200" x2={d.cx} y2={d.cy} stroke={dark ? rgba('#10b981', 0.3) : rgba('#10b981', 0.25)} strokeWidth="1.5"
          strokeDasharray="160" strokeDashoffset="160" style={{ animation: `pp-draw .7s ease ${300 + i * 120}ms forwards` }} />
      ))}
      <g style={{ animation: 'pp-pop .5s cubic-bezier(.22,1,.36,1) both' }}>
        <circle cx="200" cy="200" r="42" fill={dark ? '#0d2a10' : '#166534'} stroke={ACC.green} strokeWidth="2" />
        <text x="200" y="196" textAnchor="middle" fill={dark ? '#4ade80' : '#dcfce7'} fontSize="11" fontWeight="bold" fontFamily="monospace">FACT</text>
        <text x="200" y="210" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="monospace">CROP</text>
      </g>
      {dims.map((d, i) => (
        <g key={d.label} style={{ animation: `pp-pop .5s cubic-bezier(.22,1,.36,1) ${400 + i * 120}ms both` }}>
          <circle cx={d.cx} cy={d.cy} r="30" fill={d.fill} stroke={d.stroke} strokeWidth="2" />
          <text x={d.cx} y={d.cy + 4} textAnchor="middle" fill={d.tc} fontSize="9.5" fontWeight="bold" fontFamily="monospace">{d.label}</text>
        </g>
      ))}
      {[
        { x: 300, y: 105, v: '+0.032', col: ACC.green },
        { x: 300, y: 295, v: '-0.008', col: ACC.amber },
        { x: 100, y: 105, v: '+0.023', col: ACC.green },
        { x: 100, y: 295, v: '+0.019', col: ACC.green },
      ].map((f, i) => (
        <g key={i} style={{ animation: `pp-fadeIn .6s ease ${900 + i * 120}ms both, pp-float 4s ease-in-out ${i * 400}ms infinite` }}>
          <rect x={f.x - 24} y={f.y - 10} width="48" height="20" rx="10" fill={dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
          <text x={f.x} y={f.y + 4} textAnchor="middle" fill={f.col} fontSize="9.5" fontWeight="bold" fontFamily="monospace">{f.v}</text>
        </g>
      ))}
    </svg>
  )
}

function FigurePanel({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-2xl p-3 border" style={{ background: '#ffffff', borderColor: 'rgba(0,0,0,0.1)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}>
      <img src={src} alt={alt} className="w-full object-contain rounded-lg" style={{ maxHeight: 430 }} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   SLIDE REGISTRY
════════════════════════════════════════════════════════════════════════════ */
type Slide = {
  num: string; label: () => string; title?: () => string; accent: string
  body?: () => React.ReactNode
  full?: () => React.ReactNode
}

const SLIDES: Slide[] = [

  /* 0 — COVER */
  {
    num: '', label: () => 'Cover', accent: ACC.green,
    full: () => {
      const dark = useDark(); const c = dark ? DARK : LIGHT
      const bg = dark
        ? 'radial-gradient(ellipse 90% 80% at 18% 50%, #0d2a14 0%, #070b12 55%, #06090f 100%)'
        : 'radial-gradient(ellipse 90% 80% at 18% 50%, rgba(16,185,129,0.16) 0%, #f4f8f4 55%, #eef3ee 100%)'
      return (
        <div className="w-full h-full relative overflow-hidden grid grid-cols-[1.1fr_0.9fr]" style={{ background: bg }}>
          <DotGrid />
          <div className="relative z-10 flex flex-col justify-center px-20">
            <R delay={0}><div className="flex items-center gap-3 mb-8">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: ACC.green, boxShadow: `0 0 12px ${ACC.green}` }} />
              <span className="font-mono text-sm uppercase tracking-[0.22em]" style={{ color: ACC.green }}>{tr('Tugas Akhir · Sistem Informasi · 2025', 'Undergraduate Thesis · Information Systems · 2025')}</span>
            </div></R>
            <R delay={120}>
              <h1 className="font-display font-bold leading-none tracking-tight mb-7" style={{ fontSize: 116 }}>
                <Grad from={dark ? '#ffffff' : '#0a1a0c'} to={ACC.green}>Crop</Grad><Grad from={ACC.green} to={ACC.amber}>Sage</Grad>
              </h1>
            </R>
            <R delay={240}>
              <p className="text-[20px] leading-relaxed mb-1" style={{ color: c.ink2 }}>{tr('Implementasi ', 'Implementing ')}<Strong>Prescriptive Analytics</Strong>{tr(' pada Data Warehouse', ' on a Data Warehouse')}</p>
              <p className="text-[20px] leading-relaxed mb-1" style={{ color: c.ink2 }}>{tr('untuk Sistem Pendukung Keputusan Rekomendasi Tanaman', 'for a Crop Recommendation Decision Support System')}</p>
              <p className="text-[20px] leading-relaxed" style={{ color: c.ink }}>{tr('Berbasis ', 'Powered by ')}<Strong color={ACC.green}>Calibrated Random Forest</Strong> & <Strong color={ACC.amber}>SHAP</Strong></p>
            </R>
            <R delay={360}><div className="h-px w-14 my-8" style={{ background: ACC.green }} /></R>
            <R delay={420}>
              <p className="font-display text-2xl font-bold" style={{ color: c.ink }}>Sarah Fajriah Rahmah</p>
              <p className="font-mono text-sm mt-1.5" style={{ color: c.ink3 }}>{tr('UIN Syarif Hidayatullah Jakarta', 'UIN Syarif Hidayatullah Jakarta')}</p>
            </R>
            <R delay={520}><div className="flex flex-wrap gap-2 mt-8">
              {['Random Forest', 'Platt Scaling', 'SHAP', 'Star Schema', 'OOD Detection'].map(t => <Chip key={t} accent={dark ? '#9ca3af' : '#6b7280'}>{t}</Chip>)}
            </div></R>
          </div>
          <div className="relative z-10 flex items-center justify-center pr-12">
            <div className="absolute w-[520px] h-[520px] rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${rgba(ACC.green, dark ? 0.22 : 0.12)}, transparent 65%)` }} />
            <StarSchemaSVG big />
          </div>
        </div>
      )
    },
  },

  /* 1 — AGENDA */
  {
    num: '01', label: () => tr('Daftar Isi', 'Contents'), title: () => tr('Pokok Bahasan', 'What We Will Cover'), accent: ACC.green,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      const items = [
        { i: Target, t: tr('Latar Belakang', 'Background'), d: tr('Masalah & tujuan sistem', 'Problem & system goals'), a: ACC.green },
        { i: Layers, t: tr('Tingkatan Analitik', 'Analytics Levels'), d: tr('Predictive → Prescriptive', 'Predictive → Prescriptive'), a: ACC.violet },
        { i: FlaskConical, t: tr('Dataset & Fitur', 'Dataset & Features'), d: tr('7 variabel + 3 turunan', '7 variables + 3 engineered'), a: ACC.blue },
        { i: Workflow, t: tr('Arsitektur Sistem', 'System Architecture'), d: tr('Pipeline end-to-end', 'End-to-end pipeline'), a: ACC.cyan },
        { i: Database, t: tr('Data Warehouse', 'Data Warehouse'), d: tr('Star Schema Kimball', 'Kimball star schema'), a: ACC.blue },
        { i: TreePine, t: tr('Random Forest', 'Random Forest'), d: tr('Voting 100 pohon', 'Voting across 100 trees'), a: ACC.green },
        { i: Scale, t: tr('Dua Model & Kalibrasi', 'Two Models & Calibration'), d: tr('Base RF + Platt Scaling', 'Base RF + Platt scaling'), a: ACC.amber },
        { i: Zap, t: tr('SHAP Explainability', 'SHAP Explainability'), d: tr('Kontribusi tiap fitur', 'Per-feature contribution'), a: ACC.amber },
        { i: ShieldCheck, t: tr('Deteksi OOD', 'OOD Detection'), d: tr('3 lapis pertahanan', '3 defensive layers'), a: ACC.rose },
        { i: BarChart3, t: tr('Hasil Evaluasi', 'Evaluation Results'), d: tr('4 visualisasi performa', '4 performance visuals'), a: ACC.green },
      ]
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-8">
          {items.map((it, idx) => (
            <R key={it.t} delay={idx * 45}>
              <div className="flex items-center gap-4 rounded-xl px-4 py-3 border transition-transform hover:translate-x-1"
                style={{ background: c.card, borderColor: c.cardLine }}>
                <span className="font-mono text-sm font-bold w-6" style={{ color: it.a }}>{String(idx + 1).padStart(2, '0')}</span>
                <IconBadge icon={it.i} accent={it.a} />
                <div>
                  <p className="font-display text-[17px] font-bold" style={{ color: c.ink }}>{it.t}</p>
                  <p className="font-body text-[13px]" style={{ color: c.ink3 }}>{it.d}</p>
                </div>
              </div>
            </R>
          ))}
        </div>
      )
    },
  },

  /* 2 — LATAR BELAKANG */
  {
    num: '02', label: () => tr('Latar Belakang', 'Background'), title: () => tr('Permasalahan yang Diselesaikan', 'The Problem We Solve'), accent: ACC.green,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      const cards = [
        { i: Sprout, a: ACC.amber, t: tr('Keputusan Empiris', 'Decisions by Habit'), d: tr('Petani memilih tanaman dari pengalaman turun-temurun — tanpa mempertimbangkan 7 variabel tanah & iklim secara bersamaan.', 'Farmers pick crops from inherited experience — without weighing all 7 soil & climate variables at once.') },
        { i: Target, a: ACC.blue, t: tr('Prediksi Saja Tidak Cukup', 'Prediction Is Not Enough'), d: tr('Sistem ML berhenti di label tanaman. Tidak ada penjelasan KENAPA dan tidak ada saran tindakan — hanya predictive.', 'Most ML systems stop at a crop label. No reason WHY and no advice on what to do — purely predictive.') },
        { i: Zap, a: ACC.green, t: tr('Tujuan: DSS Preskriptif', 'Goal: A Prescriptive DSS'), d: tr('Menjelaskan alasan + merekomendasikan tindakan: "Tanam padi. Tingkatkan kalium untuk hasil lebih baik."', 'Explain the reason + recommend an action: "Plant rice. Raise potassium for a better yield."') },
        { i: Database, a: ACC.violet, t: tr('Analitik Historis', 'Historical Analytics'), d: tr('Setiap keputusan tersimpan & bisa dianalisis. CSV tidak cukup — butuh Data Warehouse Star Schema.', 'Every decision is stored and analyzable. A CSV is not enough — it needs a star-schema data warehouse.') },
      ]
      return (
        <div className="grid grid-cols-2 gap-5 mt-8">
          {cards.map((x, i) => (
            <R key={x.t} delay={i * 80}>
              <Card tint={x.a} className="h-full">
                <div className="flex items-center gap-3 mb-3"><IconBadge icon={x.i} accent={x.a} />
                  <p className="font-display text-[20px] font-bold" style={{ color: c.ink }}>{x.t}</p></div>
                <Body>{x.d}</Body>
              </Card>
            </R>
          ))}
        </div>
      )
    },
  },

  /* 3 — TINGKATAN ANALITIK */
  {
    num: '03', label: () => tr('Konsep Inti', 'Core Concept'), title: () => tr('Predictive vs Prescriptive', 'Predictive vs Prescriptive'), accent: ACC.violet,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      const steps = [
        { lv: 'Descriptive', q: tr('Apa yang terjadi?', 'What happened?'), a: '#9ca3af', dim: true },
        { lv: 'Diagnostic', q: tr('Kenapa terjadi?', 'Why did it happen?'), a: '#9ca3af', dim: true },
        { lv: 'Predictive', q: tr('Apa yang akan terjadi?', 'What will happen?'), a: ACC.amber, dim: false },
        { lv: 'Prescriptive', q: tr('Apa yang harus dilakukan?', 'What should we do?'), a: ACC.green, dim: false },
      ]
      const chain = [
        { s: 'RF Predict', d: tr('Label tanaman', 'Crop label'), i: TreePine },
        { s: 'SHAP', d: tr('Kontribusi fitur', 'Feature contribution'), i: Zap },
        { s: 'build_explanation()', d: tr('Interpretasi → saran', 'Interpretation → advice'), i: FlaskConical },
        { s: 'Prescriptive', d: tr('"Tanam padi. + K."', '"Plant rice. + K."'), i: Target },
      ]
      return (
        <div className="mt-8">
          <div className="grid grid-cols-4 gap-4 mb-7">
            {steps.map((s, i) => (
              <R key={s.lv} delay={i * 70}>
                <Card tint={s.dim ? undefined : s.a} className={s.dim ? 'opacity-55 h-full' : 'h-full'}>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider mb-3" style={{ color: s.a }}>{s.lv}</p>
                  <p className="font-display text-[18px] font-bold" style={{ color: c.ink }}>{s.q}</p>
                  {!s.dim && i === 3 && <p className="font-body text-[13px] mt-2 italic" style={{ color: c.ink2 }}>{tr('"Tanam padi. Tingkatkan kalium."', '"Plant rice. Raise potassium."')}</p>}
                  {!s.dim && i === 2 && <p className="font-body text-[13px] mt-2 italic" style={{ color: c.ink2 }}>{tr('"Tanaman cocok: padi"', '"Suitable crop: rice"')}</p>}
                </Card>
              </R>
            ))}
          </div>
          <R delay={320}>
            <Card tint={ACC.green}>
              <Label>{tr('Rantai Prescriptive di Sistem Ini', 'The Prescriptive Chain in This System')}</Label>
              <div className="flex items-center gap-3 mt-1">
                {chain.map((x, i) => (
                  <div key={x.s} className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 border flex-1" style={{ background: c.card, borderColor: c.cardLine }}>
                      <IconBadge icon={x.i} accent={ACC.green} />
                      <div><p className="font-mono text-[14px] font-bold" style={{ color: ACC.green }}>{x.s}</p>
                        <p className="font-body text-[12px]" style={{ color: c.ink3 }}>{x.d}</p></div>
                    </div>
                    {i < chain.length - 1 && <ArrowRight size={18} style={{ color: c.ink3 }} className="shrink-0" />}
                  </div>
                ))}
              </div>
            </Card>
          </R>
        </div>
      )
    },
  },

  /* 4 — DATASET & FITUR */
  {
    num: '04', label: () => tr('Data Input', 'Input Data'), title: () => tr('Dataset & 10 Fitur', 'Dataset & 10 Features'), accent: ACC.blue,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      const orig = [
        { k: 'N', n: tr('Nitrogen', 'Nitrogen'), u: 'kg/ha', col: '#10b981' },
        { k: 'P', n: tr('Fosfor', 'Phosphorus'), u: 'kg/ha', col: '#f97316' },
        { k: 'K', n: tr('Kalium', 'Potassium'), u: 'kg/ha', col: '#eab308' },
        { k: 'pH', n: tr('pH Tanah', 'Soil pH'), u: '0–14', col: '#8b5cf6' },
        { k: 'T', n: tr('Suhu', 'Temperature'), u: '°C', col: '#ef4444' },
        { k: 'H', n: tr('Kelembaban', 'Humidity'), u: '%', col: '#06b6d4' },
        { k: 'R', n: tr('Curah Hujan', 'Rainfall'), u: 'mm', col: '#3b82f6' },
      ]
      const stats = [
        { v: 2200, s: '', l: tr('Total Baris', 'Total Rows') },
        { v: 22, s: '', l: tr('Kelas Tanaman', 'Crop Classes') },
        { v: 100, s: '', l: tr('Sampel / Kelas', 'Samples / Class') },
        { v: 10, s: '', l: tr('Fitur Total', 'Total Features') },
      ]
      return (
        <div className="grid grid-cols-2 gap-8 mt-7">
          <div>
            <Label>{tr('7 Fitur Asli (Dataset Kaggle)', '7 Original Features (Kaggle Dataset)')}</Label>
            <div className="grid grid-cols-1 gap-2 mt-1">
              {orig.map((v, i) => (
                <R key={v.k} delay={i * 50}>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2 border" style={{ background: c.card, borderColor: c.cardLine }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: v.col }}>
                      <span className="text-white text-xs font-bold">{v.k}</span></div>
                    <span className="font-body text-[16px] font-semibold flex-1" style={{ color: c.ink }}>{v.n}</span>
                    <span className="font-mono text-[13px]" style={{ color: c.ink3 }}>{v.u}</span>
                  </div>
                </R>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <R delay={120}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {stats.map(s => (
                  <Card key={s.l} tint={ACC.blue}>
                    <p className="font-display text-4xl font-bold" style={{ color: ACC.blue }}><Counter to={s.v} suffix={s.s} /></p>
                    <p className="font-body text-[13px] mt-1" style={{ color: c.ink3 }}>{s.l}</p>
                  </Card>
                ))}
              </div>
            </R>
            <R delay={260}>
              <Card tint={ACC.green} className="flex-1">
                <Label>{tr('+ 3 Fitur Turunan (Feature Engineering)', '+ 3 Engineered Features (Feature Engineering)')}</Label>
                <div className="space-y-2 mt-1">
                  {[['N/P ratio', 'N ÷ (P+ε)'], ['N/K ratio', 'N ÷ (K+ε)'], [tr('pH × Hujan', 'pH × Rain'), 'pH × rainfall']].map(([n, f]) => (
                    <div key={n} className="flex items-center justify-between">
                      <span className="font-display text-[16px] font-bold" style={{ color: ACC.green }}>{n}</span>
                      <Mono>{f}</Mono>
                    </div>
                  ))}
                </div>
                <Body className="mt-3 !text-[14px]">{tr('Split stratifikasi ', 'Stratified split ')}<Strong>80:20</Strong> → <Strong>1.760</Strong> {tr('latih', 'train')}, <Strong>440</Strong> {tr('uji', 'test')}.</Body>
              </Card>
            </R>
          </div>
        </div>
      )
    },
  },

  /* 5 — FEATURE ENGINEERING */
  {
    num: '05', label: () => tr('Feature Engineering', 'Feature Engineering'), title: () => tr('Mengapa Menambah Fitur Turunan?', 'Why Add Engineered Features?'), accent: ACC.cyan,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="grid grid-cols-2 gap-8 mt-7">
          <div className="space-y-4">
            <R><Body>{tr('Random Forest tidak bisa ', 'Random Forest cannot ')}<Strong>{tr('membagi dua fitur', 'divide two features')}</Strong>{tr(' sendiri. Nilai N yang sama bisa berarti kondisi tanah yang sangat berbeda.', ' on its own. The same N value can mean very different soil conditions.')}</Body></R>
            <R delay={100}>
              <Card>
                <Label>{tr('Contoh: dua tanah, N sama persis', 'Example: two soils, identical N')}</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[14px] w-24" style={{ color: c.ink2 }}>{tr('Tanah A', 'Soil A')}</span>
                    <span className="font-mono text-[14px]" style={{ color: c.ink3 }}>N=90, P=10</span>
                    <ArrowRight size={14} style={{ color: c.ink3 }} />
                    <Chip accent={ACC.rose}>N/P = 9.0</Chip>
                    <span className="font-body text-[13px]" style={{ color: c.ink3 }}>{tr('tak seimbang', 'unbalanced')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[14px] w-24" style={{ color: c.ink2 }}>{tr('Tanah B', 'Soil B')}</span>
                    <span className="font-mono text-[14px]" style={{ color: c.ink3 }}>N=90, P=45</span>
                    <ArrowRight size={14} style={{ color: c.ink3 }} />
                    <Chip accent={ACC.green}>N/P = 2.0</Chip>
                    <span className="font-body text-[13px]" style={{ color: c.ink3 }}>{tr('seimbang', 'balanced')}</span>
                  </div>
                </div>
                <Body className="mt-3 !text-[14px]">{tr('Tanpa ratio, model melihat keduanya ', 'Without the ratio, the model sees both as ')}<Strong>{tr('sama', 'identical')}</Strong> (N=90). {tr('Padahal hasilnya beda jauh.', 'Yet their outcomes differ greatly.')}</Body>
              </Card>
            </R>
          </div>
          <div className="space-y-3">
            {[
              { n: 'N/P ratio', f: 'N ÷ (P + ε)', d: tr('Keseimbangan nutrisi vegetatif vs reproduktif tanaman.', 'Balance between vegetative and reproductive nutrition.'), a: ACC.green },
              { n: 'N/K ratio', f: 'N ÷ (K + ε)', d: tr('Keseimbangan pertumbuhan biomassa vs ketahanan terhadap penyakit.', 'Balance between biomass growth and disease resistance.'), a: ACC.blue },
              { n: tr('pH × Hujan', 'pH × Rain'), f: 'pH × rainfall', d: tr('Tanah asam + hujan deras = nutrisi tercuci. pH sama, efek beda tergantung hujan.', 'Acidic soil + heavy rain = leached nutrients. Same pH, different effect depending on rain.'), a: ACC.amber },
            ].map((x, i) => (
              <R key={x.n} delay={150 + i * 90}>
                <Card tint={x.a}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-display text-[18px] font-bold" style={{ color: x.a }}>{x.n}</span>
                    <Mono>{x.f}</Mono>
                  </div>
                  <Body className="!text-[15px]">{x.d}</Body>
                </Card>
              </R>
            ))}
          </div>
        </div>
      )
    },
  },

  /* 6 — ARSITEKTUR SISTEM */
  {
    num: '06', label: () => tr('Arsitektur', 'Architecture'), title: () => tr('Pipeline End-to-End', 'End-to-End Pipeline'), accent: ACC.cyan,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      const flow = [
        { i: FlaskConical, t: tr('Dataset CSV', 'CSV Dataset'), d: tr('2.200 baris', '2,200 rows'), a: ACC.amber },
        { i: Boxes, t: 'Feature Eng.', d: tr('7 → 10 fitur', '7 → 10 features'), a: ACC.violet },
        { i: Database, t: 'Data Warehouse', d: 'Star Schema + ETL', a: ACC.blue },
        { i: TreePine, t: 'Training', d: tr('2 model RF', '2 RF models'), a: ACC.green },
        { i: ShieldCheck, t: tr('Detektor OOD', 'OOD Detector'), d: 'IsolationForest', a: ACC.rose },
        { i: Server, t: 'FastAPI', d: 'REST endpoints', a: ACC.cyan },
        { i: MonitorSmartphone, t: 'Dashboard', d: tr('React + grafik', 'React + charts'), a: ACC.green },
      ]
      return (
        <div className="mt-8">
          <div className="flex items-stretch gap-2 mb-7">
            {flow.map((x, i) => (
              <div key={x.t} className="flex items-center gap-2 flex-1">
                <R delay={i * 70} className="flex-1">
                  <div className="rounded-xl px-3 py-4 border flex flex-col items-center text-center gap-2 h-full" style={{ background: c.card, borderColor: c.cardLine }}>
                    <IconBadge icon={x.i} accent={x.a} />
                    <p className="font-display text-[14px] font-bold leading-tight" style={{ color: c.ink }}>{x.t}</p>
                    <p className="font-mono text-[11px]" style={{ color: c.ink3 }}>{x.d}</p>
                  </div>
                </R>
                {i < flow.length - 1 && <ArrowRight size={16} style={{ color: c.ink3 }} className="shrink-0" />}
              </div>
            ))}
          </div>
          <R delay={560}>
            <Card tint={ACC.green}>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label>{tr('Saat Training', 'During Training')}</Label>
                  <Body className="!text-[15px]">{tr('Dua model RF dilatih. Nilai SHAP dari ', 'Two RF models are trained. SHAP values from ')}<Strong>1.760</Strong>{tr(' sampel langsung di-ETL ke Data Warehouse.', ' samples are ETL-loaded straight into the data warehouse.')}</Body>
                </div>
                <div>
                  <Label>{tr('Saat Prediksi', 'During Prediction')}</Label>
                  <Body className="!text-[15px]">{tr('Setiap input pengguna → OOD check → prediksi → SHAP → ', 'Every user input → OOD check → prediction → SHAP → ')}<Strong>{tr('tersimpan ke DW', 'saved to the DW')}</Strong>.</Body>
                </div>
                <div>
                  <Label>{tr('Hasilnya', 'The Payoff')}</Label>
                  <Body className="!text-[15px]">{tr('Dashboard analitik punya data sejak ', 'The analytics dashboard has data from ')}<Strong>{tr('hari pertama', 'day one')}</Strong>{tr(', tanpa menunggu pengguna.', ', without waiting for users.')}</Body>
                </div>
              </div>
            </Card>
          </R>
        </div>
      )
    },
  },

  /* 7 — DATA WAREHOUSE */
  {
    num: '07', label: () => tr('Data Warehouse', 'Data Warehouse'), title: () => tr('Skema Bintang (Kimball)', 'Star Schema (Kimball)'), accent: ACC.blue,
    body: () => {
      return (
        <div className="grid grid-cols-2 gap-8 mt-6 items-center">
          <div className="space-y-4">
            <R><Body>{tr('Prescriptive analytics butuh ', 'Prescriptive analytics needs ')}<Strong>{tr('data historis', 'historical data')}</Strong>{tr('. Satu tabel fakta di tengah, empat dimensi di sekelilingnya — query analitik cepat tanpa pengulangan data.', '. One fact table in the center, four dimensions around it — fast analytics queries with no duplicated data.')}</Body></R>
            <R delay={100}><Card tint={ACC.green}><Label>{tr('1.760 baris training', '1,760 training rows')}</Label><Body className="!text-[15px]">{tr('Di-ETL ke DW saat ', 'ETL-loaded into the DW when ')}<Mono>train.py</Mono>{tr(' dijalankan.', ' runs.')}</Body></Card></R>
            <R delay={180}><Card tint={ACC.blue}><Label>{tr('Prediksi pengguna', 'User predictions')}</Label><Body className="!text-[15px]">{tr('Otomatis tersimpan setiap "Dapatkan Rekomendasi".', 'Saved automatically on every "Get Recommendation".')}</Body></Card></R>
            <R delay={260}><Body className="!text-[14px]">{tr('Kolom ', 'The ')}<Mono>is_training</Mono>{tr(' membedakan data latih (1) dari prediksi nyata (0).', ' column separates training data (1) from real predictions (0).')}</Body></R>
          </div>
          <R delay={150} className="flex items-center justify-center"><StarSchemaSVG /></R>
        </div>
      )
    },
  },

  /* 8 — RANDOM FOREST */
  {
    num: '08', label: () => tr('Model ML', 'ML Model'), title: () => tr('Random Forest', 'Random Forest'), accent: ACC.green,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="grid grid-cols-2 gap-8 mt-7">
          <div>
            <R><Body>{tr('Bayangkan ', 'Imagine ')}<Strong>{tr('100 dokter', '100 doctors')}</Strong>{tr(' berbeda menilai kondisi tanah yang sama. Suara terbanyak menang.', ' each judging the same soil. The majority vote wins.')}</Body></R>
            <R delay={120}><p className="font-mono text-[13px] my-4" style={{ color: c.ink3 }}>{tr('Input: N=90, P=42, K=43, lembab=82%…', 'Input: N=90, P=42, K=43, humidity=82%…')}</p></R>
            <div className="space-y-3">
              <R delay={200}><VotingRow label={tr('PADI', 'RICE')} count={95} color={ACC.green} /></R>
              <R delay={280}><VotingRow label="JUTE" count={3} color={ACC.amber} /></R>
              <R delay={360}><VotingRow label={tr('KELAPA', 'COCONUT')} count={2} color="#fb923c" /></R>
            </div>
            <R delay={460}><Card tint={ACC.green} className="mt-5">
              <p className="font-mono text-[20px] font-bold" style={{ color: ACC.green }}>Confidence = 95 / 100 = 95%</p>
              <Body className="!text-[14px] mt-1">{tr('Tapi voting selalu terlalu percaya diri — perlu dikalibrasi.', 'But raw voting is always overconfident — it needs calibration.')}</Body>
            </Card></R>
          </div>
          <div>
            <R delay={150}><Label>{tr('Satu pohon keputusan', 'A single decision tree')}</Label>
              <div className="rounded-xl p-5 border font-mono text-[14px] leading-loose mt-1" style={{ background: useDark() ? '#06090f' : '#0f1117', borderColor: 'rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'rgba(255,255,255,0.45)' }}>{tr('Kelembaban', 'Humidity')} &gt; 80%?</p>
                <p style={{ color: 'rgba(255,255,255,0.45)' }} className="pl-4">├─ <span style={{ color: ACC.green }}>{tr('Ya', 'Yes')}</span> → {tr('Suhu', 'Temp')} &gt; 20°C?</p>
                <p style={{ color: 'rgba(255,255,255,0.45)' }} className="pl-9">├─ <span style={{ color: ACC.green }}>{tr('Ya', 'Yes')}</span> → <span className="text-yellow-300 font-bold">{tr('PADI', 'RICE')}</span></p>
                <p style={{ color: 'rgba(255,255,255,0.45)' }} className="pl-9">└─ <span style={{ color: '#f87171' }}>{tr('Tdk', 'No')}</span> → <span className="text-blue-300">JUTE</span></p>
                <p style={{ color: 'rgba(255,255,255,0.45)' }} className="pl-4">└─ <span style={{ color: '#f87171' }}>{tr('Tdk', 'No')}</span> → pH &gt; 6?</p>
                <p style={{ color: 'rgba(255,255,255,0.45)' }} className="pl-9">├─ <span style={{ color: ACC.green }}>{tr('Ya', 'Yes')}</span> → <span className="text-orange-300">{tr('JAGUNG', 'MAIZE')}</span></p>
                <p style={{ color: 'rgba(255,255,255,0.45)' }} className="pl-9">└─ <span style={{ color: '#f87171' }}>{tr('Tdk', 'No')}</span> → <span className="text-pink-300">{tr('KAPAS', 'COTTON')}</span></p>
              </div>
            </R>
            <R delay={320}><Card tint={ACC.amber} className="mt-4"><Label>{tr('Kenapa stabil?', 'Why is it stable?')}</Label>
              <Body className="!text-[15px]">{tr('100 pohon dilatih dari subset data berbeda. Rata-rata banyak pohon jauh lebih akurat & tahan noise dibanding satu pohon.', '100 trees are trained on different data subsets. Averaging many trees is far more accurate and noise-resistant than any single tree.')}</Body></Card></R>
          </div>
        </div>
      )
    },
  },

  /* 9 — DUA MODEL & KALIBRASI */
  {
    num: '09', label: () => tr('Arsitektur Model', 'Model Architecture'), title: () => tr('Dua Model & Kalibrasi', 'Two Models & Calibration'), accent: ACC.amber,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="mt-6">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-5 items-stretch mb-5">
            <R><Card tint={ACC.green} className="h-full">
              <div className="flex items-center gap-3 mb-2"><IconBadge icon={TreePine} accent={ACC.green} />
                <p className="font-display text-[18px] font-bold" style={{ color: c.ink }}>Base RF</p></div>
              <Label>{tr('Untuk SHAP', 'For SHAP')}</Label>
              <Body className="!text-[15px]">{tr('100 pohon murni. TreeExplainer masuk langsung ke struktur pohon → kontribusi fitur eksak.', '100 raw trees. TreeExplainer reads the tree structure directly → exact feature contributions.')}</Body>
            </Card></R>
            <R delay={120} className="flex flex-col items-center justify-center px-2">
              <GitBranch size={28} style={{ color: c.ink3 }} />
              <p className="font-mono text-[11px] text-center mt-2" style={{ color: c.ink3 }}>{tr('input sama', 'same input')}<br />{tr('→ paralel', '→ parallel')}</p>
            </R>
            <R delay={200}><Card tint={ACC.blue} className="h-full">
              <div className="flex items-center gap-3 mb-2"><IconBadge icon={Scale} accent={ACC.blue} />
                <p className="font-display text-[18px] font-bold" style={{ color: c.ink }}>Calibrated RF</p></div>
              <Label>{tr('Untuk Confidence', 'For Confidence')}</Label>
              <Body className="!text-[15px]">{tr('RF + Logistic Regression (Platt Scaling, cv=5) → probabilitas yang jujur & realistis.', 'RF + Logistic Regression (Platt scaling, cv=5) → honest, realistic probabilities.')}</Body>
            </Card></R>
          </div>
          <R delay={320}><Card>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label>{tr('Efek Kalibrasi (validasi 440 data)', 'Calibration Effect (440-sample validation)')}</Label>
                <div className="space-y-1 mt-1">
                  {[['95%', '89%', tr('Kondisi jelas', 'Clear case')], ['85%', '72%', tr('Agak borderline', 'Slightly borderline')], ['71%', '58%', tr('Borderline → ⚠ Ambigu', 'Borderline → ⚠ Ambiguous')]].map(([a, b, l]) => (
                    <div key={l} className="flex items-center gap-4 py-1.5 border-b text-[14px] font-mono" style={{ borderColor: c.line }}>
                      <span className="font-bold w-12" style={{ color: ACC.amber }}>{a}</span>
                      <ArrowRight size={14} style={{ color: c.ink3 }} />
                      <span className="font-bold w-12" style={{ color: ACC.green }}>{b}</span>
                      <span style={{ color: c.ink3 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>{tr('Kenapa tidak digabung?', 'Why not merge them?')}</Label>
                <Body className="!text-[15px]">{tr('TreeExplainer tidak bisa membaca Calibrated RF — ada lapisan Logistic Regression yang menghalanginya. Maka dua model independen wajib.', 'TreeExplainer cannot read a Calibrated RF — the Logistic Regression layer blocks it. So two independent models are required.')}</Body>
                <Body className="!text-[14px] mt-2">{tr('Margin ', 'Margin ')}&lt; 20% → {tr('sistem memunculkan peringatan ', 'the system raises an ')}<Strong color={ACC.amber}>{tr('"prediksi ambigu"', '"ambiguous prediction"')}</Strong>{tr('.', ' warning.')}</Body>
              </div>
            </div>
          </Card></R>
        </div>
      )
    },
  },

  /* 10 — SHAP */
  {
    num: '10', label: () => tr('Explainability', 'Explainability'), title: () => tr('SHAP — Mengapa Padi?', 'SHAP — Why Rice?'), accent: ACC.amber,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="grid grid-cols-2 gap-8 mt-7">
          <div>
            <R><Body>{tr('SHAP merinci ', 'SHAP breaks down the ')}<Strong>{tr('kontribusi tiap fitur', 'contribution of each feature')}</Strong>{tr(' ke prediksi — seperti dosen yang menjelaskan dari mana nilai 85 berasal.', ' to a prediction — like a teacher explaining where a score of 85 came from.')}</Body></R>
            <R delay={120}><Card className="mt-4">
              <Label>{tr('Output untuk prediksi PADI', 'Output for the RICE prediction')}</Label>
              <div className="space-y-2.5 mt-2">
                <ShapRow name={tr('Kelembaban (82%)', 'Humidity (82%)')} value={0.032} max={0.036} />
                <ShapRow name={tr('Nitrogen (90)', 'Nitrogen (90)')} value={0.023} max={0.036} />
                <ShapRow name={tr('Curah Hujan', 'Rainfall')} value={0.019} max={0.036} />
                <ShapRow name={tr('Fosfor (42)', 'Phosphorus (42)')} value={-0.005} max={0.036} />
                <ShapRow name="pH (6.5)" value={-0.008} max={0.036} />
              </div>
              <div className="mt-3 pt-3 border-t font-mono text-[13px] font-bold" style={{ borderColor: c.line, color: ACC.green }}>
                {tr('Baseline 0.045 + kontribusi = 0.106 → PADI ✓', 'Baseline 0.045 + contributions = 0.106 → RICE ✓')}
              </div>
            </Card></R>
          </div>
          <div className="space-y-4">
            <R delay={200}><Card tint={ACC.green}><Label>TreeExplainer vs KernelExplainer</Label>
              <Body className="!text-[15px]"><Strong color={ACC.amber}>Kernel</Strong>{tr(' — universal tapi lambat, estimasi coba-coba. ', ' — universal but slow, trial-and-error estimates. ')}<Strong color={ACC.green}>Tree</Strong>{tr(' — baca struktur pohon langsung, eksak & cepat.', ' — reads the tree structure directly, exact & fast.')}</Body></Card></R>
            <R delay={280}><Card><Label>{tr('SHAP disimpan ke Data Warehouse', 'SHAP is stored in the Data Warehouse')}</Label>
              <Body className="!text-[15px]">{tr('Bukan untuk model — untuk ', 'Not for the model — for the ')}<Strong>{tr('halaman analitik', 'analytics page')}</Strong>{tr('. 1.760 nilai SHAP siap ditampilkan sejak hari pertama.', '. 1,760 SHAP values are ready to display from day one.')}</Body></Card></R>
            <R delay={360}><Card tint={ACC.amber}><Label>{tr('SHAP belum tentu prescriptive', 'SHAP alone is not prescriptive')}</Label>
              <Body className="!text-[15px]">{tr('SHAP hanya memberi angka. ', 'SHAP only gives numbers. ')}<Mono>build_explanation()</Mono>{tr(' yang mengubahnya jadi ', ' turns them into ')}<Strong>{tr('kalimat saran tindakan', 'actionable advice sentences')}</Strong>.</Body></Card></R>
          </div>
        </div>
      )
    },
  },

  /* 11 — OOD */
  {
    num: '11', label: () => tr('Keandalan', 'Reliability'), title: () => tr('Deteksi OOD — 3 Lapis', 'OOD Detection — 3 Layers'), accent: ACC.rose,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="mt-7">
          <R><Body>{tr('Tanpa OOD: input ', 'Without OOD: an input of ')}<Mono>N=0, P=0, K=0</Mono>{tr(' → model tetap bilang "tanam padi, 87% yakin." Tiga lapis ini mencegah rekomendasi menyesatkan.', ' → the model still says "plant rice, 87% sure." These three layers prevent misleading recommendations.')}</Body></R>
          <div className="grid grid-cols-3 gap-5 mt-6">
            {[
              { n: '1', t: 'Degenerate Check', ex: 'N+P+K < 1', d: tr('Tanah produktif tak mungkin nol nutrisi. Cek paling kasar & cepat.', 'Productive soil cannot have zero nutrients. The coarsest, fastest check.'), a: ACC.rose, i: ShieldCheck },
              { n: '2', t: tr('Rentang P1–P99', 'Range P1–P99'), ex: 'rainfall = 400 (max 268)', d: tr('Tiap fitur dicek terhadap rentang persentil 1–99 data training.', 'Each feature is checked against the 1st–99th percentile range of the training data.'), a: ACC.amber, i: Scale },
              { n: '3', t: 'IsolationForest', ex: 'N=140, pH=3.5, rain=290', d: tr('Deteksi kombinasi aneh, meski tiap fitur individu masih normal.', 'Detects odd combinations, even when each feature alone looks normal.'), a: ACC.violet, i: Microscope },
            ].map((l, i) => (
              <R key={l.n} delay={i * 100}>
                <Card tint={l.a} className="h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ background: l.a }}>{l.n}</div>
                    <p className="font-display text-[17px] font-bold" style={{ color: c.ink }}>{l.t}</p>
                  </div>
                  <div className="rounded-lg px-3 py-2 font-mono text-[13px] mb-3" style={{ background: rgba(l.a, 0.12), color: l.a }}>{l.ex}</div>
                  <Body className="!text-[14px]">{l.d}</Body>
                </Card>
              </R>
            ))}
          </div>
          <R delay={380}><Card className="mt-5"><Body className="!text-[15px]"><Mono color={ACC.violet}>contamination=0.05</Mono>{tr(' → IsolationForest menganggap ~5% data training (≈110 dari 2.200) sebagai patokan batas anomali.', ' → IsolationForest treats ~5% of the training data (≈110 of 2,200) as the anomaly boundary reference.')}</Body></Card></R>
        </div>
      )
    },
  },

  /* 12 — CONFUSION MATRIX */
  {
    num: '12', label: () => tr('Hasil Evaluasi', 'Evaluation Results'), title: () => tr('Confusion Matrix', 'Confusion Matrix'), accent: ACC.green,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 mt-6 items-start">
          <R><FigurePanel src="/figures/fig1_confusion_matrix.png" alt="Confusion Matrix" /></R>
          <div className="space-y-4">
            <R delay={120}><Card tint={ACC.green}><Label>{tr('Akurasi keseluruhan', 'Overall accuracy')}</Label>
              <p className="font-display text-5xl font-bold" style={{ color: ACC.green }}><Counter to={99.32} decimals={2} suffix="%" /></p>
              <Body className="!text-[14px] mt-1">{tr('436 dari 440 sampel uji benar — hanya ', '436 of 440 test samples correct — only ')}<Strong>{tr('4 kesalahan', '4 errors')}</Strong>.</Body></Card></R>
            <R delay={220}><Card tint={ACC.amber}><Label>{tr('4 Kesalahan Prediksi', '4 Misclassifications')}</Label>
              <div className="font-mono text-[14px] space-y-1 mt-1" style={{ color: c.ink2 }}>
                {['blackgram → maize', 'lentil → mothbeans', 'maize → blackgram', 'rice → jute'].map(e => <p key={e}>{e}</p>)}
              </div></Card></R>
            <R delay={320}><Card><Label>{tr('Kenapa wajar?', 'Why is this reasonable?')}</Label>
              <Body className="!text-[14px]">{tr('Tanaman yang tertukar punya kondisi tanah & iklim mirip — refleksi dataset sintetis dengan variansi rendah.', 'The swapped crops have similar soil & climate conditions — a reflection of a synthetic, low-variance dataset.')}</Body></Card></R>
          </div>
        </div>
      )
    },
  },

  /* 13 — SHAP IMPORTANCE */
  {
    num: '13', label: () => tr('Hasil Evaluasi', 'Evaluation Results'), title: () => tr('Kepentingan Fitur Global', 'Global Feature Importance'), accent: ACC.amber,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      const rank = [
        [tr('Kelembaban', 'Humidity'), '0.0321', ACC.green], [tr('Kalium (K)', 'Potassium (K)'), '0.0235', ACC.green],
        [tr('Nitrogen (N)', 'Nitrogen (N)'), '0.0227', ACC.green], [tr('Fosfor (P)', 'Phosphorus (P)'), '0.0227', ACC.green],
        [tr('Curah Hujan', 'Rainfall'), '0.0209', ACC.green], [tr('pH × Hujan · turunan', 'pH × Rain · engineered'), '0.0114', ACC.amber],
      ]
      return (
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 mt-6 items-start">
          <R><FigurePanel src="/figures/fig2_shap_importance.png" alt="SHAP Importance" /></R>
          <div className="space-y-3">
            <R delay={120}><Card><Label>{tr('Temuan', 'Finding')}</Label><Body className="!text-[15px]">{tr('Kelembaban paling dominan. Fitur turunan ', 'Humidity dominates. The engineered feature ')}<Strong color={ACC.amber}>{tr('pH×Hujan', 'pH×Rain')}</Strong>{tr(' di posisi ke-6 — rekayasa fitur terbukti bernilai.', ' ranks 6th — proving feature engineering paid off.')}</Body></Card></R>
            <div className="space-y-1.5">
              {rank.map(([n, v, col], i) => (
                <R key={String(n)} delay={200 + i * 50}>
                  <div className="flex items-center justify-between rounded-xl px-4 py-2.5 border" style={{ background: c.card, borderColor: c.cardLine }}>
                    <span className="font-body text-[14px]" style={{ color: c.ink2 }}>{n}</span>
                    <span className="font-mono text-[14px] font-bold" style={{ color: col as string }}>{v}</span>
                  </div>
                </R>
              ))}
            </div>
          </div>
        </div>
      )
    },
  },

  /* 14 — ALGORITHM COMPARISON */
  {
    num: '14', label: () => tr('Hasil Evaluasi', 'Evaluation Results'), title: () => tr('Perbandingan 11 Algoritma', 'Comparison of 11 Algorithms'), accent: ACC.blue,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 mt-6 items-start">
          <R><FigurePanel src="/figures/fig3_algorithm_comparison.png" alt="Algorithm Comparison" /></R>
          <div className="space-y-4">
            <R delay={120}><div className="grid grid-cols-2 gap-3">
              {[[tr('Akurasi', 'Accuracy'), 99.32], [tr('Presisi', 'Precision'), 99.35], ['Recall', 99.32], ['F1-Score', 99.32]].map(([k, v]) => (
                <Card key={String(k)} tint={ACC.green}>
                  <p className="font-display text-3xl font-bold" style={{ color: ACC.green }}><Counter to={v as number} decimals={2} suffix="%" /></p>
                  <p className="font-body text-[13px]" style={{ color: c.ink3 }}>{k}</p>
                </Card>
              ))}
            </div></R>
            <R delay={240}><Card tint={ACC.amber}><Label>{tr('Kenapa bukan RF dasar (99.55%)?', 'Why not base RF (99.55%)?')}</Label>
              <Body className="!text-[14px]">{tr('RF dasar 0.23% lebih tinggi tapi ', 'Base RF is 0.23% higher but ')}<Strong>overconfident</Strong>{tr(' — peringatan ambigu tak pernah muncul. Petani butuh confidence jujur.', ' — the ambiguous warning never fires. Farmers need honest confidence.')}</Body></Card></R>
            <R delay={340}><Card><Label>{tr('SVM cuma 68%?', 'SVM only 68%?')}</Label>
              <Body className="!text-[14px]">{tr('SVM butuh normalisasi fitur. RF tidak — lebih robust untuk data tabular.', 'SVM needs feature scaling. RF does not — it is more robust on tabular data.')}</Body></Card></R>
          </div>
        </div>
      )
    },
  },

  /* 15 — CALIBRATION FIGURE */
  {
    num: '15', label: () => tr('Hasil Evaluasi', 'Evaluation Results'), title: () => tr('Efek Kalibrasi Probabilitas', 'Probability Calibration Effect'), accent: ACC.violet,
    body: () => {
      return (
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 mt-6 items-start">
          <R><FigurePanel src="/figures/fig4_calibration.png" alt="Calibration" /></R>
          <div className="space-y-4">
            <R delay={120}><Card><Label>{tr('Cara membaca', 'How to read it')}</Label><Body className="!text-[15px]">{tr('Garis diagonal = kalibrasi sempurna (confidence = akurasi aktual). Titik di atas garis = terlalu percaya diri.', 'The diagonal = perfect calibration (confidence = actual accuracy). Points above the line = overconfident.')}</Body></Card></R>
            <R delay={220}><Card tint={ACC.amber}><Label>{tr('Base RF (oranye)', 'Base RF (orange)')}</Label><Body className="!text-[15px]">{tr('Jauh di atas garis. Bilang 95% padahal akurasi nyata 71%.', 'Far above the line. Claims 95% when real accuracy is 71%.')}</Body></Card></R>
            <R delay={320}><Card tint={ACC.green}><Label>{tr('RF Terkalibrasi (hijau)', 'Calibrated RF (green)')}</Label><Body className="!text-[15px]">{tr('Mendekati garis. Confidence jujur — model mengakui keraguan di kondisi borderline.', 'Hugs the line. Honest confidence — the model admits doubt in borderline cases.')}</Body></Card></R>
          </div>
        </div>
      )
    },
  },

  /* 16 — KESIMPULAN */
  {
    num: '16', label: () => tr('Penutup', 'Closing'), title: () => tr('Kontribusi & Keterbatasan', 'Contributions & Limitations'), accent: ACC.green,
    body: () => {
      const c = useDark() ? DARK : LIGHT
      return (
        <div className="grid grid-cols-2 gap-8 mt-7">
          <div>
            <Label>{tr('Kontribusi Utama', 'Key Contributions')}</Label>
            <div className="space-y-2.5 mt-2">
              {[
                tr('Data Warehouse + ETL nilai SHAP saat training', 'Data warehouse + SHAP-value ETL during training'),
                tr('Calibrated RF (Platt Scaling) — confidence jujur', 'Calibrated RF (Platt scaling) — honest confidence'),
                tr('Deteksi OOD 3 lapis — tahan input tak valid', '3-layer OOD detection — resilient to invalid input'),
                tr('Output prescriptive penuh — prediksi + saran', 'Fully prescriptive output — prediction + advice'),
                tr('Feature engineering agronomis bermakna', 'Agronomically meaningful feature engineering'),
              ].map((t, i) => (
                <R key={i} delay={i * 70}>
                  <div className="flex gap-3 rounded-xl px-4 py-3 border" style={{ background: c.card, borderColor: c.cardLine }}>
                    <span className="font-mono text-sm font-bold shrink-0" style={{ color: ACC.green }}>{String(i + 1).padStart(2, '0')}</span>
                    <p className="font-body text-[15px]" style={{ color: c.ink2 }}>{t}</p>
                  </div>
                </R>
              ))}
            </div>
          </div>
          <div>
            <Label>{tr('Keterbatasan', 'Limitations')}</Label>
            <div className="space-y-2.5 mt-2">
              {[
                tr('Dataset sintetis — akurasi lapangan ~75–85%', 'Synthetic dataset — field accuracy ~75–85%'),
                tr('Base & Calibrated RF bisa beda di borderline', 'Base & Calibrated RF can disagree on borderline cases'),
                tr('Belum ada retraining otomatis (model drift)', 'No automatic retraining yet (model drift)'),
                tr('Threshold margin 20% perlu evaluasi lapangan', 'The 20% margin threshold needs field evaluation'),
              ].map((t, i) => (
                <R key={i} delay={100 + i * 70}>
                  <div className="flex gap-3 rounded-xl px-4 py-3 border" style={{ background: rgba(ACC.amber, useDark() ? 0.1 : 0.08), borderColor: rgba(ACC.amber, 0.3) }}>
                    <span className="shrink-0" style={{ color: ACC.amber }}>⚠</span>
                    <p className="font-body text-[15px]" style={{ color: c.ink2 }}>{t}</p>
                  </div>
                </R>
              ))}
            </div>
            <R delay={420}><Card className="mt-4"><Body className="!text-[14px]">{tr('Penelitian lanjutan: validasi data lapangan nyata, integrasi sensor IoT real-time, eksplorasi pola musiman.', 'Future work: validation on real field data, real-time IoT sensor integration, exploring seasonal patterns.')}</Body></Card></R>
          </div>
        </div>
      )
    },
  },

  /* 17 — TERIMA KASIH */
  {
    num: '', label: () => tr('Penutup', 'Closing'), accent: ACC.green,
    full: () => {
      const dark = useDark()
      const bg = dark
        ? 'radial-gradient(ellipse 80% 80% at 50% 50%, #0d2a14 0%, #070b12 58%, #06090f 100%)'
        : 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(16,185,129,0.18) 0%, #f4f8f4 56%, #eef3ee 100%)'
      return (
        <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center text-center" style={{ background: bg }}>
          <DotGrid />
          <div className="absolute w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${rgba(ACC.green, dark ? 0.2 : 0.1)}, transparent 65%)` }} />
          <R className="relative z-10">
            <h1 className="font-display font-bold leading-[0.95] tracking-tight">
              <Grad from={dark ? '#ffffff' : '#0a1a0c'} to={ACC.green} style={{ fontSize: 150, display: 'block' }}>{tr('Terima', 'Thank')}</Grad>
              <Grad from={ACC.green} to={ACC.amber} style={{ fontSize: 150, display: 'block' }}>{tr('Kasih', 'You')}</Grad>
            </h1>
          </R>
          <R delay={200} className="relative z-10">
            <div className="flex items-center justify-center gap-4 mt-10">
              <div className="h-px w-16" style={{ background: ACC.green }} />
              <span className="font-mono text-sm uppercase tracking-[0.3em]" style={{ color: ACC.green }}>CropSage · 2025</span>
              <div className="h-px w-16" style={{ background: ACC.green }} />
            </div>
          </R>
        </div>
      )
    },
  },
]

/* ════════════════════════════════════════════════════════════════════════════
   DECK STYLES
════════════════════════════════════════════════════════════════════════════ */
function DeckStyles() {
  return (
    <style>{`
      @keyframes pp-fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
      @keyframes pp-fadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes pp-enterR { from { opacity:0; transform:translateX(64px) scale(.955); filter:blur(7px) } 60% { filter:blur(0) } to { opacity:1; transform:translateX(0) scale(1); filter:blur(0) } }
      @keyframes pp-enterL { from { opacity:0; transform:translateX(-64px) scale(.955); filter:blur(7px) } 60% { filter:blur(0) } to { opacity:1; transform:translateX(0) scale(1); filter:blur(0) } }
      @keyframes pp-exitL  { from { opacity:1; transform:translateX(0) scale(1); filter:blur(0) } to { opacity:0; transform:translateX(-52px) scale(.955); filter:blur(7px) } }
      @keyframes pp-exitR  { from { opacity:1; transform:translateX(0) scale(1); filter:blur(0) } to { opacity:0; transform:translateX(52px) scale(.955); filter:blur(7px) } }
      @keyframes pp-grow   { from { width:0 } to { width:var(--w) } }
      @keyframes pp-draw   { to { stroke-dashoffset:0 } }
      @keyframes pp-pop    { from { opacity:0; transform:scale(.6) } to { opacity:1; transform:scale(1) } }
      @keyframes pp-float  { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-6px) } }
      @keyframes pp-themeWipe { from { opacity:.9 } to { opacity:0 } }
      @keyframes pp-dotPulse  { 0%,100% { transform:scale(1); opacity:.55 } 50% { transform:scale(1.35); opacity:1 } }
      @keyframes pp-spin      { to { transform:rotate(360deg) } }
    `}</style>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════════════ */
const STAGE_W = 1280, STAGE_H = 720

export default function PresentationPage() {
  const [current, setCurrent] = useState(0)
  const [outgoing, setOutgoing] = useState<{ i: number; dir: 1 | -1 } | null>(null)
  const [dark, setDark] = useState(true)
  const [themeTick, setThemeTick] = useState(0)
  const [lang, setLang] = useState<Lang>('id')
  const [overview, setOverview] = useState(false)
  const [isFs, setIsFs] = useState(false)
  const [scale, setScale] = useState(1)
  const [portrait, setPortrait] = useState(false)
  const fitRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()
  const N = SLIDES.length
  const c = dark ? DARK : LIGHT

  CUR_LANG = lang // set synchronously so every slide closure reads the active language

  const toggleTheme = useCallback(() => { setDark(v => !v); setThemeTick(t => t + 1) }, [])
  const toggleLang = useCallback(() => setLang(l => (l === 'id' ? 'en' : 'id')), [])

  // cursor spotlight — tracks pointer over the stage
  useEffect(() => {
    const el = stageRef.current; if (!el) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  const go = useCallback((n: number, dir: 1 | -1) => {
    if (n < 0 || n >= N || n === current) return
    setOutgoing({ i: current, dir })
    setCurrent(n)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOutgoing(null), 520)
  }, [current, N])

  const prev = useCallback(() => go(current - 1, -1), [current, go])
  const next = useCallback(() => go(current + 1, 1), [current, go])

  const toggleFs = useCallback(async () => {
    if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); setIsFs(true) }
    else { await document.exitFullscreen(); setIsFs(false) }
  }, [])

  useEffect(() => {
    const el = fitRef.current; if (!el) return
    const update = () => {
      const r = el.getBoundingClientRect()
      setScale(Math.min(r.width / STAGE_W, r.height / STAGE_H))
      setPortrait(window.innerWidth < 820 && window.innerHeight > window.innerWidth)
    }
    update(); const ro = new ResizeObserver(update); ro.observe(el)
    window.addEventListener('orientationchange', update)
    return () => { ro.disconnect(); window.removeEventListener('orientationchange', update) }
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (overview) { if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') setOverview(false); return }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
      if (e.key === 'f' || e.key === 'F') toggleFs()
      if (e.key === 'd' || e.key === 'D' || e.key === 't' || e.key === 'T') toggleTheme()
      if (e.key === 'l' || e.key === 'L') toggleLang()
      if (e.key === 'o' || e.key === 'O') setOverview(true)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [next, prev, toggleFs, toggleTheme, toggleLang, overview])

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  const renderSlide = (i: number) => {
    const s = SLIDES[i]
    if (s.full) { const Full = s.full; return <Full /> }
    const BodyComp = s.body!
    return (
      <Base accent={s.accent}>
        <R><Kicker num={s.num} label={s.label()} accent={s.accent} /></R>
        <R delay={70} className="mt-3"><Title accent={s.accent}>{s.title!()}</Title></R>
        <div className="flex-1 min-h-0"><BodyComp /></div>
      </Base>
    )
  }

  return (
    <ThemeCtx.Provider value={dark}>
      <DeckStyles />
      <div className="fixed inset-0 flex flex-col" style={{ background: dark ? '#05070c' : '#dfe7df' }}>

        {/* progress — clickable segmented scrubber */}
        <div className="relative h-2 w-full shrink-0 group/bar" style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <div className="h-full transition-all duration-500" style={{ width: `${((current + 1) / N) * 100}%`, background: `linear-gradient(90deg, ${ACC.green}, ${ACC.amber})`, boxShadow: `0 0 10px ${rgba(ACC.green, 0.5)}` }} />
          <div className="absolute inset-0 flex">
            {SLIDES.map((s, i) => (
              <button key={i} onClick={() => go(i, i > current ? 1 : -1)} title={`${s.num || '•'} · ${(s.title || s.label)()}`}
                className="group relative flex-1 h-full cursor-pointer" aria-label={`Slide ${i + 1}`}>
                {i < N - 1 && <span className="absolute inset-y-0 right-0 w-px" style={{ background: dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.55)' }} />}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition" style={{ background: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.16)' }} />
                {i === current && <span className="absolute left-1/2 -translate-x-1/2 -bottom-[3px] w-1.5 h-1.5 rounded-full" style={{ background: ACC.amber, animation: 'pp-dotPulse 2s ease-in-out infinite' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* stage */}
        <div ref={fitRef} className="flex-1 flex items-center justify-center overflow-hidden relative">
          <div ref={stageRef} style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: dark ? '0 30px 90px rgba(0,0,0,0.6)' : '0 30px 90px rgba(0,0,0,0.2)', ['--mx' as string]: '50%', ['--my' as string]: '32%' } as React.CSSProperties}>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {outgoing && (
                <div key={`out-${outgoing.i}`} className="absolute inset-0"
                  style={{ animation: `${outgoing.dir > 0 ? 'pp-exitL' : 'pp-exitR'} .56s cubic-bezier(.65,0,.35,1) both` }}>
                  <AnimCtx.Provider value={false}>{renderSlide(outgoing.i)}</AnimCtx.Provider>
                </div>
              )}
              <div key={`in-${current}`} className="absolute inset-0"
                style={outgoing ? { animation: `${outgoing.dir > 0 ? 'pp-enterR' : 'pp-enterL'} .56s cubic-bezier(.65,0,.35,1) both` } : undefined}>
                <AnimCtx.Provider value={true}>{renderSlide(current)}</AnimCtx.Provider>
              </div>
            </div>
            {/* cursor spotlight — premium depth on hover */}
            <div className="absolute inset-0 pointer-events-none z-20" style={{
              background: `radial-gradient(380px circle at var(--mx) var(--my), ${rgba(SLIDES[current].accent, dark ? 0.12 : 0.07)}, transparent 65%)`,
              mixBlendMode: dark ? 'screen' : 'multiply', transition: 'background .2s',
            }} />
            {/* theme-swap flash — smooth dissolve between light/dark */}
            {themeTick > 0 && (
              <div key={`flash-${themeTick}`} className="absolute inset-0 pointer-events-none z-30"
                style={{ background: dark ? '#06090f' : '#f4f8f4', animation: 'pp-themeWipe .5s cubic-bezier(.4,0,.2,1) both' }} />
            )}
          </div>

          {/* edge nav zones */}
          {current > 0 && (
            <button onClick={prev} className="group absolute left-0 top-0 bottom-0 w-24 flex items-center justify-start pl-4 cursor-pointer" aria-label="prev">
              <span className="opacity-0 group-hover:opacity-100 transition w-10 h-10 rounded-full flex items-center justify-center" style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: c.ink2 }}><ChevronLeft size={20} /></span>
            </button>
          )}
          {current < N - 1 && (
            <button onClick={next} className="group absolute right-0 top-0 bottom-0 w-24 flex items-center justify-end pr-4 cursor-pointer" aria-label="next">
              <span className="opacity-0 group-hover:opacity-100 transition w-10 h-10 rounded-full flex items-center justify-center" style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: c.ink2 }}><ChevronRight size={20} /></span>
            </button>
          )}
        </div>

        {/* controls */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3" style={{ background: dark ? '#0a0e16' : '#1f2937', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)'}` }}>
          <div className="flex items-center gap-3">
            <button onClick={prev} disabled={current === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 disabled:opacity-25 transition" style={{ background: 'rgba(255,255,255,0.05)' }}><ChevronLeft size={14} /> {tr('Sebelum', 'Prev')}</button>
            <button onClick={next} disabled={current === N - 1} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 disabled:opacity-25 transition" style={{ background: 'rgba(255,255,255,0.05)' }}>{tr('Lanjut', 'Next')} <ChevronRight size={14} /></button>
            <span className="font-mono text-sm text-slate-400 ml-2">{String(current + 1).padStart(2, '0')} / {N}</span>
            <span className="font-mono text-xs text-slate-500 hidden md:inline">· {SLIDES[current].label()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold text-slate-300 hover:bg-white/10 transition" style={{ background: 'rgba(255,255,255,0.05)' }} title="Language · L">
              <Languages size={14} /> <span>{lang === 'id' ? 'ID' : 'EN'}</span>
            </button>
            <button onClick={() => setOverview(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition" style={{ background: 'rgba(255,255,255,0.05)' }}><LayoutGrid size={14} /> <span className="hidden md:inline">{tr('Ikhtisar', 'Overview')}</span></button>
            <button onClick={toggleTheme} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition" style={{ background: 'rgba(255,255,255,0.05)' }}>{dark ? <Sun size={14} /> : <Moon size={14} />} <span className="hidden md:inline">{dark ? 'Light' : 'Dark'}</span></button>
            <button onClick={toggleFs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition" style={{ background: 'rgba(255,255,255,0.05)' }}>{isFs ? <Minimize2 size={14} /> : <Maximize2 size={14} />} <span className="hidden md:inline">{isFs ? tr('Keluar', 'Exit') : tr('Layar Penuh', 'Fullscreen')}</span></button>
          </div>
        </div>

        {/* overview */}
        {overview && (
          <div className="fixed inset-0 z-50 flex flex-col p-10 overflow-auto" style={{ background: dark ? 'rgba(5,7,12,0.96)' : 'rgba(240,245,240,0.97)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold" style={{ color: c.ink }}>{tr('Ikhtisar Slide', 'Slide Overview')}</h2>
              <button onClick={() => setOverview(false)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: c.ink }}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {SLIDES.map((s, i) => (
                <button key={i} onClick={() => { setOverview(false); go(i, i > current ? 1 : -1) }}
                  className="text-left rounded-2xl p-5 border transition-transform hover:-translate-y-1"
                  style={{ background: i === current ? rgba(s.accent, dark ? 0.14 : 0.1) : c.card, borderColor: i === current ? s.accent : c.cardLine, boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-bold" style={{ color: s.accent }}>{s.num || '—'}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: c.ink3 }}>{s.label()}</span>
                  </div>
                  <p className="font-display text-[16px] font-bold leading-tight" style={{ color: c.ink }}>{(s.title || s.label)()}</p>
                </button>
              ))}
            </div>
            <p className="font-mono text-xs text-center mt-8" style={{ color: c.ink3 }}>{tr('Tekan O atau Esc untuk menutup · ← → navigasi · F layar penuh · D tema · L bahasa', 'Press O or Esc to close · ← → navigate · F fullscreen · D theme · L language')}</p>
          </div>
        )}

        {/* portrait-mobile rotate hint */}
        {portrait && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center text-center px-10"
            style={{ background: dark ? '#06090f' : '#f4f8f4' }}>
            <div className="relative mb-8" style={{ animation: 'pp-float 2.6s ease-in-out infinite' }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: rgba(ACC.green, 0.14), border: `1px solid ${rgba(ACC.green, 0.35)}` }}>
                <RotateCcw size={36} color={ACC.green} style={{ animation: 'pp-spin 3.5s linear infinite' }} />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: c.ink }}>
              {tr('Putar perangkat Anda', 'Rotate your device')}
            </h2>
            <p className="font-body text-[15px] max-w-xs leading-relaxed" style={{ color: c.ink2 }}>
              {tr('Presentasi ini dirancang untuk mode lanskap. Putar layar agar teks terbaca jelas.',
                  'This deck is built for landscape mode. Turn your screen for crisp, readable text.')}
            </p>
            <div className="flex items-center gap-2 mt-7">
              <button onClick={toggleLang} className="px-4 py-2 rounded-lg font-mono text-sm font-bold" style={{ background: rgba(ACC.green, 0.12), border: `1px solid ${rgba(ACC.green, 0.3)}`, color: ACC.green }}>{lang === 'id' ? 'EN' : 'ID'}</button>
              <button onClick={() => setPortrait(false)} className="px-4 py-2 rounded-lg font-body text-sm" style={{ background: c.card, border: `1px solid ${c.cardLine}`, color: c.ink2 }}>{tr('Lanjutkan saja', 'Continue anyway')}</button>
            </div>
          </div>
        )}
      </div>
    </ThemeCtx.Provider>
  )
}
