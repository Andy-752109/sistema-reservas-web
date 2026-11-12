// Guarda el token de la API en el navegador y lee los datos que trae dentro.
// El JWT de la API trae `sub` (id del usuario), `rol` y `exp` (expiración en segundos).

const CLAVE = 'reservas.token'

export type Rol = 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN'

export interface Usuario {
  id: number
  rol: Rol
}

export function guardarToken(token: string): void {
  localStorage.setItem(CLAVE, token)
}

export function borrarToken(): void {
  localStorage.removeItem(CLAVE)
}

// Devuelve el token solo si sigue vigente; si expiró o no se puede leer, lo borra.
export function obtenerToken(): string | null {
  const token = localStorage.getItem(CLAVE)
  if (!token) return null
  if (!leerUsuario(token)) {
    borrarToken()
    return null
  }
  return token
}

export function leerUsuario(token: string): Usuario | null {
  try {
    const parte = token.split('.')[1]
    if (!parte) return null
    // El JWT usa base64url: se convierte a base64 normal antes de decodificar.
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const datos: unknown = JSON.parse(atob(base64))
    if (
      typeof datos !== 'object' ||
      datos === null ||
      !('sub' in datos) ||
      typeof datos.sub !== 'number' ||
      !('rol' in datos) ||
      typeof datos.rol !== 'string'
    ) {
      return null
    }
    if ('exp' in datos && typeof datos.exp === 'number' && datos.exp * 1000 <= Date.now()) {
      return null
    }
    return { id: datos.sub, rol: datos.rol as Rol }
  } catch {
    return null
  }
}
