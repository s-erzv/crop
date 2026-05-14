import { createContext, useContext, useState, ReactNode } from 'react'

export interface RecommendResult {
  recommended_crop: string
  confidence: number
  alternatives: { crop: string; confidence: number }[]
  shap_values: Record<string, number>
  explanation: string
  fact_id: number
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

export function RecommendationProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<RecommendResult | null>(null)
  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_FORM)
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
