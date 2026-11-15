import { afterEach, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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

const reserva = {
  id: 41, usuarioId: 7, espacioId: 3, estado: 'ACTIVA',
  inicio: '2026-11-20T15:00:00Z', fin: '2026-11-20T16:00:00Z',
}

function abrir(ruta = '/mis-reservas') {
  render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)
}

test('la ruta de mis reservas requiere sesión y no consulta la API sin ella', () => {
  const fetch = simularFetch()
  abrir()
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Mis reservas' })).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})

test('login regresa a mis reservas; usa URL runtime y Bearer al listar y cancelar', async () => {
  window.__CONFIG__ = { apiUrl: 'https://api.ejemplo.invalid', ambiente: 'DEV' }
  const token = crearToken({ sub: 7, rol: 'ESTUDIANTE' })
  const fetch = simularFetch(
    respuestaJson({ access_token: token }),
    respuestaJson([reserva]),
    respuestaJson({ ...reserva, estado: 'CANCELADA' }),
  )
  abrir()
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'prueba@example.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'ClavePrueba123!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #41' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #41' }))
  expect(await screen.findByText('CANCELADA')).toBeTruthy()
  expect(screen.getByText('Reserva #41')).toBeTruthy()
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    'https://api.ejemplo.invalid/login', 'https://api.ejemplo.invalid/reservas',
    'https://api.ejemplo.invalid/reservas/41',
  ])
  expect(fetch.mock.calls[2][1]?.method).toBe('DELETE')
  for (const [, opciones] of fetch.mock.calls.slice(1)) {
    expect(new Headers(opciones?.headers).get('Authorization')).toBe(`Bearer ${token}`)
  }
})

test('la navegación de sesión abre el historial y ADMIN solo ve sus reservas', async () => {
  guardarToken(crearToken({ sub: 7, rol: 'ADMIN' }))
  simularFetch(respuestaJson([reserva, { ...reserva, id: 99, usuarioId: 9 }]))
  abrir('/')
  fireEvent.click(screen.getByRole('link', { name: 'Mis reservas' }))
  expect(await screen.findByRole('heading', { name: 'Mis reservas' })).toBeTruthy()
  await screen.findByText('Reserva #41')
  expect(screen.queryByText('Reserva #99')).toBeNull()
})

test('un 401 al listar limpia la sesión y redirige al login', async () => {
  guardarToken(crearToken({ sub: 7, rol: 'ESTUDIANTE' }))
  simularFetch(respuestaJson({ message: 'Unauthorized' }, 401))
  abrir()
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(localStorage.getItem('reservas.token')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
})

test('un 401 al cancelar retira el historial y regresa al login', async () => {
  guardarToken(crearToken({ sub: 7, rol: 'ESTUDIANTE' }))
  simularFetch(respuestaJson([reserva]), respuestaJson({ message: 'Unauthorized' }, 401))
  abrir()
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #41' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #41' }))
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(screen.queryByText('Reserva #41')).toBeNull()
  expect(localStorage.length).toBe(0)
})

test('un 403 al cancelar muestra el error sin cerrar la sesión ni alterar la reserva', async () => {
  guardarToken(crearToken({ sub: 7, rol: 'ESTUDIANTE' }))
  simularFetch(respuestaJson([reserva]), respuestaJson({ message: 'No tienes acceso' }, 403))
  abrir()
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #41' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #41' }))
  expect((await screen.findByRole('alert')).textContent).toBe('No tienes acceso')
  expect(screen.getByText('ACTIVA')).toBeTruthy()
  expect(localStorage.getItem('reservas.token')).not.toBeNull()
})

test('cerrar sesión desde el historial elimina la lista privada', async () => {
  guardarToken(crearToken({ sub: 7, rol: 'DOCENTE' }))
  simularFetch(respuestaJson([reserva]))
  abrir()
  await screen.findByText('Reserva #41')
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(screen.queryByText('Reserva #41')).toBeNull()
  expect(localStorage.length).toBe(0)
})

test('si vence el JWT con el historial abierto, cancelar redirige al login', async () => {
  const ahora = Date.now()
  guardarToken(crearToken({ sub: 7, rol: 'ESTUDIANTE', exp: Math.floor(ahora / 1000) + 60 }))
  const fetch = simularFetch(respuestaJson([reserva]), respuestaJson({ message: 'Unauthorized' }, 401))
  abrir()
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #41' }))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(ahora + 120_000)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #41' }))
  })
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(localStorage.length).toBe(0)
  expect(new Headers(fetch.mock.calls[1][1]?.headers).has('Authorization')).toBe(false)
})
