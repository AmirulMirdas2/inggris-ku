import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import { Masuk, Daftar, LupaPassword } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import Review from './pages/Review'
import Corrections from './pages/Corrections'
import Progress from './pages/Progress'
import Vocabulary from './pages/Vocabulary'
import Tenses from './pages/Tenses'
import TenseLesson from './pages/TenseLesson'
import Settings from './pages/Settings'
import { useAuth } from './store/auth'

export default function App() {
  const init = useAuth((s) => s.init)
  useEffect(init, [init])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/masuk" element={<Masuk />} />
      <Route path="/daftar" element={<Daftar />} />
      <Route path="/lupa-password" element={<LupaPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/belajar" element={<Learn />} />
        <Route path="/review" element={<Review />} />
        <Route path="/koreksi" element={<Corrections />} />
        <Route path="/kosakata" element={<Vocabulary />} />
        <Route path="/tense" element={<Tenses />} />
        <Route path="/tense/:key" element={<TenseLesson />} />
        <Route path="/progres" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
