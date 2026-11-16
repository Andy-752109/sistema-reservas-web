import { pedir } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import { crearApiReservas } from '../reservas/api-reservas'
import MisReservas from './MisReservas'

const apiReservas = crearApiReservas(pedir)

export default function PaginaMisReservas() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return <MisReservas api={apiReservas} usuarioId={usuario.id} />
}
