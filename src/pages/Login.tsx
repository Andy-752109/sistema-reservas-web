import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ErrorApi } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { usuario, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const estado = location.state as { desde?: string } | null
  const destino = estado?.desde ?? '/'

  if (usuario) return <Navigate to={destino} replace />

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion(correo, contrasena)
      navigate(destino, { replace: true })
    } catch (e) {
      setError(
        e instanceof ErrorApi && e.status === 401
          ? 'Correo o contraseña incorrectos.'
          : e instanceof Error
            ? e.message
            : 'No se pudo iniciar sesión.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="pantalla-auth">
      <h1>Iniciar sesión</h1>
      <form className="formulario" onSubmit={alEnviar}>
        <label>
          Correo
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p>
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </main>
  )
}
