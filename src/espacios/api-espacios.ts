import type { Pedir } from '../reservas/api-reservas'

export interface Espacio {
  id: number
  nombre: string
  tipo: string
  capacidad: number
  ubicacion: string
}

export interface ApiEspacios {
  listar: () => Promise<Espacio[]>
}

// Recibe pedir() del cliente compartido: así hereda la URL de config.js y el token.
export function crearApiEspacios(pedir: Pedir): ApiEspacios {
  return {
    listar: () => pedir<Espacio[]>('/espacios'),
  }
}