import { Link, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import Footer from './Footer'

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth()

  return (
    <div className="layout">
      <header className="encabezado">
        <Link to="/" className="marca">
          Sistema de Reservas
        </Link>
        {usuario && (
          <button type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        )}
      </header>
      <div className="contenido">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
