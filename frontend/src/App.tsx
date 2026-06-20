import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const QJobsPage = React.lazy(() => import('./pages/QJobsPage').then(m => ({ default: m.QJobsPage })));
const LAtelierPage = React.lazy(() => import('./pages/LAtelierPage').then(m => ({ default: m.LAtelierPage })));
const PortalPage = React.lazy(() => import('./pages/PortalPage').then(m => ({ default: m.PortalPage })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const RegisterChoose = React.lazy(() => import('./pages/RegisterChoose').then(m => ({ default: m.RegisterChoose })));
const RegisterClient = React.lazy(() => import('./pages/RegisterClient').then(m => ({ default: m.RegisterClient })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Jobs = React.lazy(() => import('./pages/Jobs').then(m => ({ default: m.Jobs })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const PostJob = React.lazy(() => import('./pages/PostJob').then(m => ({ default: m.PostJob })));
const BookPage = React.lazy(() => import('./pages/BookPage').then(m => ({ default: m.BookPage })));
const TaskersPage = React.lazy(() => import('./pages/TaskersPage').then(m => ({ default: m.TaskersPage })));
const GarantiePage = React.lazy(() => import('./pages/GarantiePage').then(m => ({ default: m.GarantiePage })));
const RecrutePage = React.lazy(() => import('./pages/RecrutePage').then(m => ({ default: m.RecrutePage })));
const AidePage = React.lazy(() => import('./pages/AidePage').then(m => ({ default: m.AidePage })));
const PolitiqueConfidentialitePage = React.lazy(() => import('./pages/PolitiqueConfidentialitePage').then(m => ({ default: m.PolitiqueConfidentialitePage })));
const TaskerPublicPage = React.lazy(() => import('./pages/TaskerPublicPage').then(m => ({ default: m.TaskerPublicPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const JobDetail = React.lazy(() => import('./pages/JobDetail').then(m => ({ default: m.JobDetail })));
const Credits = React.lazy(() => import('./pages/Credits').then(m => ({ default: m.Credits })));
const Messages = React.lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));
import { CookieConsent } from './components/CookieConsent'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { AppNav } from './components/AppNav'
import { MobileBottomNav } from './components/MobileBottomNav'
import './styles/cuir-quebecois.css'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="leather app-shell-with-bottom-nav" style={{ minHeight: '100vh' }}>
      <AppNav />
      {children}
      <MobileBottomNav />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div className="leather" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p className="body-f muted">Chargement…</p></div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/q-jobs" element={<QJobsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/garantie" element={<GarantiePage />} />
          <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
          <Route path="/tasker/:userId" element={<TaskerPublicPage />} />
          <Route path="/recrute" element={<RecrutePage />} />
          <Route path="/aide" element={<AidePage />} />
          <Route path="/register" element={<RegisterChoose />} />
          <Route path="/register/client" element={<RegisterClient />} />
          <Route path="/register/tasker" element={<Register />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/taskers" element={<TaskersPage />} />
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
              <ProtectedRoute>
                <AppShell>
                  <Credits />
                </AppShell>
              </ProtectedRoute>
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
            path="/admin"
            element={
              <RoleRoute allowedRoles={['admin']} fallback="/dashboard">
                <AppShell>
                  <AdminPage />
                </AppShell>
              </RoleRoute>
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
      </React.Suspense>
      <CookieConsent />
    </BrowserRouter>
  )
}

export default App