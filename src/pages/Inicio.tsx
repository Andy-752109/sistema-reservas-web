import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import {
  IconoCalendario,
  IconoCancha,
  IconoCheck,
  IconoCubiculo,
  IconoFlecha,
  IconoLaboratorio,
  IconoReloj,
} from '../components/Iconos'

const TIPOS = [
  {
    nombre: 'Cubículos',
    texto: 'Para estudiar o trabajar en equipo.',
    Icono: IconoCubiculo,
    clase: 'tipo-cubiculo',
  },
  {
    nombre: 'Laboratorios',
    texto: 'Equipos especializados para prácticas.',
    Icono: IconoLaboratorio,
    clase: 'tipo-laboratorio',
  },
  {
    nombre: 'Canchas',
    texto: 'Espacios deportivos al aire libre.',
    Icono: IconoCancha,
    clase: 'tipo-cancha',
  },
]

const PASOS = [
  {
    titulo: 'Elige un espacio',
    texto: 'Filtra el catálogo por tipo.',
    Icono: IconoCalendario,
  },
  {
    titulo: 'Escoge tu horario',
    texto: 'Solo ves los bloques libres.',
    Icono: IconoReloj,
  },
  {
    titulo: 'Confirma',
    texto: 'Consulta o cancela en Mis reservas.',
    Icono: IconoCheck,
  },
]

export default function Inicio() {
  const { usuario } = useAuth()

  return (
    <main className="inicio">
      <section className="hero">
        <div className="hero-texto">
          <span className="etiqueta">Espacios universitarios</span>
          <h1>Sistema de Reservas</h1>
          <p>Reserva cubículos, laboratorios y canchas sin empalmes (Prueba).</p>
          <p className="hero-sesion">Sesión iniciada como {usuario?.rol.toLowerCase()}.</p>
          <div className="hero-acciones">
            <Link to="/espacios" className="boton">
              Ver los espacios y reservar
              <IconoFlecha className="icono-chico" />
            </Link>
            <Link to="/mis-reservas" className="boton boton-claro">
              Ver mis reservas
            </Link>
          </div>
        </div>
        <div className="hero-ilustracion" aria-hidden="true">
          <IconoCalendario />
        </div>
      </section>

      <section aria-labelledby="titulo-tipos">
        <h2 id="titulo-tipos" className="titulo-seccion">
          ¿Qué puedes reservar?
        </h2>
        <ul className="tipos">
          {TIPOS.map(({ nombre, texto, Icono, clase }) => (
            <li key={nombre}>
              <Link to="/espacios" className={`tipo ${clase}`}>
                <span className="tipo-icono">
                  <Icono />
                </span>
                <span className="tipo-nombre">{nombre}</span>
                <span className="tipo-texto">{texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-pasos">
        <h2 id="titulo-pasos" className="titulo-seccion">
          Así de fácil
        </h2>
        <ol className="pasos">
          {PASOS.map(({ titulo, texto, Icono }, i) => (
            <li key={titulo} className="paso">
              <span className="paso-numero">{i + 1}</span>
              <Icono className="paso-icono" />
              <div>
                <strong>{titulo}</strong>
                <p>{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
