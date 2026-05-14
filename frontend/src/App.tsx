import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResultPage from './pages/ResultPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AboutPage from './pages/AboutPage'
import { RecommendationProvider } from './components/RecommendationContext'

export default function App() {
  return (
    <BrowserRouter>
      <RecommendationProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="result" element={<ResultPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Routes>
      </RecommendationProvider>
    </BrowserRouter>
  )
}
