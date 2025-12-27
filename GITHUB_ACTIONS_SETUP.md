# 🤖 Configuración de GitHub Actions para Vercel

## Despliegue Automático Configurado

Este proyecto ahora tiene GitHub Actions configurado para desplegar automáticamente a Vercel en cada push o pull request.

## Configuración Necesaria

### 1. Obtener Credenciales de Vercel

#### VERCEL_TOKEN
1. Ve a https://vercel.com/account/tokens (User ID: pAzq4g0vFjJlrK87sQhlw08I)
2. Crea un nuevo token con nombre `github-actions-inmova`
3. Copia el token generado

#### VERCEL_ORG_ID y VERCEL_PROJECT_ID
1. Instala Vercel CLI: `npm i -g vercel`
2. Autentica: `vercel login`
3. Vincula el proyecto: `cd /workspace && vercel link`
4. Los IDs se guardarán en `.vercel/project.json`
5. O obtén los IDs de:
   - ORG_ID: https://vercel.com/account → General Settings
   - PROJECT_ID: Settings de tu proyecto en Vercel

### 2. Configurar Secrets en GitHub

Ve a tu repositorio en GitHub:
```
Settings → Secrets and variables → Actions → New repository secret
```

Añade estos 3 secrets:

| Secret Name | Descripción | Dónde obtenerlo |
|------------|-------------|-----------------|
| `VERCEL_TOKEN` | Token de autenticación | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | ID de tu organización/cuenta | `.vercel/project.json` o Vercel dashboard |
| `VERCEL_PROJECT_ID` | ID del proyecto | `.vercel/project.json` o Vercel dashboard |

### 3. Primera Configuración (Una sola vez)

```bash
# 1. Autentica con Vercel
vercel login

# 2. Vincula el proyecto (esto creará .vercel/project.json)
cd /workspace
vercel link

# 3. Revisa los IDs generados
cat .vercel/project.json

# Verás algo como:
# {
#   "orgId": "team_xxxxxxxxxxxxx",
#   "projectId": "prj_xxxxxxxxxxxxx"
# }

# 4. Añade estos valores como secrets en GitHub
```

### 4. Sube el Código a GitHub

```bash
git add .
git commit -m "Configure Vercel deployment with GitHub Actions"
git push origin main
```

## Cómo Funciona

### Deployments Automáticos

- ✅ **Push a `main`/`master`** → Despliega a **PRODUCCIÓN**
- ✅ **Pull Request** → Despliega a **PREVIEW** (ambiente de prueba)
- ✅ **Cada commit** → Build automático para detectar errores

### Flujo de Trabajo

1. Haces push a GitHub
2. GitHub Actions se activa automáticamente
3. Instala dependencias
4. Ejecuta `prisma generate`
5. Hace build del proyecto
6. Despliega a Vercel
7. Te notifica el resultado (✅ éxito / ❌ error)

## Alternativa: Integración Directa de Vercel con GitHub

Si prefieres no usar GitHub Actions, Vercel puede integrarse directamente:

1. Ve a https://vercel.com/new
2. Clic en "Import Git Repository"
3. Selecciona tu repositorio de GitHub
4. Vercel detectará Next.js automáticamente
5. Configura las variables de entorno (ver `.env.vercel.template`)
6. Clic en "Deploy"

**Ventajas de la integración directa:**
- ✅ Más simple de configurar
- ✅ Preview deployments automáticos en PRs
- ✅ Comentarios automáticos en PRs con URLs de preview
- ✅ Rollbacks con un clic

**Ventajas de GitHub Actions:**
- ✅ Mayor control sobre el proceso de build
- ✅ Puedes añadir tests antes del deploy
- ✅ Puedes ejecutar scripts personalizados
- ✅ Mejor para proyectos complejos

## Verificación

Después de configurar, verifica que funciona:

1. Haz un cambio pequeño en el código
2. Haz commit y push
3. Ve a la pestaña "Actions" en GitHub
4. Verás el workflow ejecutándose
5. Cuando termine, tu app estará desplegada

## Variables de Entorno

Las variables de entorno deben configurarse en Vercel Dashboard:
- No se pasan desde GitHub Actions
- Se configuran una sola vez en Vercel
- Se aplican a todos los deployments

Ver `DEPLOYMENT_INSTRUCTIONS.md` para la lista completa de variables.

## Solución de Problemas

### Error: "VERCEL_TOKEN not found"
- Verifica que añadiste el secret en GitHub
- El nombre debe ser exactamente `VERCEL_TOKEN`

### Error: "Project not found"
- Verifica que `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` sean correctos
- Ejecuta `vercel link` localmente para obtener los IDs correctos

### Error: "Build failed"
- Revisa los logs en la pestaña Actions de GitHub
- Verifica que las variables de entorno estén en Vercel
- Asegúrate de que el build funciona localmente: `yarn build`

### El workflow no se ejecuta
- Verifica que el archivo esté en `.github/workflows/`
- El archivo debe tener extensión `.yml` o `.yaml`
- Haz push a la rama `main` o `master`

## Comandos Útiles

```bash
# Ver deployments
vercel list

# Ver logs del último deployment
vercel logs

# Promover un deployment a producción
vercel promote <deployment-url>

# Rollback a deployment anterior
vercel rollback
```

## Status del Deployment

Puedes ver el status en tiempo real:
- GitHub Actions: Pestaña "Actions" en tu repo
- Vercel Dashboard: https://vercel.com/dashboard
- Webhooks: Configura en Settings → Git → Deploy Hooks

---

**Configurado por**: Cursor AI Agent  
**Última actualización**: Diciembre 2024
