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