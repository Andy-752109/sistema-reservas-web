/// <reference types="node" />
import { randomUUID } from 'node:crypto'
import { afterEach, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'
import type { Reserva } from './reservas/api-reservas'

const apiUrl = process.env.PRUEBA_RESERVAR_API_URL

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete window.__CONFIG__
})

test.skipIf(!apiUrl)('API local: disponibilidad, traslape concurrente y creación desde el formulario', async () => {
  const url = new URL(apiUrl!)
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol !== 'http:') {
    throw new Error('Solo se permite una API HTTP local con base temporal desechable')
  }
  const espacioId = Number(process.env.PRUEBA_RESERVAR_ESPACIO_ID)
  if (!Number.isSafeInteger(espacioId) || espacioId <= 0) throw new Error('Falta el espacio de la base temporal')
  const correo = `${randomUUID()}@example.com`
  const otroCorreo = `${randomUUID()}@example.com`
  const contrasena = 'ClaveSoloPruebaLocal123!'
  async function pedir<T>(ruta: string, status: number, body?: object, token?: string): Promise<T> {
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
  for (const email of [correo, otroCorreo]) {
    await pedir('/usuarios', 201, { nombre: 'Prueba local #37', correo: email, contrasena })
  }
  const otro = await pedir<{ access_token: string }>('/login', 200, { correo: otroCorreo, contrasena })
  window.__CONFIG__ = { apiUrl }
  render(<MemoryRouter initialEntries={[`/espacios/${espacioId}/reservar`]}><App /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: correo } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: contrasena } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  fireEvent.click(await screen.findByRole('button', { name: '07:00–21:00' }))
  const inicio = (screen.getByLabelText('Inicio') as HTMLSelectElement).value
  const fin = (screen.getByLabelText('Fin') as HTMLSelectElement).value
  // Otro usuario ocupa el horario entre consultar disponibilidad y confirmar.
  await pedir('/reservas', 201, { espacioId, inicio, fin }, otro.access_token)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  expect((await screen.findByRole('alert')).textContent).toContain('acaba de ocuparse')
  fireEvent.click(await screen.findByRole('button', { name: '07:30–21:00' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('creada correctamente'))
  const token = localStorage.getItem('reservas.token')!
  const reservas = await pedir<Reserva[]>('/reservas', 200, undefined, token)
  expect(reservas).toHaveLength(1)
  expect(reservas[0].estado).toBe('ACTIVA')
  expect(Date.parse(reservas[0].inicio)).toBe(Date.parse(fin))
  fireEvent.click(screen.getByRole('link', { name: 'Ver mis reservas' }))
  expect(await screen.findByText(`Reserva #${reservas[0].id}`)).toBeTruthy()
}, 20_000)
