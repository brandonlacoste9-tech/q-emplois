import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { CarteContrat } from './components/CarteContrat'
import { SoumissionModal } from './components/SoumissionModal'
import Landing from './pages/Landing'
import { ProDashboard } from './pages/ProDashboard'
import type { Job, ProProfile } from './types/job'
import './App.css'

// IDs alignés avec le seed backend (backend/src/db/seed.ts)
const MOCK_PRO_SANS_RBQ: ProProfile = {
  id: '33333333-3333-3333-3333-333333333301',
  rbq_license: null,
}

const MOCK_PRO_AVEC_RBQ: ProProfile = {
  id: '33333333-3333-3333-3333-333333333302',
  rbq_license: 'RBQ-1234-5678-90',
}

const MOCK_JOBS: Job[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    title_fr: 'Déneigement',
    category: { id: 'cat-1', name_fr: 'Déneigement', requires_rbq: false },
    description: 'Déneigement résidentiel et commercial.',
    location: 'Montréal, H2X',
    client_budget: 45,
    budget_type: 'hourly',
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    title_fr: 'Grand Ménage',
    category: { id: 'cat-2', name_fr: 'Nettoyage', requires_rbq: false },
    location: 'Québec, G1R',
    client_budget: 200,
    budget_type: 'fixed',
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    title_fr: 'Plomberie',
    category: { id: 'cat-3', name_fr: 'Plomberie', requires_rbq: true },
    location: 'Laval, H7V',
    client_budget: 85,
    budget_type: 'hourly',
  },
]

function JobsPage() {
  const [modalJob, setModalJob] = useState<Job | null>(null)
  const [useProWithRbq, setUseProWithRbq] = useState(false)

  const proProfile = useProWithRbq ? MOCK_PRO_AVEC_RBQ : MOCK_PRO_SANS_RBQ

  return (
    <>
      <h1 className="mb-8 text-center text-3xl font-bold text-[#e8e0d4]">
        Q-emplois — Contrats disponibles
      </h1>

      {/* Toggle pour tester RBQ gatekeeper */}
      <div className="mb-6 flex justify-center gap-4">
        <label className="flex items-center gap-2 text-[#a89f8f]">
          <input
            type="checkbox"
            checked={useProWithRbq}
            onChange={(e) => setUseProWithRbq(e.target.checked)}
            className="rounded"
          />
          Pro avec licence RBQ (pour tester)
        </label>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <CarteContrat
          jobTitle="Déneigement"
          pricePerHour={40}
          status="Ouvert"
          location="Montréal, H2X"
          description="Déneigement résidentiel et commercial. Entrée et trottoir."
          onSoumissionner={() => setModalJob(MOCK_JOBS[0])}
        />
        <CarteContrat
          jobTitle="Grand Ménage"
          pricePerHour={35}
          status="Ouvert"
          location="Québec, G1R"
          onSoumissionner={() => setModalJob(MOCK_JOBS[1])}
        />
        <CarteContrat
          jobTitle="Petits Travaux"
          pricePerHour={45}
          status="En cours"
          location="Laval, H7V"
        />
        <CarteContrat
          jobTitle="Plomberie"
          pricePerHour={80}
          status="Ouvert"
          location="Laval, H7V"
          onSoumissionner={() => setModalJob(MOCK_JOBS[2])}
        />
      </div>

      {modalJob && (
        <SoumissionModal
          isOpen={!!modalJob}
          onClose={() => setModalJob(null)}
          job={modalJob}
          proProfile={proProfile}
          apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}
        />
      )}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/contrats"
          element={
            <main className="min-h-screen bg-[#1F2F3F] p-8">
              <nav className="mb-8 flex justify-center gap-6">
                <Link to="/" className="text-[#a89f8f] hover:text-[#e8e0d4] transition-colors">
                  Accueil
                </Link>
                <Link to="/contrats" className="text-[#a89f8f] hover:text-[#e8e0d4] transition-colors">
                  Contrats
                </Link>
                <Link to="/pro" className="text-[#a89f8f] hover:text-[#e8e0d4] transition-colors">
                  Tableau de bord Pro
                </Link>
              </nav>
              <JobsPage />
            </main>
          }
        />
        <Route
          path="/pro"
          element={
            <main className="min-h-screen bg-[#1F2F3F] p-8">
              <nav className="mb-8 flex justify-center gap-6">
                <Link to="/" className="text-[#a89f8f] hover:text-[#e8e0d4] transition-colors">
                  Accueil
                </Link>
                <Link to="/contrats" className="text-[#a89f8f] hover:text-[#e8e0d4] transition-colors">
                  Contrats
                </Link>
                <Link to="/pro" className="text-[#a89f8f] hover:text-[#e8e0d4] transition-colors">
                  Tableau de bord Pro
                </Link>
              </nav>
              <ProDashboard />
            </main>
          }
        />
        <Route path="/login" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
