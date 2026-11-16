import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ApiEspacios, Espacio } from '../espacios/api-espacios'
import Catalogo from './Catalogo'

afterEach(() => {
  cleanup()
})

const ESPACIOS: Espacio[] = [
  { id: 1, nombre: 'Cubículo A1', tipo: 'CUBICULO', capacidad: 4, ubicacion: 'Biblioteca, piso 1' },
  { id: 3, nombre: 'Laboratorio de Redes', tipo: 'LABORATORIO', capacidad: 25, ubicacion: 'Edificio T' },
]

// Una API falsa: así la prueba no depende de internet ni de Azure.
function apiCon(listar: ApiEspacios['listar']): ApiEspacios {
  return { listar }
}

function mostrar(api: ApiEspacios) {
  render(
    <MemoryRouter>
      <Catalogo api={api} />
    </MemoryRouter>,
  )
}

test('muestra un mensaje mientras carga', () => {
  mostrar(apiCon(() => new Promise(() => {})))
  expect(screen.getByText('Cargando espacios…')).toBeTruthy()
})

test('muestra nombre, tipo, capacidad y ubicación de cada espacio', async () => {
  mostrar(apiCon(vi.fn().mockResolvedValue(ESPACIOS)))

  expect(await screen.findByRole('heading', { name: 'Cubículo A1' })).toBeTruthy()
  expect(screen.getByText('Cubículo · 4 personas')).toBeTruthy()
  expect(screen.getByText('Biblioteca, piso 1')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Laboratorio de Redes' })).toBeTruthy()
})

test('cada espacio enlaza a su pantalla de reserva', async () => {
  mostrar(apiCon(vi.fn().mockResolvedValue(ESPACIOS)))

  await screen.findByRole('heading', { name: 'Cubículo A1' })
  const enlaces = screen.getAllByRole('link', { name: 'Ver horarios y reservar' })
  expect(enlaces.map((a) => a.getAttribute('href'))).toEqual([
    '/espacios/1/reservar',
    '/espacios/3/reservar',
  ])
})

test('filtra por tipo', async () => {
  mostrar(apiCon(vi.fn().mockResolvedValue(ESPACIOS)))
  await screen.findByRole('heading', { name: 'Cubículo A1' })

  fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'LABORATORIO' } })

  expect(screen.queryByRole('heading', { name: 'Cubículo A1' })).toBeNull()
  expect(screen.getByRole('heading', { name: 'Laboratorio de Redes' })).toBeTruthy()
})

test('muestra el error si la API falla', async () => {
  mostrar(apiCon(vi.fn().mockRejectedValue(new Error('No se pudo conectar con el servidor.'))))

  expect((await screen.findByRole('alert')).textContent).toBe('No se pudo conectar con el servidor.')
})

test('avisa si no hay espacios', async () => {
  mostrar(apiCon(vi.fn().mockResolvedValue([])))

  expect(await screen.findByText('No hay espacios disponibles.')).toBeTruthy()
})