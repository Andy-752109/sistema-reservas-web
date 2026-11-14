import { createContext, useContext } from 'react'
import type { Usuario } from './sesion'

export interface DatosRegistro {
  nombre: string
  correo: string
  contrasena: string
}

export interface ValorAuth {
  usuario: Usuario | null
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>
  registrarse: (datos: DatosRegistro) => Promise<void>
  cerrarSesion: () => void
}

export const AuthContext = createContext<ValorAuth | null>(null)

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return valor
}
