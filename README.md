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

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) corre en cada PR hacia `develop` o `main`, a mano y como primer paso del CD. Ejecuta `npm ci`, `npm run lint`, `npm run test:cov` (pruebas con cobertura; falla si baja de 70 %) y `npm run build` con Node 22. La tabla de cobertura aparece en el resumen del run y el reporte HTML se guarda en el artefacto `reportes-pruebas`. Los resultados de las pruebas se publican como el check **Resultados de pruebas (Vitest)** y se guardan 14 días como artefacto `reportes-pruebas`.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila TypeScript y genera la versión de producción en `dist/` |
| `npm run lint` | Revisa el código con ESLint |
| `npm test` | Corre las pruebas unitarias con Vitest |
| `npm run test:cov` | Corre las pruebas y mide la cobertura (reporte en `coverage/index.html`) |
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

## Mis reservas — issue #38

La ruta protegida `/mis-reservas`, accesible desde la navegación de la sesión,
lista el historial del usuario y permite cancelar reservas ACTIVAS con confirmación.
Consume `GET /reservas` y `DELETE /reservas/:id` mediante el cliente `pedir` del login
(#34 / PR Web #6), que configura la URL por ambiente, envía Bearer y limpia la sesión
ante un 401. Sin sesión se redirige a login y, al ingresar, se regresa al historial.

La pantalla obtiene `usuarioId` del contexto de autenticación, también para ADMIN:
la API le devuelve todas las reservas, pero “Mis reservas” muestra solo las suyas.
El backend sigue verificando permisos y propiedad en cada operación.

Se muestran los estados ACTIVA, CANCELADA y FINALIZADA, el identificador del espacio
(la API no incluye su nombre en esta respuesta) y los horarios en
`America/Mexico_City`. Incluye carga, lista vacía, reintentos y errores. Al cancelar,
bloquea envíos duplicados, conserva la fila y usa el estado devuelto por la API.
Si la petición falla, mantiene el estado previo y permite reintentar.

El adaptador se crea una sola vez en `PaginaMisReservas.tsx`. Al salir o cambiar de
cuenta se abortan las peticiones y se ignoran respuestas antiguas. Los estilos
reutilizan las variables de la aplicación y la navegación admite pantallas pequeñas.

`npm test` cubre el componente, el adaptador y la integración del router, sesión y
cliente HTTP con respuestas controladas: login y regreso al historial, URL runtime,
Bearer, listado personal, cancelación, 401, 403, cierre de sesión y expiración local.
Estas pruebas no usan cuentas ni alteran reservas en Azure.

La prueba opcional `src/MisReservas.local.test.tsx` usa peticiones HTTP reales y
se omite por defecto. Requiere una API local contra una base temporal migrada y
un espacio activo sin reservas en el intervalo de prueba. Crea una cuenta y una
reserva de prueba, inicia sesión desde el formulario, cancela desde el historial
y verifica el estado persistido. Al terminar debe eliminarse la base temporal;
no debe apuntarse a la base de desarrollo habitual. Solo admite HTTP en localhost.

Ejemplo en PowerShell, después de preparar la API y la base desechable:

```powershell
$env:PRUEBA_API_LOCAL_URL='http://127.0.0.1:4308'
$env:PRUEBA_ESPACIO_ID='1' # ID real del espacio en esa base temporal
npm.cmd test -- src/MisReservas.local.test.tsx
Remove-Item Env:PRUEBA_API_LOCAL_URL, Env:PRUEBA_ESPACIO_ID
```

## Disponibilidad y reserva — issue #37

El catálogo (#36) puede enlazar cada espacio a **`/espacios/:id/reservar`**, por
ejemplo `/espacios/3/reservar`. Esta ruta ya está dentro de `RutaPrivada`: sin sesión
redirige al login y después regresa al formulario. No depende de que el catálogo
esté implementado y no modifica su pantalla provisional.

Consulta `GET /espacios/:id` para mostrar nombre, tipo, capacidad y ubicación, y
`GET /espacios/:id/disponibilidad?fecha=YYYY-MM-DD` al cargar, cambiar fecha o
reintentar. Muestra la zona horaria entregada por la API y permite escoger un bloque
libre y un intervalo dentro de él, con opciones cada 15 minutos y los extremos
del bloque. El inicio debe ser anterior al fin. Los valores enviados son instantes
ISO UTC derivados de las respuestas con offset, no horas interpretadas en la zona
del equipo; la fecha inicial usa Ciudad de México.

`POST /reservas` envía únicamente `{ espacioId, inicio, fin }` mediante el cliente
autenticado existente. Mientras espera bloquea envíos duplicados y cambios de
fecha/horario. Al confirmar muestra el número de reserva y un enlace a “Mis
reservas”; también permite consultar disponibilidad nuevamente para otra reserva.
Ante un 409 conserva la fecha, explica el conflicto, borra la selección anterior y
recarga los bloques antes de permitir otro intento. No asume que disponibilidad
equivale a apartar un horario; la API valida el traslape al crear.

Incluye estados de carga, fecha inválida, ausencia de bloques, error de consulta con
reintento y errores de creación. El cliente reutilizado maneja el 401 cerrando sesión.
Las respuestas tardías de una consulta anterior se ignoran al cambiar fecha o salir.
No modifica endpoints, horarios de operación ni reglas de negocio del backend.

`npm test` cubre los flujos con respuestas HTTP controladas y las conversiones de
horarios. La prueba opcional `src/ReservarEspacio.local.test.tsx` usa API y PostgreSQL
locales: registra dos cuentas desechables, inicia sesión desde el formulario,
consulta disponibilidad, hace que otra cuenta ocupe el horario y comprueba el 409,
la recarga y la creación en el siguiente intervalo. Verifica la persistencia mediante
GET y la navegación a “Mis reservas”. Se omite por defecto.

Para repetirla, preparar primero una API local con base temporal migrada y un espacio
activo **sin reservas** con horario 07:00–21:00 en `America/Mexico_City`. Solo admite
HTTP en localhost; no usar la base habitual ni cuentas de Azure. La base temporal
debe eliminarse al terminar. PowerShell:

```powershell
$env:PRUEBA_RESERVAR_API_URL='http://127.0.0.1:4307'
$env:PRUEBA_RESERVAR_ESPACIO_ID='1' # ID real del espacio temporal
npm.cmd test -- src/ReservarEspacio.local.test.tsx
Remove-Item Env:PRUEBA_RESERVAR_API_URL, Env:PRUEBA_RESERVAR_ESPACIO_ID
```

## Sesión y rutas

- `/login` y `/registro` son públicas. Las demás rutas pasan por `RutaPrivada`: sin sesión, mandan al login y después regresan a donde iba el usuario.
- `POST /login` devuelve un JWT que se guarda en `localStorage` (`reservas.token`). Todas las peticiones de `src/api/cliente.ts` lo envían como `Authorization: Bearer`.
- Si la API responde 401, la sesión se cierra sola y se vuelve al login. El token también se descarta al vencer (`exp`).
- El registro (`POST /usuarios`) siempre crea un estudiante e inicia sesión enseguida.

## Despliegue continuo

Cada liberación a `main` dispara [`.github/workflows/cd.yml`](.github/workflows/cd.yml):

```
push a main ─► Build y pruebas ─► Imagen Docker (tag del SHA) ─► Dev + smoke test
                                                               └─► aprobación manual ─► Prod + smoke test
```

- Dev y Prod reciben **la misma imagen**; `API_URL` y `AMBIENTE` son app settings de cada Web App (Terraform) y `APP_VERSION` es el SHA corto del commit, que aparece en el pie de página.
- Prod espera la aprobación de un integrante (environment `production`).
- El smoke test exige que `config.js` tenga la versión, el ambiente y la API correctos, que la SPA responda en `/` y `/login`, y que la API del mismo ambiente esté arriba y acepte este origen por CORS.
- Azure se autentica con OIDC, sin contraseñas guardadas en GitHub.
