import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorApi, pedir } from '../api/cliente'
import { crearApiDisponibilidad, type Disponibilidad, type Espacio } from '../reservas/api-disponibilidad'
import { fechaInicial, fechaValida, hora, opcionesHorario } from '../reservas/horarios'
import type { Reserva } from '../reservas/api-reservas'
import './ReservarEspacio.css'

const api = crearApiDisponibilidad(pedir)
type Carga = { estado: 'cargando' } | { estado: 'error'; mensaje: string }
  | { estado: 'lista'; espacio: Espacio; disponibilidad: Disponibilidad }

function mensaje(error: unknown, alternativa: string): string {
  return error instanceof Error ? error.message : alternativa
}

export default function ReservarEspacio() {
  const { id } = useParams()
  const espacioId = Number(id)
  if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(espacioId) || espacioId < 1 || espacioId > 2147483647) {
    return <main><h1>Reservar espacio</h1><p role="alert">El identificador del espacio no es válido.</p><Link to="/">Volver al catálogo</Link></main>
  }
  return <FormularioReserva key={espacioId} espacioId={espacioId} />
}

function FormularioReserva({ espacioId }: { espacioId: number }) {
  const [fecha, setFecha] = useState(fechaInicial)
  const [revision, setRevision] = useState(0)
  const [carga, setCarga] = useState<Carga>({ estado: 'cargando' })
  const [bloqueElegido, setBloqueElegido] = useState<number | null>(null)
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [creada, setCreada] = useState<Reserva | null>(null)
  const controller = useRef<AbortController | null>(null)
  const envioEnCurso = useRef(false)

  useEffect(() => {
    if (!fechaValida(fecha)) return
    const actual = new AbortController()
    controller.current = actual
    Promise.all([api.espacio(espacioId, actual.signal), api.consultar(espacioId, fecha, actual.signal)]).then(
      ([espacio, disponibilidad]) => {
        if (!actual.signal.aborted) setCarga({ estado: 'lista', espacio, disponibilidad })
      },
      (e: unknown) => {
        if (!actual.signal.aborted) setCarga({ estado: 'error', mensaje: mensaje(e, 'No se pudo consultar la disponibilidad.') })
      },
    )
    return () => actual.abort()
  }, [espacioId, fecha, revision])

  function recargar() {
    setCarga({ estado: 'cargando' })
    setBloqueElegido(null)
    setInicio('')
    setFin('')
    setRevision((n) => n + 1)
  }

  const disponibilidad = carga.estado === 'lista' ? carga.disponibilidad : null
  const bloque = bloqueElegido === null ? null : disponibilidad?.bloquesLibres[bloqueElegido]
  const opciones = bloque ? opcionesHorario(bloque) : []

  async function reservar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (envioEnCurso.current || !bloque || !controller.current || controller.current.signal.aborted) return
    if (!opciones.includes(inicio) || !opciones.includes(fin) || Date.parse(inicio) >= Date.parse(fin)) {
      setError('Selecciona un inicio anterior al fin dentro del bloque libre.')
      return
    }
    const actual = controller.current
    envioEnCurso.current = true
    setEnviando(true)
    setError(null)
    try {
      const reserva = await api.reservar(espacioId, inicio, fin, actual.signal)
      if (!actual.signal.aborted) setCreada(reserva)
    } catch (e: unknown) {
      if (actual.signal.aborted) return
      if (e instanceof ErrorApi && e.status === 409) {
        setError('Ese horario acaba de ocuparse. Actualizamos los bloques libres; elige otro horario.')
        recargar()
      } else setError(mensaje(e, 'No se pudo crear la reserva. Intenta de nuevo.'))
    } finally {
      if (!actual.signal.aborted) {
        envioEnCurso.current = false
        setEnviando(false)
      }
    }
  }

  return (
    <main className="reservar-espacio">
      <Link to="/">Volver al catálogo</Link>
      <h1>{carga.estado === 'lista' ? `Reservar: ${carga.espacio.nombre}` : 'Reservar espacio'}</h1>
      {creada ? (
        <section>
          <p role="status">Reserva #{creada.id} creada correctamente.</p>
          <p>Fecha: {fecha}. Horario: {hora(creada.inicio, disponibilidad!.zonaHoraria)}–{hora(creada.fin, disponibilidad!.zonaHoraria)} ({disponibilidad!.zonaHoraria}).</p>
          <Link to="/mis-reservas">Ver mis reservas</Link>
          <button type="button" onClick={() => { setCreada(null); setError(null); recargar() }}>Hacer otra reserva</button>
        </section>
      ) : (
        <>
          <label className="reservar-fecha">Fecha
            <input type="date" value={fecha} disabled={enviando} onChange={(event) => {
              setFecha(event.target.value)
              setError(null)
              recargar()
            }} />
          </label>
          {!fechaValida(fecha) && <p role="alert">Selecciona una fecha válida.</p>}
          {error && <p role="alert">{error}</p>}
          {fechaValida(fecha) && carga.estado === 'cargando' && <p role="status">Consultando disponibilidad…</p>}
          {fechaValida(fecha) && carga.estado === 'error' && <div><p role="alert">{carga.mensaje}</p><button type="button" onClick={recargar}>Reintentar</button></div>}
          {carga.estado === 'lista' && fechaValida(fecha) && (
            <>
              <p>{carga.espacio.tipo} · Capacidad: {carga.espacio.capacidad} · {carga.espacio.ubicacion}</p>
              <p>Horarios en {disponibilidad!.zonaHoraria}. La disponibilidad puede cambiar hasta confirmar la reserva.</p>
              <h2>Bloques libres</h2>
              {disponibilidad!.bloquesLibres.length === 0 ? <p>No hay horarios disponibles para esta fecha.</p> : (
                <ul className="reservar-bloques">
                  {disponibilidad!.bloquesLibres.map((libre, index) => (
                    <li key={libre.inicio}><button type="button" aria-pressed={bloqueElegido === index} disabled={enviando} onClick={() => {
                      const tiempos = opcionesHorario(libre)
                      setBloqueElegido(index)
                      setInicio(tiempos[0])
                      setFin(tiempos[Math.min(2, tiempos.length - 1)])
                      setError(null)
                    }}>{hora(libre.inicio, disponibilidad!.zonaHoraria)}–{hora(libre.fin, disponibilidad!.zonaHoraria)}</button></li>
                  ))}
                </ul>
              )}
              {bloque && (
                <form className="reservar-formulario" onSubmit={(event) => void reservar(event)}>
                  <p>Elige tu horario dentro del bloque libre. Opciones cada 15 minutos y extremos del bloque.</p>
                  <label>Inicio<select value={inicio} disabled={enviando} onChange={(event) => {
                    const nuevo = event.target.value
                    setInicio(nuevo)
                    if (Date.parse(nuevo) >= Date.parse(fin)) setFin(opciones[opciones.indexOf(nuevo) + 1])
                  }}>{opciones.slice(0, -1).map((t) => <option key={t} value={t}>{hora(t, disponibilidad!.zonaHoraria)}</option>)}</select></label>
                  <label>Fin<select value={fin} disabled={enviando} onChange={(event) => setFin(event.target.value)}>
                    {opciones.filter((t) => Date.parse(t) > Date.parse(inicio)).map((t) => <option key={t} value={t}>{hora(t, disponibilidad!.zonaHoraria)}</option>)}
                  </select></label>
                  <button type="submit" disabled={enviando}>{enviando ? 'Reservando…' : 'Confirmar reserva'}</button>
                </form>
              )}
            </>
          )}
        </>
      )}
    </main>
  )
}
