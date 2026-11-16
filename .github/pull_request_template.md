## ¿Qué cambia?

<!-- Resumen breve del cambio. -->

Closes Andy-752109/sistema-reservas-api#

## Tipo de cambio

- [ ] Funcionalidad (`feature/*`)
- [ ] Corrección (`fix/*` / `hotfix/*`)
- [ ] Infraestructura / CI/CD
- [ ] Documentación

## ¿Cómo se probó?

- [ ] `npm test` pasa en local
- [ ] `npm run build` compila sin errores
- [ ] Probado manualmente (Swagger / Postman / web)

## Definición de terminado

- [ ] La rama sale de `develop` actualizado y el PR apunta a `develop` (o `develop` → `main` para liberar). Sin PR encadenados: si la tarea es grande, se divide en issues
- [ ] El issue relacionado cumple sus criterios de aceptación
- [ ] El CI está en verde (cuando exista el #52)
- [ ] Pedí revisión a quien corresponde (Ramiro → Ale, Ale → Andy, Andy → Ramiro); se revisa en menos de 24 h
- [ ] Si usa un endpoint nuevo o modificado de la API: está en `develop` de la API y en su Swagger (enlaza el PR)
- [ ] Si cambian variables de entorno o puertos: documentado y aviso a Andy (infra)
- [ ] Se actualizó la documentación (README / Wiki) si aplica
- [ ] Después del merge: probado en Dev contra la API de Dev (cuando exista el CD)
