import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Kanban from './pages/Kanban'
import Veiculos from './pages/Veiculos'
import Equipe from './pages/Equipe'
import Atividades from './pages/Atividades'
import SocialHub from './pages/SocialHub'
import AdsROI from './pages/AdsROI'

function App() {
  const token = localStorage.getItem('token')
  
  if (!token) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/veiculos" element={<Veiculos />} />
        <Route path="/equipe" element={<Equipe />} />
        <Route path="/atividades" element={<Atividades />} />
        <Route path="/social" element={<SocialHub />} />
        <Route path="/ads" element={<AdsROI />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App