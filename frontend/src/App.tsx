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
import { JobDetail } from './pages/JobDetail'
import { Credits } from './pages/Credits'
import { Messages } from './pages/Messages'
import { CookieConsent } from './components/CookieConsent'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
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
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <JobDetail />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credits"
          element={
            <RoleRoute allowedRoles={['provider', 'admin']} fallback="/dashboard">
              <AppShell>
                <Credits />
              </AppShell>
            </RoleRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <AppShell>
                <Messages />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/latelier"
          element={
            <ProtectedRoute>
              <LAtelierPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contrats"
          element={
            <RoleRoute allowedRoles={['provider', 'admin']} fallback="/dashboard">
              <AppShell>
                <Jobs />
              </AppShell>
            </RoleRoute>
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
            <RoleRoute allowedRoles={['client', 'admin']} fallback="/jobs">
              <AppShell>
                <PostJob />
              </AppShell>
            </RoleRoute>
          }
        />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  )
}

export default App