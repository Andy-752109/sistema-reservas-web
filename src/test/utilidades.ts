import { vi } from 'vitest'

// Crea un JWT de prueba con el mismo contenido que firma la API (sub, rol, exp).
// La firma no importa: el frontend solo lee los datos, quien la valida es la API.
export function crearToken(datos: { sub: number; rol: string; exp?: number }): string {
  const base64url = (objeto: object) =>
    btoa(JSON.stringify(objeto)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const exp = datos.exp ?? Math.floor(Date.now() / 1000) + 3600
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ ...datos, exp })}.firma`
}

// Respuesta falsa de fetch con un cuerpo JSON y un código HTTP.
export function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Reemplaza fetch global por un mock que devuelve las respuestas en orden.
export function simularFetch(...respuestas: Response[]) {
  const mock = vi.fn<typeof fetch>()
  for (const respuesta of respuestas) mock.mockResolvedValueOnce(respuesta)
  vi.stubGlobal('fetch', mock)
  return mock
}
