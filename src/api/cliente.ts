import { obtenerConfig } from '../config'
import { borrarToken, EVENTO_SESION_EXPIRADA, obtenerToken } from '../auth/sesion'

export { EVENTO_SESION_EXPIRADA }

// Error de la API con el código HTTP y un mensaje listo para mostrar al usuario.
export class ErrorApi extends Error {
  readonly status: number

  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
  }
}

// Hace una petición a la API: agrega la URL base del ambiente, el JSON
// y el encabezado Authorization: Bearer cuando hay sesión.
export async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = obtenerToken()
  const encabezados = new Headers(opciones.headers)
  if (opciones.body !== undefined) encabezados.set('Content-Type', 'application/json')
  if (token) encabezados.set('Authorization', `Bearer ${token}`)

  let respuesta: Response
  try {
    respuesta = await fetch(`${obtenerConfig().apiUrl}${ruta}`, {
      ...opciones,
      headers: encabezados,
    })
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Intenta de nuevo.')
  }

  if (respuesta.status === 401 && token) {
    borrarToken()
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
  }

  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, await leerMensaje(respuesta))
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

// NestJS responde los errores como { statusCode, message, error }, donde
// message puede ser un texto o una lista de textos (errores de validación).
async function leerMensaje(respuesta: Response): Promise<string> {
  try {
    const cuerpo: unknown = await respuesta.json()
    if (typeof cuerpo === 'object' && cuerpo !== null && 'message' in cuerpo) {
      const { message } = cuerpo
      if (Array.isArray(message)) return message.join('. ')
      if (typeof message === 'string') return message
    }
  } catch {
    // La respuesta no es JSON: se usa el mensaje genérico.
  }
  return `Error ${respuesta.status} del servidor`
}
