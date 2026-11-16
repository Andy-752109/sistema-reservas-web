#!/bin/sh
# Genera config.js al iniciar el contenedor a partir de variables de entorno.
# La imagen de nginx ejecuta automáticamente los scripts de /docker-entrypoint.d/.
set -eu

DESTINO="${CONFIG_DESTINO:-/usr/share/nginx/html/config.js}"

# Convierte un valor en una cadena JavaScript válida entre comillas dobles:
# escapa barras invertidas y comillas, y rechaza caracteres de control
# (saltos de línea, retornos de carro, tabuladores...), que no tienen sentido aquí.
cadena_js() {
  nombre="$1"
  valor="$2"
  limpio=$(printf '%s' "$valor" | tr -d '\001-\037\177')
  if [ "$limpio" != "$valor" ]; then
    echo "Error: $nombre contiene caracteres de control (p. ej. un salto de línea)" >&2
    exit 1
  fi
  escapado=$(printf '%s' "$valor" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
  printf '"%s"' "$escapado"
}

API_URL_JS=$(cadena_js API_URL "${API_URL:-http://localhost:3000}")
AMBIENTE_JS=$(cadena_js AMBIENTE "${AMBIENTE:-LOCAL}")
VERSION_JS=$(cadena_js APP_VERSION "${APP_VERSION:-dev}")

# Se escribe primero en un archivo temporal para no dejar un config.js a medias.
TEMPORAL="$DESTINO.tmp"
cat > "$TEMPORAL" <<CONFIG
window.__CONFIG__ = {
  apiUrl: $API_URL_JS,
  ambiente: $AMBIENTE_JS,
  version: $VERSION_JS,
}
CONFIG
mv "$TEMPORAL" "$DESTINO"

echo "config.js generado: ambiente=${AMBIENTE:-LOCAL} version=${APP_VERSION:-dev}"
