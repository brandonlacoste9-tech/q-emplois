import { BrowserRouter } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { CookieConsent } from './components/CookieConsent'
import './styles/cuir-quebecois.css'

function App() {
  return (
    <BrowserRouter>
      <LandingPage />
      <CookieConsent />
    </BrowserRouter>
  )
}

export default App
