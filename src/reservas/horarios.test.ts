import { afterEach, expect, test, vi } from 'vitest'
import { fechaInicial, fechaValida, hora, opcionesHorario } from './horarios'

afterEach(() => vi.useRealTimers())

test('la fecha inicial usa Ciudad de México aunque UTC ya cambió de día', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-21T02:00:00Z'))
  expect(fechaInicial()).toBe('2026-11-20')
})

test('rechaza fechas vacías, imposibles o sin formato y admite años bisiestos', () => {
  for (const valor of ['', '2026-02-29', '2026-13-01', '0000-01-01', '2026-1-01']) {
    expect(fechaValida(valor)).toBe(false)
  }
  expect(fechaValida('2028-02-29')).toBe(true)
})

test('las opciones preservan instantes y extremos fuera de la cuadrícula', () => {
  expect(opcionesHorario({ inicio: '2026-11-20T09:10:00-06:00', fin: '2026-11-20T09:32:00-06:00' })).toEqual([
    '2026-11-20T15:10:00.000Z', '2026-11-20T15:25:00.000Z', '2026-11-20T15:32:00.000Z',
  ])
})

test('los bloques inválidos no generan horarios y la etiqueta respeta la zona de API', () => {
  expect(opcionesHorario({ inicio: 'invalido', fin: '2026-11-20T16:00:00Z' })).toEqual([])
  expect(opcionesHorario({ inicio: '2026-11-20T17:00:00Z', fin: '2026-11-20T16:00:00Z' })).toEqual([])
  expect(hora('2026-11-20T15:00:00Z', 'America/Mexico_City')).toBe('09:00')
  expect(hora('2026-11-20T15:00:00Z', 'UTC')).toBe('15:00')
})
