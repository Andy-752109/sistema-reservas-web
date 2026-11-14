import { useEffect, useRef, useState } from 'react'
import type { ApiReservas, Reserva } from '../reservas/api-reservas'
import './MisReservas.css'

interface Props {
  api: ApiReservas
  usuarioId: number
}

type Resultado =
  | { fase: 'cargando' }
  | { fase: 'error'; mensaje: string }
  | { fase: 'lista'; reservas: Reserva[] }

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City',
})

function mensajeError(error: unknown, alternativa: string): string {
  return error instanceof Error && error.message ? error.message : alternativa
}

// Remontar al cambiar de cuenta impide conservar datos o acciones del usuario anterior.
export default function MisReservas(props: Props) {
  return <ContenidoMisReservas key={props.usuarioId} {...props} />
}

function ContenidoMisReservas({ api, usuarioId }: Props) {
  const [resultado, setResultado] = useState<Resultado>({ fase: 'cargando' })
  const [recarga, setRecarga] = useState(0)
  const [confirmando, setConfirmando] = useState<number | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const peticion = useRef<AbortController | null>(null)
  const enCurso = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    peticion.current = controller
    api.listar(controller.signal).then(
      (reservas) => {
        if (controller.signal.aborted) return
        // La API devuelve todas las reservas a ADMIN: esta pantalla siempre es personal.
        setResultado({ fase: 'lista', reservas: reservas.filter((r) => r.usuarioId === usuarioId) })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setResultado({ fase: 'error', mensaje: mensajeError(error, 'No se pudieron cargar tus reservas.') })
      },
    )
    return () => {
      controller.abort()
    }
  }, [api, usuarioId, recarga])

  async function cancelar(id: number) {
    if (enCurso.current) return
    const controller = peticion.current
    if (!controller || controller.signal.aborted) return
    enCurso.current = true
    setCancelando(id)
    setErrorCancelacion(null)
    setAviso('')
    try {
      const actualizada = await api.cancelar(id, controller.signal)
      if (controller.signal.aborted) return
      setResultado((previo) => previo.fase === 'lista'
        ? { fase: 'lista', reservas: previo.reservas.map((r) => r.id === id ? actualizada : r) }
        : previo)
      setConfirmando(null)
      setAviso(`La reserva #${id} se canceló. Se conserva en tu historial.`)
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      setErrorCancelacion(mensajeError(error, 'No se pudo cancelar la reserva. Intenta de nuevo.'))
    } finally {
      if (!controller.signal.aborted) {
        enCurso.current = false
        setCancelando(null)
      }
    }
  }

  return (
    <main className="mis-reservas">
      <header>
        <h1>Mis reservas</h1>
        <p>Consulta tu historial y cancela las reservas que ya no necesites.</p>
        <p className="mis-reservas-zona">Horarios de Ciudad de México.</p>
      </header>
      {aviso && <p role="status">{aviso}</p>}
      {resultado.fase === 'cargando' && <p role="status">Cargando tus reservas…</p>}
      {resultado.fase === 'error' && (
        <div>
          <p role="alert">{resultado.mensaje}</p>
          <button type="button" onClick={() => {
            setResultado({ fase: 'cargando' })
            setRecarga((n) => n + 1)
          }}>Reintentar</button>
        </div>
      )}
      {resultado.fase === 'lista' && resultado.reservas.length === 0 && (
        <p>Aún no tienes reservas.</p>
      )}
      {resultado.fase === 'lista' && resultado.reservas.length > 0 && (
        <ul className="mis-reservas-lista" aria-label="Historial de reservas">
          {resultado.reservas.map((reserva) => (
            <li key={reserva.id}>
              <article aria-labelledby={`reserva-${reserva.id}`}>
                <div className="mis-reservas-titulo">
                  <h2 id={`reserva-${reserva.id}`}>Reserva #{reserva.id}</h2>
                  <span className={`mis-reservas-estado estado-${reserva.estado.toLowerCase()}`}>
                    {reserva.estado}
                  </span>
                </div>
                <p>Espacio #{reserva.espacioId}</p>
                <dl>
                  <div><dt>Inicio</dt><dd><time dateTime={reserva.inicio}>{formatoFecha.format(new Date(reserva.inicio))}</time></dd></div>
                  <div><dt>Fin</dt><dd><time dateTime={reserva.fin}>{formatoFecha.format(new Date(reserva.fin))}</time></dd></div>
                </dl>
                {reserva.estado === 'ACTIVA' && confirmando !== reserva.id && (
                  <button type="button" disabled={cancelando !== null} onClick={() => {
                    setConfirmando(reserva.id)
                    setErrorCancelacion(null)
                    setAviso('')
                  }}>Cancelar reserva #{reserva.id}</button>
                )}
                {confirmando === reserva.id && (
                  <div className="mis-reservas-confirmacion" role="group" aria-label={`Confirmar cancelación de reserva #${reserva.id}`}>
                    <p>¿Quieres cancelar esta reserva? El espacio quedará disponible y la reserva se conservará en tu historial.</p>
                    {errorCancelacion && <p role="alert">{errorCancelacion}</p>}
                    <div className="mis-reservas-acciones">
                      <button type="button" disabled={cancelando !== null} onClick={() => void cancelar(reserva.id)}>
                        {cancelando === reserva.id ? 'Cancelando…' : `Sí, cancelar reserva #${reserva.id}`}
                      </button>
                      <button type="button" disabled={cancelando !== null} onClick={() => {
                        setConfirmando(null)
                        setErrorCancelacion(null)
                      }}>Conservar reserva #{reserva.id}</button>
                    </div>
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
