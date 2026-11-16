// Configuración para desarrollo local.
// En el contenedor, docker/40-generar-config.sh reemplaza este archivo al iniciar
// con los valores de las variables de entorno API_URL, AMBIENTE y APP_VERSION.
window.__CONFIG__ = {
  apiUrl: 'http://localhost:3000',
  ambiente: 'LOCAL',
  version: 'dev',
}
