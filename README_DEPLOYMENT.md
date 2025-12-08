# 🚀 Guía de Deployment para INMOVA

## 📚 Documentación Disponible

| Documento | Descripción | Cuándo usar |
|-----------|-------------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | Inicio rápido (5 min) | Empieza aquí |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Guía completa y detallada | Referencia completa |
| **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** | Resumen ejecutivo | Vista rápida |
| **[scripts/README.md](scripts/README.md)** | Documentación de scripts | Uso de scripts |

---

## ⚡ Inicio Ultra Rápido (TL;DR)

```bash
# 1. Verificar que todo está listo
./scripts/verify-setup.sh

# 2. Configurar Vercel (primera vez)
./scripts/setup-vercel.sh

# 3. Hacer deployment
./scripts/deploy.sh          # Preview
./scripts/deploy.sh prod     # Production
```

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#-prerrequisitos)
2. [Configuración Inicial](#-configuración-inicial)
3. [Deployment Manual](#-deployment-manual)
4. [CI/CD Automático](#-cicd-automático)
5. [Scripts Disponibles](#-scripts-disponibles)
6. [Troubleshooting](#-troubleshooting)

---

## ✅ Prerrequisitos

Antes de comenzar, asegúrate de tener:

- [x] Node.js 18+ instalado
- [x] Yarn instalado (`npm install -g yarn`)
- [x] Cuenta de Vercel activa
- [x] Git configurado (para CI/CD)
- [x] Acceso al repositorio de GitHub (para CI/CD)

---

## 🔧 Configuración Inicial

### Paso 1: Verificar el Setup

```bash
./scripts/verify-setup.sh
```

Este script verifica:
- ✅ Herramientas necesarias
- ✅ Archivos de configuración
- ✅ Variables de entorno
- ✅ Dependencias instaladas

### Paso 2: Configurar Vercel

```bash
./scripts/setup-vercel.sh
```

Este script te guiará para:
- 🔐 Obtener tu token de Vercel
- 🔗 Vincular el proyecto
- 💾 Guardar configuración en `.env`
- 📊 Obtener Project ID y Org ID

**Necesitarás:**
- Token de Vercel: https://vercel.com/account/tokens
- Crear con alcance "Full Account"

---

## 🚀 Deployment Manual

### Deployment de Preview (Testing)

```bash
./scripts/deploy.sh
```

**Cuándo usar:**
- Testing de nuevas features
- QA antes de producción
- Compartir previews con el equipo
- URL temporal para pruebas

### Deployment a Producción

```bash
./scripts/deploy.sh prod
```

**Cuándo usar:**
- Release de nuevas versiones
- Fixes críticos en producción
- Actualizaciones planificadas
- Deploy final de features

**⚠️ Importante:** El script te pedirá confirmación antes de deployar a producción.

---

## 🔄 CI/CD Automático

### GitHub Actions

El workflow `.github/workflows/deploy-vercel.yml` está configurado para:

**Triggers automáticos:**
- ✅ Push a `main` → Deploy a producción
- ✅ Pull Request → Deploy de preview
- ✅ Manual → "Run workflow" en GitHub

### Configurar Secrets

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Agrega estos secrets:

```
VERCEL_TOKEN          # Token de Vercel
VERCEL_ORG_ID         # ID de organización
VERCEL_PROJECT_ID     # ID del proyecto
DATABASE_URL          # URL de base de datos
NEXTAUTH_SECRET       # Secret de NextAuth
NEXTAUTH_URL          # URL de producción
```

**Obtener los valores:**
- `VERCEL_TOKEN`: https://vercel.com/account/tokens
- `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`: En `nextjs_space/.env` después de ejecutar `setup-vercel.sh`
- Resto: De tu archivo `.env`

### Variables en Vercel Dashboard

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**
4. Agrega TODAS las variables de tu `.env`:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `AWS_*`
   - `STRIPE_*`
   - Y todas las demás

**Para cada variable:**
- ✅ Selecciona: Production, Preview
- 💾 Save

---

## 🛠️ Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `verify-setup.sh` | Verifica configuración | `./scripts/verify-setup.sh` |
| `setup-vercel.sh` | Configuración inicial de Vercel | `./scripts/setup-vercel.sh` |
| `deploy.sh` | Deploy manual | `./scripts/deploy.sh [prod]` |

### Comandos Vercel CLI

```bash
# Ver logs en tiempo real
vercel logs --follow

# Listar deployments
vercel ls

# Rollback a versión anterior
vercel rollback [deployment-url]

# Ver info del proyecto
vercel inspect

# Gestionar variables de entorno
vercel env ls
vercel env add VARIABLE_NAME production
vercel env rm VARIABLE_NAME production
```

---

## 🔍 Troubleshooting

### Error: "VERCEL_TOKEN not configured"

**Solución:**
```bash
./scripts/setup-vercel.sh
```

### Error: "Build failed"

**Solución:**
```bash
cd nextjs_space
rm -rf node_modules .next
yarn install
yarn prisma generate
yarn build
```

### Error: "DATABASE_URL is not defined"

**Solución:**
1. Verifica en Vercel Dashboard → Settings → Environment Variables
2. Agrega `DATABASE_URL` para Production y Preview
3. Redeploy

### Error: "Prisma Client not initialized"

**Solución:**
```bash
cd nextjs_space
yarn prisma generate
```

### Deployment muy lento

**Solución:**
1. Verifica `vercel.json` → `maxDuration: 60`
2. Optimiza dependencias
3. Revisa logs: `vercel logs --follow`

### Error de permisos en GitHub Actions

**Solución:**
1. GitHub repo → Settings → Actions → General
2. Workflow permissions → "Read and write permissions"
3. ✅ "Allow GitHub Actions to create and approve pull requests"

---

## 📊 Monitoreo

### Vercel Dashboard
- **URL**: https://vercel.com/dashboard
- **Funciones:**
  - 📈 Analytics y métricas
  - 📝 Logs en tiempo real
  - 🚀 Historial de deployments
  - ⚙️ Configuración de variables

### GitHub Actions
- **URL**: https://github.com/[tu-repo]/actions
- **Funciones:**
  - ✅ Estado de workflows
  - 📋 Historial de deployments
  - 📝 Logs detallados

---

## ✨ Best Practices

1. **Antes de deployar:**
   - ✅ Ejecuta `./scripts/verify-setup.sh`
   - ✅ Prueba localmente con `yarn build`
   - ✅ Commit cambios a Git
   - ✅ Revisa que tests pasen

2. **Durante deployment:**
   - 📊 Monitorea logs
   - 👀 Verifica console del browser
   - 🔍 Revisa errores en Vercel Dashboard

3. **Después de deployment:**
   - ✅ Verifica funcionalidades críticas
   - ✅ Prueba autenticación
   - ✅ Verifica integraciones
   - 📈 Monitorea métricas

4. **Seguridad:**
   - 🔐 Nunca commitear tokens/secrets
   - 🔐 Usar secrets de GitHub para CI/CD
   - 🔐 Rotar tokens regularmente
   - 🔐 Variables sensibles solo en Vercel Dashboard

---

## 📞 Soporte

Si necesitas ayuda:

1. 📖 Consulta [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. 🔍 Revisa la sección de Troubleshooting
3. 📊 Verifica logs: `vercel logs --follow`
4. 💬 Contacta al equipo de desarrollo

---

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

## 🎯 Checklist de Deployment

### ✅ Primera vez
- [ ] Ejecutar `./scripts/verify-setup.sh`
- [ ] Ejecutar `./scripts/setup-vercel.sh`
- [ ] Configurar variables en Vercel Dashboard
- [ ] Hacer primer deployment de prueba
- [ ] Verificar que todo funciona
- [ ] Configurar CI/CD en GitHub (opcional)

### ✅ Cada deployment
- [ ] Build local exitoso
- [ ] Tests pasados
- [ ] Commit a Git
- [ ] Ejecutar `./scripts/deploy.sh`
- [ ] Verificar deployment
- [ ] Monitorear logs

---

## 🎉 ¡Listo!

Tu proyecto INMOVA está configurado para deployments automáticos.

**Siguiente paso:** Lee [QUICK_START.md](QUICK_START.md) y haz tu primer deployment.

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0.0  
**Mantenido por:** Equipo INMOVA
