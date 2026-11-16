import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { ApiEspacios, Espacio } from '../espacios/api-espacios'
import './Catalogo.css'

// La API manda el tipo en mayúsculas; aquí se muestra con un nombre legible.
const NOMBRES_TIPO: Record<string, string> = {
  CUBICULO: 'Cubículo',
  LABORATORIO: 'Laboratorio',
  CANCHA: 'Cancha',
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

  if (cargando) return <p>Cargando espacios…</p>
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
    <main>
      <h1>Espacios</h1>
      <label className="filtro">
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

      {visibles.length === 0 ? (
        <p>No hay espacios disponibles.</p>
      ) : (
        <ul className="catalogo">
          {visibles.map((espacio) => (
            <li key={espacio.id} className="tarjeta-espacio">
              <h2>{espacio.nombre}</h2>
              <p>
                {nombreTipo(espacio.tipo)} · {espacio.capacidad} personas
              </p>
              <p>{espacio.ubicacion}</p>
              <Link to={`/espacios/${espacio.id}/reservar`}>Ver horarios y reservar</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}