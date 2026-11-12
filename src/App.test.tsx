import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'
import { guardarToken } from './auth/sesion'
import { crearToken, respuestaJson, simularFetch } from './test/utilidades'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function abrirEn(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}

function escribir(etiqueta: string, valor: string) {
  fireEvent.change(screen.getByLabelText(etiqueta, { exact: false }), { target: { value: valor } })
}

test('sin sesión, una ruta privada manda al login', () => {
  abrirEn('/')
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
})

test('inicia sesión con POST /login, guarda el token y entra', async () => {
  const token = crearToken({ sub: 3, rol: 'ESTUDIANTE' })
  const fetch = simularFetch(respuestaJson({ access_token: token }))
  abrirEn('/')

  escribir('Correo', 'ana@iteso.mx')
  escribir('Contraseña', 'UnaClave123!')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

  expect(await screen.findByText('Sesión iniciada como estudiante.')).toBeTruthy()
  const [url, opciones] = fetch.mock.calls[0]
  expect(url).toBe('http://localhost:3000/login')
  expect(opciones?.method).toBe('POST')
  expect(JSON.parse(String(opciones?.body))).toEqual({
    correo: 'ana@iteso.mx',
    contrasena: 'UnaClave123!',
  })
  expect(localStorage.getItem('reservas.token')).toBe(token)
})

test('con credenciales incorrectas muestra el error y no entra', async () => {
  simularFetch(respuestaJson({ statusCode: 401, message: 'Credenciales incorrectas' }, 401))
  abrirEn('/login')

  escribir('Correo', 'ana@iteso.mx')
  escribir('Contraseña', 'equivocada')
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

  expect((await screen.findByRole('alert')).textContent).toBe('Correo o contraseña incorrectos.')
  expect(localStorage.length).toBe(0)
})

test('cerrar sesión borra el token y regresa al login', () => {
  guardarToken(crearToken({ sub: 3, rol: 'DOCENTE' }))
  abrirEn('/')
  expect(screen.getByText('Sesión iniciada como docente.')).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(localStorage.length).toBe(0)
})

test('el registro muestra el 409 de correo repetido', async () => {
  simularFetch(respuestaJson({ statusCode: 409, message: 'El correo ya está registrado' }, 409))
  abrirEn('/registro')

  escribir('Nombre', 'Ana')
  escribir('Correo', 'ana@iteso.mx')
  escribir('Contraseña', 'UnaClave123!')
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

  expect((await screen.findByRole('alert')).textContent).toBe('El correo ya está registrado')
})

test('el registro crea la cuenta con POST /usuarios e inicia sesión', async () => {
  const fetch = simularFetch(
    respuestaJson({ id: 9, nombre: 'Ana', correo: 'ana@iteso.mx', rol: 'ESTUDIANTE' }, 201),
    respuestaJson({ access_token: crearToken({ sub: 9, rol: 'ESTUDIANTE' }) }),
  )
  abrirEn('/registro')

  escribir('Nombre', 'Ana')
  escribir('Correo', 'ana@iteso.mx')
  escribir('Contraseña', 'UnaClave123!')
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

  expect(await screen.findByText('Sesión iniciada como estudiante.')).toBeTruthy()
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    'http://localhost:3000/usuarios',
    'http://localhost:3000/login',
  ])
})
