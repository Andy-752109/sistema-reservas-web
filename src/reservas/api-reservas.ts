export type EstadoReserva = 'ACTIVA' | 'CANCELADA' | 'FINALIZADA'

export interface Reserva {
  id: number
  usuarioId: number
  espacioId: number
  inicio: string
  fin: string
  estado: EstadoReserva
}

// Compatible con pedir() del cliente del #34, sin duplicar la autenticación.
export type Pedir = <T>(ruta: string, opciones?: RequestInit) => Promise<T>

export interface ApiReservas {
  listar: (signal?: AbortSignal) => Promise<Reserva[]>
  cancelar: (id: number, signal?: AbortSignal) => Promise<Reserva>
}

export function crearApiReservas(pedir: Pedir): ApiReservas {
  return {
    listar: (signal) => pedir<Reserva[]>('/reservas', { signal }),
    cancelar: (id, signal) => pedir<Reserva>(`/reservas/${id}`, { method: 'DELETE', signal }),
  }
}
