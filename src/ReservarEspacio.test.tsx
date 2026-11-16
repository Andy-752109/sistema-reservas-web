import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from './App'
import { guardarToken } from './auth/sesion'
import { crearToken, respuestaJson, simularFetch } from './test/utilidades'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete window.__CONFIG__
})

const espacio = { id: 3, nombre: 'Cubículo A', tipo: 'CUBICULO', capacidad: 4, ubicacion: 'Biblioteca' }
const bloque = { inicio: '2026-11-20T09:00:00-06:00', fin: '2026-11-20T12:00:00-06:00' }
const disponibilidad = {
  espacioId: 3, fecha: '2026-11-20', zonaHoraria: 'America/Mexico_City', horario: bloque, bloquesLibres: [bloque],
}
const creada = { id: 42, usuarioId: 7, espacioId: 3, estado: 'ACTIVA', inicio: '2026-11-20T15:00:00.000Z', fin: '2026-11-20T15:30:00.000Z' }

function abrir(ruta = '/espacios/3/reservar', sesion = true) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-20T13:00:00Z'))
  if (sesion) guardarToken(crearToken({ sub: 7, rol: 'ESTUDIANTE' }))
  render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)
}

async function elegir() {
  fireEvent.click(await screen.findByRole('button', { name: '09:00–12:00' }))
}

test('sin sesión manda a login sin consultar la API', () => {
  const fetch = simularFetch()
  abrir(undefined, false)
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(fetch).not.toHaveBeenCalled()
})

test.each(['0', '-1', 'abc', '2147483648'])('rechaza el identificador inválido %s sin pedir datos', (id) => {
  const fetch = simularFetch()
  abrir(`/espacios/${id}/reservar`)
  expect(screen.getByRole('alert').textContent).toContain('no es válido')
  expect(fetch).not.toHaveBeenCalled()
})

test('consulta nombre, disponibilidad y fecha usando URL runtime y Bearer', async () => {
  window.__CONFIG__ = { apiUrl: 'https://api.ejemplo.invalid' }
  const fetch = simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad))
  abrir()
  expect(screen.getByRole('status').textContent).toContain('Consultando')
  await elegir()
  expect(screen.getByRole('heading', { name: 'Reservar: Cubículo A' })).toBeTruthy()
  expect(screen.getByText(/America\/Mexico_City/)).toBeTruthy()
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    'https://api.ejemplo.invalid/espacios/3',
    'https://api.ejemplo.invalid/espacios/3/disponibilidad?fecha=2026-11-20',
  ])
  expect(new Headers(fetch.mock.calls[1][1]?.headers).get('Authorization')).toContain('Bearer ')
})

test('crea con horas ISO, conserva la confirmación y navega a mis reservas', async () => {
  const fetch = simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad), respuestaJson(creada, 201), respuestaJson([creada]))
  abrir()
  await elegir()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Reserva #42 creada correctamente.')
  const [, opciones] = fetch.mock.calls[2]
  expect(opciones?.method).toBe('POST')
  expect(JSON.parse(String(opciones?.body))).toEqual({ espacioId: 3, inicio: creada.inicio, fin: creada.fin })
  expect(new Headers(opciones?.headers).get('Authorization')).toContain('Bearer ')
  expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).toBeNull()
  fireEvent.click(screen.getByRole('link', { name: 'Ver mis reservas' }))
  expect(await screen.findByText('Reserva #42')).toBeTruthy()
})

test('inicio posterior ajusta fin y no permite intervalos vacíos', async () => {
  simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad))
  abrir()
  await elegir()
  fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2026-11-20T17:45:00.000Z' } })
  expect((screen.getByLabelText('Fin') as HTMLSelectElement).value).toBe('2026-11-20T18:00:00.000Z')
})

test('un 409 conserva la pantalla y fecha, recarga bloques y permite otro intento', async () => {
  const otro = { inicio: '2026-11-20T10:00:00-06:00', fin: bloque.fin }
  const fetch = simularFetch(
    respuestaJson(espacio), respuestaJson(disponibilidad),
    respuestaJson({ message: 'Traslape' }, 409),
    respuestaJson(espacio), respuestaJson({ ...disponibilidad, bloquesLibres: [otro] }),
    respuestaJson({ ...creada, inicio: '2026-11-20T16:00:00Z', fin: '2026-11-20T16:30:00Z' }, 201),
  )
  abrir()
  await elegir()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  expect((await screen.findByRole('alert')).textContent).toContain('acaba de ocuparse')
  fireEvent.click(await screen.findByRole('button', { name: '10:00–12:00' }))
  expect((screen.getByLabelText('Fecha') as HTMLInputElement).value).toBe('2026-11-20')
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('creada correctamente'))
  expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(2)
})

test('sin bloques muestra el estado vacío y no permite reservar', async () => {
  simularFetch(respuestaJson(espacio), respuestaJson({ ...disponibilidad, bloquesLibres: [] }))
  abrir()
  expect(await screen.findByText('No hay horarios disponibles para esta fecha.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).toBeNull()
})

test('el error de consulta permite reintentar', async () => {
  simularFetch(respuestaJson({ message: 'Espacio no encontrado' }, 404), respuestaJson(disponibilidad), respuestaJson(espacio), respuestaJson(disponibilidad))
  abrir()
  expect((await screen.findByRole('alert')).textContent).toBe('Espacio no encontrado')
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  await elegir()
})

test('cambiar fecha recarga disponibilidad; una fecha vacía no consulta', async () => {
  const fetch = simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad), respuestaJson(espacio), respuestaJson({ ...disponibilidad, fecha: '2026-11-21' }))
  abrir()
  await elegir()
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-21' } })
  await elegir()
  expect(fetch.mock.calls[3][0]).toContain('fecha=2026-11-21')
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '' } })
  expect(screen.getByRole('alert').textContent).toContain('fecha válida')
  expect(fetch).toHaveBeenCalledTimes(4)
})

test('un 400 al reservar conserva el formulario para corregir o reintentar', async () => {
  simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad), respuestaJson({ message: 'Intervalo inválido' }, 400))
  abrir()
  await elegir()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Intervalo inválido')
  expect(screen.getByLabelText('Inicio')).toBeTruthy()
})

test('un 401 al reservar limpia la sesión y regresa a login', async () => {
  simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad), respuestaJson({ message: 'Unauthorized' }, 401))
  abrir()
  await elegir()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(localStorage.length).toBe(0)
})

test('bloquea envíos duplicados y cambios de fecha mientras reserva', async () => {
  let resolver!: (r: Response) => void
  const pendiente = new Promise<Response>((resolve) => { resolver = resolve })
  const fetch = simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad))
  fetch.mockReturnValueOnce(pendiente)
  abrir()
  await elegir()
  const boton = screen.getByRole('button', { name: 'Confirmar reserva' })
  fireEvent.click(boton)
  fireEvent.click(boton)
  expect(fetch).toHaveBeenCalledTimes(3)
  expect(screen.getByLabelText('Fecha').hasAttribute('disabled')).toBe(true)
  await act(async () => resolver(respuestaJson(creada, 201)))
  expect(screen.getByRole('status').textContent).toContain('creada correctamente')
})

test('ignora disponibilidad tardía de una fecha anterior', async () => {
  let resolver!: (r: Response) => void
  const pendiente = new Promise<Response>((resolve) => { resolver = resolve })
  const fetch = simularFetch(respuestaJson(espacio))
  fetch.mockReturnValueOnce(pendiente)
  fetch.mockResolvedValueOnce(respuestaJson(espacio))
  fetch.mockResolvedValueOnce(respuestaJson({ ...disponibilidad, bloquesLibres: [{ ...bloque, inicio: '2026-11-21T10:00:00-06:00', fin: '2026-11-21T12:00:00-06:00' }] }))
  abrir()
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-21' } })
  await screen.findByRole('button', { name: '10:00–12:00' })
  await act(async () => resolver(respuestaJson(disponibilidad)))
  expect(screen.queryByRole('button', { name: '09:00–12:00' })).toBeNull()
  expect(screen.getByRole('button', { name: '10:00–12:00' })).toBeTruthy()
})

test('tras crear se puede consultar disponibilidad nueva para otra reserva', async () => {
  simularFetch(respuestaJson(espacio), respuestaJson(disponibilidad), respuestaJson(creada, 201), respuestaJson(espacio), respuestaJson({ ...disponibilidad, bloquesLibres: [] }))
  abrir()
  await elegir()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Hacer otra reserva' }))
  expect(await screen.findByText('No hay horarios disponibles para esta fecha.')).toBeTruthy()
  expect(screen.queryByText('Reserva #42 creada correctamente.')).toBeNull()
})

test('catálogo, formulario y Mis reservas conservan su navegación al integrar las rutas', async () => {
  const fetch = simularFetch(respuestaJson([espacio]), respuestaJson(espacio), respuestaJson(disponibilidad), respuestaJson(creada, 201), respuestaJson([creada]))
  abrir('/espacios')
  fireEvent.click(await screen.findByRole('link', { name: 'Ver horarios y reservar' }))
  await elegir()
  expect(screen.getByRole('link', { name: 'Volver al catálogo' }).getAttribute('href')).toBe('/espacios')
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('creada correctamente'))
  fireEvent.click(screen.getByRole('link', { name: 'Ver mis reservas' }))
  expect(await screen.findByText('Reserva #42')).toBeTruthy()
  expect(fetch.mock.calls.map(([url]) => String(url).split('?')[0])).toEqual([
    'http://localhost:3000/espacios', 'http://localhost:3000/espacios/3',
    'http://localhost:3000/espacios/3/disponibilidad',
    'http://localhost:3000/reservas', 'http://localhost:3000/reservas',
  ])
})
