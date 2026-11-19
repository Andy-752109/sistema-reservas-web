import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import Footer from './Footer'
import { IconoCalendario } from './Iconos'

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth()

  return (
    <div className="layout">
      <header className="encabezado">
        <Link to="/" className="marca">
          <span className="marca-logo">
            <IconoCalendario />
          </span>
          Sistema de Reservas
        </Link>
        {usuario && (
          <nav aria-label="Navegación de la sesión">
            {/* NavLink agrega la clase "active" al enlace de la página actual. */}
            <NavLink to="/espacios" className="nav-enlace">
              Espacios
            </NavLink>
            <NavLink to="/mis-reservas" className="nav-enlace">
              Mis reservas
            </NavLink>
            <button type="button" className="boton-secundario" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </nav>
        )}
      </header>
      <div className="contenido">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
