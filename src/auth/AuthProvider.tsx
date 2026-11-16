import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EVENTO_SESION_EXPIRADA, pedir } from '../api/cliente'
import { AuthContext, type DatosRegistro, type ValorAuth } from './AuthContext'
import { borrarToken, guardarToken, leerUsuario, obtenerToken, type Usuario } from './sesion'

function usuarioGuardado(): Usuario | null {
  const token = obtenerToken()
  return token ? leerUsuario(token) : null
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioGuardado)

  // Si la API responde 401 (token vencido o usuario eliminado), se cierra la sesión.
  useEffect(() => {
    const alExpirar = () => setUsuario(null)
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const { access_token } = await pedir<{ access_token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ correo, contrasena }),
    })
    guardarToken(access_token)
    setUsuario(leerUsuario(access_token))
  }, [])

  // El registro solo crea la cuenta (siempre ESTUDIANTE); después se inicia sesión.
  const registrarse = useCallback(
    async (datos: DatosRegistro) => {
      await pedir('/usuarios', { method: 'POST', body: JSON.stringify(datos) })
      await iniciarSesion(datos.correo, datos.contrasena)
    },
    [iniciarSesion],
  )

  const cerrarSesion = useCallback(() => {
    borrarToken()
    setUsuario(null)
  }, [])

  const valor = useMemo<ValorAuth>(
    () => ({ usuario, iniciarSesion, registrarse, cerrarSesion }),
    [usuario, iniciarSesion, registrarse, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
