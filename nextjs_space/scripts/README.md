# Scripts de Deployment

## Descripción

Este directorio contiene scripts para facilitar el deployment de INMOVA a Vercel.

## Scripts Disponibles

### 1. `setup-vercel.sh`

**Propósito:** Configuración inicial de Vercel para el proyecto.

**Uso:**
```bash
chmod +x scripts/setup-vercel.sh
./scripts/setup-vercel.sh
```

**¿Qué hace?**
- Instala Vercel CLI si no está presente
- Te autentica en Vercel
- Te guía para obtener tu token
- Vincula el proyecto con Vercel
- Configura variables de entorno
- Extrae y guarda Project ID y Org ID

**Cuándo usarlo:** Solo la primera vez o cuando configures un nuevo proyecto.

---

### 2. `deploy.sh`

**Propósito:** Deploy manual rápido a Vercel.

**Uso:**
```bash
chmod +x scripts/deploy.sh

# Preview deployment (temporal)
./scripts/deploy.sh

# Production deployment (inmova.app)
./scripts/deploy.sh prod
```

**¿Qué hace?**
- Verifica configuración de Vercel
- Instala dependencias
- Genera Prisma Client
- Ejecuta linting
- Build del proyecto
- Deploy a Vercel
- Muestra URL del deployment

**Cuándo usarlo:** Cuando quieras hacer un deployment manual rápido.

---

## Flujo de Trabajo Recomendado

### Primera vez:

1. **Configurar Vercel:**
   ```bash
   ./scripts/setup-vercel.sh
   ```

2. **Hacer primer deployment:**
   ```bash
   ./scripts/deploy.sh
   ```

3. **Verificar que funcione:**
   - Abre la URL proporcionada
   - Verifica que la app cargue correctamente

4. **Deploy a producción:**
   ```bash
   ./scripts/deploy.sh prod
   ```

### Desarrollo continuo:

1. **Cambios pequeños (preview):**
   ```bash
   ./scripts/deploy.sh
   ```

2. **Cambios importantes (production):**
   ```bash
   ./scripts/deploy.sh prod
   ```

3. **CI/CD automático:**
   - Push a `main` → Deploy automático a producción
   - Pull Request → Deploy automático de preview

---

## Configuración de GitHub Actions

Para habilitar CI/CD automático:

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Agrega estos secrets:

```
VERCEL_TOKEN=<tu_token>
VERCEL_ORG_ID=<tu_org_id>
VERCEL_PROJECT_ID=<tu_project_id>
DATABASE_URL=<tu_database_url>
NEXTAUTH_SECRET=<tu_nextauth_secret>
NEXTAUTH_URL=https://inmova.app
```

4. Los deployments serán automáticos en cada push/PR

---

## Troubleshooting

### Error: "Permission denied"

**Solución:**
```bash
chmod +x scripts/*.sh
```

### Error: "VERCEL_TOKEN not configured"

**Solución:**
1. Ejecuta `./scripts/setup-vercel.sh`
2. O configura manualmente en `nextjs_space/.env`:
   ```
   VERCEL_TOKEN=tu_token_aqui
   ```

### Error: "Project not linked"

**Solución:**
```bash
cd nextjs_space
vercel link
```

### Error: "Build failed"

**Solución:**
```bash
# Limpiar y reinstalar
cd nextjs_space
rm -rf node_modules .next
yarn install
yarn build
```

---

## Variables de Entorno Requeridas

### En local (.env):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- Todas las variables de la app

### En Vercel Dashboard:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AWS_*` (todas las de AWS)
- `STRIPE_*` (todas las de Stripe)
- Y todas las demás del .env

---

## Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver deployments
vercel ls

# Rollback a deployment anterior
vercel rollback [deployment-url]

# Ver info del proyecto
vercel inspect

# Alias de dominio
vercel alias set [deployment-url] inmova.app
```

---

## Recursos

- [Guía completa de deployment](../DEPLOYMENT_GUIDE.md)
- [Documentación de Vercel](https://vercel.com/docs)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## Soporte

Si tienes problemas:
1. Revisa los logs con `vercel logs`
2. Consulta `DEPLOYMENT_GUIDE.md`
3. Verifica las variables de entorno
4. Contacta al equipo de desarrollo
