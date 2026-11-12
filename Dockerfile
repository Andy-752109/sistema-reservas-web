# syntax=docker/dockerfile:1

# ── build: dependencias y compilación con Vite ──────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── runtime: nginx sirve dist/ ───────────────────────────────────────────────
# 1.30 es la rama estable de nginx: recibe parches de seguridad sin cambios grandes.
FROM nginx:1.30-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# La imagen de nginx ejecuta al arrancar los scripts de /docker-entrypoint.d/:
# este genera config.js con API_URL, AMBIENTE y APP_VERSION del ambiente.
COPY --chmod=755 docker/40-generar-config.sh /docker-entrypoint.d/40-generar-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

# App Service enruta al puerto indicado en WEBSITES_PORT (80 en Terraform).
EXPOSE 80
