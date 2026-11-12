// Pruebas del script que genera config.js en el contenedor.
// Corren con sh (macOS, Linux y CI). Se omiten si sh no está disponible, como en Windows sin Git Bash.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, test } from 'vitest'

const SCRIPT = join(import.meta.dirname, '40-generar-config.sh')
const haySh = !spawnSync('sh', ['-c', 'exit 0']).error

let carpeta: string | undefined

afterEach(() => {
  if (carpeta) rmSync(carpeta, { recursive: true, force: true })
  carpeta = undefined
})

function generar(variables: Record<string, string>) {
  carpeta = mkdtempSync(join(tmpdir(), 'config-'))
  const destino = join(carpeta, 'config.js')
  const resultado = spawnSync('sh', [SCRIPT], {
    env: { PATH: process.env.PATH, CONFIG_DESTINO: destino, ...variables },
    encoding: 'utf8',
  })
  return { resultado, destino }
}

// Evalúa el config.js generado como lo haría el navegador y devuelve window.__CONFIG__.
function leerConfig(destino: string) {
  const window: { __CONFIG__?: unknown } = {}
  runInNewContext(readFileSync(destino, 'utf8'), { window })
  return window.__CONFIG__
}

describe.skipIf(!haySh)('docker/40-generar-config.sh', () => {
  test('usa valores por defecto sin variables', () => {
    const { resultado, destino } = generar({})
    expect(resultado.status).toBe(0)
    expect(leerConfig(destino)).toEqual({
      apiUrl: 'http://localhost:3000',
      ambiente: 'LOCAL',
      version: 'dev',
    })
  })

  test.each([
    ['DEV', 'https://api-dev.azurewebsites.net', '3f2a9c1'],
    ['PROD', 'https://api-prod.azurewebsites.net', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'],
  ])('genera la configuración de %s', (ambiente, apiUrl, version) => {
    const { resultado, destino } = generar({ AMBIENTE: ambiente, API_URL: apiUrl, APP_VERSION: version })
    expect(resultado.status).toBe(0)
    expect(leerConfig(destino)).toEqual({ apiUrl, ambiente, version })
  })

  test('conserva comillas y barras invertidas sin romper el JavaScript', () => {
    const { resultado, destino } = generar({ APP_VERSION: 'release "demo" \\ 1' })
    expect(resultado.status).toBe(0)
    expect(leerConfig(destino)).toMatchObject({ version: 'release "demo" \\ 1' })
  })

  test('falla sin escribir config.js si un valor tiene saltos de línea', () => {
    const { resultado, destino } = generar({ APP_VERSION: 'linea1\nlinea2' })
    expect(resultado.status).not.toBe(0)
    expect(resultado.stderr).toContain('APP_VERSION')
    expect(() => readFileSync(destino)).toThrow()
  })
})
