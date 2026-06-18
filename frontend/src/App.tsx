import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { QJobsPage } from './pages/QJobsPage'
import { LAtelierPage } from './pages/LAtelierPage'
import { PortalPage } from './pages/PortalPage'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { RegisterChoose } from './pages/RegisterChoose'
import { RegisterClient } from './pages/RegisterClient'
import { Dashboard } from './pages/Dashboard'
import { Jobs } from './pages/Jobs'
import { Profile } from './pages/Profile'
import { PostJob } from './pages/PostJob'
import { CookieConsent } from './components/CookieConsent'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppNav } from './components/AppNav'
import './styles/cuir-quebecois.css'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="leather" style={{ minHeight: '100vh' }}>
      <AppNav />
      {children}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/q-jobs" element={<QJobsPage />} />
        <Route path="/latelier" element={<LAtelierPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterChoose />} />
        <Route path="/register/client" element={<RegisterClient />} />
        <Route path="/register/tasker" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <AppShell>
                <Jobs />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contrats"
          element={
            <ProtectedRoute>
              <AppShell>
                <Jobs />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/pro" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/post-job"
          element={
            <ProtectedRoute>
              <AppShell>
                <PostJob />
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  )
}

export default App