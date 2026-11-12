import { afterEach, expect, test, vi } from 'vitest'
import { guardarToken } from '../auth/sesion'
import { crearToken, respuestaJson, simularFetch } from '../test/utilidades'
import { ErrorApi, EVENTO_SESION_EXPIRADA, pedir } from './cliente'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

test('usa la URL de la API y envía Authorization: Bearer con sesión', async () => {
  const token = crearToken({ sub: 1, rol: 'ESTUDIANTE' })
  guardarToken(token)
  const fetch = simularFetch(respuestaJson([{ id: 1 }]))

  await expect(pedir('/espacios')).resolves.toEqual([{ id: 1 }])

  const [url, opciones] = fetch.mock.calls[0]
  expect(url).toBe('http://localhost:3000/espacios')
  expect(new Headers(opciones?.headers).get('Authorization')).toBe(`Bearer ${token}`)
})

test('no envía Authorization sin sesión', async () => {
  const fetch = simularFetch(respuestaJson({}))
  await pedir('/espacios')
  expect(new Headers(fetch.mock.calls[0][1]?.headers).has('Authorization')).toBe(false)
})

test('convierte la lista de errores de validación de NestJS en un mensaje', async () => {
  simularFetch(
    respuestaJson(
      { statusCode: 400, message: ['correo must be an email', 'contrasena should not be empty'] },
      400,
    ),
  )
  await expect(pedir('/login', { method: 'POST', body: '{}' })).rejects.toEqual(
    new ErrorApi(400, 'correo must be an email. contrasena should not be empty'),
  )
})

test('con 401 y sesión, borra el token y avisa que la sesión expiró', async () => {
  guardarToken(crearToken({ sub: 1, rol: 'ESTUDIANTE' }))
  simularFetch(respuestaJson({ statusCode: 401, message: 'Unauthorized' }, 401))
  const aviso = vi.fn()
  window.addEventListener(EVENTO_SESION_EXPIRADA, aviso)

  await expect(pedir('/reservas')).rejects.toBeInstanceOf(ErrorApi)

  expect(localStorage.length).toBe(0)
  expect(aviso).toHaveBeenCalledOnce()
  window.removeEventListener(EVENTO_SESION_EXPIRADA, aviso)
})

test('da un mensaje claro si no hay conexión', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')))
  await expect(pedir('/espacios')).rejects.toEqual(
    new ErrorApi(0, 'No se pudo conectar con el servidor. Intenta de nuevo.'),
  )
})
