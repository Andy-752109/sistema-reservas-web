import { afterEach, expect, test } from 'vitest'
import { crearToken } from '../test/utilidades'
import { guardarToken, leerUsuario, obtenerToken } from './sesion'

afterEach(() => {
  localStorage.clear()
})

test('lee el id y el rol del token', () => {
  expect(leerUsuario(crearToken({ sub: 7, rol: 'DOCENTE' }))).toEqual({ id: 7, rol: 'DOCENTE' })
})

test('rechaza un token vencido', () => {
  const vencido = crearToken({ sub: 7, rol: 'DOCENTE', exp: Math.floor(Date.now() / 1000) - 10 })
  expect(leerUsuario(vencido)).toBeNull()
})

test('rechaza un token mal formado', () => {
  expect(leerUsuario('no-es-un-jwt')).toBeNull()
})

test('obtenerToken borra un token vencido guardado', () => {
  guardarToken(crearToken({ sub: 1, rol: 'ESTUDIANTE', exp: 1 }))
  expect(obtenerToken()).toBeNull()
  expect(localStorage.length).toBe(0)
})
