/// <reference types="node" />
import { randomUUID } from 'node:crypto'
import { afterEach, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'
import type { Reserva } from './reservas/api-reservas'

// Opt-in: ejecutar únicamente con una API local y una base temporal desechable.
const apiUrl = process.env.PRUEBA_API_LOCAL_URL

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete window.__CONFIG__
})

test.skipIf(!apiUrl)('login, historial y cancelación contra la API y PostgreSQL locales', async () => {
  const url = new URL(apiUrl!)
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.protocol !== 'http:') {
    throw new Error('Esta prueba solo admite una API local con datos desechables')
  }
  const espacioId = Number(process.env.PRUEBA_ESPACIO_ID)
  if (!Number.isSafeInteger(espacioId) || espacioId <= 0) {
    throw new Error('Configura PRUEBA_ESPACIO_ID con un espacio de la base temporal')
  }
  const correo = `${randomUUID()}@example.com`
  const contrasena = 'ClaveSoloPruebaLocal123!'
  async function peticion<T>(ruta: string, status: number, body?: object, token?: string): Promise<T> {
    const response = await fetch(`${apiUrl}${ruta}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    expect(response.status, ruta).toBe(status)
    return await response.json() as T
  }
  await peticion('/usuarios', 201, { nombre: 'Prueba local', correo, contrasena })
  const { access_token } = await peticion<{ access_token: string }>('/login', 200, { correo, contrasena })
  const reserva = await peticion<Reserva>('/reservas', 201, {
    espacioId, inicio: '2026-11-20T15:00:00Z', fin: '2026-11-20T16:00:00Z',
  }, access_token)
  window.__CONFIG__ = { apiUrl }
  render(<MemoryRouter initialEntries={['/mis-reservas']}><App /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: correo } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: contrasena } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  fireEvent.click(await screen.findByRole('button', { name: `Cancelar reserva #${reserva.id}` }))
  fireEvent.click(screen.getByRole('button', { name: `Sí, cancelar reserva #${reserva.id}` }))
  expect(await screen.findByText('CANCELADA')).toBeTruthy()
  expect(screen.getByText(`Reserva #${reserva.id}`)).toBeTruthy()
  const listado = await peticion<Reserva[]>('/reservas', 200, undefined, access_token)
  expect(listado.find((r) => r.id === reserva.id)?.estado).toBe('CANCELADA')
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  expect(localStorage.getItem('reservas.token')).toBeNull()
}, 20_000)
