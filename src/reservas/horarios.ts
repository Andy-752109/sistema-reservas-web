import type { BloqueLibre } from './api-disponibilidad'

export function fechaInicial(): string {
  const partes = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)!.value
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}

export function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha.startsWith('0000')) return false
  const date = new Date(`${fecha}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === fecha
}

// Las opciones son instantes absolutos de la API: no se interpretan en la zona del equipo.
// Se incluyen los extremos incluso si una reserva existente termina fuera de la cuadrícula.
export function opcionesHorario(bloque: BloqueLibre): string[] {
  const inicio = Date.parse(bloque.inicio)
  const fin = Date.parse(bloque.fin)
  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || inicio >= fin) return []
  const opciones: string[] = []
  for (let instante = inicio; instante < fin; instante += 15 * 60_000) {
    opciones.push(new Date(instante).toISOString())
  }
  opciones.push(new Date(fin).toISOString())
  return opciones
}

export function hora(iso: string, zonaHoraria: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: zonaHoraria, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso))
}
