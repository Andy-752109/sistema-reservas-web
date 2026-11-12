import { Navigate, Route, Routes } from 'react-router'
import './App.css'
import AuthProvider from './auth/AuthProvider'
import RutaPrivada from './auth/RutaPrivada'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Registro from './pages/Registro'

// El router (BrowserRouter) se monta en main.tsx; así las pruebas pueden usar MemoryRouter.
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route element={<RutaPrivada />}>
            <Route path="/" element={<Inicio />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
