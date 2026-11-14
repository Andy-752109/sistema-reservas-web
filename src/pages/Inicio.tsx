import { useAuth } from '../auth/AuthContext'

// Página de inicio provisional: el catálogo de espacios llega en el #36.
export default function Inicio() {
  const { usuario } = useAuth()

  return (
    <main>
      <h1>Sistema de Reservas</h1>
      <p>Sesión iniciada como {usuario?.rol.toLowerCase()}.</p>
      <p>Aquí aparecerá el catálogo de espacios.</p>
    </main>
  )
}
