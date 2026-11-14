import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import MisReservas from './MisReservas'
import type { ApiReservas, Reserva } from '../reservas/api-reservas'

afterEach(cleanup)

const reserva = (id = 1, estado: Reserva['estado'] = 'ACTIVA', usuarioId = 7): Reserva => ({
  id, estado, usuarioId, espacioId: 3,
  inicio: '2026-11-20T15:00:00.000Z', fin: '2026-11-20T16:00:00.000Z',
})

function servicio(reservas = [reserva()]) {
  return {
    listar: vi.fn<ApiReservas['listar']>().mockResolvedValue(reservas),
    cancelar: vi.fn<ApiReservas['cancelar']>().mockResolvedValue(reserva(1, 'CANCELADA')),
  }
}

function diferido<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((resolve) => { resolver = resolve })
  return { promesa, resolver }
}

test('muestra carga y después estados, espacio y horarios de Ciudad de México', async () => {
  const api = servicio([reserva(), reserva(2, 'CANCELADA'), reserva(3, 'FINALIZADA')])
  render(<MisReservas api={api} usuarioId={7} />)
  expect(screen.getByRole('status').textContent).toBe('Cargando tus reservas…')
  expect(await screen.findByText('ACTIVA')).toBeTruthy()
  expect(screen.getByText('CANCELADA')).toBeTruthy()
  expect(screen.getByText('FINALIZADA')).toBeTruthy()
  const primera = screen.getByRole('article', { name: 'Reserva #1' })
  expect(within(primera).getByText('Espacio #3')).toBeTruthy()
  expect(primera.querySelector('time')?.dateTime).toBe(reserva().inicio)
  expect(primera.querySelector('time')?.textContent).toContain('9:00')
  expect(screen.getAllByRole('button', { name: /^Cancelar reserva/ })).toHaveLength(1)
})

test('solo muestra reservas propias incluso si la API devuelve las de otros usuarios', async () => {
  render(<MisReservas api={servicio([reserva(), reserva(2, 'ACTIVA', 99)])} usuarioId={7} />)
  await screen.findByText('Reserva #1')
  expect(screen.queryByText('Reserva #2')).toBeNull()
})

test('explica cuando no hay reservas propias', async () => {
  render(<MisReservas api={servicio([reserva(2, 'ACTIVA', 99)])} usuarioId={7} />)
  expect(await screen.findByText('Aún no tienes reservas.')).toBeTruthy()
})

test('muestra errores de carga y permite reintentar', async () => {
  const api = servicio()
  api.listar.mockRejectedValueOnce(new Error('No hay conexión.'))
  render(<MisReservas api={api} usuarioId={7} />)
  expect((await screen.findByRole('alert')).textContent).toBe('No hay conexión.')
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(await screen.findByText('Reserva #1')).toBeTruthy()
  expect(api.listar).toHaveBeenCalledTimes(2)
})

test('permite conservar la reserva sin enviar una cancelación', async () => {
  const api = servicio()
  render(<MisReservas api={api} usuarioId={7} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #1' }))
  expect(screen.getByRole('group', { name: 'Confirmar cancelación de reserva #1' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Conservar reserva #1' }))
  expect(api.cancelar).not.toHaveBeenCalled()
  expect(screen.queryByRole('group')).toBeNull()
  expect(screen.getByText('ACTIVA')).toBeTruthy()
})

test('la cancelación confirmada actualiza la lista y conserva el registro', async () => {
  const api = servicio()
  render(<MisReservas api={api} usuarioId={7} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #1' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #1' }))
  expect(await screen.findByText('CANCELADA')).toBeTruthy()
  expect(screen.getByText('Reserva #1')).toBeTruthy()
  expect(screen.getByRole('status').textContent).toContain('Se conserva en tu historial.')
  expect(api.cancelar).toHaveBeenCalledWith(1, expect.any(AbortSignal))
  expect(screen.queryByRole('button', { name: /Cancelar reserva/ })).toBeNull()
})

test('si falla cancelar, conserva el estado y permite intentar otra vez', async () => {
  const api = servicio()
  api.cancelar.mockRejectedValueOnce(new Error('No se pudo cancelar.'))
  render(<MisReservas api={api} usuarioId={7} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #1' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #1' }))
  expect((await screen.findByRole('alert')).textContent).toBe('No se pudo cancelar.')
  expect(screen.getByText('ACTIVA')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #1' }))
  expect(await screen.findByText('CANCELADA')).toBeTruthy()
  expect(api.cancelar).toHaveBeenCalledTimes(2)
})

test('bloquea cancelaciones duplicadas mientras espera al servidor', async () => {
  const api = servicio()
  const pendiente = diferido<Reserva>()
  api.cancelar.mockReturnValue(pendiente.promesa)
  render(<MisReservas api={api} usuarioId={7} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #1' }))
  const confirmar = screen.getByRole('button', { name: 'Sí, cancelar reserva #1' })
  fireEvent.click(confirmar)
  fireEvent.click(confirmar)
  expect(api.cancelar).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Cancelando…' }).hasAttribute('disabled')).toBe(true)
  await act(async () => pendiente.resolver(reserva(1, 'CANCELADA')))
  expect(await screen.findByText('CANCELADA')).toBeTruthy()
})

test('al cambiar de usuario limpia la lista e ignora una respuesta anterior', async () => {
  const api = servicio()
  const anterior = diferido<Reserva[]>()
  api.listar.mockReturnValueOnce(anterior.promesa)
  api.listar.mockResolvedValueOnce([reserva(2, 'ACTIVA', 8)])
  const vista = render(<MisReservas api={api} usuarioId={7} />)
  const signal = api.listar.mock.calls[0][0]
  vista.rerender(<MisReservas api={api} usuarioId={8} />)
  expect(signal?.aborted).toBe(true)
  await screen.findByText('Reserva #2')
  await act(async () => anterior.resolver([reserva()]))
  expect(screen.queryByText('Reserva #1')).toBeNull()
  expect(screen.getByText('Reserva #2')).toBeTruthy()
})

test('aborta las peticiones al salir de la pantalla', async () => {
  const api = servicio()
  const vista = render(<MisReservas api={api} usuarioId={7} />)
  await screen.findByText('Reserva #1')
  const signal = api.listar.mock.calls[0][0]
  vista.unmount()
  await waitFor(() => expect(signal?.aborted).toBe(true))
})

test('una cancelación de la cuenta anterior no altera la nueva sesión', async () => {
  const api = servicio()
  const pendiente = diferido<Reserva>()
  api.cancelar.mockReturnValue(pendiente.promesa)
  const vista = render(<MisReservas api={api} usuarioId={7} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva #1' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar reserva #1' }))
  const signal = api.cancelar.mock.calls[0][1]
  api.listar.mockResolvedValueOnce([reserva(2, 'ACTIVA', 8)])
  vista.rerender(<MisReservas api={api} usuarioId={8} />)
  await screen.findByText('Reserva #2')
  expect(signal?.aborted).toBe(true)
  await act(async () => pendiente.resolver(reserva(1, 'CANCELADA')))
  expect(screen.queryByText('Reserva #1')).toBeNull()
  expect(screen.queryByText('CANCELADA')).toBeNull()
  expect(screen.getByText('ACTIVA')).toBeTruthy()
})
