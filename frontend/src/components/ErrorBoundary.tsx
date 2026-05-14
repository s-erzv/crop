import { Component, ErrorInfo, ReactNode } from 'react'

interface Props  { children: ReactNode }
interface State  { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h2 className="font-display text-2xl font-bold text-forest-900 mb-3">
            Terjadi Kesalahan
          </h2>
          <p className="font-body text-forest-600 mb-6">
            Komponen ini mengalami error yang tidak terduga. Coba muat ulang halaman.
          </p>
          {this.state.error && (
            <pre className="font-mono text-xs text-red-600 bg-red-50 border border-red-200
                            rounded-xl p-4 text-left mb-6 overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Muat Ulang Halaman
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
