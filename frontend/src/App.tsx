import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { PortalPage } from './pages/PortalPage'
import { QBusinessPage } from './pages/QBusinessPage'
import { CookieConsent } from './components/CookieConsent'
import './styles/cuir-quebecois.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalPage />} />
        <Route path="/q-jobs" element={<LandingPage />} />
        <Route path="/q-business" element={<QBusinessPage />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  )
}

export default App
