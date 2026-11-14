import { expect, test, vi } from 'vitest'
import { crearApiReservas, type Pedir } from './api-reservas'

test('listar consume GET /reservas mediante el cliente autenticado', async () => {
  const pedir = vi.fn<Pedir>().mockResolvedValue([])
  const cliente: Pedir = async <T,>(ruta: string, opciones?: RequestInit) =>
    await pedir(ruta, opciones) as T
  const api = crearApiReservas(cliente)
  const signal = new AbortController().signal
  await expect(api.listar(signal)).resolves.toEqual([])
  expect(pedir).toHaveBeenCalledWith('/reservas', { signal })
})

test('cancelar usa DELETE /reservas/:id y devuelve el registro del servidor', async () => {
  const registro = { id: 3, estado: 'CANCELADA' }
  const pedir = vi.fn<Pedir>().mockResolvedValue(registro)
  const cliente: Pedir = async <T,>(ruta: string, opciones?: RequestInit) =>
    await pedir(ruta, opciones) as T
  const api = crearApiReservas(cliente)
  const signal = new AbortController().signal
  await expect(api.cancelar(3, signal)).resolves.toEqual(registro)
  expect(pedir).toHaveBeenCalledWith('/reservas/3', { method: 'DELETE', signal })
})
