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

## Mis reservas — preparación del issue #38

`src/pages/MisReservas.tsx` prepara el historial personal con carga, lista vacía,
errores con reintento y estados ACTIVA, CANCELADA y FINALIZADA. Muestra el espacio
por su identificador (la respuesta de reservas no incluye el nombre) y los horarios
en `America/Mexico_City`. Solo ofrece cancelar reservas ACTIVAS, pide confirmación,
impide envíos duplicados y conserva la fila con el estado devuelto por el servidor.
Un error al cancelar mantiene el estado previo y permite reintentar.

`src/reservas/api-reservas.ts` consume `GET /reservas` y `DELETE /reservas/:id`
mediante una función `pedir` compatible con el cliente del login #34 / PR Web #6.
La pantalla recibe `usuarioId` de la sesión y limita la lista a sus reservas;
esto también se aplica a ADMIN, a quien la API devuelve todas las reservas.
El filtrado visual no sustituye los permisos de propiedad que verifica el backend.

**Integración pendiente:** al preparar esta rama desde `develop`, el PR Web #6
todavía no está fusionado. No se duplica el login ni se altera `App.tsx`: esta
pantalla aún no está conectada al router ni accesible en la aplicación principal.
El issue #38 no está terminado hasta integrar y probar el flujo autenticado.

Después de fusionar el #6 y actualizar esta rama, reutilizar su cliente y contexto:

```tsx
import { pedir } from './api/cliente'
import { useAuth } from './auth/AuthContext'
import MisReservas from './pages/MisReservas'
import { crearApiReservas } from './reservas/api-reservas'

// Mantener la identidad del adaptador estable entre renders.
const apiReservas = crearApiReservas(pedir)

function PaginaMisReservas() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return <MisReservas api={apiReservas} usuarioId={usuario.id} />
}
```

Registrar `/mis-reservas` dentro de `RutaPrivada` y añadir un enlace en la navegación
de la sesión. `pedir` conserva la responsabilidad de configurar la URL runtime,
enviar Bearer y cerrar la sesión ante 401. Al desmontar la pantalla o cambiar de
cuenta se abortan las peticiones y se ignoran respuestas antiguas.

Pruebas: `npm test` cubre la pantalla con un servicio controlado y el contrato del
adaptador; no usa cuentas ni modifica reservas en Azure. La integración posterior
debe comprobar redirección al login, Bearer, listado propio y cancelación en una
base local o de pruebas con datos desechables, nunca usando reservas reales de Prod.
