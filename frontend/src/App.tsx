import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import LandingPageManager from './pages/LandingPageManager'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'
import AIAssistant from './pages/AIAssistant'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Landing from './pages/Landing'
import Platform from './pages/Platform'
import Security from './pages/Security'
import Contact from './pages/Contact'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<PublicLayout />}>
        <Route path="/platform" element={<Platform />} />
        <Route path="/security" element={<Security />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/landing-page" element={<LandingPageManager />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}
