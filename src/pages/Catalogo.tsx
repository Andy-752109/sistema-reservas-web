import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { ApiEspacios, Espacio } from '../espacios/api-espacios'
import {
  IconoBuscar,
  IconoCancha,
  IconoCubiculo,
  IconoFlecha,
  IconoLaboratorio,
  IconoPersonas,
  IconoUbicacion,
} from '../components/Iconos'
import './Catalogo.css'

// La API manda el tipo en mayúsculas; aquí se muestra con un nombre legible.
const NOMBRES_TIPO: Record<string, string> = {
  CUBICULO: 'Cubículo',
  LABORATORIO: 'Laboratorio',
  CANCHA: 'Cancha',
}

const ICONOS_TIPO: Record<string, typeof IconoCubiculo> = {
  CUBICULO: IconoCubiculo,
  LABORATORIO: IconoLaboratorio,
  CANCHA: IconoCancha,
}

function nombreTipo(tipo: string): string {
  return NOMBRES_TIPO[tipo] ?? tipo
}

export default function Catalogo({ api }: { api: ApiEspacios }) {
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState('TODOS')

  // Pide los espacios una vez, al abrir la pantalla.
  useEffect(() => {
    let activo = true // evita actualizar la pantalla si ya se cerró
    api
      .listar()
      .then((lista) => {
        if (activo) setEspacios(lista)
      })
      .catch((e: unknown) => {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudieron cargar los espacios.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [api])

  if (cargando) return <p className="estado-carga">Cargando espacios…</p>
  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  // Tipos que existen en la lista, para armar el filtro sin escribirlos a mano.
  const tipos = [...new Set(espacios.map((e) => e.tipo))]
  const visibles = tipo === 'TODOS' ? espacios : espacios.filter((e) => e.tipo === tipo)

  return (
    <main className="pagina-catalogo">
      <header className="catalogo-encabezado">
        <div>
          <h1>Espacios</h1>
          <p className="subtitulo">Elige un espacio para ver sus horarios libres.</p>
        </div>
        <label className="filtro">
          <IconoBuscar className="icono-chico" />
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="TODOS">Todos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {nombreTipo(t)}
              </option>
            ))}
          </select>
        </label>
      </header>

      {visibles.length === 0 ? (
        <p className="vacio">No hay espacios disponibles.</p>
      ) : (
        <ul className="catalogo">
          {visibles.map((espacio) => {
            const Icono = ICONOS_TIPO[espacio.tipo] ?? IconoCubiculo
            return (
              <li key={espacio.id} className={`tarjeta-espacio tipo-${espacio.tipo.toLowerCase()}`}>
                <span className="tarjeta-icono">
                  <Icono />
                </span>
                <h2>{espacio.nombre}</h2>
                <p className="tarjeta-dato">
                  <IconoPersonas className="icono-chico" />
                  {nombreTipo(espacio.tipo)} · {espacio.capacidad} personas
                </p>
                <p className="tarjeta-dato">
                  <IconoUbicacion className="icono-chico" />
                  {espacio.ubicacion}
                </p>
                <Link to={`/espacios/${espacio.id}/reservar`} className="tarjeta-accion">
                  Ver horarios y reservar
                  <IconoFlecha className="icono-chico" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
