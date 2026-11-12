import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

// Envuelve las rutas que requieren sesión: sin sesión, manda al login y
// recuerda a dónde quería ir el usuario para regresarlo después.
export default function RutaPrivada() {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }
  return <Outlet />
}
