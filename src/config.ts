export interface AppConfig {
  apiUrl: string
  ambiente: string
  version: string
}

declare global {
  interface Window {
    __CONFIG__?: Partial<AppConfig>
  }
}

const porDefecto: AppConfig = {
  apiUrl: 'http://localhost:3000',
  ambiente: 'LOCAL',
  version: 'dev',
}

// Se lee en tiempo de ejecución (public/config.js), no en el build,
// para que la misma imagen sirva en Dev y en Prod.
export function obtenerConfig(): AppConfig {
  return { ...porDefecto, ...window.__CONFIG__ }
}
