import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { QBusinessPage } from './pages/QBusinessPage'
import { QJobsPage } from './pages/QJobsPage'
import { CookieConsent } from './components/CookieConsent'
import './styles/cuir-quebecois.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/q-business" element={<QBusinessPage />} />
        <Route path="/q-jobs" element={<QJobsPage />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  )
}

export default App
