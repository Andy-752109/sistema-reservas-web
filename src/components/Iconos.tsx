// Íconos de línea dibujados con SVG. Son decorativos: aria-hidden para que
// los lectores de pantalla no los lean.
import type { ReactNode } from 'react'

type Props = { className?: string }

function Svg({ className, children }: Props & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconoCalendario(props: Props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4M8 14h2M14 14h2M8 17.5h2" />
    </Svg>
  )
}

export function IconoCubiculo(props: Props) {
  return (
    <Svg {...props}>
      <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14M2.5 20h19M9 20v-5h6v5M8 8h2M14 8h2" />
    </Svg>
  )
}

export function IconoLaboratorio(props: Props) {
  return (
    <Svg {...props}>
      <path d="M9 3h6M10 3v6.5L4.6 18.2A1.8 1.8 0 0 0 6.1 21h11.8a1.8 1.8 0 0 0 1.5-2.8L14 9.5V3M7.5 15h9" />
    </Svg>
  )
}

export function IconoCancha(props: Props) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M2.5 9.5h3v5h-3M21.5 9.5h-3v5h3" />
    </Svg>
  )
}

export function IconoReloj(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  )
}

export function IconoCheck(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.7 2.7L16 9.7" />
    </Svg>
  )
}

export function IconoBuscar(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </Svg>
  )
}

export function IconoPersonas(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.6.6 2.7 2.2 3 4.7" />
    </Svg>
  )
}

export function IconoUbicacion(props: Props) {
  return (
    <Svg {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </Svg>
  )
}

export function IconoFlecha(props: Props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  )
}
