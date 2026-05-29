import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResultPage from './pages/ResultPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AboutPage from './pages/AboutPage'
import FAQPage from './pages/FAQPage'
import PresentationPage from './pages/PresentationPage'
import { RecommendationProvider } from './components/RecommendationContext'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <BrowserRouter>
      <RecommendationProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
              <Route path="result" element={<ErrorBoundary><ResultPage /></ErrorBoundary>} />
              <Route path="analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
              <Route path="about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
              <Route path="faq" element={<ErrorBoundary><FAQPage /></ErrorBoundary>} />
            </Route>
            {/* Hidden routes — no navbar */}
            <Route path="/presentation" element={<PresentationPage />} />
          </Routes>
        </ErrorBoundary>
      </RecommendationProvider>
    </BrowserRouter>
  )
}
