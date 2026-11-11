import { afterEach, expect, test } from 'vitest'
import { obtenerConfig } from './config'

afterEach(() => {
  delete window.__CONFIG__
})

test('usa valores por defecto si no existe config.js', () => {
  expect(obtenerConfig()).toEqual({
    apiUrl: 'http://localhost:3000',
    ambiente: 'LOCAL',
    version: 'dev',
  })
})

test('usa los valores de window.__CONFIG__', () => {
  window.__CONFIG__ = {
    apiUrl: 'https://api-prod.azurewebsites.net',
    ambiente: 'PROD',
    version: '1.0.0',
  }

  expect(obtenerConfig()).toEqual({
    apiUrl: 'https://api-prod.azurewebsites.net',
    ambiente: 'PROD',
    version: '1.0.0',
  })
})
