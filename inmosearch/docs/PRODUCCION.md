# INMOSEARCH — Puesta en producción

Guía de despliegue, programación de barridos, verificación de fuentes y **cómo convertir INMOSEARCH en un repositorio independiente**.

---

## 1. Repositorio independiente `INMOSEARCH`

El proyecto vive hoy en `inmosearch/` dentro del repo `inmova-app` (para conservarlo en GitHub). Es **autónomo** (su propio `package.json`, Prisma, tests). Para promocionarlo a su propio repo:

### Opción A — Conservando el historial (recomendada)

Desde la **raíz** del repo `inmova-app`:

```bash
# 1) Extrae el subdirectorio con su historial a una rama temporal
git subtree split --prefix=inmosearch -b inmosearch-only

# 2) Crea en GitHub un repo vacío llamado INMOSEARCH (sin README)
#    https://github.com/new

# 3) Empuja la rama extraída como 'main' del nuevo repo
git push git@github.com:dvillagrablanco/INMOSEARCH.git inmosearch-only:main

# 4) (opcional) limpia la rama temporal
git branch -D inmosearch-only
```

### Opción B — Import limpio (sin historial)

Desde **dentro** de `inmosearch/`:

```bash
./scripts/extract-to-repo.sh git@github.com:dvillagrablanco/INMOSEARCH.git
```

> El script copia el proyecto a un directorio temporal, excluye `node_modules`, `.next`, la base de datos local y `.env`, inicializa un repo git limpio y lo empuja al remoto indicado.

Después, en el nuevo repo: `npm install && cp .env.example .env && npm run db:push && npm run dev`.

---

## 2. Variables de entorno

Copia `.env.example` a `.env` y revisa. Todo funciona sin claves (con datos de mercado por defecto y sin IA). Para producción, como mínimo:

- `DATABASE_URL` — Postgres (cambia el `provider` en `prisma/schema.prisma` a `postgresql`).
- `SWEEP_SECRET` (o `CRON_SECRET` en Vercel) — protege `/api/sweep/run`.
- Opcionales: `ANTHROPIC_API_KEY` (CapEx con IA), `IDEALISTA_API_KEY/SECRET`, `CATASTRO_ENABLED`, `ALERTS_*`.

## 3. Despliegue

- **Vercel** (recomendado para Next.js): importa el repo, define las variables y `CRON_SECRET`. `vercel.json` ya incluye el cron semanal.
- **Docker / VPS**: `npm run build && npm start`. Programa el cron con `curl` (ver §5) o el workflow de GitHub Actions incluido.

Aplica el esquema en el primer despliegue: `npm run db:push` (o `prisma migrate deploy` si usas migraciones).

## 4. Programación de barridos

Cada perfil tiene su frecuencia (semanal por defecto). El cron llama a `POST /api/sweep/run` con el secreto:

```bash
curl -X POST https://TU-DOMINIO/api/sweep/run -H "Authorization: Bearer $SWEEP_SECRET"
```

- **Vercel Cron**: `vercel.json` (lunes 06:00). Define `CRON_SECRET`.
- **GitHub Actions**: `.github/workflows/sweep.yml`. Configura los secrets `SWEEP_URL` y `SWEEP_SECRET`.

## 5. Verificación de fuentes (BOE / Catastro)

Los conectores de **BOE** (parseo del portal) y **Catastro** (emparejamiento por dirección) están marcados como *beta* porque su formato debe verificarse contra los servicios reales, desde un entorno con **salida de red directa**:

```bash
npm run verify:sources            # prueba Madrid
npm run verify:sources Valencia   # otra localidad
```

El script informa de si cada fuente responde y parsea correctamente. Si BOE devuelve 0 anuncios o Catastro no encuentra coincidencias, ajusta el parser correspondiente:

- BOE: selectores/regex en `src/lib/connectors/boe.ts` (`parseResults`).
- Catastro: endpoint y parseo en `src/lib/enrichment/catastro.ts` (`parseDnp`, `splitAddress`).

## 6. Comprobaciones antes de publicar

```bash
npm run typecheck   # tipos
npm run test        # 56 pruebas del núcleo
npm run build       # build de producción
```
