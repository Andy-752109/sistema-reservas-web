# Sistema de Reservas de Espacios Universitarios — Web

Frontend en React + TypeScript + Vite que consume la API de [`sistema-reservas-api`](https://github.com/Andy-752109/sistema-reservas-api).

Los issues, el reparto de roles y las reglas de trabajo están en ese repo. Para empezar aquí, toma el issue [#30](https://github.com/Andy-752109/sistema-reservas-api/issues/30).

Cada PR apunta a `develop` y cierra su issue con `Closes Andy-752109/sistema-reservas-api#n`.

## Puesta en marcha local

**Requisitos:** Node.js 22 (22.22.2 o posterior) o Node.js 24 (24.15 o posterior), y npm.

```bash
git clone https://github.com/Andy-752109/sistema-reservas-web.git
cd sistema-reservas-web
npm install
npm run dev
```

La aplicación queda en <http://localhost:5173>.

## Integración continua

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) corre en cada PR hacia `develop` o `main`, en cada push a `main` y a mano. Ejecuta `npm ci`, `npm run lint`, `npm test` y `npm run build` con Node 22. Los resultados de las pruebas se publican como el check **Resultados de pruebas (Vitest)** y se guardan 14 días como artefacto `reportes-pruebas`.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila TypeScript y genera la versión de producción en `dist/` |
| `npm run lint` | Revisa el código con ESLint |
| `npm test` | Corre las pruebas unitarias con Vitest |
## Configuración por ambiente

La URL de la API, el ambiente y la versión **no** se fijan al compilar: se leen al abrir la página desde `config.js`. Así la misma imagen de Docker sirve en Dev y en Prod.

| Dónde | De dónde sale `config.js` |
|-------|---------------------------|
| Desarrollo local | `public/config.js` (API en `http://localhost:3000`, ambiente `LOCAL`) |
| Contenedor | Lo genera `docker/40-generar-config.sh` al iniciar, con las variables `API_URL`, `AMBIENTE` y `APP_VERSION` |

El ambiente y la versión se muestran en el pie de página.

## Contenedor

El `Dockerfile` compila con Node 22 y sirve `dist/` con **nginx 1.30 (alpine)** en el puerto 80, el mismo `WEBSITES_PORT` que configura Terraform en Azure. `docker/nginx.conf` agrega el fallback de SPA (cualquier ruta carga `index.html`), `no-store` para `config.js` y caché larga para `assets/`.

```bash
docker build -t reservas-web:local .
docker run --rm -p 8080:80 \
  -e API_URL=http://localhost:3000 -e AMBIENTE=LOCAL -e APP_VERSION=dev \
  reservas-web:local
# http://localhost:8080
```

El workflow **Docker** construye la imagen para `linux/amd64` en cada PR, sin publicarla; el CD (#53) la publica en Docker Hub como `<usuario>/reservas-web`.

## Sesión y rutas

- `/login` y `/registro` son públicas. Las demás rutas pasan por `RutaPrivada`: sin sesión, mandan al login y después regresan a donde iba el usuario.
- `POST /login` devuelve un JWT que se guarda en `localStorage` (`reservas.token`). Todas las peticiones de `src/api/cliente.ts` lo envían como `Authorization: Bearer`.
- Si la API responde 401, la sesión se cierra sola y se vuelve al login. El token también se descarta al vencer (`exp`).
- El registro (`POST /usuarios`) siempre crea un estudiante e inicia sesión enseguida.
