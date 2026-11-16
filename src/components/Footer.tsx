import { obtenerConfig } from '../config'

export default function Footer() {
  const { ambiente, version } = obtenerConfig()

  return (
    <footer className="footer">
      Sistema de Reservas · Ambiente: <strong>{ambiente}</strong> · Versión:{' '}
      <strong>{version}</strong>
    </footer>
  )
}
