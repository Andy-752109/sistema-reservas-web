#!/bin/sh
# Genera config.js al iniciar el contenedor a partir de variables de entorno.
# La imagen de nginx ejecuta automáticamente los scripts de /docker-entrypoint.d/.
set -eu

DESTINO="${CONFIG_DESTINO:-/usr/share/nginx/html/config.js}"

cat > "$DESTINO" <<CONFIG
window.__CONFIG__ = {
  apiUrl: "${API_URL:-http://localhost:3000}",
  ambiente: "${AMBIENTE:-LOCAL}",
  version: "${APP_VERSION:-dev}",
}
CONFIG

echo "config.js generado: ambiente=${AMBIENTE:-LOCAL} version=${APP_VERSION:-dev}"
