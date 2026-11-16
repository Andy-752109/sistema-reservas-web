import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'

export default function Inicio() {
  const { usuario } = useAuth()

  return (
    <main>
      <h1>Sistema de Reservas</h1>
      <p>Sesión iniciada como {usuario?.rol.toLowerCase()}.</p>
      <p>
        <Link to="/espacios">Ver los espacios y reservar</Link>
      </p>
    </main>
  )
}
