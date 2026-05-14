import { createContext, useContext, useState, ReactNode } from 'react'

export interface RecommendResult {
  recommended_crop: string
  confidence: number
  calibrated: boolean
  margin: number
  ambiguous: boolean
  alternatives: { crop: string; confidence: number }[]
  shap_values: Record<string, number>
  shap_baseline: number
  explanation: string
  ood_warning: boolean
  ood_details: string
  out_of_range_features: string[]
  anomaly_score: number
  fact_id: number
  model_version: string
  timestamp: string
}

export interface FormValues {
  N: number
  P: number
  K: number
  temperature: number
  humidity: number
  ph: number
  rainfall: number
}

interface ContextType {
  result: RecommendResult | null
  setResult: (r: RecommendResult | null) => void
  formValues: FormValues
  setFormValues: (v: FormValues) => void
}

const Ctx = createContext<ContextType | null>(null)

const DEFAULT_FORM: FormValues = {
  N: 90, P: 42, K: 43,
  temperature: 25, humidity: 70, ph: 6.5, rainfall: 150
}

const STORAGE_KEY      = 'cropsage_last_recommendation'
const EXPIRY_MS        = 60 * 60 * 1000 // 1 hour

function loadFromStorage(): RecommendResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: RecommendResult = JSON.parse(raw)
    const age = Date.now() - new Date(parsed.timestamp).getTime()
    return age < EXPIRY_MS ? parsed : null
  } catch {
    return null
  }
}

export function RecommendationProvider({ children }: { children: ReactNode }) {
  const [result, setResultState] = useState<RecommendResult | null>(loadFromStorage)
  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_FORM)

  const setResult = (r: RecommendResult | null) => {
    setResultState(r)
    if (r) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <Ctx.Provider value={{ result, setResult, formValues, setFormValues }}>
      {children}
    </Ctx.Provider>
  )
}

export function useRecommendation() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRecommendation outside provider')
  return ctx
}

export { STORAGE_KEY }
