import type { Pedir, Reserva } from './api-reservas'

export interface Espacio {
  id: number
  nombre: string
  tipo: string
  capacidad: number
  ubicacion: string
}

export interface BloqueLibre {
  inicio: string
  fin: string
}

export interface Disponibilidad {
  espacioId: number
  fecha: string
  zonaHoraria: string
  horario: BloqueLibre
  bloquesLibres: BloqueLibre[]
}

export function crearApiDisponibilidad(pedir: Pedir) {
  return {
    espacio: (id: number, signal: AbortSignal) => pedir<Espacio>(`/espacios/${id}`, { signal }),
    consultar: (id: number, fecha: string, signal: AbortSignal) =>
      pedir<Disponibilidad>(`/espacios/${id}/disponibilidad?fecha=${encodeURIComponent(fecha)}`, { signal }),
    reservar: (espacioId: number, inicio: string, fin: string, signal: AbortSignal) =>
      pedir<Reserva>('/reservas', {
        method: 'POST', body: JSON.stringify({ espacioId, inicio, fin }), signal,
      }),
  }
}
